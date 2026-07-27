import type { InjectionKey } from 'vue';
import { DropboxFileManager } from '$services/dropboxFileManager';
import { GoogleDrivePasswordFileManager } from '$services/googleDrivePasswordFileManager';
import { KeepassHeader } from '$services/keepassHeader';
import { KeepassReference } from '$services/keepassReference';
import { KeepassService } from '$services/keepassService';
import { KeyFileParser } from '$services/keyFileParser';
import { Links } from '$services/links';
import { LocalChromePasswordFileManager } from '$services/localChromePasswordFileManager';
import { Notifications } from '$services/notifications';
import { OneDriveFileManager } from '$services/oneDriveFileManager';
import { PasswordFileStoreRegistry } from '$services/passwordFileStore';
import { PCloudFileManager } from '$services/pCloudFileManager';
import { ProtectedMemory } from '$services/protectedMemory';
import { SampleDatabaseFileManager } from '$services/sampleDatabaseFileManager';
import { SecureCacheMemory } from '$services/secureCacheMemory';
import { Settings } from '$services/settings';
import { SharedUrlFileManager } from '$services/sharedUrlFileManager';
import { UnlockedState } from '$services/unlockedState';
import { WebdavFileManager } from '$services/webdavFileManager';

/**
 * Builds the full singleton service graph once per app entry point (popup/options).
 * Both roots need slightly different subsets - Options never unlocks a database, so
 * it has no use for keepassService/unlockedState/notifications - but building the
 * full superset once here is what kills the duplicated construction that used to
 * live separately in Popup.vue and Options.vue.
 */
export function createAppServices() {
  const links = new Links();
  const protectedMemory = new ProtectedMemory();
  const secureCache = new SecureCacheMemory(protectedMemory);
  secureCache.connect(); // fire-and-forget, matches the original lazy/background init timing
  const settings = new Settings(secureCache);
  const keepassHeader = new KeepassHeader();
  const keepassReference = new KeepassReference();
  const notifications = new Notifications(settings);
  const keyFileParser = new KeyFileParser();

  // File Managers
  const localChromePasswordFileManager = LocalChromePasswordFileManager();
  const dropboxFileManager = DropboxFileManager(settings);
  const googleDrivePasswordFileManager = GoogleDrivePasswordFileManager(settings);
  const sharedUrlFileManager = SharedUrlFileManager();
  const oneDriveFileManager = OneDriveFileManager(settings);
  const pCloudFileManager = PCloudFileManager(settings);
  const sampleDatabaseFileManager = SampleDatabaseFileManager();
  const webdavFileManager = WebdavFileManager(settings);

  const passwordFileStoreRegistry = new PasswordFileStoreRegistry(
    localChromePasswordFileManager,
    dropboxFileManager,
    googleDrivePasswordFileManager,
    sharedUrlFileManager,
    sampleDatabaseFileManager,
    oneDriveFileManager,
    pCloudFileManager,
    webdavFileManager
  );
  const keepassService = new KeepassService(
    keepassHeader,
    settings,
    passwordFileStoreRegistry,
    keepassReference
  );
  const unlockedState = new UnlockedState(keepassReference, settings, notifications);

  return {
    links,
    protectedMemory,
    secureCache,
    settings,
    notifications,
    keyFileParser,
    keepassHeader,
    keepassReference,
    keepassService,
    unlockedState,
    passwordFileStoreRegistry,
    localChromePasswordFileManager,
    dropboxFileManager,
    googleDrivePasswordFileManager,
    sharedUrlFileManager,
    oneDriveFileManager,
    pCloudFileManager,
    sampleDatabaseFileManager,
    webdavFileManager,
  };
}

export type AppServices = ReturnType<typeof createAppServices>;

export const AppServicesKey: InjectionKey<AppServices> = Symbol('app-services');
