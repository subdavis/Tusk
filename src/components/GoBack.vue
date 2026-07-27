<script setup lang="ts">
import { inject } from 'vue';
import { RouterKey } from '@/composables/useRouter';

defineProps<{
  message?: string;
}>();

const router = inject(RouterKey)!;
</script>

<template>
  <div class="box-bar selectable" @click="router.goBack">
    <span>
      <i class="fa fa-long-arrow-left" aria-hidden="true" />
      {{ message }}
    </span>
  </div>
</template>

<style lang="scss">
@import '../styles/settings.scss';
</style>
