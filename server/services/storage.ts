import path from 'path';
import fs from 'fs';
import { driveStorageService, StorageUploadResult, GoogleDriveStorageProvider } from './driveStorage.js';

/**
 * Storage Service Abstraction
 * Replaces Google Cloud Storage with Google Drive API Multi-Account Pooled Storage.
 */
export class StorageServiceFacade {
  private driveProvider: GoogleDriveStorageProvider;
  private storageDir: string;

  constructor() {
    this.driveProvider = driveStorageService;
    this.storageDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  /**
   * Upload photo with automatic account allocation and failover across Google Drive accounts
   */
  async uploadPhoto(
    photoId: string,
    filename: string,
    dataBase64: string,
    mimeType: string = 'image/jpeg',
    dateTaken?: string,
    userId?: string
  ): Promise<StorageUploadResult> {
    return this.driveProvider.uploadPhoto(photoId, filename, dataBase64, mimeType, dateTaken, userId);
  }

  /**
   * Delete photo from Google Drive
   */
  async deletePhoto(
    storagePath: string,
    localUrl: string,
    driveAccountId?: string,
    driveFileId?: string
  ): Promise<boolean> {
    const filename = path.basename(localUrl);
    const accId = driveAccountId || 'drive_acc_primary';
    const fileId = driveFileId || filename;
    return this.driveProvider.deletePhoto(accId, fileId, filename);
  }

  getItemCount(): number {
    if (!fs.existsSync(this.storageDir)) return 0;
    return fs.readdirSync(this.storageDir).length;
  }

  getCloudStatus(userId?: string) {
    const pooled = this.driveProvider.getPooledStats(userId);
    return {
      isConnected: pooled.activeCount > 0,
      bucketName: pooled.primaryAccountEmail || 'Google Drive',
      isProvisioned: true,
      provider: 'Google Drive API',
      ...pooled,
    };
  }

  getDriveProvider(): GoogleDriveStorageProvider {
    return this.driveProvider;
  }
}

export const storageService = new StorageServiceFacade();
export { driveStorageService };
