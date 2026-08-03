/**
 * 01 / Build — agent middleware.
 *
 * Vertical tabs, one stage. The carousel exists to show breadth once: it
 * advances on a dwell timer that the tab's own bar draws, so the progress
 * indicator and the schedule are the same number, and after one pass it stops
 * for good and the section is the reader's to steer.
 *
 * Each panel is derived from its own clock through beat(), so jumping between
 * tabs leaves no state to unwind. Each was written against the real
 * implementation, and each leaves something out on purpose; the notes say what.
 */
import { createStage, beat, clamp01, ease, hi, INK, PRI, OK, WARN } from './figure.js'

const DWELL = 7000
// where a panel looks best when it is not allowed to move: after everything
// has arrived, before anything expires
const STILL = 4600

const tabsEl = document.getElementById('mwTabs')
const tabs = tabsEl ? [].slice.call(tabsEl.querySelectorAll('.mw-tab')) : []
const bars = tabs.map((tab) => tab.querySelector('.mw-bar i'))

const stage = createStage({
  stage: 'mwStage',
  canvas: 'mwCv',
  probe: 'mwProbe',
  mode: 'manual',
  still: STILL,
  draw: frame,
})

let active = 0
let since = 0
let paused = false
// the carousel shows breadth once and then stops for good; after that the
// section is the reader's to steer
let done = false
let panels = []
let resolve = []
// null until the first read: whether the tabs currently have a panel to drive
let staticTabs = null

if (stage && tabs.length) {
  var g = stage.g
  var place = stage.place
  var rr = stage.rr
  var line = stage.line
  var arrow = stage.arrow
  var boxAgent = stage.boxAgent
  var boxTemp = stage.boxTemp
  var lit = (el, on, warn) =>
    el && el.classList.toggle(warn ? 'mw-lit-warn' : 'mw-lit', !!on)

  panels = [].slice.call(stage.el.querySelectorAll('.mw-panel'))
  // one cached resolver per panel: the same `data-n` means a different node in
  // each, and looking them up per frame cost a thousand queries a second
  resolve = panels.map((panel) => stage.scope(panel))
  since = performance.now()

  const section = tabsEl.closest('.midw')
  tabs.forEach((tab, idx) =>
    tab.addEventListener('click', () => {
      if (staticTabs) return
      done = true
      select(idx)
    })
  )
  if (section) {
    section.addEventListener('mouseenter', () => {
      paused = true
    })
    section.addEventListener('mouseleave', () => {
      paused = false
      since = performance.now()
    })
  }
  select(0)
  syncTabs()
  // the tab column is the thing that always has a box, so it is the thing that
  // reports a layout change — the stage itself cannot, being the element that
  // goes away
  if (window.ResizeObserver) new ResizeObserver(syncTabs).observe(tabsEl)
  else window.addEventListener('resize', syncTabs)
}

/**
 * Narrow widths drop the stage, and a tab whose panel is gone is a control
 * that does nothing: it highlights itself and shows no result. So the same
 * four buttons stand down to what they already say — a list of capabilities
 * and one line on each — and give up the tablist semantics with it.
 *
 * The breakpoint stays in the stylesheet: this reads the decision CSS made
 * rather than repeating the width, and re-reads it when the window changes,
 * so widening past the breakpoint hands the carousel back.
 */
function syncTabs() {
  const off = getComputedStyle(stage.el).display === 'none'
  if (off === staticTabs) return
  staticTabs = off
  tabsEl.classList.toggle('mw-tabs--static', off)
  if (off) tabsEl.removeAttribute('role')
  else tabsEl.setAttribute('role', 'tablist')
  for (let k = 0; k < tabs.length; k++) {
    if (off) {
      tabs[k].removeAttribute('role')
      tabs[k].removeAttribute('aria-selected')
    } else {
      tabs[k].setAttribute('role', 'tab')
      tabs[k].setAttribute('aria-selected', String(k === active))
    }
  }
}

function select(i, now) {
  active = i
  since = now || performance.now()
  for (let k = 0; k < tabs.length; k++) {
    tabs[k].classList.toggle('on', k === i)
    if (!staticTabs) tabs[k].setAttribute('aria-selected', String(k === i))
    panels[k].classList.toggle('on', k === i)
  }
}

/** the dwell bar and the schedule are the same number, so one writer */
function drawBar(p) {
  for (let k = 0; k < bars.length; k++) {
    const want = k === active ? p.toFixed(4) : '0'
    if (bars[k] && bars[k].dataset.at !== want) {
      bars[k].style.transform = 'scaleX(' + want + ')'
      bars[k].dataset.at = want
    }
  }
}

