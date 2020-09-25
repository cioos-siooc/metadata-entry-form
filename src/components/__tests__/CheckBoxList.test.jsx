import React from 'react';
import { act } from 'react-dom/test-utils';
import { configure, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

import { Checkbox } from '@material-ui/core';

import CheckBoxList from '../FormComponents/CheckBoxList';

configure({ adapter: new Adapter() });

const mockOnChange = jest.fn();
const checkboxInputs = ["theOneRing", "Narya", "Nenya", "Vilya"];
describe('<CheckBoxList />', () => {
  it('Changes the checkbox when clicked', () => {
    const wrapper = mount(<CheckBoxList value={checkboxInputs[0]} options={checkboxInputs} optionLabels={checkboxInputs} onChange={mockOnChange} />);
    
    act(() => {
      wrapper.find(Checkbox).at(0).props().onChange({ target: { value: "theOneRing" }});
    });

    expect(mockOnChange).toHaveBeenCalledWith({target: { value: ["theOneRing"] }});
  });
});
