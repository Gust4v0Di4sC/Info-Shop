import serverless from 'serverless-http';
import { app } from '../../src/api-app';

export const handler = serverless(app);
