
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [
    googleAI({
      projectId: process.env.GCLOUD_PROJECT,
      apiVersion: 'v1beta', // Recommended for gemini-2.5-flash
    }),
  ],
  model: 'googleai/gemini-2.5-flash',
});
