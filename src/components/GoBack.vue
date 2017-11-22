<template>
  <div class="box-bar button">
    <span class="go-back" v-on:click="$router.goBack">
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