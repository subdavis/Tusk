<template>
  <div id="router-view">
    <svg-defs />
    <startup v-if="router.isActive('/')" />
    <file-picker v-if="router.isActive('/choose')" />
    <unlock v-if="router.isActive('/unlock/:provider/:title')" />
    <entry-details v-if="router.isActive('/entry-details/:entryId')" />
  </div>
</template>

<script setup lang="ts">
import { provide } from 'vue';
import { createAppServices, AppServicesKey } from '@/composables/useAppServices';
import { useRouter, RouterKey } from '@/composables/useRouter';
import Unlock from '@/components/Unlock.vue';
import Startup from '@/components/Startup.vue';
import FilePicker from '@/components/FilePicker.vue';
import EntryDetails from '@/components/EntryDetails.vue';
import SvgDefs from '@/components/SvgDefs.vue';

const services = createAppServices();
provide(AppServicesKey, services);

const router = useRouter([
  { path: '/' },
  { path: '/choose' },
  { path: '/unlock/:provider/:title' },
  { path: '/entry-details/:entryId' },
]);
provide(RouterKey, router);
router.navigate('/');
</script>

<style lang="scss">
@import './styles/shared.scss';

#router-view {
  width: 400px;
  margin: 0px auto;
  color: $text-color;
  background-color: $background-color;
}

body {
  margin: 0px;
  width: 100%;
}
</style>
