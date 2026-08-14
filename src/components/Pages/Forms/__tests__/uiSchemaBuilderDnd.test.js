import { describe, expect, it } from "vitest";

import {
  resolveDropPlan,
  samePlan,
} from "../UiSchemaBuilder/dnd/resolveDropPlan";
import { applyDropPlan } from "../UiSchemaBuilder/dnd/applyDropPlan";
import {
  buildAnnouncements,
  describeTarget,
} from "../UiSchemaBuilder/dnd/announcements";
import {
  containerDropId,
  fieldDragId,
  stepDragId,
} from "../UiSchemaBuilder/dnd/ids";
import { assignedFields } from "@shared/formEngine";

/**
 * The drag layer's decisions.
 *
 * Tested here rather than through a simulated drag because a drag cannot be
 * simulated in jsdom: there is no PointerEvent and no setPointerCapture, and
 * getBoundingClientRect returns zeros so every droppable is a degenerate rect at
 * the same coordinates — collision detection over that yields arbitrary results
 * that would pass while the real layout was broken.
 *
 * So the split is deliberate: dnd-kit decides WHICH droppable the pointer is
 * over, and everything that follows from that is a pure function checked here.
 */

const steps = [
  { id: "site", title: { en: "Site", fr: "Site" }, fields: ["siteName", "depth"] },
  { id: "sample", title: { en: "Sample", fr: "Échantillon" }, fields: ["sampleType"] },
  { id: "empty", title: { en: "Empty", fr: "Vide" }, fields: [] },
];
const unassigned = ["notes", "extra"];

const field = (name, container, index) => ({ type: "field", name, container, index });
const stepAt = (index) => ({ type: "step", index });
const container = (index) => ({ type: "container", container: index });

const plan = (activeData, overData) =>
  resolveDropPlan({ activeData, overData, steps, unassigned });

describe("ids", () => {
  it("namespaces each kind of draggable", () => {
    expect(fieldDragId("depth")).toBe("field:depth");
    expect(stepDragId(2)).toBe("step:2");
    expect(containerDropId(2)).toBe("container:2");
  });

  it("names the unassigned tray rather than numbering it", () => {
    // `container:null` would stringify a value the tray does not have.
    expect(containerDropId(null)).toBe("container:unassigned");
    expect(containerDropId(undefined)).toBe("container:unassigned");
  });
});

describe("resolveDropPlan: steps", () => {
  it("reorders a step onto another step", () => {
    expect(plan(stepAt(0), stepAt(2))).toEqual({ kind: "moveStep", from: 0, to: 2 });
  });

  it("does nothing when a step lands on itself", () => {
    expect(plan(stepAt(1), stepAt(1))).toBeNull();
  });

  it("refuses a step dropped on a field, which collisions already prevent", () => {
    expect(plan(stepAt(0), field("depth", 0, 1))).toBeNull();
  });
});

describe("resolveDropPlan: a field within its own step", () => {
  it("moves it to the hovered row's slot", () => {
    expect(plan(field("depth", 0, 1), field("siteName", 0, 0))).toEqual({
      kind: "within",
      container: 0,
      from: 1,
      to: 0,
    });
  });

  it("does nothing when it lands on itself", () => {
    expect(plan(field("depth", 0, 1), field("depth", 0, 1))).toBeNull();
  });

  it("does nothing when dropped on its own container", () => {
    // Otherwise hovering the card you are already in would append the field to
    // the end of its own list, which reads as a move nobody asked for.
    expect(plan(field("depth", 0, 1), container(0))).toBeNull();
    expect(plan(field("depth", 0, 1), stepAt(0))).toBeNull();
  });
});

