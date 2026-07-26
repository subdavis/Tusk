<script setup lang="ts">
import { computed, inject, nextTick, onMounted, reactive, ref, watch } from 'vue';
import browser from 'webextension-polyfill';
import { getValidTokens, parseUrl } from '@/lib/utils';
import { AppServicesKey } from '@/composables/useAppServices';
import { RouterKey } from '@/composables/useRouter';
import EntryList from '@/components/EntryList.vue';
import Spinner from 'vue-simple-spinner';
import Messenger from '@/components/Messenger.vue';
import type { KeyFile } from '$services/settings';
import type { Entry, KdbxCredentialsJSON } from '$services/types';

const { unlockedState, secureCache, settings, keepassService, links } = inject(AppServicesKey)!;
const router = inject(RouterKey)!;

/* UI state data */
const unlockedMessages = reactive({ warn: '', error: '' });
const generalMessages = reactive({ warn: '', error: '', success: '' });
const busy = ref(false);
const isUnlocked = ref(false);
const masterPassword = ref('');
const isMasterPasswordInputVisible = ref(false);
const keyFiles = ref<KeyFile[]>([]); // list of all available
const selectedKeyFile = ref<KeyFile>(); // chosen keyfile object
const rememberPeriod = ref(0); // in minutes. default: do not remember
const rememberPeriodText = ref('');
const databaseFileName = ref('');
const keyFilePicker = ref(false);
const appVersion = browser.runtime.getManifest().version;

const sliderOptions = [
  { time: 0, text: 'Do not remember' },
  { time: 30, text: 'Remember for 30 min.' },
  { time: 120, text: 'Remember for 2 hours.' },
  { time: 240, text: 'Remember for 4 hours.' },
  { time: 480, text: 'Remember for 8 hours.' },
  { time: 1440, text: 'Remember for 24 hours.' },
  { time: -1, text: 'Until browser exits.' },
];
const sliderInt = ref(0);

const masterPasswordInput = ref<HTMLInputElement>();

const selectedKeyFileName = computed(() => {
  return selectedKeyFile.value !== undefined
    ? selectedKeyFile.value.name
    : 'No keyfile selected.  (click to change)';
});

watch(
  unlockedMessages,
  (newval) => {
    unlockedState.cacheSet('unlockedMessages', newval);
  },
  { deep: true }
);

function setRememberPeriod(timeInt?: number) {
  /* Args: optional timeInt
   * if timeInt is given, derive sliderInt
   * else assume sliderInt is already set.
   */
  let sliderOptionIndex: number;
  if (timeInt !== undefined) {
    sliderInt.value = sliderOptions.findIndex((opt) => opt.time === timeInt);
    if (sliderInt.value === -1) sliderInt.value = 0;
    sliderOptionIndex = sliderInt.value;
  } else {
    sliderOptionIndex = Number(sliderInt.value);
  }
  if (sliderOptionIndex < sliderOptions.length) {
    rememberPeriod.value = sliderOptions[sliderOptionIndex].time;
    rememberPeriodText.value = sliderOptions[sliderOptionIndex].text;
  }
}

function closeWindow() {
  window.close();
}

function chooseKeyFile(index?: number) {
  if (index !== undefined && index >= 0) selectedKeyFile.value = keyFiles.value[index];
  else selectedKeyFile.value = undefined;
  keyFilePicker.value = false;
}

function forgetPassword() {
  settings.getCurrentMasterPasswordCacheKey().then((key) => {
    if (key !== null) secureCache.clear(key);
    secureCache.clear('secureCache.entries');
    unlockedState.clearClipboardState();
    unlockedState.clearCache(); // new
    isUnlocked.value = false;
  });
}

