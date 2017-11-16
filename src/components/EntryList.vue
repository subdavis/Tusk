<template>
  <div>
    <div class="search">
      <i class="fa fa-search"></i>
      <input ref="searchbox" type='search' v-bind="searchTerm" placeholder="search..." />
    </div>
    <div class="entries" v-if="priorityEntries">
      <entry-list-item v-for="entry in priorityEntries" 
        :key="entry.id"
        :user="entry.userName"
        :url="entry.url"
        :title="entry.title">
      </entry-list-item>
    </div>
    <div class="entries" v-else-if="entries.length > 0">
      <entry-list-item v-for="entry in entries" 
        :key="entry.id"
        :user="entry.userName"
        :url="entry.url"
        :title="entry.title">
      </entry-list-item>
    </div>
  </div>
</template>

<script>
import EntryListItem from '@/components/EntryListItem'

export default {
  props: {
    priorityEntries: Array,
    entries: Array
  },
  components: {
    EntryListItem
  },
  data () {
    return {
      searchTerm: ""
    }
  },
  mounted () {
    this.$nextTick(function() {
      this.$refs.searchbox.focus();
    })
  }
}
</script>

<style lang="scss">
@import "../styles/settings.scss";

.search {

  width: 100%;
  padding: $wall-padding;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  border-bottom: 1px solid $dark-gray;
  
  input {
    float: right;
    width: 96%;
    border: 0px;
    padding: 0px;
    padding-left: 5px;
    font-size: 22px;
  }
  input:focus  {
    outline:none;
  }

  .fa {
    width: 4%;
    font-size: 15px;
  }
}
</style>