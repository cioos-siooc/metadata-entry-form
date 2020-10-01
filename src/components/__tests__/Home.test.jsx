import React from "react";
import { configure, mount } from "enzyme";
import Adapter from "enzyme-adapter-react-16";

import { Button } from "@material-ui/core";

import Home from "../Home";

configure({ adapter: new Adapter() });

const mockPush = jest.fn();
jest.mock("react-router-dom", () => {
  return { useHistory: () => ({ push: mockPush }) };
});

describe("<Home />", () => {
  it("Calls history when the button is pushed", () => {
    const wrapper = mount(<Home />);

    wrapper.find(Button).props().onClick();

    expect(mockPush).toHaveBeenCalled();
  });
});
