'use client';

import React, { useState, useActionState, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { z } from 'zod';
import { Loader2, AlertCircle, Phone, Mail, Printer, UploadCloud, File as FileIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import SiteHeader from '@/components/layout/site-header';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { submitReferral, type FormState } from '@/lib/actions';
import { referralSchema } from '@/lib/schemas';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

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

function FileUploadArea() {
    const [files, setFiles] = useState<File[]>([]);
    const [totalSize, setTotalSize] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const MAX_SIZE_MB = 1;
    const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
  
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(event.target.files || []);
      const newFiles = [...files, ...selectedFiles];
      setFiles(newFiles);
      const newTotalSize = newFiles.reduce((acc, file) => acc + file.size, 0);
      setTotalSize(newTotalSize);
    };

    const removeFile = (index: number) => {
        const newFiles = files.filter((_, i) => i !== index);
        setFiles(newFiles);
        const newTotalSize = newFiles.reduce((acc, file) => acc + file.size, 0);
        setTotalSize(newTotalSize);
         // Reset the file input value to allow re-selecting the same file
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };
  
    const isOverLimit = totalSize > MAX_SIZE_BYTES;
  
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-center w-full">
                <label htmlFor="documents" className={cn("flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted", isOverLimit && "border-destructive")}>
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <UploadCloud className={cn("w-8 h-8 mb-3 text-muted-foreground", isOverLimit && "text-destructive")} />
                        <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload files</span></p>
                        <p className="text-xs text-muted-foreground">PDF, JPG, PNG up to {MAX_SIZE_MB}MB total</p>
                    </div>
                    <Input id="documents" name="documents" type="file" className="hidden" multiple onChange={handleFileChange} ref={fileInputRef} />
                </label>
            </div>
            {files.length > 0 && (
                <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                        <p className="font-medium">Selected files ({files.length})</p>
                        <p className={cn("font-medium", isOverLimit ? "text-destructive" : "text-muted-foreground")}>
                            {(totalSize / (1024 * 1024)).toFixed(2)} MB / {MAX_SIZE_MB} MB
                        </p>
                    </div>
                     <Progress value={(totalSize / MAX_SIZE_BYTES) * 100} className={cn("h-2", isOverLimit && "[&>div]:bg-destructive")} />
                    {isOverLimit && (
                        <p className="text-sm text-destructive">
                           Total file size exceeds the {MAX_SIZE_MB}MB limit. Please remove some files.
                        </p>
                    )}
                    <ul className="space-y-2">
                        {files.map((file, index) => (
                        <li key={index} className="flex items-center justify-between p-2 rounded-md bg-muted text-sm">
                            <div className="flex items-center gap-2 overflow-hidden">
                                <FileIcon className="h-4 w-4 flex-shrink-0" />
                                <span className="truncate">{file.name}</span>
                                <span className="text-muted-foreground flex-shrink-0">({(file.size / 1024).toFixed(1)} KB)</span>
                            </div>
                            <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFile(index)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

export default function ReferPage() {
  const [formState, formAction] = useActionState(submitReferral, { message: '', success: false, isSubmitting: false });
  const { pending } = useFormStatus();

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
                    <Label htmlFor="email">Email Address (for confirmation)</Label>
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
                    <CardDescription>You can optionally upload relevant documents like insurance cards, medical history, or physician's orders. </CardDescription>
                </CardHeader>
                <CardContent>
                     <FileUploadArea />
                </CardContent>
            </Card>

            {formState.message && !formState.success && (
                <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{formState.message}</AlertDescription>
                </Alert>
            )}
            
            <Button type="submit" disabled={pending || formState.isSubmitting} size="lg" className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90">
                {pending || formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {formState.isSubmitting ? 'Submitting & Processing Files...' : 'SUBMIT REFERRAL'}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
