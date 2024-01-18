import React from "react";
import { configure, mount } from "enzyme";
import Adapter from "enzyme-adapter-react-16";

import { KeyboardDatePicker } from "@material-ui/pickers";

import DateInput from "../FormComponents/DateInput";

// this helps mock the a date
const mockedData = new Date("2020-11-26T00:00:00.000Z");
jest.spyOn(global, "Date").mockImplementation(() => mockedData);
Date.now = () => 1606348800;

configure({ adapter: new Adapter() });
const mockEventValue = new Date("2021-09-08T22:23:52.468Z").toISOString();
const mockComponentName = "date";
const mockOnChange = jest.fn();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"), // use actual for all non-hook parts
  useParams: () => ({
    language: "en",
  }),
}));

describe("<DateInput />", () => {
  it("Updates the date when it is changed", () => {
    const wrapper = mount(
      <DateInput
        value={mockEventValue}
        name={mockComponentName}
        onChange={mockOnChange}
      />
    );

    wrapper.find(KeyboardDatePicker).props().onChange(mockEventValue);
    expect(mockOnChange).toHaveBeenCalledWith({
      target: { value: mockEventValue, name: mockComponentName },
    });
  });
});
