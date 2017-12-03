<template>
  <!-- General Messages - Show these all the time -->
  <div>
    <div class="box-bar small warn" v-show="messages.warn">
      <span>{{ messages.warn }}</span></div>
    <div class="box-bar small error" v-show="messages.error">
      <span>{{ messages.error }}</span></div>
    <div class="box-bar small success" v-show="messages.success">
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