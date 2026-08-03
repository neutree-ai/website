/**
 * 02 / Distribute — five entrances, one workspace, one bus.
 *
 * The figure plays once when it reaches the middle of the viewport and then
 * holds its finished state, because that state is the argument: five ways in,
 * five sessions, one place. The apparatus does not perform its own arrival;
 * only the traffic is animated.
 */
import { createStage, beat, polyline, INK } from './figure.js'

const DOORS = 5

// design-unit geometry; the columns are laid out by CSS, so only the frame
// they sit in is stated here
const COL = { x: 30, y: 32, w: 322 }
const BUS = 412
const WS = { x: 560, y: 32, w: 412, h: 346 }
const ROW = { x: WS.x + 17, y: WS.y + 78, w: 378 }
const ENTRY = WS.y + WS.h / 2

const FIRST = 1000 // when the first entrance fires
const EVERY = 1800 // and how far apart they are after that
const END = FIRST + (DOORS - 1) * EVERY + 2000

// Where a door sits is the layout's answer, not the script's: the column is
// placed as a whole and then measured, so the wires meet the cards even after a
// row is added or the type reflows. Measured once per size.
let layout = null

createStage({
  stage: 'drStage',
  canvas: 'drCv',
  probe: 'drProbe',
  layer: 'drLayer',
  duration: END,
  onResize: () => {
    layout = null
  },
  draw,
})

/** measure the column once, and derive everything the wiring needs from it */
function build(s) {
  const mids = []
  for (let i = 0; i < DOORS; i++) {
    const box = s.measure('d' + i)
    if (!box) return null
    mids.push(box.cy)
  }
  return {
    mids,
    // door stub, then down the bus, then in: one polyline per entrance
    paths: mids.map((y) =>
      polyline([
        { x: COL.x + COL.w, y },
        { x: BUS, y },
        { x: BUS, y: ENTRY },
        { x: WS.x, y: ENTRY },
      ])
    ),
  }
}

function draw(t, s) {
  s.clear()

  if (!layout) {
    // the columns are placed as a whole, then measured
    s.place('doors', COL.x, COL.y, 1, COL.w, WS.h)
    s.place('list', ROW.x, ROW.y, 1, ROW.w, WS.h - 98)
    s.place('wsname', WS.x + 17, WS.y + 7, 1)
    s.place('wsrail', WS.x + 17, WS.y + 50, 1)
    layout = build(s)
    if (!layout) return
  }
  const { mids, paths } = layout

  s.boxAgent(WS.x, WS.y, WS.w, WS.h, 1)

  const wire = `rgba(${INK},0.15)`
  for (let i = 0; i < DOORS; i++) {
    s.line(COL.x + COL.w, mids[i], BUS, mids[i], wire, 1.6)
    s.dot(BUS, mids[i], 2.6, INK, 0.22)
  }
  s.line(BUS, mids[0], BUS, mids[DOORS - 1], wire, 1.6)
  s.arrow(BUS, ENTRY, WS.x, ENTRY, INK, 0.34)

  for (let k = 0; k < DOORS; k++) {
    const fires = FIRST + k * EVERY
    s.toggle('d' + k, 'lit', t > fires && t < fires + 1400)
    s.pulse(t, fires + 150, paths[k], 1000)

    // the row keeps its place in the column; only its own arrival moves it
    const rise = beat(t, fires + 950, fires + 1500)
    const row = s.node('s' + k)
    if (row) {
      row.style.opacity = rise.toFixed(3)
      row.style.transform = `translateY(${(8 * (1 - rise) * s.scale).toFixed(2)}px)`
    }
  }
}
