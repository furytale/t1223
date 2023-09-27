import { https, MAX_TIMEOUT_SECONDS, runWith } from 'firebase-functions';
import { loadFn, isEmulator } from './utils/common';
import {COLLECTION_IMAGE_MIGRATE} from "./model/image";
const { IMPORT_FILES_BUCKET_NAME, DESTINATION_BUCKET_ID } = process.env;

export const onImageCollectionChangeCpImage = runWith({ timeoutSeconds: isEmulator() ? MAX_TIMEOUT_SECONDS : 240, memory: '512MB' })
    .firestore.document(`/${COLLECTION_IMAGE_MIGRATE}/{imageId}`)
    .onWrite(
        loadFn(() => import('./functions/copy-images.function')),
    );

export const onImageCopyProcess = runWith({ memory: '4GB', timeoutSeconds: MAX_TIMEOUT_SECONDS })
    .storage.bucket(IMPORT_FILES_BUCKET_NAME).object().onFinalize(async (object) => {
        const fn = loadFn(() => import('./functions/process-image.function'));
        await fn(object);
    });
