<script setup lang="ts">
import { inject, onMounted, ref, watch } from 'vue';
import JSONFormatter from 'json-formatter-js';
import browser from 'webextension-polyfill';
import { isFirefox } from '@/lib/utils';
import { AppServicesKey } from '@/composables/useAppServices';

const { settings } = inject(AppServicesKey)!;

const expireTime = ref(2);
const hotkeyNavEnabled = ref(false);
const allOriginPermission = ref(false);
const allOriginPerms = { origins: ['https://*/*', 'http://*/*'] };
const strictMatchEnabled = ref(false);
const notificationsEnabled = ref(['expiration']);

interface JsonStateEntry {
  k: string;
  f: () => Promise<unknown>;
  delete?: { f: (arg?: string) => Promise<unknown> | undefined; arg?: string; op: string };
}

const destroyLocalStorage = (arg?: string) => settings.destroyLocalStorage(arg!);

const jsonState: JsonStateEntry[] = [
  {
    k: 'databaseUsages',
    f: () => settings.getSetDatabaseUsages(),
    delete: { f: destroyLocalStorage, arg: 'databaseUsages', op: 'Delete' },
  },
  {
    k: 'webdavServerList',
    f: () => settings.getSetWebdavServerList(),
    delete: { f: destroyLocalStorage, arg: 'webdavServerList', op: 'Delete' },
  },
  {
    k: 'webdavDirectoryMap',
    f: () => settings.getSetWebdavDirectoryMap(),
    delete: { f: destroyLocalStorage, arg: 'webdavDirectoryMap', op: 'Delete' },
  },
  {
    k: 'selectedDatabase',
    f: () => settings.getCurrentDatabaseChoice(),
    delete: { f: destroyLocalStorage, arg: 'selectedDatabase', op: 'Delete' },
  },
  {
    k: 'keyFiles',
    f: () => settings.getKeyFiles(),
    delete: { f: () => settings.deleteAllKeyFiles(), op: 'Delete' },
  },
  {
    k: 'forgetTimes',
    f: () => settings.getAllForgetTimes(),
  },
  {
    k: 'sharedUrlList',
    f: () => settings.getSharedUrlList(),
    delete: { f: destroyLocalStorage, arg: 'sharedUrlList', op: 'Delete' },
  },
];

watch(expireTime, (newval) => {
  settings.getSetClipboardExpireInterval(parseInt(String(newval)));
});
watch(hotkeyNavEnabled, (newval) => {
  settings.getSetHotkeyNavEnabled(newval);
});
watch(strictMatchEnabled, (newval) => {
  settings.getSetStrictModeEnabled(newval);
});
watch(notificationsEnabled, (newval) => {
  settings.getSetNotificationsEnabled(newval);
});

function toggleOriginPermissions() {
  // Negated because this function will call before the vue model update.
  if (!allOriginPermission.value) {
    browser.permissions.request(allOriginPerms);
  } else {
    browser.permissions.remove(allOriginPerms);
  }
  settings.getSetOriginPermissionEnabled(!allOriginPermission.value);
  allOriginPermission.value = !allOriginPermission.value;
}

function init() {
  settings.getSetClipboardExpireInterval().then((val) => {
    expireTime.value = val;
  });
  settings.getSetHotkeyNavEnabled().then((val) => {
    hotkeyNavEnabled.value = val;
  });
  settings.getSetNotificationsEnabled().then((val) => {
    notificationsEnabled.value = val;
  });
  settings.getSetStrictModeEnabled().then((val) => {
    strictMatchEnabled.value = val;
  });
  if (!isFirefox()) {
    browser.permissions.contains(allOriginPerms).then((granted) => {
      allOriginPermission.value = !!granted;
    });
  }
  jsonState.forEach((blob) => {
    blob.f().then((result) => {
      const place = document.getElementById(blob.k);
      if (result && Object.keys(result).length) {
        const formatter = new JSONFormatter(result);
        if (place) {
          while (place.firstChild) place.removeChild(place.firstChild);
          place.appendChild(formatter.render());
        }
      } else {
        place?.parentElement?.parentElement?.remove();
      }
    });
  });
}

onMounted(init);
</script>

