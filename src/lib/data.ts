
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  query,
  orderBy,
  where,
  limit,
} from 'firebase/firestore';
import type { Referral } from '@/lib/types';
import { initializeFirebase } from '@/firebase';

// This file now interacts with Firestore
// In a real application, you'd handle security rules for these collections.

const getDb = () => {
    const { firestore } = initializeFirebase();
    if (!firestore) {
        throw new Error("Firestore is not initialized");
    }
    return firestore;
}

export const db = {
  getReferrals: async (): Promise<Referral[]> => {
    const db = getDb();
    const referralsCol = collection(db, 'referrals');
    const q = query(referralsCol, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        patientDOB: data.patientDOB,
        statusHistory: data.statusHistory.map((h: any) => ({
            ...h,
            changedAt: h.changedAt.toDate(),
        })),
        internalNotes: data.internalNotes.map((n: any) => ({
            ...n,
            createdAt: n.createdAt.toDate(),
        })),
      } as Referral;
    });
  },
  getReferralById: async (id: string): Promise<Referral | undefined> => {
    const db = getDb();
    const docRef = doc(db, 'referrals', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return undefined;
    }

    const data = docSnap.data();
    return {
      ...data,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
      patientDOB: data.patientDOB,
      statusHistory: data.statusHistory.map((h: any) => ({
        ...h,
        changedAt: h.changedAt.toDate(),
      })),
      internalNotes: data.internalNotes.map((n: any) => ({
        ...n,
        createdAt: n.createdAt.toDate(),
      })),
    } as Referral;
  },
  saveReferral: async (referral: Referral): Promise<Referral> => {
    const db = getDb();
    const docRef = doc(db, 'referrals', referral.id);
    await setDoc(docRef, referral);
    return referral;
  },
  findReferral: async (id: string, dob: string): Promise<Referral | undefined> => {
    const db = getDb();
    const docRef = doc(db, 'referrals', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists() && docSnap.data().patientDOB === dob) {
      const data = docSnap.data();
      return {
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        patientDOB: data.patientDOB,
        statusHistory: data.statusHistory.map((h: any) => ({
            ...h,
            changedAt: h.changedAt.toDate(),
        })),
        internalNotes: data.internalNotes.map((n: any) => ({
            ...n,
            createdAt: n.createdAt.toDate(),
        })),
      } as Referral;
    }
    
    return undefined;
  }
};
