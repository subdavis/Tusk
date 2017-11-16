<template>
  <div class="entry-list-item">
    <span class="header">{{ header }}</span>
    <br>
    <span class="user">{{ user }}</span>
  </div>
</template>

<script>
export default {
  props: {
    user: String,
    url: String,
    title: String
  },
  computed: {
    header: function() {
      if (this.url.length > 0) 
        return this.parseUrl(this.url).hostname
      return this.title
    }
  },
  methods: {
    parseUrl(url) {
      let a = document.createElement('a')
      a.href = url
      return a
    }
  }
}
</script>

<style lang="scss">
@import "../styles/settings.scss";

.entry-list-item {
	width: 100%;
	padding: 10px $wall-padding;
  border-bottom: 1px solid $dark-gray;

  .header {
    font-size: 16px;
  }
  .user {
    font-size: 12px;
  }
}
</style>