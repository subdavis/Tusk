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
		<a
			class="btn" @click="showPicker" v-show="!pickerOpen">launch picker
		</a>
		<iframe
			id="pickerFrame"
			v-show="pickerOpen"
			style="width: 100%; height: 480px; border: 4px solid gray;"
			src="http://localhost:8081/sandbox-picker.html">
		</iframe>
	</div>
</template>