import type {
  Browser,
  BrowserContext,
  BrowserContextOptions,
} from '@playwright/test';
import { access, mkdir } from 'node:fs/promises';
import { constants } from 'node:fs';
import { dirname, resolve } from 'node:path';

const DEFAULT_STATE_DIRECTORY = 'playwright/.auth';
const SAFE_NAME = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;

export function authStatePath(
  projectName: string,
  directory = DEFAULT_STATE_DIRECTORY,
): string {
  if (!SAFE_NAME.test(projectName) || projectName === '.' || projectName === '..') {
    throw new Error(`Invalid project name for an auth state file: "${projectName}".`);
  }

  return resolve(directory, `${projectName}.json`);
}

export async function saveAuthState(
  context: BrowserContext,
  filePath: string,
): Promise<string> {
  const absolutePath = resolve(filePath);
  await mkdir(dirname(absolutePath), { recursive: true });
  await context.storageState({ path: absolutePath });
  return absolutePath;
}

export async function createAuthenticatedContext(
  browser: Browser,
  projectName: string,
  options: BrowserContextOptions = {},
): Promise<BrowserContext> {
  const statePath = authStatePath(projectName);
  try {
    await access(statePath, constants.R_OK);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(
        `No saved auth state exists at "${statePath}". Run the authentication setup before using it.`,
        { cause: error },
      );
    }
    throw error;
  }

  return browser.newContext({
    ...options,
    storageState: statePath,
  });
}
