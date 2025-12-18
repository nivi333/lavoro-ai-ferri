import type { Meta, StoryObj } from '@storybook/react';
import { Card } from './Card';
import { Button } from './Button';

const meta: Meta<typeof Card> = {
  title: 'Components/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    shadow: {
      control: { type: 'select' },
      options: ['none', 'small', 'medium', 'large'],
    },
    size: {
      control: { type: 'select' },
      options: ['small', 'default'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Default Card',
    children: 'This is a default card with some content.',
  },
};

export const WithActions: Story = {
  args: {
    title: 'Card with Actions',
    extra: (
      <Button type='primary' size='small'>
        Action
      </Button>
    ),
    children: 'This card has an action button in the header.',
  },
};

export const NoShadow: Story = {
  args: {
    title: 'No Shadow Card',
    shadow: 'none',
    children: 'This card has no shadow.',
  },
};

export const LargeShadow: Story = {
  args: {
    title: 'Large Shadow Card',
    shadow: 'large',
    children: 'This card has a large shadow.',
  },
};

export const SmallSize: Story = {
  args: {
    title: 'Small Card',
    size: 'small',
    children: 'This is a small sized card.',
  },
};

export const TextileExample: Story = {
  args: {
    title: '🧵 Textile Manufacturing',
    shadow: 'medium',
    children: (
      <div>
        <p>Fabric production, yarn manufacturing, dyeing & finishing</p>
        <div className='mt-4'>
          <Button type='primary' className='mr-2'>
            View Details
          </Button>
          <Button type='default'>Edit</Button>
        </div>
      </div>
    ),
  },
};
