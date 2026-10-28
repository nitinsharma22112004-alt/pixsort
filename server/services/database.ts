import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  Firestore,
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  setLogLevel,
} from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { Photo, Album } from '../../src/types.js';

// Suppress repetitive gRPC connection retry spam when Firestore DB is not yet created
try {
  setLogLevel('error');
} catch {
  // ignore
}

let firestoreDb: Firestore | null = null;
let firestoreProject: string | null = null;

try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    firestoreProject = config.projectId;
    const app = getApps().length > 0 ? getApp() : initializeApp(config);
    if (config.firestoreDatabaseId && config.firestoreDatabaseId !== '(default)') {
      firestoreDb = getFirestore(app, config.firestoreDatabaseId);
    } else {
      firestoreDb = getFirestore(app);
    }
    console.log(`[Firestore] Initialized Firestore for Project: ${config.projectId} (Database: ${config.firestoreDatabaseId || '(default)'})`);
  }
} catch (err) {
  console.warn('[Firestore] Initialization warning, utilizing in-memory operational cache:', err);
}

export class FirestoreDatabaseService {
  private photos: Map<string, Photo> = new Map();
  private albums: Map<string, Album> = new Map();
  private favorites: Set<string> = new Set(); // photoIds
  private isFirestoreSynced: boolean = false;

  constructor() {
    this.initFirestoreSync().catch((err) => {
      console.warn('[Firestore] Background sync notice:', err.message);
    });
  }

  /**
   * Syncs existing documents from Firestore if present
   */
  async initFirestoreSync(): Promise<void> {
    if (!firestoreDb) return;

    try {
      // Check photos collection
      const photosSnap = await getDocs(collection(firestoreDb, 'photos'));
      this.photos.clear();
      this.favorites.clear();
      if (photosSnap.docs.length > 0) {
        console.log(`[Firestore] Loaded ${photosSnap.docs.length} persistent photos from cloud Firestore.`);
        photosSnap.docs.forEach((d) => {
          const p = d.data() as Photo;
          this.photos.set(p.id, p);
          if (p.isFavorite) this.favorites.add(p.id);
        });
      }

      // Check albums collection
      const albumsSnap = await getDocs(collection(firestoreDb, 'albums'));
      this.albums.clear();
      if (albumsSnap.docs.length > 0) {
        albumsSnap.docs.forEach((d) => {
          const a = d.data() as Album;
          this.albums.set(a.id, a);
        });
      }

      this.isFirestoreSynced = true;
      console.log('[Firestore] Cloud database synchronized.');
    } catch (err: any) {
      if (err.message?.includes('NOT_FOUND') || err.code === 'not-found' || err.message?.includes('not-found')) {
        console.warn(`[Firestore] Notice: Cloud Firestore database has not been provisioned yet in project '${firestoreProject}'. PixSort will run in fast memory cache mode. To enable cloud persistence, click "Create database" at: https://console.firebase.google.com/project/${firestoreProject}/firestore`);
        firestoreDb = null;
      } else {
        console.warn('[Firestore] Sync notice:', err.message);
      }
    }
  }

  // --- Photo Operations ---

  async getPhotos(userId: string = 'user_default', filters?: {
    albumId?: string;
    isFavorite?: boolean;
    isTrash?: boolean;
    category?: string;
  }): Promise<Photo[]> {
    let list = Array.from(this.photos.values()).filter((p) => p.userId === userId);

    if (filters?.isTrash !== undefined) {
      list = list.filter((p) => p.isTrash === filters.isTrash);
    } else {
      list = list.filter((p) => !p.isTrash);
    }

    if (filters?.isFavorite) {
      list = list.filter((p) => p.isFavorite);
    }

    if (filters?.albumId) {
      list = list.filter((p) => p.albumIds.includes(filters.albumId!));
    }

    // Sort by dateTaken descending
    return list.sort((a, b) => new Date(b.dateTaken).getTime() - new Date(a.dateTaken).getTime());
  }

  async getPhotoById(photoId: string): Promise<Photo | null> {
    return this.photos.get(photoId) || null;
  }

  getPhotoByFilenameOrId(identifier: string): Photo | null {
    const clean = identifier.replace(/\.[^/.]+$/, '');
    for (const p of this.photos.values()) {
      if (
        p.id === identifier ||
        p.id === clean ||
        p.filename === identifier ||
        p.url?.includes(identifier) ||
        p.thumbnailUrl?.includes(identifier) ||
        p.driveFileId === identifier
      ) {
        return p;
      }
    }
    return null;
  }

  async createPhoto(photo: Photo): Promise<Photo> {
    this.photos.set(photo.id, photo);
    if (photo.isFavorite) {
      this.favorites.add(photo.id);
    }

    if (firestoreDb) {
      setDoc(doc(firestoreDb, 'photos', photo.id), photo).catch((err) => {
        console.warn(`[Firestore] Failed to persist photo ${photo.id}:`, err.message);
      });
    }

    return photo;
  }

  async updatePhoto(photoId: string, updates: Partial<Photo>): Promise<Photo | null> {
    const existing = this.photos.get(photoId);
    if (!existing) return null;

    const updated = { ...existing, ...updates };
    this.photos.set(photoId, updated);

    if (updates.isFavorite !== undefined) {
      if (updates.isFavorite) {
        this.favorites.add(photoId);
      } else {
        this.favorites.delete(photoId);
      }
    }

    if (firestoreDb) {
      updateDoc(doc(firestoreDb, 'photos', photoId), updates).catch((err) => {
        console.warn(`[Firestore] Failed to update photo ${photoId}:`, err.message);
      });
    }

    return updated;
  }

