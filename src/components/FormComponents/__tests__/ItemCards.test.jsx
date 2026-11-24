import React, { useState } from "react";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";

import ItemCards from "../ItemCards";
import { getAppTheme } from "../../../theme/createAppTheme";

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useParams: () => ({ language: "en" }) };
});

// A tiny stateful host, as the record tabs are.
function Host({ initial, onItems = () => {}, ...props }) {
  const [items, setItems] = useState(initial);
  const [open, setOpen] = useState(null);
  const update = (next) => {
    setItems(next);
    onItems(next);
  };
  return (
    <ThemeProvider theme={getAppTheme()}>
      <MemoryRouter>
        <ItemCards
          items={items}
          updateItems={update}
          openIndex={open}
          setOpenIndex={setOpen}
          itemTitle={(item) => item.name}
          itemMeta={(item) => item.url}
          isComplete={(item) => Boolean(item.name && item.url)}
          getBlankItem={() => ({ name: "", url: "" })}
          renderEditor={(item) => <p>Editing {item.name || "blank"}</p>}
          addLabel="Add resource"
          itemNoun={{ en: "resource", fr: "ressource" }}
          ariaLabel="Resources"
          {...props}
        />
      </MemoryRouter>
    </ThemeProvider>
  );
}

const items = [
  { name: "Data package", url: "https://example.org/data.zip" },
  { name: "Methods", url: "" },
];

describe("<ItemCards />", () => {
  it("lists each item with its summary and status, all folded", () => {
    render(<Host initial={items} />);
    const list = screen.getByRole("list", { name: "Resources" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(2);

    const first = screen.getByRole("button", { name: /Data package/ });
    expect(first).toHaveAttribute("aria-expanded", "false");
    expect(first).toHaveTextContent("https://example.org/data.zip");
    expect(first).toHaveTextContent("Complete");
    expect(screen.getByRole("button", { name: /Methods/ })).toHaveTextContent(
      "Incomplete",
    );
    expect(screen.queryByText(/^Editing/)).toBeNull();
  });

  it("opens one item at a time and folds it with Done", async () => {
    const user = userEvent.setup();
    render(<Host initial={items} />);

    await user.click(screen.getByRole("button", { name: /Data package/ }));
    expect(
      screen.getByRole("region", { name: /Data package/ }),
    ).toHaveTextContent("Editing Data package");

    await user.click(screen.getByRole("button", { name: /Methods/ }));
    expect(screen.queryByText("Editing Data package")).toBeNull();
    expect(screen.getByText("Editing Methods")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Done" }));
    expect(screen.queryByText(/^Editing/)).toBeNull();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Methods/ })).toHaveFocus(),
    );
  });

  it("adds a blank item and opens it", async () => {
    const user = userEvent.setup();
    render(<Host initial={items} />);
    await user.click(screen.getByRole("button", { name: "Add resource" }));
    expect(screen.getByText("Editing blank")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Untitled/ })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("removes from the row menu, and Undo puts it back in place", async () => {
    const user = userEvent.setup();
    const onItems = vi.fn();
    render(<Host initial={items} onItems={onItems} />);

    await user.click(
      screen.getByRole("button", { name: "More actions for resource 1" }),
    );
    await user.click(
      screen.getByRole("menuitem", { name: "Remove from this record" }),
    );
    expect(onItems).toHaveBeenLastCalledWith([items[1]]);
    expect(screen.getByText("Removed “Data package”")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Undo" }));
    expect(onItems).toHaveBeenLastCalledWith(items);
  });

  it("duplicates from the row menu unless turned off", async () => {
    const user = userEvent.setup();
    const onItems = vi.fn();
    const { unmount } = render(<Host initial={items} onItems={onItems} />);
    await user.click(
      screen.getByRole("button", { name: "More actions for resource 2" }),
    );
    await user.click(screen.getByRole("menuitem", { name: "Duplicate" }));
    expect(onItems).toHaveBeenLastCalledWith([...items, items[1]]);
    unmount();

    render(<Host initial={items} allowDuplicate={false} />);
    await user.click(
      screen.getByRole("button", { name: "More actions for resource 1" }),
    );
    expect(screen.queryByRole("menuitem", { name: "Duplicate" })).toBeNull();
  });

  it("hides reorder handles and actions when disabled", () => {
    render(<Host initial={items} disabled />);
    expect(screen.queryByRole("button", { name: /Reorder/ })).toBeNull();
    expect(
      screen.getByRole("button", { name: "More actions for resource 1" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Add resource" })).toBeDisabled();
  });
});
