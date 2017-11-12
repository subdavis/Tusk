<template>
  <div>
  	<info-cluster></info-cluster>
  	<input type="text">
		<select>
			<option>No keyfile</option>
		</select>
		<button v-on:click="$router.route('/fee')">Unlock</button>
  </div>
</template>

<script>
import InfoCluster from '@/components/InfoCluster'

export default {
  props: {
    unlockedState: Object,
    secureCache: Object,
    settings: Object
  },
  data () {
    return {}
  },
  components: {
  	InfoCluster
  }
}
</script>

<style lang="scss">
input, select, button {
	width: 100%;
	margin: 10px 0px 0px 0px;
}
</style>