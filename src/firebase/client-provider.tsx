'use client';

import { FirebaseProvider, type FirebaseContextValue } from './provider';
import { initializeFirebase } from './index';

export function FirebaseClientProvider({ children }: { children: React.ReactNode }) {
  const { firebaseApp, auth, firestore } = initializeFirebase();
  const contextValue: FirebaseContextValue = { firebaseApp, auth, firestore };

  return <FirebaseProvider value={contextValue}>{children}</FirebaseProvider>;
}
