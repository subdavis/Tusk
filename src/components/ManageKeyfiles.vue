<script setup lang="ts">
import { inject, onMounted, ref } from 'vue';
import { AppServicesKey } from '@/composables/useAppServices';

const { settings, keyFileParser } = inject(AppServicesKey)!;

interface KeyFile {
  name: string;
  encodedKey: string;
}

const keyFiles = ref<KeyFile[]>([]);
const errorMessage = ref('');

function loadKeyFiles() {
  settings.getKeyFiles().then((kf) => {
    keyFiles.value = kf;
  });
}

function removeKeyFile(index: number) {
  if (index >= 0 && index < keyFiles.value.length) {
    const kf = keyFiles.value[index];
    settings.deleteKeyFile(kf.name).then(() => {
      loadKeyFiles();
    });
  }
}

function selectFileInput() {
  document.getElementById('file')?.click();
}

function handleAdd(event: Event) {
  const files = (event.target as HTMLInputElement).files;
  errorMessage.value = '';
  for (const fp of Array.from(files ?? [])) {
    const reader = new FileReader();
    reader.onload = (e) => {
      keyFileParser
        .getKeyFromFile(e.target?.result as ArrayBuffer)
        .then((key) => {
          settings.addKeyFile(fp.name, key).then(loadKeyFiles);
        })
        .catch((err) => {
          errorMessage.value = err.message;
        });
    };
    reader.readAsArrayBuffer(fp);
  }
}

onMounted(loadKeyFiles);
</script>

<template>
  <div id="key-file-manager">
    <div class="box-bar about roomy">
      <p>
        Key files are an
        <b>optional authentication method</b>. More info on key files is available on the
        <a href="http://keepass.info/help/base/keys.html#keyfiles" target="_blank">
          KeePass site
        </a>
      </p>
      <p>
        Tusk can store your key files locally in your browser's storage, and apply them when opening
        your password database. Websites and other browser extensions do not have access to these
        files. However, they are
        <b>stored unencrypted</b> in your local browser profile and someone with access to your
        device could read them.
      </p>
      <input id="file" multiple type="file" style="display: none" name="file" @change="handleAdd" />
      <a class="waves-effect waves-light btn" @click="selectFileInput">Add Key File</a>
      <p v-if="errorMessage" class="box-bar error white-text">
        {{ errorMessage }}
      </p>
    </div>
    <div
      v-for="(file, file_index) in keyFiles"
      :key="file.name"
      class="box-bar roomy small lighter"
    >
      <span
        >{{ file.name }}
        <i
          class="fa fa-times-circle selectable"
          aria-hidden="true"
          @click="removeKeyFile(file_index)"
        />
      </span>
    </div>
  </div>
</template>

<style lang="scss">
@import '../styles/settings.scss';
#key-file-manager {
  span {
    font-weight: 500;
  }
}
</style>
