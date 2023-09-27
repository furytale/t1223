import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { Service } from 'typedi';

const secretManagerServiceClient = new SecretManagerServiceClient();
const projectName = process.env.GCLOUD_PROJECT;

@Service()
export class SecretMangerService {
  async accessSecret<T>(secretName: string, isJson = false): Promise<T> {
    const [version] = await secretManagerServiceClient.accessSecretVersion({
      name: `projects/${projectName}/secrets/${secretName}/versions/latest`,
    });
    const payload = version.payload.data.toString();
    return isJson ? JSON.parse(payload) : payload;
  }
}
