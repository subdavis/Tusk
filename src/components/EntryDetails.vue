<script>
const OTP = require('keeweb/app/scripts/util/otp.js')
import { parseUrl } from '$lib/utils.js'
import GoBack from '@/components/GoBack'

export default {
	components: {
		GoBack
	},
	props: {
		unlockedState: Object,
		settings: Object,
		links: Object
	},
	data() {
		return {
			attributes: [],
			hiddenValue: '••••••••••••',
			// OTP
			otp: false,
			otp_timeleft: 0,
			otp_loop: undefined,
			otp_value: "",
			otp_width: 0
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
		autofill(e) {
			e.stopPropagation()
			console.log("autofill")
			this.unlockedState.autofill(this.entry);
		},
		copy(e) {
			e.stopPropagation()
			console.log("copy")
			this.unlockedState.copyPassword(this.entry);
		}
	},
	beforeDestroy() {
		clearInterval(this.otp_loop)
	},
	mounted() {
		let entryId = this.$router.getRoute().entryId
		this.entry = this.unlockedState.cacheGet('allEntries').filter(entry => {
			return entry.id == entryId
		})[0]
		this.attributes = this.entry.keys.map(key => {
			// Should NOT be succeptible to XSS
			let returnMap = {
				key: key,
				value: (this.entry[key] || "").replace(/\n/g, "<br>")
			}
			switch (key) {
				case 'url':
					let parsed = parseUrl(this.entry[key])
					if (parsed !== null) {
						returnMap['href'] = parsed.href
					}
					break;
				case 'notes':
					returnMap['value'] = this.entry[key]
					break;
			}
			return returnMap;
		})
		for (var protectedKey in this.entry.protectedData) {
			if (protectedKey === "otp") {
				let url = this.unlockedState.getDecryptedAttribute(this.entry, protectedKey)
				this.setupOTP(url)
			} else {
				this.attributes.push({
					'key': protectedKey,
					'value': this.hiddenValue,
					'isHidden': true,
					'protected': true,
					'protectedAttr': this.entry.protectedData[protectedKey]
				})
				// some keepass programs (e.g. keepassxc) store TOTP params in
				// "TOTP Seed" & "TOTP Settings" (tOTPSeed & tOTPSettings) instead of the otp URL
				// in this case, we also want to display the computed TOTP value
				if (protectedKey === "tOTPSeed" && "tOTPSettings" in this.entry) {
					let otpSettings = this.entry["tOTPSettings"].split(';')
					let otpSeed = this.unlockedState.getDecryptedAttribute(this.entry, protectedKey)
					if (otpSettings.length >= 2) {
						this.setupOTP(OTP.makeUrl(otpSeed , otpSettings[0], otpSettings[1]))
					}
				}
			}
		}
	}
}
</script>

<template>
	<div>
		<go-back :message="'back to entry list'"></go-back>
		<div class="box-bar nopad all-attributes">

			<div v-if="otp" class="attribute-box">
				<span class="attribute-title">One Time Password</span>
				<br>
				<span class="attribute-value">{{otp_value}}</span>
				<div class="progress">
					<div class="determinate" v-bind:style="{ width: otp_width }"></div>
				</div>
			</div>

			<div class="attribute-box" v-for="attr in attributes" v-if="attr.protected || attr.value">
				<span class="attribute-title">{{ attr.key }}</span>
				<br>
				<!-- notes -->
				<pre v-if="attr.key === 'notes'" class="attribute-value">{{ attr.value }}</pre>
				<!-- URL -->
				<span v-else-if="attr.key === 'url'" class="attribute-value">
					<a @click="links.open(attr.href)" href="javascript:void(0)">{{ attr.value }}</a>
				</span>
				<!-- other -->
				<span v-else-if="!attr.protected" class="attribute-value">{{ attr.value }}</span>
				<!-- protected -->
				<div v-else>
					<span v-if="attr.key !== 'notes'" class="attribute-value protected" @click="toggleAttribute(attr)">
						<i v-if="attr.protected && attr.isHidden" class="fa fa-eye-slash" aria-hidden="true"></i>
						<i v-else-if="attr.protected && !attr.isHidden" class="fa fa-eye" aria-hidden="true"></i>
						{{ attr.value }}
					</span>
				</div>
			</div>

		</div>
		<div class="attribute-box button-box">
			<div class="button-inner selectable" v-on:click="copy">
				<span class="fa-stack copy">
					<i class="fa fa-circle fa-stack-2x"></i>
					<i class="fa fa-clipboard fa-stack-1x fa-inverse"></i>
				</span> Copy to clipboard
			</div>
			<div class="button-inner selectable" v-on:click="autofill">
				<span class="fa-stack copy">
					<i class="fa fa-circle fa-stack-2x"></i>
					<i class="fa fa-magic fa-stack-1x fa-inverse"></i>
				</span> Autofill
			</div>
		</div>
	</div>
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