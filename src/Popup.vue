<template lang="pug">
#router-view
	svg-defs
	router-view
</template>

<script>
import SvgDefs from '@/components/SvgDefs'

export default {
	name: 'app',
	components: {
		SvgDefs,
	},
}
</script>

<style lang="scss">
@import "./styles/shared.scss";
#router-view {
  width: 375px;
  margin: 0px;
  color: $text-color;
  background-color: $background-color;
}

body {
  margin: 0px;
  width: 100%;
}
</style>
