'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { firebaseConfig } from './config';

// This function now ensures Firebase is only initialized on the client-side.
export function initializeFirebase(): {
  firebaseApp: FirebaseApp;
  auth: Auth;
} {
  if (typeof window === 'undefined') {
    // This is a temporary fix to allow server-side builds to pass.
    // It returns a mock object, but this code path should not be used in practice.
    // The actual initialization happens on the client.
    return {
      firebaseApp: null as any,
      auth: null as any,
    };
  }

  const apps = getApps();
  const firebaseApp = apps.length
    ? apps[0]
    : initializeApp(firebaseConfig);

  const auth = getAuth(firebaseApp);

  return { firebaseApp, auth };
}
