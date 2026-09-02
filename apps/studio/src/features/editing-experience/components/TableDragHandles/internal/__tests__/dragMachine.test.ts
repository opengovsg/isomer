import type { AxisProjection, Rect, TableGeometry } from "../axisMath"
import type { Axis } from "../axisView"
import type { GestureEvent, GestureState } from "../dragMachine"
import { IDLE_GESTURE, reduceGesture } from "../dragMachine"

// Local literals rather than the real `AXIS` descriptors, so this test needs
// neither ProseMirror nor a DOM.
const ROW: AxisProjection = {
  rectsOf: (geometry) => geometry.rowRects,
  startOf: (rect) => rect.top,
  sizeOf: (rect) => rect.height,
  pointerOf: (point) => point.y,
}

const COLUMN: AxisProjection = {
  rectsOf: (geometry) => geometry.colRects,
  startOf: (rect) => rect.left,
  sizeOf: (rect) => rect.width,
  pointerOf: (point) => point.x,
}

const TABLE_POS = 7

// Four rows, 20px tall from y=100 — boundaries land on 100/120/140/160/180.
const ROW_RECTS: Rect[] = [100, 120, 140, 160].map((top) => ({
  top,
  left: 50,
  width: 300,
  height: 20,
}))

const COL_RECTS: Rect[] = [50, 150, 250].map((left) => ({
  top: 100,
  left,
  width: 100,
  height: 20,
}))

const UNDER_TEST: Record<Axis, { projection: AxisProjection; rects: Rect[] }> =
  {
    row: { projection: ROW, rects: ROW_RECTS },
    column: { projection: COLUMN, rects: COL_RECTS },
  }

const pressOn = (
  index: number,
  {
    lockMinIndex = 0,
    axis = "row",
    rects,
  }: {
    lockMinIndex?: number
    axis?: Axis
    rects?: (Rect | null)[]
  } = {},
): GestureEvent => ({
  type: "press",
  axis,
  tablePos: TABLE_POS,
  index,
  rects: rects ?? UNDER_TEST[axis].rects,
  projection: UNDER_TEST[axis].projection,
  lockMinIndex,
  clientX: 10,
  clientY: 200,
})

const moveTo = (
  clientY: number,
  containerPoint: { x: number; y: number } | null,
): GestureEvent => ({ type: "move", clientX: 10, clientY, containerPoint })

/** Replays a sequence of events, returning the state it ends in. */
const run = (...events: GestureEvent[]): GestureState =>
  events.reduce<GestureState>(
    (state, event) => reduceGesture(state, event).state,
    IDLE_GESTURE,
  )

/** A drag of row 1 in flight, with the pointer at y=165. */
const draggingRow1 = () => run(pressOn(1), moveTo(210, { x: 10, y: 165 }))

describe("press", () => {
  it("starts a pending gesture and snapshots the boundaries", () => {
    const { state, intents } = reduceGesture(IDLE_GESTURE, pressOn(1))

    expect(state).toMatchObject({
      phase: "pending",
      axis: "row",
      tablePos: TABLE_POS,
      from: 1,
      lockMinIndex: 0,
      boundaries: [100, 120, 140, 160, 180],
      startClientX: 10,
      startClientY: 200,
    })
    // A press alone does nothing to the document.
    expect(intents).toEqual([])
  })

  it("snapshots only the movable boundaries on a locked axis", () => {
    const { state } = reduceGesture(
      IDLE_GESTURE,
      pressOn(1, { lockMinIndex: 1 }),
    )

    expect(state).toMatchObject({ boundaries: [120, 140, 160, 180] })
  })

  it("abandons a gesture already in flight", () => {
    const { state } = reduceGesture(draggingRow1(), pressOn(2))

    expect(state).toMatchObject({ phase: "pending", from: 2 })
  })
})

describe("move", () => {
  it("stays pending until the pointer clears the threshold", () => {
    const pending = run(pressOn(1))

    const { state, intents } = reduceGesture(
      pending,
      moveTo(203, { x: 10, y: 163 }),
    )

    // Same object, so nothing re-renders.
    expect(state).toBe(pending)
    expect(intents).toEqual([])
  })

  it("becomes a drag once the pointer clears the threshold", () => {
    const { state } = reduceGesture(
      run(pressOn(1)),
      moveTo(210, { x: 10, y: 165 }),
    )

    expect(state).toMatchObject({
      phase: "dragging",
      axis: "row",
      from: 1,
      pointer: 165,
      boundaries: [100, 120, 140, 160, 180],
    })
  })

  it("never drags a locked header slot, however far the pointer travels", () => {
    const pending = run(pressOn(0, { lockMinIndex: 1 }))

    const { state } = reduceGesture(pending, moveTo(400, { x: 10, y: 355 }))

    expect(state).toBe(pending)
  })

  it("projects the pointer onto the column axis for a column gesture", () => {
    const { state } = reduceGesture(
      run(pressOn(1, { axis: "column" })),
      moveTo(210, { x: 220, y: 165 }),
    )

    expect(state).toMatchObject({ phase: "dragging", pointer: 220 })
  })

  it("tracks the pointer while dragging", () => {
    const { state } = reduceGesture(
      draggingRow1(),
      moveTo(190, { x: 10, y: 125 }),
    )

    expect(state).toMatchObject({ phase: "dragging", pointer: 125 })
  })

  it("ignores movement perpendicular to the axis", () => {
    const dragging = draggingRow1()

    const { state } = reduceGesture(dragging, moveTo(210, { x: 999, y: 165 }))

    expect(state).toBe(dragging)
  })

  it("holds position when the container cannot be measured", () => {
    const pending = run(pressOn(1))
    const dragging = draggingRow1()

    expect(reduceGesture(pending, moveTo(210, null)).state).toBe(pending)
    expect(reduceGesture(dragging, moveTo(190, null)).state).toBe(dragging)
  })

  it("does nothing when no gesture is in flight", () => {
    const { state, intents } = reduceGesture(
      IDLE_GESTURE,
      moveTo(210, { x: 10, y: 165 }),
    )

    expect(state).toBe(IDLE_GESTURE)
    expect(intents).toEqual([])
  })
})

