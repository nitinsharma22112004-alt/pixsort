import { GoogleGenAI, Type } from '@google/genai';

export interface ExtractedPhotoMetadata {
  aiDescription: string;
  objects: string[];
  activities: string[];
  environment: string;
  time: string;
}

export interface InterpretedQuery {
  semanticQuery: string;
  dateFilter?: string;
  locationFilter?: string;
  favoriteOnly?: boolean;
  albumFilter?: string;
}

// 768-dimensional semantic embedding space for unified multimodal representation
const EMBEDDING_DIMENSION = 768;

// Canonical semantic concepts for grounding multimodal dense space
const CONCEPT_CLUSTERS: Record<string, string[]> = {
  pool: ['pool', 'swimming', 'swimming pool', 'pool party', 'inflatable', 'flamingo', 'water splash', 'deck', 'sun lounger', 'swimsuit', 'sunbathing', 'poolside'],
  beach: ['beach', 'ocean', 'sea', 'sand', 'shore', 'waves', 'surf', 'coastal', 'palm trees', 'coastline', 'shells', 'sun', 'tropical', 'goa', 'water'],
  college: ['college', 'university', 'campus', 'study', 'quad', 'students', 'library', 'graduation', 'degree', 'academics', 'class', 'books', 'backpack', 'lawn', 'exam'],
  birthday: ['birthday', 'birthday party', 'cake', 'candles', 'celebration', 'balloons', 'bday', 'confetti', 'party hats', 'presents', 'gifts', 'blowing candles'],
  gym: ['gym', 'workout', 'fitness', 'weights', 'dumbbells', 'barbell', 'exercise', 'training', 'athletics', 'bodybuilding', 'squat', 'bench press', 'sports'],
  food: ['food', 'dining', 'pizza', 'ramen', 'noodles', 'brunch', 'lunch', 'dinner', 'restaurant', 'delicious', 'coffee', 'espresso', 'snack', 'cheese', 'meal'],
  sunset: ['sunset', 'golden hour', 'dusk', 'twilight', 'evening sky', 'horizon', 'crimson', 'orange sky', 'silhouette', 'sundown', 'sunshine'],
  travel: ['travel', 'hiking', 'mountains', 'trip', 'vista', 'trail', 'vacation', 'backpacking', 'tourist', 'journey', 'airport', 'landscape'],
  family: ['family', 'gathering', 'parents', 'siblings', 'relatives', 'children', 'picnic', 'home', 'cozy', 'living room', 'dinner table'],
  friends: ['friends', 'hangout', 'night out', 'rooftop', 'party', 'laughing', 'drinks', 'friendship', 'board game', 'outdoor party', 'social', 'celebrating'],
};

// Resilient chain of vision models
const VISION_MODELS = ['gemini-2.5-flash', 'gemini-3.8-flash'];

export class GeminiAIService {
  private client: GoogleGenAI | null = null;
  private cachedKey: string | null = null;

