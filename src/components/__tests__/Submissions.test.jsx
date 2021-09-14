import React from "react";
import { configure, mount } from "enzyme";

import Adapter from "enzyme-adapter-react-16";

import Submissions from "../Pages/Submissions";

configure({ adapter: new Adapter() });

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"), // use actual for all non-hook parts
  useParams: () => ({}),
}));

// const mockRecords = { toJSON: () => ({ key: { title: { en: "value" } } }) };
describe("<Submissions />", () => {
  it("Renders", () => {
    mount(
      <Submissions match={{ params: { region: "pacific", language: "en" } }} />
    );
  });
});
