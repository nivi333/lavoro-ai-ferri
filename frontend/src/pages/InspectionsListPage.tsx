import { useEffect, useRef, useState } from 'react';
import { Table, Tag, Space, Button, Dropdown, Empty, message, Input, Select } from 'antd';
import {
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import useAuth from '../contexts/AuthContext';
import { useHeader } from '../contexts/HeaderContext';
import { MainLayout } from '../components/layout';
import { Heading } from '../components/Heading';
import { GradientButton } from '../components/ui';
import { inspectionService, Inspection } from '../services/inspectionService';
import InspectionFormDrawer from '../components/quality/InspectionFormDrawer';

dayjs.extend(relativeTime);

export default function InspectionsListPage() {
  const { currentCompany } = useAuth();
  const { setHeaderActions } = useHeader();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);
  const [searchText, setSearchText] = useState('');
  const [selectedType, setSelectedType] = useState<string | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(undefined);
  const [selectedReferenceType, setSelectedReferenceType] = useState<string | undefined>(undefined);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const fetchInProgressRef = useRef(false);

  useEffect(() => {
    setHeaderActions(
      <GradientButton onClick={handleCreateInspection} size='small'>
        Create Inspection
      </GradientButton>
    );

    return () => setHeaderActions(null);
  }, [setHeaderActions]);

  useEffect(() => {
    if (currentCompany) {
      fetchInspections();
    }
  }, [
    currentCompany,
    searchText,
    selectedType,
    selectedStatus,
    selectedReferenceType,
    pagination.page,
  ]);

  const fetchInspections = async () => {
    if (fetchInProgressRef.current) return;

    try {
      fetchInProgressRef.current = true;
      setLoading(true);
      const params: any = {};
      if (searchText) params.search = searchText;
      if (selectedType) params.inspectionType = selectedType;
      if (selectedStatus) params.status = selectedStatus;
      if (selectedReferenceType) params.referenceType = selectedReferenceType;

      const data = await inspectionService.getInspections(params);
      setInspections(data);
      setPagination({
        ...pagination,
        total: data.length,
        totalPages: Math.ceil(data.length / pagination.limit),
      });
    } catch (error: any) {
      console.error('Error fetching inspections:', error);
      message.error(error.message || 'Failed to fetch inspections');
    } finally {
      setLoading(false);
      fetchInProgressRef.current = false;
    }
  };

  const handleCreateInspection = () => {
    setSelectedInspection(null);
    setDrawerVisible(true);
  };

  const handleEditInspection = (inspection: Inspection) => {
    setSelectedInspection(inspection);
    setDrawerVisible(true);
  };

  const handleViewInspection = (inspection: Inspection) => {
    // Navigate to details page
    window.location.href = `/inspections/${inspection.id}`;
  };

  const handleDeleteInspection = async (inspection: Inspection) => {
    try {
      await inspectionService.deleteInspection(inspection.id);
      message.success('Inspection deleted successfully');
      fetchInspections();
    } catch (error: any) {
      message.error(error.message || 'Failed to delete inspection');
    }
  };

  const handleDrawerClose = () => {
    setDrawerVisible(false);
    setSelectedInspection(null);
  };

  const handleDrawerSuccess = () => {
    handleDrawerClose();
    fetchInspections();
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'default',
      IN_PROGRESS: 'processing',
      PASSED: 'success',
      FAILED: 'error',
      CONDITIONAL: 'warning',
    };
    return colors[status] || 'default';
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      INCOMING_MATERIAL: 'blue',
      IN_PROCESS: 'orange',
      FINAL_PRODUCT: 'green',
      RANDOM_CHECK: 'purple',
    };
    return colors[type] || 'default';
  };

  const columns: ColumnsType<Inspection> = [
    {
      title: 'Code',
      dataIndex: 'inspectionNumber',
      key: 'inspectionNumber',
      width: 80,
      render: text => <span className='font-semibold text-xs'>{text}</span>,
    },
    {
      title: 'Type',
      dataIndex: 'inspectionType',
      key: 'inspectionType',
      width: 120,
      render: type => (
        <Tag
          color={getTypeColor(type)}
          title={type.replace(/_/g, ' ')}
          style={{
            maxWidth: '100px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            display: 'inline-block',
          }}
        >
          {type.replace(/_/g, ' ')}
        </Tag>
      ),
    },
    {
      title: 'Reference',
      key: 'reference',
      width: 120,
      render: (_, record) => (
        <span
          className='text-sm font-medium'
          title={`${record.referenceType}: ${record.referenceId}`}
        >
          {record.referenceType}: {record.referenceId}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: status => (
        <Tag color={getStatusColor(status)} title={status.replace(/_/g, ' ')}>
          {status.replace(/_/g, ' ')}
        </Tag>
      ),
    },
    {
      title: 'Quality Score',
      dataIndex: 'qualityScore',
      key: 'qualityScore',
      width: 120,
      render: score => (
        <span>{score !== undefined && score !== null ? `${score.toFixed(1)}%` : '-'}</span>
      ),
    },
    {
      title: 'Inspector',
      key: 'inspector',
      width: 150,
      render: (_, record) => (
        <span>
          {record.inspectorName ||
            (record.inspector ? `${record.inspector.firstName} ${record.inspector.lastName}` : '-')}
        </span>
      ),
    },
    {
      title: 'Inspection Date',
      key: 'inspectionDate',
      width: 150,
      render: (_, record) => {
        const date = record.inspectionDate || record.scheduledDate;
        return date ? dayjs(date).format('DD MMM YYYY') : '-';
      },
    },
    {
      title: 'Next Schedule',
      key: 'nextInspectionDate',
      width: 120,
      render: (_, record) => {
        return record.nextInspectionDate ? dayjs(record.nextInspectionDate).format('DD MMM YYYY') : '-';
      },
    },
    {
      title: 'Active',
      key: 'isActive',
      width: 80,
      render: (_, record) => (
        <Tag color={record.isActive ? 'green' : 'red'}>
          {record.isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              {
                key: 'view',
                icon: <EyeOutlined />,
                label: 'View Details',
                onClick: () => handleViewInspection(record),
              },
              {
                key: 'edit',
                icon: <EditOutlined />,
                label: 'Edit',
                onClick: () => handleEditInspection(record),
              },
              {
                key: 'delete',
                icon: <DeleteOutlined />,
                label: 'Delete',
                danger: true,
                onClick: () => handleDeleteInspection(record),
              },
            ],
          }}
          trigger={['click']}
        >
          <Button type='text' icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  return (
    <MainLayout>
      <div className='inspections-list-page'>
        <Heading level={2} className='page-title'>
          Quality Inspections
        </Heading>

        {/* Filters */}
        <div className='filters-section'>
          <Space wrap className='filters-group'>
            <Input
              placeholder='Search by code or reference...'
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              style={{ width: 250 }}
            />
            <Select
              placeholder='Inspection Type'
              value={selectedType}
              onChange={setSelectedType}
              allowClear
              style={{ width: 180 }}
              options={[
                { label: 'Incoming Material', value: 'INCOMING_MATERIAL' },
                { label: 'In Process', value: 'IN_PROCESS' },
                { label: 'Final Product', value: 'FINAL_PRODUCT' },
                { label: 'Random Check', value: 'RANDOM_CHECK' },
              ]}
            />
            <Select
              placeholder='Status'
              value={selectedStatus}
              onChange={setSelectedStatus}
              allowClear
              style={{ width: 150 }}
              options={[
                { label: 'Pending', value: 'PENDING' },
                { label: 'In Progress', value: 'IN_PROGRESS' },
                { label: 'Passed', value: 'PASSED' },
                { label: 'Failed', value: 'FAILED' },
                { label: 'Conditional', value: 'CONDITIONAL' },
              ]}
            />
            <Select
              placeholder='Reference Type'
              value={selectedReferenceType}
              onChange={setSelectedReferenceType}
              allowClear
              style={{ width: 150 }}
              options={[
                { label: 'Product', value: 'PRODUCT' },
                { label: 'Order', value: 'ORDER' },
                { label: 'Batch', value: 'BATCH' },
              ]}
            />
          </Space>
        </div>

        {/* Table */}
        <div className='table-section'>
          {inspections.length === 0 && !loading ? (
            <Empty description='No inspections found' style={{ marginTop: 50 }} />
          ) : (
            <Table
              columns={columns}
              dataSource={inspections}
              loading={loading}
              rowKey='id'
              pagination={{
                current: pagination.page,
                pageSize: pagination.limit,
                total: pagination.total,
                onChange: page => setPagination({ ...pagination, page }),
              }}
              scroll={{ x: 1200 }}
            />
          )}
        </div>

        {/* Drawer */}
        <InspectionFormDrawer
          visible={drawerVisible}
          inspection={selectedInspection}
          onClose={handleDrawerClose}
          onSuccess={handleDrawerSuccess}
        />
      </div>
    </MainLayout>
  );
}
