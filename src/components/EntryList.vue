<script setup lang="ts">
import { inject, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { AppServicesKey } from '@/composables/useAppServices';
import EntryListItem from '@/components/EntryListItem.vue';
import Messenger from '@/components/Messenger.vue';
import type { Entry } from '$services/types';

type FilterableEntry = Entry & { view_is_active?: boolean; filterKey?: string };

const props = defineProps<{
  messages: { warn?: string; error?: string; success?: string };
}>();

const { settings, unlockedState } = inject(AppServicesKey)!;

const searchbox = ref<HTMLInputElement>();

const searchTerm = ref('');
const allEntries = ref<FilterableEntry[]>(unlockedState.cacheGet('allEntries') ?? []);
const filteredEntries = ref<FilterableEntry[]>(unlockedState.cacheGet('allEntries') ?? []);
const priorityEntries = ref<FilterableEntry[]>(unlockedState.cacheGet('priorityEntries') ?? []);
const hotkeyNavEnabled = ref(false);
const allMessages = ref(props.messages);
const activeEntry = ref<FilterableEntry | null>(null);
const activeEntryIndex = ref(0);

function collectFilters(data: unknown, collector: string[]): void {
  if (data === null || data === undefined) return;
  if (data instanceof ArrayBuffer || data instanceof Uint8Array) return;
  else if (typeof data === 'string') collector.push(data.toLocaleLowerCase());
  else if (Array.isArray(data)) data.forEach((item) => collectFilters(item, collector));
  else if (typeof data === 'object')
    for (const prop in data) collectFilters((data as Record<string, unknown>)[prop], collector);
}

function createEntryFilters(entries: FilterableEntry[]) {
  entries.forEach((entry) => {
    const filters: string[] = [];
    collectFilters(entry, filters);
    entry.filterKey = filters.join(' ');
  });
}

function setActive(index: number) {
  if (!hotkeyNavEnabled.value) return;
  // Unset the current active entry
  if (activeEntry.value !== null) {
    activeEntry.value.view_is_active = false;
  }
  let activeList: FilterableEntry[];
  if (filteredEntries.value.length > 0 && searchTerm.value.length > 0)
    activeList = filteredEntries.value;
  else if (priorityEntries.value.length > 0) activeList = priorityEntries.value;
  else return; // Neither list has entries
  if (index < 0) index = activeList.length + index;
  index = index % activeList.length;
  activeEntry.value = activeList[index];
  activeEntry.value.view_is_active = true;
  activeEntryIndex.value = index;
}

function keyHandler(evt: KeyboardEvent) {
  switch (evt.keyCode) {
    case 67: // C
    case 66: // B
      if (evt.ctrlKey || evt.metaKey) {
        if (evt.keyCode === 67 && activeEntry.value) {
          unlockedState.copyPassword(activeEntry.value);
        } else if (evt.keyCode === 66 && activeEntry.value) {
          unlockedState.copyUsername(activeEntry.value);
        }
      }
      break;
    case 9: {
      // TAB
      const modifier = !evt.shiftKey ? 1 : -1;
      setActive(activeEntryIndex.value + modifier);
      evt.preventDefault();
      break;
    }
    case 40: // DOWN arrow
      setActive(activeEntryIndex.value + 1);
      evt.preventDefault();
      break;
    case 38: // UP arrow
      setActive(activeEntryIndex.value - 1);
      evt.preventDefault();
      break;
    case 13: // ENTER
      if (activeEntry.value !== null) unlockedState.autofill(activeEntry.value);
      break;
  }
}

watch(searchTerm, (val) => {
  unlockedState.cacheSet('searchFilter', val); // Causes cache refresh
  if (val.length) {
    filteredEntries.value = allEntries.value.filter((entry) => {
      return (entry.filterKey ?? '').indexOf(val.toLocaleLowerCase()) > -1;
    });
  }
  // Regardless of result, reset the active entry.
  setActive(0);
});

onMounted(async () => {
  // Autofocus searchbox
  searchbox.value?.focus();
  createEntryFilters(allEntries.value);
  // Restore the search term if needed
  const st = unlockedState.cache.searchFilter as string | undefined;
  if (st !== undefined) searchTerm.value = st;
  const um = unlockedState.cacheGet<typeof props.messages>('unlockedMessages');
  if (um !== undefined) allMessages.value = um;
  const enabled = await settings.getSetHotkeyNavEnabled();
  hotkeyNavEnabled.value = enabled;
  if (enabled) {
    // Initialize the active entry
    setActive(0);
    // Listen for key events.
    window.addEventListener('keydown', keyHandler);
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', keyHandler);
});
</script>

<template>
  <div>
    <div class="search">
      <i class="fa fa-search" />
      <input
        ref="searchbox"
        v-model="searchTerm"
        type="search"
        placeholder="search entire database..."
      />
    </div>
    <messenger :messages="allMessages" />
    <div class="entries">
      <div v-if="priorityEntries && searchTerm.length == 0">
        <entry-list-item v-for="entry in priorityEntries" :key="entry.id" :entry="entry" />
      </div>
      <div v-if="filteredEntries && searchTerm.length > 0">
        <entry-list-item v-for="entry in filteredEntries" :key="entry.id" :entry="entry" />
      </div>
    </div>
  </div>
</template>

<style lang="scss">
@import '../styles/settings.scss';
.entries {
  border-bottom: 2px solid $light-gray;
  height: 350px;
  overflow-y: auto;
}

.search {
  width: 100%;
  padding: 8px $wall-padding;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  border-bottom: 2px solid $light-gray;
  input {
    float: right;
    width: 96%;
    border: 0px;
    padding: 0px;
    padding-left: 10px;
    font-size: 18px;
    background-color: $background-color;
  }
  input:focus {
    outline: none;
  }
  .fa {
    width: 4%;
    font-size: 15px;
  }
}
</style>
