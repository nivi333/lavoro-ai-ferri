import React, { useState, useEffect, useRef } from 'react';
import { Table, Button, Tag, Space, Select, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, FileTextOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import ComplianceReportFormDrawer from '../components/quality/ComplianceReportFormDrawer';
import { qualityService } from '../services/qualityService';
import { GradientButton } from '../components/ui';
import './ComplianceReportsListPage.scss';

interface ComplianceReport {
  id: string;
  reportId: string;
  reportType: string;
  reportDate: string;
  auditorName: string;
  certification?: string;
  validityPeriod?: string;
  status: string;
  findings?: string;
  recommendations?: string;
  documentUrl?: string;
  createdAt: string;
}

const ComplianceReportsListPage: React.FC = () => {
  const [reports, setReports] = useState<ComplianceReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ComplianceReport | null>(null);
  const [filters, setFilters] = useState({
    reportType: undefined as string | undefined,
    status: undefined as string | undefined,
  });

  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      fetchReports();
    }
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filters.reportType) params.reportType = filters.reportType;
      if (filters.status) params.status = filters.status;

      const data = await qualityService.getComplianceReports(params);
      setReports(data);
    } catch (error: any) {
      message.error(error.message || 'Failed to fetch compliance reports');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedReport(null);
    setDrawerVisible(true);
  };

  const handleEdit = (record: ComplianceReport) => {
    setSelectedReport(record);
    setDrawerVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await qualityService.deleteComplianceReport(id);
      message.success('Compliance report deleted successfully');
      fetchReports();
    } catch (error: any) {
      message.error(error.message || 'Failed to delete compliance report');
    }
  };

  const handleDrawerClose = () => {
    setDrawerVisible(false);
    setSelectedReport(null);
  };

  const handleDrawerSuccess = () => {
    setDrawerVisible(false);
    setSelectedReport(null);
    fetchReports();
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      COMPLIANT: 'success',
      NON_COMPLIANT: 'error',
      PENDING_REVIEW: 'warning',
      EXPIRED: 'default',
    };
    return colors[status] || 'default';
  };

  const getReportTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      ISO_9001: 'blue',
      ISO_14001: 'green',
      OEKO_TEX: 'purple',
      GOTS: 'cyan',
      WRAP: 'orange',
      SA8000: 'magenta',
      BSCI: 'geekblue',
      SEDEX: 'lime',
    };
    return colors[type] || 'default';
  };

  const columns: ColumnsType<ComplianceReport> = [
    {
      title: 'Report ID',
      dataIndex: 'reportId',
      key: 'reportId',
      width: 120,
      fixed: 'left',
    },
    {
      title: 'Type',
      dataIndex: 'reportType',
      key: 'reportType',
      width: 140,
      render: (type: string) => (
        <Tag color={getReportTypeColor(type)}>{type.replace(/_/g, ' ')}</Tag>
      ),
    },
    {
      title: 'Report Date',
      dataIndex: 'reportDate',
      key: 'reportDate',
      width: 120,
      render: (date: string) => dayjs(date).format('DD MMM YYYY'),
    },
    {
      title: 'Auditor',
      dataIndex: 'auditorName',
      key: 'auditorName',
      width: 150,
    },
    {
      title: 'Certification',
      dataIndex: 'certification',
      key: 'certification',
      width: 150,
      render: (cert: string) => cert || '-',
    },
    {
      title: 'Validity Period',
      dataIndex: 'validityPeriod',
      key: 'validityPeriod',
      width: 140,
      render: (period: string) => period || '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{status.replace(/_/g, ' ')}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_: any, record: ComplianceReport) => (
        <Space size="small">
          {record.documentUrl && (
            <Button
              type="text"
              size="small"
              icon={<FileTextOutlined />}
              onClick={() => window.open(record.documentUrl, '_blank')}
              title="View Document"
            />
          )}
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            title="Edit"
          />
          <Popconfirm
            title="Delete Report"
            description="Are you sure you want to delete this compliance report?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              title="Delete"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="compliance-reports-page">
      <div className="page-header">
        <div className="header-left">
          <h1>Compliance Reports</h1>
          <p>Manage compliance certifications and audit reports</p>
        </div>
        <div className="header-right">
          <GradientButton
            onClick={handleCreate}
            size="middle"
          >
            <PlusOutlined /> Create Report
          </GradientButton>
        </div>
      </div>

      <div className="filters-section">
        <Space size="middle" wrap>
          <Select
            placeholder="Filter by Type"
            style={{ width: 200 }}
            allowClear
            value={filters.reportType}
            onChange={(value) => {
              setFilters({ ...filters, reportType: value });
              fetchReports();
            }}
          >
            <Select.Option value="ISO_9001">ISO 9001</Select.Option>
            <Select.Option value="ISO_14001">ISO 14001</Select.Option>
            <Select.Option value="OEKO_TEX">OEKO-TEX</Select.Option>
            <Select.Option value="GOTS">GOTS</Select.Option>
            <Select.Option value="WRAP">WRAP</Select.Option>
            <Select.Option value="SA8000">SA8000</Select.Option>
            <Select.Option value="BSCI">BSCI</Select.Option>
            <Select.Option value="SEDEX">SEDEX</Select.Option>
          </Select>

          <Select
            placeholder="Filter by Status"
            style={{ width: 180 }}
            allowClear
            value={filters.status}
            onChange={(value) => {
              setFilters({ ...filters, status: value });
              fetchReports();
            }}
          >
            <Select.Option value="COMPLIANT">Compliant</Select.Option>
            <Select.Option value="NON_COMPLIANT">Non-Compliant</Select.Option>
            <Select.Option value="PENDING_REVIEW">Pending Review</Select.Option>
            <Select.Option value="EXPIRED">Expired</Select.Option>
          </Select>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={reports}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} reports`,
        }}
        scroll={{ x: 1200 }}
      />

      <ComplianceReportFormDrawer
        visible={drawerVisible}
        report={selectedReport}
        onClose={handleDrawerClose}
        onSuccess={handleDrawerSuccess}
      />
    </div>
  );
};

export default ComplianceReportsListPage;
