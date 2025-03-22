<script>
import {
	ChromePromiseApi
} from '@/lib/chrome-api-promise.js'
import { manifest } from 'webextension-polyfill';
const chromePromise = ChromePromiseApi()

export default {
	props: {
		settings: Object,
		googleDriveManager: Object,
	},
	data() {
		return {
			pickerOpen: false,
		}
	},
	methods: {
		showPicker() {
			this.pickerOpen = true;
			chromePromise.runtime.getManifest().then((manifest) => {
				const APP_ID = manifest.static_data[this.googleDriveManager.key].client_id
				this.googleDriveManager.getToken().then(accessToken => {
					const iframe = document.getElementById("pickerFrame").contentWindow;
					iframe.postMessage({
						m: 'showPicker',
						accessToken: accessToken,
						appId: APP_ID,
					}, '*');
				});
			});
		},
	},
	mounted() {
		window.addEventListener(
			"message",
			(event) => {
				if (event.data.m === 'pickerResult') {
					console.info("Picker result", event)
					this.$parent.populate()
					this.pickerOpen = false;
				}
			},
			false,
		);
	}
}
</script>

<template>
	<div>
		<div class="warn pill">
			<p><b>Google Drive support has updated!</b> You can now grant Tusk access to each keepass file.
				<br>Having problems? <b><a href="https://github.com/subdavis/Tusk/wiki/Troubleshooting#google-drive-issues">Read
						the troubleshooting guide.</a></b>
			</p>
		</div>
		<div v-show="!pickerOpen" style="margin-top: 10px;">
			<a class="btn" @click="showPicker">
				Choose database file
			</a>
		</div>
		<iframe id="pickerFrame" v-show="pickerOpen" style="width: 100%; height: 480px; border: 4px solid gray;"
			src="https://subdavis.com/Tusk/sandbox-picker.html">
		</iframe>
	</div>
</template>