describe("resolveDropPlan: a field across steps", () => {
  it("inserts at the hovered row's position", () => {
    expect(plan(field("depth", 0, 1), field("sampleType", 1, 0))).toEqual({
      kind: "cross",
      name: "depth",
      container: 1,
      position: 0,
    });
  });

  it("appends when dropped on another step's container", () => {
    expect(plan(field("depth", 0, 1), container(1))).toEqual({
      kind: "cross",
      name: "depth",
      container: 1,
      position: 1,
    });
  });

  it("appends when dropped on a COLLAPSED card's header", () => {
    // A collapsed card's body is unmounted, so its inner droppable does not
    // exist and the card's own droppable catches the drop. Same target, so the
    // plan is the same as for the container.
    expect(plan(field("depth", 0, 1), stepAt(1))).toEqual({
      kind: "cross",
      name: "depth",
      container: 1,
      position: 1,
    });
  });

  it("puts a field into an empty step", () => {
    expect(plan(field("depth", 0, 1), container(2))).toEqual({
      kind: "cross",
      name: "depth",
      container: 2,
      position: 0,
    });
  });

  it("unassigns a field dropped on the tray", () => {
    expect(plan(field("depth", 0, 1), container(null))).toEqual({
      kind: "cross",
      name: "depth",
      container: null,
      position: 0,
    });
  });

  it("claims an unassigned field dropped into a step", () => {
    expect(plan(field("notes", null, 0), field("sampleType", 1, 0))).toEqual({
      kind: "cross",
      name: "notes",
      container: 1,
      position: 0,
    });
  });
});

describe("resolveDropPlan: what it declines", () => {
  it("declines to reorder inside the tray, and says so distinctly", () => {
    // The tray's order comes from Object.keys(jsonSchema.properties) and has
    // nowhere to be written. `noop` rather than null so the UI can tell "no
    // target" from "a target I cannot honour" and skip the insertion line.
    expect(plan(field("notes", null, 0), field("extra", null, 1))).toEqual({
      kind: "noop",
    });
  });

  it("returns null with no target at all", () => {
    expect(plan(field("depth", 0, 1), null)).toBeNull();
    expect(resolveDropPlan({ activeData: null, overData: container(1) })).toBeNull();
  });

  it("returns null for an unknown active type", () => {
    expect(plan({ type: "mystery" }, container(1))).toBeNull();
  });

  it("tolerates being called with no steps", () => {
    expect(
      resolveDropPlan({ activeData: field("a", 0, 0), overData: container(0) })
    ).toBeNull();
  });
});

describe("samePlan", () => {
  it("treats identical plans as equal so hovering does not re-render rows", () => {
    const a = { kind: "cross", name: "depth", container: 1, position: 0 };
    expect(samePlan(a, { ...a })).toBe(true);
    expect(samePlan(a, { ...a, position: 1 })).toBe(false);
    expect(samePlan(null, null)).toBe(true);
    expect(samePlan(null, a)).toBe(false);
  });
});

