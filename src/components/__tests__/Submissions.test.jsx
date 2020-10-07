import React from "react";
import { act } from "react-dom/test-utils";
import { configure, mount } from "enzyme";
import Adapter from "enzyme-adapter-react-16";

import Submissions from "../Submissions";

configure({ adapter: new Adapter() });

jest.mock("../../firebase");

const mockRecords = { toJSON: () => ({ key: { title: { en: "value" } } }) };
describe("<Submissions />", () => {
  it("Renders", () => {
    const wrapper = mount(<Submissions />);

    act(() => {
      wrapper.instance().databaseCallback(mockRecords);
    });

    console.log(wrapper.state());
    expect(wrapper.state().records).toEqual(mockRecords.toJSON());
  });
});
