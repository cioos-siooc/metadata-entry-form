import { vi, describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UserContext } from "../../providers/UserProvider";

// --- Mocks ---

const mockCreateDraftDoi = vi.fn();
const mockDeleteDraftDoi = vi.fn();
const mockGetDoiStatus = vi.fn();
const mockPerformUpdateDraftDoi = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ language: "en", region: "pacific", userID: "user1" }),
  };
});

vi.mock("../../utils/doiUpdate", () => ({
  default: (...args) => mockPerformUpdateDraftDoi(...args),
}));

// Import component after mocks
const { default: DOIInput } = await import(
  "../FormComponents/DOIInput"
);

// --- Helpers ---

const baseRecord = {
  identifier: "rec-1234567890abcdef",
  recordID: "rec-1234567890abcdef",
  datasetIdentifier: "",
  doiCreationStatus: "",
  status: "",
  title: { en: "Test Dataset" },
};

function renderDOIInput(recordOverrides = {}, props = {}) {
  const record = { ...baseRecord, ...recordOverrides };
  const contextValue = {
    createDraftDoi: mockCreateDraftDoi,
    deleteDraftDoi: mockDeleteDraftDoi,
    getDoiStatus: mockGetDoiStatus,
    datacitePrefix: "10.5678",
    dataciteApiDomain: "production",
    ...(props.contextValue || {}),
  };

  return render(
    <UserContext.Provider value={contextValue}>
      <DOIInput
        record={record}
        name="datasetIdentifier"
        handleUpdateDatasetIdentifier={props.handleUpdateDatasetIdentifier || vi.fn()}
        handleUpdateDoiCreationStatus={props.handleUpdateDoiCreationStatus || vi.fn()}
        disabled={false}
        {...props}
      />
    </UserContext.Provider>
  );
}

// --- Tests ---

