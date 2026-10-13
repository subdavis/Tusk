<template>
  <div id="popup-view">
    <svg-defs />
    <options-navbar />
    <!-- Router View -->
    <div id="overflowbox">
      <div id="contentbox">
        <options-startup v-if="router.isActive('/')" />
        <manage-databases v-if="router.isActive('/manage/databases')" />
        <manage-keyfiles v-if="router.isActive('/manage/keyfiles')" />
        <advanced-settings v-if="router.isActive('/advanced')" />
        <reauthorize v-if="router.isActive('/reauthorize/:provider')" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { provide } from 'vue';
import { createAppServices, AppServicesKey } from '@/composables/useAppServices';
import { useRouter, RouterKey } from '@/composables/useRouter';
import OptionsNavbar from '@/components/Navbar.vue';
import OptionsStartup from '@/components/OptionsStartup.vue';
import ManageDatabases from '@/components/ManageDatabases.vue';
import ManageKeyfiles from '@/components/ManageKeyfiles.vue';
import AdvancedSettings from '@/components/AdvancedSettings.vue';
import SvgDefs from '@/components/SvgDefs.vue';
import Reauthorize from '@/components/Reauthorize.vue';

const services = createAppServices();
provide(AppServicesKey, services);

const router = useRouter([
  { path: '/', name: 'Getting Started' },
  { path: '/manage/databases', name: 'Manage Databases' },
  { path: '/manage/keyfiles', name: 'Manage Keyfiles' },
  { path: '/advanced', name: 'Advanced' },
  { path: '/reauthorize/:provider', name: 'Reauthorize', hiddenFromNavbar: true },
]);
provide(RouterKey, router);

const hashRoute = router.processHash(window.location.hash);
router.navigate(hashRoute ?? '/');
</script>

<style lang="scss">
@import './styles/options.scss';

body {
  background-color: $background-color;
}

#overflowbox {
  overflow-y: auto;
  margin-top: 60px;
}

#contentbox {
  margin: 0px auto;
  width: $options-width;
  /* height: 490px; */
}
</style>
