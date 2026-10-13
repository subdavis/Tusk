<!-- 
	OauthProvider:
	Database Provider for database managers that implement the oauth interface:
		/* The providerManager implements the following methods that return promises:
		 * isLoggedIn()
		 * login()
		 * logout()
		 * listDatabases()
		 */
	If new providers are added, prefer that they are oauth providers.
-->
<script setup lang="ts">
import { inject, onMounted, reactive, ref } from 'vue';
import { AppServicesKey } from '@/composables/useAppServices';
import GenericProviderUi from '@/components/GenericProviderUi.vue';
import type { DBInfo, FileManager } from '$services/types';

const props = defineProps<{
  providerManager: FileManager;
}>();

const { settings } = inject(AppServicesKey)!;

const busy = ref(false);
const databases = ref<DBInfo[]>([]);
const loggedIn = ref(false);
const messages = reactive({ error: '' });

function populate() {
  // TODO: deal with the race condition here....
  busy.value = true;
  messages.error = '';
  props.providerManager
    .listDatabases()
    .then((dbs) => {
      databases.value = dbs;
      return props.providerManager.isLoggedIn?.().then((isLoggedIn) => {
        loggedIn.value = !!isLoggedIn;
        busy.value = false;
      });
    })
    .catch((err) => {
      console.error('Error while connecting to database backend for', props.providerManager.title);
      messages.error = err.toString();
      databases.value = [];
      console.error(err);
      busy.value = false;
    });
}

function toggleLogin() {
  if (busy.value) {
    // wait for state to settle...
    console.error('Wait for toggle state to settle before changing enable/disable');
    return;
  }
  if (loggedIn.value) {
    props.providerManager
      .logout?.()
      .then(() => {
        // if logout works, attempt to unset the currentDatabaseChoice.
        settings.disableDatabaseProvider(props.providerManager);
        populate();
      })
      .catch((err) => {
        settings.disableDatabaseProvider(props.providerManager);
        messages.error = err.toString();
      });
  } else {
    props.providerManager
      .login?.()
      .then(() => {
        populate();
      })
      .catch((err) => {
        loggedIn.value = false;
        messages.error = err.toString();
      });
  }
}

onMounted(populate);

defineExpose({ populate });
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
      :remove-function="undefined"
    />
    <template v-if="loggedIn">
      <slot />
    </template>
  </div>
</template>

<style lang="scss">
@import '../styles/settings.scss';
</style>
