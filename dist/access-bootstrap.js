import { protectApp } from 'https://daniel22-dev.github.io/AI-Studio-GHRAB/access/app-guard.js';

const APP_ID = 'essay-evaluator';
const allowed = await protectApp(APP_ID, {
  studioUrl: 'https://daniel22-dev.github.io/AI-Studio-GHRAB/'
});

if (allowed) await import('./app.js');
