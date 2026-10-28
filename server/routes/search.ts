import { Router, Request, Response } from 'express';
import { semanticSearchEngine } from '../services/semanticSearch.js';

export const searchRouter = Router();

// Search photos using natural language semantic search engine (0 Gemini API calls, maximum semantic quality)
searchRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { query, filters } = req.body;
    const userId = (req.headers['x-user-id'] as string) || (req.body.userId as string) || 'user_default';
    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const searchResponse = await semanticSearchEngine.executeSearch(query, filters, userId);
    res.json(searchResponse);
  } catch (err: any) {
    console.error('Search error:', err);
    res.status(500).json({ error: err.message });
  }
});
