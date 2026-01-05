import type { Referral } from '@/lib/types';

// This is a mock in-memory database.
// In a real application, this would be a database like Firestore or PostgreSQL.
const referrals: Map<string, Referral> = new Map();

// Seed some initial data for demonstration
const today = new Date();
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
const twoDaysAgo = new Date();
twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

const initialReferrals: Referral[] = [
  {
    id: 'TX-REF-2024-001234',
    patientName: 'Jane Doe',
    patientDOB: '1985-05-15',
    patientContact: 'jane.doe@example.com',
    referrerName: 'Dr. John Smith',
    referrerContact: 'City Clinic',
    referrerRelation: 'Primary Care Physician',
    documents: [
        { id: 'doc1', name: 'referral_letter.pdf', url: '#', size: 120 * 1024 },
        { id: 'doc2', name: 'lab_results.pdf', url: '#', size: 450 * 1024 },
    ],
    status: 'RECEIVED',
    statusHistory: [{ status: 'RECEIVED', changedAt: twoDaysAgo }],
    internalNotes: [
        { id: 'note1', content: 'Initial review scheduled for tomorrow.', author: 'Admin', createdAt: twoDaysAgo },
    ],
    aiSummary: {
        suggestedCategories: ['Cardiology', 'Diagnostic Imaging'],
        reasoning: 'The referral letter mentions chest pain and family history of heart disease, suggesting a cardiology consultation. Attached lab results include elevated cholesterol levels, warranting further diagnostic imaging.'
    },
    createdAt: twoDaysAgo,
    updatedAt: twoDaysAgo,
  },
  {
    id: 'TX-REF-2024-001235',
    patientName: 'John Appleseed',
    patientDOB: '1992-11-20',
    patientContact: '555-123-4567',
    referrerName: 'Community Hospital ER',
    referrerContact: 'er-dept@communityhospital.org',
    referrerRelation: 'Emergency Room',
    documents: [],
    status: 'IN_REVIEW',
    statusHistory: [
        { status: 'RECEIVED', changedAt: yesterday },
        { status: 'IN_REVIEW', changedAt: today, notes: "Assigned to Dr. Eva." },
    ],
    internalNotes: [],
    createdAt: yesterday,
    updatedAt: today,
  },
  {
    id: 'TX-REF-2024-001236',
    patientName: 'Mary Johnson',
    patientDOB: '1978-01-30',
    patientContact: 'mary.j@email.com',
    referrerName: 'Self-Referral',
    referrerContact: 'mary.j@email.com',
    referrerRelation: 'Self',
    documents: [
        { id: 'doc3', name: 'symptoms_log.docx', url: '#', size: 80 * 1024 },
    ],
    status: 'ACCEPTED',
    statusHistory: [
        { status: 'RECEIVED', changedAt: twoDaysAgo },
        { status: 'IN_REVIEW', changedAt: yesterday },
        { status: 'ACCEPTED', changedAt: today, notes: "Appointment scheduled for next week." },
    ],
    internalNotes: [],
    createdAt: twoDaysAgo,
    updatedAt: today,
  }
];

initialReferrals.forEach(r => referrals.set(r.id, r));

export const db = {
  getReferrals: async () => Array.from(referrals.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
  getReferralById: async (id: string) => referrals.get(id),
  saveReferral: async (referral: Referral) => {
    referrals.set(referral.id, referral);
    return referral;
  },
  findReferral: async (id: string, dob: string) => {
    const referral = referrals.get(id);
    if (referral && referral.patientDOB === dob) {
        return referral;
    }
    return undefined;
  }
};
