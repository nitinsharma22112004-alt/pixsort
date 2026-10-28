import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Guarantee environment variables are loaded immediately
dotenv.config();

export const PORT = Number(process.env.PORT) || 3000;
export const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');
export const DIST_PATH = path.join(process.cwd(), 'dist');

// Ensure public uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export const isProduction = process.env.NODE_ENV === 'production';
