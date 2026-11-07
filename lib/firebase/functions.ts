// Client wrapper for the Cloud Functions in /functions (region asia-southeast1).
import { getFunctions, httpsCallable } from 'firebase/functions';
import app from './config';

const functions = getFunctions(app, 'asia-southeast1');

/** Calls a callable function and returns its data. Errors carry the Malay message thrown on the server. */
export async function callFunction<Req, Res>(name: string, data?: Req): Promise<Res> {
  const result = await httpsCallable<Req, Res>(functions, name)(data as Req);
  return result.data;
}
