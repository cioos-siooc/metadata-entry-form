export const copyToClipboard = (text) =>
  new Promise((resolve, reject) => {
    if (text == null || text === "") {
      reject(new Error("nothing to copy"));
      return;
    }

    const fallbackCopy = () => {
      try {
        const ta = document.createElement("textarea");
        ta.value = String(text);
        ta.setAttribute("readonly", "");
        ta.style.position = "absolute";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        resolve();
      } catch (err) {
        reject(err);
      }
    };

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(String(text)).then(resolve).catch(fallbackCopy);
    } else {
      fallbackCopy();
    }
  });

export default copyToClipboard;
