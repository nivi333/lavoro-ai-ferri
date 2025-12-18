import { useEffect, useRef, useState } from 'react';
import { Table, Tag, Space, Button, Dropdown, Empty, message, Input, Select } from 'antd';
import { MoreOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import useAuth from '../../contexts/AuthContext';
import { useHeader } from '../../contexts/HeaderContext';
import { Heading } from '../../components/Heading';
import { GradientButton } from '../../components/ui';
import QualityCheckpointFormDrawer from '../../components/quality/QualityCheckpointFormDrawer';
import { qualityService } from '../../services/qualityService';
import './QualityCheckpointsListPage.scss';

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

export default function QualityCheckpointsListPage() {
  const { currentCompany } = useAuth();
  const { setHeaderActions } = useHeader();
  const [checkpoints, setCheckpoints] = useState<QualityCheckpoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<QualityCheckpoint | null>(null);
  const [searchText, setSearchText] = useState('');
  const [selectedType, setSelectedType] = useState<string | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(undefined);
  const fetchInProgressRef = useRef(false);

  useEffect(() => {
    setHeaderActions(
      <GradientButton onClick={handleCreateCheckpoint} size='small'>
        Create Checkpoint
      </GradientButton>
    );

    return () => setHeaderActions(null);
  }, [setHeaderActions]);

  useEffect(() => {
    if (currentCompany) {
      fetchCheckpoints();
    }
  }, [currentCompany, searchText, selectedType, selectedStatus]);

  const fetchCheckpoints = async () => {
    if (fetchInProgressRef.current) return;

    try {
      fetchInProgressRef.current = true;
      setLoading(true);
      const params: any = {};
      if (searchText) params.search = searchText;
      if (selectedType) params.checkpointType = selectedType;
      if (selectedStatus) params.status = selectedStatus;

      const data = await qualityService.getCheckpoints(params);
      setCheckpoints(data);
    } catch (error: any) {
      console.error('Error fetching checkpoints:', error);
      message.error(error.message || 'Failed to fetch quality checkpoints');
    } finally {
      setLoading(false);
      fetchInProgressRef.current = false;
    }
  };

  const handleCreateCheckpoint = () => {
    setSelectedCheckpoint(null);
    setDrawerVisible(true);
  };

  const handleEditCheckpoint = (checkpoint: QualityCheckpoint) => {
    setSelectedCheckpoint(checkpoint);
    setDrawerVisible(true);
  };

  const handleDeleteCheckpoint = async (checkpoint: QualityCheckpoint) => {
    try {
      await qualityService.deleteCheckpoint(checkpoint.id);
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
    fetchCheckpoints();
    handleDrawerClose();
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PASSED: 'green',
      FAILED: 'red',
      PENDING: 'orange',
      IN_PROGRESS: 'blue',
    };
    return colors[status] || 'default';
  };

  const columns: ColumnsType<QualityCheckpoint> = [
    {
      title: 'Checkpoint ID',
      dataIndex: 'checkpointId',
      key: 'checkpointId',
      width: 140,
      fixed: 'left',
      render: (checkpointId: string) => <span className='checkpoint-id'>{checkpointId}</span>,
    },
    {
      title: 'Checkpoint Name',
      dataIndex: 'checkpointName',
      key: 'checkpointName',
      fixed: 'left',
      ellipsis: true,
      render: (name: string, record: QualityCheckpoint) => (
        <div style={{ overflow: 'hidden' }}>
          <div
            className='checkpoint-name'
            style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
          >
            {name}
          </div>
          <div
            className='checkpoint-type'
            style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
          >
            {record.checkpointType}
          </div>
        </div>
      ),
    },
    {
      title: 'Inspector',
      dataIndex: 'inspectorName',
      key: 'inspectorName',
      width: 150,
      ellipsis: true,
    },
    {
      title: 'Inspection Date',
      dataIndex: 'inspectionDate',
      key: 'inspectionDate',
      width: 140,
      render: (date: string) => dayjs(date).format('MMM DD, YYYY'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => <Tag color={getStatusColor(status)}>{status}</Tag>,
    },
    {
      title: 'Score',
      dataIndex: 'overallScore',
      key: 'overallScore',
      width: 100,
      align: 'center' as const,
      render: (score?: number) =>
        score !== undefined ? <span className='score-value'>{score}%</span> : '-',
    },
    {
      title: 'Defects',
      dataIndex: 'defectCount',
      key: 'defectCount',
      width: 100,
      align: 'center' as const,
      render: (count: number) => <Tag color={count > 0 ? 'red' : 'green'}>{count}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      fixed: 'right',
      render: (_: any, record: QualityCheckpoint) => {
        const menuItems = [
          {
            key: 'edit',
            icon: <EditOutlined />,
            label: 'Edit',
            onClick: () => handleEditCheckpoint(record),
          },
          {
            type: 'divider' as const,
          },
          {
            key: 'delete',
            icon: <DeleteOutlined />,
            label: 'Delete',
            danger: true,
            onClick: () => handleDeleteCheckpoint(record),
          },
        ];

        return (
          <Space>
            <Dropdown menu={{ items: menuItems }} trigger={['click']} placement='bottomRight'>
              <Button type='text' icon={<MoreOutlined />} />
            </Dropdown>
          </Space>
        );
      },
    },
  ];

  return (
    <div className='page-container'>
      <div className='page-header-section'>
        <Heading level={2} className='page-title'>
          Quality Checkpoints
        </Heading>
        <div className='filters-section'>
          <Space size='middle'>
            <Input
              placeholder='Search checkpoints...'
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              style={{ width: 250 }}
              allowClear
            />
            <Select
              placeholder='All Types'
              value={selectedType}
              onChange={setSelectedType}
              style={{ width: 180 }}
              allowClear
            >
              <Select.Option value='INCOMING'>Incoming Material</Select.Option>
              <Select.Option value='IN_PROCESS'>In-Process</Select.Option>
              <Select.Option value='FINAL'>Final Product</Select.Option>
              <Select.Option value='RANDOM'>Random Check</Select.Option>
            </Select>
            <Select
              placeholder='All Status'
              value={selectedStatus}
              onChange={setSelectedStatus}
              style={{ width: 150 }}
              allowClear
            >
              <Select.Option value='PENDING'>Pending</Select.Option>
              <Select.Option value='IN_PROGRESS'>In Progress</Select.Option>
              <Select.Option value='PASSED'>Passed</Select.Option>
              <Select.Option value='FAILED'>Failed</Select.Option>
            </Select>
          </Space>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={checkpoints}
        loading={loading}
        rowKey='id'
        className='checkpoints-table'
        locale={{
          emptyText: (
            <Empty
              description='No quality checkpoints found'
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ),
        }}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: total => `Total ${total} checkpoints`,
        }}
        scroll={{ x: 'max-content' }}
      />

      <QualityCheckpointFormDrawer
        visible={drawerVisible}
        checkpoint={selectedCheckpoint}
        onClose={handleDrawerClose}
        onSuccess={handleDrawerSuccess}
      />
    </div>
  );
}
