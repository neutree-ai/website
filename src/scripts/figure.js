/**
 * The drawing runtime the page's figures share.
 *
 * Every figure on this page is the same construction: text stays in the DOM so
 * it renders crisply and wraps by itself, geometry and motion go on a canvas,
 * and both read their positions out of one design-unit coordinate space. This
 * module is that space, plus the vocabulary the figures draw in.
 *
 * The unit is measured, never assumed: each stage carries `--u` in container
 * units, and a zero-height probe inside it reports what the stylesheet actually
 * resolved, so canvas coordinates and CSS sizes cannot drift apart.
 */

export const INK = '12, 40, 73'
export const PRI = '61, 97, 255'
export const OK = '50, 147, 45'
export const WARN = '255, 137, 4'

export function clamp01(x) {
  return x < 0 ? 0 : x > 1 ? 1 : x
}

export function ease(x) {
  return 1 - Math.pow(1 - x, 3)
}

/** 0 before `from`, 1 after `to`, eased between. Every beat of every figure's
 *  choreography is written in terms of this, so nothing holds state. */
export function beat(t, from, to) {
  return ease(clamp01((t - from) / (to - from)))
}

/** rise, hold, fall — one span of attention */
export function hi(t, a, b, ramp) {
  var r = ramp || 260
  return beat(t, a, a + r) * (1 - beat(t, b - r, b))
}

/** a straight path walked by arc length, clamped at both ends so a trail that
 *  overshoots is absorbed at the destination instead of vanishing */
export function seg(x0, y0, x1, y1) {
  return function (u) {
    var c = clamp01(u)
    return { x: x0 + (x1 - x0) * c, y: y0 + (y1 - y0) * c }
  }
}

export function polyline(points) {
  var legs = []
  var total = 0
  for (var i = 1; i < points.length; i++) {
    var dx = points[i].x - points[i - 1].x
    var dy = points[i].y - points[i - 1].y
    var len = Math.sqrt(dx * dx + dy * dy)
    legs.push({ from: points[i - 1], to: points[i], len: len })
    total += len
  }
  return function (u) {
    var d = clamp01(u) * total
    for (var k = 0; k < legs.length; k++) {
      if (d <= legs[k].len || k === legs.length - 1) {
        var f = legs[k].len ? d / legs[k].len : 1
        return {
          x: legs[k].from.x + (legs[k].to.x - legs[k].from.x) * f,
          y: legs[k].from.y + (legs[k].to.y - legs[k].from.y) * f,
        }
      }
      d -= legs[k].len
    }
    return points[points.length - 1]
  }
}

/**
 * A stage: one canvas, one DOM layer, one measured unit, one animation clock.
 *
 * `mode` decides what the clock does once the figure has been seen:
 *   'once'   play through and hold the finished state (the default)
 *   'loop'   run a cycle of `duration` for as long as the page is open
 *   'manual' the caller drives it (tabs, carousels) and reads `held`
 */
