
'use server';
import { collection, doc, getDoc, getDocs, setDoc, query, orderBy, Timestamp, Firestore, getFirestore } from 'firebase/firestore';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';
import type { Referral } from '@/lib/types';

let app: FirebaseApp;
if (!getApps().length) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApp();
}

const db = getFirestore(app);


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
    const q = query(collection(db, 'referrals'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return [];
    }
    return snapshot.docs.map(d => convertTimestampsToDates(d.data()) as Referral);
}

export async function getReferralById(id: string): Promise<Referral | undefined> {
    if (!id) return undefined;
    const docRef = doc(db, 'referrals', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return undefined;
    }
    
    return convertTimestampsToDates(docSnap.data()) as Referral;
}

export async function saveReferral(referral: Referral): Promise<Referral> {
    const docRef = doc(db, 'referrals', referral.id);
    
    // Ensure all Date objects are correctly converted to Timestamps before saving
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

    if (dataToSave.surgeryDate) {
        dataToSave.surgeryDate = Timestamp.fromDate(new Date(dataToSave.surgeryDate));
    }


    await setDoc(docRef, dataToSave, { merge: true });
    return referral;
}

export async function findReferral(id: string, dob: string): Promise<Referral | undefined> {
    if (!id || !dob) return undefined;
    const docRef = doc(db, 'referrals', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists() && docSnap.data().patientDOB === dob) {
        return convertTimestampsToDates(docSnap.data()) as Referral;
    }
    
    return undefined;
}
