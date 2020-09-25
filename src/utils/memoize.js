import { memo } from "react";

const areEqual = (
  { onChange: a, value: val1, ...prevProps },
  { onChange: b, value: val2, ...nextProps }
) => {
  return JSON.stringify(val1) === JSON.stringify(val2);
};

const memoize = (fn) => memo(fn, areEqual);
export default memoize;
