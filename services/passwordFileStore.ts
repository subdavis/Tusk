import type { Settings } from './settings';
import type { FileManager } from './types';

/**
 * Provides a container for various storage mechanisms (aka FileManagers) that can be
 * injected, so that the rest of the code can be independent of specifics.
 */
export class PasswordFileStoreRegistry {
  private fileManagers: FileManager[];

  constructor(...fileManagers: FileManager[]) {
    this.fileManagers = fileManagers;
  }

  listFileManagers(requiredFeature?: string): FileManager[] {
    if (!requiredFeature) return this.fileManagers;
    return this.fileManagers.filter(
      (fileManager) => fileManager.supportedFeatures.indexOf(requiredFeature) > -1
    );
  }

  async getChosenDatabaseFile(settings: Settings): Promise<ArrayBuffer> {
    const choice = await settings.getCurrentDatabaseChoice();
    if (choice === null) throw new Error('No database has been chosen');
    const matches = this.fileManagers.filter(
      (fileManager) => fileManager.key == choice.providerKey
    );
    if (matches.length !== 1)
      throw new Error('Unable to find file manager for key ' + choice.providerKey);
    return matches[0].getChosenDatabaseFile(choice.passwordFile);
  }
}
