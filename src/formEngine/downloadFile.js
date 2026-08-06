/**
 * Triggers a browser download from an in-memory string.
 *
 * Exports run entirely client-side: the data is already loaded to render the
 * page, so round-tripping it through a cloud function would add latency, cost,
 * and a second place for the CSV format to drift.
 */
export default function downloadFile(contents, filename, mimeType) {
  const blob = new Blob([contents], { type: `${mimeType};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Revoking immediately can cancel the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const downloadCsv = (contents, filename) =>
  // The BOM makes Excel open UTF-8 correctly, which matters for French labels.
  // \ufeff is a UTF-8 BOM, written as an escape so it is visible in source.
  downloadFile(`\ufeff${contents}`, filename, "text/csv");

export const downloadJson = (contents, filename) =>
  downloadFile(contents, filename, "application/json");
