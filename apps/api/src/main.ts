import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  app.setGlobalPrefix('api/v1');
  app.enableCors({
    origin: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',').map((x) => x.trim()),
    credentials: true,
  });
  const port = Number(process.env.API_PORT || 4000);
  await app.listen(port, '0.0.0.0');
  console.info('Social API listening on port ' + port);
}

bootstrap().catch((error: unknown) => {
  console.error('Failed to start Social API', error);
  process.exitCode = 1;
});
