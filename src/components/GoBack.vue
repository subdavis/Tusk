<template>
  <div class="go-back-bar">
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

.go-back-bar {
  width: 100%;
  box-sizing: border-box;
  padding: $wall-padding;
  background-color: $background-color;
  border-bottom: 1px solid $light-gray;
  font-size: 18px;
}

.go-back-bar:hover {
  cursor: pointer;
}
</style>