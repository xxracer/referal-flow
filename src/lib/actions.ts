'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { referralSchema, statusCheckSchema, noteSchema } from './schemas';
import { db } from './data';
import type { Referral, ReferralStatus, AISummary } from './types';
import { categorizeReferral } from '@/ai/flows/smart-categorization';

// Type for state management with useFormState
export type FormState = {
  message: string;
  errors?: Record<string, string[] | undefined>;
  success: boolean;
  data?: any;
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf', 'image/gif'];


export async function submitReferral(prevState: FormState, formData: FormData): Promise<FormState> {
  const validatedFields = referralSchema.safeParse({
    organizationName: formData.get('organizationName'),
    contactName: formData.get('contactName'),
    phone: formData.get('phone'),
    email: formData.get('email'),
    patientFullName: formData.get('patientFullName'),
    patientDOB: formData.get('patientDOB'),
    patientZipCode: formData.get('patientZipCode'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Please correct the errors below.',
      errors: validatedFields.error.flatten().fieldErrors,
      success: false,
    };
  }
  
  const documents = formData.getAll('documents') as File[];
  const validDocuments = [];

  for (const doc of documents) {
      if (doc.size > 0) {
        if (doc.size > MAX_FILE_SIZE) {
            return { message: `File "${doc.name}" exceeds the 5MB size limit.`, success: false };
        }
        if (!ACCEPTED_FILE_TYPES.includes(doc.type)) {
            return { message: `File type for "${doc.name}" is not supported.`, success: false };
        }
        validDocuments.push(doc);
      }
  }

  const referralId = `TX-REF-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
  const now = new Date();
  
  const { organizationName, contactName, phone, email, patientFullName, patientDOB, patientZipCode } = validatedFields.data;

  // Handle AI Categorization
  let aiSummary: AISummary | undefined = undefined;
  if (validDocuments.length > 0) {
    const documentsData: string[] = [];
    for (const file of validDocuments) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const dataURI = `data:${file.type};base64,${buffer.toString('base64')}`;
        documentsData.push(dataURI);
    }

    try {
        aiSummary = await categorizeReferral({
            documents: documentsData,
            patientName: patientFullName,
            referrerName: organizationName,
        });
    } catch (e) {
        console.error("AI categorization failed:", e);
        // Do not block submission if AI fails.
    }
  }
  
  const newReferral: Referral = {
    id: referralId,
    // New fields
    referrerName: organizationName, // Mapping old field
    contactPerson: contactName, // Mapping old field
    referrerContact: phone, // Mapping old field
    confirmationEmail: email || '', // Mapping old field
    patientName: patientFullName, // Mapping old field
    patientDOB,
    // Retain some structure from before, but with new data
    providerNpi: '', // No longer in form
    referrerFax: '', // No longer in form
    patientContact: '', // No longer in form
    patientInsurance: '', // No longer in form
    memberId: '', // No longer in form
    examRequested: 'Not Specified', // No longer in form
    diagnosis: 'Not Specified', // No longer in form
    
    // Default values for fields no longer in the form
    status: 'RECEIVED',
    createdAt: now,
    updatedAt: now,
    documents: validDocuments.map((doc, i) => ({ id: `doc-${i}`, name: doc.name, url: '#', size: doc.size })),
    statusHistory: [{ status: 'RECEIVED', changedAt: now }],
    internalNotes: [],
    aiSummary: aiSummary,
  };

  try {
    await db.saveReferral(newReferral);
  } catch (e) {
    return { message: 'Database error: Failed to save referral.', success: false };
  }

  revalidatePath('/dashboard');
  redirect(`/refer/success/${referralId}`);
}


export async function checkStatus(prevState: FormState, formData: FormData): Promise<FormState> {
    const validatedFields = statusCheckSchema.safeParse({
        referralId: formData.get('referralId'),
        patientDOB: formData.get('patientDOB'),
    });

    if (!validatedFields.success) {
        return {
            message: 'Please correct the errors below.',
            errors: validatedFields.error.flatten().fieldErrors,
            success: false,
        };
    }

    const { referralId, patientDOB } = validatedFields.data;
    const referral = await db.findReferral(referralId, patientDOB);

    if (!referral) {
        return { message: 'No matching referral found. Please check the ID and date of birth.', success: false };
    }

    return {
        message: 'Referral found.',
        success: true,
        data: {
            status: referral.status,
            updatedAt: referral.updatedAt.toISOString(),
        }
    };
}


export async function addInternalNote(referralId: string, formData: FormData): Promise<FormState> {
    const validatedFields = noteSchema.safeParse({
        note: formData.get('note'),
    });

    if (!validatedFields.success) {
        return {
            message: 'Note cannot be empty.',
            errors: validatedFields.error.flatten().fieldErrors,
            success: false,
        };
    }

    const referral = await db.getReferralById(referralId);
    if (!referral) {
        return { message: 'Referral not found.', success: false };
    }

    const now = new Date();
    referral.internalNotes.push({
        id: `note-${Date.now()}`,
        content: validatedFields.data.note,
        author: 'Staff Member', // In a real app, this would come from session
        createdAt: now,
    });
    referral.updatedAt = now;
    
    await db.saveReferral(referral);

    revalidatePath(`/dashboard/referrals/${referralId}`);
    return { message: 'Note added successfully.', success: true };
}
