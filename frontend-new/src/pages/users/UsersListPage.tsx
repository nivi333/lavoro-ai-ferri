import { useState, useEffect, useCallback } from 'react';
import useAuth from '@/contexts/AuthContext';
import { useHeader } from '@/contexts/HeaderContext';
import MainLayout from '@/components/layout/MainLayout';
import { userService, User, UserFilters } from '@/services/userService';
import UserInviteSheet from '@/components/users/UserInviteSheet';
import UserEditSheet from '@/components/users/UserEditSheet';
import {
  PageContainer,
  PageHeader,
  PageTitle,
  ActionBar,
  SearchInput,
  PrimaryButton,
  OutlinedButton,
  EmptyState,
  StatusBadge,
  TableCard,
  DataTable,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  DangerButton,
} from '@/components/globalComponents';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { MoreVertical, Edit, UserCog, Ban, CheckCircle, Trash2, FolderOpen } from 'lucide-react';

const UsersListPage = () => {
  const { currentCompany } = useAuth();
  const { setHeaderActions } = useHeader();
  const [users, setUsers] = useState<User[]>([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [inviteSheetOpen, setInviteSheetOpen] = useState(false);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [roleChangeDialogOpen, setRoleChangeDialogOpen] = useState(false);
  const [userToChangeRole, setUserToChangeRole] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<string>('');
  const [bulkRoleChangeDialogOpen, setBulkRoleChangeDialogOpen] = useState(false);
  const [bulkNewRole, setBulkNewRole] = useState<string>('');
  const [, setPagination] = useState({
    current: 1,
    pageSize: 25,
    total: 0,
  });
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    role: undefined,
    status: undefined,
    page: 1,
    limit: 25,
  });

  const fetchUsers = useCallback(async () => {
    setTableLoading(true);
    try {
      const result = await userService.getCompanyUsers(filters);
      setUsers(result.users);
      setPagination({
        current: result.pagination.page,
        pageSize: result.pagination.limit,
        total: result.pagination.total,
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch users');
    } finally {
      setTableLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    setHeaderActions(
      <PrimaryButton onClick={() => setInviteSheetOpen(true)} size='sm'>
        Invite User
      </PrimaryButton>
    );

    return () => setHeaderActions(null);
  }, [setHeaderActions]);

  useEffect(() => {
    if (currentCompany) {
      fetchUsers();
    }
  }, [fetchUsers, currentCompany]);

  const handleSearch = (value: string) => {
    setFilters({ ...filters, search: value, page: 1 });
  };

  const handleRoleFilter = (value: string) => {
    setFilters({ ...filters, role: value || undefined, page: 1 });
  };

  const handleStatusFilter = (value: string) => {
    setFilters({ ...filters, status: value || undefined, page: 1 });
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setEditSheetOpen(true);
  };

  const handleRemove = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const confirmRemove = async () => {
    if (!userToDelete) return;
    try {
      await userService.removeUser(userToDelete.id);
      toast.success('User removed successfully');
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove user');
    }
  };

  const handleChangeRole = (user: User) => {
    setUserToChangeRole(user);
    setNewRole(user.role);
    setRoleChangeDialogOpen(true);
  };

  const confirmRoleChange = async () => {
    if (!userToChangeRole || !newRole) return;
    try {
      await userService.updateUser(userToChangeRole.id, { role: newRole as any });
      toast.success('User role updated successfully');
      setRoleChangeDialogOpen(false);
      setUserToChangeRole(null);
      setNewRole('');
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update user role');
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      await userService.updateUser(user.id, { isActive: !user.isActive });
      toast.success(`User ${user.isActive ? 'deactivated' : 'activated'} successfully`);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update user status');
    }
  };

  const handleBulkRoleChange = () => {
    if (selectedRowKeys.length === 0) {
      toast.warning('Please select users first');
      return;
    }
    setBulkRoleChangeDialogOpen(true);
  };

  const confirmBulkRoleChange = async () => {
    if (!bulkNewRole) {
      toast.warning('Please select a role');
      return;
    }
    try {
      await userService.bulkUpdateUsers({
        userIds: selectedRowKeys,
        role: bulkNewRole,
      });
      toast.success('Users updated successfully');
      setSelectedRowKeys([]);
      setBulkRoleChangeDialogOpen(false);
      setBulkNewRole('');
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update users');
    }
  };

  const handleBulkStatusChange = async (isActive: boolean) => {
    if (selectedRowKeys.length === 0) {
      toast.warning('Please select users first');
      return;
    }
    try {
      await userService.bulkUpdateUsers({
        userIds: selectedRowKeys,
        isActive,
      });
      toast.success(`Users ${isActive ? 'activated' : 'deactivated'} successfully`);
      setSelectedRowKeys([]);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update users');
    }
  };

  const handleBulkDelete = () => {
    if (selectedRowKeys.length === 0) {
      toast.warning('Please select users first');
      return;
    }
    setBulkDeleteDialogOpen(true);
  };

  const confirmBulkDelete = async () => {
    try {
      await userService.bulkRemoveUsers(selectedRowKeys);
      toast.success('Users removed successfully');
      setSelectedRowKeys([]);
      setBulkDeleteDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove users');
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'info';
      case 'ADMIN':
        return 'default';
      case 'MANAGER':
        return 'success';
      case 'EMPLOYEE':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatLastActive = (date: string) => {
    const now = new Date();
    const lastActive = new Date(date);
    const diffMs = now.getTime() - lastActive.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return lastActive.toLocaleDateString();
  };

  const toggleRowSelection = (userId: string) => {
    setSelectedRowKeys(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        if (prev.length >= 10) {
          toast.warning('Maximum 10 users can be selected at once');
          return prev;
        }
        return [...prev, userId];
      }
    });
  };

  const toggleSelectAll = () => {
    if (selectedRowKeys.length === users.length) {
      setSelectedRowKeys([]);
    } else {
      const allIds = users.slice(0, 10).map(u => u.id);
      setSelectedRowKeys(allIds);
    }
  };

  if (!currentCompany) {
    return (
      <MainLayout>
        <PageContainer>
          <EmptyState
            icon={<FolderOpen className='h-12 w-12' />}
            message='Please select a company to manage users.'
          />
        </PageContainer>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageContainer>
        <PageHeader>
          <PageTitle>Team Members</PageTitle>
        </PageHeader>

        <ActionBar>
          <SearchInput
            placeholder='Search by name, email, or role'
            value={filters.search}
            onChange={e => handleSearch(e.target.value)}
            onClear={() => handleSearch('')}
            className='w-[300px]'
          />
          <Select value={filters.role || ''} onValueChange={handleRoleFilter}>
            <SelectTrigger className='w-[150px]'>
              <SelectValue placeholder='Filter by role' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value=''>All Roles</SelectItem>
              <SelectItem value='OWNER'>Owner</SelectItem>
              <SelectItem value='ADMIN'>Admin</SelectItem>
              <SelectItem value='MANAGER'>Manager</SelectItem>
              <SelectItem value='EMPLOYEE'>Employee</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.status || ''} onValueChange={handleStatusFilter}>
            <SelectTrigger className='w-[150px]'>
              <SelectValue placeholder='Filter by status' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value=''>All Status</SelectItem>
              <SelectItem value='active'>Active</SelectItem>
              <SelectItem value='inactive'>Inactive</SelectItem>
            </SelectContent>
          </Select>
        </ActionBar>

        {selectedRowKeys.length > 0 && (
          <div className='flex items-center gap-2 mb-4 p-3 bg-muted/50 rounded-base'>
            <span className='text-sm font-medium'>{selectedRowKeys.length} users selected</span>
            <OutlinedButton size='sm' onClick={handleBulkRoleChange}>
              Change Role
            </OutlinedButton>
            <OutlinedButton size='sm' onClick={() => handleBulkStatusChange(true)}>
              Activate
            </OutlinedButton>
            <OutlinedButton size='sm' onClick={() => handleBulkStatusChange(false)}>
              Deactivate
            </OutlinedButton>
            <DangerButton size='sm' onClick={handleBulkDelete}>
              Remove
            </DangerButton>
            <OutlinedButton size='sm' onClick={() => setSelectedRowKeys([])}>
              Clear Selection
            </OutlinedButton>
          </div>
        )}

        <TableCard>
          {tableLoading ? (
            <div className='flex items-center justify-center py-12'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
            </div>
          ) : users.length === 0 ? (
            <EmptyState
              icon={<FolderOpen className='h-12 w-12' />}
              message='No team members found'
              action={
                <PrimaryButton onClick={() => setInviteSheetOpen(true)} size='sm'>
                  Invite Your First User
                </PrimaryButton>
              }
            />
          ) : (
            <DataTable>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-[50px]'>
                    <Checkbox
                      checked={selectedRowKeys.length === users.length && users.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead className='w-[280px]'>User</TableHead>
                  <TableHead className='w-[120px]'>Role</TableHead>
                  <TableHead className='w-[100px]'>Status</TableHead>
                  <TableHead className='w-[150px]'>Last Active</TableHead>
                  <TableHead className='w-[80px] text-center'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(user => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedRowKeys.includes(user.id)}
                        onCheckedChange={() => toggleRowSelection(user.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center gap-3'>
                        <Avatar className='h-10 w-10'>
                          <AvatarImage src={user.avatarUrl} />
                          <AvatarFallback className='bg-primary text-primary-foreground'>
                            {getInitials(user.firstName, user.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className='min-w-0 flex-1'>
                          <div className='font-medium truncate'>
                            {user.firstName} {user.lastName}
                          </div>
                          <div className='text-xs text-muted-foreground truncate'>{user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge variant={getRoleBadgeVariant(user.role)}>
                        {user.role}
                      </StatusBadge>
                    </TableCell>
                    <TableCell>
                      <StatusBadge variant={user.isActive ? 'success' : 'error'}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className='text-muted-foreground'>
                      {formatLastActive(user.lastActive)}
                    </TableCell>
                    <TableCell className='text-center'>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className='p-2 hover:bg-muted rounded'>
                            <MoreVertical className='h-4 w-4' />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem onClick={() => handleEdit(user)}>
                            <Edit className='mr-2 h-4 w-4' />
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleChangeRole(user)}>
                            <UserCog className='mr-2 h-4 w-4' />
                            Change Role
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleStatus(user)}>
                            {user.isActive ? (
                              <>
                                <Ban className='mr-2 h-4 w-4' />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <CheckCircle className='mr-2 h-4 w-4' />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleRemove(user)}
                            className='text-error'
                          >
                            <Trash2 className='mr-2 h-4 w-4' />
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </DataTable>
          )}
        </TableCard>

        <UserInviteSheet
          open={inviteSheetOpen}
          onOpenChange={setInviteSheetOpen}
          onSuccess={() => {
            setInviteSheetOpen(false);
            fetchUsers();
          }}
        />

        <UserEditSheet
          open={editSheetOpen}
          onOpenChange={setEditSheetOpen}
          user={selectedUser}
          onSuccess={() => {
            setEditSheetOpen(false);
            setSelectedUser(null);
            fetchUsers();
          }}
        />

        {/* Delete User Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove User</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove {userToDelete?.firstName} {userToDelete?.lastName}{' '}
                from this company?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmRemove} className='bg-error hover:bg-error-hover'>
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Role Change Dialog */}
        <AlertDialog open={roleChangeDialogOpen} onOpenChange={setRoleChangeDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Change User Role</AlertDialogTitle>
              <AlertDialogDescription>
                Change role for {userToChangeRole?.firstName} {userToChangeRole?.lastName}:
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className='py-4'>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger>
                  <SelectValue placeholder='Select role' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='OWNER'>Owner</SelectItem>
                  <SelectItem value='ADMIN'>Admin</SelectItem>
                  <SelectItem value='MANAGER'>Manager</SelectItem>
                  <SelectItem value='EMPLOYEE'>Employee</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmRoleChange}>Change Role</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Bulk Role Change Dialog */}
        <AlertDialog open={bulkRoleChangeDialogOpen} onOpenChange={setBulkRoleChangeDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Bulk Role Change</AlertDialogTitle>
              <AlertDialogDescription>
                Change role for {selectedRowKeys.length} selected users:
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className='py-4'>
              <Select value={bulkNewRole} onValueChange={setBulkNewRole}>
                <SelectTrigger>
                  <SelectValue placeholder='Select new role' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='ADMIN'>Admin</SelectItem>
                  <SelectItem value='MANAGER'>Manager</SelectItem>
                  <SelectItem value='EMPLOYEE'>Employee</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmBulkRoleChange}>Change Role</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Bulk Delete Dialog */}
        <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Users</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove {selectedRowKeys.length} selected users from this
                company?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmBulkDelete}
                className='bg-error hover:bg-error-hover'
              >
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </PageContainer>
    </MainLayout>
  );
};

export default UsersListPage;
