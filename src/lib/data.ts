
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
        // Use a different config for server that has the api key
        const serverConfig = {
            ...firebaseConfig,
            apiKey: process.env.FIREBASE_API_KEY,
        }
        const firebaseApp = apps.length > 0 ? apps[0] : initializeApp(serverConfig);
        db = initializeFirestore(firebaseApp, {
          cacheSizeBytes: CACHE_SIZE_UNLIMITED
        });
    }
    return db;
}

const referralsCollection = 'referrals';

// Converts Firestore Timestamps to JS Date objects recursively
function convertTimestampsToDates(obj: any): any {
    if (obj instanceof Timestamp) {
        return obj.toDate();
    }
    if (Array.isArray(obj)) {
        return obj.map(convertTimestampsToDates);
    }
    if (obj !== null && typeof obj === 'object') {
        const newObj: { [key: string]: any } = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                newObj[key] = convertTimestampsToDates(obj[key]);
            }
        }
        return newObj;
    }
    return obj;
}


export async function getReferrals(): Promise<Referral[]> {
    const firestore = getDb();
    const q = query(collection(firestore, referralsCollection), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return [];
    }
    return snapshot.docs.map(d => convertTimestampsToDates(d.data()) as Referral);
}

export async function getReferralById(id: string): Promise<Referral | undefined> {
    if (!id) return undefined;
    const firestore = getDb();
    const docRef = doc(firestore, referralsCollection, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return undefined;
    }
    
    return convertTimestampsToDates(docSnap.data()) as Referral;
}

export async function saveReferral(referral: Referral): Promise<Referral> {
    const firestore = getDb();
    const docRef = doc(firestore, referralsCollection, referral.id);
    
    // Convert Date objects to Timestamps for Firestore
    const dataToSave = {
        ...referral,
        createdAt: Timestamp.fromDate(new Date(referral.createdAt)),
        updatedAt: Timestamp.fromDate(new Date(referral.updatedAt)),
        statusHistory: referral.statusHistory.map(h => ({
            ...h,
            changedAt: Timestamp.fromDate(new Date(h.changedAt)),
        })),
        internalNotes: referral.internalNotes.map(n => ({
            ...n,
            createdAt: Timestamp.fromDate(new Date(n.createdAt)),
        })),
    };

    await setDoc(docRef, dataToSave, { merge: true });
    return referral;
}

export async function findReferral(id: string, dob: string): Promise<Referral | undefined> {
    if (!id || !dob) return undefined;
    const firestore = getDb();
    const docRef = doc(firestore, referralsCollection, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists() && docSnap.data().patientDOB === dob) {
        return convertTimestampsToDates(docSnap.data()) as Referral;
    }
    
    return undefined;
}