<template>
  <div>
    <div class="box-bar roomy">
      <h4>Clipboard Expiration Time</h4>
      <p>
        When you copy a value to the clipboard, Tusk will set a timeout to automatically clear it
        again. You can choose how long this timeout will last.
      </p>
    </div>
    <div class="box-bar roomy lighter">
      <select v-model="expireTime" style="display: inline-block">
        <option value="1">1 minute</option>
        <option value="2">2 minutes</option>
        <option value="3">3 minutes</option>
        <option value="5">5 minutes</option>
        <option value="8">8 minutes</option>
      </select>
    </div>

    <div class="box-bar roomy">
      <h4>Enable Hotkey Navigation</h4>
      <p>
        If enabled, you will be able to use [TAB] and [ENTER] to navigate and autofill your
        passwords when the tusk UI is open. By default, [CTRL]+[SHIFT]+[SPACE] will open the Tusk
        popup
      </p>
    </div>
    <div class="box-bar roomy lighter">
      <div>
        <div class="switch">
          <label>
            <input v-model="hotkeyNavEnabled" type="checkbox" />
            <span class="lever" />
            Hotkey Navigation
          </label>
        </div>
      </div>
    </div>

    <div v-if="!isFirefox()" class="box-bar roomy">
      <h4>Grant Permission on All Websites</h4>
      <p>
        <strong style="color: #d9534f">Only proceed if you know what you're doing.</strong> If
        enabled, the extension prompts once for permission to access and change data on all websites
        which disables the permissions popup on each new website. This has
        <a href="https://github.com/subdavis/Tusk/issues/168">serious security implications</a>.
        Only applies to Chrome. Because of a Chrome bug, it is currently impossible to revoke this
        permission again after it is enabled. If you turn this ON, Tusk must be reinstalled to
        reset.
      </p>
    </div>
    <div v-if="!isFirefox()" class="box-bar roomy lighter">
      <div>
        <div class="switch">
          <label @click="toggleOriginPermissions">
            <input v-model="allOriginPermission" type="checkbox" />
            <span class="lever" @click.prevent />
            Grant All Permissions
          </label>
        </div>
      </div>
    </div>

    <div class="box-bar roomy">
      <h4>Notification</h4>
      <p>Choose which type of notification do you want to receive from Tusk.</p>
    </div>
    <div class="box-bar roomy lighter">
      <div>
        <div class="switch">
          <label>
            <input v-model="notificationsEnabled" type="checkbox" value="expiration" />
            <span class="lever" />
            Password expiration
          </label>
        </div>
        <div class="switch">
          <label>
            <input v-model="notificationsEnabled" type="checkbox" value="clipboard" />
            <span class="lever" />
            Clipboard events
          </label>
        </div>
      </div>
    </div>

    <div class="box-bar roomy">
      <h4>Enable Strict Matching</h4>
      <div>
        If enabled, only entries whose origins match exactly will be suggested for input. Titles and
        other tab information will not be considered in matching. For example,
        <pre>www.google.com</pre>
        will not match
        <pre>https://google.com</pre>
      </div>
    </div>
    <div class="box-bar roomy lighter">
      <div>
        <div class="switch">
          <label>
            <input v-model="strictMatchEnabled" type="checkbox" />
            <span class="lever" />
            Strict Matching
          </label>
        </div>
      </div>
    </div>

    <div class="box-bar roomy">
      <h4>Stored Data</h4>
      <p>
        The following objects represent the current data cached in local storage. This data is only
        available to Tusk, and is never sent over any network connection.
      </p>
    </div>
    <div v-for="blob in jsonState" :key="blob.k" class="box-bar lighter roomy">
      <p>{{ blob.k }}</p>
      <div class="between">
        <div :id="blob.k" class="json" />
        <a
          v-if="blob.delete !== undefined"
          class="waves-effect waves-light btn"
          @click="
            blob.delete.f(blob.delete.arg);
            init();
          "
          >{{ blob.delete.op }}</a
        >
      </div>
    </div>
  </div>
</template>

<style lang="scss">
@import '../styles/settings.scss';

.json {
  font-size: 12px;
}

h4 {
  font-size: 24px;
}
</style>
