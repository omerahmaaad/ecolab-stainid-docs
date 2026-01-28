import { trpcServer } from "@hono/trpc-server";
import { Hono } from "hono";
import { cors } from "hono/cors";

import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";

const app = new Hono();

// Handle OPTIONS preflight requests first
app.options('*', (c) => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, trpc-batch-mode',
      'Access-Control-Max-Age': '600',
    },
  });
});

app.use("*", cors({
  origin: '*',
  allowHeaders: ['Content-Type', 'Authorization', 'trpc-batch-mode', 'x-trpc-source'],
  allowMethods: ['POST', 'GET', 'OPTIONS', 'PUT', 'DELETE', 'PATCH'],
  exposeHeaders: ['Content-Length', 'Content-Type'],
  maxAge: 600,
  credentials: false,
}));

// Health check endpoint - always responds
app.get("/", (c) => {
  return c.json({ status: "ok", message: "Ecolab Stain Analysis API is running", timestamp: Date.now() });
});

app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: Date.now() });
});

// Request logging middleware
app.use('*', async (c, next) => {
  const start = Date.now();
  const path = new URL(c.req.url).pathname;
  console.log(`[Backend] ${c.req.method} ${path}`);
  console.log('[Backend] Headers:', JSON.stringify(Object.fromEntries([...c.req.raw.headers.entries()])));
  await next();
  console.log(`[Backend] ${c.req.method} ${path} - ${c.res.status} (${Date.now() - start}ms)`);
});

// Error handling middleware
app.onError((err, c) => {
  console.error('[Backend] Error:', err);
  return c.json({ error: err.message || 'Internal server error' }, 500);
});

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext,
  }),
);

export default app;