describe("applyDropPlan", () => {
  const ui = { "ui:steps": steps, siteName: { "ui:widget": "textarea" } };

  it("reorders steps", () => {
    const next = applyDropPlan(ui, { kind: "moveStep", from: 0, to: 1 });
    expect(next["ui:steps"].map((s) => s.id)).toEqual(["sample", "site", "empty"]);
  });

  it("reorders within a step", () => {
    const next = applyDropPlan(ui, { kind: "within", container: 0, from: 1, to: 0 });
    expect(next["ui:steps"][0].fields).toEqual(["depth", "siteName"]);
  });

  it("moves a field across steps in one call, without duplicating it", () => {
    const next = applyDropPlan(ui, {
      kind: "cross",
      name: "depth",
      container: 1,
      position: 0,
    });
    expect(next["ui:steps"][0].fields).toEqual(["siteName"]);
    expect(next["ui:steps"][1].fields).toEqual(["depth", "sampleType"]);
    // assignFieldToStep strips the field from every step before inserting, so a
    // cross-step move can never leave a copy behind.
    const claimed = assignedFields(next);
    expect(claimed.length).toBe(new Set(claimed).size);
  });

  it("unassigns a field", () => {
    const next = applyDropPlan(ui, {
      kind: "cross",
      name: "depth",
      container: null,
      position: 0,
    });
    expect(next["ui:steps"][0].fields).toEqual(["siteName"]);
    expect(assignedFields(next)).not.toContain("depth");
  });

  it("keeps a step that has had its last field dragged out", () => {
    const next = applyDropPlan(ui, {
      kind: "cross",
      name: "sampleType",
      container: 0,
      position: 0,
    });
    expect(next["ui:steps"][1].fields).toEqual([]);
    expect(next["ui:steps"]).toHaveLength(3);
  });

  it("leaves configuration the builder does not own alone", () => {
    const next = applyDropPlan(ui, { kind: "moveStep", from: 0, to: 1 });
    expect(next.siteName).toEqual({ "ui:widget": "textarea" });
  });

  it("returns the SAME object for every plan that changes nothing", () => {
    // Reference equality is what lets the caller skip onChange entirely, so a
    // drag that lands where it started cannot dirty the JSON tab.
    expect(applyDropPlan(ui, null)).toBe(ui);
    expect(applyDropPlan(ui, { kind: "noop" })).toBe(ui);
    expect(applyDropPlan(ui, { kind: "moveStep", from: 1, to: 1 })).toBe(ui);
    expect(applyDropPlan(ui, { kind: "within", container: 0, from: 1, to: 1 })).toBe(ui);
  });
});

describe("describeTarget", () => {
  it("names a step by its title, not its id", () => {
    expect(describeTarget(stepAt(1), steps, "en")).toBe("the Sample tab");
    expect(describeTarget(stepAt(1), steps, "fr")).toBe("l'onglet Échantillon");
  });

  it("names a container by the step it belongs to", () => {
    expect(describeTarget(container(0), steps, "en")).toBe("the Site tab");
  });

  it("names the tray", () => {
    expect(describeTarget(container(null), steps, "en")).toBe("no tab");
    expect(describeTarget(container(null), steps, "fr")).toBe("aucun onglet");
  });

  it("places a row inside its step", () => {
    expect(describeTarget(field("depth", 0, 1), steps, "en")).toBe(
      "depth in the Site tab"
    );
  });

  it("returns nothing when there is no target", () => {
    expect(describeTarget(null, steps, "en")).toBeNull();
  });
});

describe("buildAnnouncements", () => {
  const active = (data) => ({ active: { data: { current: data } } });
  const over = (data) => ({ over: { data: { current: data } } });

  it("narrates a field drag in English", () => {
    const a = buildAnnouncements("en", () => steps);
    expect(a.onDragStart(active(field("depth", 0, 1)))).toBe("Picked up depth.");
    expect(a.onDragOver(over(container(1)))).toBe("Over the Sample tab.");
    expect(a.onDragEnd(over(container(1)))).toBe("Dropped on the Sample tab.");
    expect(a.onDragCancel()).toBe("Move cancelled.");
  });

  it("narrates in French, because these strings are the only non-visual feedback", () => {
    const a = buildAnnouncements("fr", () => steps);
    expect(a.onDragStart(active(field("depth", 0, 1)))).toBe("depth saisi.");
    expect(a.onDragOver(over(container(1)))).toBe("Au-dessus de l'onglet Échantillon.");
    expect(a.onDragEnd(over(container(1)))).toBe("Déposé sur l'onglet Échantillon.");
    expect(a.onDragCancel()).toBe("Déplacement annulé.");
  });

  it("names a dragged step by its title", () => {
    const a = buildAnnouncements("en", () => steps);
    expect(a.onDragStart(active(stepAt(1)))).toBe("Picked up the Sample tab.");
  });

  it("says something useful when there is no target", () => {
    const a = buildAnnouncements("en", () => steps);
    expect(a.onDragOver({})).toBe("Not over a drop target.");
    expect(a.onDragEnd({})).toBe("Dropped. Nothing moved.");
  });
});
