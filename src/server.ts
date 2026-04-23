import express, { type RequestHandler } from 'express';
import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().url(),
});

function getEnv() {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error('Invalid env:', parsed.error.flatten().fieldErrors);
    process.exit(78);
  }

  return parsed.data;
}

export const app = express();
app.use(express.json());

export const healthHandler: RequestHandler = (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
};

const sayHi: RequestHandler = (_req, res) => {
  res.send('Hello world');
};

app.get('/home', sayHi);

app.get('/health', healthHandler);

export function startServer() {
  const env = getEnv();
  const server = app.listen(env.PORT, () => {
    console.log(`api listening on ${env.PORT} (${env.NODE_ENV})`);
  });

  const shutdown = (signal: string) => {
    console.log(`${signal} received, closing`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  return server;
}

if (require.main === module) {
  startServer();
}
