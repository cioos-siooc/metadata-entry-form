import React from "react";
import { configure, mount } from "enzyme";
import Adapter from "enzyme-adapter-react-16";

import { Button } from "@material-ui/core";
import MetadataForm from "../MetadataForm";
import BilingualTextInput from "../FormComponents/BilingualTextInput";

configure({ adapter: new Adapter() });

const mockFirebase = jest.fn();
jest.mock("../../firebase", () => ({
  database: () => ({ ref: () => ({ push: mockFirebase }) }),
}));

describe("<MetadataForm />", () => {
  it("Renders", () => {
    mount(<MetadataForm />);
  });

  it("Handles button clicks", async () => {
    const mockPush = jest.fn();
    const wrapper = mount(<MetadataForm history={{ push: mockPush }} />);

    await wrapper.find(Button).props().onClick();
    expect(mockFirebase).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalled();
  });

  it("Handles input changes without a parent", () => {
    const wrapper = mount(<MetadataForm />);

    console.log(wrapper.instance());
    wrapper
      .find(BilingualTextInput)
      .at(0)
      .props()
      .onChange({ target: { name: "Gandalf", value: "Narya" } });
  });

  it("Handles input changes with a parent", () => {
    const wrapper = mount(<MetadataForm />);

    wrapper
      .find(BilingualTextInput)
      .at(0)
      .props()
      .onChange({ target: { name: "Gandalf", value: "Narya" } }, true);
  });
});
