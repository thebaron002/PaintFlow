import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { config } from 'dotenv';
import { resolve } from 'path';

// Explicitly load .env files for Windows compatibility
config({ path: resolve(process.cwd(), '.env') });
config({ path: resolve(process.cwd(), '.env.local') });

console.log('🔑 GEMINI_API_KEY loaded:', !!process.env.GEMINI_API_KEY);
console.log('🔑 GOOGLE_API_KEY loaded:', !!process.env.GOOGLE_API_KEY);

export const ai = genkit({
<<<<<<< HEAD
  plugins: [googleAI()],
  model: 'googleai/gemini-1.5-flash',
=======
  plugins: [
    googleAI({
      projectId: process.env.GCLOUD_PROJECT,
      apiVersion: 'v1beta', // Recommended for gemini-2.5-flash
    }),
  ],
>>>>>>> 9cc9be6f2b91575e02281f201a1f62172f7104d1
});
