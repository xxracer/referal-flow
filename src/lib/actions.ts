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
  // Set isSubmitting to true immediately
  const submissionState: FormState = { ...prevState, isSubmitting: true, message: 'Processing...', success: false };
  
  const validatedFields = referralSchema.safeParse({
    organizationName: formData.get('organizationName'),
    contactName: formData.get('contactName'),
    phone: formData.get('phone'),
    email: formData.get('email'),
    patientFullName: formData.get('patientFullName'),
    patientDOB: formData.get('patientDOB'),
    patientZipCode: formData.get('patientZipCode'),
    primaryInsurance: formData.get('primaryInsurance'),
    servicesNeeded: formData.getAll('servicesNeeded'),
    documents: formData.getAll('documents'),
  });
  
  if (!validatedFields.success) {
    return {
      message: 'Please correct the errors below.',
      errors: validatedFields.error.flatten().fieldErrors,
      success: false,
      isSubmitting: false,
    };
  }
  
  const referralId = `TX-REF-2026-${Date.now().toString().slice(-6)}`;
  
  const uploadedDocuments: Document[] = [];
  const documentFiles = formData.getAll('documents') as File[];
  const dataForPdf = { ...validatedFields.data, documents: undefined };

  try {
    // 1. Upload user-provided documents, preserving original names
    for (const file of documentFiles) {
      if (file && file.size > 0) {
        const blob = await put(file.name, file, { access: 'public', addRandomSuffix: false });
        uploadedDocuments.push({
            id: blob.pathname,
            name: file.name,
            url: blob.url,
            size: file.size,
        });
      }
    }

    // 2. Generate PDF from form data using AI flow
    const pdfBytes = await generateReferralPdf(dataForPdf);
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

  // 3. (Optional) AI categorization based on uploaded documents
  let aiSummary: AISummary | undefined = undefined;
  // This part is kept for future-proofing but is not fully implemented for this step.
  
  const now = new Date();
  const { organizationName, contactName, phone, email, patientFullName, patientDOB, patientZipCode, primaryInsurance, servicesNeeded } = validatedFields.data;

  const newReferral: Referral = {
    id: referralId,
    referrerName: organizationName, 
    contactPerson: contactName, 
    referrerContact: phone, 
    confirmationEmail: email || '',
    patientName: patientFullName,
    patientDOB,
    patientContact: '',
    patientInsurance: primaryInsurance, 
    memberId: '',
    patientZipCode,
    servicesNeeded,
    examRequested: 'See Services Needed',
    diagnosis: 'See attached documents',
    providerNpi: '',
    referrerFax: '',
    status: 'RECEIVED',
    createdAt: now,
    updatedAt: now,
    documents: uploadedDocuments,
    statusHistory: [{ status: 'RECEIVED', changedAt: now }],
    internalNotes: [],
    aiSummary: aiSummary,
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
