import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// The google-services.json is expected to be in the backend root
const serviceAccountPath = path.join(__dirname, '../google-services.json');

let messaging: admin.messaging.Messaging;

try {
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  messaging = admin.messaging();
  console.log('Firebase Admin initialized successfully');
} catch (error) {
  console.error('Failed to initialize Firebase Admin:', error);
  // Fallback or throw error depending on requirements
  throw error;
}

export { messaging };
