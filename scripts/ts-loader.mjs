/**
 * Custom TypeScript loader for Node.js using the new register() API
 * This replaces the deprecated --loader flag
 */
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

register('ts-node/esm', pathToFileURL('./'));
