import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

import { PORT, UPLOADS_DIR, DIST_PATH, isProduction } from './config.js';
import { dbService } from './services/database.js';
import { aiService } from './services/ai.js';
import { vectorSearchService } from './services/vectorSearch.js';
import { semanticSearchEngine } from './services/semanticSearch.js';

// Route modules
import { mediaRouter } from './routes/media.js';
import { photosRouter } from './routes/photos.js';
import { searchRouter } from './routes/search.js';
import { albumsRouter } from './routes/albums.js';
import { systemRouter } from './routes/system.js';
import { driveRouter } from './routes/drive.js';

async function bootstrapVectorIndex() {
  console.log('[System] Initializing Vertex AI Vector Search index from Firestore metadata...');
  const photos = await dbService.getPhotos('user_default', { isTrash: false });

  for (const photo of photos) {
    const textContext = `${photo.aiDescription} ${photo.objects.join(' ')} ${photo.activities.join(' ')} ${photo.environment} ${photo.time} ${photo.location}`;
    const vector = semanticSearchEngine.generateDenseVector(textContext);

    await vectorSearchService.upsertVector({
      id: photo.id,
      userId: photo.userId,
      vector,
      metadata: {
        dateTaken: photo.dateTaken,
        location: photo.location,
        isFavorite: photo.isFavorite,
        albumIds: photo.albumIds,
        isTrash: photo.isTrash,
      },
    });
  }
  console.log(`[System] Successfully indexed ${vectorSearchService.getIndexedCount()} photos into Vertex AI Vector Search (0 API calls used).`);
}

export async function createApp() {
  const app = express();

  // Basic middleware
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Media serving router (/uploads)
  app.use('/uploads', mediaRouter);

  // API Route Modules
  app.use('/api/system', systemRouter);
  app.use('/api/photos', photosRouter);
  app.use('/api/search', searchRouter);
  app.use('/api/albums', albumsRouter);
  app.use('/api/drive', driveRouter);

  // Clear & demo endpoints under /api
  app.use('/api', systemRouter);

  // Bootstrap vector search index in background
  await bootstrapVectorIndex();

  // Vite development middleware or production static serving
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(DIST_PATH));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(DIST_PATH, 'index.html'));
    });
  }

  return app;
}

export async function startServer() {
  const app = await createApp();

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n=================================================`);
    console.log(`🚀 Google AI Photo Search server running on port ${PORT}`);
    console.log(`🔑 Gemini API Key configured: ${aiService.getHasKey() ? 'YES (Active)' : 'NO (Using fallback vectors)'}`);
    console.log(`👉 Open: http://localhost:${PORT}`);
    console.log(`=================================================\n`);
  });

  return server;
}
