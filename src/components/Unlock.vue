<template>
  <div>
  	<input type="text">
	<select>
		<option>No keyfile</option>
	</select>
	<button v-on:click="$router.route('/fee')">Unlock</button>
  </div>
</template>

<script>
export default {
  data () {
    return {}
  }
}
</script>

<style lang="scss">
input, select, button {
	width: 100%;
	margin: 10px 0px 0px 0px;
}
</style>