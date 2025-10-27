
'use client';

// This file is the single-entry point for all Firebase-related client-side utilities.
// It re-exports everything from the other files, providing a consistent API surface.

export * from './config';
export * from './provider';
export * from './client-provider';
export * from './clean-firebase';
export * from './clean-auth';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './errors';
export * from './error-emitter';
