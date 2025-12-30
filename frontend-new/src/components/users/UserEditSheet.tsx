import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { userService, User, UpdateUserRequest } from '@/services/userService';
import { locationService, Location } from '@/services/locationService';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { PrimaryButton, OutlinedButton } from '@/components/globalComponents';
import { toast } from 'sonner';
import { AlertTriangle, Upload } from 'lucide-react';

const editUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  role: z.enum(['OWNER', 'ADMIN', 'MANAGER', 'EMPLOYEE']),
  department: z.string().optional(),
  locationId: z.string().optional(),
  isActive: z.boolean(),
});

type EditUserFormValues = z.infer<typeof editUserSchema>;

interface UserEditSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onSuccess: () => void;
}

const UserEditSheet = ({ open, onOpenChange, user, onSuccess }: UserEditSheetProps) => {
  const [loading, setLoading] = useState(false);
  const [roleChanged, setRoleChanged] = useState(false);
  const [originalRole, setOriginalRole] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [roleConfirmDialogOpen, setRoleConfirmDialogOpen] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<EditUserFormValues | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);

  const form = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: 'EMPLOYEE',
      department: '',
      locationId: '',
      isActive: true,
    },
  });

  useEffect(() => {
    if (user && open) {
      form.reset({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone || '',
        role: user.role,
        department: user.department || '',
        locationId: user.locationId || '',
        isActive: user.isActive,
      });
      setOriginalRole(user.role);
      setRoleChanged(false);
      setAvatarUrl(user.avatarUrl || '');
      fetchLocations();
    }
  }, [user, open, form]);

  const fetchLocations = async () => {
    try {
      const locs = await locationService.getLocations();
      setLocations(locs);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const handleRoleChange = (newRole: string) => {
    setRoleChanged(newRole !== originalRole);
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isJpgOrPng =
      file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp';
    if (!isJpgOrPng) {
      toast.error('You can only upload JPG/PNG/WEBP files!');
      return;
    }

    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      toast.error('Image must be smaller than 2MB!');
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = e => {
      setAvatarUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (values: EditUserFormValues) => {
    if (!user) return;

    // Show confirmation if role is being changed
    if (roleChanged) {
      setPendingFormData(values);
      setRoleConfirmDialogOpen(true);
    } else {
      await performUpdate(values);
    }
  };

  const performUpdate = async (values: EditUserFormValues) => {
    if (!user) return;

    setLoading(true);
    try {
      const updateData: UpdateUserRequest = {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone,
        avatarUrl: avatarUrl || undefined,
        role: values.role,
        department: values.department,
        locationId: values.locationId,
        isActive: values.isActive,
      };

      await userService.updateUser(user.id, updateData);
      toast.success('User updated successfully');
      form.reset();
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update user');
    } finally {
      setLoading(false);
      setRoleConfirmDialogOpen(false);
      setPendingFormData(null);
    }
  };

  const handleClose = () => {
    form.reset();
    setRoleChanged(false);
    setAvatarUrl('');
    onOpenChange(false);
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className='sm:max-w-[600px] overflow-y-auto'>
          <SheetHeader>
            <SheetTitle>
              Edit User: {user?.firstName} {user?.lastName}
            </SheetTitle>
            <SheetDescription>Update user profile and permissions</SheetDescription>
          </SheetHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6 mt-6'>
              {/* Section 1: Personal Information */}
              <div className='space-y-4'>
                <h3 className='text-sm font-semibold'>Personal Information</h3>

                {/* Avatar Upload */}
                <div className='flex items-center gap-4'>
                  <Avatar className='h-20 w-20'>
                    <AvatarImage src={avatarUrl} />
                    <AvatarFallback className='bg-primary text-primary-foreground text-xl'>
                      {user && getInitials(user.firstName, user.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <label
                      htmlFor='avatar-upload'
                      className='cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-md text-sm transition-colors'
                    >
                      <Upload className='h-4 w-4' />
                      Upload Avatar
                    </label>
                    <input
                      id='avatar-upload'
                      type='file'
                      accept='image/jpeg,image/png,image/webp'
                      onChange={handleAvatarUpload}
                      className='hidden'
                    />
                    <p className='text-xs text-muted-foreground mt-1'>JPG, PNG or WEBP. Max 2MB.</p>
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <FormField
                    control={form.control}
                    name='firstName'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder='John' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='lastName'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder='Doe' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Section 2: Contact Details */}
              <div className='space-y-4'>
                <h3 className='text-sm font-semibold'>Contact Details</h3>

                <FormField
                  control={form.control}
                  name='email'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder='user@example.com' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='phone'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder='+1234567890' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Section 3: Role & Permissions */}
              <div className='space-y-4'>
                <h3 className='text-sm font-semibold'>Role & Permissions</h3>

                {roleChanged && (
                  <Alert variant='destructive'>
                    <AlertTriangle className='h-4 w-4' />
                    <AlertDescription>
                      Changing the user's role will immediately affect their access permissions.
                    </AlertDescription>
                  </Alert>
                )}

                <FormField
                  control={form.control}
                  name='role'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select
                        onValueChange={value => {
                          field.onChange(value);
                          handleRoleChange(value);
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select role' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='OWNER'>Owner</SelectItem>
                          <SelectItem value='ADMIN'>Admin</SelectItem>
                          <SelectItem value='MANAGER'>Manager</SelectItem>
                          <SelectItem value='EMPLOYEE'>Employee</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='department'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <FormControl>
                        <Input placeholder='e.g., Production, Quality Control' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='locationId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select location' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value=''>No specific location</SelectItem>
                          {locations.map(location => (
                            <SelectItem key={location.id} value={location.id}>
                              {location.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='isActive'
                  render={({ field }) => (
                    <FormItem className='flex flex-row items-center justify-between rounded-lg border p-3'>
                      <div className='space-y-0.5'>
                        <FormLabel>Active Status</FormLabel>
                        <FormDescription>Inactive users cannot access the system</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <SheetFooter className='gap-2'>
                <OutlinedButton type='button' onClick={handleClose} disabled={loading}>
                  Cancel
                </OutlinedButton>
                <PrimaryButton type='submit' loading={loading}>
                  Save Changes
                </PrimaryButton>
              </SheetFooter>
            </form>
          </Form>
        </SheetContent>
      </Sheet>

      {/* Role Change Confirmation Dialog */}
      <AlertDialog open={roleConfirmDialogOpen} onOpenChange={setRoleConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Role Change</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change {user?.firstName}'s role from {originalRole} to{' '}
              {pendingFormData?.role}? This will affect their permissions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingFormData(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => pendingFormData && performUpdate(pendingFormData)}
              disabled={loading}
            >
              Yes, Change Role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default UserEditSheet;
