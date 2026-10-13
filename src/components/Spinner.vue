<script setup lang="ts">
withDefaults(defineProps<{ size?: 'small' | 'medium' | 'large'; message?: string }>(), {
  size: 'medium',
  message: '',
});
</script>

<template>
  <div class="tusk-spinner" :class="size">
    <div class="tusk-spinner-ring" />
    <span v-if="message" class="tusk-spinner-message">{{ message }}</span>
  </div>
</template>

<style lang="scss">
@import '../styles/settings.scss';

.tusk-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;

  .tusk-spinner-ring {
    border-radius: 50%;
    border-style: solid;
    border-color: $blue transparent $blue transparent;
    animation: tusk-spin 1.2s linear infinite;
  }

  &.small .tusk-spinner-ring {
    width: 16px;
    height: 16px;
    border-width: 2px;
  }

  &.medium .tusk-spinner-ring {
    width: 32px;
    height: 32px;
    border-width: 3px;
  }

  &.large .tusk-spinner-ring {
    width: 48px;
    height: 48px;
    border-width: 4px;
  }
}

@keyframes tusk-spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
