<script setup lang="ts">
import { onMounted, ref } from 'vue';
import browser from 'webextension-polyfill';
import type { OauthFileManager } from '$services/oauthManager';

const props = defineProps<{
  googleDriveManager: OauthFileManager;
}>();

const emit = defineEmits<{
  picked: [];
}>();

const pickerOpen = ref(false);

onMounted(() => {
  window.addEventListener('message', (event) => {
    if (event.data.m === 'pickerResult') {
      console.info('Picker result', event);
      emit('picked');
      pickerOpen.value = false;
    }
  });
});

async function showPicker() {
  pickerOpen.value = true;
  const manifest = browser.runtime.getManifest() as unknown as {
    static_data: Record<string, { client_id: string }>;
  };
  const appId = manifest.static_data[props.googleDriveManager.key].client_id;
  const accessToken = await props.googleDriveManager.getToken();
  const iframe = (document.getElementById('pickerFrame') as HTMLIFrameElement).contentWindow;
  iframe?.postMessage({ m: 'showPicker', accessToken, appId }, '*');
}
</script>

<template>
  <div>
    <div class="warn pill">
      <p>
        <b>Google Drive support has updated!</b> You can now grant Tusk access to each keepass file.
        <br />Having problems?
        <b
          ><a href="https://github.com/subdavis/Tusk/wiki/Troubleshooting#google-drive-issues"
            >Read the troubleshooting guide.</a
          ></b
        >
      </p>
    </div>
    <div v-show="!pickerOpen" style="margin-top: 10px">
      <a class="btn" @click="showPicker"> Choose database file </a>
    </div>
    <iframe
      v-show="pickerOpen"
      id="pickerFrame"
      style="width: 100%; height: 480px; border: 4px solid gray"
      src="https://subdavis.com/Tusk/sandbox-picker.html"
    />
  </div>
</template>
