import { config } from 'dotenv';
config();

const StorageConfig = {
  projectId: process.env.GCP_PROJECT_ID,
  private_key: process.env.GCP_PRIVATE_KEY,
  client_email: process.env.GCP_CLIENT_EMAIL,
  mediaBucket: process.env.GCP_STORAGE_MEDIA_BUCKET,
};

export default StorageConfig;
