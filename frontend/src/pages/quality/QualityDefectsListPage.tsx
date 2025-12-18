import { useEffect, useRef, useState } from 'react';
import { Table, Tag, Space, Button, Dropdown, Empty, message, Input, Select } from 'antd';
import {
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import useAuth from '../../contexts/AuthContext';
import { useHeader } from '../../contexts/HeaderContext';
import { Heading } from '../../components/Heading';
import { GradientButton } from '../../components/ui';
import QualityDefectFormDrawer from '../../components/quality/QualityDefectFormDrawer';
import { qualityService } from '../../services/qualityService';
import './QualityDefectsListPage.scss';

interface QualityDefect {
  id: string;
  defectId: string;
  defectCategory: string;
  defectType: string;
  severity: string;
  quantity: number;
  description?: string;
  resolutionStatus: string;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
}

export default function QualityDefectsListPage() {
  const { currentCompany } = useAuth();
  const { setHeaderActions } = useHeader();
  const [defects, setDefects] = useState<QualityDefect[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(undefined);
  const fetchInProgressRef = useRef(false);

  useEffect(() => {
    setHeaderActions(
      <GradientButton onClick={handleCreateDefect} size='small'>
        Report Defect
      </GradientButton>
    );

    return () => setHeaderActions(null);
  }, [setHeaderActions]);

  useEffect(() => {
    if (currentCompany) {
      fetchDefects();
    }
  }, [currentCompany, searchText, selectedSeverity, selectedStatus]);

  const fetchDefects = async () => {
    if (fetchInProgressRef.current) return;

    try {
      fetchInProgressRef.current = true;
      setLoading(true);
      const params: any = {};
      if (searchText) params.search = searchText;
      if (selectedSeverity) params.severity = selectedSeverity;
      if (selectedStatus) params.resolutionStatus = selectedStatus;

      const data = await qualityService.getDefects(params);
      setDefects(data);
    } catch (error: any) {
      console.error('Error fetching defects:', error);
      message.error(error.message || 'Failed to fetch quality defects');
    } finally {
      setLoading(false);
      fetchInProgressRef.current = false;
    }
  };

  const handleCreateDefect = () => {
    setDrawerVisible(true);
  };

  const handleEditDefect = (_defect: QualityDefect) => {
    setDrawerVisible(true);
  };

  const handleResolveDefect = async (defect: QualityDefect) => {
    try {
      await qualityService.resolveDefect(defect.id, currentCompany?.id || '', 'Defect resolved');
      message.success('Defect marked as resolved');
      fetchDefects();
    } catch (error: any) {
      message.error(error.message || 'Failed to resolve defect');
    }
  };

  const handleDeleteDefect = async (defect: QualityDefect) => {
    try {
      await qualityService.deleteDefect(defect.id);
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
    fetchDefects();
    handleDrawerClose();
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      CRITICAL: 'red',
      HIGH: 'orange',
      MEDIUM: 'gold',
      LOW: 'blue',
    };
    return colors[severity] || 'default';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      OPEN: 'red',
      IN_PROGRESS: 'blue',
      RESOLVED: 'green',
      CLOSED: 'default',
    };
    return colors[status] || 'default';
  };

  const columns: ColumnsType<QualityDefect> = [
    {
      title: 'Defect ID',
      dataIndex: 'defectId',
      key: 'defectId',
      width: 120,
      fixed: 'left',
      render: (defectId: string) => <span className='defect-id'>{defectId}</span>,
    },
    {
      title: 'Defect Type',
      dataIndex: 'defectType',
      key: 'defectType',
      fixed: 'left',
      ellipsis: true,
      render: (type: string, record: QualityDefect) => (
        <div style={{ overflow: 'hidden' }}>
          <div
            className='defect-type'
            style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
          >
            {type}
          </div>
          <div
            className='defect-category'
            style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
          >
            {record.defectCategory}
          </div>
        </div>
      ),
    },
    {
      title: 'Severity',
      dataIndex: 'severity',
      key: 'severity',
      width: 120,
      render: (severity: string) => <Tag color={getSeverityColor(severity)}>{severity}</Tag>,
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      align: 'center' as const,
    },
    {
      title: 'Status',
      dataIndex: 'resolutionStatus',
      key: 'resolutionStatus',
      width: 130,
      render: (status: string) => <Tag color={getStatusColor(status)}>{status}</Tag>,
    },
    {
      title: 'Reported Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 140,
      render: (date: string) => dayjs(date).format('MMM DD, YYYY'),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      fixed: 'right',
      render: (_: any, record: QualityDefect) => {
        const menuItems = [
          {
            key: 'edit',
            icon: <EditOutlined />,
            label: 'Edit',
            onClick: () => handleEditDefect(record),
          },
          ...(record.resolutionStatus !== 'RESOLVED' && record.resolutionStatus !== 'CLOSED'
            ? [
                {
                  key: 'resolve',
                  icon: <CheckOutlined />,
                  label: 'Mark Resolved',
                  onClick: () => handleResolveDefect(record),
                },
              ]
            : []),
          {
            type: 'divider' as const,
          },
          {
            key: 'delete',
            icon: <DeleteOutlined />,
            label: 'Delete',
            danger: true,
            onClick: () => handleDeleteDefect(record),
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
          Quality Defects
        </Heading>
      </div>

      <div className='filters-section'>
        <Space size='middle'>
          <Input
            placeholder='Search defects...'
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ width: 250 }}
            allowClear
          />
          <Select
            placeholder='All Severities'
            value={selectedSeverity}
            onChange={setSelectedSeverity}
            style={{ width: 150 }}
            allowClear
          >
            <Select.Option value='CRITICAL'>Critical</Select.Option>
            <Select.Option value='HIGH'>High</Select.Option>
            <Select.Option value='MEDIUM'>Medium</Select.Option>
            <Select.Option value='LOW'>Low</Select.Option>
          </Select>
          <Select
            placeholder='All Status'
            value={selectedStatus}
            onChange={setSelectedStatus}
            style={{ width: 150 }}
            allowClear
          >
            <Select.Option value='OPEN'>Open</Select.Option>
            <Select.Option value='IN_PROGRESS'>In Progress</Select.Option>
            <Select.Option value='RESOLVED'>Resolved</Select.Option>
            <Select.Option value='CLOSED'>Closed</Select.Option>
          </Select>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={defects}
        loading={loading}
        rowKey='id'
        className='defects-table'
        locale={{
          emptyText: (
            <Empty description='No quality defects found' image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ),
        }}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: total => `Total ${total} defects`,
        }}
        scroll={{ x: 'max-content' }}
      />

      <QualityDefectFormDrawer
        visible={drawerVisible}
        onClose={handleDrawerClose}
        onSuccess={handleDrawerSuccess}
      />
    </div>
  );
}
