<!-- 
	SharedLinkProvider:
	Simple http provider that can also handle Dropbox Shared Links
-->

<script setup lang="ts">
import { inject, onMounted, reactive, ref } from 'vue';
import * as Base64 from 'base64-arraybuffer';
import { AppServicesKey } from '@/composables/useAppServices';
import GenericProviderUi from '@/components/GenericProviderUi.vue';
import type { LocalDBInfo, LocalFileManager } from '$services/localChromePasswordFileManager';

const props = defineProps<{
  providerManager: LocalFileManager;
}>();

const { settings } = inject(AppServicesKey)!;

const busy = ref(false);
const databases = ref<LocalDBInfo[]>([]);
const loggedIn = ref(false);
const messages = reactive({ error: '' });

onMounted(() => {
  props.providerManager.isLoggedIn().then((isLoggedIn) => {
    loggedIn.value = isLoggedIn;
  });
  props.providerManager.listDatabases().then((dbs) => {
    databases.value = dbs;
  });
});

function toggleLogin(e: MouseEvent) {
  if (loggedIn.value) {
    settings.disableDatabaseProvider(props.providerManager);
    props.providerManager.logout().then(() => {
      loggedIn.value = false;
    });
  } else {
    props.providerManager.login().then(() => {
      loggedIn.value = true;
    });
    e.preventDefault();
  }
}

function selectFile() {
  document.getElementById('file-selector')?.click();
}

function removePasswordFile(index: number) {
  if (index >= databases.value.length || index < 0) return; // not a valid index...
  const fi = databases.value[index];
  props.providerManager
    .deleteDatabase(fi)
    .then(() => props.providerManager.listDatabases())
    .then((files) => {
      databases.value = files;
    });
}

function handleAdd(event: Event) {
  const files = (event.target as HTMLInputElement).files;
  messages.error = '';
  for (const fp of Array.from(files ?? [])) {
    const reader = new FileReader();
    reader.readAsArrayBuffer(fp);
    reader.onload = (e) => {
      if (fp.name.indexOf('.kdbx') < 0 || fp.size < 70) {
        messages.error += fp.name + ' is not a valid KeePass v2+ file. ';
        return;
      }

      const fi: LocalDBInfo = {
        title: fp.name,
        data: Base64.encode(e.target?.result as ArrayBuffer),
      };

      const existingIndex = databases.value.findIndex((existing) => existing.title === fi.title);
      if (existingIndex === -1) {
        databases.value.push(fi);
      } else {
        databases.value[existingIndex] = fi;
      }

      props.providerManager.saveDatabase(fi);
    };
  }
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
      :removeable="true"
      :remove-function="removePasswordFile"
    />
    <div v-if="loggedIn">
      <div class="warn pill">
        <p>
          Tusk
          <b>cannot</b> keep your local database file up to date.
          <b>If you change it, you'll have to import it into Tusk again.</b>
        </p>
      </div>
      <div>
        <input
          id="file-selector"
          type="file"
          accept=".kdbx"
          style="display: none"
          name="file"
          multiple
          @change="handleAdd"
        />
        <a class="waves-effect waves-light btn" @click="selectFile">Select Local File</a>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import '../styles/settings.scss';
</style>
