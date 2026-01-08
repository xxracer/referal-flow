
'use server';
import { collection, doc, getDoc, getDocs, setDoc, query, orderBy, Timestamp, getFirestore } from 'firebase/firestore';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import { firebaseConfig } from '@/firebase/config';
import type { Referral } from '@/lib/types';

let app: FirebaseApp;
let db: ReturnType<typeof getFirestore>;
let storage: ReturnType<typeof getStorage>;

function initializeFirebase() {
    if (!getApps().length) {
        app = initializeApp(firebaseConfig);
    } else {
        app = getApp();
    }
    db = getFirestore(app);
    storage = getStorage(app);
}

function getDb() {
    if (!db) {
        initializeFirebase();
    }
    return db;
}

export function getStorageInstance() {
    if(!storage) {
        initializeFirebase();
    }
    return storage;
}


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
    const q = query(collection(firestore, 'referrals'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return [];
    }
    return snapshot.docs.map(d => convertTimestampsToDates(d.data()) as Referral);
}

export async function getReferralById(id: string): Promise<Referral | undefined> {
    const firestore = getDb();
    if (!id) return undefined;
    const docRef = doc(firestore, 'referrals', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return undefined;
    }
    
    return convertTimestampsToDates(docSnap.data()) as Referral;
}

export async function saveReferral(referral: Referral): Promise<Referral> {
    const firestore = getDb();
    const docRef = doc(firestore, 'referrals', referral.id);
    
    // Ensure all Date objects are correctly converted to Timestamps before saving
    const dataToSave: any = { // Use 'any' to allow for dynamic property deletion
        ...referral,
        createdAt: Timestamp.fromDate(referral.createdAt),
        updatedAt: Timestamp.fromDate(referral.updatedAt),
        statusHistory: referral.statusHistory.map(h => ({
            ...h,
            changedAt: Timestamp.fromDate(h.changedAt),
        })),
        internalNotes: referral.internalNotes.map(n => ({
            ...n,
            createdAt: Timestamp.fromDate(n.createdAt),
        })),
    };

    if (dataToSave.surgeryDate && dataToSave.surgeryDate.trim() !== '') {
        dataToSave.surgeryDate = Timestamp.fromDate(new Date(dataToSave.surgeryDate));
    } else {
        // Explicitly delete if empty or invalid to avoid sending bad data to Firestore
        delete dataToSave.surgeryDate;
    }

    await setDoc(docRef, dataToSave, { merge: true });
    return referral;
}

export async function findReferral(id: string, dob: string): Promise<Referral | undefined> {
    const firestore = getDb();
    if (!id || !dob) return undefined;
    const docRef = doc(firestore, 'referrals', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists() && docSnap.data().patientDOB === dob) {
        return convertTimestampsToDates(docSnap.data()) as Referral;
    }
    
    return undefined;
}
