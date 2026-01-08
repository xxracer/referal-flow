import type { Referral } from '@/lib/types';
import { referralSchema }from './schemas';

// In-memory data store
let referrals: Referral[] = [
    {
        id: 'TX-REF-2026-123456',
        referrerName: 'Memorial Hermann',
        contactPerson: 'Dr. Emily Carter',
        referrerContact: '(713) 555-0101',
        confirmationEmail: 'ecarter@memorial.org',
        patientName: 'John Appleseed',
        patientDOB: '1985-05-15',
        patientContact: '',
        patientInsurance: 'medicare',
        memberId: 'M123456789',
        patientZipCode: '77005',
        servicesNeeded: ['physicalTherapy', 'skilledNursing'],
        examRequested: 'See Services',
        diagnosis: 'Post-operative recovery from knee surgery',
        providerNpi: '',
        referrerFax: '',
        status: 'IN_REVIEW',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        documents: [],
        statusHistory: [
            { status: 'RECEIVED', changedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
            { status: 'IN_REVIEW', changedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) }
        ],
        internalNotes: [
            { id: 'note-1', content: 'Patient needs morning appointments.', author: 'Staff', createdAt: new Date() }
        ],
    }
];

// Simple sleep function to simulate network delay
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const db = {
  getReferrals: async (): Promise<Referral[]> => {
    await sleep(50); // Simulate network latency
    // Return a deep copy to prevent direct mutation of the in-memory array
    return JSON.parse(JSON.stringify(referrals.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())));
  },
  getReferralById: async (id: string): Promise<Referral | undefined> => {
    await sleep(50);
    const referral = referrals.find(r => r.id === id);
    return referral ? JSON.parse(JSON.stringify(referral)) : undefined;
  },
  saveReferral: async (referral: Referral): Promise<Referral> => {
    await sleep(100);
    const index = referrals.findIndex(r => r.id === referral.id);
    if (index !== -1) {
      // Update existing
      referrals[index] = referral;
    } else {
      // Create new
      referrals.push(referral);
    }
    return JSON.parse(JSON.stringify(referral));
  },
  findReferral: async (id: string, dob: string): Promise<Referral | undefined> => {
    await sleep(50);
    const referral = referrals.find(r => r.id === id && r.patientDOB === dob);
    return referral ? JSON.parse(JSON.stringify(referral)) : undefined;
  }
};
