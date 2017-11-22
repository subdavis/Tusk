<template>
  <div class="box-bar selectable">
    <span v-on:click="$router.goBack">
      <i class="fa fa-long-arrow-left" aria-hidden="true"></i>
      {{ message }}
    </span>
  </div>
</template>

<script>
export default {
	props: {
		message: String
	}
}
</script>

<style lang="scss">
@import "../styles/settings.scss";
</style>