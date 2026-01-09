'use client';

import React, { useState, useActionState, useRef, useEffect, useCallback } from 'react';
import { useFormStatus } from 'react-dom';
import { z } from 'zod';
import { Loader2, AlertCircle, Phone, Mail, Printer, UploadCloud, File as FileIcon, X, CheckCircle } from 'lucide-react';
import { initializeFirebase } from '@/firebase';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import SiteHeader from '@/components/layout/site-header';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { submitReferral, type FormState } from '@/lib/actions';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';

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

const insuranceOptions = [
    "Medicare", "Aetna Medicare", "BCBS Medicare", "Community Health Choice",
    "Integranet", "Molina Medicare", "UHC Medicare", "United Health Care Choice",
    "United Health Care MMP", "United Medicare Advantage", "Wellcare Medical",
    "Wellcare Texan Plus", "Wellmed-Wellpoint Medicaid", "Wellpoint Medicare",
    "Wellpoint MMP", "Other"
];

const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

type UploadStatus = 'uploading' | 'completed' | 'error';

interface UploadableFile {
  file: File;
  status: UploadStatus;
  progress: number;
  url?: string;
  error?: string;
}

interface FileListProps {
  files: UploadableFile[];
  onRemove: (index: number) => void;
}

function FileList({ files, onRemove }: FileListProps) {
  if (files.length === 0) return null;

  return (
    <ul className="space-y-2 mt-2">
      {files.map((upload, index) => (
        <li key={index} className="flex items-center justify-between p-2 rounded-md bg-muted text-sm">
          <div className="flex items-center gap-2 overflow-hidden flex-1">
            <FileIcon className="h-4 w-4 flex-shrink-0" />
            <div className="flex-1 overflow-hidden">
                <p className="truncate">{upload.file.name} <span className="text-muted-foreground text-xs">({(upload.file.size / 1024).toFixed(1)} KB)</span></p>
                {upload.status === 'uploading' && <Progress value={upload.progress} className="h-1 mt-1" />}
                {upload.status === 'completed' && <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle className="h-3 w-3"/> Upload successful</p>}
                {upload.status === 'error' && <p className="text-xs text-destructive">{upload.error || 'Upload failed'}</p>}
            </div>
          </div>
          {upload.status !== 'uploading' && (
            <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => onRemove(index)}>
                <X className="h-4 w-4" />
            </Button>
          )}
        </li>
      ))}
    </ul>
  );
}


