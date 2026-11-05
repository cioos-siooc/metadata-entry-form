import { typographyTokens } from "./tokens";

const { fontFamily, weight, size } = typographyTokens;

// Typography variants tuned for a web-first product. h1–h3 are display-scale
// for hero/landing; h4–h6 are section headings; body/caption drive the form.
const typography = {
  fontFamily,
  fontWeightLight: 300,
  fontWeightRegular: weight.regular,
  fontWeightMedium: weight.medium,
  fontWeightBold: weight.bold,
  htmlFontSize: 16,
  fontSize: 14,

  h1: {
    fontFamily,
    fontSize: `${size["5xl"] / 16}rem`,
    fontWeight: weight.bold,
    lineHeight: 1.1,
    letterSpacing: "-0.02em",
  },
  h2: {
    fontFamily,
    fontSize: `${size["4xl"] / 16}rem`,
    fontWeight: weight.bold,
    lineHeight: 1.15,
    letterSpacing: "-0.02em",
  },
  h3: {
    fontFamily,
    fontSize: `${size["3xl"] / 16}rem`,
    fontWeight: weight.semibold,
    lineHeight: 1.2,
    letterSpacing: "-0.015em",
  },
  h4: {
    fontFamily,
    fontSize: `${size["2xl"] / 16}rem`,
    fontWeight: weight.semibold,
    lineHeight: 1.3,
    letterSpacing: "-0.01em",
  },
  h5: {
    fontFamily,
    fontSize: `${size.xl / 16}rem`,
    fontWeight: weight.semibold,
    lineHeight: 1.35,
    letterSpacing: "-0.005em",
  },
  h6: {
    fontFamily,
    fontSize: `${size.lg / 16}rem`,
    fontWeight: weight.semibold,
    lineHeight: 1.4,
  },
  subtitle1: {
    fontFamily,
    fontSize: `${size.md / 16}rem`,
    fontWeight: weight.medium,
    lineHeight: 1.5,
  },
  subtitle2: {
    fontFamily,
    fontSize: `${size.base / 16}rem`,
    fontWeight: weight.medium,
    lineHeight: 1.5,
  },
  body1: {
    fontFamily,
    fontSize: `${size.md / 16}rem`,
    fontWeight: weight.regular,
    lineHeight: 1.55,
  },
  body2: {
    fontFamily,
    fontSize: `${size.base / 16}rem`,
    fontWeight: weight.regular,
    lineHeight: 1.55,
  },
  button: {
    fontFamily,
    fontSize: `${size.base / 16}rem`,
    fontWeight: weight.semibold,
    lineHeight: 1.4,
    textTransform: "none",
    letterSpacing: "0",
  },
  caption: {
    fontFamily,
    fontSize: `${size.xs / 16}rem`,
    fontWeight: weight.regular,
    lineHeight: 1.45,
  },
  overline: {
    fontFamily,
    fontSize: `${size.xs / 16}rem`,
    fontWeight: weight.semibold,
    lineHeight: 1.4,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
};

export default typography;
