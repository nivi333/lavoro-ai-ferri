import React, { useState, useEffect, useRef } from 'react';
import { Table, Button, Tag, Space, Select, DatePicker, message } from 'antd';
import { PlusOutlined, SearchOutlined, FilterOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import QualityCheckpointFormDrawer from '../components/quality/QualityCheckpointFormDrawer';
import { qualityService } from '../services/qualityService';
import './QualityCheckpointsListPage.scss';

const { RangePicker } = DatePicker;

interface QualityCheckpoint {
  id: string;
  checkpointId: string;
  checkpointType: string;
  checkpointName: string;
  inspectorName: string;
  inspectionDate: string;
  status: string;
  overallScore?: number;
  defectCount: number;
  metricCount: number;
  createdAt: string;
}

const QualityCheckpointsListPage: React.FC = () => {
  const [checkpoints, setCheckpoints] = useState<QualityCheckpoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<QualityCheckpoint | null>(null);
  const [filters, setFilters] = useState({
    checkpointType: undefined as string | undefined,
    status: undefined as string | undefined,
    dateRange: null as [dayjs.Dayjs, dayjs.Dayjs] | null,
  });

  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      fetchCheckpoints();
    }
  }, []);

  const fetchCheckpoints = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filters.checkpointType) params.checkpointType = filters.checkpointType;
      if (filters.status) params.status = filters.status;
      if (filters.dateRange) {
        params.startDate = filters.dateRange[0].toISOString();
        params.endDate = filters.dateRange[1].toISOString();
      }

      const data = await qualityService.getCheckpoints(params);
      setCheckpoints(data);
    } catch (error: any) {
      message.error(error.message || 'Failed to fetch quality checkpoints');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedCheckpoint(null);
    setDrawerVisible(true);
  };

  const handleEdit = (record: QualityCheckpoint) => {
    setSelectedCheckpoint(record);
    setDrawerVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await qualityService.deleteCheckpoint(id);
      message.success('Quality checkpoint deleted successfully');
      fetchCheckpoints();
    } catch (error: any) {
      message.error(error.message || 'Failed to delete quality checkpoint');
    }
  };

  const handleDrawerClose = () => {
    setDrawerVisible(false);
    setSelectedCheckpoint(null);
  };

  const handleDrawerSuccess = () => {
    setDrawerVisible(false);
    setSelectedCheckpoint(null);
    fetchCheckpoints();
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'default',
      IN_PROGRESS: 'processing',
      PASSED: 'success',
      FAILED: 'error',
      CONDITIONAL_PASS: 'warning',
      REWORK_REQUIRED: 'orange',
    };
    return colors[status] || 'default';
  };

  const getCheckpointTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      INCOMING_MATERIAL: 'Incoming Material',
      IN_PROCESS: 'In Process',
      FINAL_INSPECTION: 'Final Inspection',
      PACKAGING: 'Packaging',
      RANDOM_SAMPLING: 'Random Sampling',
    };
    return labels[type] || type;
  };

  const columns: ColumnsType<QualityCheckpoint> = [
    {
      title: 'Checkpoint ID',
      dataIndex: 'checkpointId',
      key: 'checkpointId',
      width: 120,
      fixed: 'left',
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: 'Checkpoint Name',
      dataIndex: 'checkpointName',
      key: 'checkpointName',
      width: 200,
    },
    {
      title: 'Type',
      dataIndex: 'checkpointType',
      key: 'checkpointType',
      width: 150,
      render: (type) => <Tag color="blue">{getCheckpointTypeLabel(type)}</Tag>,
    },
    {
      title: 'Inspector',
      dataIndex: 'inspectorName',
      key: 'inspectorName',
      width: 150,
    },
    {
      title: 'Inspection Date',
      dataIndex: 'inspectionDate',
      key: 'inspectionDate',
      width: 120,
      render: (date) => dayjs(date).format('DD MMM YYYY'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status.replace(/_/g, ' ')}
        </Tag>
      ),
    },
    {
      title: 'Score',
      dataIndex: 'overallScore',
      key: 'overallScore',
      width: 80,
      render: (score) => score ? `${score}%` : '-',
    },
    {
      title: 'Defects',
      dataIndex: 'defectCount',
      key: 'defectCount',
      width: 80,
      render: (count) => (
        <Tag color={count > 0 ? 'red' : 'green'}>{count}</Tag>
      ),
    },
    {
      title: 'Metrics',
      dataIndex: 'metricCount',
      key: 'metricCount',
      width: 80,
      render: (count) => <Tag>{count}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
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
    <div className="quality-checkpoints-page">
      <div className="page-header">
        <div className="header-left">
          <h1>Quality Checkpoints</h1>
          <p>Manage quality inspection checkpoints</p>
        </div>
        <div className="header-right">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
            className="create-button"
          >
            Create Checkpoint
          </Button>
        </div>
      </div>

      <div className="filters-section">
        <Space size="middle" wrap>
          <Select
            placeholder="Checkpoint Type"
            style={{ width: 180 }}
            allowClear
            value={filters.checkpointType}
            onChange={(value) => setFilters({ ...filters, checkpointType: value })}
          >
            <Select.Option value="INCOMING_MATERIAL">Incoming Material</Select.Option>
            <Select.Option value="IN_PROCESS">In Process</Select.Option>
            <Select.Option value="FINAL_INSPECTION">Final Inspection</Select.Option>
            <Select.Option value="PACKAGING">Packaging</Select.Option>
            <Select.Option value="RANDOM_SAMPLING">Random Sampling</Select.Option>
          </Select>

          <Select
            placeholder="Status"
            style={{ width: 150 }}
            allowClear
            value={filters.status}
            onChange={(value) => setFilters({ ...filters, status: value })}
          >
            <Select.Option value="PENDING">Pending</Select.Option>
            <Select.Option value="IN_PROGRESS">In Progress</Select.Option>
            <Select.Option value="PASSED">Passed</Select.Option>
            <Select.Option value="FAILED">Failed</Select.Option>
            <Select.Option value="CONDITIONAL_PASS">Conditional Pass</Select.Option>
            <Select.Option value="REWORK_REQUIRED">Rework Required</Select.Option>
          </Select>

          <RangePicker
            value={filters.dateRange}
            onChange={(dates) => setFilters({ ...filters, dateRange: dates as [dayjs.Dayjs, dayjs.Dayjs] | null })}
            format="DD MMM YYYY"
          />

          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={fetchCheckpoints}
          >
            Search
          </Button>

          <Button
            icon={<FilterOutlined />}
            onClick={() => {
              setFilters({ checkpointType: undefined, status: undefined, dateRange: null });
              fetchedRef.current = false;
              fetchCheckpoints();
            }}
          >
            Clear
          </Button>
        </Space>
      </div>

      <div className="table-section">
        <Table
          columns={columns}
          dataSource={checkpoints}
          loading={loading}
          rowKey="id"
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} checkpoints`,
          }}
        />
      </div>

      <QualityCheckpointFormDrawer
        visible={drawerVisible}
        checkpoint={selectedCheckpoint}
        onClose={handleDrawerClose}
        onSuccess={handleDrawerSuccess}
      />
    </div>
  );
};

export default QualityCheckpointsListPage;
