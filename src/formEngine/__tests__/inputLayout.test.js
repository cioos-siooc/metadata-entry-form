import { describe, expect, it } from "vitest";

import {
  inputHidesOwnLabel,
  inputMaxWidth,
  inputPresentation,
} from "../inputLayout";

/**
 * The width and label rules, on their own. The rendered-output side of the same
 * behaviour is in inputPresentation.test.jsx; these are the cheap cases —
 * every branch of "how wide should this be", which is tedious to assert through
 * emotion-generated class names.
 */

describe("inputMaxWidth", () => {
  it("caps a number so a two-digit value is not in a 900px box", () => {
    expect(inputMaxWidth({ type: "number" })).toBe("20ch");
    expect(inputMaxWidth({ type: "integer" })).toBe("20ch");
  });

  it("caps dates to roughly their own length", () => {
    expect(inputMaxWidth({ type: "string", format: "date" })).toBe("20ch");
    expect(inputMaxWidth({ type: "string", format: "date-time" })).toBe("28ch");
  });

  it("reads the format from ui:options as well as the schema", () => {
    expect(inputMaxWidth({ type: "string" }, { format: "date-time" })).toBe("28ch");
  });

  it("sizes a select to its longest option", () => {
    // "partly cloudy" is 13 characters, + 8 of chrome.
    expect(
      inputMaxWidth({ type: "string", enum: ["fog", "partly cloudy"] })
    ).toBe("21ch");
  });

  it("gives a select with tiny options a usable floor", () => {
    expect(inputMaxWidth({ type: "string", enum: ["a", "b"] })).toBe("20ch");
  });

  it("stops a select with one enormous option from spanning the page", () => {
    expect(
      inputMaxWidth({ type: "string", enum: ["x".repeat(200)] })
    ).toBe("60ch");
  });

  it("prefers rjsf's resolved option labels over the raw enum", () => {
    // The label is what a reader sees, so it is what has to fit.
    expect(
      inputMaxWidth({ type: "string", enum: ["a"] }, {}, [
        { value: "a", label: "A rather long human label" },
      ])
    ).toBe("33ch");
  });

  it("sizes an array of enums by its items", () => {
    expect(
      inputMaxWidth({ type: "array", items: { enum: ["oxygen", "salinity"] } })
    ).toBe("20ch");
  });

  it("keeps a short string short", () => {
    expect(inputMaxWidth({ type: "string", maxLength: 12 })).toBe("26ch");
  });

  it("lets an ordinary string fill its container", () => {
    expect(inputMaxWidth({ type: "string" })).toBeUndefined();
    expect(inputMaxWidth({ type: "string", maxLength: 400 })).toBeUndefined();
  });

  it("lets prose and explicit overrides fill it too", () => {
    expect(inputMaxWidth({ type: "string" }, { multiline: true })).toBeUndefined();
    expect(inputMaxWidth({ type: "string" }, { rows: 3 })).toBeUndefined();
    // fullWidth beats every cap, including a number's.
    expect(inputMaxWidth({ type: "number" }, { fullWidth: true })).toBeUndefined();
  });

  it("does not guess for a schema with no usable type", () => {
    expect(inputMaxWidth({})).toBeUndefined();
    expect(inputMaxWidth({ type: ["array", "string"] })).toBeUndefined();
    expect(inputMaxWidth()).toBeUndefined();
  });
});

describe("inputHidesOwnLabel", () => {
  it("hides the widget's label, because the question heading is the label", () => {
    expect(inputHidesOwnLabel({})).toBe(true);
    expect(inputHidesOwnLabel()).toBe(true);
  });

  it("keeps it inside a group box, where no per-field heading is drawn", () => {
    expect(inputHidesOwnLabel({ "ui:options": { inGroup: true } })).toBe(false);
  });
});

describe("inputPresentation", () => {
  it("is full width with a cap, so it shrinks but stops growing", () => {
    const presentation = inputPresentation({ type: "number" }, {}, {}, undefined, "Depth");
    expect(presentation.fullWidth).toBe(true);
    expect(presentation.sx).toEqual({ maxWidth: "20ch" });
  });

  it("omits sx entirely when there is no cap", () => {
    expect(inputPresentation({ type: "string" }, {}).sx).toBeUndefined();
  });

  it("supplies an accessible name whenever it hides the visible label", () => {
    // Hiding the label without this leaves an unnamed box for a screen reader.
    expect(
      inputPresentation({ type: "string" }, {}, {}, undefined, "Site name").ariaLabel
    ).toBe("Site name");
  });

  it("does not double up the name when the label is already shown", () => {
    const inGroup = { "ui:options": { inGroup: true } };
    expect(
      inputPresentation({ type: "string" }, inGroup, {}, undefined, "Site name")
        .ariaLabel
    ).toBeUndefined();
  });

  it("has no name to give when the field has no title", () => {
    expect(inputPresentation({ type: "string" }, {}).ariaLabel).toBeUndefined();
  });
});
