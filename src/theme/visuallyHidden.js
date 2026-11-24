// Hidden on screen, still read by screen readers. Pixel strings, not numbers:
// in `sx` a number <= 1 is a percentage, so `width: 1` meant 100%.
const visuallyHidden = {
  position: "absolute !important",
  width: "1px",
  height: "1px",
  margin: "-1px",
  padding: 0,
  border: 0,
  overflow: "hidden",
  clipPath: "inset(50%)",
  whiteSpace: "nowrap",
};

export default visuallyHidden;