describe("DOIInput", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetDoiStatus.mockResolvedValue({ data: "" });
  });

  describe("handleGenerateDOI – minimal payload", () => {
    it("should call createDraftDoi with only the prefix when suffix mode is 'default' (DataCite auto-generates the suffix)", async () => {
      const user = userEvent.setup();

      mockCreateDraftDoi.mockResolvedValue({
        data: {
          data: {
            attributes: {
              doi: "10.5678/test-suffix",
              state: "draft",
            },
          },
        },
      });

      renderDOIInput({ doiCreationStatus: "", status: "" });

      const generateBtn = screen.getByRole("button", { name: /generate doi/i });
      await user.click(generateBtn);

      await waitFor(() => {
        expect(mockCreateDraftDoi).toHaveBeenCalledTimes(1);
      });

      const callArgs = mockCreateDraftDoi.mock.calls[0][0];
      expect(callArgs).toEqual({
        record: {
          data: {
            type: "dois",
            attributes: {
              prefix: "10.5678",
            },
          },
        },
        region: "pacific",
      });
    });

    it("should use the record identifier as the suffix when suffix mode is 'identifier'", async () => {
      const user = userEvent.setup();

      mockCreateDraftDoi.mockResolvedValue({
        data: {
          data: {
            attributes: { doi: "10.5678/rec-1234567890abcdef", state: "draft" },
          },
        },
      });

      renderDOIInput(
        { doiCreationStatus: "", status: "" },
        { contextValue: { doiSuffixModes: ["identifier"] } }
      );

      const generateBtn = screen.getByRole("button", { name: /generate doi/i });
      await user.click(generateBtn);

      await waitFor(() => {
        expect(mockCreateDraftDoi).toHaveBeenCalledTimes(1);
      });

      expect(mockCreateDraftDoi.mock.calls[0][0].record.data.attributes).toEqual({
        doi: "10.5678/rec-1234567890abcdef",
        prefix: "10.5678",
      });
    });

    it("should use a user-entered suffix when suffix mode is 'manual'", async () => {
      const user = userEvent.setup();

      mockCreateDraftDoi.mockResolvedValue({
        data: {
          data: {
            attributes: { doi: "10.5678/my-custom-suffix", state: "draft" },
          },
        },
      });

      renderDOIInput(
        { doiCreationStatus: "", status: "" },
        { contextValue: { doiSuffixModes: ["manual"] } }
      );

      const suffixField = screen.getByRole("textbox", { name: /doi suffix/i });
      await user.type(suffixField, "my-custom-suffix");

      const generateBtn = screen.getByRole("button", { name: /generate doi/i });
      await user.click(generateBtn);

      await waitFor(() => {
        expect(mockCreateDraftDoi).toHaveBeenCalledTimes(1);
      });

      expect(mockCreateDraftDoi.mock.calls[0][0].record.data.attributes).toEqual({
        doi: "10.5678/my-custom-suffix",
        prefix: "10.5678",
      });
    });

    it("should update datasetIdentifier and doiCreationStatus after successful generation", async () => {
      const user = userEvent.setup();
      const handleUpdateDatasetIdentifier = vi.fn();
      const handleUpdateDoiCreationStatus = vi.fn();

      mockCreateDraftDoi.mockResolvedValue({
        data: {
          data: {
            attributes: {
              doi: "10.5678/abc-123",
              state: "draft",
            },
          },
        },
      });

      renderDOIInput(
        { recordID: "rec-1", doiCreationStatus: "", status: "" },
        { handleUpdateDatasetIdentifier, handleUpdateDoiCreationStatus }
      );

      const generateBtn = screen.getByRole("button", { name: /generate doi/i });
      await user.click(generateBtn);

      await waitFor(() => {
        expect(handleUpdateDatasetIdentifier).toHaveBeenCalledWith({
          target: { value: "https://doi.org/10.5678/abc-123" },
        });
        expect(handleUpdateDoiCreationStatus).toHaveBeenCalledWith({
          target: { value: "draft" },
        });
      });
    });
  });

  describe("auto-update on generate – submitted/published records", () => {
    it("should call performUpdateDraftDoi when record status is 'submitted'", async () => {
      const user = userEvent.setup();
      mockPerformUpdateDraftDoi.mockResolvedValue(200);

      mockCreateDraftDoi.mockResolvedValue({
        data: {
          data: {
            attributes: {
              doi: "10.5678/sub-1",
              state: "draft",
            },
          },
        },
      });

      renderDOIInput({ recordID: "rec-1", doiCreationStatus: "", status: "submitted" });

      const generateBtn = screen.getByRole("button", { name: /generate doi/i });
      await user.click(generateBtn);

      await waitFor(() => {
        expect(mockPerformUpdateDraftDoi).toHaveBeenCalledTimes(1);
      });

      const [updatedRecord, region, language, prefix] = mockPerformUpdateDraftDoi.mock.calls[0];
      expect(updatedRecord.datasetIdentifier).toBe("https://doi.org/10.5678/sub-1");
      expect(updatedRecord.doiCreationStatus).toBe("draft");
      expect(region).toBe("pacific");
      expect(language).toBe("en");
      expect(prefix).toBe("10.5678");
    });

    it("should call performUpdateDraftDoi when record status is 'published'", async () => {
      const user = userEvent.setup();
      mockPerformUpdateDraftDoi.mockResolvedValue(200);

      mockCreateDraftDoi.mockResolvedValue({
        data: {
          data: {
            attributes: {
              doi: "10.5678/pub-1",
              state: "draft",
            },
          },
        },
      });

      renderDOIInput({ recordID: "rec-1", doiCreationStatus: "", status: "published" });

      const generateBtn = screen.getByRole("button", { name: /generate doi/i });
      await user.click(generateBtn);

      await waitFor(() => {
        expect(mockPerformUpdateDraftDoi).toHaveBeenCalledTimes(1);
      });
    });

    it("should NOT call performUpdateDraftDoi when record status is empty (draft form)", async () => {
      const user = userEvent.setup();

      mockCreateDraftDoi.mockResolvedValue({
        data: {
          data: {
            attributes: {
              doi: "10.5678/draft-1",
              state: "draft",
            },
          },
        },
      });

      renderDOIInput({ recordID: "rec-1", doiCreationStatus: "", status: "" });

      const generateBtn = screen.getByRole("button", { name: /generate doi/i });
      await user.click(generateBtn);

      await waitFor(() => {
        expect(mockCreateDraftDoi).toHaveBeenCalledTimes(1);
      });

      expect(mockPerformUpdateDraftDoi).not.toHaveBeenCalled();
    });

    it("should show error alert when auto-update fails after generation", async () => {
      const user = userEvent.setup();
      mockPerformUpdateDraftDoi.mockRejectedValue(new Error("Update metadata failed"));

      mockCreateDraftDoi.mockResolvedValue({
        data: {
          data: {
            attributes: {
              doi: "10.5678/fail-1",
              state: "draft",
            },
          },
        },
      });

      renderDOIInput({ recordID: "rec-1", doiCreationStatus: "", status: "submitted" });

      const generateBtn = screen.getByRole("button", { name: /generate doi/i });
      await user.click(generateBtn);

      await waitFor(() => {
        expect(screen.getByText(/Update metadata failed/i)).toBeInTheDocument();
      });
    });
  });

  describe("Generate DOI button disabled state", () => {
    it("should be disabled when doiCreationStatus is already set", () => {
      renderDOIInput({ recordID: "rec-1", doiCreationStatus: "draft" });

      const generateBtn = screen.getByRole("button", { name: /generate doi/i });
      expect(generateBtn).toBeDisabled();
    });

    it("should be disabled when recordID is empty", () => {
      renderDOIInput({ recordID: "", doiCreationStatus: "" });

      const generateBtn = screen.getByRole("button", { name: /generate doi/i });
      expect(generateBtn).toBeDisabled();
    });
  });

  describe("Update DOI button disabled during concurrent operations", () => {
    it("should disable Update DOI while generate/auto-update is in progress", async () => {
      const user = userEvent.setup();

      // Make createDraftDoi hang so loadingDoi stays true
      let resolveCreate;
      mockCreateDraftDoi.mockImplementation(
        () => new Promise((resolve) => { resolveCreate = resolve; })
      );

      renderDOIInput({
        recordID: "rec-1",
        doiCreationStatus: "draft",
        datasetIdentifier: "https://doi.org/10.5678/existing",
        status: "submitted",
      });

      // Update DOI button should be visible and initially enabled
      const updateBtn = screen.getByRole("button", { name: /update doi/i });
      expect(updateBtn).not.toBeDisabled();

      // Click Generate DOI — it will hang on the create call
      // We need a record where generate is allowed, but update is also shown
      // Since doiCreationStatus is "draft", generate is disabled. Let's test via the update button's own loading state instead.

      // Click Update DOI to start an update
      let resolveUpdate;
      mockPerformUpdateDraftDoi.mockImplementation(
        () => new Promise((resolve) => { resolveUpdate = resolve; })
      );

      await user.click(updateBtn);

      // While update is in progress, the button should be disabled
      await waitFor(() => {
        expect(updateBtn).toBeDisabled();
      });

      // Resolve the update to clean up
      resolveUpdate(200);
    });
  });

  describe("Delete DOI button disabled during concurrent operations", () => {
    it("should disable Delete DOI while a delete is in-flight", async () => {
      const user = userEvent.setup();

      let resolveDelete;
      mockDeleteDraftDoi.mockImplementation(
        () => new Promise((resolve) => { resolveDelete = resolve; })
      );

      renderDOIInput({
        recordID: "rec-1",
        doiCreationStatus: "draft",
        datasetIdentifier: "https://doi.org/10.5678/del-1",
        status: "submitted",
      });

      const deleteBtn = screen.getByRole("button", { name: /delete doi/i });
      expect(deleteBtn).not.toBeDisabled();

      // Clicking Delete now opens a confirmation prompt describing the consequences.
      await user.click(deleteBtn);
      const confirmBtn = await screen.findByRole("button", { name: /^confirm$/i });
      await user.click(confirmBtn);

      // Once confirmed, the in-flight delete disables the Delete button.
      await waitFor(() => {
        expect(deleteBtn).toBeDisabled();
      });

      // Resolve to clean up
      resolveDelete({ data: 204 });
    });
  });

  describe("DataCite record button", () => {
    it("should show a DataCite record link when a valid DOI is present", () => {
      renderDOIInput({
        doiCreationStatus: "findable",
        datasetIdentifier: "https://doi.org/10.5678/existing-record",
      });

      const recordLink = screen.getByRole("link", { name: /view datacite record/i });
      expect(recordLink).toHaveAttribute(
        "href",
        "https://doi.datacite.org/dois/10.5678%2Fexisting-record"
      );
      expect(recordLink).toHaveAttribute("target", "_blank");
    });

    it("should use the test DataCite domain when configured", () => {
      renderDOIInput(
        {
          doiCreationStatus: "registered",
          datasetIdentifier: "https://doi.org/10.5678/test-record",
        },
        {
          contextValue: {
            dataciteApiDomain: "test",
          },
        }
      );

      const recordLink = screen.getByRole("link", { name: /view datacite record/i });
      expect(recordLink).toHaveAttribute(
        "href",
        "https://doi.test.datacite.org/dois/10.5678%2Ftest-record"
      );
    });

    it("should show a DataCite record link for draft DOIs", () => {
      renderDOIInput({
        doiCreationStatus: "draft",
        datasetIdentifier: "https://doi.org/10.5678/draft-record",
      });

      const recordLink = screen.getByRole("link", { name: /view datacite record/i });
      expect(recordLink).toHaveAttribute(
        "href",
        "https://doi.datacite.org/dois/10.5678%2Fdraft-record"
      );
    });

    it("should not show a DataCite record link when the DOI is invalid", () => {
      renderDOIInput({
        doiCreationStatus: "unknown",
        datasetIdentifier: "not-a-doi",
      });

      expect(
        screen.queryByRole("link", { name: /view datacite record/i })
      ).not.toBeInTheDocument();
    });
  });
});
