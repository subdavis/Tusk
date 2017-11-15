<template>
  <div>
    <div class="priority-entries">
      <p v-for="entry in priorityEntries">{{ entry.userName }}</p>
    </div>
    <div class="other-entries">
      <p v-for="entry in entries">{{ entry.userName }}</p>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    entries: Array,
    priorityEntries: Array,
  },
  computed: {
    firstTenEntries: function () {
      this.entris.slice(0, 10)
    } 
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