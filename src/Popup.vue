<template>
  <div id="app">
    <info-cluster></info-cluster>
    <!-- Router View -->
    <unlock id="/unlock"></unlock>
  </div>
</template>

<script>
import Unlock from '@/components/Unlock'
import InfoCluster from '@/components/InfoCluster'

export default {
  name: 'app',
  components: {
    Unlock,
    InfoCluster
  },
  data () {
    return {}
  },
  mounted: function () {
    
    this.$router.route('/unlock')
  }
}
</script>

<style lang="scss">
#app {
  width: 450px;
  margin: 0px auto;
  color: #2c3e50;
}

body {
  margin: 0px;
  width: 100%;
}
</style>
