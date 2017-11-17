<template>
  <div class="entry-list-item">
    <div class="text-info">
      <span class="header">{{ header }}</span>
      <br>
      <span class="user">{{ user || '&#60;empty&#62;' }}</span>
    </div>
    <div class="buttons">
      <span class="fa-stack autofill">
        <i class="fa fa-circle fa-stack-2x"></i>
        <i class="fa fa-clipboard fa-stack-1x fa-inverse"></i>
      </span>
      <span class="fa-stack copy">
        <i class="fa fa-circle fa-stack-2x"></i>
        <i class="fa fa-magic fa-stack-1x fa-inverse"></i>
      </span>
    </div>
  </div>
</template>
`
<script>
export default {
  props: {
    user: String,
    url: String,
    title: String
  },
  computed: {
    header: function() {
      if (this.title.length > 0) 
        return this.title
      return this.url
    }
  },
  methods: {
    parseUrl(url) {
      url = url.indexOf('http') < 0 ? 'http://' + url : url
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
  border-bottom: 1px solid $light-gray;
  background-color: #FFF;
  display: flex;
  justify-content: space-between;
  box-sizing: border-box;

  .header {
    font-size: 16px;
  }
  .user {
    font-size: 12px;
  }

  .text-info {
    width: 78%;
  }
  .buttons {
    font-size: 18px;
    display:flex;
    justify-content: space-between;
    box-sizing: border-box;
    width: 22%;
  }
  .copy, .autofill {
    opacity: .2;
  }
  .copy:hover, .autofill:hover {
    opacity: .8;
    cursor: pointer;
  }
}
</style>