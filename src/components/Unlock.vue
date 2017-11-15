<template>
  <div>
  	<info-cluster
      :messages="messages"></info-cluster>
    <entry-list
      :entries="[]"
      :priority-entries="unlockedState.entries"></entry-list>
  	<div id="masterPasswordGroup">
      <div v-if="busy" class="spinner">Busy!</div>
      <input type="text" id="masterPassword" v-bind="masterPassword">
  		<select v-model="selectedKeyFile" id="keyFileDropdown">
        <option value="null">-- No Keyfile --</option>
  			<option v-for="kf in keyFiles" value="kf">No keyfile</option>
  		</select>
  		<button v-on:click="unlock">Unlock</button>
      <button v-on:click="chooseAnotherFile">Choose Another Database</button>
    </div>
  </div>
</template>

<script>
import InfoCluster from '@/components/InfoCluster'
import EntryList from '@/components/EntryList'

export default {
  props: {
    /* Service dependeicies */
    unlockedState: Object,
    secureCache: Object,
    settings: Object,
    keepassService: Object
  },
  data () {
    return {
      /* UI state data */
      messages: {}, // for InfoCluster
      busy: false,
      masterPassword: "",
      keyFiles: [],  // list of all available
      selectedKeyFile: undefined, // chosen keyfile object
      rememberPeriod: 0 // in minutes. default: do not remember
    } 
  },
  computed: {
    rememberPassword: function () {
      return this.rememberPeriod !== 0
    }
  },
  components: {
  	InfoCluster,
    EntryList
  },
  methods: {
    chooseAnotherFile () {
      this.unlockedState.clearBackgroundState()
      this.secureCache.clear('entries')
      this.$router.route('/choose')
    },
    forgetPassword () {
      this.settings.saveCurrentDatabaseUsage({
        requiresKeyfile: this.selectedKeyFile ? true : false,
        keyFileName: this.selectedKeyFile ? this.selectedKeyFile.name : undefined,
        rememberPeriod: this.rememberPeriod
      }).then(function () {
        this.secureCache.clear('entries')
        this.unlockedState.clearBackgroundState()
        window.close()
      })
    },
    showAllEntries () {
      this.$router.route('/all-entries')
    },
    showResults (entries) {

      let getValidTokens = tokenString => {
        if (!tokenString) 
          return []
        else
          return tokenString.toLowerCase().split(/\.|\s|\//).filter(t => {
            return (t && t !== "com" && t !== "www" && t.length > 1)
          })
      } // end getValidTokens

      let parseUrl = url => {
        if (url && !url.indexOf('http') == 0)
          url = 'http://' + url
        //from https://gist.github.com/jlong/2428561
        var parser = document.createElement('a')
        parser.href = url
        return parser
      } // end parseUrl

      let rankEntries = (entries, siteUrl, title, siteTokens) => {
        entries.forEach(function(entry) {
          //apply a ranking algorithm to find the best matches
          var entryHostName = parseUrl(entry.url).hostname || ""

          if (entryHostName && entryHostName == siteUrl.hostname)
            entry.matchRank = 100 //exact url match
          else
            entry.matchRank = 0

          entry.matchRank += (entry.title && title && entry.title.toLowerCase() == title.toLowerCase()) ? 1 : 0
          entry.matchRank += (entry.title && entry.title.toLowerCase() === siteUrl.hostname.toLowerCase()) ? 1 : 0
          entry.matchRank += (entry.url && siteUrl.hostname.indexOf(entry.url.toLowerCase()) > -1) ? 0.9 : 0
          entry.matchRank += (entry.title && siteUrl.hostname.indexOf(entry.title.toLowerCase()) > -1) ? 0.9 : 0

          var entryTokens = getValidTokens(entryHostName + "." + entry.title);
          for (var i = 0; i < entryTokens.length; i++) {
            var token1 = entryTokens[i]
            for (var j = 0; j < siteTokens.length; j++) {
              var token2 = siteTokens[j]

              entry.matchRank += (token1 === token2) ? 0.2 : 0;
            }
          }
        })
      } // end rankEntries

      let siteUrl = parseUrl(this.unlockedState.url)
      let title = this.unlockedState.title
      let siteTokens = getValidTokens(siteUrl.hostname + '.' + this.unlockedState.title)
      rankEntries(entries, siteUrl, title, siteTokens) // in-place

      //save short term (in-memory) filtered results
      this.unlockedState.entries = entries.filter(function(entry) {
        return (entry.matchRank >= 100)
      });
      if (this.unlockedState.entries.length == 0) {
        this.unlockedState.entries = entries.filter(function(entry) {
          return (entry.matchRank > 0.8 && !entry.URL); //a good match for an entry without a url
        });
      }
      if (this.unlockedState.entries.length == 0) {
        this.unlockedState.entries = entries.filter(function(entry) {
          return (entry.matchRank >= 0.4);
        });

        if (this.unlockedState.entries.length) {
          this.messages['partialMatch'] = "No close matches, showing " + this.unlockedState.entries.length + " partial matches.";
        }
      }
      if (this.unlockedState.entries.length == 0) {
        this.messages['error'] = "No matches found for this site."
      }
      //save longer term (in encrypted storage)
      this.secureCache.save('entries', entries);
    },
    unlock (passwordKey) {
      this.busy = true
      let passwordKeyPromise;
      if (passwordKey === undefined)
        passwordKeyPromise = this.keepassService.getMasterKey(this.masterPassword, this.selectedKeyFile)
      else
        passwordKeyPromise = Promise.resolve(passwordKey)
      let keyFileName = (this.selectedKeyFile !== undefined) 
        ? this.selectedKeyFile.name 
        : undefined
      passwordKeyPromise.then(passwordKey => {
        this.keepassService.getDecryptedData(passwordKey).then(decryptedData => {
          let entries = decryptedData.entries
          let version = decryptedData.version
          let dbUsage = {
            requiresPassword: passwordKey.passwordHash === null ? false : true,
            requiresKeyfile: passwordKey.keyFileHash === null ? false : true,
            passwordKey: undefined,
            version: version,
            keyFileName: keyFileName,
            rememberPeriod: this.rememberPeriod
          }
          if (this.rememberPeriod !== 0)
            dbUsage.passwordKey = passwordKey
          this.settings.saveCurrentDatabaseUsage(dbUsage)
          this.settings.saveDefaultRememberOptions(this.rememberPeriod)
          if (this.rememberPeriod > 0) {
            let check_time = 60000 * this.rememberPeriod // milliseconds / min
            this.settings.setForgetTime('forgetPassword', (Date.now() + check_time))
          } else {
            // don't clear passwords
            this.settings.clearForgetTimes(['forgetPassword'])
          }
          console.log(entries)
          this.showResults(entries)
          this.busy = false
        })/*.catch(err => {
          let errmsg = err.message || "Incorrect password or keyfile"
          console.error(errmsg)
          this.messages['error'] = errmsg
          this.busy = false
        })*/
      })
    }
  },
  mounted () {
    // This is run when Unlock module starts...
    this.settings.getKeyFiles().then(keyFiles => {
      this.keyFiles = keyFiles
      return this.settings.getDefaultRememberOptions()
    }).then( rememberOptions => {
      this.rememberPeriod = rememberOptions.rememberPeriod
      return this.settings.getCurrentDatabaseUsage()
    }).then( usage => {
      // tweak UI based on what we know about the db file
      this.hidePassword = (usage.requiresPassword === false)
      this.hideKeyFile = (usage.requiresKeyfile === false)
      this.rememberedPassword = (usage.passwordKey !== undefined)
      this.rememberPeriod = usage.rememberPeriod

      if (usage.passwordKey !== undefined && usage.requiresKeyfile === false) {
        this.unlock(usage.passwordKey) // Autologin if no keyfile
      } else if (usage.keyFileName !== undefined) { 
        let matches = this.keyFiles.filter(kf => {
          return kf.name === usage.keyFileName
        })
        if (matches.length > 0) {
          this.selectedKeyFile = matches[0]
          if (this.hidePassword === true || usage.passwordKey !== undefined)
            this.unlock(usage.passwordKey)
        }
      }
    })

    // modify unlockedState internal state
    this.unlockedState.getTabDetails()
    this.secureCache.get('entries').then(entries => {
      if (entries && entries.length > 0)
        showResults(entries)
    }).catch(err => {
      //this is fine - it just means the cache expired.  Clear the cache to be sure.
      secureCache.clear('entries')
    })
  }
}
</script>

<style lang="scss">
input, select, button {
	width: 100%;
	margin: 10px 0px 0px 0px;
}
</style>