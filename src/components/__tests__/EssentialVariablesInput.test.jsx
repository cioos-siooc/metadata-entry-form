import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import EssentialVariablesInput from "../FormComponents/EssentialVariablesInput";

describe("<EssentialVariablesInput />", () => {
  it("starts with a collapsed directory and an empty details panel", () => {
    const updateEssentialVariables = vi.fn();
    const updateLegacyEovs = vi.fn();
    const updateRecord = vi.fn((field) =>
      field === "essentialVariables"
        ? updateEssentialVariables
        : updateLegacyEovs,
    );

    render(
      <EssentialVariablesInput
        language="en"
        record={{ essentialVariables: ["eov:oxygen"], eov: ["oxygen"] }}
        updateRecord={updateRecord}
      />,
    );

    expect(screen.getByText("How to choose variables")).toBeInTheDocument();
    expect(
      screen.getByText(/EOV \(Essential Ocean Variable\)/),
    ).toBeInTheDocument();
    expect(screen.getByRole("tree")).toBeInTheDocument();
    expect(screen.getByRole("treeitem", { name: /^Ocean/ })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(
      screen.getByText(
        "Select a variable in the tree to read its full description.",
      ),
    ).toBeInTheDocument();

    fireEvent.click(
      screen
        .getByRole("treeitem", { name: /^Other/ })
        .querySelector(".MuiTreeItem-content"),
    );

    expect(
      screen.getByText(
        "All data that does not correspond to the current EOVs.",
      ),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Clear all" }));
    expect(updateEssentialVariables).toHaveBeenCalledWith([]);
    expect(updateLegacyEovs).toHaveBeenCalledWith([]);
  });

  it("shows CIOOS, GOOS, and WMO variable icons with standard-specific names", () => {
    render(
      <EssentialVariablesInput
        language="en"
        record={{ essentialVariables: [], eov: [] }}
        updateRecord={vi.fn(() => vi.fn())}
      />,
    );

    fireEvent.click(
      screen
        .getByRole("treeitem", { name: /^Ocean/ })
        .querySelector(".MuiTreeItem-content"),
    );
    fireEvent.click(
      screen
        .getByRole("treeitem", { name: /^Biogeochemistry/ })
        .querySelector(".MuiTreeItem-content"),
    );
    fireEvent.click(
      screen
        .getByRole("treeitem", { name: /^Oxygen/ })
        .querySelector(".MuiTreeItem-content"),
    );

    expect(screen.getByText("EOV name:")).toBeInTheDocument();
    expect(screen.getByText("ECV name:")).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Oxygen CIOOS EOV icon" }),
    ).toHaveAttribute("src", "/eov-icons/dissolved-oxygen.svg");
    expect(
      screen.getByRole("img", { name: "Oxygen GOOS EOV icon" }),
    ).toHaveAttribute("src", "/goos-eov-icons/Oxygen.png");
    expect(screen.getByText("CIOOS")).toBeInTheDocument();
    expect(screen.getByText("GOOS")).toBeInTheDocument();
    expect(screen.getByText("WMO")).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Oxygen WMO ECV icon" }),
    ).toHaveAttribute(
      "src",
      "https://gcos.wmo.int/themes/custom/server_theme/dist/images/climate_variables/oxygen.svg",
    );
  });

  it("hides unselected deprecated variables and tags retained selections", () => {
    const deprecatedLabel =
      "Marine turtles, birds, mammals abundance and distribution";
    const { rerender } = render(
      <EssentialVariablesInput
        language="en"
        record={{ essentialVariables: [], eov: [] }}
        updateRecord={vi.fn(() => vi.fn())}
      />,
    );

    fireEvent.change(
      screen.getByLabelText("Search by what your data measures"),
      { target: { value: "turtles, birds, mammals" } },
    );

    expect(screen.queryByText(deprecatedLabel)).not.toBeInTheDocument();

    rerender(
      <EssentialVariablesInput
        language="en"
        record={{
          essentialVariables: [
            "eov:marineTurtlesBirdsMammalsAbundanceAndDistribution",
          ],
          eov: ["marineTurtlesBirdsMammalsAbundanceAndDistribution"],
        }}
        updateRecord={vi.fn(() => vi.fn())}
      />,
    );

    expect(screen.getAllByText(deprecatedLabel)).toHaveLength(2);
    expect(screen.getAllByText("Deprecated")).toHaveLength(2);
    expect(screen.getByText("Replace before submitting")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "1 selected variable is deprecated and must be replaced before submitting.",
    );

    fireEvent.click(
      screen
        .getAllByRole("treeitem", { name: new RegExp(deprecatedLabel) })
        .at(-1)
        .querySelector(".MuiTreeItem-content"),
    );

    expect(
      screen.getByText(
        "This variable is deprecated and must be replaced before submitting.",
      ),
    ).toBeInTheDocument();
  });
});