function showResults(entries: Entry[], fromCache = false) {
  const getMatchesForThreshold = (threshold: number, entries: Entry[], requireEmptyURL = false) => {
    return entries.filter(
      (e) => (e.matchRank ?? 0) >= threshold && (requireEmptyURL ? !e.url : true)
    );
  };
  settings.getSetStrictModeEnabled().then((strictMode) => {
    const siteUrl = parseUrl(unlockedState.url);
    if (!siteUrl) return;
    const title = unlockedState.title;
    const siteTokens = getValidTokens(siteUrl.hostname + '.' + unlockedState.title);
    keepassService.rankEntries(entries, siteUrl, title, siteTokens); // in-place

    const allEntries = entries;
    let priorityEntries = getMatchesForThreshold(100, entries);

    if (priorityEntries.length == 0) {
      priorityEntries = getMatchesForThreshold(10, entries);

      // in strict mode, good matches are considered partial matches.
      if (strictMode && priorityEntries.length) {
        unlockedMessages.warn =
          'No perfect origin matches, showing ' + priorityEntries.length + ' partial matches.';
      }
    }
    if (!strictMode && priorityEntries.length == 0) {
      priorityEntries = getMatchesForThreshold(0.8, entries, true);
    }
    if (!strictMode && priorityEntries.length == 0) {
      priorityEntries = getMatchesForThreshold(0.4, entries);

      if (priorityEntries.length) {
        unlockedMessages.warn =
          'No close matches, showing ' + priorityEntries.length + ' partial matches.';
      }
    }
    if (priorityEntries.length == 0) {
      unlockedMessages.warn = 'No matches found for this site.';
    }

    // Cache in memory
    unlockedState.cacheSet('allEntries', allEntries);
    unlockedState.cacheSet('priorityEntries', priorityEntries);

    // save longer term (in encrypted storage)
    if (!fromCache) {
      // Don't bother saving if we're just reading from the cache.
      secureCache.save('secureCache.entries', entries);
    }
    busy.value = false;
    isUnlocked.value = true;
  });
}

function unlock(passwordKey?: KdbxCredentialsJSON) {
  busy.value = true;
  generalMessages.error = '';
  const bufferPromise = keepassService.getChosenDatabaseFile();
  const passwordKeyPromise: Promise<KdbxCredentialsJSON> =
    passwordKey === undefined
      ? keepassService.getMasterKey(bufferPromise, masterPassword.value, selectedKeyFile.value)
      : Promise.resolve(passwordKey);

  const keyFileName = selectedKeyFile.value !== undefined ? selectedKeyFile.value.name : undefined;
  passwordKeyPromise
    .then((resolvedPasswordKey) => {
      return keepassService
        .getDecryptedData(bufferPromise, resolvedPasswordKey)
        .then((decryptedData) => {
          const entries = decryptedData.entries;
          const version = decryptedData.version;
          const dbUsage = {
            requiresPassword: resolvedPasswordKey.passwordHash !== null,
            requiresKeyfile: resolvedPasswordKey.keyFileHash !== null,
            passwordKey: undefined as KdbxCredentialsJSON | undefined,
            version,
            keyFileName,
            rememberPeriod: rememberPeriod.value,
          };
          if (rememberPeriod.value !== 0) {
            const checkTime = 60000 * rememberPeriod.value; // milliseconds / min
            // Save the password in memory independently.
            settings.cacheMasterPassword(resolvedPasswordKey, {
              forgetTime: checkTime > 0 ? Date.now() + checkTime : checkTime,
            });
          } else {
            settings.getCurrentMasterPasswordCacheKey().then((key) => {
              if (key) secureCache.clear(key);
            });
          }
          settings.saveCurrentDatabaseUsage(dbUsage);
          settings.getSetDefaultRememberPeriod(rememberPeriod.value);
          showResults(entries);
          busy.value = false;
          masterPassword.value = '';
        });
    })
    .catch((err) => {
      console.error(err);
      generalMessages.error = err.message || 'invalid keyfile or KDBX file';
      busy.value = false;
      throw err;
    });
}

function clickUnlock(event: Event) {
  event.preventDefault();
  unlock();
}

