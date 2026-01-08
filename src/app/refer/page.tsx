'use client';

import React, { useState, useRef, useActionState, useFormStatus } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, FileUp, Loader2, AlertCircle, Phone, Mail, Printer, UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn, formatDate } from '@/lib/utils';
import SiteHeader from '@/components/layout/site-header';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { submitReferral, type FormState } from '@/lib/actions';
import { referralSchema } from '@/lib/schemas';

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

export default function ReferPage() {
  const [formState, formAction] = useActionState(submitReferral, { message: '', success: false });
  const { pending } = useFormStatus();

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
      documents: [],
    },
  });

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

          <form action={formAction} className="space-y-8">
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
                    <Input id="email" type="email" name="email" placeholder="e.g., case.manager@facility.com" />
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
                        <Input id="patientDOB" name="patientDOB" placeholder="YYYY-MM-DD" />
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
                  <Select name="primaryInsurance">
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {services.map((service) => (
                      <div key={service.id} className="flex items-center space-x-2 p-3 bg-muted/50 rounded-md">
                        <Checkbox
                          id={service.id}
                          name="servicesNeeded"
                          value={service.id}
                        />
                        <Label htmlFor={service.id} className="font-normal cursor-pointer">{service.label}</Label>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground pt-2">Select at least one service. If unsure, choose "Skilled Nursing (SN)" and add details in Notes.</p>
                  {formState.errors?.servicesNeeded && <p className="text-sm text-destructive">{formState.errors.servicesNeeded[0]}</p>}
                </div>
              </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">Supporting Documentation</CardTitle>
                    <CardDescription>You can optionally upload relevant documents like insurance cards, medical history, or physician's orders.</CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="space-y-2">
                        <Label htmlFor="documents">Upload Documents</Label>
                        <div className="flex items-center justify-center w-full">
                            <label htmlFor="documents" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <UploadCloud className="w-8 h-8 mb-3 text-muted-foreground" />
                                    <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload files</span></p>
                                    <p className="text-xs text-muted-foreground">PDF, JPG, PNG up to 1MB total</p>
                                </div>
                                <Input id="documents" name="documents" type="file" className="hidden" multiple />
                            </label>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {formState.message && !formState.success && (
                <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{formState.message}</AlertDescription>
                </Alert>
            )}
            
            <Button type="submit" disabled={pending} size="lg" className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90">
                {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                SUBMIT REFERRAL
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
