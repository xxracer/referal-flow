
'use server';
import { collection, doc, getDoc, getDocs, setDoc, query, orderBy, where, Timestamp, Firestore, initializeFirestore, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';
import type { Referral } from '@/lib/types';

let db: Firestore;

// This function initializes Firestore on the server-side.
// It's designed to be called once and reuse the instance.
function getDb() {
    if (!db) {
        const apps = getApps();
        const firebaseApp = apps.length > 0 ? apps[0] : initializeApp(firebaseConfig);
        db = initializeFirestore(firebaseApp, {
          cacheSizeBytes: CACHE_SIZE_UNLIMITED
        });
    }
    return db;
}

const referralsCollection = 'referrals';

export async function getReferrals(): Promise<Referral[]> {
    const firestore = getDb();
    const q = query(collection(firestore, referralsCollection), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return [];
    }
    // The data is stored with Timestamps, convert them to Date objects
    return snapshot.docs.map(d => {
        const data = d.data();
        return {
            ...data,
            createdAt: (data.createdAt as Timestamp).toDate(),
            updatedAt: (data.updatedAt as Timestamp).toDate(),
            statusHistory: data.statusHistory.map((h: any) => ({ ...h, changedAt: (h.changedAt as Timestamp).toDate() })),
            internalNotes: data.internalNotes.map((n: any) => ({ ...n, createdAt: (n.createdAt as Timestamp).toDate() })),
        } as Referral
    });
}

export async function getReferralById(id: string): Promise<Referral | undefined> {
    if (!id) return undefined;
    const firestore = getDb();
    const docRef = doc(firestore, referralsCollection, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return undefined;
    }
    
    const data = docSnap.data();
    // Convert Timestamps to Date objects
    return {
        ...data,
        createdAt: (data.createdAt as Timestamp).toDate(),
        updatedAt: (data.updatedAt as Timestamp).toDate(),
        statusHistory: data.statusHistory.map((h: any) => ({ ...h, changedAt: (h.changedAt as Timestamp).toDate() })),
        internalNotes: data.internalNotes.map((n: any) => ({ ...n, createdAt: (n.createdAt as Timestamp).toDate() })),
    } as Referral;
}

export async function saveReferral(referral: Referral): Promise<Referral> {
    const firestore = getDb();
    const docRef = doc(firestore, referralsCollection, referral.id);
    
    // Firestore handles native Date objects, so no conversion is needed.
    await setDoc(docRef, referral, { merge: true });
    return referral;
}

export async function findReferral(id: string, dob: string): Promise<Referral | undefined> {
    if (!id || !dob) return undefined;
    const firestore = getDb();
    const docRef = doc(firestore, referralsCollection, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists() && docSnap.data().patientDOB === dob) {
        const data = docSnap.data();
         return {
            ...data,
            createdAt: (data.createdAt as Timestamp).toDate(),
            updatedAt: (data.updatedAt as Timestamp).toDate(),
            statusHistory: data.statusHistory.map((h: any) => ({ ...h, changedAt: (h.changedAt as Timestamp).toDate() })),
            internalNotes: data.internalNotes.map((n: any) => ({ ...n, createdAt: (n.createdAt as Timestamp).toDate() })),
        } as Referral;
    }
    
    return undefined;
}