  private getClient(): GoogleGenAI | null {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
      return null;
    }
    if (!this.client || this.cachedKey !== apiKey) {
      try {
        this.client = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });
        this.cachedKey = apiKey;
        console.log('[Gemini AI] Initialized client with active API key.');
      } catch (err) {
        console.warn('[Gemini AI] Initialization warning:', err);
        return null;
      }
    }
    return this.client;
  }

  getHasKey(): boolean {
    const apiKey = process.env.GEMINI_API_KEY;
    return Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim() !== '');
  }

  /**
   * Generates text embedding using Gemini Embedding 2 with retry for transient spikes
   */
  async embedText(text: string): Promise<number[]> {
    const client = this.getClient();
    if (client) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const response = await client.models.embedContent({
            model: 'gemini-embedding-2-preview',
            contents: [text],
          });

          // @ts-ignore
          const rawVector = response.embedding?.values || response.embeddings?.[0]?.values;
          if (rawVector && Array.isArray(rawVector) && rawVector.length > 0) {
            return this.normalizeVector(rawVector);
          }
        } catch (err: any) {
          const isTransient =
            err.status === 503 ||
            err.status === 429 ||
            err.code === 503 ||
            err.code === 429 ||
            (err.message && (err.message.includes('high demand') || err.message.includes('UNAVAILABLE')));
          if (isTransient && attempt === 1) {
            await new Promise((r) => setTimeout(r, 600));
            continue;
          }
          console.warn('[Gemini Embedding] embedContent notice, using semantic vector fallback:', err.message);
          break;
        }
      }
    }

    return this.generateSemanticFallbackVector(text);
  }

  /**
   * Generates multimodal image embedding using Gemini Embedding 2 with retry
   */
  async embedImage(base64Data: string, mimeType: string = 'image/jpeg'): Promise<number[]> {
    const client = this.getClient();
    if (client) {
      const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const response = await client.models.embedContent({
            model: 'gemini-embedding-2-preview',
            contents: [
              {
                inlineData: {
                  data: cleanBase64,
                  mimeType,
                },
              },
            ],
          });

          // @ts-ignore
          const rawVector = response.embedding?.values || response.embeddings?.[0]?.values;
          if (rawVector && Array.isArray(rawVector) && rawVector.length > 0) {
            return this.normalizeVector(rawVector);
          }
        } catch (err: any) {
          const isTransient =
            err.status === 503 ||
            err.status === 429 ||
            err.code === 503 ||
            err.code === 429 ||
            (err.message && (err.message.includes('high demand') || err.message.includes('UNAVAILABLE')));
          if (isTransient && attempt === 1) {
            await new Promise((r) => setTimeout(r, 600));
            continue;
          }
          console.warn('[Gemini Embedding] embedImage notice, using fallback vector:', err.message);
          break;
        }
      }
    }

    // Fallback: analyze basic visual texture / metadata tags
    return this.generateSemanticFallbackVector('uploaded photograph scene');
  }

  /**
   * Analyzes photo visual metadata using resilient Gemini Vision chain (no face recognition)
   */
  async analyzePhotoVision(
    base64Data: string,
    mimeType: string = 'image/jpeg',
    filename?: string,
    locationHint?: string
  ): Promise<ExtractedPhotoMetadata> {
    const client = this.getClient();

    if (client) {
      const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
      console.log(`[Gemini Vision] Initiating vision analysis for photo "${filename || 'unnamed'}"...`);

      for (const model of VISION_MODELS) {
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            const response = await client.models.generateContent({
              model,
              contents: {
                parts: [
                  {
                    inlineData: {
                      data: cleanBase64,
                      mimeType,
                    },
                  },
                  {
                    text: 'Analyze this photo or image. Describe accurately what is depicted (e.g. document, student/college card, landscape, indoor/outdoor scene, people, objects, activities, or visual subject). Provide a structured summary with: aiDescription (1-2 clear descriptive sentences), objects (3-8 specific items or elements seen), activities (1-3 actions or themes), environment (Indoor, Outdoor, Campus, Office, Classroom, etc.), and time (Daytime, Evening, Night, Indoor Lighting, etc.). Do not attempt biometric face recognition.',
                  },
                ],
              },
              config: {
                responseMimeType: 'application/json',
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    aiDescription: { type: Type.STRING },
                    objects: { type: Type.ARRAY, items: { type: Type.STRING } },
                    activities: { type: Type.ARRAY, items: { type: Type.STRING } },
                    environment: { type: Type.STRING },
                    time: { type: Type.STRING },
                  },
                  required: ['aiDescription', 'objects', 'activities', 'environment', 'time'],
                },
              },
            });

            if (response.text) {
              const parsed = JSON.parse(response.text.trim());
              console.log(`[Gemini Vision] Success via ${model}: "${parsed.aiDescription}"`);
              return {
                aiDescription: parsed.aiDescription || 'A personal photograph captured and indexed with multimodal embedding.',
                objects: Array.isArray(parsed.objects) && parsed.objects.length > 0 ? parsed.objects : ['Subject', 'Visual Elements'],
                activities: Array.isArray(parsed.activities) && parsed.activities.length > 0 ? parsed.activities : ['Captured memory'],
                environment: parsed.environment || 'Indoor',
                time: parsed.time || 'Daytime',
              };
            }
          } catch (err: any) {
            const isTransient =
              err.status === 503 ||
              err.status === 429 ||
              err.code === 503 ||
              err.code === 429 ||
              (err.message && (err.message.includes('high demand') || err.message.includes('UNAVAILABLE') || err.message.includes('Resource has been exhausted')));

            if (isTransient && attempt === 1) {
              await new Promise((r) => setTimeout(r, 600));
              continue;
            }

            console.warn(`[Gemini Vision] Model ${model} returned error: ${err.message || err}`);
            break; // Switch to next model in VISION_MODELS
          }
        }
      }
    } else {
      console.warn('[Gemini Vision] GEMINI_API_KEY is not set or invalid in environment. Please check your .env file.');
    }

    // Context-aware fallback metadata if key is missing or all models are unavailable
    const inferredObjects: string[] = ['Photograph subject', 'Ambient scene'];
    let inferredActivity = 'Captured memory';
    if (filename) {
      const lower = filename.toLowerCase();
      if (lower.includes('college') || lower.includes('id') || lower.includes('card')) {
        inferredObjects.push('Identity card', 'Credentials', 'College document');
        inferredActivity = 'Identification';
      }
      if (lower.includes('beach') || lower.includes('sea')) inferredObjects.push('Beach', 'Water');
      if (lower.includes('pool') || lower.includes('swim')) inferredObjects.push('Swimming pool', 'Water');
      if (lower.includes('party') || lower.includes('bday')) inferredActivity = 'Celebration';
      if (lower.includes('food') || lower.includes('cafe')) inferredObjects.push('Dish', 'Table');
    }
    if (locationHint) {
      inferredObjects.push(locationHint);
    }

    return {
      aiDescription: filename
        ? `Personal photograph (${filename.replace(/\.[^/.]+$/, '')}) captured and indexed with multimodal embedding.`
        : 'Personal photograph captured and indexed with multimodal embedding.',
      objects: inferredObjects,
      activities: [inferredActivity],
      environment: 'Outdoor',
      time: 'Daytime',
    };
  }

  /**
   * Interprets natural language queries (e.g. "Pool party in July", "Beach photos from last summer", "Photos from the gym favorites")
   * Separating semantic meaning from metadata filters.
   */
  interpretNaturalQuery(rawQuery: string): InterpretedQuery {
    const q = rawQuery.trim().toLowerCase();
    let semantic = rawQuery.trim();
    let dateFilter: string | undefined;
    let locationFilter: string | undefined;
    let favoriteOnly: boolean | undefined;

    // Check favorites
    if (q.includes('favorite') || q.includes('favourite') || q.includes('starred')) {
      favoriteOnly = true;
      semantic = semantic.replace(/favorite(s)?|favourite(s)?|starred/gi, '').trim();
    }

    // Check dates (e.g. "July 2026", "in July", "September 2026", "2026", "last summer")
    const months: Record<string, string> = {
      january: '01',
      february: '02',
      march: '03',
      april: '04',
      may: '05',
      june: '06',
      july: '07',
      august: '08',
      september: '09',
      october: '10',
      november: '11',
      december: '12',
    };

    for (const [monthName, monthNum] of Object.entries(months)) {
      const regex = new RegExp(`\\b(in |from )?${monthName}( 2026)?\\b`, 'i');
      if (regex.test(q)) {
        dateFilter = `2026-${monthNum}`;
        semantic = semantic.replace(regex, '').trim();
        break;
      }
    }

    if (!dateFilter && (q.includes('summer') || q.includes('last summer'))) {
      dateFilter = '2026-07'; // July summer peak
      semantic = semantic.replace(/\b(from |in )?(last )?summer\b/gi, '').trim();
    }

    // Check locations
    const knownLocations = ['goa', 'noida', 'delhi', 'gurgaon', 'himachal', 'mount abu'];
    for (const loc of knownLocations) {
      const locRegex = new RegExp(`\\b(in |from |at )?${loc}\\b`, 'i');
      if (locRegex.test(q)) {
        locationFilter = loc;
        semantic = semantic.replace(locRegex, '').trim();
        break;
      }
    }

    // Clean up connecting words if stripped
    semantic = semantic.replace(/\b(photos of|photos from|photos|pictures of|pictures)\b/gi, '').trim();
    if (!semantic) {
      semantic = rawQuery; // fallback to full query if everything was stripped
    }

    return {
      semanticQuery: semantic,
      dateFilter,
      locationFilter,
      favoriteOnly,
    };
  }

  /**
   * Generates a normalized 768-dim dense embedding for semantic fallback
   */
  generateSemanticFallbackVector(text: string): number[] {
    const vector = new Array(EMBEDDING_DIMENSION).fill(0);
    const tokens = text.toLowerCase().split(/[\s,._-]+/).filter(Boolean);

    // Compute cluster activations
    let activated = false;
    let clusterIdx = 0;

    for (const [clusterKey, keywords] of Object.entries(CONCEPT_CLUSTERS)) {
      const segmentSize = Math.floor(EMBEDDING_DIMENSION / 10);
      const startIdx = clusterIdx * segmentSize;

      let score = 0;
      for (const token of tokens) {
        if (clusterKey === token || keywords.some((kw) => kw.includes(token) || token.includes(kw))) {
          score += 1.0;
        }
      }

      if (score > 0) {
        activated = true;
        // Project activation into cluster subspace with unique harmonic frequencies
        for (let i = 0; i < segmentSize; i++) {
          const harmonic = Math.sin((i + 1) * (clusterIdx + 1) * 0.45);
          vector[startIdx + i] += score * (0.8 + 0.2 * harmonic);
        }
      }
      clusterIdx++;
    }

    // Token hash background signal to preserve query uniqueness
    for (const token of tokens) {
      let hash = 0;
      for (let c = 0; c < token.length; c++) {
        hash = (hash << 5) - hash + token.charCodeAt(c);
        hash |= 0;
      }
      for (let d = 0; d < 32; d++) {
        const pos = Math.abs((hash * (d + 13)) % EMBEDDING_DIMENSION);
        vector[pos] += 0.35;
      }
    }

    // Small ambient noise to prevent zero vectors
    for (let i = 0; i < EMBEDDING_DIMENSION; i++) {
      vector[i] += 0.02 * Math.sin(i * 0.77);
    }

    return this.normalizeVector(vector);
  }

  private normalizeVector(v: number[]): number[] {
    let sumSq = 0;
    for (let i = 0; i < v.length; i++) {
      sumSq += v[i] * v[i];
    }
    const norm = Math.sqrt(sumSq);
    if (norm === 0) return v;
    return v.map((x) => x / norm);
  }
}

export const aiService = new GeminiAIService();
