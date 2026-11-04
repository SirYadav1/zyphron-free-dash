import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { existsSync } from 'fs';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const logger = new Logger('Bootstrap');

  app.setGlobalPrefix('api');
  app.disable('x-powered-by');

  // trust exactly one proxy hop (nginx/caddy in front). Without this, req.ip
  // is always the proxy IP — throttling and IP tracking break behind a
  // reverse proxy. Direct (no-proxy) connections are unaffected.
  app.set('trust proxy', 1);

  // 50mb was asking for trouble, 10mb is enough
  app.use(json({ limit: '5mb' }));
  app.use(urlencoded({ limit: '10mb', extended: true }));

  const frontendUrls = process.env.FRONTEND_URL || 'http://localhost:5173';
  const allowedOrigins = frontendUrls.split(',').map(url => url.trim());
  const isProduction = process.env.NODE_ENV === 'production';

  app.enableCors({
    origin: (origin, callback) => {
      // allow requests with no origin (server-to-server, curl, mobile apps)
      if (!origin) return callback(null, true);
      // always check allowed list (even in development)
      if (allowedOrigins.includes('*')) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // in development, also allow localhost variations
      if (!isProduction && origin.match(/^https?:\/\/localhost(:\d+)?$/)) {
        return callback(null, true);
      }
      logger.warn(`CORS blocked: ${origin}`);
      callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
  });

  // security headers
  app.use((req: any, res: any, next: any) => {
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    // vue + vite don't need unsafe-eval
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;");
    next();
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 3000;

  // serve static frontend in production
  if (isProduction) {
    const clientDist = join(__dirname, '..', 'client');
    app.useStaticAssets(clientDist);

    app.use((req: any, res: any, next: any) => {
      if (req.path.startsWith('/api')) {
        return next();
      }
      const filePath = join(clientDist, 'index.html');
      if (existsSync(filePath) && req.method === 'GET') {
        res.sendFile(filePath);
      } else {
        next();
      }
    });
    logger.log(`Serving frontend from ${clientDist}`);
  }

  await app.listen(port);
  logger.log(`Backend running on http://localhost:${port}`);
  if (isProduction) {
    logger.log(`Frontend served at http://localhost:${port}`);
  }
}

bootstrap();
