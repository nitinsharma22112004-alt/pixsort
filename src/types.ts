export type PhotoProcessingStatus = 'UPLOADING' | 'PROCESSING' | 'INDEXING' | 'READY' | 'ERROR';

export interface Photo {
  id: string;
  userId: string;
  filename: string;
  storagePath: string; // Drive path or gs path reference
  thumbnailPath: string;
  url: string;
  thumbnailUrl: string;
  dateTaken: string; // YYYY-MM-DD
  location: string;
  aiDescription: string;
  objects: string[];
  activities: string[];
  environment: string; // 'Indoor' | 'Outdoor' | 'Mixed'
  time: string; // 'Morning' | 'Afternoon' | 'Evening' | 'Night' | 'Golden Hour'
  processingStatus: PhotoProcessingStatus;
  isFavorite: boolean;
  albumIds: string[];
  isTrash: boolean;
  createdAt: string;
  similarityScore?: number;
  embeddingDimension?: number;
  // Google Drive Storage references
  driveFileId?: string;
  driveAccountId?: string;
  driveFolderId?: string;
  driveAccountEmail?: string;
  fileSize?: number;
  mimeType?: string;
}

export interface ConnectedDriveAccount {
  id: string;
  userId: string;
  googleAccountEmail: string;
  googleAccountId?: string;
  storageUsed: number; // in bytes
  storageLimit: number; // in bytes (e.g. 15GB = 16106127360)
  storageAvailable: number; // in bytes
  priority: number; // 1 = highest preference
  status: 'active' | 'disconnected' | 'quota_exceeded' | 'error';
  photoCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Album {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  coverPhotoUrl?: string;
  photoCount: number;
}

export interface SearchInterpretedFilter {
  semanticQuery: string;
  dateFilter?: string;
  locationFilter?: string;
  favoriteOnly?: boolean;
  albumFilter?: string;
}

export interface SearchResponse {
  query: string;
  interpretedFilter: SearchInterpretedFilter;
  results: Photo[];
  totalCount: number;
  executionTimeMs: number;
}

export interface SystemStatus {
  geminiEmbeddingModel: string;
  hasGeminiKey: boolean;
  vertexVectorSearchReady: boolean;
  indexedVectorsCount: number;
  totalPhotosCount: number;
  readyPhotosCount: number;
  processingCount: number;
  firestoreConnected?: boolean;
  firebaseProjectId?: string;
  // Google Drive Pooled Storage
  googleDriveAccountsCount: number;
  googleDriveActiveCount: number;
  googleDriveTotalStorage: number;
  googleDriveUsedStorage: number;
  googleDriveAvailableStorage: number;
  primaryDriveEmail?: string;
  // Legacy compatibility fields
  cloudStorageItems?: number;
  cloudStorageConnected?: boolean;
  cloudStorageBucket?: string;
  cloudStorageProvisioned?: boolean;
}