onMounted(async () => {
  // modify unlockedState internal state
  await unlockedState.getTabDetails();

  if (!isUnlocked.value) {
    const tryAutounlock = () => {
      busy.value = true;
      settings
        .getKeyFiles()
        .then((kf) => {
          keyFiles.value = kf;
          return settings.getSetDefaultRememberPeriod();
        })
        .then((period) => {
          setRememberPeriod(period);
          return settings.getCurrentDatabaseUsage();
        })
        .then((usage) => {
          // tweak UI based on what we know about the db file
          setRememberPeriod(usage.rememberPeriod as number | undefined);

          const hidePassword = usage.requiresPassword === false;
          if (usage.passwordKey !== undefined && usage.requiresKeyfile === false) {
            unlock(usage.passwordKey as KdbxCredentialsJSON); // Autologin if no keyfile
          } else if (usage.keyFileName !== undefined) {
            const matches = keyFiles.value.filter((kf) => kf.name === usage.keyFileName);
            if (matches.length > 0) {
              selectedKeyFile.value = matches[0];
              if (hidePassword || usage.passwordKey !== undefined)
                unlock(usage.passwordKey as KdbxCredentialsJSON);
            }
          }
        });
    };

    const focus = () => {
      nextTick(() => {
        masterPasswordInput.value?.focus();
      });
    };

    busy.value = true;
    try {
      const entries = await secureCache.get<Entry[]>('secureCache.entries');
      if (entries !== undefined && entries.length > 0) {
        showResults(entries, true);
      } else {
        tryAutounlock();
      }
    } catch (err) {
      console.error(err);
      // this is fine - it just means the cache expired.  Clear the cache to be sure.
      secureCache.clear('secureCache.entries');
      tryAutounlock();
    }
    busy.value = false;
    focus();
  }
  if (unlockedState.sitePermission) {
    generalMessages.success =
      'You have previously granted Tusk permission to fill passwords on ' + unlockedState.origin;
  } else {
    generalMessages.warn =
      'This may be a new site to Tusk. Before filling in a password, double check that this is the correct site.';
  }
  // set knowledge from the URL
  databaseFileName.value = decodeURIComponent(router.getRoute()?.params.title ?? '');
});
</script>

<template>
  <div>
    <!-- Busy Spinner -->
    <div v-if="busy" class="spinner">
      <spinner size="medium" :message="'Unlocking ' + databaseFileName" />
    </div>

    <!-- Entry List -->
    <EntryList v-if="!busy && isUnlocked" :messages="unlockedMessages" />

    <!-- General Messenger -->
    <messenger v-show="!busy" :messages="generalMessages" />

    <!-- Unlock input group -->
    <div v-if="!busy && !isUnlocked" id="masterPasswordGroup">
      <div class="unlockLogo stack-item">
        <img src="/assets/icons/exported/128x128.svg" width="256px" height="256px" />
        <span>KeePass Tusk</span>
      </div>

      <form @submit="clickUnlock">
        <div class="small selectable databaseChoose" @click="router.navigate('/choose')">
          <b>{{ databaseFileName }}</b> <span class="muted-color">change...</span>
        </div>

        <div class="stack-item masterPasswordInput">
          <input
            id="masterPassword"
            ref="masterPasswordInput"
            v-model="masterPassword"
            :type="isMasterPasswordInputVisible ? 'text' : 'password'"
            placeholder="🔒 master password"
            autocomplete="off"
          />
          <i
            :class="['fa', isMasterPasswordInputVisible ? 'fa-eye-slash' : 'fa-eye', 'fa-fw']"
            aria-hidden="true"
            @click="isMasterPasswordInputVisible = !isMasterPasswordInputVisible"
          />
        </div>

        <div class="stack-item">
          <div
            id="select-keyfile"
            class="selectable"
            @click="
              selectedKeyFile = undefined;
              keyFilePicker = !keyFilePicker;
            "
          >
            <i class="fa fa-key" aria-hidden="true" /> {{ selectedKeyFileName }}
          </div>
        </div>

        <transition name="keyfile-picker">
          <div v-if="keyFilePicker" class="stack-item keyfile-picker">
            <span
              v-for="(kf, kf_index) in keyFiles"
              :key="kf.name"
              class="selectable"
              :keyfile-index="kf_index"
              @click="chooseKeyFile(kf_index)"
            >
              <i class="fa fa-file fa-fw" aria-hidden="true" /> {{ kf.name }}
            </span>
            <span class="selectable" @click="links.openOptionsKeyfiles">
              <i class="fa fa-wrench fa-fw" aria-hidden="true" /> Manage Keyfiles</span
            >
          </div>
        </transition>

        <div class="box-bar small plain remember-period-picker">
          <span>
            <label for="rememberPeriodLength">
              <span>{{ rememberPeriodText }} (slide to choose)</span>
            </label>
            <input
              id="rememberPeriodLength"
              v-model="sliderInt"
              type="range"
              min="0"
              :max="sliderOptions.length - 1"
              step="1"
              @input="setRememberPeriod(undefined)"
            />
          </span>
        </div>

        <div class="stack-item">
          <button class="action-button selectable" @click="clickUnlock">Unlock Database</button>
        </div>
      </form>
    </div>

    <!-- Footer -->
    <div v-show="!busy" class="box-bar medium between footer">
      <span class="selectable" @click="links.openOptions">
        <i class="fa fa-cog" aria-hidden="true" /> Settings</span
      >
      <span v-if="isUnlocked" class="selectable" @click="forgetPassword">
        <i class="fa fa-lock" aria-hidden="true" /> Lock Database</span
      >
      <span v-else class="selectable" @click="closeWindow">
        <i class="fa fa-times-circle" aria-hidden="true" /> Close Window</span
      >
      <span class="selectable" @click="links.openHomepage">
        <i class="fa fa-info-circle" aria-hidden="true" /> v{{ appVersion }}</span
      >
    </div>
  </div>
