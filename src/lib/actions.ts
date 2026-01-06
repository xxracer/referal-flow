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
  const priorityCheckboxes = ['STAT', 'URGENT'].filter(p => formData.get(p) === 'on');
  let priority;
  if (priorityCheckboxes.length > 1) {
    priority = 'STAT'; // Or however you want to handle multiple selections
  } else if (priorityCheckboxes.length === 1) {
    priority = priorityCheckboxes[0];
  } else {
    priority = 'ROUTINE';
  }

  const contrastCheckboxes = ['With Contrast', 'Without Contrast', 'With and Without Contrast'].filter(c => formData.get(c) === 'on');
  let contrast;
  if (contrastCheckboxes.length > 0) {
    contrast = contrastCheckboxes[0]; // Taking the first one if multiple are selected
  }
  
  const validatedFields = referralSchema.safeParse({
    referrerName: formData.get('referrerName'),
    providerNpi: formData.get('providerNpi'),
    referrerContact: formData.get('referrerContact'),
    referrerFax: formData.get('referrerFax'),
    contactPerson: formData.get('contactPerson'),
    confirmationEmail: formData.get('confirmationEmail'),
    patientFirstName: formData.get('patientFirstName'),
    patientLastName: formData.get('patientLastName'),
    patientContact: formData.get('patientContact'),
    patientDOB: formData.get('patientDOB'),
    patientInsurance: formData.get('patientInsurance'),
    memberId: formData.get('memberId'),
    authorizationNumber: formData.get('authorizationNumber'),
    examRequested: formData.get('examRequested'),
    examOther: formData.get('examOther'),
    diagnosis: formData.get('diagnosis'),
    reasonForExam: formData.get('reasonForExam'),
    priority: priority,
    contrast: contrast,
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
  const patientName = `${validatedFields.data.patientFirstName} ${validatedFields.data.patientLastName}`;

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
            patientName: patientName,
            referrerName: validatedFields.data.referrerName,
        });
    } catch (e) {
        console.error("AI categorization failed:", e);
        // Do not block submission if AI fails.
    }
  }
  
  const newReferral: Referral = {
    id: referralId,
    ...validatedFields.data,
    patientName: patientName,
    patientDOB: validatedFields.data.patientDOB,
    examRequested: validatedFields.data.examRequested,
    status: 'RECEIVED',
    createdAt: now,
    updatedAt: now,
    documents: validDocuments.map((doc, i) => ({ id: `doc-${i}`, name: doc.name, url: '#', size: doc.size })), // URL is placeholder
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


export async function updateReferralStatus(referralId: string, status: ReferralStatus, notes?: string): Promise<void> {
    const referral = await db.getReferralById(referralId);
    if (!referral) {
        throw new Error('Referral not found');
    }

    const now = new Date();
    referral.status = status;
    referral.updatedAt = now;
    referral.statusHistory.push({ status, changedAt: now, notes });

    await db.saveReferral(referral);

    revalidatePath('/dashboard');
    revalidatePath(`/dashboard/referrals/${referralId}`);
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
