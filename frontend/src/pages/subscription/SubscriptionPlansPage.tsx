import React, { useEffect, useState } from 'react';
import { Card, Button, Typography, Row, Col, List, Tag, Spin, message, Alert } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import { subscriptionService, SubscriptionPlan } from '../../services/subscriptionService';
import MainLayout from '../../components/layout/MainLayout';
import PaymentModal from '../../components/subscription/PaymentModal';
import { useNavigate } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;

const SubscriptionPlansPage: React.FC = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingSubscription, setCreatingSubscription] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const data = await subscriptionService.getPlans();
      // Sort plans by price
      const sortedPlans = data.sort((a, b) => a.price_monthly - b.price_monthly);
      setPlans(sortedPlans);
    } catch (err: any) {
      setError(err.message || 'Failed to load subscription plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    try {
      setCreatingSubscription(true);
      setSelectedPlan(plan);

      // Create subscription to get client secret
      // Note: We are not passing payment method ID initially because we want to use Payment Element
      // However, backend might expect paymentMethodId if we strictly followed previous logic.
      // Let's assume backend can handle creation without PM (returning incomplete subscription)
      // If backend fails without PM, we need to generate PM first using Stripe?
      // Actually, standard modern flow is: create subscription with `payment_behavior: 'default_incomplete'` -> get client secret -> confirm payment.
      // My backend implementation uses `payment_behavior: 'default_incomplete'`, so it should work without PM.

      const subscription = await subscriptionService.createSubscription(plan.plan_id, '', 'month');

      // Check if subscription status is active (e.g. valid free trial or no payment needed)
      if (subscription.status === 'active' || subscription.status === 'trialing') {
        message.success(`Successfully subscribed to ${plan.display_name}!`);
        navigate('/dashboard');
        return;
      }

      // If generic incomplete, we need client secret
      const latestInvoice = (subscription as any).latest_invoice;
      const paymentIntent = latestInvoice?.payment_intent;
      const secret = paymentIntent?.client_secret;

      if (secret) {
        setClientSecret(secret);
        setPaymentModalOpen(true);
      } else {
        // Checking if status is 'incomplete' but no secret? Maybe free plan?
        if (plan.price_monthly === 0) {
          message.success(`Successfully subscribed to ${plan.display_name}!`);
          navigate('/dashboard');
        } else {
          message.error('Could not initiate payment. Please try again.');
        }
      }
    } catch (err: any) {
      message.error(err.message || 'Failed to start subscription');
    } finally {
      setCreatingSubscription(false);
    }
  };

  const handlePaymentSuccess = () => {
    setPaymentModalOpen(false);
    message.success('Subscription activated successfully!');
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <MainLayout>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
          }}
        >
          <Spin size='large' tip='Loading plans...' />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <Title level={2}>Choose Your Plan</Title>
          <Paragraph type='secondary' style={{ fontSize: '16px' }}>
            Select the perfect plan for your textile manufacturing business. Upgrade or downgrade at
            any time.
          </Paragraph>
        </div>

        {error && (
          <Alert
            message='Error'
            description={error}
            type='error'
            showIcon
            style={{ marginBottom: '24px' }}
          />
        )}

        <Row gutter={[24, 24]} justify='center'>
          {plans.map(plan => (
            <Col xs={24} sm={12} lg={6} key={plan.id}>
              <Card
                hoverable
                style={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderColor: plan.is_popular ? '#1890ff' : undefined,
                  borderWidth: plan.is_popular ? '2px' : '1px',
                  position: 'relative',
                }}
                bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column' }}
              >
                {plan.is_popular && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      backgroundColor: '#1890ff',
                      color: 'white',
                      padding: '4px 12px',
                      borderBottomLeftRadius: '8px',
                      fontWeight: 'bold',
                      fontSize: '12px',
                    }}
                  >
                    POPULAR
                  </div>
                )}

                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <Title level={3} style={{ margin: '0 0 8px 0' }}>
                    {plan.display_name}
                  </Title>
                  <Text type='secondary'>{plan.description}</Text>
                  <div style={{ marginTop: '16px' }}>
                    <Text style={{ fontSize: '32px', fontWeight: 'bold' }}>
                      ${plan.price_monthly}
                    </Text>
                    <Text type='secondary'>/month</Text>
                  </div>
                </div>

                <List
                  size='small'
                  dataSource={
                    typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features
                  } // Handle parsed/string JSON
                  renderItem={(item: any) => (
                    <List.Item style={{ border: 'none', padding: '4px 0' }}>
                      <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
                      {item}
                    </List.Item>
                  )}
                  style={{ flex: 1, marginBottom: '24px' }}
                />

                <Button
                  type={plan.is_popular ? 'primary' : 'default'}
                  block
                  size='large'
                  onClick={() => handleSubscribe(plan)}
                  loading={creatingSubscription && selectedPlan?.id === plan.id}
                  disabled={creatingSubscription && selectedPlan?.id !== plan.id}
                >
                  {plan.price_monthly === 0 ? 'Start Free Trial' : 'Subscribe Now'}
                </Button>
              </Card>
            </Col>
          ))}
        </Row>

        <PaymentModal
          isOpen={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          clientSecret={clientSecret || ''}
          onSuccess={handlePaymentSuccess}
        />
      </div>
    </MainLayout>
  );
};

export default SubscriptionPlansPage;
