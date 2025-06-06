<script>
import JSONFormatter from 'json-formatter-js'
import { isFirefox } from '@/lib/utils'
import { toRaw } from 'vue'

export default {
  props: {
    settings: Object,
    secureCacheMemory: Object
  },
  data() {
    return {
      busy: false,
      expireTime: 2,
      hotkeyNavEnabled: false,
      allOriginPermission: false,
      allOriginPerms: {
        origins: [
          "https://*/*",
          "http://*/*"
        ]
      },
      strictMatchEnabled: false,
      notificationsEnabled: ['expiration'],
      jsonState: [{
        k: 'databaseUsages',                      // key
        f: this.settings.getSetDatabaseUsages,    // getter
        delete: {
          f: this.settings.destroyLocalStorage, // remover
          arg: 'databaseUsages',                // remover args
          op: 'Delete'                          // remover button name
        }
      },
      {
        k: 'webdavServerList',
        f: this.settings.getSetWebdavServerList,
        delete: {
          f: this.settings.destroyLocalStorage,
          arg: 'webdavServerList',
          op: 'Delete'
        }
      },
      {
        k: 'webdavDirectoryMap',
        f: this.settings.getSetWebdavDirectoryMap,
        delete: {
          f: this.settings.destroyLocalStorage,
          arg: 'webdavDirectoryMap',
          op: 'Delete'
        }
      },
      {
        k: 'selectedDatabase',
        f: this.settings.getCurrentDatabaseChoice,
        delete: {
          f: this.settings.destroyLocalStorage,
          arg: 'selectedDatabase',
          op: 'Delete'
        }
      },
      {
        k: 'keyFiles',
        f: this.settings.getKeyFiles,
        delete: {
          f: this.settings.deleteAllKeyFiles,
          arg: undefined,
          op: 'Delete'
        }
      },
      {
        k: 'forgetTimes',
        f: this.settings.getAllForgetTimes
      },
      {
        k: 'sharedUrlList',
        f: this.settings.getSharedUrlList,
        delete: {
          f: this.settings.destroyLocalStorage,
          arg: 'sharedUrlList',
          op: 'Delete'
        }
      },
      ]
    }
  },
  watch: {
    expireTime(newval, oldval) {
      this.settings.getSetClipboardExpireInterval(parseInt(newval))
    },
    hotkeyNavEnabled(newval, oldval) {
      this.settings.getSetHotkeyNavEnabled(newval)
    },
    strictMatchEnabled(newval, oldval) {
      this.settings.getSetStrictModeEnabled(newval)
    },
    notificationsEnabled(newval) {
      this.settings.getSetNotificationsEnabled(newval)
    }
  },
  mounted() {
    this.init();
  },
  methods: {
    isFirefox: isFirefox,
    toggleOriginPermissions(evt) {
      // Negated because this function will call before the vue model update.
      const rawPerms = toRaw(this.allOriginPerms); // Convert proxy to raw object
      if (!this.allOriginPermission) {
        chrome.permissions.request(rawPerms);
      } else {
        chrome.permissions.remove(rawPerms);
      }
      this.settings.getSetOriginPermissionEnabled(!this.allOriginPermission);
      this.allOriginPermission = !this.allOriginPermission;
    },
    init() {
      this.settings.getSetClipboardExpireInterval().then(val => {
        this.expireTime = val
      })
      this.settings.getSetHotkeyNavEnabled().then(val => {
        this.hotkeyNavEnabled = val
      })
      this.settings.getSetNotificationsEnabled().then(val => {
        this.notificationsEnabled = val
      })
      this.settings.getSetStrictModeEnabled().then(val => {
        this.strictMatchEnabled = val;
      })
      if (!isFirefox()) {
        const rawPerms = toRaw(this.allOriginPerms);
        chrome.permissions.contains(rawPerms, granted => {
          this.allOriginPermission = !!granted;
        });
      }
      this.jsonState.forEach(blob => {
        blob.f().then(result => {
          if (result && Object.keys(result).length) {
            let formatter = new JSONFormatter(result)
            let place = document.getElementById(blob.k)
            while (place.firstChild) place.removeChild(place.firstChild);
            place.appendChild(formatter.render())
          } else {
            document.getElementById(blob.k).parentNode.parentNode.remove();
          }
        });
      });
    }
  }
}
</script>

