import 'dotenv/config';
import { startServer } from './server/index.js';

startServer().catch((err) => {
  console.error('[Server Fatal Error]:', err);
  process.exit(1);
});
