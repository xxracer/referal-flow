'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { referralSchema } from './schemas';
import { db } from './data';
import type { Referral, ReferralStatus, AISummary, Document } from './types';
import { categorizeReferral } from '@/ai/flows/smart-categorization';

export type FormState = {
  message: string;
  errors?: Record<string, string[] | undefined>;
  success: boolean;
  data?: any;
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

  const referralId = `TX-REF-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
  
  const documentUrls = formData.getAll('documentUrls') as string[];
  const documents: Document[] = documentUrls.map(url => ({
      id: url.split('/').pop() || `doc-${Date.now()}`,
      name: url.split('/').pop() || 'Uploaded File',
      url: url,
      size: 0 // Size is not available here, can be fetched if needed
  }));

  let aiSummary: AISummary | undefined = undefined;
  if (documents.length > 0) {
      try {
          aiSummary = await categorizeReferral({
              documents: documents.map(d => d.url),
              patientName: validatedFields.data.patientFullName,
              referrerName: validatedFields.data.organizationName,
          });
      } catch (e) {
          console.error("AI categorization failed:", e);
      }
  }

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
    documents,
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
