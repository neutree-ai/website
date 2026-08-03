/**
 * The hero figure: the lift.
 *
 * Three acts, matching the page's own spine, and each act owns a region so
 * only that region ever moves:
 *
 *   BUILD       the centre beam: the setup rides up, the batteries attach
 *   DISTRIBUTE  the left wires: the ways in light and traffic arrives, and the
 *               platform's resource line grows under the load
 *   OPTIMIZE    inside the card: what the traffic left behind comes back down
 *               as a proposal and lands on the config it revises
 *
 * Every frame is derived from the loop clock alone, so jumping between acts
 * via the tabs needs no state to be unwound.
 */
import { createStage, clamp01, ease, INK, PRI } from './figure.js'

const PORT = { x: 163, y: 190 }
const WAY_X = 108
const WAYS = [{ y: 124 }, { y: 190 }, { y: 256 }]

const BEAM_X = 321
const BEAM_BOT = 464
const BEAM_TOP = 346

/* ---- the score, in ms from the top of the loop ---- */
const ACTS = [0, 6000, 13000]
const CYCLE = 19500

const T_LAUNCH = 300 // act 1
const T_GAP = 380
const T_FLY = 1300
const T_MW = 3400
const T_MW_GAP = 280
const T_DARK = 4600

const WAY_IN = [200, 900, 1600] // act 2
const COMET = 2200
const RES_STEP = [0, 2200, 4600]

const local = document.getElementById('local')
const cfgs = [].slice.call(document.querySelectorAll('#carried .cfg'))
const mws = [].slice.call(document.querySelectorAll('#mw .mw'))
const reps = [].slice.call(document.querySelectorAll('#reps i'))
const repN = document.getElementById('repN')
const coreAlts = [].slice.call(document.querySelectorAll('#wsCore span'))
const cores = [].slice.call(document.querySelectorAll('.cores-row .corechip:not(.more)'))
const diff = document.getElementById('diff')
const bars = [].slice.call(document.querySelectorAll('#bars i'))
const cfgPrompt = document.getElementById('cfgPrompt')
const btnOk = document.getElementById('approve')
const btnNo = document.getElementById('reject')
const wayEls = [
  document.getElementById('way1'),
  document.getElementById('way2'),
  document.getElementById('way3'),
]
const tabs = [].slice.call(document.querySelectorAll('#acts .act'))
const tabBars = tabs.map((tab) => tab.querySelector('i'))

let homes = []

const stage = createStage({
  stage: 'lift',
  canvas: 'lift-cv',
  mode: 'manual',
  draw: frame,
  onResize: measureHomes,
})

// `frame` only ever runs from the stage's own loop, so these are present
// whenever anything reads them
const g = stage && stage.g
const reduced = stage ? stage.reduced : false
const rr = stage && stage.rr

/** the chips' resting places, read with transforms cleared so a running
 *  animation cannot poison the measurement */
function measureHomes(s) {
  if (!s) return
  cfgs.forEach((el) => {
    el.style.transform = 'none'
  })
  homes = cfgs.map((el) => {
    const b = s.measure(el)
    return b && { x: b.cx, y: b.cy, w: b.w, h: b.h }
  })
}




/** the beam's halo never changes shape, only how strongly it shows */
let glowCache = null
function beamGlow(g) {
  if (!glowCache) {
    glowCache = g.createRadialGradient(0, 0, 0, 0, 0, 28)
    glowCache.addColorStop(0, 'rgba(' + PRI + ',0.13)')
    glowCache.addColorStop(0.6, 'rgba(' + PRI + ',0.05)')
    glowCache.addColorStop(1, 'rgba(' + PRI + ',0)')
  }
  return glowCache
}

function setOne(list, idx) {
  for (var i = 0; i < list.length; i++) list[i].classList.toggle('on', i === idx)
}


function quad(x0, y0, cx, cy, x1, y1, t) {
  var u = 1 - t
  return {
    x: u * u * x0 + 2 * u * t * cx + t * t * x1,
    y: u * u * y0 + 2 * u * t * cy + t * t * y1,
  }
}

// act 1: chips ride the beam, then peel off to their slot
function chipPos(i, t) {
  var h = homes[i]
  if (!h) return { x: BEAM_X, y: BEAM_BOT }
  return quad(BEAM_X, BEAM_BOT, BEAM_X, BEAM_TOP + 6, h.x, h.y, t)
}

