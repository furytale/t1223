import { initializeApp } from '@firebase/app';
import * as admin from 'firebase-admin';
import { getStorage } from '@firebase/storage';
import { Container } from 'typedi';

const {
    PROJECT_ID,
    DESTINATION_BUCKET_ID,
} = process.env;


export const firebaseApp = initializeApp(
    {
        projectId: PROJECT_ID,
        storageBucket: DESTINATION_BUCKET_ID,
    },
    'migration'
);
export const firebaseStorage = getStorage(firebaseApp);


export const app = admin.app();
app.firestore().settings({ ignoreUndefinedProperties: true });


export interface Firestore extends admin.firestore.Firestore {
    doc<T extends admin.firestore.DocumentData>(documentPath: string): admin.firestore.DocumentReference<T>;
    collection<T extends admin.firestore.DocumentData>(collectionPath: string): admin.firestore.CollectionReference<T>;
}
export class Firestore {}

Container.set(Firestore, app.firestore());
