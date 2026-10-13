<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue';
import { AppServicesKey } from '@/composables/useAppServices';
import { RouterKey } from '@/composables/useRouter';
import type { Entry } from '$services/types';

const props = defineProps<{
  entry: Entry & { view_is_active?: boolean };
}>();

const { unlockedState } = inject(AppServicesKey)!;
const router = inject(RouterKey)!;

const el = ref<HTMLElement>();

const header = computed(() => {
  const title = props.entry.title as string;
  return title && title.length > 0 ? title : (props.entry.url as string);
});

// When the element becomes active, scroll it into view.
watch(
  () => props.entry.view_is_active,
  (val) => {
    if (val) el.value?.scrollIntoView({ block: 'end', inline: 'nearest', behavior: 'smooth' });
  }
);

function details() {
  router.navigate('/entry-details/' + props.entry.id);
}

function autofill(e: MouseEvent) {
  e.stopPropagation();
  console.debug('autofill');
  unlockedState.autofill(props.entry);
}

function copy(e: MouseEvent) {
  e.stopPropagation();
  console.debug('copy');
  unlockedState.copyPassword(props.entry);
}
</script>

<template>
  <div
    ref="el"
    class="entry-list-item selectable between flair"
    :class="{ active: entry.view_is_active }"
    @click="details"
  >
    <div class="text-info" :class="{ strike: entry.is_expired }">
      <span class="header">{{ header }}</span>
      <br />
      <span class="user">
        {{ entry.userName || '&#60;empty&#62;' }}
      </span>
    </div>
    <div class="buttons">
      <span class="fa-stack copy" @click="copy">
        <i class="fa fa-circle fa-stack-2x" />
        <i class="fa fa-clipboard fa-stack-1x fa-inverse" />
      </span>
      <span class="fa-stack autofill" @click="autofill">
        <i class="fa fa-circle fa-stack-2x" />
        <i class="fa fa-magic fa-stack-1x fa-inverse" />
      </span>
    </div>
  </div>
</template>

<style lang="scss">
@import '../styles/settings.scss';
.entry-list-item {
  transition: all 0.3s ease;
  width: 100%;
  padding: 10px $wall-padding;
  box-sizing: border-box;
  border-bottom: 1px solid $light-gray;
  background-color: #fff;
  display: flex;
  .header {
    font-size: 16px;
  }
  .user {
    font-size: 12px;
  }
  .buttons {
    font-size: 18px;
    display: flex;
    justify-content: space-between;
    box-sizing: border-box;
    min-width: 80px;
  }
  .copy,
  .autofill {
    opacity: 0.2;
  }
  .copy:hover,
  .autofill:hover {
    opacity: 0.8;
  }
  &.active {
    background-color: $highlighted;
    padding-left: 20px;
  }
}

.strike {
  text-decoration: line-through;
}
</style>
