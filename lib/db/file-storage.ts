import fs from 'fs/promises';
import path from 'path';
import { fileLock } from '@/lib/utils/file-lock';

/**
 * JSON Data File Structure
 */
interface JsonDataFile<T> {
  version: number;
  lastUpdated: string;
  data: T[];
}

/**
 * File Storage Configuration
 */
const STORAGE_CONFIG = {
  baseDir: path.join(process.cwd(), 'data'),
  files: {
    questions: 'questions.json',
    banks: 'question-banks.json',
    submissions: 'submissions.json',
  },
};

/**
 * Ensures the data directory exists
 */
async function ensureDataDirectory(): Promise<void> {
  try {
    await fs.access(STORAGE_CONFIG.baseDir);
  } catch {
    await fs.mkdir(STORAGE_CONFIG.baseDir, { recursive: true });
  }
}

/**
 * Initializes an empty JSON file with the standard structure
 */
async function initializeFile<T>(filename: string): Promise<void> {
  const filepath = path.join(STORAGE_CONFIG.baseDir, filename);

  const emptyFile: JsonDataFile<T> = {
    version: 1,
    lastUpdated: new Date().toISOString(),
    data: [],
  };

  await fs.writeFile(filepath, JSON.stringify(emptyFile, null, 2), 'utf-8');
}

/**
 * Reads a JSON file and returns the parsed data
 * If the file doesn't exist, creates it and returns empty data
 */
export async function readJsonFile<T>(filename: string): Promise<JsonDataFile<T>> {
  const filepath = path.join(STORAGE_CONFIG.baseDir, filename);

  try {
    await ensureDataDirectory();

    // Try to read the file
    const content = await fs.readFile(filepath, 'utf-8');
    return JSON.parse(content) as JsonDataFile<T>;
  } catch (error) {
    // If file doesn't exist, create it
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      await initializeFile<T>(filename);
      return {
        version: 1,
        lastUpdated: new Date().toISOString(),
        data: [],
      };
    }

    throw error;
  }
}

/**
 * Writes data to a JSON file using atomic write
 * (writes to temp file first, then renames to prevent corruption)
 */
export async function writeJsonFile<T>(filename: string, data: T[]): Promise<void> {
  await ensureDataDirectory();

  const filepath = path.join(STORAGE_CONFIG.baseDir, filename);
  const tempPath = `${filepath}.tmp`;

  const fileContent: JsonDataFile<T> = {
    version: 1,
    lastUpdated: new Date().toISOString(),
    data,
  };

  // Use file lock to prevent concurrent writes
  await fileLock.acquire(filename, async () => {
    // 1. Write to temporary file
    await fs.writeFile(tempPath, JSON.stringify(fileContent, null, 2), 'utf-8');

    // 2. Atomic rename (overwrites target file)
    await fs.rename(tempPath, filepath);
  });
}

/**
 * File storage configuration (exported for use in API routes)
 */
export const FILES = STORAGE_CONFIG.files;
