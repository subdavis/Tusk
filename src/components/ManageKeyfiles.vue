<script>
export default {
  props: {
    settings: Object,
    keyFileParser: Object,
  },
  data() {
    return {
      keyFiles: [],
      errorMessage: '',
    };
  },
  mounted() {
    this.loadKeyFiles();
  },
  methods: {
    loadKeyFiles() {
      this.settings.getKeyFiles().then((keyFiles) => {
        this.keyFiles = keyFiles;
      });
    },
    removeKeyFile(index) {
      if (index >= 0 && index < this.keyFiles.length) {
        let kf = this.keyFiles[index];
        this.settings.deleteKeyFile(kf.name).then((nil) => {
          this.loadKeyFiles();
        });
      }
    },
    selectFileInput() {
      document.getElementById('file').click();
    },
    handleAdd(event) {
      let files = event.target.files;
      this.errorMessage = '';
      for (var i = 0; i < files.length; i++) {
        let reader = new FileReader();
        let fp = files[i];
        reader.onload = (e) => {
          this.keyFileParser
            .getKeyFromFile(e.target.result)
            .then((key) => {
              this.settings.addKeyFile(fp.name, key).then(this.loadKeyFiles);
            })
            .catch((err) => {
              this.errorMessage = err.message;
            });
        };
        reader.readAsArrayBuffer(fp);
      }
    },
  },
};
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
    <div v-for="(file, file_index) in keyFiles" class="box-bar roomy small lighter">
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
