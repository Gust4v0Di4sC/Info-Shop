import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express, { NextFunction, Request, Response } from 'express';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { app } from './api-app';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');
const angularApp = new AngularNodeAppEngine({
  allowedHosts: angularAllowedHosts(),
});

app.use((req, res, next) => {
  if (!isAssetRequest(req.path)) {
    res.setHeader('Cache-Control', 'no-store');
  }

  next();
});

app.use(
  express.static(browserDistFolder, {
    maxAge: 0,
    index: false,
    redirect: false,
    setHeaders(res, filePath) {
      if (
        filePath.endsWith('ngsw-worker.js') ||
        filePath.endsWith('ngsw.json') ||
        filePath.endsWith('safety-worker.js') ||
        filePath.endsWith('worker-basic.min.js')
      ) {
        res.setHeader('Cache-Control', 'no-cache');
      }
    },
  }),
);

app.use((req, res, next) => {
  if (!isAssetRequest(req.path)) {
    next();
    return;
  }

  res.status(404).type('text/plain').send('Asset not found');
});

app.use((req, res, next) => {
  void handleAngularRequest(req, res, next);
});

async function handleAngularRequest(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const response = await angularApp.handle(req);

    if (response) {
      await writeResponseToNodeResponse(response, res);
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
}

if (isMainModule(import.meta.url) || isBundledServerEntrypoint()) {
  const port = process.env['PORT'] || process.env['LOCAL_DEV_PORT'] || 4300;

  app.listen(port, (error?: Error) => {
    if (error) {
      console.error(`Failed to start local Node server on port ${port}:`, error.message);
      process.exitCode = 1;
      return;
    }

    console.log(`Local Node server listening on http://localhost:${port}`);
  });
}

export const reqHandler = createNodeRequestHandler(app);
export default reqHandler;

function angularAllowedHosts(): string[] {
  const hosts = new Set(['localhost', '127.0.0.1']);
  const envAllowedHosts = process.env['NG_ALLOWED_HOSTS'];

  if (envAllowedHosts) {
    envAllowedHosts
      .split(',')
      .map(host => host.trim())
      .filter(Boolean)
      .forEach(host => hosts.add(host));
  }

  return Array.from(hosts);
}

function isBundledServerEntrypoint(): boolean {
  return process.argv[1]?.replace(/\\/g, '/').endsWith('/server.mjs') === true;
}

function isAssetRequest(pathname: string): boolean {
  return /\.(?:avif|css|gif|ico|jpe?g|js|json|map|mjs|png|svg|webmanifest|webp|woff2?)$/i.test(pathname);
}
