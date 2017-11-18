<template>
  <div class="box-bar button">
    <span class="go-back" v-on:click="$router.goBack">
      <i class="fa fa-long-arrow-left" aria-hidden="true"></i>
      back to entry list
    </span>
  </div>
</template>

<script>
export default {
}
</script>

<style lang="scss">
@import "../styles/settings.scss";
</style>