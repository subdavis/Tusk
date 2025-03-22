<!-- 
  Messenger:

  Displays given messages for warning, error, and success
 -->
<script>
export default {
  props: {
    messages: Object,
  },
};
</script>

<template>
  <div class="messenger">
    <div v-show="messages.warn" class="box-bar small warn">
      <span>
        <i class="fa fa-exclamation-triangle fa-fw dashicon" aria-hidden="true" />
        {{ messages.warn }}</span
      >
    </div>
    <div v-show="messages.error" class="box-bar small error">
      <span> <i class="fa fa-times-circle fa-fw" aria-hidden="true" /> {{ messages.error }}</span>
    </div>
    <div v-show="messages.success" class="box-bar small success">
      <span> <i class="fa fa-check fa-fw" aria-hidden="true" /> {{ messages.success }}</span>
    </div>
  </div>
</template>

<style lang="scss"></style>