export default function ReferPage() {
  const [formState, formAction] = useActionState(submitReferral, { message: '', success: false, isSubmitting: false });
  const { pending } = useFormStatus();
  const formRef = useRef<HTMLFormElement>(null);

  const [referralDocs, setReferralDocs] = useState<UploadableFile[]>([]);
  const [progressNotes, setProgressNotes] = useState<UploadableFile[]>([]);
  const referralDocsRef = useRef<HTMLInputElement>(null);
  const progressNotesRef = useRef<HTMLInputElement>(null);

  const allFiles = [...referralDocs, ...progressNotes];
  const totalSize = allFiles.reduce((acc, up) => acc + up.file.size, 0);
  const isOverLimit = totalSize > MAX_SIZE_BYTES;
  const isUploading = allFiles.some(f => f.status === 'uploading');

  const handleUpload = (files: File[], setUploads: React.Dispatch<React.SetStateAction<UploadableFile[]>>) => {
    const { storage } = initializeFirebase();
    const newUploads: UploadableFile[] = files.map(file => ({
      file,
      status: 'uploading',
      progress: 0,
    }));

    setUploads(prev => [...prev, ...newUploads]);

    newUploads.forEach((upload, index) => {
      const originalIndex = Date.now() + index; // A simple unique ID for this upload batch
      const storageRef = ref(storage, `uploads/${Date.now()}_${upload.file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, upload.file);

      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploads(prev => prev.map(u => u.file === upload.file ? { ...u, progress } : u));
        },
        (error) => {
          console.error("Upload error:", error);
          setUploads(prev => prev.map(u => u.file === upload.file ? { ...u, status: 'error', error: error.message } : u));
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            setUploads(prev => prev.map(u => u.file === upload.file ? { ...u, status: 'completed', url: downloadURL, progress: 100 } : u));
          });
        }
      );
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, setUploads: React.Dispatch<React.SetStateAction<UploadableFile[]>>) => {
    const newFiles = Array.from(event.target.files || []);
    if (newFiles.length > 0) {
      handleUpload(newFiles, setUploads);
    }
    event.target.value = '';
  };

  const removeFile = (index: number, setUploads: React.Dispatch<React.SetStateAction<UploadableFile[]>>) => {
    setUploads(prev => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (formState.success) {
      formRef.current?.reset();
      setReferralDocs([]);
      setProgressNotes([]);
    }
  }, [formState.success]);

  const formActionWithFiles: (payload: FormData) => void = (payload) => {
    const referralDocUrls = referralDocs.filter(f => f.status === 'completed' && f.url).map(f => f.url!);
    const progressNoteUrls = progressNotes.filter(f => f.status === 'completed' && f.url).map(f => f.url!);

    payload.append('referralDocumentUrls', JSON.stringify(referralDocUrls));
    payload.append('progressNoteUrls', JSON.stringify(progressNoteUrls));

    // Also pass file names and sizes for record keeping
    const referralDocMetadata = referralDocs.filter(f => f.status === 'completed').map(f => ({ name: f.file.name, size: f.file.size }));
    const progressNoteMetadata = progressNotes.filter(f => f.status === 'completed').map(f => ({ name: f.file.name, size: f.file.size }));
    payload.append('referralDocumentMetadata', JSON.stringify(referralDocMetadata));
    payload.append('progressNoteMetadata', JSON.stringify(progressNoteMetadata));

    formAction(payload);
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
                    <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-primary" /><strong>Phone:</strong> 713-378-0781</div>
                    <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-primary" /><strong>Email:</strong> Office@Centraloftexas.com</div>
                    <div className="flex items-center gap-2"><Printer className="w-4 h-4 text-primary" /><strong>Fax:</strong> 713-378-5289</div>
                </CardContent>
            </Card>

          <form action={formActionWithFiles} ref={formRef} className="space-y-8">
            <Card>
              <CardHeader><CardTitle className="font-headline text-2xl">Referrer Information</CardTitle></CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="organizationName">Organization / Facility Name</Label>
                    <Input id="organizationName" name="organizationName" placeholder="e.g., Memorial Hermann" />
                    {formState.errors?.organizationName && <p className="text-sm text-destructive">{formState.errors.organizationName[0]}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactName">Contact Name</Label>
                    <Input id="contactName" name="contactName" placeholder="e.g., Maria Lopez" />
                    {formState.errors?.contactName && <p className="text-sm text-destructive">{formState.errors.contactName[0]}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" name="phone" placeholder="e.g., (713) 555-1234" />
                    {formState.errors?.phone && <p className="text-sm text-destructive">{formState.errors.phone[0]}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address (for confirmation)</Label>
                    <Input id="email" type="email" name="email" placeholder="e.g., case.manager@facility.com" />
                    {formState.errors?.email && <p className="text-sm text-destructive">{formState.errors.email[0]}</p>}
                  </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="font-headline text-2xl">Patient Information</CardTitle></CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="patientFullName">Patient Full Name</Label>
                      <Input id="patientFullName" name="patientFullName" placeholder="e.g., John Doe" />
                      {formState.errors?.patientFullName && <p className="text-sm text-destructive">{formState.errors.patientFullName[0]}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="patientDOB">Date of Birth</Label>
                        <Input id="patientDOB" name="patientDOB" placeholder="YYYY-MM-DD" />
                        {formState.errors?.patientDOB && <p className="text-sm text-destructive">{formState.errors.patientDOB[0]}</p>}
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="patientAddress">Patient Full Address</Label>
                        <Input id="patientAddress" name="patientAddress" placeholder="e.g., 123 Main St, Houston, TX" />
                        {formState.errors?.patientAddress && <p className="text-sm text-destructive">{formState.errors.patientAddress[0]}</p>}
                    </div>
                     <div className="space-y-2">
                      <Label htmlFor="patientZipCode">Patient ZIP Code</Label>
                      <Input id="patientZipCode" name="patientZipCode" placeholder="e.g., 77005" />
                       {formState.errors?.patientZipCode && <p className="text-sm text-destructive">{formState.errors.patientZipCode[0]}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="pcpName">PCP Name</Label>
                        <Input id="pcpName" name="pcpName" />
                        {formState.errors?.pcpName && <p className="text-sm text-destructive">{formState.errors.pcpName[0]}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="pcpPhone">PCP Phone</Label>
                        <Input id="pcpPhone" name="pcpPhone" />
                        {formState.errors?.pcpPhone && <p className="text-sm text-destructive">{formState.errors.pcpPhone[0]}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="surgeryDate">Surgery Date</Label>
                        <Input id="surgeryDate" name="surgeryDate" type="date" />
                        {formState.errors?.surgeryDate && <p className="text-sm text-destructive">{formState.errors.surgeryDate[0]}</p>}
                    </div>
                     <div className="space-y-2 md:col-span-2">
                        <Label>COVID? Yes/No</Label>
                        <Select name="covidStatus">
                            <SelectTrigger><SelectValue placeholder="Select status..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="No">No</SelectItem>
                                <SelectItem value="Yes">Yes</SelectItem>
                            </SelectContent>
                        </Select>
                        {formState.errors?.covidStatus && <p className="text-sm text-destructive">{formState.errors.covidStatus[0]}</p>}
                    </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="font-headline text-2xl">Insurance Information</CardTitle></CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="primaryInsurance">Primary Insurance Payer</Label>
                    <Select name="primaryInsurance">
                        <SelectTrigger id="primaryInsurance"><SelectValue placeholder="Select..." /></SelectTrigger>
                        <SelectContent>
                            {insuranceOptions.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    {formState.errors?.primaryInsurance && <p className="text-sm text-destructive">{formState.errors.primaryInsurance[0]}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="memberId">Member ID#</Label>
                  <Input id="memberId" name="memberId" />
                  {formState.errors?.memberId && <p className="text-sm text-destructive">{formState.errors.memberId[0]}</p>}
                </div>
                <div className="space-y-2"><Label htmlFor="insuranceType">Type</Label><Input id="insuranceType" name="insuranceType" placeholder="e.g., MA PPO" />{formState.errors?.insuranceType && <p className="text-sm text-destructive">{formState.errors.insuranceType[0]}</p>}</div>
                <div className="space-y-2"><Label htmlFor="planNumber">Plan Number#</Label><Input id="planNumber" name="planNumber" />{formState.errors?.planNumber && <p className="text-sm text-destructive">{formState.errors.planNumber[0]}</p>}</div>
                <div className="space-y-2"><Label htmlFor="planName">Plan Name</Label><Input id="planName" name="planName" placeholder="e.g., LPPO-AARP MEDICARE ADVANTAGE" />{formState.errors?.planName && <p className="text-sm text-destructive">{formState.errors.planName[0]}</p>}</div>
                <div className="space-y-2"><Label htmlFor="groupNumber">Group Number#</Label><Input id="groupNumber" name="groupNumber" />{formState.errors?.groupNumber && <p className="text-sm text-destructive">{formState.errors.groupNumber[0]}</p>}</div>
              </CardContent>
            </Card>
            
            <Card>
                <CardHeader><CardTitle className="font-headline text-2xl">Services & Diagnosis</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label>Services Needed</Label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {services.map((service) => (
                            <div key={service.id} className="flex items-center space-x-2 p-3 bg-muted/50 rounded-md">
                                <Checkbox id={service.id} name="servicesNeeded" value={service.id} />
                                <Label htmlFor={service.id} className="font-normal cursor-pointer">{service.label}</Label>
                            </div>
                            ))}
                        </div>
                        {formState.errors?.servicesNeeded && <p className="text-sm text-destructive">{formState.errors.servicesNeeded[0]}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="diagnosis">Patient Diagnosis & Order Notes</Label>
                        <Textarea id="diagnosis" name="diagnosis" placeholder="e.g., Dx: Pain of right hip joint | Arthritis, lumbar spine" />
                        {formState.errors?.diagnosis && <p className="text-sm text-destructive">{formState.errors.diagnosis[0]}</p>}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle className="font-headline text-2xl">Supporting Documentation</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="referralDocuments">Referral Documents</Label>
                        <Input id="referralDocuments" type="file" multiple ref={referralDocsRef} onChange={(e) => handleFileChange(e, setReferralDocs)} className="hidden" />
                        <Button type="button" variant="outline" className="w-full" onClick={() => referralDocsRef.current?.click()}>
                            <UploadCloud className="mr-2" /> Choose Files
                        </Button>
                        <FileList files={referralDocs} onRemove={(index) => removeFile(index, setReferralDocs)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="progressNotes">Progress Notes</Label>
                        <Input id="progressNotes" type="file" multiple ref={progressNotesRef} onChange={(e) => handleFileChange(e, setProgressNotes)} className="hidden" />
                        <Button type="button" variant="outline" className="w-full" onClick={() => progressNotesRef.current?.click()}>
                            <UploadCloud className="mr-2" /> Choose Files
                        </Button>
                        <FileList files={progressNotes} onRemove={(index) => removeFile(index, setProgressNotes)} />
                    </div>

                    <p className="text-sm text-muted-foreground">Uploading documents allows us to confirm insurance and respond faster. You can additionally fax it to 713-378-5289. Max total size: {MAX_SIZE_MB}MB.</p>

                    {allFiles.length > 0 && (
                        <div className="space-y-2 pt-2">
                            <div className="flex justify-between items-center text-sm">
                                <p className="font-medium">Total selected size</p>
                                <p className={cn("font-medium", isOverLimit ? "text-destructive" : "text-muted-foreground")}>
                                    {(totalSize / (1024 * 1024)).toFixed(2)} MB / {MAX_SIZE_MB} MB
                                </p>
                            </div>
                            <Progress value={(totalSize / MAX_SIZE_BYTES) * 100} className={cn("h-2", isOverLimit && "[&>div]:bg-destructive")} />
                            {isOverLimit && (
                                <p className="text-sm text-destructive">Total file size exceeds the {MAX_SIZE_MB}MB limit. Please remove some files.</p>
                            )}
                        </div>
                    )}
                    {formState.errors?.referralDocuments && <p className="text-sm text-destructive">{formState.errors.referralDocuments[0]}</p>}
                </CardContent>
            </Card>

            {formState.message && !formState.success && (<Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{formState.message}</AlertDescription></Alert>)}

            <Button type="submit" disabled={pending || formState.isSubmitting || isOverLimit || isUploading} size="lg" className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90">
                {pending || formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isUploading ? 'Uploading files...' : (formState.isSubmitting ? 'Submitting...' : 'SUBMIT REFERRAL')}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
