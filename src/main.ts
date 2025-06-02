import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as csurf from 'csurf';
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
import { Logger } from '@nestjs/common';
async function bootstrap() {
  // creating app instance...
  const app = await NestFactory.create(AppModule.register(), { 
    bufferLogs: true
  });
  app.useLogger(new Logger());

  // using custom throttler guard, to avoid DDOS attacks on /api and /public routes...
  const throttlerGuard = app.get(CustomThrottlerGuard);
  app.use(async function (req, res, next) {
   // console.log("Req",req)
    //console.log("res",res)
    let executionContext = new ExecutionContextHost(
      [req, res], app.get(AppService), app.get(AppService)
    );

    if(req.originalUrl.includes('/api') || req.originalUrl.includes('/public')) {
      try {
        await throttlerGuard.handleRequest(
          executionContext, 
          modules().modules.ThrottlerModule.config.limit,
          modules().modules.ThrottlerModule.config.ttl
        );
        next();
      } catch(error) {
        res.status(429).json({
          statusCode: 429,
          message: 'Too Many Requests',
        });
      }
    } else {
      next();
    }
 });

  // enabling body parser...
  app.use(express.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  // enabling cors...
  app.enableCors({credentials: true, origin: true, methods: 'GET,HEAD,PUT,PATCH,POST,DELETE'});
  // making use of CSRF Protection...
  app.use(cookieParser());

 
  // making use of Helmet...
  app.use(helmet({
    crossOriginResourcePolicy: false
  }));

  // Starts listening for shutdown hooks
  app.enableShutdownHooks();

  // enabling compression server side...
  app.use(compression());

  const config = new DocumentBuilder()
  .setTitle('VeriFay - Restful API')
  .setDescription(`A comprehensive set of tools to communicate with the Verifai Smart Node.`)
  .setVersion('1.0')
  .addBearerAuth({
    type: 'http',
    name: 'Authorization',
    scheme: 'Bearer',
    bearerFormat: 'Api Key',
    in: 'Header',
    description: `The API Key is used to authenticate requests to the Verifai Smart Node.`,
  }, 'Bearer')
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
if(modules().modules.ClusterModule.enabled) {
  ClusterService.clusterize(
    modules().modules.ClusterModule.workers, 
    bootstrap
  );
} 
// or simply bootstrapping the app...
else {
  bootstrap();
}