function place(el, box, pt, s, o) {
  el.style.opacity = String(o)
  el.style.transform =
    'translate(' +
    (pt.x - box.x) * stage.scale +
    'px,' +
    (pt.y - box.y) * stage.scale +
    'px) scale(' +
    s +
    ')'
}

function wayPoint(w, t) {
  var u = 1 - t
  var c0 = WAY_X + 26
  var c1 = PORT.x - 24
  return {
    x: u * u * u * WAY_X + 3 * u * u * t * c0 + 3 * u * t * t * c1 + t * t * t * PORT.x,
    y: u * u * u * w.y + 3 * u * u * t * w.y + 3 * u * t * t * PORT.y + t * t * t * PORT.y,
  }
}

function drawWay(w, alpha) {
  g.strokeStyle = 'rgba(' + INK + ',' + alpha + ')'
  g.lineWidth = 1.4
  g.beginPath()
  g.moveTo(WAY_X, w.y)
  g.bezierCurveTo(WAY_X + 26, w.y, PORT.x - 24, PORT.y, PORT.x, PORT.y)
  g.stroke()
}


function ghosts(pos, box, t) {
  for (var k = 1; k <= 5; k++) {
    var q = pos(ease(clamp01(t - k * 0.045)))
    g.strokeStyle = 'rgba(' + PRI + ',' + (0.22 / k).toFixed(3) + ')'
    g.lineWidth = 1.2
    rr(q.x - box.w / 2, q.y - box.h / 2, box.w, box.h, 5)
    g.stroke()
  }
}

/* ---------------------------------------------------------------- loop */
var start = performance.now()
var lastLoop = -1
var decision = null
var decidedAt = 0
var AUTO_OK = 3200

function decide(what, now) {
  decision = what
  decidedAt = now || performance.now()
}

