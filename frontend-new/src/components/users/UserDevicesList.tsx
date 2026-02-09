import { useEffect, useState } from 'react';
import { Table, TableBody, TableRow, TableHead } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  DataTable,
  TableCell as GlobalTableCell,
  TableHeader as GlobalTableHeader,
} from '@/components/globalComponents';
import { userService } from '@/services/userService';
import { format } from 'date-fns';
import { Loader2, Monitor } from 'lucide-react';
import { toast } from 'sonner';

interface UserDevicesListProps {
  userId: string;
}

interface Session {
  id: string;
  lastActive: string;
  createdAt: string;
  deviceType?: string; // Assuming API might provide this, typically parsed from User-Agent
}

export default function UserDevicesList({ userId }: UserDevicesListProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);
        const user = await userService.getUserById(userId);
        setSessions(user.sessions || []);
      } catch (error) {
        console.error('Error fetching sessions:', error);
        toast.error('Failed to load active sessions');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchSessions();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className='flex justify-center p-8'>
        <Loader2 className='h-8 w-8 animate-spin text-primary' />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Devices</CardTitle>
        <CardDescription>Currently active sessions for this user</CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable>
          <Table>
            <TableHead>
              <TableRow className='flex'>
                <GlobalTableHeader>Device</GlobalTableHeader>
                <GlobalTableHeader>Last Active</GlobalTableHeader>
                <GlobalTableHeader>Started At</GlobalTableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {sessions.length === 0 ? (
                <TableRow>
                  <GlobalTableCell colSpan={3} className='text-center text-muted-foreground h-24'>
                    No active sessions found
                  </GlobalTableCell>
                </TableRow>
              ) : (
                sessions.map(session => (
                  <TableRow key={session.id}>
                    <GlobalTableCell className='flex items-center gap-2'>
                      <Monitor className='h-4 w-4 text-muted-foreground' />
                      <span>Session {session.id.substring(0, 8)}...</span>
                    </GlobalTableCell>
                    <GlobalTableCell>
                      {format(new Date(session.lastActive), 'MMM d, yyyy h:mm a')}
                    </GlobalTableCell>
                    <GlobalTableCell>
                      {format(new Date(session.createdAt), 'MMM d, yyyy h:mm a')}
                    </GlobalTableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </DataTable>
      </CardContent>
    </Card>
  );
}
