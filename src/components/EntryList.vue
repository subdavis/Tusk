<template>
  <div>
    <p v-for="entry in priorityEntries">{{ entry.userName }}</p>
  </div>
</template>

<script>
export default {
  props: {
    entries: Array,
    priorityEntries: Array,
  },
  data () {
    return {}
  }
}
</script>

<style lang="scss">
p {
	width: 100%;
	margin: 10px 0px 0px 0px;
}
</style>