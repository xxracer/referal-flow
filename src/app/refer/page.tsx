'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { submitReferral, type FormState } from '@/lib/actions';
import { referralSchema } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, FileUp, Loader2, AlertCircle } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import SiteHeader from '@/components/layout/site-header';
import { useState } from 'react';
import Link from 'next/link';

type FormData = z.infer<typeof referralSchema>;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      Submit Referral
    </Button>
  );
}

export default function ReferPage() {
  const initialState: FormState = { message: '', success: false };
  const [formState, dispatch] = useFormState(submitReferral, initialState);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(referralSchema),
    defaultValues: {
      patientName: '',
      patientDOB: '',
      patientContact: '',
      patientId: '',
      referrerName: '',
      referrerContact: '',
      referrerRelation: '',
      documents: undefined,
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFiles(Array.from(event.target.files));
      form.setValue('documents', event.target.files);
    }
  };

  return (
    <div className="flex flex-col min-h-dvh">
      <SiteHeader />
      <main className="flex-1 py-12 md:py-20">
        <div className="container mx-auto max-w-3xl px-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-3xl">New Referral</CardTitle>
              <CardDescription>Fill out the form below to submit a new patient referral.</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={dispatch} className="space-y-8">
                {formState.message && !formState.success && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{formState.message}</AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-4">
                  <h3 className="font-headline text-xl border-b pb-2">Patient Information</h3>
                  <div className="space-y-2">
                    <Label htmlFor="patientName">Full Name</Label>
                    <Input id="patientName" name="patientName" required />
                    {formState.errors?.patientName && <p className="text-sm text-destructive">{formState.errors.patientName[0]}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="patientDOB">Date of Birth</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                            variant={"outline"}
                            className={cn(
                                "w-full justify-start text-left font-normal",
                                !form.watch('patientDOB') && "text-muted-foreground"
                            )}
                            >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {form.watch('patientDOB') ? formatDate(form.watch('patientDOB'), 'yyyy-MM-dd') : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                            mode="single"
                            selected={form.watch('patientDOB') ? new Date(form.watch('patientDOB')) : undefined}
                            onSelect={(date) => form.setValue('patientDOB', date ? formatDate(date, 'yyyy-MM-dd') : '')}
                            initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                    <Input type="hidden" id="patientDOB" name="patientDOB" value={form.watch('patientDOB')} />
                    {formState.errors?.patientDOB && <p className="text-sm text-destructive">{formState.errors.patientDOB[0]}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="patientContact">Contact Information (Email or Phone)</Label>
                    <Input id="patientContact" name="patientContact" required />
                    {formState.errors?.patientContact && <p className="text-sm text-destructive">{formState.errors.patientContact[0]}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="patientId">Patient ID (Optional)</Label>
                    <Input id="patientId" name="patientId" />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-headline text-xl border-b pb-2">Referrer Information</h3>
                  <div className="space-y-2">
                    <Label htmlFor="referrerName">Your Name / Organization</Label>
                    <Input id="referrerName" name="referrerName" required />
                     {formState.errors?.referrerName && <p className="text-sm text-destructive">{formState.errors.referrerName[0]}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="referrerContact">Your Contact Information</Label>
                    <Input id="referrerContact" name="referrerContact" required />
                    {formState.errors?.referrerContact && <p className="text-sm text-destructive">{formState.errors.referrerContact[0]}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="referrerRelation">Relationship to Patient</Label>
                    <Input id="referrerRelation" name="referrerRelation" required />
                    {formState.errors?.referrerRelation && <p className="text-sm text-destructive">{formState.errors.referrerRelation[0]}</p>}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-headline text-xl border-b pb-2">Supporting Documents (Optional)</h3>
                  <div className="space-y-2">
                    <Label htmlFor="documents">Upload Files</Label>
                    <div className="flex items-center justify-center w-full">
                        <label htmlFor="documents" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <FileUp className="w-10 h-10 mb-3 text-muted-foreground" />
                                <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                <p className="text-xs text-muted-foreground">PDF, DOC, PNG, JPG (MAX. 5MB each)</p>
                            </div>
                            <Input id="documents" name="documents" type="file" className="hidden" multiple onChange={handleFileChange} />
                        </label>
                    </div>
                     {selectedFiles.length > 0 && (
                        <div className="pt-2">
                            <p className="text-sm font-medium">Selected files:</p>
                            <ul className="list-disc list-inside text-sm text-muted-foreground">
                                {selectedFiles.map(file => <li key={file.name}>{file.name} ({(file.size / 1024 / 1024).toFixed(2)}MB)</li>)}
                            </ul>
                        </div>
                    )}
                    {formState.errors?.documents && <p className="text-sm text-destructive">{formState.errors.documents[0]}</p>}
                  </div>
                </div>

                <SubmitButton />
                <Button variant="outline" className="w-full" asChild>
                    <Link href="/">Cancel</Link>
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