function frame(now, s) {
  if (!homes.length) measureHomes(s)

  var p = reduced ? CYCLE - 300 : (now - start) % CYCLE
  var act = p < ACTS[1] ? 0 : p < ACTS[2] ? 1 : 2
  var actEnd = act === 2 ? CYCLE : ACTS[act + 1]
  var within = (p - ACTS[act]) / (actEnd - ACTS[act])
  var t2 = p - ACTS[1]
  var t3 = p - ACTS[2]

  s.clear()

  /* ------------------------------------------------------- BUILD */
  var lastArrive = T_LAUNCH + (cfgs.length - 1) * T_GAP + T_FLY
  var beamP = act === 0 ? clamp01((p - T_LAUNCH) / (lastArrive - T_LAUNCH)) : 1
  var glow = act === 0 ? beamP : 0.18

  var midY = (BEAM_TOP + BEAM_BOT) / 2
  g.save()
  g.translate(BEAM_X, midY)
  g.scale(1, (BEAM_BOT - BEAM_TOP) / 56)
  g.globalAlpha = glow
  g.fillStyle = beamGlow(g)
  g.beginPath()
  g.arc(0, 0, 28, 0, Math.PI * 2)
  g.fill()
  g.restore()

  g.strokeStyle = 'rgba(' + INK + ',0.16)'
  g.lineWidth = 1.6
  g.setLineDash([3, 5])
  g.beginPath()
  g.moveTo(BEAM_X, BEAM_BOT)
  g.lineTo(BEAM_X, BEAM_TOP)
  g.stroke()
  g.setLineDash([])

  g.strokeStyle = 'rgba(' + PRI + ',' + (act === 0 ? 0.95 : 0.35) + ')'
  g.lineWidth = act === 0 ? 2.2 : 1.6
  g.beginPath()
  g.moveTo(BEAM_X, BEAM_BOT)
  g.lineTo(BEAM_X, BEAM_BOT - (BEAM_BOT - BEAM_TOP) * ease(beamP))
  g.stroke()

  for (var i = 0; i < cfgs.length; i++) {
    var h = homes[i]
    if (!h) continue
    var tp = act === 0 ? clamp01((p - (T_LAUNCH + i * T_GAP)) / T_FLY) : 1
    if (act === 0 && p < T_LAUNCH + i * T_GAP) {
      cfgs[i].style.opacity = '0'
      continue
    }
    var e = ease(tp)
    place(cfgs[i], h, chipPos(i, e), 0.86 + 0.14 * e, tp < 0.14 ? tp / 0.14 : 1)
    if (tp > 0.02 && tp < 0.99) {
      ;(function (idx) {
        ghosts(function (u) {
          return chipPos(idx, u)
        }, homes[idx], tp)
      })(i)
    }
  }

  for (var m = 0; m < mws.length; m++) {
    mws[m].classList.toggle('in', act > 0 || p > T_MW + m * T_MW_GAP)
  }
  local.classList.toggle('is-dark', act > 0 || p > T_DARK)

  /* -------------------------------------------------- DISTRIBUTE */
  for (var j = 0; j < WAYS.length; j++) {
    var lit = act === 2 || (act === 1 && t2 > WAY_IN[j])
    drawWay(WAYS[j], lit ? 0.26 : 0.08)
    if (wayEls[j]) wayEls[j].classList.toggle('lit', lit)
    // phase-locked, so the three streams reach the one door together
    if (act === 1 && lit && !reduced) stage.trail((u) => wayPoint(WAYS[j], u), (now % COMET) / COMET, 0.2, PRI)
  }

  var anyLit = act === 2 || (act === 1 && t2 > WAY_IN[0])
  g.fillStyle = anyLit ? 'rgba(' + PRI + ',1)' : 'rgba(' + INK + ',0.2)'
  g.beginPath()
  g.arc(PORT.x, PORT.y, 3.8, 0, Math.PI * 2)
  g.fill()
  if (anyLit) {
    g.strokeStyle = 'rgba(' + PRI + ',0.25)'
    g.lineWidth = 1.2
    g.beginPath()
    g.arc(PORT.x, PORT.y, 7.5, 0, Math.PI * 2)
    g.stroke()
  }

  // replicas: one pip per running copy, spelled out so it cannot be read
  // as a load meter
  var nRep = act === 0 ? 1 : act === 1 ? (t2 > RES_STEP[2] ? 5 : t2 > RES_STEP[1] ? 3 : 1) : 5
  for (var d = 0; d < reps.length; d++) reps[d].classList.toggle('on', d < nRep)
  if (repN) {
    var wantN = nRep + (nRep === 1 ? ' replica' : ' replicas')
    if (repN.textContent !== wantN) repN.textContent = wantN
  }

  // the session record fills left to right as the traffic lands
  var filled =
    act === 0 ? 0 : act === 2 ? bars.length : Math.floor(clamp01(t2 / 5600) * bars.length)
  for (var q = 0; q < bars.length; q++) {
    bars[q].classList.toggle('on', q < filled)
    bars[q].classList.toggle('flag', act === 2 && t3 > 150 && q > 8 && q % 3 === 1)
  }

  /* ---------------------------------------------------- OPTIMIZE */
  // A proposal, then a decision. The viewer can make it; if nobody does,
  // the demo approves on its own so the story still completes.
  var loop = Math.floor((now - start) / CYCLE)
  if (loop !== lastLoop) {
    lastLoop = loop
    decision = null
    decidedAt = 0
    // whichever core you run, the same setup goes up
    var ci = ((loop % cores.length) + cores.length) % cores.length
    setOne(coreAlts, ci)
    for (var cq = 0; cq < cores.length; cq++) cores[cq].classList.toggle('on', cq === ci)
  }
  var proposing = act === 2 && t3 > 800
  if (proposing && decision === null && t3 > AUTO_OK) decide('ok', now)
  if (act !== 2 && decision !== null) {
    decision = null
    decidedAt = 0
  }

  // the diff clears once it has been answered
  if (diff) diff.classList.toggle('in', proposing && (decision === null || now - decidedAt < 700))
  var upgraded = decision === 'ok' && now - decidedAt > 260
  if (cfgPrompt) {
    cfgPrompt.classList.toggle('upgraded', upgraded)
    cfgPrompt.classList.toggle('pop', upgraded && now - decidedAt < 800)
  }

  /* ------------------------------------------------------ chrome */
  for (var a = 0; a < tabs.length; a++) {
    tabs[a].classList.toggle('on', a === act)
    tabs[a].classList.toggle('done', a < act)
    var bar = tabBars[a]
    var at = a === act ? within.toFixed(4) : a < act ? '1' : '0'
    if (bar && bar.dataset.at !== at) {
      bar.style.transform = 'scaleX(' + at + ')'
      bar.dataset.at = at
    }
  }
}


if (stage) {
    if (btnOk) {
  btnOk.addEventListener('click', function () {
    decide('ok')
  })
}
if (btnNo) {
  btnNo.addEventListener('click', function () {
    decide('no')
  })
}

for (var t = 0; t < tabs.length; t++) {
  ;(function (idx) {
    tabs[idx].addEventListener('click', function () {
      start = performance.now() - ACTS[idx]
      lastLoop = -1
    })
  })(t)
}


  measureHomes(stage)
}
