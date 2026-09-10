import 'dotenv/config';
import postgres from '@prisma/orm-postgres/runtime';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const contractJson = require('./prisma/contract.json');

export const db = postgres({
  contractJson,
  url: process.env.DATABASE_URL,
});
