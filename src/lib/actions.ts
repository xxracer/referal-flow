'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { referralSchema, statusCheckSchema, noteSchema } from './schemas';
import { db } from './data';
import type { Referral, ReferralStatus, AISummary, Document } from './types';
import { categorizeReferral } from '@/ai/flows/smart-categorization';

// Type for state management with useFormState
export type FormState = {
  message: string;
  errors?: Record<string, string[] | undefined>;
  success: boolean;
  data?: any;
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

const processFiles = async (files: File[]): Promise<{validDocs: Document[], dataURIs: string[], errorState: FormState | null}> => {
    const validDocs: Document[] = [];
    const dataURIs: string[] = [];

    for (const doc of files) {
        if (doc.size > 0) {
            if (doc.size > MAX_FILE_SIZE) {
                return { validDocs: [], dataURIs: [], errorState: { message: `File "${doc.name}" exceeds the 5MB size limit.`, success: false }};
            }
            if (!ACCEPTED_FILE_TYPES.includes(doc.type)) {
                return { validDocs: [], dataURIs: [], errorState: { message: `File type for "${doc.name}" is not supported.`, success: false }};
            }
            const bytes = await doc.arrayBuffer();
            const buffer = Buffer.from(bytes);
            const dataURI = `data:${doc.type};base64,${buffer.toString('base64')}`;
            dataURIs.push(dataURI);
            validDocs.push({ id: `doc-${Date.now()}-${Math.random()}`, name: doc.name, url: '#', size: doc.size });
        }
    }
    return { validDocs, dataURIs, errorState: null };
};


export async function submitReferral(prevState: FormState, formData: FormData): Promise<FormState> {
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
  });

  if (!validatedFields.success) {
    return {
      message: 'Please correct the errors below.',
      errors: validatedFields.error.flatten().fieldErrors,
      success: false,
    };
  }
  
  const referralDocs = formData.getAll('referralDocuments') as File[];
  const progressNotes = formData.getAll('progressNotes') as File[];

  const { validDocs: validReferralDocs, dataURIs: referralDataURIs, errorState: referralError } = await processFiles(referralDocs);
  if (referralError) return referralError;

  const { validDocs: validProgressNotes, dataURIs: progressNotesDataURIs, errorState: progressNotesError } = await processFiles(progressNotes);
  if (progressNotesError) return progressNotesError;

  const allValidDocuments = [...validReferralDocs, ...validProgressNotes];
  const allDataURIs = [...referralDataURIs, ...progressNotesDataURIs];

  const referralId = `TX-REF-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
  const now = new Date();
  
  const { organizationName, contactName, phone, email, patientFullName, patientDOB, patientZipCode, primaryInsurance, servicesNeeded } = validatedFields.data;

  // Handle AI Categorization
  let aiSummary: AISummary | undefined = undefined;
  if (allDataURIs.length > 0) {
    try {
        aiSummary = await categorizeReferral({
            documents: allDataURIs,
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
    // Referrer
    referrerName: organizationName, 
    contactPerson: contactName, 
    referrerContact: phone, 
    confirmationEmail: email || '',
    
    // Patient
    patientName: patientFullName,
    patientDOB,
    patientContact: '', // Not in form
    patientInsurance: primaryInsurance, 
    memberId: '', // Will be collected later
    
    // Exam/Services
    servicesNeeded,
    examRequested: 'See Services Needed',
    diagnosis: 'See attached documents',
    
    // Legacy/default fields
    providerNpi: '',
    referrerFax: '',

    // Meta
    status: 'RECEIVED',
    createdAt: now,
    updatedAt: now,
    documents: allValidDocuments,
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
        optionalNote: formData.get('optionalNote'),
    });

    if (!validatedFields.success) {
        return {
            message: 'Please correct the errors below.',
            errors: validatedFields.error.flatten().fieldErrors,
            success: false,
        };
    }

    const { referralId, patientDOB, optionalNote } = validatedFields.data;
    const referral = await db.findReferral(referralId, patientDOB);

    if (!referral) {
        return { message: 'No matching referral found. Please check the ID and date of birth.', success: false };
    }

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
        revalidatePath(`/dashboard/referrals/${referralId}`);
    }

    return {
        message: 'Referral found.',
        success: true,
        data: {
            status: referral.status,
            updatedAt: referral.updatedAt.toISOString(),
            noteAdded: noteAdded,
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

export async function updateReferralStatus(referralId: string, status: ReferralStatus): Promise<FormState> {
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
