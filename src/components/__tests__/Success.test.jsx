import React from "react";
import { configure, mount } from "enzyme";
import Adapter from "enzyme-adapter-react-16";
import { Button } from "@material-ui/core";

import Success from "../Success";

configure({ adapter: new Adapter() });

const mockPush = jest.fn();
jest.mock("react-router-dom", () => {
  return { useHistory: () => ({ push: mockPush }) };
});

describe("<Success />", () => {
  it("Allows you to make another submission on button click", () => {
    const wrapper = mount(<Success />);

    wrapper.find(Button).props().onClick();

    expect(mockPush).toHaveBeenCalled();
  });
});
