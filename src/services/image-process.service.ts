import {Service} from "typedi";
import {ObjectMetadata} from "firebase-functions/lib/providers/storage";
import {MetadataExtendType, StorageService} from "./storage.service";
import {logger} from "firebase-functions";
import {
    convertAndUploadImageWithSharp,
    isValidUploadDir,
    readStreamFromBucket,
    transformAndUploadImageSmallWithSharp,
    transformAndUploadImageToCircleWithSharp,
    transformAndUploadImageToRoundedCornersWithSharp,
    generatePngMetadata,
} from "../helpers/image-process-helpers";
import {checkIfDirectoryAllowed} from "../utils/common";
import {DataService} from "./data.service";
import {PhotoType} from "../model/image";
import {Bucket} from "@google-cloud/storage";

export const METADATA_PARAMS_EMPTY_ERROR = 'METADATA_PARAMS_EMPTY_ERROR';
const {
    DESTINATION_BUCKET_DIRECTORY,
    TMP_CONVERTED_DIR,
    TRANSFORM_DIR_CIRCLE,
    TRANSFORM_DIR_ROUNDED_CORNERS,
    TRANSFORM_SM_IMAGE,
} = process.env;

@Service()
export class ImageProcessService {
    constructor(
        private dataService: DataService,
        private storageService: StorageService,
    ) {}

    public async processImage(metadata: ObjectMetadata & MetadataExtendType) {
        const canProcessNext = await this.imagePreProcess(metadata);
        if (!canProcessNext) {
            return;
        }
        await this.executeImageOperations(metadata);
    }

    private async executeImageOperations(metadata: ObjectMetadata & MetadataExtendType) {
        const firestoreRecordType = metadata.metadata.type;
        const modifiedFileName = metadata.metadata.originalName;
        const firestoreUserUuid = metadata.metadata.user;

        const storage = await this.storageService.getStorage();
        const bucket: Bucket = storage.bucket(metadata.bucket);
        const remoteFile: Buffer = await readStreamFromBucket(bucket.file(metadata.name));

        const meta = generatePngMetadata(metadata, {
            processed: true,
            id: metadata.metadata.id,
            type: metadata.metadata.type,
            user: metadata.metadata.user,
        });

        const converted = await convertAndUploadImageWithSharp(
            bucket,
            meta,
            remoteFile,
            `${TMP_CONVERTED_DIR}/${firestoreUserUuid}/${modifiedFileName}`
        );

        switch (firestoreRecordType) {
            case PhotoType.PROFILE_DISTRIBUTOR:
            case PhotoType.PROFILE_REPRESENTATIVE:
                await transformAndUploadImageToCircleWithSharp(
                    bucket,
                    meta,
                    converted,
                    `${TRANSFORM_DIR_CIRCLE}/${firestoreUserUuid}/${modifiedFileName}`
                );
                break;
            case PhotoType.PRODUCT:
                await transformAndUploadImageToRoundedCornersWithSharp(
                    bucket,
                    meta,
                    converted,
                    `${TRANSFORM_DIR_ROUNDED_CORNERS}/${firestoreUserUuid}/${modifiedFileName}`
                );
                break;
            case PhotoType.REPRESENTATIVE:
                await transformAndUploadImageSmallWithSharp(
                    bucket,
                    meta,
                    converted,
                    `${TRANSFORM_SM_IMAGE}/${firestoreUserUuid}/${modifiedFileName}`
                );
                break;
        }
        await bucket.file(metadata.name).delete({ ignoreNotFound: true });
    }

    public async imagePreProcess(metadata: ObjectMetadata & MetadataExtendType): Promise<boolean> {
        if (!metadata.metadata.id || !metadata.metadata.type || !metadata.metadata.user) {
            logger.error(METADATA_PARAMS_EMPTY_ERROR, metadata.metadata);
            return false;
        }

        const isAllowedPathForProcessUrls = (
            metadata.metadata.processed === 'true' &&
            checkIfDirectoryAllowed(metadata.name)
        );

        if (isAllowedPathForProcessUrls) {
            await this.dataService.updateRecordWithImageData(
                metadata.metadata.id,
                metadata.metadata.type,
                metadata.name,
                isAllowedPathForProcessUrls.path
            );
            return false;
        }

        if (!isValidUploadDir(metadata.name, DESTINATION_BUCKET_DIRECTORY)) {
            return false;
        }

        return true;
    }
}
