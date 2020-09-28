import React from 'react';
import { configure, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

import SelectInput from '../FormComponents/SelectInput';

configure({ adapter: new Adapter() });

const selectInputs = ["theOneRing", "Narya", "Nenya", "Vilya"];
describe('<SelectInput />', () => {
  it('Renders', () => {
    mount(<SelectInput options={selectInputs} optionLabels={selectInputs} value={selectInputs[0]}/>);
  });
});