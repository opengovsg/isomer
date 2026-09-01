import {
  HANDLE_MARGIN_PX,
  isPointerInTableChrome,
  TABLE_ADD_CHROME_PX,
} from "~/features/editing-experience/utils/tableEditorChrome"

describe("isPointerInTableChrome", () => {
  const table = {
    tableLeft: 100,
    tableTop: 50,
    tableRight: 400,
    tableBottom: 200,
  }

  it("treats a point inside the table as a hit", () => {
    // Arrange / Act / Assert
    expect(
      isPointerInTableChrome({ clientX: 250, clientY: 120, ...table }),
    ).toBe(true)
  })

  it("keeps the add-row gap and pill in the hit area", () => {
    // Arrange / Act / Assert
    expect(
      isPointerInTableChrome({
        clientX: 250,
        clientY: table.tableBottom + 4,
        ...table,
      }),
    ).toBe(true)
    expect(
      isPointerInTableChrome({
        clientX: 250,
        clientY: table.tableBottom + TABLE_ADD_CHROME_PX,
        ...table,
      }),
    ).toBe(true)
  })

  it("keeps the add-column gap and pill in the hit area", () => {
    // Arrange / Act / Assert
    expect(
      isPointerInTableChrome({
        clientX: table.tableRight + 4,
        clientY: 120,
        ...table,
      }),
    ).toBe(true)
    expect(
      isPointerInTableChrome({
        clientX: table.tableRight + TABLE_ADD_CHROME_PX,
        clientY: 120,
        ...table,
      }),
    ).toBe(true)
  })

  it("excludes points past the chrome around the add pills", () => {
    // Arrange / Act / Assert
    expect(
      isPointerInTableChrome({
        clientX: 250,
        clientY: table.tableBottom + TABLE_ADD_CHROME_PX + 1,
        ...table,
      }),
    ).toBe(false)
    expect(
      isPointerInTableChrome({
        clientX: table.tableRight + TABLE_ADD_CHROME_PX + 1,
        clientY: 120,
        ...table,
      }),
    ).toBe(false)
  })

  it("includes the left and top handle margins", () => {
    // Arrange / Act / Assert
    expect(
      isPointerInTableChrome({
        clientX: table.tableLeft - HANDLE_MARGIN_PX,
        clientY: 120,
        ...table,
      }),
    ).toBe(true)
    expect(
      isPointerInTableChrome({
        clientX: 250,
        clientY: table.tableTop - HANDLE_MARGIN_PX,
        ...table,
      }),
    ).toBe(true)
  })
})
