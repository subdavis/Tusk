<script setup lang="ts">
import { inject, onMounted, ref } from 'vue';
import { AppServicesKey } from '@/composables/useAppServices';
import { RouterKey } from '@/composables/useRouter';
import type { DBInfo, FileManager } from '$services/types';

const { passwordFileStoreRegistry, settings, links } = inject(AppServicesKey)!;
const router = inject(RouterKey)!;

const databases = ref<(DBInfo & { provider: FileManager })[]>([]);

onMounted(() => {
  passwordFileStoreRegistry.listFileManagers('listDatabases').forEach((provider) => {
    provider
      .listDatabases()
      .then((dbs) => {
        if (dbs && dbs.length) {
          const withProvider = dbs.map((db) => ({ ...db, provider }));
          databases.value = databases.value.concat(withProvider);
        }
      })
      .catch((err) => {
        settings.handleProviderError(err, provider);
        console.error('Error when trying to listDatabases');
        console.error(err);
      });
  });
});

function selectDatabase(i?: number) {
  if (i === undefined) return; // TODO
  const database = databases.value[i];
  const info = database.provider.getDatabaseChoiceData(database);
  settings.saveCurrentDatabaseChoice(info, database.provider).then(() => {
    router.navigate('/unlock/' + database.provider.key + '/' + encodeURIComponent(database.title));
  });
}
</script>

<template>
  <div>
    <div
      v-for="(db, index) in databases"
      :key="db.provider.key + db.title"
      class="box-bar small selectable flair chooseFile"
      @click="selectDatabase(index)"
    >
      <span>
        <svg class="icon" viewBox="0 0 1 1">
          <use v-bind="{ 'xlink:href': '#' + db.provider.icon }" />
        </svg>
        {{ db.title }}
      </span>
    </div>
    <div class="box-bar small selectable flair chooseFile" @click="links.openOptionsDatabases">
      <span>
        <b>Manage Database Files</b>
      </span>
    </div>
  </div>
</template>

<style lang="scss">
@import '../styles/settings.scss';
.chooseFile {
  svg {
    width: 18px;
    vertical-align: middle;
  }
}
</style>
