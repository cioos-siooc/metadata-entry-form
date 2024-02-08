import React from "react";
import { configure, mount } from "enzyme";
import Adapter from "enzyme-adapter-react-16";

import { KeyboardDatePicker } from "@material-ui/pickers";

import DateInput from "../FormComponents/DateInput";

configure({ adapter: new Adapter() });
const mockEventValue = new Date("2021-09-08T12:00:00.000Z");
const mockComponentName = "date";
const mockOnChange = jest.fn();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"), // use actual for all non-hook parts
  useParams: () => ({
    language: "en",
  }),
}));


beforeAll(() => {
  jest.useFakeTimers('modern');
  jest.setSystemTime(new Date("2021-09-08T19:00:00.000Z"));
});

afterAll(() => {
  jest.useRealTimers();
});

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