describe("geometryChanged", () => {
  const shifted = (tops: number[]): TableGeometry[] => [
    {
      pos: TABLE_POS,
      rowRects: tops.map((top) => ({ top, left: 50, width: 300, height: 20 })),
      colRects: COL_RECTS,
    },
  ]

  it("re-derives the boundaries when the table moves mid-drag", () => {
    const { state } = reduceGesture(draggingRow1(), {
      type: "geometryChanged",
      geometries: shifted([200, 220, 240, 260]),
    })

    expect(state).toMatchObject({ boundaries: [200, 220, 240, 260, 280] })
  })

  it("keeps the drag when the boundaries are unchanged", () => {
    const dragging = draggingRow1()

    const { state } = reduceGesture(dragging, {
      type: "geometryChanged",
      geometries: shifted([100, 120, 140, 160]),
    })

    expect(state).toBe(dragging)
  })

  it("keeps the old boundaries when the table went away", () => {
    const dragging = draggingRow1()

    expect(
      reduceGesture(dragging, { type: "geometryChanged", geometries: [] })
        .state,
    ).toBe(dragging)
  })

  it("keeps the old boundaries when nothing could be measured", () => {
    const dragging = draggingRow1()

    const { state } = reduceGesture(dragging, {
      type: "geometryChanged",
      geometries: [
        { pos: TABLE_POS, rowRects: [null, null], colRects: [null] },
      ],
    })

    expect(state).toBe(dragging)
  })

  it("is irrelevant to a gesture that has not become a drag", () => {
    const pending = run(pressOn(1))

    const { state } = reduceGesture(pending, {
      type: "geometryChanged",
      geometries: shifted([200, 220, 240, 260]),
    })

    expect(state).toBe(pending)
  })
})

describe("release", () => {
  it("selects the slot when the press never became a drag", () => {
    const { state, intents } = reduceGesture(run(pressOn(1)), {
      type: "release",
    })

    expect(state).toBe(IDLE_GESTURE)
    expect(intents).toEqual([
      { type: "selectSlot", axis: "row", tablePos: TABLE_POS, index: 1 },
    ])
  })

  it("selects a locked header slot rather than moving it", () => {
    const gesture = run(
      pressOn(0, { lockMinIndex: 1 }),
      moveTo(400, { x: 10, y: 355 }),
    )

    const { intents } = reduceGesture(gesture, { type: "release" })

    expect(intents).toEqual([
      { type: "selectSlot", axis: "row", tablePos: TABLE_POS, index: 0 },
    ])
  })

  it("reorders, then selects the slot at its new index", () => {
    const { state, intents } = reduceGesture(draggingRow1(), {
      type: "release",
    })

    expect(state).toBe(IDLE_GESTURE)
    expect(intents).toEqual([
      { type: "suppressNextClick" },
      { type: "moveSlot", axis: "row", tablePos: TABLE_POS, from: 1, to: 2 },
      { type: "selectSlot", axis: "row", tablePos: TABLE_POS, index: 2 },
    ])
  })

  it("skips the reorder when the slot lands where it started", () => {
    const dragging = run(pressOn(1), moveTo(210, { x: 10, y: 125 }))

    const { intents } = reduceGesture(dragging, { type: "release" })

    // Still suppresses the click and re-selects, so a nudge is not a no-op
    // visually — it just does not touch the document.
    expect(intents).toEqual([
      { type: "suppressNextClick" },
      { type: "selectSlot", axis: "row", tablePos: TABLE_POS, index: 1 },
    ])
  })

  it("never drops a slot onto a locked header", () => {
    const dragging = run(
      pressOn(2, { lockMinIndex: 1 }),
      moveTo(210, { x: 10, y: 90 }),
    )

    const { intents } = reduceGesture(dragging, { type: "release" })

    expect(intents).toEqual([
      { type: "suppressNextClick" },
      { type: "moveSlot", axis: "row", tablePos: TABLE_POS, from: 2, to: 1 },
      { type: "selectSlot", axis: "row", tablePos: TABLE_POS, index: 1 },
    ])
  })

  it("does nothing when no gesture is in flight", () => {
    const { state, intents } = reduceGesture(IDLE_GESTURE, { type: "release" })

    expect(state).toBe(IDLE_GESTURE)
    expect(intents).toEqual([])
  })
})
