import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadSchema(filename: string): string {
  return readFileSync(join(__dirname, filename), 'utf8');
}

// Base Query + Mutation types — extended by each domain schema
const baseTypeDefs = `
  type Query
  type Mutation
`;

export const typeDefs = [
  baseTypeDefs,
  loadSchema('common.graphql'),
  loadSchema('auth.graphql'),
  loadSchema('account.graphql'),
  loadSchema('transaction.graphql'),
  loadSchema('loan.graphql'),
  loadSchema('dashboard.graphql'),
];
