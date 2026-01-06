'use client';

import React, { useState } from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarIcon, FileUp, Loader2, AlertCircle } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import SiteHeader from '@/components/layout/site-header';
import Link from 'next/link';

type FormData = z.infer<typeof referralSchema>;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      SUBMIT
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
      referrerName: '',
      providerNpi: '',
      referrerContact: '',
      referrerFax: '',
      contactPerson: '',
      confirmationEmail: '',
      patientFirstName: '',
      patientLastName: '',
      patientContact: '',
      patientDOB: '',
      patientInsurance: '',
      memberId: '',
      authorizationNumber: '',
      examRequested: undefined,
      examOther: '',
      diagnosis: '',
      reasonForExam: '',
      documents: undefined,
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFiles(Array.from(event.target.files));
      form.setValue('documents', event.target.files);
    }
  };

  const examRequested = form.watch('examRequested');

  return (
    <div className="flex flex-col min-h-dvh">
      <SiteHeader />
      <main className="flex-1 py-12 md:py-20 bg-gray-50">
        <div className="container mx-auto max-w-4xl px-4">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="font-headline text-3xl">REFER A PATIENT</CardTitle>
              <CardDescription>Please complete the required fields*</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={dispatch} className="space-y-8">
                {formState.message && !formState.success && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{formState.message}</AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-4 p-4 border rounded-md">
                  <h3 className="font-headline text-xl border-b pb-2">Referral Information</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="referrerName">Referring Provider/Office*</Label>
                      <Input id="referrerName" name="referrerName" />
                      {formState.errors?.referrerName && <p className="text-sm text-destructive">{formState.errors.referrerName[0]}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="providerNpi">Provider NPI#*</Label>
                      <Input id="providerNpi" name="providerNpi" />
                      {formState.errors?.providerNpi && <p className="text-sm text-destructive">{formState.errors.providerNpi[0]}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="referrerContact">Referring Provider Phone Number*</Label>
                      <Input id="referrerContact" name="referrerContact" />
                      {formState.errors?.referrerContact && <p className="text-sm text-destructive">{formState.errors.referrerContact[0]}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="referrerFax">Referring Provider Fax*</Label>
                      <Input id="referrerFax" name="referrerFax" />
                       {formState.errors?.referrerFax && <p className="text-sm text-destructive">{formState.errors.referrerFax[0]}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactPerson">Contact Person*</Label>
                      <Input id="contactPerson" name="contactPerson" />
                      {formState.errors?.contactPerson && <p className="text-sm text-destructive">{formState.errors.contactPerson[0]}</p>}
                    </div>
                     <div className="space-y-2">
                      <Label htmlFor="confirmationEmail">Email for confirmation*</Label>
                      <Input id="confirmationEmail" name="confirmationEmail" type="email" />
                      {formState.errors?.confirmationEmail && <p className="text-sm text-destructive">{formState.errors.confirmationEmail[0]}</p>}
                    </div>
                  </div>
                </div>

                <div className="space-y-4 p-4 border rounded-md">
                  <h3 className="font-headline text-xl border-b pb-2">Patient Information</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="patientFirstName">Patient Name (First)*</Label>
                      <Input id="patientFirstName" name="patientFirstName" />
                      {formState.errors?.patientFirstName && <p className="text-sm text-destructive">{formState.errors.patientFirstName[0]}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="patientLastName">Patient Name (Last)*</Label>
                      <Input id="patientLastName" name="patientLastName" />
                      {formState.errors?.patientLastName && <p className="text-sm text-destructive">{formState.errors.patientLastName[0]}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="patientContact">Patient Phone Number*</Label>
                      <Input id="patientContact" name="patientContact" />
                      {formState.errors?.patientContact && <p className="text-sm text-destructive">{formState.errors.patientContact[0]}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="patientDOB">Patient Date of Birth*</Label>
                      <Popover>
                          <PopoverTrigger asChild>
                              <Button
                              variant={"outline"}
                              className={cn("w-full justify-start text-left font-normal", !form.watch('patientDOB') && "text-muted-foreground")}
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
                                captionLayout="dropdown-buttons" 
                                fromYear={1900} toYear={new Date().getFullYear()}
                              />
                          </PopoverContent>
                      </Popover>
                      <Input type="hidden" id="patientDOB" name="patientDOB" value={form.watch('patientDOB')} />
                      {formState.errors?.patientDOB && <p className="text-sm text-destructive">{formState.errors.patientDOB[0]}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="patientInsurance">Patient's Insurance*</Label>
                      <Input id="patientInsurance" name="patientInsurance" />
                      {formState.errors?.patientInsurance && <p className="text-sm text-destructive">{formState.errors.patientInsurance[0]}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="memberId">Member ID#*</Label>
                      <Input id="memberId" name="memberId" />
                      {formState.errors?.memberId && <p className="text-sm text-destructive">{formState.errors.memberId[0]}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="authorizationNumber">Authorization# (if required)</Label>
                      <Input id="authorizationNumber" name="authorizationNumber" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 p-4 border rounded-md">
                    <h3 className="font-headline text-xl border-b pb-2">Exam Information</h3>
                    <div className="space-y-2">
                        <Label htmlFor="examRequested">Exam Requested*</Label>
                        <Select name="examRequested" onValueChange={(value) => form.setValue('examRequested', value as any)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select exam" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="MRI">MRI</SelectItem>
                                <SelectItem value="CT">CT</SelectItem>
                                <SelectItem value="Ultrasound">Ultrasound</SelectItem>
                                <SelectItem value="X-RAY">X-RAY</SelectItem>
                                <SelectItem value="DEXA">DEXA</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                        {formState.errors?.examRequested && <p className="text-sm text-destructive">{formState.errors.examRequested[0]}</p>}
                    </div>

                    {examRequested === 'Other' && (
                        <div className="space-y-2">
                            <Label htmlFor="examOther">If other, please specify</Label>
                            <Input id="examOther" name="examOther" />
                            {formState.errors?.examOther && <p className="text-sm text-destructive">{formState.errors.examOther[0]}</p>}
                        </div>
                    )}
                    
                    <div className="space-y-2">
                        <Label htmlFor="diagnosis">Diagnosis/Signs/Symptoms*</Label>
                        <Textarea id="diagnosis" name="diagnosis" />
                        {formState.errors?.diagnosis && <p className="text-sm text-destructive">{formState.errors.diagnosis[0]}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label>STAT/PRIORITY</Label>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <Checkbox id="stat" name="STAT" />
                                <Label htmlFor="stat">STAT/PRIORITY</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="urgent" name="URGENT" />
                                <Label htmlFor="urgent">URGENT/SAME DAY</Label>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Contrast</Label>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0">
                            <div className="flex items-center space-x-2">
                                <Checkbox id="withContrast" name="With Contrast" />
                                <Label htmlFor="withContrast">With Contrast</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="withoutContrast" name="Without Contrast" />
                                <Label htmlFor="withoutContrast">Without Contrast</Label>
                            </div>
                             <div className="flex items-center space-x-2">
                                <Checkbox id="withAndWithout" name="With and Without Contrast" />
                                <Label htmlFor="withAndWithout">With and Without</Label>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="reasonForExam">Please specify reason for exam</Label>
                        <Textarea id="reasonForExam" name="reasonForExam" />
                    </div>
                </div>

                <div className="space-y-4 p-4 border rounded-md">
                  <h3 className="font-headline text-xl border-b pb-2">Upload Orders</h3>
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
                </div>

                <SubmitButton />
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
