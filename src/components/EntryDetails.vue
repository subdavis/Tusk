<template>
	<div>
		<go-back :message="'back to entry list'"></go-back>
		<div class="all-attributes">
			<div class="attribute-box" v-for="attr in attributes">

				<span class="attribute-title">{{ attr.key }}</span>
				<br>
				<pre v-if="attr.key == 'notes'" class="attribute-value">{{ attr.value }}</pre>
				<span v-else-if="!attr.protected" class="attribute-value">{{ attr.value }}</span>
				<div v-else>
					<span v-if="attr.key !== 'notes'" class="attribute-value protected" @click="toggleAttribute(attr)">
            <i v-if="attr.protected && attr.isHidden" 
              class="fa fa-eye-slash" aria-hidden="true"></i>
            <i v-else-if="attr.protected && !attr.isHidden"
              class="fa fa-eye" aria-hidden="true"></i>
            {{ attr.value }}
            </span>
				</div>

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
		data() {
			return {
				attributes: [],
				hiddenValue: '••••••••••'
			}
		},
		methods: {
			exposeAttribute(attr) {
				attr.value = this.unlockedState.getDecryptedAttribute(this.entry, attr.key)
				attr.isHidden = false
			},
			hideAttribute(attr) {
				attr.value = this.hiddenValue;
				attr.isHidden = true
			},
			toggleAttribute(attr) {
				if (attr.isHidden)
					this.exposeAttribute(attr)
				else
					this.hideAttribute(attr)
			}
		},
		mounted() {
			let entryId = this.$router.getRoute().entryId
			this.entry = this.unlockedState.cacheGet('allEntries').filter(entry => {
				return entry.id == entryId
			})[0]
			this.attributes = this.entry.keys.map(key => {
				// Should NOT be succeptible to XSS
				let value = key !== 'notes' ?
					(this.entry[key] || "").replace(/\n/g, "<br>") :
					this.entry[key]
				return {
					'key': key,
					'value': value
				}
			})
			for (var protectedKey in this.entry.protectedData) {
				this.attributes.push({
					'key': protectedKey,
					'value': this.hiddenValue,
					'isHidden': true,
					'protected': true,
					'protectedAttr': this.entry.protectedData[protectedKey]
				})
			}
		}
	}
</script>

<style lang="scss">
	@import "../styles/settings.scss";
	.all-attributes {
		max-height: 400px;
		overflow-y: auto;
	}

	.attribute-box {
		box-sizing: border-box;
		padding: 8px $wall-padding;
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
		&.protected:hover {
			outline: $light-gray solid 2px;
			outline-offset: 1px;
		}
	}
</style>