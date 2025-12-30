import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import useAuth from '@/contexts/AuthContext';
import { companyService } from '@/services/companyService';
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
import { PrimaryButton, OutlinedButton } from '@/components/globalComponents';
import { toast } from 'sonner';

const inviteSchema = z.object({
  emailOrPhone: z
    .string()
    .min(1, 'Email or phone is required')
    .refine(
      value => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^[+]?[0-9\s\-()]{10,}$/;
        return emailRegex.test(value) || phoneRegex.test(value);
      },
      {
        message: 'Please enter a valid email or phone number',
      }
    ),
  role: z.enum(['EMPLOYEE', 'MANAGER', 'ADMIN'], {
    required_error: 'Please select a role',
  }),
  locationId: z.string().min(1, 'Please select a location'),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

interface UserInviteSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const UserInviteSheet = ({ open, onOpenChange, onSuccess }: UserInviteSheetProps) => {
  const { currentCompany } = useAuth();
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      emailOrPhone: '',
      role: 'EMPLOYEE',
      locationId: '',
    },
  });

  useEffect(() => {
    if (open && currentCompany) {
      fetchLocations();
    }
  }, [open, currentCompany]);

  const fetchLocations = async () => {
    try {
      const locs = await locationService.getLocations();
      setLocations(locs);

      // Set default location if available
      const defaultLocation = locs.find(loc => loc.isDefault);
      if (defaultLocation) {
        form.setValue('locationId', defaultLocation.id);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
      // Fallback: use company as default location
      if (currentCompany) {
        setLocations([
          {
            id: currentCompany.id,
            locationId: currentCompany.id,
            name: 'Headquarters',
            addressLine1: '',
            city: '',
            state: '',
            country: '',
            isDefault: true,
            isHeadquarters: true,
            locationType: 'BRANCH' as const,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]);
        form.setValue('locationId', currentCompany.id);
      }
    }
  };

  const onSubmit = async (values: InviteFormValues) => {
    if (!currentCompany) {
      toast.error('No company selected. Please select a company first.');
      return;
    }

    setLoading(true);
    try {
      const inviteData = {
        emailOrPhone: values.emailOrPhone.trim(),
        role: values.role,
        companyId: currentCompany.id,
        locationId: values.locationId,
      };

      await companyService.inviteUser(currentCompany.id, inviteData);
      toast.success('User invitation sent successfully');
      form.reset();
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Failed to invite user');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='sm:max-w-[500px]'>
        <SheetHeader>
          <SheetTitle>Invite Team Members</SheetTitle>
          <SheetDescription>
            Invite existing users to join your company. They will receive an invitation to accept or
            decline.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6 mt-6'>
            <FormField
              control={form.control}
              name='emailOrPhone'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email or Phone</FormLabel>
                  <FormControl>
                    <Input placeholder='user@example.com or +1234567890' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='role'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select role for user' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='EMPLOYEE'>Employee</SelectItem>
                      <SelectItem value='MANAGER'>Manager</SelectItem>
                      <SelectItem value='ADMIN'>Admin</SelectItem>
                    </SelectContent>
                  </Select>
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
                      {locations.map(location => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name}
                          {location.isDefault && ' (Default)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='text-xs text-muted-foreground space-y-1 bg-muted/50 p-3 rounded-md'>
              <p>• Only existing users can be invited to join your company</p>
              <p>• User will receive an invitation to accept or decline</p>
              <p>• Invalid or non-existent users will be reported</p>
            </div>

            <SheetFooter className='gap-2'>
              <OutlinedButton type='button' onClick={handleClose} disabled={loading}>
                Cancel
              </OutlinedButton>
              <PrimaryButton type='submit' loading={loading}>
                Send Invitation
              </PrimaryButton>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
};

export default UserInviteSheet;
