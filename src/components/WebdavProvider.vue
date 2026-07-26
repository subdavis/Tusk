<!-- 
	SharedLinkProvider:
	Simple http provider that can also handle Dropbox Shared Links
-->
<script setup lang="ts">
import { inject, onMounted, reactive, ref } from 'vue';
import browser from 'webextension-polyfill';
import { AppServicesKey } from '@/composables/useAppServices';
import GenericProviderUi from '@/components/GenericProviderUi.vue';
import type { ServerInfo, WebdavDBInfo, WebdavFileManagerType } from '$services/webdavFileManager';

const props = defineProps<{
  providerManager: WebdavFileManagerType;
}>();

const { settings } = inject(AppServicesKey)!;

const busy = ref(false);
const databases = ref<WebdavDBInfo[]>([]);
const loggedIn = ref(false);
const messages = reactive({ error: '' });
const webdav = reactive({ username: '', url: '', password: '' });
const serverList = ref<(ServerInfo & { scanBusy?: boolean })[]>([]);

onMounted(() => {
  props.providerManager.isLoggedIn().then((isLoggedIn) => {
    loggedIn.value = isLoggedIn;
    if (isLoggedIn) onLogin();
  });
});

function addServer() {
  browser.permissions
    .request({ origins: [webdav.url] })
    .then(() => {
      props.providerManager
        .addServer(webdav.url, webdav.username, webdav.password)
        .then((serverInfo) => {
          return updateServerList().then(() => {
            scan((serverInfo as ServerInfo).serverId);
          });
        })
        .catch((err) => {
          console.error(err);
          messages.error = err.toString();
        });
    })
    .catch((err) => {
      console.error(err);
      messages.error = err.toString();
    });
}

function setBusy(serverId: string, isBusy: boolean) {
  const serverListItem = serverList.value.find((elem) => elem.serverId === serverId);
  if (serverListItem) serverListItem.scanBusy = isBusy;
}

function scan(serverId: string) {
  setBusy(serverId, true);
  return props.providerManager
    .searchServer(serverId)
    .then(() => {
      props.providerManager.listDatabases().then((dbs) => {
        databases.value = dbs;
      });
    })
    .catch((err) => {
      messages.error = err.toString();
    })
    .then(() => {
      // READ: finally.
      setBusy(serverId, false);
    });
}

function remove(serverId: string) {
  return props.providerManager.removeServer(serverId).then(updateServerList);
}

function updateServerList() {
  return props.providerManager.listServers().then((servers) => {
    serverList.value = servers;
  });
}

function toggleLogin() {
  if (loggedIn.value) {
    settings.disableDatabaseProvider(props.providerManager);
    props.providerManager.logout().then(() => {
      loggedIn.value = false;
    });
  } else {
    props.providerManager.login().then(() => {
      loggedIn.value = true;
      onLogin();
    });
  }
}

function onLogin() {
  /* Other things to do when a successful login happens... */
  props.providerManager.listDatabases().then((dbs) => {
    databases.value = dbs;
  });
  updateServerList();
}
</script>

<template>
  <div class="box-bar roomy database-manager">
    <generic-provider-ui
      :busy="busy"
      :databases="databases"
      :logged-in="loggedIn"
      :error="messages.error"
      :provider-manager="providerManager"
      :toggle-login="toggleLogin"
      :removeable="false"
    />
    <div v-if="loggedIn">
      <div class="warn pill">
        <p>
          <b>Wait! </b>Did you read the
          <a href="https://github.com/subdavis/Tusk/wiki/WebDAV-Support">best practices guide</a>?
          Do that first!
        </p>
      </div>
      <div>
        <p>
          The URL below should have the path of a FOLDER, not an individual FILE. The webDAV
          provider works by recursively scanning all files within the folder you specify. Your
          keepass databases will be discovered by their file extension (.kdbx).
        </p>
      </div>
      <table v-if="serverList.length">
        <tr>
          <th>User</th>
          <th>URL</th>
          <th>Actions</th>
        </tr>
        <tr v-for="server in serverList" :key="server.serverId">
          <td>{{ server.username }}</td>
          <td>{{ server.url }}</td>
          <td>
            <a v-show="!server.scanBusy" class="selectable" @click="scan(server.serverId)">
              <i class="fa fa-search" /> scan</a
            >
            <a v-show="server.scanBusy"><i class="fa fa-spinner fa-pulse" /> scanning</a>
          </td>
          <td>
            <a class="selectable" @click="remove(server.serverId)">
              <i class="fa fa-times-circle selectable" /> remove</a
            >
          </td>
        </tr>
      </table>
      <div v-if="loggedIn">
        <p><b>Add new server</b></p>
        <div id="webdav-server-input-box">
          <input
            id="webdav-server"
            v-model="webdav.url"
            type="text"
            placeholder="http://server:port/remote.php/webdav/"
          />
          <input
            id="webdav-username"
            v-model="webdav.username"
            type="text"
            placeholder="Username"
          />
          <input
            id="webdav-password"
            v-model="webdav.password"
            type="password"
            placeholder="Password"
          />
        </div>
        <a class="waves-effect waves-light btn" @click="addServer">Add server</a>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import '../styles/settings.scss';

#webdav-server-input-box {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  box-sizing: border-box;

  input {
    padding: 4px;
    margin: 0px 8px 8px 0px;

    &#webdav-server {
      width: 100%;
    }
    &#webdav-username,
    &#webdav-password {
      flex: 1;
    }
  }
}

table {
  font-size: 14px;
  td {
    padding: 5px 5px;
    border-radius: 0px;
  }
  th {
    background-color: $light-background-color;
  }
  tr {
    background-color: $background-color;
  }
}

.warning-box {
  border: 3px solid red;
  p {
    margin: 4px;
  }
}
</style>
