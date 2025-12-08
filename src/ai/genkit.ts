
import {genkit} from 'genkit';
import {googleAI} from '@gen-ai/google-genai';

export const ai = genkit({
  plugins: [
    googleAI({
      projectId: process.env.GCLOUD_PROJECT,
      apiVersion: 'v1beta', // Recommended for gemini-2.5-flash
    }),
  ],
  model: 'vertexai/gemini-2.5-flash',
});
