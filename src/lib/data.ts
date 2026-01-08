'use server';
import { collection, doc, getDoc, getDocs, setDoc, query, orderBy, where } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import type { Referral } from '@/lib/types';

// This function is a bit of a hack to get the firestore instance on the server.
// The client-side initialization is different.
async function getDb() {
    const { firestore } = initializeFirebase();
    if (!firestore) {
        throw new Error("Firestore is not initialized. Make sure your Firebase configuration is correct.");
    }
    return firestore;
}

const referralsCollection = 'referrals';

export const db = {
  getReferrals: async (): Promise<Referral[]> => {
    const db = await getDb();
    const q = query(collection(db, referralsCollection), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return [];
    }
    // The data is stored as a plain object, we need to convert Date strings back to Date objects
    return snapshot.docs.map(d => {
        const data = d.data() as any;
        return {
            ...data,
            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt),
            statusHistory: data.statusHistory.map((h: any) => ({ ...h, changedAt: new Date(h.changedAt) })),
            internalNotes: data.internalNotes.map((n: any) => ({ ...n, createdAt: new Date(n.createdAt) })),
        } as Referral
    });
  },

  getReferralById: async (id: string): Promise<Referral | undefined> => {
    const db = await getDb();
    const docRef = doc(db, referralsCollection, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return undefined;
    }
    
    const data = docSnap.data() as any;
    // Convert date strings back to Date objects
    return {
        ...data,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
        statusHistory: data.statusHistory.map((h: any) => ({ ...h, changedAt: new Date(h.changedAt) })),
        internalNotes: data.internalNotes.map((n: any) => ({ ...n, createdAt: new Date(n.createdAt) })),
    } as Referral;
  },

  saveReferral: async (referral: Referral): Promise<Referral> => {
    const db = await getDb();
    const docRef = doc(db, referralsCollection, referral.id);
    
    // Firestore doesn't store Date objects directly, so we convert them to ISO strings
    const savableReferral = {
        ...referral,
        createdAt: referral.createdAt.toISOString(),
        updatedAt: referral.updatedAt.toISOString(),
        statusHistory: referral.statusHistory.map(h => ({ ...h, changedAt: h.changedAt.toISOString() })),
        internalNotes: referral.internalNotes.map(n => ({ ...n, createdAt: n.createdAt.toISOString() })),
    };
    
    await setDoc(docRef, savableReferral);
    return referral;
  },

  findReferral: async (id: string, dob: string): Promise<Referral | undefined> => {
    const db = await getDb();
    const docRef = doc(db, referralsCollection, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists() && docSnap.data().patientDOB === dob) {
        const data = docSnap.data() as any;
         return {
            ...data,
            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt),
            statusHistory: data.statusHistory.map((h: any) => ({ ...h, changedAt: new Date(h.changedAt) })),
            internalNotes: data.internalNotes.map((n: any) => ({ ...n, createdAt: new Date(n.createdAt) })),
        } as Referral;
    }
    
    return undefined;
  }
};
