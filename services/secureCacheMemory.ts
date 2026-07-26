import browser, { type Runtime } from 'webextension-polyfill';
import type { ProtectedMemory } from './protectedMemory';

/**
 * Storage in background page memory.
 */
export class SecureCacheMemory {
  private awaiting: Array<(value: unknown) => void> = [];
  private resolveReady!: (port: Runtime.Port) => void;
  private readyPromise: Promise<Runtime.Port> = new Promise((resolve) => {
    this.resolveReady = resolve;
  });

  constructor(private protectedMemory: ProtectedMemory) {}

  /**
   * Opens a port to the background page for this tab. Called once from
   * useAppServices right after construction; every other method awaits the
   * same readyPromise this resolves, matching the original lazy-init behavior.
   */
  async connect(): Promise<void> {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    if (tabs.length === 0) return;
    const port = browser.runtime.connect({ name: 'tab' + tabs[0].id });
    this.resolveReady(port);

    port.onMessage.addListener((serializedSavedState) => {
      // called from the background when we get a response, i.e. some saved state.
      const savedState = this.protectedMemory.hydrate(serializedSavedState);
      const notifier = this.awaiting.shift();
      notifier?.(savedState); // notify others
    });
    port.onDisconnect.addListener(() => {
      // Nothing to do here yet...
    });
  }

  async ready(): Promise<boolean> {
    await this.readyPromise;
    return true;
  }

  /** wake up the background page and get a pipe to send/receive messages */
  get<T = unknown>(key: string): Promise<T> {
    this.readyPromise.then((port) => port.postMessage({ action: 'get', key }));
    return new Promise((resolve) => {
      this.awaiting.push(resolve as (value: unknown) => void);
    });
  }

  async clear(key: string): Promise<void> {
    console.log('clearing key: ' + key);
    const port = await this.readyPromise;
    port.postMessage({ action: 'clear', key });
  }

  async save(key: string, value: unknown): Promise<void> {
    const port = await this.readyPromise;
    const serializedValue = this.protectedMemory.serialize(value);
    port.postMessage({ action: 'save', key, value: serializedValue });
  }

  /** Causes forgetStuff to run in the event page. */
  async forgetStuff(): Promise<void> {
    const port = await this.readyPromise;
    port.postMessage({ action: 'forgetStuff' });
  }
}
