import { createTRPCRouter } from "./create-context";
import { stainAnalysisRouter } from "./routes/stain-analysis";
import { feedbackRouter } from "./routes/feedback";
import { settingsRouter } from "./routes/settings";
import { databricksUCRouter } from "./routes/databricks-uc";
import { mulesoftRouter } from "./routes/mulesoft";

export const appRouter = createTRPCRouter({
  stainAnalysis: stainAnalysisRouter,
  feedback: feedbackRouter,
  settings: settingsRouter,
  databricksUC: databricksUCRouter,
  mulesoft: mulesoftRouter,
});

export type AppRouter = typeof appRouter;