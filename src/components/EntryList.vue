<template>
  <div>
    <div class="search">
      <i class="fa fa-search"></i>
      <input ref="searchbox" type='search' v-model="searchTerm" placeholder="search entire database..." />
    </div>
    <messenger :messages="messages"></messenger>
    <div class="entries">
      <div v-if="priorityEntries && searchTerm.length == 0">
        <entry-list-item v-for="entry in priorityEntries" 
          :key="entry.id"
          :entry="entry">
        </entry-list-item>
      </div>
      <div v-if="filteredEntries && searchTerm.length">
        <entry-list-item v-for="entry in filteredEntries" 
          :key="entry.id"
          :entry="entry">
        </entry-list-item>
      </div>
    </div>
  </div>
</template>

<script>
import EntryListItem from '@/components/EntryListItem'
import Messenger from '@/components/Messenger'

export default {
  props: {
    priorityEntries: Array,
    allEntries: Array,
    messages: Object
  },
  watch: {
    searchTerm: function (val) {
      if (val.length)
        this.filteredEntries = this.allEntries.filter(entry => {
          let result = entry.filterKey.indexOf(val.toLocaleLowerCase())
          return (result > -1) 
        })
    }
  },
  components: {
    EntryListItem,
    Messenger
  },
  data () {
    return {
      searchTerm: "",
      filteredEntries: this.allEntries
    }
  },
  methods: {
    collectFilters (data, collector) {
      if (data === null || data === undefined)
        return data
      if (data.constructor == ArrayBuffer || data.constructor == Uint8Array)
        return null
      else if (typeof (data) === 'string')
        collector.push(data.toLocaleLowerCase())
      else if (data.constructor == Array)
        for(var i=0; i<data.length; i++)
          this.collectFilters(data[i], collector)
      else
        for(var prop in data)
          this.collectFilters(data[prop], collector)
    },
    createEntryFilters (entries) {
      entries.forEach(entry => {
        var filters = new Array()
        this.collectFilters(entry, filters)
        entry.filterKey = filters.join(" ")
      })
    }
  },
  mounted () {
    // Autofocus
    this.$nextTick(function() {
      this.$refs.searchbox.focus();
    })
    this.createEntryFilters(this.allEntries);
  }
}
</script>

<style lang="scss">
@import "../styles/settings.scss";

.entries {
  max-height: 450px;
  overflow-y: auto;
}

.search {

  width: 100%;
  padding: $wall-padding;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  border-bottom: 1px solid $light-gray;
  
  input {
    float: right;
    width: 96%;
    border: 0px;
    padding: 0px;
    padding-left: 10px;
    font-size: 18px;
    background-color: $background-color;
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