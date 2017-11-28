<template>
  <div id="key-file-manager">
  	<div class="box-bar about roomy">
  		<p>Key files are an <b>optional authentication method</b>.  More info on key files is available on the <a href="http://keepass.info/help/base/keys.html#keyfiles" target="_blank">KeePass site</a>
  		<p>CKPX can store your key files locally in Chrome storage, and apply them when opening your password database.  Websites and other Chrome extensions do not have access to these files.  However, they are <b>stored unencrypted</b> in your local Chrome profile and someone with access to your device could read them.</p>
  	</div>
  	<div v-for="(file, file_index) in keyFiles" class="box-bar roomy">
  		<span>{{ file.name }} <i @click="removeKeyFile(file_index)" class="fa fa-times-circle selectable" aria-hidden="true"></i></span>
  	</div>
  </div>
</template>

<script>
export default {
	props: {
		settings: Object
	},
	data () {
		return {
			keyFiles: []
		}
	},
	methods: {
		loadKeyFiles () {
			this.settings.getKeyFiles().then(keyFiles => {
				this.keyFiles = keyFiles;
			})
		},
		removeKeyFile (index) {
			if (index >= 0 && index < this.keyFiles.length){
				let kf = this.keyFiles[index]
				this.settings.deleteKeyFile(kf.name).then(nil => {
		      this.loadKeyFiles();
		    })		
			}
		},
		handleUpload () {

		}
	},
	mounted () {
		this.loadKeyFiles()
	}
}

/*
//---keyfile upload starts...
  $scope.selectFile = function() {
    document.getElementById('file').click();
  };

  $scope.handleKeyFile = function(filePromises) {
    $scope.errorMessage = "";
    if (filePromises.length != 1) {
      return;
    }

    filePromises[0].then(function(info) {
      return keyFileParser.getKeyFromFile(info.data).then(function(key) {
        return settings.addKeyFile(info.file.name, key);
      }).then(function() {
        loadKeyFiles();
      });
    }).catch(function(err) {
      $scope.errorMessage = err.message;
      $scope.$apply();
    });
  }
  //---keyfile upload ends...

}
*/
</script>

<style lang="scss">
@import "../styles/settings.scss";
</style>