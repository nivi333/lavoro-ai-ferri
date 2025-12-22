# Lavoro AI Ferri - Component Migration Examples
## Detailed Code Examples for shadcn/ui Migration

This document provides detailed, production-ready code examples for migrating each component from Ant Design to shadcn/ui.

---

## Table of Contents
1. [Dashboard Page](#dashboard-page)
2. [Product Form Drawer](#product-form-drawer)
3. [Data Table with Actions](#data-table-with-actions)
4. [Login Form](#login-form)
5. [Delete Confirmation Dialog](#delete-confirmation-dialog)
6. [Toast Notifications](#toast-notifications)
7. [Sidebar Navigation](#sidebar-navigation)
8. [Main Layout](#main-layout)

---

## Dashboard Page

### Current (Ant Design)
```tsx
import { Row, Col, Card, Statistic, Spin } from 'antd';
import { RiseOutlined, DollarOutlined, ShoppingCartOutlined, TeamOutlined } from '@ant-design/icons';

const DashboardPage = () => {
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);

  return (
    <MainLayout>
      <div className="page-container">
        <Heading level={2}>Dashboard</Heading>
        
        {loading ? (
          <Spin size="large" />
        ) : (
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Total Products"
                  value={analytics?.totalProducts}
                  prefix={<RiseOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Active Orders"
                  value={analytics?.activeOrders}
                  prefix={<ShoppingCartOutlined />}
                />
              </Card>
            </Col>
          </Row>
        )}
      </div>
    </MainLayout>
  );
};
```

### Target (shadcn/ui)
```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, TrendingUp, DollarSign, ShoppingCart, Users } from 'lucide-react';

const DashboardPage = () => {
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);

  return (
    <MainLayout>
      <div className="space-y-6">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.totalProducts}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.activeOrders}</div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  );
};
```

---

## Product Form Drawer

### Current (Ant Design)
```tsx
import { Drawer, Form, Input, Select, InputNumber, Switch } from 'antd';

const ProductFormDrawer = ({ open, onClose, product }) => {
  const form = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: product || {},
  });

  return (
    <Drawer title={product ? 'Edit Product' : 'Create Product'} open={open} onClose={onClose} width={600}>
      <Form layout="vertical">
        <Form.Item label="Product Name" required>
          <Input {...form.register('name')} />
        </Form.Item>
        
        <Form.Item label="Category">
          <Select {...form.register('categoryId')}>
            <Select.Option value="1">Category 1</Select.Option>
          </Select>
        </Form.Item>
        
        <Form.Item label="Active">
          <Switch {...form.register('isActive')} />
        </Form.Item>
      </Form>
    </Drawer>
  );
};
```

### Target (shadcn/ui)
```tsx
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

const ProductFormDrawer = ({ open, onClose, product }) => {
  const form = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: product || {},
  });

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{product ? 'Edit Product' : 'Create Product'}</SheetTitle>
        </SheetHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-6">
          <div className="space-y-2">
            <Label htmlFor="name">Product Name <span className="text-destructive">*</span></Label>
            <Input id="name" {...form.register('name')} placeholder="Enter product name" />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="categoryId">Category</Label>
            <Select value={form.watch('categoryId')} onValueChange={(value) => form.setValue('categoryId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Category 1</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="isActive">Active</Label>
            <Switch
              id="isActive"
              checked={form.watch('isActive')}
              onCheckedChange={(checked) => form.setValue('isActive', checked)}
            />
          </div>
          
          <SheetFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
};
```

---

## Data Table with Actions

### Current (Ant Design)
```tsx
import { Table, Dropdown, Menu, Button, Tag } from 'antd';
import { MoreOutlined } from '@ant-design/icons';

const columns = [
  {
    title: 'Product',
    dataIndex: 'name',
    render: (text, record) => (
      <div>
        <div className="font-medium">{text}</div>
        <div className="text-secondary">{record.sku}</div>
      </div>
    ),
  },
  {
    title: 'Stock',
    dataIndex: 'stockQuantity',
    render: (stock) => (
      <Tag color={stock > 10 ? 'success' : stock > 0 ? 'warning' : 'error'}>
        {stock} units
      </Tag>
    ),
  },
  {
    title: 'Actions',
    render: (_, record) => (
      <Dropdown menu={{ items: [
        { key: 'edit', label: 'Edit', onClick: () => handleEdit(record) },
        { key: 'delete', label: 'Delete', danger: true },
      ]}}>
        <Button type="text" icon={<MoreOutlined />} />
      </Dropdown>
    ),
  },
];

<Table dataSource={products} columns={columns} loading={loading} />
```

### Target (shadcn/ui)
```tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Edit, Trash2, Loader2 } from 'lucide-react';

<div className="rounded-md border">
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Product</TableHead>
        <TableHead>Stock</TableHead>
        <TableHead className="w-[70px]">Actions</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {loading ? (
        <TableRow>
          <TableCell colSpan={3} className="h-24 text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          </TableCell>
        </TableRow>
      ) : products.map((product) => (
        <TableRow key={product.id}>
          <TableCell>
            <div>
              <div className="font-medium">{product.name}</div>
              <div className="text-sm text-muted-foreground">{product.sku}</div>
            </div>
          </TableCell>
          <TableCell>
            <Badge variant={product.stockQuantity > 10 ? 'default' : product.stockQuantity > 0 ? 'secondary' : 'destructive'}>
              {product.stockQuantity} units
            </Badge>
          </TableCell>
          <TableCell>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleEdit(product)}>
                  <Edit className="mr-2 h-4 w-4" />Edit
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</div>
```

---

## Login Form

### Current (Ant Design)
```tsx
import { Form, Input, Button, Checkbox, message } from 'antd';
import { useForm, Controller } from 'react-hook-form';

const LoginPage = () => {
  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
  });

  return (
    <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
      <Form.Item label="Email" validateStatus={errors.identifier ? 'error' : ''} help={errors.identifier?.message}>
        <Controller name="identifier" control={control} render={({ field }) => <Input {...field} />} />
      </Form.Item>

      <Form.Item label="Password" validateStatus={errors.password ? 'error' : ''} help={errors.password?.message}>
        <Controller name="password" control={control} render={({ field }) => <Input.Password {...field} />} />
      </Form.Item>

      <Form.Item>
        <Controller name="rememberMe" control={control} render={({ field }) => <Checkbox {...field}>Remember me</Checkbox>} />
      </Form.Item>

      <Button type="primary" htmlType="submit" block>Login</Button>
    </Form>
  );
};
```

### Target (shadcn/ui)
```tsx
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';

const LoginPage = () => {
  const { toast } = useToast();
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    resolver: zodResolver(loginSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="identifier">Email <span className="text-destructive">*</span></Label>
        <Input
          id="identifier"
          {...register('identifier')}
          placeholder="Enter email"
          className={errors.identifier ? 'border-destructive' : ''}
        />
        {errors.identifier && <p className="text-sm text-destructive">{errors.identifier.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password <span className="text-destructive">*</span></Label>
        <Input
          id="password"
          type="password"
          {...register('password')}
          placeholder="Enter password"
          className={errors.password ? 'border-destructive' : ''}
        />
        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="rememberMe"
          checked={watch('rememberMe')}
          onCheckedChange={(checked) => setValue('rememberMe', checked)}
        />
        <Label htmlFor="rememberMe" className="text-sm font-normal cursor-pointer">Remember me</Label>
      </div>

      <Button type="submit" className="w-full">Login</Button>
    </form>
  );
};
```

---

## Delete Confirmation Dialog

### Current (Ant Design)
```tsx
import { Modal } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';

const showDeleteConfirm = (productName, onConfirm) => {
  Modal.confirm({
    title: 'Delete Product',
    icon: <ExclamationCircleOutlined />,
    content: `Are you sure you want to delete "${productName}"?`,
    okText: 'Delete',
    okType: 'danger',
    onOk: onConfirm,
  });
};
```

### Target (shadcn/ui)
```tsx
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

const DeleteConfirmDialog = ({ productName, onConfirm }) => {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Delete</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            Are you sure you want to delete "{productName}"? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
```

---

## Toast Notifications

### Current (Ant Design)
```tsx
import { message, notification } from 'antd';

message.success('Product created successfully');
message.error('Failed to create product');

notification.success({
  message: 'Product Created',
  description: 'The product has been successfully added.',
  placement: 'topRight',
});
```

### Target (shadcn/ui with sonner)
```tsx
import { toast } from 'sonner';

toast.success('Product created successfully');
toast.error('Failed to create product');

toast.success('Product Created', {
  description: 'The product has been successfully added.',
});

// Setup in App.tsx
import { Toaster } from 'sonner';

function App() {
  return (
    <>
      <Toaster position="top-right" richColors />
      {/* Rest of app */}
    </>
  );
}
```

---

## Sidebar Navigation

### Current (Ant Design)
```tsx
import { Layout, Menu } from 'antd';
const { Sider } = Layout;

<Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
  <Menu mode="inline" selectedKeys={[selectedKey]} items={menuItems} />
</Sider>
```

### Target (shadcn/ui)
```tsx
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

<aside className={cn(
  "fixed left-0 top-[60px] h-[calc(100vh-60px)] border-r bg-background transition-all duration-300",
  collapsed ? "w-16" : "w-64"
)}>
  <div className="flex items-center justify-end p-2 border-b">
    <Button variant="ghost" size="sm" onClick={() => setCollapsed(!collapsed)}>
      {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
    </Button>
  </div>
  
  <nav className="flex flex-col gap-1 p-2">
    {menuItems.map((item) => (
      <Button
        key={item.key}
        variant={selectedKey === item.key ? "secondary" : "ghost"}
        className={cn("justify-start gap-3", collapsed && "justify-center")}
        onClick={() => navigate(item.path)}
      >
        {item.icon}
        {!collapsed && <span>{item.label}</span>}
      </Button>
    ))}
  </nav>
</aside>
```

---

## Main Layout

### Current (Ant Design)
```tsx
import { Layout } from 'antd';
const { Header, Content } = Layout;

<Layout className='main-layout'>
  <Header className='app-header'>
    <div className='header-content'>
      <BrandLogo />
      <div className='header-actions'>
        <Button onClick={handleLogout}>Logout</Button>
      </div>
    </div>
  </Header>
  
  <Layout className='content-layout'>
    <Sidebar />
    <Content className='main-content'>{children}</Content>
  </Layout>
</Layout>
```

### Target (shadcn/ui)
```tsx
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

<div className="min-h-screen bg-background">
  <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
    <div className="container flex h-[60px] items-center justify-between px-6">
      <BrandLogo />
      <div className="flex items-center gap-4">
        <Button variant="destructive" onClick={handleLogout}>Logout</Button>
      </div>
    </div>
  </header>

  <div className="flex">
    <Sidebar />
    <main className="flex-1 p-6">{children}</main>
  </div>
</div>
```

---

## Complete Tailwind Configuration

```javascript
// tailwind.config.js
module.exports = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#df005c',
          hover: '#eb2671',
          active: '#b80053',
          foreground: '#ffffff',
        },
        destructive: {
          DEFAULT: '#ff4d4f',
          foreground: '#ffffff',
        },
        success: {
          DEFAULT: '#52c41a',
          foreground: '#ffffff',
        },
      },
      fontFamily: {
        heading: ['Poppins', 'Inter', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
```

---

This guide provides complete, production-ready examples for migrating all major components while maintaining exact same functionality and UI/UX.
