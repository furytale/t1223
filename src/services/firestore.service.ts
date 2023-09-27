import {Service} from "typedi";
import {Firestore} from "../providers/firebase";

@Service()
export class FirestoreService {
    constructor(private firestore: Firestore) {}

    public async updateDocument(collectionName: string, documentName: string, data: any): Promise<void> {
        const document = this.firestore.collection(collectionName).doc(documentName);
        await document.update(data);
    }

    public async getRootEntityRecord<T>(collectionName: string, documentId: string ): Promise<FirebaseFirestore.DocumentSnapshot<T>> {
        return await this.firestore.collection<T>(collectionName).doc(documentId).get()
    }
}
