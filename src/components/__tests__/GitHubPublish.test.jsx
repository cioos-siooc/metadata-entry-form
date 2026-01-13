import React from 'react';
import { configure, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import { act } from 'react-dom/test-utils';
import GitHubPublishDialog from '../Dialogs/GitHubPublishDialog';
import { Checkbox, Button, CircularProgress } from '@material-ui/core';
import { onValue } from "firebase/database";

configure({ adapter: new Adapter() });

// Mock useParams from react-router-dom which is used by I18n
jest.mock('react-router-dom', () => ({
  useParams: () => ({ language: 'en' }),
}));

// Mock Firebase onValue to return environments
jest.mock("firebase/database", () => ({
  getDatabase: jest.fn(),
  ref: jest.fn(),
  onValue: jest.fn(),
}));

jest.mock("../../firebase", () => ({}));

describe('<GitHubPublishDialog />', () => {
  const mockOnClose = jest.fn();
  const mockOnPublish = jest.fn();
  const region = 'hakai';
  const environments = ['prod', 'dev', 'test'];

  beforeEach(() => {
    jest.clearAllMocks();
    // Setup onValue mock to return our environments immediately
    onValue.mockImplementation((ref, callback) => {
      callback({
        val: () => ({ environments }),
        exists: () => true
      });
      return jest.fn(); // unsubscribe function
    });
  });

  it('renders correctly when open', () => {
    const wrapper = mount(
      <GitHubPublishDialog
        open={true}
        onClose={mockOnClose}
        onPublish={mockOnPublish}
        region={region}
      />
    );
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.text()).toContain('Publish to GitHub');
  });

  it('displays checkboxes for each environment fetched from firebase', () => {
    const wrapper = mount(
      <GitHubPublishDialog
        open={true}
        onClose={mockOnClose}
        onPublish={mockOnPublish}
        region={region}
      />
    );
    
    // Force update to process the effect results if needed, though onValue is sync here
    wrapper.update();

    const checkboxes = wrapper.find(Checkbox);
    expect(checkboxes).toHaveLength(environments.length);
  });

  it('updates selected environments state on change', () => {
    const wrapper = mount(
      <GitHubPublishDialog
        open={true}
        onClose={mockOnClose}
        onPublish={mockOnPublish}
        region={region}
      />
    );
    wrapper.update();

    // Simulate clicking the first checkbox (prod)
    const firstCheckbox = wrapper.find(Checkbox).at(0);
    // In Material-UI Checkbox, onChange passes event
    act(() => {
      firstCheckbox.props().onChange({ target: { checked: true } });
    });
    wrapper.update();

    const publishButton = wrapper.find(Button).filterWhere(b => b.text().includes('Publish'));
    publishButton.simulate('click');

    // Expected: ['prod'] and the default commit message
    expect(mockOnPublish).toHaveBeenCalledWith(['prod'], expect.stringContaining('Publish metadata record'));
  });

  it('calls onPublish with custom commit message', () => {
    const wrapper = mount(
      <GitHubPublishDialog
        open={true}
        onClose={mockOnClose}
        onPublish={mockOnPublish}
        region={region}
      />
    );
    wrapper.update();

    // Select an environment
    act(() => {
      wrapper.find(Checkbox).at(1).props().onChange({ target: { checked: true } }); // 'dev'
    });

    // Type a commit message
    const textField = wrapper.find('WithStyles(ForwardRef(TextField))');
    act(() => {
      textField.props().onChange({ target: { value: 'fix: updated metadata' } });
    });
    
    wrapper.update();

    const publishButton = wrapper.find(Button).filterWhere(b => b.text().includes('Publish'));
    publishButton.simulate('click');

    expect(mockOnPublish).toHaveBeenCalledWith(['dev'], 'fix: updated metadata');
  });

  it('shows loading state when loading is true', () => {
    const wrapper = mount(
      <GitHubPublishDialog
        open={true}
        onClose={mockOnClose}
        onPublish={mockOnPublish}
        region={region}
        loading={true}
      />
    );
    
    // Should show CircularProgress
    expect(wrapper.find(CircularProgress).exists()).toBe(true);
    // Should NOT show checkboxes
    expect(wrapper.find(Checkbox).exists()).toBe(false);
  });
});
