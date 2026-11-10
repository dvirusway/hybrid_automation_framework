import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

export async function ensureDirectory(directory: string): Promise<string> {
  const absolutePath = resolve(directory);
  await mkdir(absolutePath, { recursive: true });
  return absolutePath;
}

export async function readTextFile(filePath: string): Promise<string> {
  return readFile(resolve(filePath), 'utf8');
}

export async function readJsonFile<T>(filePath: string): Promise<T> {
  const absolutePath = resolve(filePath);
  const text = await readFile(absolutePath, 'utf8');

  try {
    return JSON.parse(text) as T;
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new SyntaxError(`Could not parse JSON file "${absolutePath}": ${detail}`, {
      cause: error,
    });
  }
}

export async function writeTextFile(
  filePath: string,
  contents: string,
): Promise<string> {
  const absolutePath = resolve(filePath);
  await ensureDirectory(dirname(absolutePath));
  await writeFile(absolutePath, contents, 'utf8');
  return absolutePath;
}

export async function writeJsonFile(
  filePath: string,
  value: unknown,
  pretty = true,
): Promise<string> {
  let serialized: string;
  try {
    serialized = JSON.stringify(value, null, pretty ? 2 : undefined);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new TypeError(`Could not serialize JSON for "${filePath}": ${detail}`, {
      cause: error,
    });
  }
  if (serialized === undefined) {
    throw new TypeError(`Value for "${filePath}" cannot be represented as JSON.`);
  }

  return writeTextFile(filePath, `${serialized}\n`);
}

export async function writeJsonFileAtomically(
  filePath: string,
  value: unknown,
): Promise<string> {
  const absolutePath = resolve(filePath);
  await ensureDirectory(dirname(absolutePath));
  const temporaryPath = `${absolutePath}.${process.pid}.${Date.now()}.tmp`;

  try {
    await writeJsonFile(temporaryPath, value);
    await rename(temporaryPath, absolutePath);
  } catch (error) {
    throw new Error(`Could not write JSON file atomically to "${absolutePath}".`, {
      cause: error,
    });
  }

  return absolutePath;
}
