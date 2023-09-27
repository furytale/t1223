import { Service } from "typedi";
import { SecretMangerService } from "./secret-manager-service";
import { Storage } from "@google-cloud/storage";
import {getDownloadURL, ref} from "@firebase/storage";

export type StorageConfig = {
    projectId: string,
    client_email: string,
    private_key: string,
};

export type MetadataExtendType = {
    cid: string,
    type: string,
    user: string,
    id: string,
    originalName: string,
};

@Service()
export class StorageService {
    private storage: Storage;
    constructor(
        private secretMangerService: SecretMangerService,
    ) {}

    public async getStorage(): Promise<Storage> {
        if (this.storage) {
            return this.storage;
        }
        const storageConfig = await this.secretMangerService.accessSecret<StorageConfig>('storage-config', true);
        this.storage = new Storage({
            projectId: storageConfig.projectId,
            credentials: {
                client_email: storageConfig.client_email,
                private_key: storageConfig.private_key,
            },
        });
        return this.storage;
    }

    public async copyFileFromBucket(
        destinationBucket: string,
        sourceBucket: string,
        sourceFile: string,
        destinationFileName: string,
        extraMetadata: MetadataExtendType | null,
    ) {
        const storage = await this.getStorage();

        if (extraMetadata) {
            const [metadata] = await storage.bucket(sourceBucket).file(sourceFile).getMetadata();
            metadata.metadata = {
                ...metadata.metadata,
                cid: extraMetadata.cid,
                type: extraMetadata.type,
                user: extraMetadata.user,
                id: extraMetadata.id,
                originalName: extraMetadata.originalName,
            }
            await storage
                .bucket(sourceBucket)
                .file(sourceFile)
                .setMetadata(
                    {
                        ...metadata,
                    },
                    {
                        ifMetagenerationMatch: 0,
                    }
                );
        }

        const copyDestination = storage.bucket(destinationBucket).file(destinationFileName);
        await storage
            .bucket(sourceBucket)
            .file(sourceFile)
            .copy(copyDestination, {
                preconditionOpts: {
                    ifGenerationMatch: 0,
                },
            });
    }

    public async getSignedUrl(bucketFilePath: string) {
        const storage = await this.getStorage();
        return await getDownloadURL(ref(storage, bucketFilePath));
    }
}