<template>
  <div>
    <div class="box-bar roomy">
      <h4>Clipboard Expiration Time</h4>
      <p>
        When you copy a value to the clipboard, Tusk will set a timeout to automatically clear it again. You can choose
        how long this timeout will last.
      </p>
    </div>
    <div class="box-bar roomy lighter">
      <select
        v-model="expireTime"
        style="display: inline-block;"
      >
        <option value="1">
          1 minute
        </option>
        <option value="2">
          2 minutes
        </option>
        <option value="3">
          3 minutes
        </option>
        <option value="5">
          5 minutes
        </option>
        <option value="8">
          8 minutes
        </option>
      </select>
    </div>

    <div class="box-bar roomy">
      <h4>Enable Hotkey Navigation</h4>
      <p>
        If enabled, you will be able to use [TAB] and [ENTER] to navigate and autofill your passwords when the tusk UI
        is open. By default, [CTRL]+[SHIFT]+[SPACE] will open the Tusk popup
      </p>
    </div>
    <div class="box-bar roomy lighter">
      <div>
        <div class="switch">
          <label>
            <input
              v-model="hotkeyNavEnabled"
              type="checkbox"
            >
            <span class="lever" />
            Hotkey Navigation
          </label>
        </div>
      </div>
    </div>

    <div
      v-if="!isFirefox()"
      class="box-bar roomy"
    >
      <h4>Grant Permission on All Websites</h4>
      <p>
        <strong style="color:#d9534f">Only proceed if you know what you're doing.</strong> If enabled, the extension
        prompts once for permission to access and change data on all websites which disables the permissions popup on
        each new website. This has <a href="https://github.com/subdavis/Tusk/issues/168">serious security
          implications</a>. Only applies to Chrome. Because of a Chrome bug, it is currently impossible to revoke this
        permission again after it is enabled. If you turn this ON, Tusk must be reinstalled to reset.
      </p>
    </div>
    <div
      v-if="!isFirefox()"
      class="box-bar roomy lighter"
    >
      <div>
        <div class="switch">
          <label @click="toggleOriginPermissions">
            <input
              v-model="allOriginPermission"
              type="checkbox"
            >
            <span
              class="lever"
              @click.prevent
            />
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
            <input
              v-model="notificationsEnabled"
              type="checkbox"
              value="expiration"
            >
            <span class="lever" />
            Password expiration
          </label>
        </div>
        <div class="switch">
          <label>
            <input
              v-model="notificationsEnabled"
              type="checkbox"
              value="clipboard"
            >
            <span class="lever" />
            Clipboard events
          </label>
        </div>
      </div>
    </div>

    <div class="box-bar roomy">
      <h4>Enable Strict Matching</h4>
      <p>
        If enabled, only entries whose origins match exactly will be suggested for input. Titles and other tab
        information will not be considered in matching. For example,
        <pre>www.google.com</pre> will not match
        <pre>https://google.com</pre>
      </p>
    </div>
    <div class="box-bar roomy lighter">
      <div>
        <div class="switch">
          <label>
            <input
              v-model="strictMatchEnabled"
              type="checkbox"
            >
            <span class="lever" />
            Strict Matching
          </label>
        </div>
      </div>
    </div>

    <div class="box-bar roomy">
      <h4>Stored Data</h4>
      <p>
        The following objects represent the current data cached in local storage. This data is only available to Tusk,
        and is never sent over any network connection.
      </p>
    </div>
    <div
      v-for="blob in jsonState"
      class="box-bar lighter roomy"
    >
      <p>{{ blob.k }}</p>
      <div class="between">
        <div
          :id="blob.k"
          class="json"
        />
        <a
          v-if="blob.delete !== undefined"
          class="waves-effect waves-light btn"
          @click="blob.delete.f(blob.delete.arg); init();"
        >{{ blob.delete.op }}</a>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
@import "../styles/settings.scss";

.json {
	font-size: 12px;
}

h4 {
	font-size: 24px;
}
</style>
