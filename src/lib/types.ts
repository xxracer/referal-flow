export type ReferralStatus = 'RECEIVED' | 'IN_REVIEW' | 'ACCEPTED' | 'REJECTED';

export type Document = {
  id: string;
  name: string;
  url: string; 
  size: number;
};

export type StatusHistory = {
  status: ReferralStatus;
  changedAt: Date;
  notes?: string;
};

export type InternalNote = {
  id: string;
  content: string;
  author: string; 
  createdAt: Date;
};

export type AISummary = {
  suggestedCategories: string[];
  reasoning: string;
}

export type Referral = {
  id: string;
  patientName: string;
  patientDOB: string; 
  patientContact: string;
  patientId?: string;
  referrerName: string;
  referrerContact: string;
  referrerRelation: string;
  documents: Document[];
  status: ReferralStatus;
  statusHistory: StatusHistory[];
  internalNotes: InternalNote[];
  aiSummary?: AISummary;
  createdAt: Date;
  updatedAt: Date;
};
