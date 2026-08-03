/**
 * 03 / Optimize — the gate, drawn once.
 *
 * Written against the builder-mode implementation: the agent reads its own
 * sessions through its own tools, and every write it wants is a propose/apply
 * pair. Propose stores the payload server-side and hands back an id; apply
 * refuses until a human has approved, then re-reads the stored copy. The
 * figure exists to make that order visible, so nothing here happens before the
 * click does.
 */
import { createStage, beat, seg, INK } from './figure.js'

const AGENT = { x: 40, y: 40, w: 340, h: 300 }
const REQ = { x: 500, y: 40, w: 460, h: 200 }
const STRIP = { x: 500, y: 320, w: 460, h: 60 }
const GATE_Y = 140 // the one channel between the agent and the record
const DROP_X = REQ.x + 230

// when each call's line lands, and when its result comes back
const TOOL = [600, 1700, 2900, 6500]
const RESULT = [1400, 2500, 3700, 8200]
const PROPOSE = 2950
const APPROVE = 5750
const APPLY = 6550
const END = 11000

const gate = seg(AGENT.x + AGENT.w, GATE_Y, REQ.x, GATE_Y)
const drop = seg(DROP_X, REQ.y + REQ.h, DROP_X, STRIP.y)

let placed = false

createStage({
  stage: 'opStage',
  canvas: 'opCv',
  probe: 'opProbe',
  layer: 'opLayer',
  duration: END,
  onResize: () => {
    placed = false
  },
  draw,
})

/** Everything that never moves is positioned once per size rather than per
 *  frame; what the figure animates is the request, not the apparatus. */
function layout(s) {
  s.place('band', AGENT.x + 16, AGENT.y + 7, 1)
  s.place('calls', AGENT.x + 18, AGENT.y + 46, 1, AGENT.w - 36, AGENT.h - 64)
  s.place('req', REQ.x + 18, REQ.y + 16, 1, REQ.w - 36, REQ.h - 32)
  s.place('ws', STRIP.x + 18, STRIP.y + 16, 1, STRIP.w - 36, 28)
  s.place('lab', AGENT.x + AGENT.w, GATE_Y - 28, 1, REQ.x - AGENT.x - AGENT.w)
  placed = true
}

/** The apparatus is simply there. What moves is the request: it is asked for,
 *  it waits, it is signed, and only then does anything change. */
function draw(t, s) {
  s.clear()

  s.boxAgent(AGENT.x, AGENT.y, AGENT.w, AGENT.h)
  s.boxRecord(REQ.x, REQ.y, REQ.w, REQ.h)
  s.boxPlain(STRIP.x, STRIP.y, STRIP.w, STRIP.h)

  s.arrow(AGENT.x + AGENT.w, GATE_Y, REQ.x, GATE_Y, INK, 0.3)
  s.arrow(DROP_X, REQ.y + REQ.h, DROP_X, STRIP.y, INK, 0.3)

  if (!placed) layout(s)
  s.place('lab2', DROP_X + 22, STRIP.y - 58, beat(t, 7300, 7900), 200)

  for (let i = 0; i < TOOL.length; i++) {
    s.fade('t' + i, beat(t, TOOL[i], TOOL[i] + 420))
    s.fade('r' + i, beat(t, RESULT[i], RESULT[i] + 420))
  }

  s.pulse(t, PROPOSE, gate)
  s.pulse(t, APPLY, gate)
  s.pulse(t, APPLY + 600, drop)

  // the record fills only once it has been asked for
  s.fade('chip', beat(t, 3300, 3700))
  s.fade('diff', beat(t, 3300, 3800))
  s.fade('note', beat(t, 3600, 4100))
  s.fade('acts', beat(t, 3900, 4400))
  s.fade('wschip', beat(t, 7700, 8200))

  const signed = t > APPROVE
  const chip = s.node('chip')
  if (chip) {
    const word = signed ? 'approved' : 'pending'
    if (chip.textContent !== word) chip.textContent = word
  }
  s.toggle('chip', 'ok', signed)

  const lab = s.node('lab')
  const word = t > APPLY - 150 ? 'apply' : 'propose'
  if (lab && lab.textContent !== word) lab.textContent = word

  s.toggle('ok', 'press', t > APPROVE - 250 && t < APPROVE)
  s.toggle('acts', 'done', signed)
}