export function createStage(options) {
  var el = document.getElementById(options.stage)
  var cv = document.getElementById(options.canvas)
  if (!el || !cv || !cv.getContext) return null

  var layer = options.layer ? document.getElementById(options.layer) : null
  var probe = options.probe ? document.getElementById(options.probe) : null
  var g = cv.getContext('2d')
  var scale = 1

  // The design space is declared once, in CSS, because the layout needs it
  // there anyway: `--fig-w`/`--fig-h` drive the aspect ratio and the unit, and
  // the script reads them back rather than restating them.
  var css = getComputedStyle(el)
  var W = parseFloat(css.getPropertyValue('--fig-w')) || options.width
  var H = parseFloat(css.getPropertyValue('--fig-h')) || options.height

  var reduced =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  var api

  /** Nodes are found once and remembered. A figure with several panels reusing
   *  the same `data-n` asks for a scope per panel, so caching still works. */
  function scoped(root) {
    var cache = {}
    return function (name) {
      if (!(name in cache)) cache[name] = root.querySelector('[data-n="' + name + '"]')
      return cache[name]
    }
  }

  function resize() {
    var r = el.getBoundingClientRect()
    if (!r.width) return
    var pw = probe ? probe.getBoundingClientRect().width : 0
    scale = pw > 0 ? pw / 100 : r.width / W
    var dpr = Math.min(window.devicePixelRatio || 1, 2)
    cv.width = Math.round(r.width * dpr)
    cv.height = Math.round(r.height * dpr)
    g.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0)
    if (options.onResize) options.onResize(api)
  }

  api = {
    el: el,
    g: g,
    width: W,
    height: H,
    reduced: reduced,

    get scale() {
      return scale
    },

    /** the figure's own nodes, by `data-n`, looked up once */
    node: scoped(layer || el),

    /** the same, scoped to one panel of a multi-panel figure */
    scope: scoped,

    /** move a DOM node inside the canvas's coordinate system. Width and height
     *  are optional: pass them only when the box is meant to constrain its
     *  text, never to decorate a line that already fits. */
    place: function (node, x, y, o, w, h) {
      var target = typeof node === 'string' ? api.node(node) : node
      if (!target) return
      target.style.opacity = String(o === undefined ? 1 : o)
      if (w) target.style.width = (w * scale).toFixed(2) + 'px'
      if (h) target.style.height = (h * scale).toFixed(2) + 'px'
      target.style.transform =
        'translate(' + (x * scale).toFixed(2) + 'px,' + (y * scale).toFixed(2) + 'px)'
    },

    /** opacity alone, for nodes a flow container already positions */
    fade: function (node, o) {
      var target = typeof node === 'string' ? api.node(node) : node
      if (target) target.style.opacity = o.toFixed(3)
    },

    /** where a laid-out element actually sits, in design units — so wiring can
     *  meet a card the layout positioned rather than one the script guessed */
    measure: function (node) {
      var target = typeof node === 'string' ? api.node(node) : node
      if (!target || !scale) return null
      var b = target.getBoundingClientRect()
      var s = el.getBoundingClientRect()
      if (!b.height) return null
      return {
        x: (b.left - s.left) / scale,
        y: (b.top - s.top) / scale,
        w: b.width / scale,
        h: b.height / scale,
        cx: (b.left - s.left + b.width / 2) / scale,
        cy: (b.top - s.top + b.height / 2) / scale,
      }
    },

    clear: function () {
      g.clearRect(0, 0, W, H)
    },

    resize: resize,
  }

  /* ---- the drawing vocabulary, bound to this stage's context ------------ */

  api.rr = function (x, y, w, h, r) {
    g.beginPath()
    g.moveTo(x + r, y)
    g.arcTo(x + w, y, x + w, y + h, r)
    g.arcTo(x + w, y + h, x, y + h, r)
    g.arcTo(x, y + h, x, y, r)
    g.arcTo(x, y, x + w, y, r)
    g.closePath()
  }

  api.line = function (x0, y0, x1, y1, colour, width, dash) {
    g.strokeStyle = colour
    g.lineWidth = width || 1.6
    g.setLineDash(dash || [])
    g.beginPath()
    g.moveTo(x0, y0)
    g.lineTo(x1, y1)
    g.stroke()
    g.setLineDash([])
  }

  api.arrow = function (x0, y0, x1, y1, colour, alpha, head) {
    var a = Math.atan2(y1 - y0, x1 - x0)
    var k = head || 9
    api.line(x0, y0, x1, y1, 'rgba(' + colour + ',' + alpha + ')', 1.8)
    g.fillStyle = 'rgba(' + colour + ',' + alpha + ')'
    g.beginPath()
    g.moveTo(x1, y1)
    g.lineTo(x1 - k * Math.cos(a - 0.4), y1 - k * Math.sin(a - 0.4))
    g.lineTo(x1 - k * Math.cos(a + 0.4), y1 - k * Math.sin(a + 0.4))
    g.closePath()
    g.fill()
  }

  /** a tapered trail: reads on white where a glow would go muddy */
  api.trail = function (at, head, len, colour) {
    var SEGS = 16
    for (var i = 0; i < SEGS; i++) {
      var t1 = head - (len * i) / SEGS
      var t2 = head - (len * (i + 1)) / SEGS
      if (t2 < 0) break
      var a = at(t1)
      var b = at(t2)
      var k = 1 - i / SEGS
      g.strokeStyle = 'rgba(' + colour + ',' + (k * k).toFixed(3) + ')'
      g.lineWidth = 0.9 + 3 * k
      g.lineCap = 'round'
      g.beginPath()
      g.moveTo(a.x, a.y)
      g.lineTo(b.x, b.y)
      g.stroke()
    }
  }

  /** one pulse along a path, its tail absorbed at the far end */
  api.pulse = function (t, from, path, span, colour) {
    var head = clamp01((t - from) / (span || 620)) * 1.3
    if (head > 0 && head < 1.3) api.trail(path, head, 0.3, colour || PRI)
  }



  api.dot = function (x, y, r, colour, alpha) {
    g.fillStyle = 'rgba(' + colour + ',' + (alpha === undefined ? 1 : alpha) + ')'
    g.beginPath()
    g.arc(x, y, r, 0, Math.PI * 2)
    g.fill()
  }

  /* Two kinds of thing appear across these figures and should be tellable
     apart without reading a word: something that persists, and something that
     is going to be thrown away. */

  /** persists: square, solid, anchored by a filled rail, and running */
  api.boxAgent = function (x, y, w, h, p) {
    var a = clamp01(p === undefined ? 1 : p)
    if (a <= 0) return
    g.strokeStyle = 'rgba(' + INK + ',' + (0.62 * a).toFixed(2) + ')'
    g.lineWidth = 2
    api.rr(x, y, w, h, 14)
    g.stroke()
    g.save()
    api.rr(x, y, w, h, 14)
    g.clip()
    g.fillStyle = 'rgba(' + INK + ',' + (0.92 * a).toFixed(2) + ')'
    g.fillRect(x, y, w, 30)
    g.restore()
    api.dot(x + w - 17, y + 15, 3.6, OK, a)
  }

  /** thrown away: dashed, with a corner torn off. `spent` turns it from a live
   *  thing into a used one: same silhouette, no longer anybody's. */
  api.boxTemp = function (x, y, w, h, p, spent) {
    var a = clamp01(p)
    if (a <= 0) return
    var u = clamp01(spent || 0)
    var cut = 15
    g.save()
    g.strokeStyle = u
      ? 'rgba(' + INK + ',' + (0.7 * a * (1 - 0.55 * u)).toFixed(2) + ')'
      : 'rgba(' + PRI + ',' + (0.7 * a).toFixed(2) + ')'
    g.lineWidth = 2
    g.setLineDash([6, 5])
    g.beginPath()
    g.moveTo(x + 8, y)
    g.lineTo(x + w - cut, y)
    g.lineTo(x + w, y + cut)
    g.lineTo(x + w, y + h - 8)
    g.arcTo(x + w, y + h, x + w - 8, y + h, 8)
    g.lineTo(x + 8, y + h)
    g.arcTo(x, y + h, x, y + h - 8, 8)
    g.lineTo(x, y + 8)
    g.arcTo(x, y, x + 8, y, 8)
    g.stroke()
    g.restore()
    g.setLineDash([])
  }

  /** held by the platform: a record, drawn as a page rather than a machine */
  api.boxRecord = function (x, y, w, h) {
    g.fillStyle = 'rgba(' + INK + ',0.022)'
    api.rr(x, y, w, h, 12)
    g.fill()
    g.strokeStyle = 'rgba(' + INK + ',0.3)'
    g.lineWidth = 2
    api.rr(x, y, w, h, 12)
    g.stroke()
  }

  api.boxPlain = function (x, y, w, h, r) {
    g.strokeStyle = 'rgba(' + INK + ',0.22)'
    g.lineWidth = 1.6
    api.rr(x, y, w, h, r || 10)
    g.stroke()
  }

  api.toggle = function (node, cls, on) {
    var target = typeof node === 'string' ? api.node(node) : node
    if (target) target.classList.toggle(cls, !!on)
  }

  /* ---- the clock -------------------------------------------------------- */

  var mode = options.mode || 'once'
  var duration = options.duration || 0
  var started = false
  var t0 = 0

  /* On screen or not is asked of the browser rather than measured every frame:
     a rect test inside the loop forces a synchronous layout on exactly the
     frames the reader is scrolling. `rootMargin` keeps the answer honest for a
     figure taller than the viewport, which is what a threshold cannot do. */
  var visible = false
  if (window.IntersectionObserver) {
    new IntersectionObserver(
      function (entries) {
        visible = entries[entries.length - 1].isIntersecting
      },
      { rootMargin: '-10% 0px -10% 0px' }
    ).observe(el)
  } else {
    visible = true
  }

  function frame(now) {
    if (!cv.width) resize()

    // the clock starts when the figure is first seen, so a one-time pass is
    // never spent above the fold
    if (!started && !api.reduced) {
      if (!visible) {
        requestAnimationFrame(frame)
        return
      }
      started = true
      t0 = now
    }
    api.seen = started

    var t
    if (api.reduced) t = options.still === undefined ? duration : options.still
    else if (mode === 'loop') t = (now - t0) % duration
    else if (mode === 'manual') t = now
    else t = Math.min(now - t0, duration)

    // A finished one-pass figure holds a fixed image: draw it once more, then
    // let the loop go. Anything still moving pauses while it is off screen.
    var settled = mode === 'once' && (api.reduced || t >= duration)
    if (visible || settled || api.reduced) options.draw(t, api, now)
    if (settled) return

    requestAnimationFrame(frame)
  }

  resize()
  if (window.ResizeObserver) new ResizeObserver(resize).observe(el)
  else window.addEventListener('resize', resize)
  requestAnimationFrame(frame)

  return api
}
