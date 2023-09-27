import { Service } from 'typedi';
import * as path from 'path';
import { logger } from 'firebase-functions';
import { QueryDocumentSnapshot } from 'firebase-functions/lib/providers/firestore';
import { EventContext } from 'firebase-functions/lib/cloud-functions';
import { COLLECTION_IMAGE_MIGRATE, ImageModelStatus, ImageMigrationModel } from '../model/image';
import {StorageService} from "../services/storage.service";
import {FirestoreService} from "../services/firestore.service";

const { SOURCE_BUCKET_ID, DESTINATION_BUCKET_ID, DESTINATION_BUCKET_DIRECTORY } = process.env;
export const MIGRATION_FILE_COPY_ERROR = 'MIGRATION_FILE_COPY_ERROR';

@Service()
export default class imageCopy {
  constructor(
      private storageService: StorageService,
      private firestoreService: FirestoreService,
  ) {}

  public async main(snapshot: QueryDocumentSnapshot, context: EventContext): Promise<void> {
    const data = snapshot.data() as ImageMigrationModel;
    const destinationFileName = `${DESTINATION_BUCKET_DIRECTORY}/${data.cid}${path.extname(data.source)}`;
    try {
      await this.storageService.copyFileFromBucket(
          DESTINATION_BUCKET_ID,
          SOURCE_BUCKET_ID,
          data.source,
          destinationFileName,
          {
            id: snapshot.id,
            type: data.type,
            originalName: data.originalName,
            user: data.user,
            cid: data.cid,
          }
      );

      await this.firestoreService.updateDocument(COLLECTION_IMAGE_MIGRATE, snapshot.id, {
        status: ImageModelStatus.IMAGE_COPIED,
        destination: destinationFileName,
        updatedAt: new Date(),
      });
    } catch (e) {
      logger.error(MIGRATION_FILE_COPY_ERROR, e);
      await this.firestoreService.updateDocument(COLLECTION_IMAGE_MIGRATE, snapshot.id, {
        status: ImageModelStatus.IMAGE_COPYING_ERROR,
        error: e.toString(),
        updatedAt: new Date(),
      });
    }
  }
}
