import { db } from '@/lib/data';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/referrals/status-badge';
import { formatDate } from '@/lib/utils';
import { FileText, PlusCircle } from 'lucide-react';

export default async function DashboardPage() {
  const referrals = await db.getReferrals();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-headline">Dashboard</h1>
            <p className="text-muted-foreground">
                An overview of all patient referrals.
            </p>
        </div>
        <Button asChild>
            <Link href="/refer">
                <PlusCircle className="mr-2 h-4 w-4" />
                New Referral
            </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Referrals</CardTitle>
          <CardDescription>
            Showing the {referrals.length} most recent referrals.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Referral ID</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Exam</TableHead>
                <TableHead>Referrer</TableHead>
                <TableHead>Received</TableHead>
                <TableHead className="text-center">Docs</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {referrals.length > 0 ? (
                referrals.map((referral) => (
                  <TableRow key={referral.id} className="cursor-pointer hover:bg-muted/80">
                    <TableCell>
                      <Link href={`/dashboard/referrals/${referral.id}`} className="font-medium text-primary hover:underline">
                        {referral.id}
                      </Link>
                    </TableCell>
                    <TableCell>{referral.patientName}</TableCell>
                    <TableCell>{referral.examRequested}</TableCell>
                    <TableCell>{referral.referrerName}</TableCell>
                    <TableCell>{formatDate(referral.createdAt)}</TableCell>
                    <TableCell className="text-center">
                      {referral.documents.length > 0 ? (
                        <div className="flex items-center justify-center gap-1">
                            <FileText className="h-4 w-4 text-muted-foreground" /> 
                            {referral.documents.length}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <StatusBadge status={referral.status} />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24">
                    No referrals found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
