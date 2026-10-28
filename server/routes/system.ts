import { Router, Request, Response } from 'express';
import { dbService } from '../services/database.js';
import { aiService } from '../services/ai.js';
import { vectorSearchService } from '../services/vectorSearch.js';
import { storageService, driveStorageService } from '../services/storage.js';
import { SystemStatus } from '../../src/types.js';

export const systemRouter = Router();

// System status
systemRouter.get('/status', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || (req.query.userId as string);
  const stats = dbService.getStats(userId);
  const cloudStorageStatus = storageService.getCloudStatus(userId);
  const pooled = driveStorageService.getPooledStats(userId);

  const status: SystemStatus = {
    geminiEmbeddingModel: 'gemini-embedding-2-preview',
    hasGeminiKey: aiService.getHasKey(),
    vertexVectorSearchReady: true,
    indexedVectorsCount: vectorSearchService.getIndexedCount(userId),
    totalPhotosCount: stats.total,
    readyPhotosCount: stats.ready,
    processingCount: stats.processing,
    firestoreConnected: stats.firestoreConnected,
    firebaseProjectId: stats.firebaseProjectId,
    // Google Drive Pooled Storage
    googleDriveAccountsCount: pooled.accountsCount,
    googleDriveActiveCount: pooled.activeCount,
    googleDriveTotalStorage: pooled.totalStorage,
    googleDriveUsedStorage: pooled.usedStorage,
    googleDriveAvailableStorage: pooled.availableStorage,
    primaryDriveEmail: pooled.primaryAccountEmail,
    // Legacy compatibility fields
    cloudStorageItems: stats.total,
    cloudStorageConnected: pooled.activeCount > 0,
    cloudStorageBucket: pooled.primaryAccountEmail || 'Google Drive',
    cloudStorageProvisioned: true,
  };
  res.json(status);
});

// Clear all data (photos and albums)
systemRouter.post('/data/clear', async (req: Request, res: Response) => {
  try {
    vectorSearchService.clear();
    await dbService.clearAllData();
    res.json({ message: 'All photos and albums have been removed.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

systemRouter.post('/demo/reset', async (req: Request, res: Response) => {
  try {
    vectorSearchService.clear();
    await dbService.clearAllData();
    res.json({ message: 'All demo data removed.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
