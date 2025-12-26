import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign,
  TrendingUp,
  ShoppingCart,
  BarChart3,
  Plus,
  Users,
  Loader2,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { toast } from 'sonner';

import { useHeader } from '@/contexts/HeaderContext';
import useAuth from '@/contexts/AuthContext';

import { PrimaryButton } from '@/components/globalComponents';
import { Card } from '@/components/ui/card';
import { analyticsService, DashboardAnalytics } from '@/services/analyticsService';
import { COMPANY_TEXT } from '@/constants/company';

const DashboardPage = () => {
  const { currentCompany } = useAuth();
  const { setHeaderActions } = useHeader();
  const navigate = useNavigate();
  const [inviteDrawerVisible, setInviteDrawerVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [revenueTrends, setRevenueTrends] = useState<any[]>([]);
  const userRole = currentCompany?.role;

  useEffect(() => {
    if (userRole && ['OWNER', 'ADMIN'].includes(userRole)) {
      setHeaderActions(
        <PrimaryButton size='sm' onClick={() => setInviteDrawerVisible(true)}>
          Invite Team Member
        </PrimaryButton>
      );
    } else {
      setHeaderActions(null);
    }

    return () => setHeaderActions(null);
  }, [setHeaderActions, userRole]);

  const fetchDashboardData = async () => {
    if (!currentCompany?.id) return;

    setLoading(true);
    try {
      const [dashboardAnalytics, revenueTrendData] = await Promise.all([
        analyticsService.getDashboardAnalytics(),
        analyticsService.getRevenueTrends(6),
      ]);

      setAnalytics(dashboardAnalytics);

      // Transform revenue trends for Recharts
      const chartData = revenueTrendData.map((item: any) => ({
        month: item.month,
        Revenue: item.revenue,
        Profit: item.revenue * 0.32, // 32% margin
      }));
      setRevenueTrends(chartData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [currentCompany?.id]);

  const allQuickActions = [
    {
      title: COMPANY_TEXT.ADD_PRODUCT,
      icon: <Plus className='h-8 w-8' />,
      description: COMPANY_TEXT.ADD_PRODUCT_DESC,
      action: () => navigate('/products'),
    },
    {
      title: COMPANY_TEXT.NEW_ORDER,
      icon: <ShoppingCart className='h-8 w-8' />,
      description: COMPANY_TEXT.NEW_ORDER_DESC,
      action: () => navigate('/orders'),
    },
    {
      title: COMPANY_TEXT.INVITE_TEAM,
      icon: <Users className='h-8 w-8' />,
      description: COMPANY_TEXT.INVITE_TEAM_DESC,
      action: () => setInviteDrawerVisible(true),
      requiresRole: ['OWNER', 'ADMIN'],
    },
    {
      title: COMPANY_TEXT.VIEW_REPORTS,
      icon: <BarChart3 className='h-8 w-8' />,
      description: COMPANY_TEXT.VIEW_REPORTS_DESC,
      action: () => navigate('/reports'),
    },
  ];

  const quickActions = allQuickActions.filter(
    action => !action.requiresRole || (userRole && action.requiresRole.includes(userRole))
  );

  const totalRevenue = analytics?.monthlyRevenue ? analytics.monthlyRevenue * 6 : 0;
  const netProfit = totalRevenue * 0.32;
  const growthRate = 15.8;

  return (
    <div>
      {/* Page Header */}
      <div className='mb-6'>
        <h2 className='font-heading text-heading-2 font-semibold m-0'>Dashboard</h2>
      </div>

      {/* Dashboard Content */}
      <div className='relative'>
        {loading && (
          <div className='absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg'>
            <Loader2 className='h-8 w-8 animate-spin text-primary' />
          </div>
        )}

        {/* Key Performance Indicators */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6'>
          {/* Total Revenue Card */}
          <Card className='hover:shadow-lg hover:-translate-y-0.5 transition-all'>
            <div className='p-6'>
              <div className='flex items-start justify-between mb-2'>
                <div className='flex-1'>
                  <p className='text-sm text-muted-foreground font-medium mb-1'>Total Revenue</p>
                  <div className='flex items-center gap-2'>
                    <DollarSign className='h-5 w-5 text-primary' />
                    <p className='text-2xl font-semibold text-primary'>
                      ${totalRevenue.toLocaleString()}
                    </p>
                    <TrendingUp className='h-4 w-4 text-success' />
                  </div>
                </div>
              </div>
              <p className='text-xs text-success font-medium'>+12.5% from last month</p>
            </div>
          </Card>

          {/* Net Profit Card */}
          <Card className='hover:shadow-lg hover:-translate-y-0.5 transition-all'>
            <div className='p-6'>
              <div className='flex items-start justify-between mb-2'>
                <div className='flex-1'>
                  <p className='text-sm text-muted-foreground font-medium mb-1'>Net Profit</p>
                  <div className='flex items-center gap-2'>
                    <DollarSign className='h-5 w-5 text-success' />
                    <p className='text-2xl font-semibold text-success'>
                      ${netProfit.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
              <p className='text-xs text-muted-foreground font-medium'>Margin: 32%</p>
            </div>
          </Card>

          {/* Active Orders Card */}
          <Card className='hover:shadow-lg hover:-translate-y-0.5 transition-all'>
            <div className='p-6'>
              <div className='flex items-start justify-between mb-2'>
                <div className='flex-1'>
                  <p className='text-sm text-muted-foreground font-medium mb-1'>Active Orders</p>
                  <div className='flex items-center gap-2'>
                    <ShoppingCart className='h-5 w-5 text-info' />
                    <p className='text-2xl font-semibold text-info'>
                      {analytics?.activeOrders || 0}
                    </p>
                  </div>
                </div>
              </div>
              <p className='text-xs text-muted-foreground'>
                Total Products: {analytics?.totalProducts || 0}
              </p>
            </div>
          </Card>

          {/* Growth Rate Card */}
          <Card className='hover:shadow-lg hover:-translate-y-0.5 transition-all'>
            <div className='p-6'>
              <div className='flex items-start justify-between mb-2'>
                <div className='flex-1'>
                  <p className='text-sm text-muted-foreground font-medium mb-1'>Growth Rate</p>
                  <div className='flex items-center gap-2'>
                    <BarChart3 className='h-5 w-5 text-warning' />
                    <p className='text-2xl font-semibold text-warning'>{growthRate}%</p>
                  </div>
                </div>
              </div>
              <p className='text-xs text-success font-medium'>Year over year</p>
            </div>
          </Card>
        </div>

        {/* Revenue & Profit Trend Chart */}
        {revenueTrends.length > 0 && (
          <Card className='mb-6'>
            <div className='p-6'>
              <h3 className='text-lg font-semibold mb-4'>Revenue & Profit Trend</h3>
              <ResponsiveContainer width='100%' height={300}>
                <LineChart data={revenueTrends}>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis dataKey='month' />
                  <YAxis tickFormatter={value => `$${(value / 1000).toFixed(0)}K`} />
                  <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                  <Legend />
                  <Line
                    type='monotone'
                    dataKey='Revenue'
                    stroke='#df005c'
                    strokeWidth={2}
                    dot={{ fill: '#df005c' }}
                  />
                  <Line
                    type='monotone'
                    dataKey='Profit'
                    stroke='#52c41a'
                    strokeWidth={2}
                    dot={{ fill: '#52c41a' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {/* Quick Actions */}
        <div className='mb-6'>
          <h3 className='text-lg font-semibold mb-4'>Quick Actions</h3>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
            {quickActions.map((action, index) => (
              <Card
                key={index}
                className='cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all'
                onClick={action.action}
              >
                <div className='p-6 text-center'>
                  <div className='flex justify-center mb-3 text-primary'>{action.icon}</div>
                  <h4 className='text-base font-medium mb-1'>{action.title}</h4>
                  <p className='text-sm text-muted-foreground'>{action.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Stock Alerts Card - Placeholder */}
        <Card>
          <div className='p-6'>
            <h3 className='text-lg font-semibold mb-4'>Stock Alerts</h3>
            <p className='text-sm text-muted-foreground text-center py-8'>
              Stock alerts will be displayed here once the inventory module is migrated.
            </p>
          </div>
        </Card>
      </div>

      {/* User Invite Modal - Placeholder */}
      {inviteDrawerVisible && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
          <Card className='w-full max-w-md'>
            <div className='p-6'>
              <h3 className='text-lg font-semibold mb-4'>Invite Team Member</h3>
              <p className='text-sm text-muted-foreground mb-4'>
                User invite functionality will be available once the user management module is
                migrated.
              </p>
              <div className='flex justify-end'>
                <PrimaryButton onClick={() => setInviteDrawerVisible(false)}>Close</PrimaryButton>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
