<!-- 
	OauthProvider:
	Database Provider for database managers that implement the oauth interface:
		/* The providerManager implements the following methods that return promises:
		 * isLoggedIn()
		 * login()
		 * logout()
		 * listDatabases()
		 */
	If new providers are added, prefer that they are oauth providers.
-->
<script>
import GenericProviderUi from '@/components/GenericProviderUi.vue';

export default {
  components: {
    GenericProviderUi,
  },
  props: {
    providerManager: Object,
    settings: Object,
  },
  data() {
    return {
      busy: false,
      databases: [],
      loggedIn: false,
      messages: {
        error: '',
      },
    };
  },
  mounted() {
    this.populate();
  },
  methods: {
    populate() {
      // TODO: deal with the race condition here....
      this.busy = true;
      this.messages.error = '';
      this.providerManager
        .listDatabases()
        .then((databases) => {
          this.databases = databases;
          this.providerManager.isLoggedIn().then((loggedIn) => {
            this.loggedIn = loggedIn;
            this.busy = false;
          });
        })
        .catch((err) => {
          console.error(
            'Error while connecting to database backend for',
            this.providerManager.title
          );
          this.messages.error = err.toString();
          this.databases = [];
          console.error(err);
          this.busy = false;
        });
    },
    toggleLogin(event) {
      //v-bind:id="'toggleButton'+providerManager.key"j
      // this.providerManager.logout()
      // this.settings.disableDatabaseProvider(this.providerManager)
      if (!this.busy) {
        if (this.loggedIn) {
          this.providerManager
            .logout()
            .then((nil) => {
              // if logout works, attempt to unset the currentDatabaseChoice.
              this.settings.disableDatabaseProvider(this.providerManager);
              this.populate();
            })
            .catch((err) => {
              this.settings.disableDatabaseProvider(this.providerManager);
              this.messages.error = err.toString();
            });
        } else {
          this.providerManager
            .login()
            .then((nil) => {
              this.populate();
            })
            .catch((err) => {
              this.loggedIn = false;
              this.messages.error = err.toString();
            });
        }
      } else {
        // wait for state to settle...
        console.error('Wait for toggle state to settle before changing enable/disable');
      }
    },
  },
};
</script>

<template>
  <div class="box-bar roomy database-manager">
    <generic-provider-ui
      :busy="busy"
      :databases="databases"
      :logged-in="loggedIn"
      :error="messages.error"
      :provider-manager="providerManager"
      :toggle-login="toggleLogin"
      :removeable="false"
      :remove-function="undefined"
    />
    <template v-if="loggedIn">
      <slot />
    </template>
  </div>
</template>

<style lang="scss">
@import '../styles/settings.scss';
</style>
