import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';
import * as compression from 'compression';
import { CustomThrottlerGuard } from '@hsuite/throttler';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { AppService } from './app.service';
import { AppModule } from './app.module';
import { ClusterService } from '@hsuite/cluster';
import modules from '../config/settings/modules';
import * as express from 'express';
import { Logger, ForbiddenException } from '@nestjs/common'; // Added ForbiddenException for consistency if canActivate throws
import * as passport from 'passport';

async function bootstrap() {
  // creating app instance...
  const app = await NestFactory.create(AppModule.register(), {
    bufferLogs: true,
  });
  app.useLogger(new Logger());
  app.use(cookieParser());

  // Initialize Passport
  app.use(passport.initialize());

  // using custom throttler guard, to avoid DDOS attacks on /api and /public routes...
  const throttlerGuard = app.get(CustomThrottlerGuard);
  app.use(async function (req, res, next) {
    let executionContext = new ExecutionContextHost(
      [req, res],
      app.get(AppService) as any, 
      app.get(AppService) as any, 
    );

    if (
      req.originalUrl.includes('/api') ||
      req.originalUrl.includes('/public')
    ) {
      try {
        const canProceed = await throttlerGuard.canActivate(executionContext);
        if (canProceed) {
          next();
        } else {
          res.status(429).json({
            statusCode: 429,
            message: 'Too Many Requests',
          });
        }
      } catch (error) {
        // If canActivate throws (e.g., ThrottlerException), handle it.
        // This assumes CustomThrottlerGuard might throw an error that isn't automatically a 429.
        // Or, if it throws a specific NestJS exception, it might be handled by global exception filters.
        if (error instanceof ForbiddenException || (error && error.status === 403)) { // Example check
             res.status(403).json({ // Or 429 if it's specifically a throttle error
                statusCode: error.status,
                message: error.message || 'Forbidden',
             });
        } else {
             res.status(429).json({
                statusCode: 429,
                message: error.message || 'Too Many Requests',
             });
        }
      }
    } else {
      next();
    }
  });

  // enabling body parser...
  app.use(express.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  // enabling cors...
  app.enableCors({
    credentials: true,
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  });

  // making use of Helmet...
  app.use(
    helmet({
      crossOriginResourcePolicy: false,
      contentSecurityPolicy: {
        directives: {
          scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.socket.io"],
        },
      },
    }),
  );

  // Starts listening for shutdown hooks
  app.enableShutdownHooks();

  // enabling compression server side...
  app.use(compression());

  // serve static files from public directory
  app.use(express.static('public'));

  const config = new DocumentBuilder()
    .setTitle('VeriFai - Restful API')
    .setDescription(
      `A comprehensive set of tools to communicate with the Verifai Smart Node.`,
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        name: 'Authorization',
        scheme: 'Bearer',
        bearerFormat: 'Api Key',
        in: 'Header',
        description: `The API Key is used to authenticate requests to the Verifai Smart Node.`,
      },
      'Bearer',
    )
    .addSecurityRequirements('Bearer')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  
  // start listening on the port...
  await app.listen(process.env.PORT || 3000);

  // returning app instance...
  return app;
}

// clusterizing the app...
if (modules().modules.ClusterModule.enabled) {
  ClusterService.clusterize(modules().modules.ClusterModule.workers, bootstrap);
}
// or simply bootstrapping the app...
else {
  bootstrap();
}
