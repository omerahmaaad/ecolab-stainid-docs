import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../create-context';
import { getDb, UserSettings } from '@/backend/db';

export const settingsRouter = createTRPCRouter({
  ping: publicProcedure.query(async () => {
    console.log('[Settings] Ping received');
    return { 
      success: true, 
      message: 'Backend is reachable', 
      timestamp: Date.now() 
    };
  }),
  get: publicProcedure
    .input(z.object({ deviceId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const results = await db.query<[UserSettings[]]>(
        `SELECT * FROM settings WHERE id = $deviceId;`,
        { deviceId: input.deviceId }
      );
      return results[0]?.[0] || null;
    }),

  save: publicProcedure
    .input(
      z.object({
        deviceId: z.string(),
        selectedModel: z.string().optional(),
        aiModel: z.enum(['gemma', 'sonnet']).optional(),
        apiLanguage: z.enum(['english', 'spanish']).optional(),
        databricksConfig: z
          .object({
            endpoint: z.string(),
            token: z.string(),
          })
          .optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      const { deviceId, ...settings } = input;
      
      await db.query(
        `UPDATE settings:${deviceId} CONTENT $settings;`,
        { settings }
      );
      
      return { success: true };
    }),
});
