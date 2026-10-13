<script setup lang="ts">
import { inject, onBeforeUnmount, onMounted, ref } from 'vue';
import { Otp } from '@/lib/otp';
import { parseUrl } from '@/lib/utils';
import { AppServicesKey } from '@/composables/useAppServices';
import { RouterKey } from '@/composables/useRouter';
import GoBack from '@/components/GoBack.vue';
import type { Entry, ProtectedValueJSON } from '$services/types';

interface Attribute {
  key: string;
  value: string;
  href?: string;
  isHidden?: boolean;
  protected?: boolean;
  protectedAttr?: ProtectedValueJSON;
}

const { unlockedState, links } = inject(AppServicesKey)!;
const router = inject(RouterKey)!;

const hiddenValue = '••••••••••••';
const attributes = ref<Attribute[]>([]);
const otp = ref(false);
const otpValue = ref('');
const otpWidth = ref('0%');
let otpLoop: ReturnType<typeof setInterval> | undefined;
let entry: Entry;

function setupOTP(url: string) {
  const otpobj = Otp.parseUrl(url);
  otp.value = true;
  const doOtp = () => {
    otpobj.next((_err, code, timeleft) => {
      otpValue.value = code ?? '';
      otpWidth.value = Math.floor((timeleft ?? 0) / 300) + '%';
    });
  };
  otpLoop = setInterval(doOtp, 1000);
  doOtp();
}

function exposeAttribute(attr: Attribute) {
  attr.value = unlockedState.getDecryptedAttribute(entry, attr.key);
  attr.isHidden = false;
}

function hideAttribute(attr: Attribute) {
  attr.value = hiddenValue;
  attr.isHidden = true;
}

function toggleAttribute(attr: Attribute) {
  if (attr.isHidden) exposeAttribute(attr);
  else hideAttribute(attr);
}

function autofill(e: MouseEvent) {
  e.stopPropagation();
  console.debug('autofill');
  unlockedState.autofill(entry);
}

function copy(e: MouseEvent) {
  e.stopPropagation();
  console.debug('copy');
  unlockedState.copyPassword(entry);
}

onBeforeUnmount(() => clearInterval(otpLoop));

onMounted(() => {
  const entryId = router.getRoute()?.params.entryId;
  const found = (unlockedState.cacheGet<Entry[]>('allEntries') ?? []).find((e) => e.id == entryId);
  if (!found) return;
  entry = found;

  attributes.value = entry.keys.map((key) => {
    // Should NOT be susceptible to XSS
    const attr: Attribute = {
      key,
      value: ((entry[key] as string) || '').replace(/\n/g, '<br>'),
    };
    switch (key) {
      case 'url': {
        const parsed = parseUrl(entry[key] as string);
        if (parsed !== null) {
          attr.href = parsed.href;
        }
        break;
      }
      case 'notes':
        attr.value = entry[key] as string;
        break;
    }
    return attr;
  });

  for (const protectedKey in entry.protectedData) {
    if (protectedKey === 'otp') {
      const url = unlockedState.getDecryptedAttribute(entry, protectedKey);
      setupOTP(url);
    } else {
      attributes.value.push({
        key: protectedKey,
        value: hiddenValue,
        isHidden: true,
        protected: true,
        protectedAttr: entry.protectedData[protectedKey],
      });
      // some keepass programs (e.g. keepassxc) store TOTP params in
      // "TOTP Seed" & "TOTP Settings" (tOTPSeed & tOTPSettings) instead of the otp URL
      // in this case, we also want to display the computed TOTP value
      if (protectedKey === 'tOTPSeed' && 'tOTPSettings' in entry) {
        const otpSettings = (entry['tOTPSettings'] as string).split(';');
        const otpSeed = unlockedState.getDecryptedAttribute(entry, protectedKey);
        if (otpSettings.length >= 2) {
          setupOTP(Otp.makeUrl(otpSeed, otpSettings[0], otpSettings[1]));
        }
      }
    }
  }
});
</script>

<template>
  <div>
    <go-back :message="'back to entry list'" />
    <div class="box-bar nopad all-attributes">
      <div v-if="otp" class="attribute-box">
        <span class="attribute-title">One Time Password</span>
        <br />
        <span class="attribute-value">{{ otpValue }}</span>
        <div class="progress">
          <div
            :key="otpValue"
            class="determinate"
            style="transition: width 1s linear"
            :style="{ width: otpWidth }"
          />
        </div>
      </div>

      <div v-for="attr in attributes" :key="attr.key" class="attribute-box">
        <template v-if="attr.protected || attr.value">
          <span class="attribute-title">{{ attr.key }}</span>
          <br />
          <!-- notes -->
          <pre v-if="attr.key === 'notes'" class="attribute-value">{{ attr.value }}</pre>
          <!-- URL -->
          <span v-else-if="attr.key === 'url'" class="attribute-value">
            <a href="javascript:void(0)" @click="links.open(attr.href!)">{{ attr.value }}</a>
          </span>
          <!-- other -->
          <span v-else-if="!attr.protected" class="attribute-value">{{ attr.value }}</span>
          <!-- protected -->
          <div v-else>
            <span
              v-if="attr.key !== 'notes'"
              class="attribute-value protected"
              @click="toggleAttribute(attr)"
            >
              <i
                v-if="attr.protected && attr.isHidden"
                class="fa fa-eye-slash"
                aria-hidden="true"
              />
              <i
                v-else-if="attr.protected && !attr.isHidden"
                class="fa fa-eye"
                aria-hidden="true"
              />
              {{ attr.value }}
            </span>
          </div>
        </template>
      </div>
    </div>
    <div class="attribute-box button-box">
      <div class="button-inner selectable" @click="copy">
        <span class="fa-stack copy">
          <i class="fa fa-circle fa-stack-2x" />
          <i class="fa fa-clipboard fa-stack-1x fa-inverse" />
        </span>
        Copy to clipboard
      </div>
      <div class="button-inner selectable" @click="autofill">
        <span class="fa-stack copy">
          <i class="fa fa-circle fa-stack-2x" />
          <i class="fa fa-magic fa-stack-1x fa-inverse" />
        </span>
        Autofill
      </div>
    </div>
  </div>
</template>

<style lang="scss">
@import '../styles/settings.scss';

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
  font-family: 'DejaVu Sans', Arial, sans-serif;

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
