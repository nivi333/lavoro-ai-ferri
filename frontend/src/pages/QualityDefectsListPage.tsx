import React, { useState, useEffect, useRef } from 'react';
import { Table, Button, Tag, Space, Select, message, Modal } from 'antd';
import { PlusOutlined, SearchOutlined, FilterOutlined, CheckOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import QualityDefectFormDrawer from '../components/quality/QualityDefectFormDrawer';
import { qualityService } from '../services/qualityService';
import './QualityDefectsListPage.scss';

interface QualityDefect {
  id: string;
  defectId: string;
  checkpointId: string;
  checkpointName: string;
  defectCategory: string;
  defectType: string;
  severity: string;
  quantity: number;
  resolutionStatus: string;
  createdAt: string;
}

const QualityDefectsListPage: React.FC = () => {
  const [defects, setDefects] = useState<QualityDefect[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [filters, setFilters] = useState({
    defectCategory: undefined as string | undefined,
    severity: undefined as string | undefined,
    resolutionStatus: undefined as string | undefined,
  });

  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      fetchDefects();
    }
  }, []);

  const fetchDefects = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filters.defectCategory) params.defectCategory = filters.defectCategory;
      if (filters.severity) params.severity = filters.severity;
      if (filters.resolutionStatus) params.resolutionStatus = filters.resolutionStatus;

      const data = await qualityService.getDefects(params);
      setDefects(data);
    } catch (error: any) {
      message.error(error.message || 'Failed to fetch quality defects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setDrawerVisible(true);
  };

  const handleResolve = (record: QualityDefect) => {
    Modal.confirm({
      title: 'Resolve Defect',
      content: `Are you sure you want to mark defect ${record.defectId} as resolved?`,
      onOk: async () => {
        try {
          await qualityService.resolveDefect(record.id, 'Current User', 'Defect resolved');
          message.success('Defect resolved successfully');
          fetchDefects();
        } catch (error: any) {
          message.error(error.message || 'Failed to resolve defect');
        }
      },
    });
  };

  const handleDelete = async (id: string) => {
    try {
      await qualityService.deleteDefect(id);
      message.success('Quality defect deleted successfully');
      fetchDefects();
    } catch (error: any) {
      message.error(error.message || 'Failed to delete quality defect');
    }
  };

  const handleDrawerClose = () => {
    setDrawerVisible(false);
  };

  const handleDrawerSuccess = () => {
    setDrawerVisible(false);
    fetchDefects();
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      CRITICAL: 'red',
      MAJOR: 'orange',
      MINOR: 'gold',
    };
    return colors[severity] || 'default';
  };

  const getResolutionStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      OPEN: 'red',
      IN_PROGRESS: 'processing',
      RESOLVED: 'success',
      REJECTED: 'default',
    };
    return colors[status] || 'default';
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      FABRIC: 'Fabric',
      STITCHING: 'Stitching',
      COLOR: 'Color',
      MEASUREMENT: 'Measurement',
      PACKAGING: 'Packaging',
      FINISHING: 'Finishing',
      LABELING: 'Labeling',
    };
    return labels[category] || category;
  };

  const columns: ColumnsType<QualityDefect> = [
    {
      title: 'Defect ID',
      dataIndex: 'defectId',
      key: 'defectId',
      width: 120,
      fixed: 'left',
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: 'Checkpoint',
      dataIndex: 'checkpointId',
      key: 'checkpointId',
      width: 120,
      render: (text, record) => (
        <div>
          <div><strong>{text}</strong></div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.checkpointName}</div>
        </div>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'defectCategory',
      key: 'defectCategory',
      width: 120,
      render: (category) => <Tag color="blue">{getCategoryLabel(category)}</Tag>,
    },
    {
      title: 'Defect Type',
      dataIndex: 'defectType',
      key: 'defectType',
      width: 150,
    },
    {
      title: 'Severity',
      dataIndex: 'severity',
      key: 'severity',
      width: 100,
      render: (severity) => (
        <Tag color={getSeverityColor(severity)}>
          {severity}
        </Tag>
      ),
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80,
      render: (qty) => <Tag>{qty}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'resolutionStatus',
      key: 'resolutionStatus',
      width: 120,
      render: (status) => (
        <Tag color={getResolutionStatusColor(status)}>
          {status.replace(/_/g, ' ')}
        </Tag>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date) => dayjs(date).format('DD MMM YYYY'),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          {record.resolutionStatus === 'OPEN' && (
            <Button
              type="text"
              size="small"
              icon={<CheckOutlined />}
              onClick={() => handleResolve(record)}
            />
          )}
          <Button
            type="text"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="quality-defects-page">
      <div className="page-header">
        <div className="header-left">
          <h1>Quality Defects</h1>
          <p>Track and manage quality defects</p>
        </div>
        <div className="header-right">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
            className="create-button"
          >
            Report Defect
          </Button>
        </div>
      </div>

      <div className="filters-section">
        <Space size="middle" wrap>
          <Select
            placeholder="Category"
            style={{ width: 150 }}
            allowClear
            value={filters.defectCategory}
            onChange={(value) => setFilters({ ...filters, defectCategory: value })}
          >
            <Select.Option value="FABRIC">Fabric</Select.Option>
            <Select.Option value="STITCHING">Stitching</Select.Option>
            <Select.Option value="COLOR">Color</Select.Option>
            <Select.Option value="MEASUREMENT">Measurement</Select.Option>
            <Select.Option value="PACKAGING">Packaging</Select.Option>
            <Select.Option value="FINISHING">Finishing</Select.Option>
            <Select.Option value="LABELING">Labeling</Select.Option>
          </Select>

          <Select
            placeholder="Severity"
            style={{ width: 120 }}
            allowClear
            value={filters.severity}
            onChange={(value) => setFilters({ ...filters, severity: value })}
          >
            <Select.Option value="CRITICAL">Critical</Select.Option>
            <Select.Option value="MAJOR">Major</Select.Option>
            <Select.Option value="MINOR">Minor</Select.Option>
          </Select>

          <Select
            placeholder="Status"
            style={{ width: 150 }}
            allowClear
            value={filters.resolutionStatus}
            onChange={(value) => setFilters({ ...filters, resolutionStatus: value })}
          >
            <Select.Option value="OPEN">Open</Select.Option>
            <Select.Option value="IN_PROGRESS">In Progress</Select.Option>
            <Select.Option value="RESOLVED">Resolved</Select.Option>
            <Select.Option value="REJECTED">Rejected</Select.Option>
          </Select>

          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={fetchDefects}
          >
            Search
          </Button>

          <Button
            icon={<FilterOutlined />}
            onClick={() => {
              setFilters({ defectCategory: undefined, severity: undefined, resolutionStatus: undefined });
              fetchedRef.current = false;
              fetchDefects();
            }}
          >
            Clear
          </Button>
        </Space>
      </div>

      <div className="table-section">
        <Table
          columns={columns}
          dataSource={defects}
          loading={loading}
          rowKey="id"
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} defects`,
          }}
        />
      </div>

      <QualityDefectFormDrawer
        visible={drawerVisible}
        onClose={handleDrawerClose}
        onSuccess={handleDrawerSuccess}
      />
    </div>
  );
};

export default QualityDefectsListPage;
