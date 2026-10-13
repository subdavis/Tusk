<!-- 
  Navbar:
  requires a lib/VirtualRouter, and the routes object used to initialize the virtualrouter.
  Active tab changes automatically based on visible route.
-->
<script setup lang="ts">
import { inject } from 'vue';
import { RouterKey } from '@/composables/useRouter';

const router = inject(RouterKey)!;
</script>

<template>
  <nav class="nav-extended">
    <div class="nav-content">
      <ul class="tabs tabs-transparent">
        <template v-for="route in router.routes" :key="route.name">
          <li
            v-if="!route.hiddenFromNavbar"
            class="tab"
            :class="{ active: router.isActive(route.path) }"
          >
            <a @click="router.navigate(route.path)">{{ route.name }}</a>
          </li>
        </template>
      </ul>
    </div>
  </nav>
</template>

<style lang="scss">
@import '../styles/settings.scss';

nav {
  position: fixed;
  top: 0px;
  z-index: 100;

  .nav-content {
    width: $options-width;
    margin: 0px auto;

    li.active {
      border-bottom: 3px solid $background-color;
    }
  }
}
</style>
