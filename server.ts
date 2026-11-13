import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);

function createGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    identified: {
      type: Type.BOOLEAN,
      description: 'True only if the product/material is clearly identifiable. False if blurry, blank, dark, or ambiguous.',
    },
    clarificationNeededReason: {
      type: Type.STRING,
      description: 'If identified is false, explain honestly what is unclear and ask the user for a clearer angle or extra text details.',
    },
    productName: {
      type: Type.STRING,
      description: 'Concise, specific product name (e.g., Clear PET Water Bottle, Ceramic Coffee Mug, Lithium-Ion Power Bank).',
    },
    category: {
      type: Type.STRING,
      enum: [
        'Plastic',
        'Paper and cardboard',
        'Glass',
        'Metal',
        'Electronic waste',
        'Clothes and textiles',
        'Furniture',
        'Wood',
        'Food waste',
        'Household items',
        'Other materials',
      ],
    },
    materialComposition: {
      type: Type.STRING,
      description: 'Only identifiable visible materials (e.g., Clear PET #1 plastic with HDPE cap). Do not fabricate unseen components.',
    },
    visibleCondition: {
      type: Type.STRING,
      description: 'Honest assessment of visible condition (e.g., Intact and clean, Scratched surface, Cracked casing, Unknown).',
    },
    isReusable: { type: Type.BOOLEAN },
    isRepairable: { type: Type.BOOLEAN },
    isRecyclable: { type: Type.BOOLEAN },
    isHazardous: { type: Type.BOOLEAN },
    hazardWarning: {
      type: Type.STRING,
      description: 'Safety warning if hazardous (batteries, sharp broken glass, chemicals, electronics, pressurized cans). Empty if none.',
    },
    donationSuitable: { type: Type.BOOLEAN },
    primaryRecommendation: {
      type: Type.STRING,
      enum: ['REUSE', 'DONATE', 'RECYCLE', 'DISPOSE'],
    },
    decisionSummary: {
      type: Type.STRING,
      description: 'One-sentence clear summary of the best next step.',
    },
    decisionReasoning: {
      type: Type.STRING,
      description: 'Why this primary decision was prioritized over the other options.',
    },
    estimatedWeightKg: {
      type: Type.NUMBER,
      description: 'Conservative estimated weight of one typical item in kilograms (e.g. 0.03 to 15).',
    },
    reuseIdeas: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          requiredMaterials: { type: Type.ARRAY, items: { type: Type.STRING } },
          difficulty: { type: Type.STRING, enum: ['Easy', 'Moderate', 'Advanced'] },
          estimatedTime: { type: Type.STRING },
          steps: { type: Type.ARRAY, items: { type: Type.STRING } },
          environmentalBenefits: { type: Type.STRING },
        },
        required: [
          'title',
          'description',
          'requiredMaterials',
          'difficulty',
          'estimatedTime',
          'steps',
          'environmentalBenefits',
        ],
      },
    },
    donationGuidance: {
      type: Type.OBJECT,
      properties: {
        suitable: { type: Type.BOOLEAN },
        whySuitableOrNot: { type: Type.STRING },
        whoMightBenefit: { type: Type.ARRAY, items: { type: Type.STRING } },
        suggestedOptions: { type: Type.ARRAY, items: { type: Type.STRING } },
        preparationSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ['suitable', 'whySuitableOrNot', 'whoMightBenefit', 'suggestedOptions', 'preparationSteps'],
    },
    recyclingGuidance: {
      type: Type.OBJECT,
      properties: {
        eligible: { type: Type.BOOLEAN },
        materialType: { type: Type.STRING },
        preparationInstructions: { type: Type.ARRAY, items: { type: Type.STRING } },
        separationRequirements: { type: Type.ARRAY, items: { type: Type.STRING } },
        recyclingSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
        collectionOptions: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: [
        'eligible',
        'materialType',
        'preparationInstructions',
        'separationRequirements',
        'recyclingSteps',
        'collectionOptions',
      ],
    },
    disposalGuidance: {
      type: Type.OBJECT,
      properties: {
        whyNotReusable: { type: Type.STRING },
        whyNotDonatable: { type: Type.STRING },
        appropriateMethod: { type: Type.STRING },
        safetyPrecautions: { type: Type.ARRAY, items: { type: Type.STRING } },
        localGuidance: { type: Type.STRING },
      },
      required: ['whyNotReusable', 'whyNotDonatable', 'appropriateMethod', 'safetyPrecautions', 'localGuidance'],
    },
  },
  required: [
    'identified',
    'productName',
    'category',
    'materialComposition',
    'visibleCondition',
    'isReusable',
    'isRepairable',
    'isRecyclable',
    'isHazardous',
    'donationSuitable',
    'primaryRecommendation',
    'decisionSummary',
    'decisionReasoning',
    'estimatedWeightKg',
    'reuseIdeas',
    'donationGuidance',
    'recyclingGuidance',
    'disposalGuidance',
  ],
};

