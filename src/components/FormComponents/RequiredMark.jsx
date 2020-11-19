import React from "react";

function RequiredMark({ passes }) {
  if (passes)
    return (
      <span
        style={{
          color: "green",
          fontSize: "x-large",
          position: "relative",
          bottom: "-4px",
        }}
      >
        {" "}
        ✓{" "}
      </span>
    );
  return (
    <span
      style={{
        color: "red",
        fontSize: "large",
      }}
    >
      {" "}
      ✵{" "}
    </span>
  );
}
export default RequiredMark;
