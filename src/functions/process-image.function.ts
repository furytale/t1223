import { logger } from 'firebase-functions';
import { ObjectMetadata } from 'firebase-functions/lib/providers/storage';
import { EventContext } from 'firebase-functions/lib/cloud-functions';
import {Service} from "typedi";
import {ImageProcessService} from "../services/image-process.service";
import {MetadataExtendType} from "../services/storage.service";

export const IMAGE_MIGRATION_PROCESSING_ERROR = 'IMAGE_MIGRATION_PROCESSING_ERROR';

@Service()
export default class ProcessImageFunction {
    constructor(private readonly imageProcessService: ImageProcessService) {}

    public async main(metadata: ObjectMetadata & MetadataExtendType): Promise<void> {
        try {
            await this.imageProcessService.processImage(metadata);
        } catch (e) {
            logger.error(IMAGE_MIGRATION_PROCESSING_ERROR, e);
        }
    }
}

