<template>
  <div>
    <go-back :message="'back to entry list'"></go-back>
    <div class="all-attributes">
      <div class="attribute-box" v-for="attr in attributes">
        <span class="attribute-title">{{ attr.key }}</span>
        <br>
        <pre v-if="attr.key == 'notes'" class="attribute-value">{{ attr.value }}</pre>
        <span v-else class="attribute-value">{{ attr.value }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import GoBack from '@/components/GoBack'

export default {
  components: {
    GoBack
  },
  props: {
    unlockedState: Object,
    settings: Object
  },
  data () {
    return {
      attributes: []
    }
  },
  methods: {
    exposeAttribute (attr) {
      attr.value = unlockedState.getDecryptedAttribute(this.entry, attr.key)
    }
  },
  mounted () {
    let entryId = this.$router.getRoute().entryId
    this.entry = this.unlockedState.cache.allEntries.filter(entry => {
      return entry.id == entryId
    })[0]
    this.attributes = this.entry.keys.map(key => {
      let value = key !== 'notes' 
        ? (this.entry[key] || "").replace(/\n/g, "<br>") 
        : this.entry[key]
      return {
        'key': key,
        'value': value
      }
    })
    for (var protectedKey in this.entry.protectedData) {
      this.attributes.push({
        'key': protectedKey,
        'value': '',
        'protected': true,
        'protectedAttr': this.entry.protectedData['protectedKey']
      })
    }
  }
}
</script>

<style lang="scss">
@import "../styles/settings.scss";

.all-attributes {
  max-height: 450px;
  overflow-y: auto;
}
.attribute-box {
  box-sizing: border-box;
  padding: $wall-padding;
  font-size: 16px;
  background-color: $light-background-color;
}
.attribute-title {
  padding-bottom: 10px;
  font-weight: 700;
  font-size: 12px;
}
.attribute-value {
  font-family: "DejaVu Sans", Arial, sans-serif;
}
</style>