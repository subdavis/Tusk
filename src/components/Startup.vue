<script setup lang="ts">
import { inject, onMounted, ref } from 'vue';
import Spinner from 'vue-simple-spinner';
import { AppServicesKey } from '@/composables/useAppServices';
import { RouterKey } from '@/composables/useRouter';

const { settings, links, passwordFileStoreRegistry } = inject(AppServicesKey)!;
const router = inject(RouterKey)!;

const busy = ref(true);

onMounted(async () => {
  const info = await settings.getCurrentDatabaseChoice();
  // use the last chosen database
  if (info) {
    router.navigate(
      '/unlock/' + info.providerKey + '/' + encodeURIComponent(info.passwordFile.title)
    );
    return;
  }

  // user has not yet chosen a database.  Lets see if there are any available to choose...
  const readyPromises = passwordFileStoreRegistry
    .listFileManagers('listDatabases')
    .map((provider) => provider.listDatabases());

  const filesArrays = await Promise.all(readyPromises);
  const availableFiles = filesArrays.flat();

  if (availableFiles.length) {
    // choose one of the files
    router.navigate('/choose');
  } else {
    // no files available - allow the user to link to the options page
    busy.value = false;
  }
});
</script>

<template>
  <div>
    <!-- Busy Spinner -->
    <div v-if="busy" class="box-bar plain spinner">
      <spinner size="large" />
    </div>
    <div v-else>
      <div class="box-bar plain">
        <div class="unlockLogo stack-item">
          <img src="@/assets/icons/exported/128x128.svg" />
          <span>KeePass Tusk</span>
        </div>
        <p>
          Tusk is an extension that uses your existing KeePass database files to autofill passwords
          on websites. In order to continue, you must add your KeePass database file(s).
        </p>
      </div>
      <div class="stack-item selectable">
        <button class="action-button selectable" @click="links.openOptions">
          Add a KeePass database file
        </button>
      </div>
      <div class="box-bar plain">
        <p>You can return here when you've enabled one of the database file providers.</p>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
@import '../styles/settings.scss';
p {
  width: 100%;
  margin: 10px 0px 0px 0px;
  font-size: 14px;
}
</style>
