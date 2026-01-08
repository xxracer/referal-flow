'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { referralSchema } from './schemas';
import { db } from './data';
import type { Referral, ReferralStatus, AISummary, Document } from './types';
import { categorizeReferral } from '@/ai/flows/smart-categorization';
import { generateReferralPdf } from '@/ai/flows/generate-referral-pdf';
import { put } from '@vercel/blob';

export type FormState = {
  message: string;
  errors?: Record<string, string[] | undefined>;
  success: boolean;
  data?: any;
  isSubmitting?: boolean;
};

export async function submitReferral(prevState: FormState, formData: FormData): Promise<FormState> {
  const submissionState: FormState = { ...prevState, isSubmitting: true, message: 'Processing...', success: false };
  
  const formValues = Object.fromEntries(formData.entries());
  formValues.servicesNeeded = formData.getAll('servicesNeeded');
  formValues.documents = formData.getAll('documents').filter(f => f instanceof File && f.size > 0);

  const validatedFields = referralSchema.safeParse(formValues);
  
  if (!validatedFields.success) {
    return {
      message: 'Please correct the errors below.',
      errors: validatedFields.error.flatten().fieldErrors,
      success: false,
      isSubmitting: false,
    };
  }
  
  const { documents, ...pdfData } = validatedFields.data;
  const referralId = `TX-REF-2026-${Date.now().toString().slice(-6)}`;
  const uploadedDocuments: Document[] = [];

  try {
    // 1. Upload user-provided documents
    if (documents) {
      for (const file of documents) {
        if (file) {
          const blob = await put(file.name, file, { access: 'public', addRandomSuffix: false });
          uploadedDocuments.push({
              id: blob.pathname,
              name: file.name,
              url: blob.url,
              size: file.size,
          });
        }
      }
    }

    // 2. Generate PDF from form data using AI flow
    const pdfBytes = await generateReferralPdf(pdfData);
    const pdfName = `Referral-Summary-${referralId}.pdf`;
    const pdfBlob = await put(pdfName, pdfBytes, { access: 'public', contentType: 'application/pdf' });
    uploadedDocuments.push({
      id: pdfBlob.pathname,
      name: pdfName,
      url: pdfBlob.url,
      size: pdfBytes.length,
    });

  } catch (e) {
      console.error("Error during file upload or PDF generation:", e);
      return { message: 'An error occurred while handling files. Please try again.', success: false, isSubmitting: false };
  }
  
  const now = new Date();
  const { 
      organizationName, contactName, phone, email, 
      patientFullName, patientDOB, patientAddress, patientZipCode, pcpName, pcpPhone, surgeryDate, covidStatus,
      primaryInsurance, memberId, insuranceType, planName, planNumber, groupNumber,
      servicesNeeded, diagnosis 
  } = validatedFields.data;

  const newReferral: Referral = {
    id: referralId,
    referrerName: organizationName, 
    contactPerson: contactName, 
    referrerContact: phone, 
    confirmationEmail: email || '',
    patientName: patientFullName,
    patientDOB,
    patientAddress,
    patientZipCode,
    pcpName,
    pcpPhone,
    surgeryDate,
    covidStatus,
    patientContact: '', // Not in form
    patientInsurance: primaryInsurance, 
    memberId,
    insuranceType,
    planName,
    planNumber,
    groupNumber,
    servicesNeeded,
    diagnosis,
    examRequested: 'See Services Needed',
    providerNpi: '', // Not in form
    referrerFax: '', // Not in form
    status: 'RECEIVED',
    createdAt: now,
    updatedAt: now,
    documents: uploadedDocuments,
    statusHistory: [{ status: 'RECEIVED', changedAt: now }],
    internalNotes: [],
  };

  try {
    await db.saveReferral(newReferral);
  } catch (e) {
    return { message: 'Database error: Failed to save referral.', success: false, isSubmitting: false };
  }

  revalidatePath('/dashboard');
  redirect(`/refer/success/${referralId}`);
}

export async function checkStatus(prevState: FormState, formData: FormData): Promise<FormState> {
    const referral = await db.findReferral(formData.get('referralId') as string, formData.get('patientDOB') as string);

    if (!referral) {
        return { message: 'No matching referral found. Please check the ID and date of birth.', success: false };
    }

    const optionalNote = formData.get('optionalNote') as string;
    let noteAdded = false;
    if (optionalNote) {
        const now = new Date();
        referral.internalNotes.push({
            id: `note-${Date.now()}`,
            content: optionalNote,
            author: 'Referrer/Patient',
            createdAt: now,
        });
        referral.updatedAt = now;
        await db.saveReferral(referral);
        noteAdded = true;
        revalidatePath(`/dashboard/referrals/${referral.id}`);
    }

    return {
        message: 'Referral found.',
        success: true,
        data: {
            status: referral.status,
            updatedAt: referral.updatedAt,
            noteAdded,
        }
    };
}

export async function addInternalNote(referralId: string, prevState: FormState, formData: FormData): Promise<FormState> {
    const referral = await db.getReferralById(referralId);
    if (!referral) {
        return { message: 'Referral not found.', success: false };
    }

    const note = formData.get('note') as string;
    if (!note) {
        return { message: 'Note cannot be empty.', success: false };
    }

    const now = new Date();
    referral.internalNotes.push({
        id: `note-${Date.now()}`,
        content: note,
        author: 'Staff Member',
        createdAt: now,
    });
    referral.updatedAt = now;
    
    await db.saveReferral(referral);

    revalidatePath(`/dashboard/referrals/${referralId}`);
    return { message: 'Note added successfully.', success: true };
}

export async function updateReferralStatus(referralId: string, prevState: FormState, formData: FormData): Promise<FormState> {
    const status = formData.get('status') as ReferralStatus;
    if (!status) {
        return { message: 'Status is required.', success: false };
    }
    
    const referral = await db.getReferralById(referralId);
    if (!referral) {
        return { message: 'Referral not found.', success: false };
    }

    const now = new Date();
    referral.status = status;
    referral.statusHistory.push({ status, changedAt: now });
    referral.updatedAt = now;

    await db.saveReferral(referral);

    revalidatePath(`/dashboard/referrals/${referralId}`);
    revalidatePath('/dashboard');
    return { message: 'Status updated.', success: true };
}
