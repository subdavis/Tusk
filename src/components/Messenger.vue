<!-- 
  Messenger:

  Displays given messages for warning, error, and success
 -->
<template>
  <div class="messenger">
    <div class="box-bar small warn" v-show="messages.warn">
      <i class="fa fa-exclamation-triangle fa-fw fa-2x dashicon warn" aria-hidden="true"></i>
      <span>{{ messages.warn }}</span></div>
    <div class="box-bar small error" v-show="messages.error">
      <span>{{ messages.error }}</span></div>
    <div class="box-bar small success" v-show="messages.success">
      <i class="fa fa-check fa-fw fa-2x" aria-hidden="true"></i>
      <span>{{ messages.success }}</span></div>
  </div>
</template>

<script>
export default {
	props: {
		messages: Object
	}
}
</script>

<style lang="scss">
@import "../styles/settings.scss";
.messenger .fa {
  float: left;
  margin: 2px;
  margin-right: 4px;
  margin-left: -3px;
}
</style>