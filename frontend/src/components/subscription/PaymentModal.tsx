import React, { useState } from 'react';
import { Modal, Button, message } from 'antd';
import { useStripe, useElements, PaymentElement, Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe outside of component
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

interface PaymentFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard`, // Redirect after payment
      },
      redirect: 'if_required', // Handle redirect manually if needed, or let Stripe handle it
    });

    if (error) {
      setErrorMessage(error.message || 'An unexpected error occurred.');
      setLoading(false);
    } else {
      // Payment successful
      message.success('Payment successful!');
      onSuccess();
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      {errorMessage && <div style={{ color: 'red', marginTop: '10px' }}>{errorMessage}</div>}
      <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
        <Button onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type='primary' htmlType='submit' loading={loading} disabled={!stripe}>
          Pay Now
        </Button>
      </div>
    </form>
  );
};

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientSecret: string;
  onSuccess: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  clientSecret,
  onSuccess,
}) => {
  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
    },
  };

  return (
    <Modal
      title='Complete Payment'
      open={isOpen}
      onCancel={onClose}
      footer={null}
      destroyOnClose
      width={500}
    >
      {clientSecret ? (
        <Elements stripe={stripePromise} options={options}>
          <PaymentForm onSuccess={onSuccess} onCancel={onClose} />
        </Elements>
      ) : (
        <div>Loading payment details...</div>
      )}
    </Modal>
  );
};

export default PaymentModal;
