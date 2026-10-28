import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { UPLOADS_DIR } from '../config.js';
import { dbService } from '../services/database.js';
import { driveStorageService } from '../services/driveStorage.js';

export const mediaRouter = Router();

mediaRouter.get('/:file', async (req: Request, res: Response) => {
  const filename = req.params.file;
  const localFilePath = path.join(UPLOADS_DIR, filename);

  // 1. If file already exists locally in cache, serve it immediately
  if (fs.existsSync(localFilePath)) {
    return res.sendFile(localFilePath);
  }

  // 2. Fetch associated photo record from database to find Google Drive references
  const photo = dbService.getPhotoByFilenameOrId(filename);

  // 3. If photo has Google Drive account association, download from Google Drive
  const driveAccountId = photo?.driveAccountId || 'drive_acc_om';
  const driveFileId = photo?.driveFileId;
  if (driveFileId) {
    try {
      const driveFile = await driveStorageService.downloadFile(
        driveAccountId,
        driveFileId,
        filename
      );
      if (driveFile) {
        try {
          fs.writeFileSync(localFilePath, driveFile.buffer);
        } catch {
          // ignore
        }
        res.setHeader('Content-Type', driveFile.mimeType || 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        return res.send(driveFile.buffer);
      }
    } catch (driveErr) {
      console.warn(`[Drive Media] Could not download file from Google Drive:`, driveErr);
    }
  }

  // Check if file is in managed Drive folder
  const localDriveFile = await driveStorageService.downloadFile(driveAccountId, '', filename);
  if (localDriveFile) {
    try {
      fs.writeFileSync(localFilePath, localDriveFile.buffer);
    } catch {
      // ignore
    }
    res.setHeader('Content-Type', localDriveFile.mimeType || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.send(localDriveFile.buffer);
  }

  // 4. If it is an Unsplash sample photo (e.g. photo-1464863979621-258859e62245.avif)
  const candidateName = (photo?.filename || '') + ' ' + filename;
  const unsplashMatch = candidateName.match(/photo-\d+-[a-zA-Z0-9]+/);

  if (unsplashMatch) {
    const unsplashUrl = `https://images.unsplash.com/${unsplashMatch[0]}?auto=format&fit=crop&w=1200&q=80`;
    try {
      const remoteRes = await fetch(unsplashUrl);
      if (remoteRes.ok) {
        const arrayBuf = await remoteRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuf);
        // Cache locally so subsequent requests never have to re-fetch
        fs.writeFileSync(localFilePath, buffer);
        res.setHeader('Content-Type', remoteRes.headers.get('content-type') || 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        return res.send(buffer);
      }
    } catch (fetchErr) {
      console.warn('[Storage] Remote sample fetch failed, using fallback card:', fetchErr);
    }
  }

  // 5. Graceful SVG fallback card for Google Drive synced photos not present on local disk
  const driveEmail = photo?.driveAccountEmail || 'Personal Google Drive';
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.send(`
    <svg width="600" height="450" viewBox="0 0 600 450" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="600" height="450" rx="16" fill="#EEF2F6"/>
      <circle cx="300" cy="175" r="44" fill="#E2E8F0"/>
      <path d="M282 165C282 161.686 284.686 159 288 159H312C315.314 159 318 161.686 318 165V189C318 192.314 315.314 195 312 195H288C284.686 195 282 192.314 282 189V165Z" stroke="#2563EB" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="293" cy="170" r="2.5" fill="#2563EB"/>
      <path d="M285 190L293 179L301 186L306 181L314 190" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="300" y="255" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="16" fill="#1E293B" text-anchor="middle">Google Drive Storage</text>
      <text x="300" y="280" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#64748B" text-anchor="middle">Stored in account: ${driveEmail}</text>
      <text x="300" y="305" font-family="monospace" font-size="11" fill="#3B82F6" text-anchor="middle">AI Photo Search/Photos</text>
      <text x="300" y="330" font-family="monospace" font-size="10" fill="#94A3B8" text-anchor="middle">${filename}</text>
    </svg>
  `);
});
