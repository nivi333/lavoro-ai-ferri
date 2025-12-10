import React, { useState, useEffect } from 'react';
import { useHeader } from '../../contexts/HeaderContext';
import { Typography, Breadcrumb, Tabs, message } from 'antd';
import MainLayout from '../../components/layout/MainLayout';
import './shared/ReportStyles.scss';
import { reportService } from '../../services/reportService';
import dayjs, { Dayjs } from 'dayjs';
import ReportFilters from './shared/ReportFilters';
import ReportSummaryCards, { SummaryCardProps } from './shared/ReportSummaryCards';

// Import Report Components
import ProfitLossReport from '../../components/reports/financial/ProfitLossReport';
import BalanceSheetReport from '../../components/reports/financial/BalanceSheetReport';
import CashFlowReport from '../../components/reports/financial/CashFlowReport';
import TrialBalanceReport from '../../components/reports/financial/TrialBalanceReport';
import GSTReport from '../../components/reports/financial/GSTReport';
import AccountsReceivableReport from '../../components/reports/financial/AccountsReceivableReport';
import AccountsPayableReport from '../../components/reports/financial/AccountsPayableReport';
import ExpenseSummaryReport from '../../components/reports/financial/ExpenseSummaryReport';

const { Title } = Typography;

const FinancialReportsPage: React.FC = () => {
  const { setHeaderActions } = useHeader();
  const [activeTab, setActiveTab] = useState('profit-loss');

  // Global Filter State
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [singleDate, setSingleDate] = useState<Dayjs | null>(dayjs());
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  // Tab-specific filters
  const [period, setPeriod] = useState<string>('current-month'); // For GST Report

  useEffect(() => {
    const now = dayjs();
    const firstDay = now.startOf('month');
    const lastDay = now.endOf('month');
    setDateRange([firstDay, lastDay]);
  }, []);

  useEffect(() => {
    setHeaderActions(null);
    return () => setHeaderActions(null);
  }, [setHeaderActions]);

  // Determine which date mode to use based on active tab
  const isSingleDateTab = [
    'accounts-receivable',
    'accounts-payable',
    'balance-sheet',
    'trial-balance',
  ].includes(activeTab);
  const isGSTTab = activeTab === 'gst-reports';

  useEffect(() => {
    if (isGSTTab) {
      if (period) handleGenerateReport();
    } else if ((!isSingleDateTab && dateRange) || (isSingleDateTab && singleDate)) {
      handleGenerateReport();
    }
  }, [activeTab, dateRange, singleDate, period]);

  const handleGenerateReport = async () => {
    setLoading(true);
    setReportData(null); // Clear previous data to avoid confusion
    try {
      let data: any;
      const startDateStr = dateRange ? dateRange[0].format('YYYY-MM-DD') : '';
      const endDateStr = dateRange ? dateRange[1].format('YYYY-MM-DD') : '';
      const singleDateStr = singleDate ? singleDate.format('YYYY-MM-DD') : '';

      switch (activeTab) {
        case 'profit-loss':
          data = await reportService.getProfitLossReport(startDateStr, endDateStr);
          break;
        case 'accounts-receivable':
          data = await reportService.getARAgingReport(singleDateStr);
          break;
        case 'accounts-payable':
          // @ts-ignore
          if (reportService.getAPAgingReport) {
            // @ts-ignore
            data = await reportService.getAPAgingReport(singleDateStr);
          }
          break;
        case 'balance-sheet':
          // @ts-ignore
          if (reportService.getBalanceSheetReport) {
            // @ts-ignore
            data = await reportService.getBalanceSheetReport(singleDateStr);
          }
          break;
        case 'cash-flow':
          // @ts-ignore
          if (reportService.getCashFlowReport) {
            // @ts-ignore
            data = await reportService.getCashFlowReport(startDateStr, endDateStr);
          }
          break;
        case 'trial-balance':
          // @ts-ignore
          if (reportService.getTrialBalanceReport) {
            // @ts-ignore
            data = await reportService.getTrialBalanceReport(singleDateStr);
          }
          break;
        case 'expense-summary':
          // @ts-ignore
          if (reportService.getExpenseSummaryReport) {
            // @ts-ignore
            data = await reportService.getExpenseSummaryReport(startDateStr, endDateStr);
          }
          break;
        case 'gst-reports':
          // @ts-ignore
          if (reportService.getGSTReport) {
            // @ts-ignore
            data = await reportService.getGSTReport(period);
          }
          break;
        default:
          // Fallback
          break;
      }

      setReportData(data);
    } catch (error) {
      console.error('Error generating report:', error);
      message.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (key: string) => {
    setActiveTab(key);
  };

  const getSummaryCards = (): SummaryCardProps[] => {
    if (!reportData || !reportData.summary) return [];

    if (activeTab === 'profit-loss') {
      return [
        {
          title: 'Total Revenue',
          value: reportData.summary.totalRevenue?.toFixed(2) || '0.00',
          prefix: '₹',
        },
        {
          title: 'Gross Profit',
          value: reportData.summary.grossProfit?.toFixed(2) || '0.00',
          prefix: '₹',
        },
        {
          title: 'Net Profit',
          value: reportData.summary.netProfit?.toFixed(2) || '0.00',
          prefix: '₹',
        },
        {
          title: 'Profit Margin',
          value: reportData.summary.profitMargin?.toFixed(2) || '0.00',
          suffix: '%',
          color: (reportData.summary.profitMargin || 0) >= 0 ? '#52c41a' : '#ff4d4f',
        },
      ];
    } else if (activeTab === 'accounts-receivable') {
      return [
        {
          title: 'Total Receivables',
          value: reportData.summary.totalReceivables?.toFixed(2) || '0.00',
          prefix: '₹',
        },
        { title: 'Current', value: reportData.summary.current?.toFixed(2) || '0.00', prefix: '₹' },
        {
          title: 'Overdue 90+',
          value: reportData.summary.days90Plus?.toFixed(2) || '0.00',
          prefix: '₹',
          color: '#ff4d4f',
        },
      ];
    } else if (activeTab === 'accounts-payable') {
      return [
        {
          title: 'Total Payables',
          value: reportData.summary.totalPayables?.toFixed(2) || '0.00',
          prefix: '₹',
        },
        { title: 'Current', value: reportData.summary.current?.toFixed(2) || '0.00', prefix: '₹' },
        {
          title: 'Overdue 90+',
          value: reportData.summary.days90Plus?.toFixed(2) || '0.00',
          prefix: '₹',
          color: '#ff4d4f',
        },
      ];
    } else if (activeTab === 'balance-sheet') {
      return [
        {
          title: 'Total Assets',
          value: reportData.summary.totalAssets?.toFixed(2) || '0.00',
          prefix: '₹',
        },
        {
          title: 'Total Liabilities',
          value: reportData.summary.totalLiabilities?.toFixed(2) || '0.00',
          prefix: '₹',
        },
        {
          title: 'Total Equity',
          value: reportData.summary.totalEquity?.toFixed(2) || '0.00',
          prefix: '₹',
        },
      ];
    } else if (activeTab === 'cash-flow') {
      return [
        {
          title: 'Operating CF',
          value: reportData.summary.operatingCashFlow?.toFixed(2) || '0.00',
          prefix: '₹',
        },
        {
          title: 'Investing CF',
          value: reportData.summary.investingCashFlow?.toFixed(2) || '0.00',
          prefix: '₹',
        },
        {
          title: 'Financing CF',
          value: reportData.summary.financingCashFlow?.toFixed(2) || '0.00',
          prefix: '₹',
        },
        {
          title: 'Net Cash Flow',
          value: reportData.summary.netCashFlow?.toFixed(2) || '0.00',
          prefix: '₹',
        },
      ];
    } else if (activeTab === 'trial-balance') {
      return [
        {
          title: 'Total Debits',
          value: reportData.summary.totalDebits?.toFixed(2) || '0.00',
          prefix: '₹',
        },
        {
          title: 'Total Credits',
          value: reportData.summary.totalCredits?.toFixed(2) || '0.00',
          prefix: '₹',
        },
        {
          title: 'Difference',
          value: reportData.summary.difference?.toFixed(2) || '0.00',
          prefix: '₹',
        },
      ];
    } else if (activeTab === 'expense-summary') {
      return [
        {
          title: 'Total Expenses',
          value: reportData.summary.totalExpenses?.toFixed(2) || '0.00',
          prefix: '₹',
        },
        { title: 'Top Category', value: reportData.summary.topCategory || 'N/A' },
        { title: 'Max Month', value: reportData.summary.maxMonth || 'N/A' }, // Assuming these fields exist or simplified
      ];
    } else if (activeTab === 'gst-reports') {
      return [
        {
          title: 'Total GST Collected',
          value: reportData.summary.totalGSTCollected?.toFixed(2) || '0.00',
          prefix: '₹',
        },
        {
          title: 'Total GST Paid',
          value: reportData.summary.totalGSTPaid?.toFixed(2) || '0.00',
          prefix: '₹',
        },
        {
          title: 'Net Payable',
          value: reportData.summary.netGSTPayable?.toFixed(2) || '0.00',
          prefix: '₹',
        },
      ];
    }

    return [];
  };

  return (
    <MainLayout>
      <div className='page-container'>
        <div className='page-header-section'>
          <Breadcrumb
            items={[
              { title: 'Home', href: '/' },
              { title: 'Reports', href: '/reports' },
              { title: 'Financial Reports' },
            ]}
            className='breadcrumb-navigation'
          />
          <Title level={2}>Financial Reports</Title>
        </div>

        <ReportFilters
          dateRange={activeTab === 'gst-reports' ? null : dateRange}
          setDateRange={setDateRange}
          singleDate={singleDate}
          setSingleDate={setSingleDate}
          dateMode={isSingleDateTab ? 'single' : 'range'}
          searchText={searchText}
          setSearchText={setSearchText}
          onGenerate={handleGenerateReport}
          loading={loading}
          showPeriodSelect={activeTab === 'gst-reports'}
          period={period}
          setPeriod={setPeriod}
        />

        <ReportSummaryCards cards={getSummaryCards()} loading={loading} />

        <div className='reports-tabs-container'>
          <Tabs
            activeKey={activeTab}
            onChange={handleTabChange}
            type='card'
            className='reports-tabs'
            destroyOnHidden={true}
            items={[
              {
                key: 'profit-loss',
                label: 'Profit & Loss',
                children: (
                  <ProfitLossReport data={reportData} loading={loading} searchText={searchText} />
                ),
              },
              {
                key: 'balance-sheet',
                label: 'Balance Sheet',
                children: (
                  <BalanceSheetReport data={reportData} loading={loading} searchText={searchText} />
                ),
              },
              {
                key: 'cash-flow',
                label: 'Cash Flow',
                children: (
                  <CashFlowReport data={reportData} loading={loading} searchText={searchText} />
                ),
              },
              {
                key: 'trial-balance',
                label: 'Trial Balance',
                children: (
                  <TrialBalanceReport data={reportData} loading={loading} searchText={searchText} />
                ),
              },
              {
                key: 'gst-reports',
                label: 'GST Reports',
                children: (
                  <GSTReport
                    data={reportData}
                    loading={loading}
                    searchText={searchText}
                    period={period}
                    setPeriod={setPeriod}
                  />
                ),
              },
              {
                key: 'accounts-receivable',
                label: 'Accounts Receivable',
                children: (
                  <AccountsReceivableReport
                    data={reportData}
                    loading={loading}
                    searchText={searchText}
                  />
                ),
              },
              {
                key: 'accounts-payable',
                label: 'Accounts Payable',
                children: (
                  <AccountsPayableReport
                    data={reportData}
                    loading={loading}
                    searchText={searchText}
                  />
                ),
              },
              {
                key: 'expense-summary',
                label: 'Expense Summary',
                children: (
                  <ExpenseSummaryReport
                    data={reportData}
                    loading={loading}
                    searchText={searchText}
                  />
                ),
              },
            ]}
          />
        </div>
      </div>
    </MainLayout>
  );
};

export default FinancialReportsPage;
