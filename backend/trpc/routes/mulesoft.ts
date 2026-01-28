import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../create-context';
import {
  saveClassificationViaMuleSoft,
  getClassificationsViaMuleSoft,
  getStatsViaMuleSoft,
  isMuleSoftConfigured,
  testMuleSoftConnection,
} from '@/utils/mulesoft-api';

export const mulesoftRouter = createTRPCRouter({
  saveClassification: publicProcedure
    .input(
      z.object({
        id: z.string(),
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
        username: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      console.log('[MuleSoft Route] Saving classification:', input.id);

      if (!isMuleSoftConfigured()) {
        console.warn('[MuleSoft Route] MuleSoft not configured, skipping save');
        return { success: false, error: 'MuleSoft not configured' };
      }

      const result = await saveClassificationViaMuleSoft({
        id: input.id,
        timestamp: input.timestamp,
        imageWithFlash: input.imageWithFlash,
        imageWithoutFlash: input.imageWithoutFlash,
        predictedStainType: input.predictedStainType,
        predictedCategory: input.predictedCategory,
        userFeedback: input.userFeedback,
        correctedStainType: input.correctedStainType || null,
        correctedCategory: input.correctedCategory || null,
        modelUsed: input.modelUsed,
        confidence: input.confidence ?? null,
        username: input.username,
      });

      return result;
    }),

  getClassifications: publicProcedure
    .input(z.object({ limit: z.number().default(100) }).optional())
    .query(async ({ input }) => {
      if (!isMuleSoftConfigured()) {
        return { success: false, data: [], error: 'MuleSoft not configured' };
      }
      return getClassificationsViaMuleSoft(input?.limit || 100);
    }),

  getStats: publicProcedure.query(async () => {
    if (!isMuleSoftConfigured()) {
      return { success: false, data: { total: 0, correct: 0, incorrect: 0 }, error: 'MuleSoft not configured' };
    }
    return getStatsViaMuleSoft();
  }),

  isConfigured: publicProcedure.query(() => {
    return { configured: isMuleSoftConfigured() };
  }),

  testConnection: publicProcedure.mutation(async () => {
    return testMuleSoftConnection();
  }),
});
