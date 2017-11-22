<template>
  <div class="box-bar medium between">
    <span class="selectable">
    	<i class="fa fa-cog" aria-hidden="true"></i> Settings</span>
    <span class="selectable" v-if="isUnlocked()" @click="lock">
    	<i class="fa fa-lock" aria-hidden="true" ></i> Lock Database</span>
    <span class="selectable" v-else>
    	<i class="fa fa-times-circle" aria-hidden="true"></i> Close Window</span>
    <span class="selectable">
    	<i class="fa fa-info-circle" aria-hidden="true"></i> v{{ version }}</span>
  </div>
</template>

<script>
export default {
	props: {
		isUnlocked: Function,
		lock: Function
	},
	data () {
		return {
			version: chrome.runtime.getManifest().version
		}
	}
}
</script>

<style lang="scss">
@import "../styles/settings.scss";
</style>