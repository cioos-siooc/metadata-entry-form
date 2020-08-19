import React from 'react';
import { configure, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

import { KeyboardDatePicker } from "@material-ui/pickers";

import DateInput from '../DateInput';

configure({ adapter: new Adapter() });

const mockEvent = 1;
const mockOnChange = jest.fn();
describe('<DateInput />', () => {
  it('Updates the date when it is changed', () => {
    const wrapper = mount(<DateInput onChange={ mockOnChange }/>);
    
    wrapper.find(KeyboardDatePicker).props().onChange(mockEvent);
    expect(mockOnChange).toHaveBeenCalledWith({ target: { value: mockEvent } });

  });
});