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
    patientInsurance: 'Blue Cross Blue Shield',
    memberId: 'X123456789',
    referrerName: 'Dr. John Smith',
    providerNpi: '1234567890',
    referrerContact: '555-111-2222',
    referrerFax: '555-111-3333',
    contactPerson: 'Sarah',
    confirmationEmail: 'sarah@cityclinic.com',
    examRequested: 'MRI',
    diagnosis: 'Persistent headache and dizziness',
    priority: 'ROUTINE',
    contrast: 'Without',
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
        suggestedCategories: ['Neurology', 'Diagnostic Imaging'],
        reasoning: 'The referral mentions persistent headaches, suggesting a neurological consultation. An MRI is requested to investigate further.'
    },
    createdAt: twoDaysAgo,
    updatedAt: twoDaysAgo,
  },
  {
    id: 'TX-REF-2024-001235',
    patientName: 'John Appleseed',
    patientDOB: '1992-11-20',
    patientContact: '555-123-4567',
    patientInsurance: 'Aetna',
    memberId: 'Y987654321',
    referrerName: 'Community Hospital ER',
    providerNpi: '0987654321',
    referrerContact: '555-999-8888',
    referrerFax: '555-999-7777',
    contactPerson: 'ER Desk',
    confirmationEmail: 'er-dept@communityhospital.org',
    examRequested: 'CT',
    diagnosis: 'Abdominal pain',
    priority: 'URGENT',
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
    patientInsurance: 'Cigna',
    memberId: 'Z543216789',
    referrerName: 'Dr. Emily White',
    providerNpi: '5678901234',
    referrerContact: '555-444-5555',
    referrerFax: '555-444-6666',
    contactPerson: 'Emily White',
    confirmationEmail: 'emily.white@clinic.com',
    examRequested: 'Ultrasound',
    diagnosis: 'Follow-up on previous findings.',
    documents: [
        { id: 'doc3', name: 'previous_scan.jpg', url: '#', size: 80 * 1024 },
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