  async deletePhoto(photoId: string, permanent: boolean = false): Promise<boolean> {
    if (permanent) {
      this.favorites.delete(photoId);
      const res = this.photos.delete(photoId);
      if (firestoreDb) {
        deleteDoc(doc(firestoreDb, 'photos', photoId)).catch((err) => {
          console.warn(`[Firestore] Failed to delete photo ${photoId}:`, err.message);
        });
      }
      return res;
    } else {
      const existing = this.photos.get(photoId);
      if (!existing) return false;
      existing.isTrash = true;
      this.photos.set(photoId, existing);
      if (firestoreDb) {
        updateDoc(doc(firestoreDb, 'photos', photoId), { isTrash: true }).catch((err) => {
          console.warn(`[Firestore] Failed to mark photo ${photoId} as trash:`, err.message);
        });
      }
      return true;
    }
  }

  async restorePhoto(photoId: string): Promise<boolean> {
    const existing = this.photos.get(photoId);
    if (!existing) return false;
    existing.isTrash = false;
    this.photos.set(photoId, existing);
    if (firestoreDb) {
      updateDoc(doc(firestoreDb, 'photos', photoId), { isTrash: false }).catch((err) => {
        console.warn(`[Firestore] Failed to restore photo ${photoId}:`, err.message);
      });
    }
    return true;
  }

  // --- Album Operations ---

  async getAlbums(userId: string = 'user_default'): Promise<Album[]> {
    const albums = Array.from(this.albums.values()).filter((a) => a.userId === userId);
    // update photo counts and cover photo
    return albums.map((alb) => {
      const albumPhotos = Array.from(this.photos.values()).filter(
        (p) => !p.isTrash && p.albumIds.includes(alb.id)
      );
      return {
        ...alb,
        photoCount: albumPhotos.length,
        coverPhotoUrl: albumPhotos[0]?.thumbnailUrl || alb.coverPhotoUrl,
      };
    });
  }

  async createAlbum(userId: string = 'user_default', name: string): Promise<Album> {
    const id = `album_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newAlbum: Album = {
      id,
      userId,
      name,
      createdAt: new Date().toISOString(),
      photoCount: 0,
    };
    this.albums.set(id, newAlbum);

    if (firestoreDb) {
      setDoc(doc(firestoreDb, 'albums', id), newAlbum).catch((err) => {
        console.warn(`[Firestore] Failed to persist album ${id}:`, err.message);
      });
    }

    return newAlbum;
  }

  async deleteAlbum(albumId: string): Promise<boolean> {
    // Remove albumId from all photos
    for (const photo of this.photos.values()) {
      if (photo.albumIds.includes(albumId)) {
        photo.albumIds = photo.albumIds.filter((id) => id !== albumId);
        if (firestoreDb) {
          updateDoc(doc(firestoreDb, 'photos', photo.id), { albumIds: photo.albumIds }).catch(() => {});
        }
      }
    }

    if (firestoreDb) {
      deleteDoc(doc(firestoreDb, 'albums', albumId)).catch(() => {});
    }

    return this.albums.delete(albumId);
  }

  async togglePhotoAlbum(photoId: string, albumId: string): Promise<Photo | null> {
    const photo = this.photos.get(photoId);
    if (!photo) return null;

    if (photo.albumIds.includes(albumId)) {
      photo.albumIds = photo.albumIds.filter((id) => id !== albumId);
    } else {
      photo.albumIds.push(albumId);
    }
    this.photos.set(photoId, photo);

    if (firestoreDb) {
      updateDoc(doc(firestoreDb, 'photos', photoId), { albumIds: photo.albumIds }).catch(() => {});
    }

    return photo;
  }

  getStats(userId?: string) {
    const all = Array.from(this.photos.values()).filter(
      (p) => !userId || p.userId === userId || p.userId === 'user_default'
    );
    const userAlbums = Array.from(this.albums.values()).filter(
      (a) => !userId || a.userId === userId || a.userId === 'user_default'
    );
    return {
      total: all.length,
      ready: all.filter((p) => p.processingStatus === 'READY').length,
      processing: all.filter((p) => p.processingStatus !== 'READY').length,
      trash: all.filter((p) => p.isTrash).length,
      favorites: all.filter((p) => p.isFavorite).length,
      albums: userAlbums.length,
      firestoreConnected: !!firestoreDb,
      firebaseProjectId: firestoreProject || undefined,
    };
  }

  /**
   * Clears all photos and albums from Firestore cloud collections and in-memory cache
   */
  public async clearAllData(): Promise<void> {
    this.photos.clear();
    this.albums.clear();
    this.favorites.clear();

    if (firestoreDb) {
      try {
        const photosSnap = await getDocs(collection(firestoreDb, "photos"));
        for (const d of photosSnap.docs) {
          await deleteDoc(doc(firestoreDb, "photos", d.id));
        }

        const albumsSnap = await getDocs(collection(firestoreDb, "albums"));
        for (const d of albumsSnap.docs) {
          await deleteDoc(doc(firestoreDb, "albums", d.id));
        }
        console.log("[Firestore] All documents successfully cleared from Firestore cloud collections.");
      } catch (err: any) {
        console.warn("[Firestore] Error while clearing cloud collections:", err.message);
      }
    }
  }
}

export const dbService = new FirestoreDatabaseService();
