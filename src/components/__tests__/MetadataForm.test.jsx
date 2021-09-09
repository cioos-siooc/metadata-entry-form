import React from "react";
import { configure, mount } from "enzyme";
import Adapter from "enzyme-adapter-react-16";
import { BrowserRouter } from "react-router-dom";

import MetadataForm from "../../components/Pages/MetadataForm";

configure({ adapter: new Adapter() });
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"), // use actual for all non-hook parts
  useParams: () => ({ language: "en", region: "pacific" }),
}));
describe("<MetadataForm />", () => {
  it("Renders", () => {
    mount(
      <BrowserRouter>
        <MetadataForm />
      </BrowserRouter>
    );
  });
});
