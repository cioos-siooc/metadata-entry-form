import React from "react";
import { configure, mount } from "enzyme";
import Adapter from "enzyme-adapter-react-16";

import { KeyboardDatePicker } from "@material-ui/pickers";

import DateInput from "../FormComponents/DateInput";

configure({ adapter: new Adapter() });
const mockEventValue = new Date("2021-10-08T12:00:00.000");
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
  jest.setSystemTime(new Date("2021-10-08T12:00:00.000"));
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

    // Simulate selecting a new date as a Date object
    const newDate = new Date("2021-10-08T12:00:00.000");
    wrapper.find(KeyboardDatePicker).props().onChange(newDate);

    // The expected value should be an ISO string after being processed by your component
    const expectedValue = newDate.toISOString();

     // Assert that onChange was called with the correct value
    expect(mockOnChange).toHaveBeenCalledWith({
      target: { value: expectedValue, name: mockComponentName },
    });
  });
});
