'use client';

import React, { useState } from 'react';
import { useActionState } from 'react-dom';
import { useFormStatus } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { submitReferral, type FormState } from '@/lib/actions';
import { referralSchema } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar as CalendarIcon, FileUp, Loader2, AlertCircle, Phone, Mail, Fax } from 'lucide-react';
import { cn } from '@/lib/utils';
import SiteHeader from '@/components/layout/site-header';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';

type FormData = z.infer<typeof referralSchema>;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} size="lg" className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90">
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      SUBMIT REFERRAL
    </Button>
  );
}

export default function ReferPage() {
  const initialState: FormState = { message: '', success: false };
  const [formState, dispatch] = useActionState(submitReferral, initialState);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  
  const form = useForm<FormData>({
    resolver: zodResolver(referralSchema),
    defaultValues: {
      organizationName: '',
      contactName: '',
      phone: '',
      email: '',
      patientFullName: '',
      patientDOB: '',
      patientZipCode: '',
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
      <main className="flex-1 py-12 md:py-20 bg-muted/20">
        <div className="container mx-auto max-w-4xl px-4">
            <div className="flex flex-wrap items-center justify-center gap-4 mb-8 text-sm">
                <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-primary" />
                    <strong>Phone:</strong> 713-378-0781
                </div>
                <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-primary" />
                    <strong>Email:</strong> Office@Centraloftexas.com
                </div>
                <div className="flex items-center gap-2">
                    <Fax className="w-4 h-4 text-primary" />
                    <strong>Fax:</strong> 713-378-5289
                </div>
            </div>

          <form action={dispatch} className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline text-2xl">How can we contact you about this referral?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="organizationName">Organization / Facility Name *</Label>
                    <Input id="organizationName" name="organizationName" placeholder="e.g., Memorial Hermann" />
                    {formState.errors?.organizationName && <p className="text-sm text-destructive">{formState.errors.organizationName[0]}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactName">Contact Name *</Label>
                    <Input id="contactName" name="contactName" placeholder="e.g., Maria Lopez" />
                    {formState.errors?.contactName && <p className="text-sm text-destructive">{formState.errors.contactName[0]}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input id="phone" name="phone" placeholder="e.g., (713) 555-1234" />
                    <p className="text-xs text-muted-foreground">We use this only to confirm acceptance or request missing information.</p>
                    {formState.errors?.phone && <p className="text-sm text-destructive">{formState.errors.phone[0]}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address (optional)</Label>
                    <Input id="email" name="email" type="email" placeholder="e.g., case.manager@facility.com" />
                    {formState.errors?.email && <p className="text-sm text-destructive">{formState.errors.email[0]}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-headline text-2xl">Patient Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                 <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="patientFullName">Patient Full Name *</Label>
                      <Input id="patientFullName" name="patientFullName" placeholder="e.g., John Doe" />
                      {formState.errors?.patientFullName && <p className="text-sm text-destructive">{formState.errors.patientFullName[0]}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="patientDOB">Date of Birth *</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                variant={"outline"}
                                className={cn("w-full justify-start text-left font-normal", !form.watch('patientDOB') && "text-muted-foreground")}
                                >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {form.watch('patientDOB') ? format(new Date(form.watch('patientDOB')), "MM/dd/yyyy") : <span>mm/dd/yyyy</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={form.watch('patientDOB') ? new Date(form.watch('patientDOB')) : undefined}
                                    onSelect={(date) => form.setValue('patientDOB', date ? format(date, 'yyyy-MM-dd') : '')}
                                    initialFocus
                                    captionLayout="dropdown-buttons" 
                                    fromYear={1900} toYear={new Date().getFullYear()}
                                />
                            </PopoverContent>
                        </Popover>
                        <Input type="hidden" id="patientDOB" name="patientDOB" value={form.watch('patientDOB')} />
                        {formState.errors?.patientDOB && <p className="text-sm text-destructive">{formState.errors.patientDOB[0]}</p>}
                    </div>
                     <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="patientZipCode">Patient ZIP Code *</Label>
                      <Input id="patientZipCode" name="patientZipCode" placeholder="e.g., 77005" />
                      {formState.errors?.patientZipCode ? (
                        <p className="text-sm text-destructive">{formState.errors.patientZipCode[0]}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground">We'll review service availability quickly. (This front-end version does not block submission based on ZIP.)</p>
                      )}
                    </div>
                 </div>
              </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">Upload Orders</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <div className="flex items-center justify-center w-full">
                            <label htmlFor="documents" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <FileUp className="w-8 h-8 mb-3 text-muted-foreground" />
                                    <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                    <p className="text-xs text-muted-foreground">.pdf, .jpeg, .png, .gif</p>
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
                </CardContent>
            </Card>

            {formState.message && !formState.success && (
                <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{formState.message}</AlertDescription>
                </Alert>
            )}
            
            <SubmitButton />
          </form>
        </div>
      </main>
    </div>
  );
}
