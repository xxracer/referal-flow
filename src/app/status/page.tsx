'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle, Search, Clock, Info, CheckCircle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from 'lucide-react';

import SiteHeader from '@/components/layout/site-header';
import { checkStatus, type FormState } from '@/lib/actions';
import { cn, formatDate } from '@/lib/utils';
import StatusBadge from '@/components/referrals/status-badge';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
      Check Status
    </Button>
  );
}

export default function StatusPage() {
  const searchParams = useSearchParams();
  const initialReferralId = searchParams.get('id') || '';
  const [patientDOB, setPatientDOB] = useState<Date | undefined>();

  const initialState: FormState = { message: '', success: false };
  const [formState, dispatch] = useFormState(checkStatus, initialState);

  return (
    <div className="flex flex-col min-h-dvh">
      <SiteHeader />
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-3xl text-center">Check Referral Status</CardTitle>
              <CardDescription className="text-center">Enter the Referral ID and patient's date of birth to see the latest update.</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={dispatch} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="referralId">Referral ID</Label>
                  <Input id="referralId" name="referralId" defaultValue={initialReferralId} placeholder="e.g., TX-REF-2024-001234" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="patientDOB">Patient's Date of Birth</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                            variant={"outline"}
                            className={cn(
                                "w-full justify-start text-left font-normal",
                                !patientDOB && "text-muted-foreground"
                            )}
                            >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {patientDOB ? formatDate(patientDOB, 'yyyy-MM-dd') : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                            mode="single"
                            selected={patientDOB}
                            onSelect={setPatientDOB}
                            initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                    <Input type="hidden" id="patientDOB" name="patientDOB" value={patientDOB ? formatDate(patientDOB, 'yyyy-MM-dd') : ''} />
                </div>
                <SubmitButton />
              </form>
            </CardContent>
          </Card>

          {formState.message && (
             <div className="mt-6">
                {!formState.success ? (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{formState.message}</AlertDescription>
                    </Alert>
                ) : (
                    <Card className="shadow-md">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 font-headline"><Info className="w-5 h-5" /> Referral Status</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Current Status:</span>
                                {formState.data?.status && <StatusBadge status={formState.data.status} />}
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Last Updated:</span>
                                <span className="font-medium">{formState.data?.updatedAt ? formatDate(formState.data.updatedAt) : 'N/A'}</span>
                            </div>
                            <Alert>
                                <CheckCircle className="h-4 w-4" />
                                <AlertTitle>Next Steps</AlertTitle>
                                <AlertDescription>
                                    If your referral is accepted, our team will contact the patient directly to schedule an appointment. No further action is needed from you at this time.
                                </AlertDescription>
                            </Alert>
                        </CardContent>
                    </Card>
                )}
             </div>
          )}
        </div>
      </main>
    </div>
  );
}
