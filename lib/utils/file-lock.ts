/**
 * File Lock Mechanism
 *
 * Prevents concurrent writes to the same file by serializing operations.
 * Uses an in-memory Map to track locks per file.
 */

class FileLock {
  private locks = new Map<string, Promise<void>>();

  /**
   * Acquires a lock for a file and executes the operation
   * @param filename - The file to lock
   * @param operation - The async operation to execute
   * @returns The result of the operation
   */
  async acquire<T>(filename: string, operation: () => Promise<T>): Promise<T> {
    // Wait for existing lock to release
    while (this.locks.has(filename)) {
      await this.locks.get(filename);
    }

    // Create new lock
    let resolve: () => void;
    const lock = new Promise<void>((res) => {
      resolve = res;
    });
    this.locks.set(filename, lock);

    try {
      // Execute the operation
      return await operation();
    } finally {
      // Release the lock
      this.locks.delete(filename);
      resolve!();
    }
  }
}

// Export singleton instance
export const fileLock = new FileLock();