</template>

<style lang="scss">
@import '../styles/settings.scss';

#masterPasswordGroup {
  .keyfile-picker {
    background-color: $light-background-color;
    box-sizing: border-box;
    transition: all 0.2s linear;
    max-height: 200px;
    overflow-y: auto;
    opacity: 1;
    border-top: 1px solid $light-gray;
    border-bottom: 1px solid $light-gray;
    padding: 5px $wall-padding;
    margin: 5px 0px;

    &.keyfile-picker-enter,
    &.keyfile-picker-leave-to {
      max-height: 0px;
      opacity: 0;
    }

    span {
      display: block;
      padding: 2px 0px;

      &:hover {
        padding-left: 3px;
      }
    }
  }

  #select-keyfile {
    padding: 8px $wall-padding;
    background-color: $light-background-color;
    border-bottom: 1px solid $light-gray;

    i {
      font-size: 14px;
    }

    &:hover {
      opacity: 0.7;
    }
  }

  #rememberPeriodLength {
    width: 80px;
    float: left;
  }

  .masterPasswordInput {
    border-top: 1px solid $light-gray;
    position: relative;

    i {
      position: absolute;
      font-size: 14px;
      top: calc(50% - 0.5em);
      right: 10px;
      cursor: pointer;
    }
  }

  input[type='text'],
  input[type='password'] {
    width: calc(100% - 1em);
    box-sizing: border-box;
    font-size: 18px;
    border-width: 0px 0px;
    padding: 5px $wall-padding;

    &:focus {
      outline: none;
    }
  }

  .remember-period-picker {
    margin: 6px 0px;

    input[type='range'] {
      -webkit-appearance: none;
      margin: 6px;
      margin-left: 0px;
    }
  }

  input[type='range']:focus {
    outline: none;
  }

  input[type='range']::-webkit-slider-runnable-track {
    height: 6px;
    cursor: pointer;
    animate: 0.2s;
    background: $blue;
    border-radius: 1.3px;
    border: 0.2px solid #010101;
    margin-top: -2px;
  }

  input[type='range']::-webkit-slider-thumb {
    border: 1px solid black;
    height: 18px;
    width: 10px;
    border-radius: 2px;
    background: white;
    cursor: pointer;
    -webkit-appearance: none;
    margin-top: -7px;
  }
}

.spinner {
  padding: $wall-padding;
}

.footer span {
  padding: 2px 4px;
  border-radius: 3px;

  &:hover {
    background-color: $dark-background-color;
  }
}

.databaseChoose {
  padding-left: 5px;
}
</style>
