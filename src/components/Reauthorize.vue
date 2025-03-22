<script>
export default {
  props: {
    settings: Object,
    providers: Array,
  },
  data() {
    return {
      provider: {},
      done: false,
      fail: false,
    };
  },
  mounted() {
    let provider_key = this.$router.getRoute().provider;
    this.providers.forEach((p) => {
      if (p.key === provider_key) this.provider = p;
    });
  },
  methods: {
    launchAuth() {
      this.provider
        .login()
        .then((nil) => {
          this.done = true;
        })
        .catch((err) => {
          this.fail = true;
        });
    },
  },
};
</script>

<template>
  <div>
    <div class="box-bar roomy">
      <h4>Reauthorize {{ provider.title }}</h4>
      <p>
        The authorization token for {{ provider.title }} has expired and Tusk was unable to refresh
        it. Please reauthorize below to continue to use Tusk with your database from
        {{ provider.title }}.
      </p>
    </div>
    <div class="box-bar roomy lighter">
      <a class="waves-effect waves-light btn" @click="launchAuth">Authorize {{ provider.title }}</a>
    </div>
    <div v-if="done" class="box-bar roomy plain">
      <h4><i class="fa fa-check" aria-hidden="true" /> Success</h4>
      <p>
        You can
        <b>close this page</b> and continue to use Tusk by clicking on the popup icon.
      </p>
    </div>
    <div v-if="fail && !done" class="box-bar roomy plain">
      <h4><i class="fa fa-times" aria-hidden="true" /> Error</h4>
      <p>
        It looks like something went wrong during the re-authorization process. Please try again.
      </p>
    </div>
  </div>
</template>

<style lang="scss">
@import '../styles/settings.scss';
.json {
  font-size: 12px;
}

h4 {
  font-size: 24px;
}
</style>
