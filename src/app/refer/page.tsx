'use client';

import React, { useState } from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { submitReferral, type FormState } from '@/lib/actions';
import { referralSchema } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar as CalendarIcon, FileUp, Loader2, AlertCircle, Phone, Mail, Printer } from 'lucide-react';
import { cn } from '@/lib/utils';
import SiteHeader from '@/components/layout/site-header';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

type FormData = z.infer<typeof referralSchema>;

const services = [
    { id: 'skilledNursing', label: 'Skilled Nursing (SN)' },
    { id: 'physicalTherapy', label: 'Physical Therapy (PT)' },
    { id: 'occupationalTherapy', label: 'Occupational Therapy (OT)' },
    { id: 'speechTherapy', label: 'Speech Therapy (ST)' },
    { id: 'homeHealthAide', label: 'Home Health Aide (HHA)' },
    { id: 'medicalSocialWorker', label: 'Medical Social Worker (MSW)' },
    { id: 'providerAttendant', label: 'Provider Attendant Services (Medicaid)' },
    { id: 'other', label: 'Other' },
] as const;

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
  const [referralFiles, setReferralFiles] = useState<File[]>([]);
  const [progressNotesFiles, setProgressNotesFiles] = useState<File[]>([]);
  
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
      primaryInsurance: '',
      servicesNeeded: [],
      referralDocuments: undefined,
      progressNotes: undefined,
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, fileSetter: React.Dispatch<React.SetStateAction<File[]>>, fieldName: "referralDocuments" | "progressNotes") => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      fileSetter(files);
      form.setValue(fieldName, event.target.files);
    }
  };

  return (
    <div className="flex flex-col min-h-dvh">
      <SiteHeader />
      <main className="flex-1 py-12 md:py-20 bg-muted/20">
        <div className="container mx-auto max-w-4xl px-4">
            <Card className="mb-8 bg-card/80 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="font-headline text-2xl text-center">Contact Information</CardTitle>
                    <CardDescription className="text-center">How can we contact you about this referral?</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center justify-center gap-4 md:gap-8 text-sm">
                    <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-primary" />
                        <strong>Phone:</strong> 713-378-0781
                    </div>
                    <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-primary" />
                        <strong>Email:</strong> Office@Centraloftexas.com
                    </div>
                    <div className="flex items-center gap-2">
                        <Printer className="w-4 h-4 text-primary" />
                        <strong>Fax:</strong> 713-378-5289
                    </div>
                </CardContent>
            </Card>

          <form action={dispatch} className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline text-2xl">Referrer Information</CardTitle>
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
                <CardTitle className="font-headline text-2xl">Insurance Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="primaryInsurance">Primary Insurance *</Label>
                  <Controller
                    control={form.control}
                    name="primaryInsurance"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger id="primaryInsurance">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="medicare">Medicare</SelectItem>
                          <SelectItem value="medicaid">Medicaid</SelectItem>
                          <SelectItem value="private">Private Insurance</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <p className="text-xs text-muted-foreground">If "Other", we'll ask for plan name and member ID.</p>
                  {formState.errors?.primaryInsurance && <p className="text-sm text-destructive">{formState.errors.primaryInsurance[0]}</p>}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-headline text-2xl">Services Needed *</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Controller
                    name="servicesNeeded"
                    control={form.control}
                    render={({ field }) => (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {services.map((service) => (
                          <div key={service.id} className="flex items-center space-x-2 p-3 bg-muted/50 rounded-md">
                            <Checkbox
                              id={service.id}
                              checked={field.value?.includes(service.id)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...(field.value || []), service.id])
                                  : field.onChange(
                                      field.value?.filter(
                                        (value) => value !== service.id
                                      )
                                    );
                              }}
                            />
                            <Label htmlFor={service.id} className="font-normal cursor-pointer">{service.label}</Label>
                          </div>
                        ))}
                      </div>
                    )}
                  />
                  <p className="text-xs text-muted-foreground pt-2">Select at least one service. If unsure, choose "Skilled Nursing (SN)" and add details in Notes.</p>
                  {formState.errors?.servicesNeeded && <p className="text-sm text-destructive">{formState.errors.servicesNeeded[0]}</p>}
                </div>
              </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">Supporting Documentation (optional)</CardTitle>
                    <CardDescription>Uploading documents allows us to confirm insurance and respond faster. You can additionally fax it to 713-378-5289.</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <Label htmlFor="referralDocuments">Upload Referral Documents (optional)</Label>
                        <div className="flex items-center justify-center w-full">
                            <label htmlFor="referralDocuments" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <FileUp className="w-8 h-8 mb-3 text-muted-foreground" />
                                    <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span></p>
                                    <p className="text-xs text-muted-foreground">.pdf, .jpeg, .png</p>
                                </div>
                                <Input id="referralDocuments" name="referralDocuments" type="file" className="hidden" multiple onChange={(e) => handleFileChange(e, setReferralFiles, 'referralDocuments')} />
                            </label>
                        </div>
                        {referralFiles.length > 0 && (
                            <div className="pt-2">
                                <p className="text-sm font-medium">Selected files:</p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground">
                                    {referralFiles.map(file => <li key={file.name}>{file.name} ({(file.size / 1024 / 1024).toFixed(2)}MB)</li>)}
                                </ul>
                            </div>
                        )}
                        {formState.errors?.referralDocuments && <p className="text-sm text-destructive">{formState.errors.referralDocuments[0]}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="progressNotes">Upload Progress Notes (optional)</Label>
                        <div className="flex items-center justify-center w-full">
                            <label htmlFor="progressNotes" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <FileUp className="w-8 h-8 mb-3 text-muted-foreground" />
                                    <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span></p>
                                    <p className="text-xs text-muted-foreground">.pdf, .jpeg, .png</p>
                                </div>
                                <Input id="progressNotes" name="progressNotes" type="file" className="hidden" multiple onChange={(e) => handleFileChange(e, setProgressNotesFiles, 'progressNotes')} />
                            </label>
                        </div>
                        {progressNotesFiles.length > 0 && (
                            <div className="pt-2">
                                <p className="text-sm font-medium">Selected files:</p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground">
                                    {progressNotesFiles.map(file => <li key={file.name}>{file.name} ({(file.size / 1024 / 1024).toFixed(2)}MB)</li>)}
                                </ul>
                            </div>
                        )}
                        {formState.errors?.progressNotes && <p className="text-sm text-destructive">{formState.errors.progressNotes[0]}</p>}
                    </div>
                </CardContent>
            </Card>

            {formState.message && !formState.success && (
                <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{formState.message}</AlertDescription>
                </Alert>
            )}
            
            <SubmitButton