import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../create-context';
import { saveClassificationToUC, getClassificationsFromUC, getUCStats, isDatabricksConfigured } from '@/utils/databricks-uc';

export const databricksUCRouter = createTRPCRouter({
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
      console.log('[DatabricksUC Route] Saving classification:', input.id);
      
      if (!isDatabricksConfigured()) {
        console.warn('[DatabricksUC Route] Databricks not configured, skipping UC save');
        return { success: false, error: 'Databricks not configured' };
      }

      const result = await saveClassificationToUC({
        id: input.id,
        timestamp: input.timestamp,
        image_with_flash: input.imageWithFlash,
        image_without_flash: input.imageWithoutFlash,
        predicted_stain_type: input.predictedStainType,
        predicted_category: input.predictedCategory,
        user_feedback: input.userFeedback,
        corrected_stain_type: input.correctedStainType || null,
        corrected_category: input.correctedCategory || null,
        model_used: input.modelUsed,
        confidence: input.confidence ?? null,
        username: input.username,
      });

      return result;
    }),

  getClassifications: publicProcedure
    .input(z.object({ limit: z.number().default(100) }).optional())
    .query(async ({ input }) => {
      if (!isDatabricksConfigured()) {
        return [];
      }
      return getClassificationsFromUC(input?.limit || 100);
    }),

  getStats: publicProcedure.query(async () => {
    if (!isDatabricksConfigured()) {
      return { total: 0, correct: 0, incorrect: 0, byModel: {}, byStainType: {} };
    }
    return getUCStats();
  }),

  isConfigured: publicProcedure.query(() => {
    return { configured: isDatabricksConfigured() };
  }),
});
