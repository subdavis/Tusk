/*
  This page runs as an Background page, not an event

  Be careful using settings.
  Settings can call secureCacheMemory, which in turn can open new ports to this script.
*/

import browser, { type Permissions, type Runtime } from 'webextension-polyfill';
import { ProtectedMemory } from '$services/protectedMemory';
import { Settings } from '$services/settings';
import { Notifications } from '$services/notifications';

interface PortMessage {
  action: 'clear' | 'save' | 'get' | 'forgetStuff';
  key?: string;
  value?: unknown;
}

interface AutofillMessage {
  m: 'autofill';
  tabId: number;
  u: string;
  p: string;
  o: string;
}

type RuntimeMessage =
  | { m: 'showMessage'; text: string; expire?: number }
  | { m: 'requestPermission'; perms: Permissions.Permissions; then?: RuntimeMessage }
  | AutofillMessage;

function Background(
  protectedMemory: ProtectedMemory,
  settings: Settings,
  notifications: Notifications
) {
  console.log('Background worker registered.');
  browser.runtime.onInstalled.addListener(() => settings.upgrade());
  browser.runtime.onStartup.addListener(forgetStuff);

  // keep saved state for the popup for as long as we are alive (not long):
  browser.runtime.onConnect.addListener((port: Runtime.Port) => {
    // communicate state on this pipe.  each named port gets its own state.
    port.onMessage.addListener((raw) => {
      const msg = raw as PortMessage;
      if (!msg) return;
      switch (msg.action) {
        case 'clear':
          protectedMemory.clearData(msg.key);
          break;
        case 'save':
          protectedMemory.setData(msg.key as string, msg.value);
          break;
        case 'get':
          protectedMemory.getData(msg.key as string).then((value) => {
            port.postMessage(value);
          });
          break;
        case 'forgetStuff':
          forgetStuff();
          break;
        default:
          throw new Error('unrecognized action ' + (msg as PortMessage).action);
      }
    });

    port.onDisconnect.addListener(() => {
      // uncomment below to forget the state when the popup closes
      // protectedMemory.clearData();
    });
  });

  function handleMessage(message: RuntimeMessage) {
    if (!message || !message.m) return; // message format unrecognized

    if (message.m == 'showMessage') {
      const expire = typeof message.expire !== 'undefined' ? message.expire * 1000 : 60000;
      browser.notifications
        .create({
          type: 'basic',
          iconUrl: '/assets/48x48.png',
          title: 'Tusk',
          message: message.text,
        })
        .then((notificationId) => {
          setTimeout(() => browser.notifications.clear(notificationId), expire);
        });
    }

    if (message.m == 'requestPermission') {
      // better to do the request here on the background, because on some platforms
      // the popup may close prematurely when requesting access
      browser.permissions
        .contains(message.perms)
        .catch(() => false)
        .then((alreadyGranted) => {
          if (alreadyGranted && message.then) {
            handleMessage(message.then);
          } else {
            browser.permissions.request(message.perms).then((granted) => {
              if (granted && message.then) {
                handleMessage(message.then);
              }
            });
          }
        });
    }

    if (message.m == 'autofill') {
      alreadyInjected(message.tabId).then((injectedAlready) => {
        if (injectedAlready === true) {
          browser.tabs.sendMessage(message.tabId, {
            m: 'fillPassword',
            u: message.u,
            p: message.p,
            o: message.o,
          });
          return;
        }
        browser.scripting
          .executeScript({
            target: { tabId: message.tabId, allFrames: true },
            files: ['/dist/contentScripts/index.global.js'],
          })
          .then(() => {
            // script injected
            console.log('Autofill script injected.');
            browser.tabs.sendMessage(message.tabId, {
              m: 'fillPassword',
              u: message.u,
              p: message.p,
              o: message.o,
            });
          });
      });
    }
  }

  // function to determine if the content script is already injected, so we don't do it twice
  async function alreadyInjected(tabId: number): Promise<boolean> {
    try {
      const response = await browser.tabs.sendMessage(tabId, { m: 'ping' });
      return !!response;
    } catch {
      return false;
    }
  }

  // listen for "autofill" message:
  browser.runtime.onMessage.addListener((message) => handleMessage(message as RuntimeMessage));

  browser.alarms.create('forgetStuff', {
    delayInMinutes: 1,
    periodInMinutes: 2,
  });

  browser.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name == 'forgetStuff') {
      forgetStuff();
      return;
    }
  });

  function forgetStuff() {
    console.log('Alarm Handler -- Check if we should clear Cache --', new Date());
    protectedMemory.clearData('secureCache.entries'); // ALWAYS clear entries.
    settings.getAllForgetTimes().then((allTimes) => {
      const now = Date.now();
      const forgottenKeys: string[] = [];
      for (const key in allTimes) {
        // If the time has passed but is still positive...
        if (allTimes[key] < now && allTimes[key] > 0) {
          forgottenKeys.push(key);
          switch (key) {
            case 'clearClipboard':
              clearClipboard();
              notifications.push({
                text: 'Clipboard cleared',
                type: 'expiration',
                expire: 2,
              });
              break;
            default:
              if (key.indexOf('password') >= 0) {
                forgetPassword().then(() => {
                  notifications.push({
                    text: 'Remember password expired',
                    type: 'expiration',
                  });
                });
              } else {
                console.error("I don't know what to do with key", key);
              }
          }
        }
      }

      // remove stuff
      settings.clearForgetTimes(forgottenKeys);
    });
  }

  function clearClipboard() {
    // No longer have access to document in this context.
    // https://github.com/GoogleChrome/chrome-extensions-samples/tree/main/functional-samples/cookbook.offscreen-clipboard-write
    console.info('Clearing clipboard');
  }

  async function forgetPassword() {
    const info = await settings.getCurrentDatabaseChoice();
    if (info === null) return;
    const key = info.passwordFile.title + '__' + info.providerKey + '.password';
    return protectedMemory.clearData(key);
  }
}

const settings = new Settings();
const notifications = new Notifications(settings);
const protectedMemory = new ProtectedMemory();

Background(protectedMemory, settings, notifications);
