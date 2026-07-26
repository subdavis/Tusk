<!-- 
	SharedLinkProvider:
	Simple http provider that can also handle Dropbox Shared Links
-->
<script setup lang="ts">
import { inject, onMounted, reactive, ref } from 'vue';
import browser from 'webextension-polyfill';
import { parseUrl } from '@/lib/utils';
import { AppServicesKey } from '@/composables/useAppServices';
import GenericProviderUi from '@/components/GenericProviderUi.vue';
import type { SharedUrlDBInfo, SharedUrlFileManagerType } from '$services/sharedUrlFileManager';

const props = defineProps<{
  providerManager: SharedUrlFileManagerType;
}>();

const { settings } = inject(AppServicesKey)!;

const busy = ref(false);
const currentUrl = ref('');
const currentUrlTitle = ref('');
const links = ref<SharedUrlDBInfo[]>([]);
const loggedIn = ref(false);
const messages = reactive({ error: '' });

onMounted(() => {
  props.providerManager.isLoggedIn().then((isLoggedIn) => {
    loggedIn.value = isLoggedIn;
  });
  updateLinks();
});

function toggleLogin() {
  if (loggedIn.value) {
    settings.disableDatabaseProvider(props.providerManager);
    props.providerManager.logout().then(() => {
      loggedIn.value = false;
    });
  } else {
    props.providerManager.login().then(() => {
      loggedIn.value = true;
    });
  }
}

function updateLinks() {
  return props.providerManager.getUrls().then((urls) => {
    links.value = urls;
  });
}

function removeLink(index?: number) {
  if (index !== undefined && index >= 0) {
    props.providerManager.removeUrl(links.value[index]).then(() => updateLinks());
  }
}

function addLink() {
  if (!currentUrl.value || !currentUrlTitle.value) {
    messages.error = 'Link or Title Missing';
    return;
  }

  const parsed = parseUrl(currentUrl.value);
  if (!parsed || !parsed.host || parsed.host === window.location.host) {
    messages.error = 'Link URL is not valid.';
    return;
  }
  if (parsed.pathname.charAt(parsed.pathname.length - 1) === '/') {
    messages.error =
      'URL must include file path. (eg. http://example.com is invalid, but http://example.com/file.ckp is valid.)';
    return;
  }

  let directLink: string;
  if (parsed.host === 'drive.google.com') {
    // Expected URL Structure is https://drive.google.com/file/d/FILE_ID/view?usp=sharing
    const id = parsed.pathname.split('/')[3];
    if (!id || !parsed.pathname.startsWith('/file/d/')) {
      messages.error =
        'Invalid Google Drive Shared Link. Expected format: https://drive.google.com/file/d/FILE_ID';
      return;
    }
    messages.error =
      'Google Drive Shared Links are no longer supported. Please use the Google Drive provider.';
    return;
  } else if (parsed.host.endsWith('.dropbox.com')) {
    directLink = parsed.href.replace('dl=0', 'dl=1');
  } else {
    directLink = parsed.href;
  }

  // go ahead and request permissions.  There isn't a good way to ask from the popup screen...
  messages.error = '';
  busy.value = true;
  browser.permissions
    .request({ origins: [directLink] })
    .then(() =>
      props.providerManager.addUrl({ direct_link: directLink, title: currentUrlTitle.value })
    )
    .then(() => updateLinks())
    .then(() => {
      // on accepted
      busy.value = false;
    })
    .catch((reason) => {
      // on rejected
      busy.value = false;
      messages.error = reason.message;
    });
}
</script>

<template>
  <div class="box-bar roomy database-manager">
    <generic-provider-ui
      :busy="busy"
      :databases="links"
      :logged-in="loggedIn"
      :error="messages.error"
      :provider-manager="providerManager"
      :toggle-login="toggleLogin"
      :removeable="true"
      :remove-function="removeLink"
    />
    <ul class="examples">
      <li>
        <b>Dropbox URL Example</b>
        https://www.dropbox.com/scl/fi/FILE_ID/filename.kdbx?rlkey=&st=&dl=1
      </li>
      <li><b>Google Drive and OneDrive</b> shared links no longer work</li>
      <li>
        Other clould provider shared links will likely not work, but direct HTTP file links will.
      </li>
    </ul>
    <div v-if="loggedIn" class="url-form shared-link-box">
      <input id="shared-link" v-model="currentUrl" type="text" placeholder="Shared Link URL" />
      <input
        id="shared-link-name"
        v-model="currentUrlTitle"
        type="text"
        placeholder="Database Name"
      />
      <a class="waves-effect waves-light btn" @click="addLink">Add URL Source</a>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import '../styles/settings.scss';
.examples {
  font-size: 13px;
}
.url-form {
  margin-top: 15px;
  &.shared-link-box {
    display: flex;
    justify-content: space-between;
    align-content: stretch;
    input {
      width: 25%;
      margin-right: 8px;
      margin-bottom: 5px;
    }
    input#shared-link {
      width: 48%;
    }
  }
}
</style>
