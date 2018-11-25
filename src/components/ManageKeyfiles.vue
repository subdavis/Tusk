<script>
import {
	KEY_FILE_GET,
	KEY_FILE_ADD,
	KEY_FILE_DELETE,
	KEY_FILE_DELETE_ALL,
} from '@/store/modules/settings'
import { mapMutations, mapState } from 'vuex'
import Messenger from './Messenger'
import { KeyFileParser } from '$services/keyFileParser.js'
import { generateSettingsAdapter } from '@/store/modules/settings'

export default {
	components: {
		Messenger
	},
	data() {
		return {
			keyFileParser: new KeyFileParser(),
			messages: {
				error: ''
			},
			settings: generateSettingsAdapter(this.$store),
		}
	},
	computed: {
		...mapState({
			keyFiles: (state) => state.settings.keyFiles,
		}),
	},
	methods: {
		...mapMutations({
			removeKeyFile: KEY_FILE_DELETE,
			addKeyFile: KEY_FILE_ADD,
			removeAllKeyFiles: KEY_FILE_DELETE_ALL,
		}),
		selectFileInput() {
			document.getElementById('file').click();
		},
		handleAdd(event) {
			const files = event.target.files
			this.messages.error = ''
			for (var i = 0; i < files.length; i++) {
				const reader = new FileReader()
				const fp = files[i]
				reader.onload = async (e) => {
					try {
						const keyFile = await this.keyFileParser.getKeyFromFile(e.target.result);
						this.addKeyFile({
							name: fp.name,
							encodedKey: keyFile,
						})
					} catch (err) {
						this.messages.error = err.messages
						throw err
					}
				};
				reader.readAsArrayBuffer(fp)
			}
		}
	},
}
</script>

<template lang="pug">
#key-file-manager
  .box-bar.about.roomy
    p
      | Key files are an
      b optional authentication method.
      | More info on key files is available on the
      a(href='http://keepass.info/help/base/keys.html#keyfiles', target='_blank') KeePass site
    p
      | Tusk can store your key files locally in your browser's storage, and apply them when opening your password database. Websites and other browser extensions do not have access to these files. However, they are
      b stored unencrypted
      |  in your local browser profile and someone with access to your device could read them.

    input#file(multiple='',
				type='file',
				style='display:none;',
				name='file',
				@change='handleAdd')
    a.waves-effect.waves-light.btn(@click='selectFileInput') Add Key File
    messenger(:messages="messages")
  .box-bar.roomy.small.lighter(
			v-for='(file, file_index) in keyFiles',
			:key='`${file_index}-list-item`')
    span
      | {{ file.name }}
      i.fa.fa-times-circle.selectable(@click='removeKeyFile(file)', aria-hidden='true')
</template>

<style lang="scss" scoped>
@import "../styles/settings.scss";
#key-file-manager {
  span {
    font-weight: 500;
  }
}
</style>
