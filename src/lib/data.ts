

import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import type { Referral } from '@/lib/types';
import { initializeFirebase } from '@/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


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
    
    try {
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
    } catch (serverError: any) {
        if (serverError.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: referralsCol.path,
                operation: 'list',
            });
            errorEmitter.emit('permission-error', permissionError);
        }
        // Return empty array or re-throw a different error if you want to handle it elsewhere
        return [];
    }
  },
  getReferralById: async (id: string): Promise<Referral | undefined> => {
    const db = getDb();
    const docRef = doc(db, 'referrals', id);
    
    try {
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
    } catch (serverError: any) {
        if (serverError.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: docRef.path,
                operation: 'get',
            });
            errorEmitter.emit('permission-error', permissionError);
        }
        return undefined;
    }
  },
  saveReferral: async (referral: Referral): Promise<Referral> => {
    const db = getDb();
    const docRef = doc(db, 'referrals', referral.id);
    
    // Convert all date objects to Firestore Timestamps before saving
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
    
    setDoc(docRef, dataToSave, { merge: true }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'create', // or 'update' based on logic
            requestResourceData: dataToSave,
        });
        errorEmitter.emit('permission-error', permissionError);
    });
    return referral;
  },
  findReferral: async (id: string, dob: string): Promise<Referral | undefined> => {
    const db = getDb();
    const docRef = doc(db, 'referrals', id);
    try {
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
    } catch (serverError: any) {
         if (serverError.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: docRef.path,
                operation: 'get',
            });
            errorEmitter.emit('permission-error', permissionError);
        }
        return undefined;
    }
  }
};
