import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, Button, Space, Tag, Spin, message, Divider, Card, Row, Col, Empty, Table } from 'antd';
import { ArrowLeftOutlined, DeleteOutlined, PrinterOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { MainLayout } from '../../components/layout';
import { Heading } from '../../components/Heading';
import { GradientButton } from '../../components/ui';
import { inspectionService, InspectionDetail } from '../../services/inspectionService';
import InspectionFormDrawer from '../../components/quality/InspectionFormDrawer';

dayjs.extend(relativeTime);

export default function InspectionDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [inspection, setInspection] = useState<InspectionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [drawerVisible, setDrawerVisible] = useState(false);

  useEffect(() => {
    if (id) {
      fetchInspection();
    }
  }, [id]);

  const fetchInspection = async () => {
    try {
      setLoading(true);
      const data = await inspectionService.getInspectionById(id!);
      setInspection(data);
    } catch (error: any) {
      console.error('Error fetching inspection:', error);
      message.error(error.message || 'Failed to fetch inspection');
      navigate('/inspections');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await inspectionService.deleteInspection(id!);
      message.success('Inspection deleted successfully');
      navigate('/inspections');
    } catch (error: any) {
      message.error(error.message || 'Failed to delete inspection');
    }
  };

  const handleDrawerSuccess = () => {
    setDrawerVisible(false);
    fetchInspection();
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

  if (loading) {
    return (
      <MainLayout>
        <div className='inspection-details-page'>
          <Spin size='large' style={{ marginTop: 50 }} />
        </div>
      </MainLayout>
    );
  }

  if (!inspection) {
    return (
      <MainLayout>
        <div className='inspection-details-page'>
          <Empty description='Inspection not found' style={{ marginTop: 50 }} />
        </div>
      </MainLayout>
    );
  }

  const checkpointColumns = [
    {
      title: 'Checkpoint',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <span className='font-semibold'>{text}</span>,
    },
    {
      title: 'Type',
      dataIndex: 'evaluationType',
      key: 'evaluationType',
      render: (type: string) => <Tag>{type}</Tag>,
    },
    {
      title: 'Result',
      dataIndex: 'result',
      key: 'result',
      render: (result: string) => result || '-',
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      render: (notes: string) => notes || '-',
    },
  ];

  return (
    <MainLayout>
      <div className='inspection-details-page'>
        {/* Header */}
        <div className='details-header'>
          <div className='header-left'>
            <Button
              type='text'
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/inspections')}
              className='back-button'
            >
              Back
            </Button>
            <Heading level={2} className='page-title'>
              {inspection.inspectionNumber}
            </Heading>
          </div>
          <Space>
            <Button
              icon={<PrinterOutlined />}
              size='small'
              onClick={() => window.print()}
            >
              Print
            </Button>
            <GradientButton
              size='small'
              onClick={() => setDrawerVisible(true)}
            >
              Edit
            </GradientButton>
            <Button
              danger
              icon={<DeleteOutlined />}
              size='small'
              onClick={handleDelete}
            >
              Delete
            </Button>
          </Space>
        </div>

        {/* Status Bar */}
        <div className='status-bar'>
          <div className='status-item'>
            <span className='label'>Type:</span>
            <Tag color={getTypeColor(inspection.inspectionType)}>
              {inspection.inspectionType.replace(/_/g, ' ')}
            </Tag>
          </div>
          <div className='status-item'>
            <span className='label'>Status:</span>
            <Tag color={getStatusColor(inspection.status)}>
              {inspection.status.replace(/_/g, ' ')}
            </Tag>
          </div>
          <div className='status-item'>
            <span className='label'>Quality Score:</span>
            <span className='value'>
              {inspection.qualityScore !== undefined && inspection.qualityScore !== null
                ? `${Number(inspection.qualityScore).toFixed(1)}%`
                : '-'}
            </span>
          </div>
          <div className='status-item'>
            <span className='label'>Created:</span>
            <span className='value'>{dayjs(inspection.createdAt).fromNow()}</span>
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          defaultActiveKey='overview'
          items={[
            {
              key: 'overview',
              label: 'Overview',
              children: (
                <div className='tab-content'>
                  <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12}>
                      <Card title='Inspection Information' size='small'>
                        <div className='info-row'>
                          <span className='label'>Inspection Code:</span>
                          <span className='value'>{inspection.inspectionNumber}</span>
                        </div>
                        <Divider style={{ margin: '8px 0' }} />
                        <div className='info-row'>
                          <span className='label'>Type:</span>
                          <span className='value'>{inspection.inspectionType.replace(/_/g, ' ')}</span>
                        </div>
                        <Divider style={{ margin: '8px 0' }} />
                        <div className='info-row'>
                          <span className='label'>Status:</span>
                          <Tag color={getStatusColor(inspection.status)}>
                            {inspection.status.replace(/_/g, ' ')}
                          </Tag>
                        </div>
                        <Divider style={{ margin: '8px 0' }} />
                        <div className='info-row'>
                          <span className='label'>Scheduled Date:</span>
                          <span className='value'>{dayjs(inspection.scheduledDate).format('DD MMM YYYY')}</span>
                        </div>
                      </Card>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Card title='Reference Information' size='small'>
                        <div className='info-row'>
                          <span className='label'>Reference Type:</span>
                          <span className='value'>{inspection.referenceType}</span>
                        </div>
                        <Divider style={{ margin: '8px 0' }} />
                        <div className='info-row'>
                          <span className='label'>Reference ID:</span>
                          <span className='value'>{inspection.referenceId}</span>
                        </div>
                        <Divider style={{ margin: '8px 0' }} />
                        <div className='info-row'>
                          <span className='label'>Inspector:</span>
                          <span className='value'>
                            {inspection.inspector?.firstName} {inspection.inspector?.lastName}
                          </span>
                        </div>
                        <Divider style={{ margin: '8px 0' }} />
                        <div className='info-row'>
                          <span className='label'>Quality Score:</span>
                          <span className='value'>
                            {inspection.qualityScore !== undefined && inspection.qualityScore !== null
                              ? `${Number(inspection.qualityScore).toFixed(1)}%`
                              : '-'}
                          </span>
                        </div>
                      </Card>
                    </Col>
                  </Row>
                </div>
              ),
            },
            {
              key: 'checkpoints',
              label: `Checkpoints (${inspection.checkpoints?.length || 0})`,
              children: (
                <div className='tab-content'>
                  {inspection.checkpoints && inspection.checkpoints.length > 0 ? (
                    <Table
                      columns={checkpointColumns}
                      dataSource={inspection.checkpoints}
                      rowKey='id'
                      pagination={false}
                      size='small'
                    />
                  ) : (
                    <Empty description='No checkpoints found' />
                  )}
                </div>
              ),
            },
            {
              key: 'notes',
              label: 'Notes & Recommendations',
              children: (
                <div className='tab-content'>
                  <Row gutter={[16, 16]}>
                    <Col xs={24}>
                      <Card title='Inspector Notes' size='small'>
                        <p className='notes-content'>
                          {inspection.inspectorNotes || 'No notes provided'}
                        </p>
                      </Card>
                    </Col>
                    <Col xs={24}>
                      <Card title='Recommendations' size='small'>
                        <p className='notes-content'>
                          {inspection.recommendations || 'No recommendations provided'}
                        </p>
                      </Card>
                    </Col>
                  </Row>
                </div>
              ),
            },
          ]}
        />

        {/* Drawer */}
        <InspectionFormDrawer
          visible={drawerVisible}
          inspection={inspection}
          onClose={() => setDrawerVisible(false)}
          onSuccess={handleDrawerSuccess}
        />
      </div>
    </MainLayout>
  );
}
