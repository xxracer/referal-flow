import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { firebaseConfig } from './config';

export function initializeFirebase(): {
  firebaseApp: FirebaseApp;
  auth: Auth;
} {
  const apps = getApps();
  const firebaseApp = apps.length
    ? apps[0]
    : initializeApp(firebaseConfig);

  const auth = getAuth(firebaseApp);

  return { firebaseApp, auth };
}
