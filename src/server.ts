import { AngularAppEngine, createRequestHandler } from '@angular/ssr';
import { getContext } from '@netlify/angular-runtime/app-engine.js';

const angularAppEngine = new AngularAppEngine();

export async function netlifyAppEngineHandler(request: Request): Promise<Response> {
  const url = new URL(request.url);

  if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
    const functionUrl = new URL(
      `/.netlify/functions/api${url.pathname.slice('/api'.length)}${url.search}`,
      url,
    );

    return fetch(new Request(functionUrl, request));
  }

  const result = await angularAppEngine.handle(request, getContext());

  return result || new Response('Not found', { status: 404 });
}

/**
 * Request handler used by the Angular CLI during development and builds.
 */
export const reqHandler = createRequestHandler(netlifyAppEngineHandler);
