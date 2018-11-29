<script>
const OTP = require('keeweb/app/scripts/util/otp.js')
import {
	mapMutations,
	mapState,
	mapGetters
} from 'vuex'
import { parseUrl } from '$lib/utils.js'
import {
	ENTRY_GET,
	DECRYPTED_ATTRIBUTE_GET
} from '@/store/modules/database'
import GoBack from '@/components/GoBack'
const HIDDEN_VAL = '••••••••••••'

export default {
	components: {
		GoBack
	},
	props: {
		links: {
			type: Object,
			required: true,
		},
		autofill: {
			type: Object,
			required: true,
		},
	},
	data() {
		return {
			attributes: [],
			// OTP
			otp: false,
			otp_timeleft: 0,
			otp_loop: undefined,
			otp_value: '',
			otp_width: 0
		}
	},
	methods: {
		exposeAttribute(attr) {
			attr.value = this.getDecryptedAttribute(this.entry, attr.key)
			attr.isHidden = false
		},
		hideAttribute(attr) {
			attr.value = HIDDEN_VAL
			attr.isHidden = true
		},
		toggleAttribute(attr) {
			if (attr.isHidden)
				this.exposeAttribute(attr)
			else
				this.hideAttribute(attr)
		},
		setupOTP(url) {
			let otpobj = OTP.parseUrl(url)
			this.otp = true
			let do_otp = () => {
				otpobj.next((code, timeleft) => {
					this.otp_value = code;
					this.otp_timeleft = (timeleft / 1000) | 0;
					this.otp_width = Math.floor(timeleft / 300) + "%"
				})
			}
			this.otp_loop = setInterval(do_otp, 2000)
			do_otp()
		},
	},
	beforeDestroy() {
		clearInterval(this.otp_loop)
	},
	mounted() {
		let entry = this.entry
		let attributes = entry.keys.map(key => {
			const val = entry[key]
			// Should NOT be succeptible to XSS
			const returnMap = {
				key: key,
				value: (val || '').replace(/\n/g, "<br>")
			}
			switch (key) {
				case 'url':
					let parsed = parseUrl(val)
					if (parsed !== null) {
						returnMap['href'] = parsed.href
					}
					break;
				case 'notes':
					returnMap['value'] = val
					break;
			}
			return returnMap;
		})
		for (const protectedKey in entry.protectedData) {
			if (protectedKey === "otp") {
				const url = this.getDecryptedAttribute(entry, protectedKey)
				this.setupOTP(url)
			} else {
				attributes.push({
					'key': protectedKey,
					'value': HIDDEN_VAL,
					'isHidden': true,
					'protected': true,
					'protectedAttr': entry.protectedData[protectedKey],
				})
			}
		}
		this.attributes = attributes;
	},
	computed: {
		...mapGetters({
			getEntry: ENTRY_GET,
			getDecryptedAttribute: DECRYPTED_ATTRIBUTE_GET,
		}),
		...mapState({
			database: 'database',
			ui: 'ui',
		}),
		entry() {
			const entry_id = this.$router.currentRoute.params.entry_id
			return this.getEntry(entry_id)
		},
	},
}
</script>

<template lang="pug">
.entry-details
	go-back(message="back to entry list")
	.box-bar.nopad.all-attributes
		.attribute-box(v-if='otp')
			span.attribute-title One Time Password
			//- br
			span.attribute-value {{otp_value}}
			.progress
				.determinate(v-bind:style="{ width: otp_width }")
		.attribute-box(
				v-for="attr in attributes",
				v-if="attr.protected || attr.value")
			span.attribute-title {{ attr.key }}
			br
			// notes
			pre.attribute-value(v-if="attr.key === 'notes'") {{ attr.value }}
			// URL
			span.attribute-value(v-else-if="attr.key === 'url'")
				a(@click="links.open(attr.href)", href="javascript:void(0)") {{ attr.value }}
			// other
			span.attribute-value(v-else-if='!attr.protected') {{ attr.value }}
			// protected
			div(v-else='')
				span.attribute-value.protected(v-if="attr.key !== 'notes'", @click='toggleAttribute(attr)')
					i.fa.fa-eye-slash(v-if='attr.protected && attr.isHidden', aria-hidden='true')
					i.fa.fa-eye(v-else-if='attr.protected && !attr.isHidden', aria-hidden='true')
					|  {{ attr.value }}
	.attribute-box.button-box
		.button-inner.selectable(v-on:click.stop="autofill.copyPassword(entry)")
			span.fa-stack.copy
				i.fa.fa-circle.fa-stack-2x
				i.fa.fa-clipboard.fa-stack-1x.fa-inverse
			=" "
			| Copy to clipboard
		.button-inner.selectable(v-on:click.stop="autofill.autofill(entry)")
			span.fa-stack.copy
				i.fa.fa-circle.fa-stack-2x
				i.fa.fa-magic.fa-stack-1x.fa-inverse
			=" "
			| Autofill
</template>

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

.button-box {
	font-size: 14px;
	display: flex;
	// justify-content: space-between;
	box-sizing: border-box;
	// min-width: 80px;
	.button-inner {
		flex: 0 0 50%;
		&:hover span {
			opacity: 0.8;
		}
	}
	span {
		opacity: 0.2;
	}
}
</style>