'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle, Search, Info, CheckCircle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
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
  const [referralId, setReferralId] = useState(initialReferralId);
  
  const initialState: FormState = { message: '', success: false };
  const [formState, dispatch] = useActionState(checkStatus, initialState);

  useEffect(() => {
    // If there is an initial referralId from the URL params, we don't want to reset the form.
    // We only reset if the form was successful and there was no initial ID.
    if (formState.success && !initialReferralId) {
      setReferralId('');
      // Clear patientDOB input if needed, but it's an uncontrolled component now.
      const dobInput = document.getElementById('patientDOB') as HTMLInputElement;
      if (dobInput) dobInput.value = '';
    }
  }, [formState, initialReferralId]);

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
                  <Input 
                    id="referralId" 
                    name="referralId" 
                    value={referralId}
                    onChange={(e) => setReferralId(e.target.value)}
                    placeholder="e.g., TX-REF-2024-001234" 
                    required 
                  />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="patientDOB">Patient's Date of Birth</Label>
                    <Input id="patientDOB" name="patientDOB" placeholder="YYYY-MM-DD" required />
                </div>
                {referralId && (
                    <div className="space-y-2">
                        <Label htmlFor="optionalNote">Optional Note</Label>
                        <Textarea id="optionalNote" name="optionalNote" placeholder="Add a note to your referral..." />
                    </div>
                )}
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
                            {formState.data?.noteAdded && (
                                <Alert variant="default" className="bg-green-50 border-green-200">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    <AlertTitle className="text-green-800">Note Added</AlertTitle>
                                    <AlertDescription className="text-green-700">
                                        Your note has been successfully added to the referral.
                                    </Aler
tDescription>
                                </Alert>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div>
                                <p className="text-sm text-muted-foreground">Current Status:</p>
                                <StatusBadge status={formState.data?.status} />
                            </div>
                             <div>
                                <p className="text-sm text-muted-foreground">Last Updated:</p>
                                <p className="font-medium">{formatDate(formState.data?.updatedAt, 'PPpp')}</p>
                            </div>
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