/** manual mode: the carousel owns the clock, and the tab's own bar draws it */
function frame(now, s) {
  if (!tabs.length || !panels.length) return

  // the runtime owns "is this on screen"; until it says yes the dwell has not
  // begun
  const running = s.seen && !done
  if (!s.seen) since = now

  const held = now - since
  const p = s.reduced ? 1 : Math.min(1, held / DWELL)

  // the bar means "a pass is under way"; once it is over there is nothing left
  // to count down
  tabsEl.classList.toggle('idle', done || s.reduced)
  drawBar(p)

  s.clear()
  const d = DRAW[active]
  if (d) d(s.reduced ? STILL : held, resolve[active])

  if (!s.reduced && running && !paused && held >= DWELL) {
    if (active === tabs.length - 1) done = true
    else select(active + 1, now)
  }
}

/* One entry per tab; `t` is ms since the panel became active. */
const DRAW = []

    /* A browser has to look like a browser, or "it opens a real browser" is a
       claim rather than a picture. The outer silhouette stays the temporary one
       — it is a sandbox underneath, and it goes away — but inside it gets the
       chrome and a page to work on. */
    function chrome(x, y, w, h, p, spent) {
      if (p <= 0) return
      var a = clamp01(p)
      var u = clamp01(spent || 0)
      g.strokeStyle = 'rgba(' + INK + ',' + (0.42 * a * (1 - 0.6 * u)).toFixed(3) + ')'
      g.lineWidth = 2
      rr(x, y, w, h, 10)
      g.stroke()
      g.save()
      rr(x, y, w, h, 10)
      g.clip()
      g.fillStyle = 'rgba(' + INK + ',' + (0.05 * a).toFixed(3) + ')'
      g.fillRect(x, y, w, 28)
      g.restore()
      g.strokeStyle = 'rgba(' + INK + ',' + (0.1 * a).toFixed(3) + ')'
      g.lineWidth = 1
      g.beginPath()
      g.moveTo(x, y + 28)
      g.lineTo(x + w, y + 28)
      g.stroke()
      for (var i = 0; i < 3; i++) {
        g.fillStyle = 'rgba(' + INK + ',' + (0.16 * a).toFixed(3) + ')'
        g.beginPath()
        g.arc(x + 16 + i * 12, y + 14, 3.2, 0, Math.PI * 2)
        g.fill()
      }
      g.fillStyle = 'rgba(' + INK + ',' + (0.05 * a).toFixed(3) + ')'
      rr(x + 60, y + 6, w - 76, 16, 8)
      g.fill()
    }

    // the page itself: never a fake screenshot, just enough structure to act on
    function skeleton(x, y, w, p, hot) {
      var bar = function (bx, by, bw, bh, k, colour) {
        var v = clamp01((p - k) / 0.22)
        if (v <= 0) return
        g.fillStyle = colour || 'rgba(' + INK + ',' + (0.1 * v).toFixed(3) + ')'
        rr(bx, by, bw * v, bh, bh > 14 ? 5 : 3)
        g.fill()
      }
      bar(x, y, w * 0.46, 13, 0)
      bar(x, y + 30, w * 0.92, 7, 0.14)
      bar(x, y + 44, w * 0.84, 7, 0.24)
      bar(x, y + 58, w * 0.6, 7, 0.34)

      var f = clamp01((p - 0.5) / 0.25)
      if (f > 0) {
        g.strokeStyle = 'rgba(' + INK + ',' + (0.16 * f).toFixed(3) + ')'
        g.lineWidth = 1.4
        rr(x, y + 84, w * 0.66, 26)
        g.stroke()
      }
      var b = clamp01((p - 0.68) / 0.25)
      if (b > 0) {
        var live = hot ? WARN : PRI
        g.fillStyle = 'rgba(' + live + ',' + ((hot ? 0.9 : 0.75) * b).toFixed(3) + ')'
        rr(x, y + 124, 104, 28, 6)
        g.fill()
      }
    }

    // two hands on the same page, told apart only by colour
    function cursor(x, y, colour, a) {
      if (a <= 0) return
      g.fillStyle = 'rgba(' + colour + ',' + clamp01(a).toFixed(2) + ')'
      g.beginPath()
      g.moveTo(x, y)
      g.lineTo(x, y + 15)
      g.lineTo(x + 4.2, y + 11.2)
      g.lineTo(x + 7.4, y + 17.4)
      g.lineTo(x + 10, y + 16)
      g.lineTo(x + 6.8, y + 9.8)
      g.lineTo(x + 11.6, y + 9)
      g.closePath()
      g.fill()
    }

    // and a folder looks like a folder
    function folderGlyph(x, y, w, h, colour, a) {
      if (a <= 0) return
      g.strokeStyle = 'rgba(' + colour + ',' + (0.55 * a).toFixed(2) + ')'
      g.lineWidth = 1.4
      g.beginPath()
      g.moveTo(x, y + h - 2)
      g.arcTo(x, y + h, x + 2, y + h, 2)
      g.lineTo(x + w - 2, y + h)
      g.arcTo(x + w, y + h, x + w, y + h - 2, 2)
      g.lineTo(x + w, y + 4)
      g.arcTo(x + w, y + 2, x + w - 2, y + 2, 2)
      g.lineTo(x + w * 0.46, y + 2)
      g.lineTo(x + w * 0.36, y)
      g.lineTo(x + 2, y)
      g.arcTo(x, y, x, y + 2, 2)
      g.closePath()
      g.stroke()
    }

    // a file looks like a file: a sheet with the corner turned
    function fileGlyph(x, y, w, h, colour, a, fill) {
      if (a <= 0) return
      var c = Math.min(w, h) * 0.34
      g.beginPath()
      g.moveTo(x + 2, y)
      g.lineTo(x + w - c, y)
      g.lineTo(x + w, y + c)
      g.lineTo(x + w, y + h - 2)
      g.arcTo(x + w, y + h, x + w - 2, y + h, 2)
      g.lineTo(x + 2, y + h)
      g.arcTo(x, y + h, x, y + h - 2, 2)
      g.lineTo(x, y + 2)
      g.arcTo(x, y, x + 2, y, 2)
      g.closePath()
      if (fill) {
        g.fillStyle = 'rgba(' + colour + ',' + (0.9 * a).toFixed(2) + ')'
        g.fill()
      } else {
        g.strokeStyle = 'rgba(' + colour + ',' + (0.55 * a).toFixed(2) + ')'
        g.lineWidth = 1.4
        g.stroke()
      }
    }

    // a wire with a socket at each end, rather than a line that just stops
    function wire(x0, y0, x1, y1, p, colour) {
      if (p <= 0) return
      var a = clamp01(p)
      line(x0, y0, x0 + (x1 - x0) * a, y0 + (y1 - y0) * a,
        'rgba(' + colour + ',' + (0.4 * a).toFixed(2) + ')', 1.5)
      g.fillStyle = 'rgba(' + colour + ',' + (0.75 * a).toFixed(2) + ')'
      g.beginPath()
      g.arc(x0, y0, 3, 0, Math.PI * 2)
      g.fill()
      var far = clamp01((a - 0.8) / 0.2)
      if (far > 0) {
        g.fillStyle = 'rgba(' + colour + ',' + (0.75 * far).toFixed(2) + ')'
        g.beginPath()
        g.arc(x1, y1, 3 * far, 0, Math.PI * 2)
        g.fill()
      }
    }

    // a table: header band, column rules, banded rows
    function boxTable(x, y, w, h, p, head, cols, rows, rowH) {
      if (p <= 0) return
      var a = clamp01(p)
      g.strokeStyle = 'rgba(' + INK + ',' + (0.4 * a).toFixed(2) + ')'
      g.lineWidth = 2
      rr(x, y, w, h, 12)
      g.stroke()
      g.save()
      rr(x, y, w, h, 12)
      g.clip()
      g.fillStyle = 'rgba(' + INK + ',' + (0.07 * a).toFixed(3) + ')'
      g.fillRect(x, y, w, head)
      for (var r = 0; r < rows; r++) {
        if (r % 2 === 1) {
          g.fillStyle = 'rgba(' + INK + ',' + (0.025 * a).toFixed(3) + ')'
          g.fillRect(x, y + head + r * rowH, w, rowH)
        }
      }
      for (var c = 0; c < cols.length; c++) {
        g.strokeStyle = 'rgba(' + INK + ',' + (0.09 * a).toFixed(3) + ')'
        g.lineWidth = 1
        g.beginPath()
        g.moveTo(x + cols[c], y)
        g.lineTo(x + cols[c], y + h)
        g.stroke()
      }
      g.restore()
      g.strokeStyle = 'rgba(' + INK + ',' + (0.16 * a).toFixed(3) + ')'
      g.lineWidth = 1
      g.beginPath()
      g.moveTo(x, y + head)
      g.lineTo(x + w, y + head)
      g.stroke()
    }

    // the membrane: a plate, not a dotted line. Light sweeps it as writes cross.
    function membrane(x, y, w, h, sweep) {
      g.save()
      rr(x, y, w, h, h / 2)
      g.clip()
      g.fillStyle = 'rgba(' + INK + ',0.045)'
      g.fillRect(x, y, w, h)
      for (var i = -h; i < w + h; i += 9) {
        line(x + i, y, x + i + h, y + h, 'rgba(' + INK + ',0.05)', 1)
      }
      if (sweep > 0 && sweep < 1) {
        var cx = x + w * sweep
        var gr = g.createLinearGradient(cx - 90, 0, cx + 90, 0)
        gr.addColorStop(0, 'rgba(' + PRI + ',0)')
        gr.addColorStop(0.5, 'rgba(' + PRI + ',0.3)')
        gr.addColorStop(1, 'rgba(' + PRI + ',0)')
        g.fillStyle = gr
        g.fillRect(x, y, w, h)
      }
      g.restore()
      g.strokeStyle = 'rgba(' + INK + ',0.18)'
      g.lineWidth = 1
      rr(x, y, w, h, h / 2)
      g.stroke()
    }

    // a shared drive, drawn like the panel it is in the product
    function boxDrive(x, y, w, h, p, head) {
      if (p <= 0) return
      var a = clamp01(p)
      g.strokeStyle = 'rgba(' + INK + ',' + (0.4 * a).toFixed(2) + ')'
      g.lineWidth = 2
      rr(x, y, w, h, 12)
      g.stroke()
      g.save()
      rr(x, y, w, h, 12)
      g.clip()
      g.fillStyle = 'rgba(' + INK + ',' + (0.045 * a).toFixed(3) + ')'
      g.fillRect(x, y, w, head)
      g.restore()
      if (head > 0) {
        g.strokeStyle = 'rgba(' + INK + ',' + (0.1 * a).toFixed(3) + ')'
        g.lineWidth = 1
        g.beginPath()
        g.moveTo(x, y + head)
        g.lineTo(x + w, y + head)
        g.stroke()
      }
      if (head > 0) {
        for (var i = 1; i < 3; i++) {
          g.strokeStyle = 'rgba(' + INK + ',' + (0.05 * a).toFixed(3) + ')'
          g.beginPath()
          g.moveTo(x + 14, y + head + i * 38)
          g.lineTo(x + w - 14, y + head + i * 38)
          g.stroke()
        }
      }
    }


    // ---------------------------------------------------------------- sandbox
    // Left: the agent asks. Right: a pod that is emphatically not the agent's
    // own container. It ends by expiring, because nothing here reaps it for you.
    DRAW[0] = function (t, n) {
      // Left is a transcript: someone asks for something, and the agent answers
      // by building a place to do it. Right is that place, named by its image
      // and doing one recognisable thing. The pairing is the whole point, so
      // each call lights just before its sandbox arrives.
      var A = { x: 26, y: 60, w: 196, h: 206 }
      var X = 252
      var W = 344
      var H = 82
      var PAD = 16
      var CARDS = [
        { y: 56, said: 900, call: 1400, draw: 1800, dim: 5300 },
        { y: 166, said: 2300, call: 2800, draw: 3200 },
        { y: 276, said: 3700, call: 4200, draw: 4600 },
      ]

      boxAgent(A.x, A.y, A.w, A.h, beat(t, 100, 700))
      place(n('zl'), A.x + 13, A.y + 8, beat(t, 300, 800))
      // wraps inside the agent's own column; it must never reach the sandboxes
      place(n('slim'), A.x + 2, A.y + 218, beat(t, 5000, 5700), A.w - 4)

      for (var i = 0; i < 3; i++) {
        var c = CARDS[i]
        var drew = beat(t, c.draw, c.draw + 550)
        // finished sandboxes do not vanish; they stop being anybody's
        var done = c.dim ? beat(t, c.dim, c.dim + 800) : 0
        var alive = 1 - 0.55 * done
        var rowY = A.y + 44 + i * 56

        place(n('m' + (i + 1)), A.x + 14, rowY, beat(t, c.said, c.said + 450))
        place(n('t' + (i + 1)), A.x + 14, rowY + 22, beat(t, c.call, c.call + 450))

        var fly = beat(t, c.call + 200, c.call + 900)
        if (fly > 0 && fly < 1) {
          for (var k = 0; k <= 4; k++) {
            var b = clamp01(fly - k * 0.075)
            if (b <= 0) continue
            var sy = rowY + 27
            g.fillStyle = 'rgba(' + PRI + ',' + (0.38 / (k + 1)).toFixed(3) + ')'
            rr(226 + (X + 14 - 226) * b - 5, sy + (c.y + H / 2 - sy) * b - 4, 10, 8, 3)
            g.fill()
          }
        }

        boxTemp(X, c.y, W, H, drew * alive, done)
        place(n('s' + (i + 1)), X + PAD, c.y + 15, clamp01((drew - 0.4) / 0.6) * alive)
        // one width for all three, and clear of the foot
        place(n('c' + (i + 1)), X + PAD, c.y + 42,
          beat(t, c.draw + 400, c.draw + 900) * (1 - done), W - PAD * 2)
        if (i === 0) place(n('r1'), X + PAD, c.y + 48, done)
      }
    }

    // ---------------------------------------------------------------- browser
    // The agent has no click() tool: it shells out to a CLI over CDP. The beat
    // that matters is a person taking the keyboard mid-run.
    DRAW[1] = function (t, n) {
      // First that a real browser is simply there for the asking, driven with
      // real clicks. Then that when it reaches something no agent should decide
      // alone, a person takes the same session over without stopping it.
      var A = { x: 26, y: 74, w: 232, h: 168 }
      var B = { x: 284, y: 60, w: 312, h: 276 }
      var open = beat(t, 1200, 2100)
      var page = beat(t, 2100, 3600)
      var stuck = beat(t, 4300, 4900)
      var hand = beat(t, 5100, 5900)
      var back = beat(t, 6300, 6900)

      boxAgent(A.x, A.y, A.w, A.h, beat(t, 100, 700))
      place(n('zl'), A.x + 14, A.y + 8, beat(t, 300, 800))
      place(n('m1'), A.x + 14, A.y + 44, beat(t, 700, 1100), A.w - 28)
      place(n('t1'), A.x + 14, A.y + 80, beat(t, 1000, 1400))

      // no click() tool exists: the agent shells out over CDP, so that is what shows
      // three commands through one slot, cross-fading rather than cutting
      var c1 = beat(t, 1900, 2300) * (1 - beat(t, 2800, 3100))
      var c2 = beat(t, 3000, 3300) * (1 - beat(t, 4000, 4300))
      var c3 = beat(t, 4200, 4500)
      place(n('k1'), A.x + 14, A.y + 118, c1, A.w - 28)
      place(n('k2'), A.x + 14, A.y + 118, c2, A.w - 28)
      place(n('k3'), A.x + 14, A.y + 118, c3, A.w - 28)
      place(n('stuck'), A.x + 2, A.y + 184, stuck * (1 - hand), A.w - 4)
      place(n('take'), A.x + 2, A.y + 184, hand, A.w - 4)

      chrome(B.x, B.y, B.w, B.h, open, back)
      place(n('url'), B.x + 68, B.y + 8, clamp01((open - 0.5) / 0.5) * (1 - back * 0.7))
      skeleton(B.x + 26, B.y + 62, B.w - 52, page * (1 - back * 0.5), stuck > 0.4 && back < 0.5)

      var ax, ay
      if (t < 3400) {
        var m1 = beat(t, 2600, 3400)
        ax = B.x + 268 - 118 * m1
        ay = B.y + 214 - 46 * m1
      } else {
        var m2 = beat(t, 3400, 4300)
        ax = B.x + 150
        ay = B.y + 168 + 60 * m2
      }
      if (back > 0.2) {
        ax = B.x + 150 + 84 * back
        ay = B.y + 228 - 38 * back
      }
      cursor(ax, ay, PRI, clamp01((page - 0.2) / 0.3) * (1 - hand * 0.85 * (1 - back)))

      if (hand > 0) {
        var h = ease(hand)
        cursor(B.x + 286 - 136 * h, B.y + 252 - 24 * h, WARN, hand * (1 - back * 0.8))
      }
    }

    // ---------------------------------------------------------------- a2a
    // A never opens a connection to B: it calls a tool on the control plane,
    // which resolves the slug, checks visibility, mints a token scoped to B and
    // makes the call itself. B answers as B, with B's own everything.
    DRAW[2] = function (t, n) {
      // The product's own teamwork timeline: lanes down the left, a rail each, a
      // dashed drop wherever work is handed over. Bars rather than dots, because
      // a bar that grows says "busy from here to here", and six of them growing
      // over the same stretch says fanned out without a caption.
      //
      // Each answer returns on its own — there is no join in the code, so there
      // is none in the picture.
      var GX = 152
      var GW = 444
      var COLS = 13
      var LH = 30
      var LY0 = 96
      var LY = function (i) {
        return LY0 + i * LH
      }
      var col = function (c) {
        return GX + ((c + 0.5) / COLS) * GW
      }
      var T0 = 1200
      var STEP = 330
      var T = function (c) {
        return T0 + c * STEP
      }
      var at = function (c) {
        return beat(t, T(c), T(c) + 300)
      }

      place(n('ask'), 26, 44, beat(t, 150, 800))

      var grid = beat(t, 900, 1700)
      for (var q = 0; q < COLS; q++) {
        line(col(q), LY(0) - 20, col(q), LY(7) + 20,
          'rgba(' + INK + ',' + (0.035 * grid).toFixed(3) + ')', 1)
      }

      var RUN = [
        { l: 1, a: 1, b: 4 },
        { l: 2, a: 1, b: 5 },
        { l: 3, a: 2, b: 5 },
        { l: 4, a: 6, b: 8 },
        { l: 5, a: 6, b: 9 },
        { l: 6, a: 7, b: 9 },
        { l: 7, a: 10, b: 12 },
      ]

      place(n('l0'), 26, LY(0) - 8, beat(t, 800, 1250), 116)
      g.strokeStyle = 'rgba(' + INK + ',0.1)'
      g.lineWidth = 1
      g.beginPath()
      g.moveTo(GX, LY(0))
      g.lineTo(GX + GW * beat(t, 800, 1250), LY(0))
      g.stroke()

      var c0 = clamp01((t - T(0)) / (T(1) - T(0)))
      if (c0 > 0) {
        g.fillStyle = 'rgba(' + INK + ',0.5)'
        rr(col(0) - 6, LY(0) - 5, 12 + (col(1) - col(0)) * c0, 10, 5)
        g.fill()
      }

      for (var r = 0; r < RUN.length; r++) {
        var run = RUN[r]
        var lv = beat(t, T(run.a) - 250, T(run.a) + 150)
        place(n('l' + run.l), 26, LY(run.l) - 8, lv, 116)
        g.strokeStyle = 'rgba(' + INK + ',' + (0.1 * lv).toFixed(3) + ')'
        g.lineWidth = 1
        g.beginPath()
        g.moveTo(GX, LY(run.l))
        g.lineTo(GX + GW * lv, LY(run.l))
        g.stroke()

        var x0 = col(run.a)
        var x1 = col(run.b)
        var p = clamp01((t - T(run.a)) / (T(run.b) - T(run.a)))
        if (p <= 0) continue
        var y = LY(run.l)

        var d = at(run.a)
        line(x0, LY(0), x0, LY(0) + (y - LY(0)) * d, 'rgba(' + INK + ',0.24)', 1, [3, 3])

        g.fillStyle = 'rgba(' + PRI + ',0.13)'
        rr(x0 - 6, y - 6, 12 + (x1 - x0) * p, 12, 6)
        g.fill()
        g.strokeStyle = 'rgba(' + PRI + ',' + (0.5 + 0.4 * p).toFixed(2) + ')'
        g.lineWidth = 1.5
        rr(x0 - 6, y - 6, 12 + (x1 - x0) * p, 12, 6)
        g.stroke()
        g.fillStyle = 'rgba(' + PRI + ',0.95)'
        g.beginPath()
        g.arc(x0, y, 3.4, 0, Math.PI * 2)
        g.fill()

        if (p >= 1) {
          var up = at(run.b)
          line(x1, y, x1, y + (LY(0) - y) * up, 'rgba(' + INK + ',0.24)', 1, [3, 3])
          g.fillStyle = 'rgba(' + PRI + ',0.95)'
          g.beginPath()
          g.arc(x1, y, 3.4, 0, Math.PI * 2)
          g.fill()
          if (up > 0.6) {
            g.strokeStyle = 'rgba(' + INK + ',0.45)'
            g.lineWidth = 1.6
            g.beginPath()
            g.arc(x1, LY(0), 4.6, 0, Math.PI * 2)
            g.stroke()
          }
        }
      }

      // what changed hands, shown at the moment it changes hands
      var DET = [
        { id: 'd1', c: 1 },
        { id: 'd2', c: 5 },
        { id: 'd3', c: 6 },
        { id: 'd4', c: 9 },
      ]
      for (var i2 = 0; i2 < DET.length; i2++) {
        var cur = DET[i2]
        var nxt = DET[i2 + 1]
        var on = beat(t, T(cur.c), T(cur.c) + 350)
        var off = nxt ? beat(t, T(nxt.c) - 120, T(nxt.c) + 120) : 0
        place(n(cur.id), GX, 344, on * (1 - off), GW)
      }
    }

    // ---------------------------------------------------------------- afs
    // Two workspaces of the same owner. The files never travel: the mount does.
    DRAW[3] = function (t, n) {
      // The drive is there from the first frame: it is the place, not an event.
      // A grant is decided when the edge is made, so the tag arrives with the
      // wire rather than after it. The prompts are the story, so those come one
      // at a time.
      var WS = [
        { y: 44, from: 100 },
        { y: 142, from: 1400 },
        { y: 240, from: 2100 },
      ]
      var BX = 26
      var BW = 168
      var BH = 76
      var D = { x: 346, y: 44, w: 250, h: 272, head: 30 }
      var ROW = [96, 134, 172]

      boxDrive(D.x, D.y, D.w, D.h, 1, D.head)
      place(n('path'), D.x + 14, D.y + 9, 1)
      folderGlyph(D.x + 18, ROW[0] - 7, 14, 12, INK, 0.8)
      place(n('d0'), D.x + 40, ROW[0] - 8, 1)

      for (var i2 = 0; i2 < 3; i2++) {
        var w = WS[i2]
        var v = beat(t, w.from, w.from + 600)
        var cy = w.y + BH / 2
        boxAgent(BX, w.y, BW, BH, v)
        place(n('r' + i2), BX + 14, w.y + 8, beat(t, w.from + 150, w.from + 700))
        place(n('p' + i2), BX + 14, w.y + 42, beat(t, w.from + 400, w.from + 950), BW - 28)

        // the grant is part of making the edge, not a later announcement
        var link = beat(t, w.from + 300, w.from + 1000)
        wire(BX + BW, cy, D.x, cy, link, PRI)
        place(n('c' + i2), BX + BW, cy - 14, link, D.x - BX - BW)
        var head = clamp01((link - 0.85) / 0.15)
        if (head > 0) {
          if (i2 < 2) arrow(D.x - 24, cy, D.x - 7, cy, PRI, 0.8 * head)
          else arrow(BX + BW + 24, cy, BX + BW + 7, cy, INK, 0.55 * head)
        }
      }

      var WRITE = [
        { ws: 0, row: 1, indent: 22, at: 3200, node: 'd1', size: 'q1' },
        { ws: 1, row: 2, indent: 0, at: 4200, node: 'd2', size: 'q2' },
      ]
      for (var k = 0; k < WRITE.length; k++) {
        var wr = WRITE[k]
        var fly = beat(t, wr.at, wr.at + 800)
        var sy = WS[wr.ws].y + BH / 2
        var tx = D.x + 18 + wr.indent
        var ty = ROW[wr.row] - 8
        var gone = clamp01((fly - 0.76) / 0.24)
        if (fly > 0 && gone < 1) {
          fileGlyph(BX + BW + 6 + (tx - BX - BW - 6) * fly, sy - 9 + (ty - sy + 9) * fly,
            13, 17, PRI, 1 - gone, true)
        }
        var seat = beat(t, wr.at + 620, wr.at + 1000)
        fileGlyph(tx, ty + 3 * (1 - seat), 12, 15, INK, 0.8 * seat, false)
        place(n(wr.node), tx + 21, ty + 3 * (1 - seat), seat)
        place(n(wr.size), D.x + D.w - 78, ty + 1, seat, 62)
      }

      var read = beat(t, 5400, 6200)
      if (read > 0 && read < 1) {
        var ry = WS[2].y + BH / 2
        fileGlyph(D.x + 40 - (D.x + 40 - BX - BW - 6) * read,
          ROW[1] - 8 + (ry - 9 - ROW[1] + 8) * read, 13, 17, PRI,
          Math.min(1, 3 * (1 - read)), true)
      }
    }

    // ---------------------------------------------------------------- memory
    // Files on a mount. The agent writes on purpose; the only thing that moves
    // by itself is the index, injected at session start.
    DRAW[4] = function (t, n) {
      // Everything is present from the first frame, because none of it is an
      // event: two stores are attached to this workspace with different rights,
      // one of them is attached elsewhere too, and underneath it is a table.
      //
      // The only thing that happens is a write. The agent edits a file on the
      // mount, it crosses the membrane, and a row's timestamp changes. That is
      // the whole trick: a filesystem to the agent, rows in Postgres in fact.
      var W = { x: 26, y: 32, w: 168, h: 84 }
      var W2 = { x: 26, y: 128, w: 168, h: 46 }
      var SX = 350
      var SW = 246
      var SA = { y: 30, h: 56 }
      var SB = { y: 98, h: 56 }
      var M = { x: 26, y: 190, w: 570, h: 26 }
      var T = { x: 26, y: 234, w: 570, h: 158, head: 34 }
      var COL = [128, 372]

      boxAgent(W.x, W.y, W.w, W.h, 1)
      place(n('wr'), W.x + 13, W.y + 8, 1)
      place(n('wp'), W.x + 12, W.y + 30, 1, W.w - 24, W.h - 38)

      var STORE = [
        { s: SA, name: 'n1', path: 'u1', chip: 'k1', y0: 62 },
        { s: SB, name: 'n2', path: 'u2', chip: 'k2', y0: 96 },
      ]
      for (var i2 = 0; i2 < 2; i2++) {
        var st = STORE[i2]
        boxDrive(SX, st.s.y, SW, st.s.h, 1, 0)
        place(n(st.name), SX + 16, st.s.y + 11, 1)
        place(n(st.path), SX + 16, st.s.y + 32, 1)

        // each wire leaves the workspace at its own height, so they never bunch
        var cy = st.s.y + st.s.h / 2
        wire(W.x + W.w, st.y0, SX, cy, 1, PRI)
        place(n(st.chip), W.x + W.w, (st.y0 + cy) / 2 - 14, 1, SX - W.x - W.w)
      }

      g.strokeStyle = 'rgba(' + INK + ',0.28)'
      g.lineWidth = 1.6
      g.setLineDash([5, 5])
      rr(W2.x, W2.y, W2.w, W2.h, 10)
      g.stroke()
      g.setLineDash([])
      place(n('w2'), W2.x + 12, W2.y, 1, W2.w - 24, W2.h)
      line(W2.x + W2.w, W2.y + W2.h / 2, SX, SB.y + SB.h / 2, 'rgba(' + INK + ',0.24)', 1.5, [4, 4])

      // No object floats between the parts. The write is told by lighting each
      // thing it passes through, in order: the workspace, the edge, the store,
      // the membrane, and finally the row that changes.
      var hW = hi(t, 1300, 2200)
      var hE = hi(t, 1900, 2800)
      var hS = hi(t, 2500, 3400)
      var cross = beat(t, 3100, 4000)
      var land = beat(t, 3900, 4500)

      if (hW > 0.01) {
        g.strokeStyle = 'rgba(' + PRI + ',' + (0.85 * hW).toFixed(2) + ')'
        g.lineWidth = 2
        rr(W.x, W.y, W.w, W.h, 12)
        g.stroke()
      }
      if (hE > 0.01) {
        line(W.x + W.w, STORE[0].y0, SX, SA.y + SA.h / 2,
          'rgba(' + PRI + ',' + (0.9 * hE).toFixed(2) + ')', 2.6)
      }
      if (hS > 0.01) {
        g.strokeStyle = 'rgba(' + PRI + ',' + (0.9 * hS).toFixed(2) + ')'
        g.lineWidth = 2
        rr(SX, SA.y, SW, SA.h, 12)
        g.stroke()
      }

      membrane(M.x, M.y, M.w, M.h, cross > 0 && cross < 1 ? 0.18 + 0.64 * cross : -1)
      place(n('fu'), 280, M.y, 1, 62, M.h)

      boxTable(T.x, T.y, T.w, T.h, 1, T.head, COL, 3, 36)
      // cells take the band they belong to and centre inside it, rather than
      // being nudged to an offset that only looks right for one font size
      place(n('c1'), T.x + 22, T.y, 1, 96, T.head)
      place(n('c2'), T.x + COL[0] + 18, T.y, 1, 120, T.head)
      place(n('c3'), T.x + T.w - 96, T.y, 1, 74, T.head)

      var rowHi = beat(t, 3900, 4200) * (1 - beat(t, 5600, 6200))
      if (rowHi > 0.01) {
        g.fillStyle = 'rgba(' + PRI + ',' + (0.1 * rowHi).toFixed(3) + ')'
        rr(T.x + 3, T.y + T.head + 36 + 2, T.w - 6, 32, 5)
        g.fill()
      }

      for (var r = 0; r < 3; r++) {
        var ry = T.y + T.head + r * 36
        place(n('g' + (r + 1)), T.x + 22, ry, 1, 96, 36)
        place(n('h' + (r + 1)), T.x + COL[0] + 18, ry, 1, 200, 36)
        place(n('t' + (r + 1)), T.x + T.w - 96, ry, r === 1 ? 1 - land : 1, 74, 36)
      }
      place(n('t2b'), T.x + T.w - 96, T.y + T.head + 36, land, 74, 36)

    }

    // ---------------------------------------------------------------- oauth
    // A network-and-omission boundary, not a vault. The token is read, attached
    // and forgotten, all on the right of the line.
    DRAW[5] = function (t, n) {
      // One sentence, laid out left to right: the agent calls the platform, the
      // platform adds the credential, the upstream server sees a signed request.
      // Nothing else is claimed, and nothing is drawn at a guessed offset —
      // highlights are rings on the nodes themselves.
      var Y = 128
      var H = 136
      var A = { x: 26, y: Y, w: 182, h: H }
      var P = { x: 236, y: Y, w: 182, h: H }
      var U = { x: 446, y: Y, w: 150, h: H }
      var MID = Y + H / 2

      boxAgent(A.x, A.y, A.w, A.h, 1)
      place(n('ra'), A.x + 14, A.y + 8, 1)
      place(n('cfg'), A.x + 14, A.y + 48, 1, A.w - 28)
      // no width: the tint block hugs the text, so its padding reads even
      place(n('none'), A.x + 14, A.y + 88, 1)

      boxAgent(P.x, P.y, P.w, P.h, 1)
      place(n('rp'), P.x + 14, P.y + 8, 1)
      place(n('act'), P.x + 14, P.y + 44, 1, P.w - 28, 22)
      place(n('tok'), P.x + 14, P.y + 82, beat(t, 2400, 3000), P.w - 28)

      boxAgent(U.x, U.y, U.w, U.h, 1)
      place(n('ru'), U.x + 14, U.y + 8, 1)
      place(n('usig'), U.x + 14, U.y + 56, beat(t, 4400, 5000))

      // the call, then the same call carrying something it did not start with
      var out = hi(t, 1200, 2600)
      var on = hi(t, 3200, 4800)
      line(A.x + A.w, MID, P.x, MID, 'rgba(' + INK + ',0.16)', 1.4)
      line(P.x + P.w, MID, U.x, MID, 'rgba(' + INK + ',0.16)', 1.4)
      if (out > 0.01) {
        arrow(A.x + A.w, MID, A.x + A.w + (P.x - A.x - A.w) * out, MID, PRI, 0.9 * out)
      }
      if (on > 0.01) {
        arrow(P.x + P.w, MID, P.x + P.w + (U.x - P.x - P.w) * on, MID, PRI, 0.9 * on)
      }

      lit(n('cfg'), t > 1200 && t < 2600)
      lit(n('tok'), t > 2600 && t < 3600)
      lit(n('usig'), t > 4600 && t < 5600)
      lit(n('none'), t > 5800, true)
    }