const SYSTEM_PROMPT = `You are the Circular Sustainability & Waste Decision Engine for "Before You Throw It Away".
Your job is to inspect an image or user-provided product query and determine the safest, highest-value circular next step.

CRITICAL HONESTY & ACCURACY RULES:
1. Never invent material composition or product condition if not visible or stated. If the photo is blurry, dark, blank, or ambiguous, set identified=false and explain clearly in clarificationNeededReason what additional angle or details are needed.
2. Follow the Circular Decision Hierarchy strictly:
   - Prioritize REUSE when the item is clean, safe, and has practical DIY / secondary uses.
   - Recommend DONATE when an item is functional, clean, safe, and useful to others (e.g., clothes, books, toys, working electronics, furniture). NEVER recommend donating unsafe, damaged, contaminated, expired, or hazardous items.
   - Recommend RECYCLE when reuse/donation is impractical and the material is recoverable, clearly noting preparation and separation rules. Do NOT assume all plastics or composites are recyclable.
   - Recommend DISPOSE when contaminated, hazardous, broken beyond safe repair, or unrecyclable, with clear safety precautions and local hazardous/municipal guidance.
3. Provide safety warnings for batteries, e-waste, sharp glass, chemicals, or pressurized canisters.
4. Never fabricate fake recycling center names or street addresses.`;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  app.get('/api/health', (_req, res) => {
    const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');
    res.json({ ok: true, geminiConfigured: hasKey });
  });

  app.post('/api/analyze-waste', async (req, res) => {
    try {
      const { imageBase64, mimeType, productQuery, additionalContext, userCity } = req.body ?? {};

      if (!imageBase64 && (!productQuery || typeof productQuery !== 'string' || !productQuery.trim())) {
        res.status(400).json({ error: 'Please provide an image or a product description to analyze.' });
        return;
      }

      const ai = createGeminiClient();
      if (!ai) {
        res.status(503).json({
          error: 'Gemini AI API key is not configured on the server. Add GEMINI_API_KEY in Settings > Secrets to enable live AI scanning.',
          code: 'GEMINI_NOT_CONFIGURED',
        });
        return;
      }

      const contextLines: string[] = [];
      if (productQuery) contextLines.push(`Product search query: ${String(productQuery).slice(0, 200)}`);
      if (additionalContext) contextLines.push(`User notes/context: ${String(additionalContext).slice(0, 300)}`);
      if (userCity) contextLines.push(`User approximate city/region: ${String(userCity).slice(0, 100)}`);
      contextLines.push(
        imageBase64
          ? 'Analyze the attached photograph carefully. Identify the item, visible material composition, visible condition, safety hazards, and recommend REUSE, DONATE, RECYCLE, or DISPOSE.'
          : 'Analyze the described product carefully and recommend REUSE, DONATE, RECYCLE, or DISPOSE with practical instructions.'
      );

      const parts: Array<{ inlineData: { mimeType: string; data: string } } | { text: string }> = [];
      if (imageBase64 && typeof imageBase64 === 'string') {
        const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
        parts.push({
          inlineData: {
            mimeType: typeof mimeType === 'string' && mimeType.startsWith('image/') ? mimeType : 'image/jpeg',
            data: cleanBase64,
          },
        });
      }
      parts.push({ text: contextLines.join('\n') });

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: { parts },
        config: {
          systemInstruction: SYSTEM_PROMPT,
          responseMimeType: 'application/json',
          responseSchema: ANALYSIS_SCHEMA,
        },
      });

      const rawText = response.text;
      if (!rawText) {
        res.status(502).json({ error: 'Gemini returned an empty response. Please try again.' });
        return;
      }

      const parsed = JSON.parse(rawText);
      res.json({ analysis: parsed });
    } catch (err: unknown) {
      console.error('Gemini analyze-waste error:', err);
      const message = err instanceof Error ? err.message : 'Unexpected server error during AI analysis.';
      if (message.includes('API_KEY') || message.includes('PERMISSION_DENIED') || message.includes('403')) {
        res.status(403).json({
          error: 'Gemini API authentication failed. Please verify GEMINI_API_KEY in Settings > Secrets.',
        });
        return;
      }
      if (message.includes('RESOURCE_EXHAUSTED') || message.includes('429')) {
        res.status(429).json({
          error: 'AI analysis quota reached. Please wait a moment and try again.',
        });
        return;
      }
      res.status(500).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Before You Throw It Away server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
