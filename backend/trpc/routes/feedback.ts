import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../create-context';
import { getDb, FeedbackRecord } from '@/backend/db';

export const feedbackRouter = createTRPCRouter({
  save: publicProcedure
    .input(
      z.object({
        timestamp: z.number(),
        imageWithFlash: z.string(),
        imageWithoutFlash: z.string(),
        predictedStainType: z.string(),
        predictedCategory: z.string(),
        userFeedback: z.enum(['correct', 'incorrect']),
        correctedStainType: z.string().optional(),
        correctedCategory: z.string().optional(),
        modelUsed: z.string(),
        confidence: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      const result = await db.create('feedback', input);
      return result;
    }),

  getAll: publicProcedure.query(async () => {
    const db = await getDb();
    const results = await db.query<[FeedbackRecord[]]>('SELECT * FROM feedback ORDER BY timestamp DESC;');
    return results[0] || [];
  }),

  getRecent: publicProcedure
    .input(z.object({ limit: z.number().default(10) }))
    .query(async ({ input }) => {
      const db = await getDb();
      const results = await db.query<[FeedbackRecord[]]>(
        `SELECT * FROM feedback ORDER BY timestamp DESC LIMIT ${input.limit};`
      );
      return results[0] || [];
    }),

  getByStainType: publicProcedure
    .input(z.object({ stainType: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const results = await db.query<[FeedbackRecord[]]>('SELECT * FROM feedback;');
      const feedbackList = results[0] || [];
      return feedbackList.filter(
        (f: FeedbackRecord) =>
          f.predictedStainType.toLowerCase() === input.stainType.toLowerCase() ||
          f.correctedStainType?.toLowerCase() === input.stainType.toLowerCase()
      );
    }),

  getStats: publicProcedure.query(async () => {
    const db = await getDb();
    const results = await db.query<[FeedbackRecord[]]>('SELECT * FROM feedback;');
    const feedbackList = results[0] || [];

    if (feedbackList.length === 0) {
      return {
        totalFeedback: 0,
        correctPredictions: 0,
        incorrectPredictions: 0,
        accuracyRate: 0,
        stainTypeAccuracy: {},
        modelPerformance: {},
      };
    }

    const correctPredictions = feedbackList.filter((f: FeedbackRecord) => f.userFeedback === 'correct').length;
    const incorrectPredictions = feedbackList.filter((f: FeedbackRecord) => f.userFeedback === 'incorrect').length;

    const stainTypeAccuracy: Record<string, { correct: number; total: number; accuracy: number }> = {};
    const modelPerformance: Record<string, { correct: number; total: number; accuracy: number }> = {};

    feedbackList.forEach((entry: FeedbackRecord) => {
      const stainType = entry.predictedStainType;
      const model = entry.modelUsed;
      const isCorrect = entry.userFeedback === 'correct';

      if (!stainTypeAccuracy[stainType]) {
        stainTypeAccuracy[stainType] = { correct: 0, total: 0, accuracy: 0 };
      }
      stainTypeAccuracy[stainType].total++;
      if (isCorrect) stainTypeAccuracy[stainType].correct++;

      if (!modelPerformance[model]) {
        modelPerformance[model] = { correct: 0, total: 0, accuracy: 0 };
      }
      modelPerformance[model].total++;
      if (isCorrect) modelPerformance[model].correct++;
    });

    Object.keys(stainTypeAccuracy).forEach((key) => {
      const stats = stainTypeAccuracy[key];
      stats.accuracy = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
    });

    Object.keys(modelPerformance).forEach((key) => {
      const stats = modelPerformance[key];
      stats.accuracy = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
    });

    return {
      totalFeedback: feedbackList.length,
      correctPredictions,
      incorrectPredictions,
      accuracyRate: (correctPredictions / feedbackList.length) * 100,
      stainTypeAccuracy,
      modelPerformance,
    };
  }),

  clearAll: publicProcedure.mutation(async () => {
    const db = await getDb();
    await db.query('DELETE feedback;');
    return { success: true };
  }),
});
