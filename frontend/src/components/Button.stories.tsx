import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: { type: 'select' },
      options: ['primary', 'default', 'dashed', 'link', 'text'],
    },
    danger: {
      control: { type: 'boolean' },
    },
    size: {
      control: { type: 'select' },
      options: ['small', 'middle', 'large'],
    },
    disabled: {
      control: { type: 'boolean' },
    },
    loading: {
      control: { type: 'boolean' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    type: 'primary',
    children: 'Primary Button',
  },
};

export const Secondary: Story = {
  args: {
    type: 'default',
    children: 'Secondary Button',
  },
};

export const Danger: Story = {
  args: {
    type: 'primary',
    danger: true,
    children: 'Danger Button',
  },
};

export const Large: Story = {
  args: {
    type: 'primary',
    size: 'large',
    children: 'Large Button',
  },
};

export const Small: Story = {
  args: {
    type: 'primary',
    size: 'small',
    children: 'Small Button',
  },
};

export const Loading: Story = {
  args: {
    type: 'primary',
    loading: true,
    children: 'Loading Button',
  },
};

export const Disabled: Story = {
  args: {
    type: 'primary',
    disabled: true,
    children: 'Disabled Button',
  },
};
