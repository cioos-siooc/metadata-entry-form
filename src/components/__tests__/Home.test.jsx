import React from 'react';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

import { useHistory } from "react-router-dom";
import { Button } from "@material-ui/core";

import Home from '../Home';

jest.mock("react-router-dom", () => {
  return { useHistory: jest.fn() }
});

configure({ adapter: new Adapter() });

describe('<Home />', () => {

  it('Renders a button to create a new form', () => {
    const wrapper = shallow(<Home />);

    expect(wrapper.find(Button).length).toEqual(1);

  });
});