import React from 'react';
import { act } from 'react-dom/test-utils';
import { configure, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

import { TextField } from "@material-ui/core";

import BilingualTextInput from '../FormComponents/BilingualTextInput';

configure({ adapter: new Adapter() });

const mockEvent = { target: { value: 1, name: 'en'} };
const mockOnChange = jest.fn();
describe('<BilingualTextInput />', () => {
  it('Updates the text when it is typed in', () => {
    const wrapper = mount(<BilingualTextInput onChange={mockOnChange} />);
    
    // The first text field is english, second is french. They use the same method to change text so only testing the first is necessary
    act(() => {
      wrapper.find(TextField).at(0).props().onChange(mockEvent);
    });
    expect(mockOnChange).toHaveBeenCalled();
  });
});