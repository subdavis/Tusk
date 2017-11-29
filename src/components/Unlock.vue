<template>
  <div>
    <!-- Busy Spinner -->
    <div v-if="busy" class="spinner">
      <spinner size="medium" :message='"Unlocking " + databaseFileName'></spinner>
    </div>

    <!-- Entry List -->
    <entry-list v-if="!busy && isUnlocked()"
      :messages="unlockedMessages"
      :unlocked-state="unlockedState"></entry-list>

    <!-- General Messenger -->
    <messenger :messages="generalMessages" v-show="!busy"></messenger>
    
    <!-- Unlock input group -->
    <div id="masterPasswordGroup" v-if="!busy && !isUnlocked()">     

      <div class="box-bar small selectable" @click="$router.route('/choose')">
        <span><b>{{ databaseFileName }}</b> ( click to change <i class="fa fa-database" aria-hidden="true"></i> )</span>
      </div>
      
      <div class="unlockLogo stack-item">
        <img src="../assets/logo.png">
        <span>CKPX</span>
      </div>
      
      <form v-on:submit="clickUnlock">
        
        <div class="stack-item">
          <input 
            type="password" 
            id="masterPassword" 
            v-model="masterPassword" 
            placeholder="master password"
            ref="masterPassword">
        </div>
        
        <div class="stack-item">
          <div id="select-keyfile" class="selectable" @click="keyFilePicker = !keyFilePicker">
          <i class="fa fa-key" aria-hidden="true"></i>
          {{ selectedKeyFileName }}</div>
        </div>
        
        <div class="stack-item keyfile-picker" v-if="keyFilePicker">
          <transition name="keyfile-picker">
            <div>
              <span class="selectable" v-for="(kf, kf_index) in keyFiles" :keyfile-index="kf_index" @click="chooseKeyFile(kf_index)">
                <i class="fa fa-file" aria-hidden="true"></i>
                {{ kf.name }}</span>
              <span class="selectable"><i class="fa fa-wrench" aria-hidden="true"></i> Manage Keyfiles</span>
            </div>
          </transition>
        </div>
        
        <div class="stack-item">
          <button id="unlock-button" class="selectable" v-on:click="clickUnlock">Unlock Database</button>
        </div>
      </form>

    </div>

    <!-- Footer -->
    <div class="box-bar medium between footer" v-show="!busy">
      <span class="selectable">
        <i class="fa fa-cog" aria-hidden="true"></i> Settings</span>
      <span class="selectable" v-if="isUnlocked()" @click="forgetPassword()">
        <i class="fa fa-lock" aria-hidden="true" ></i> Lock Database</span>
      <span class="selectable" v-else @click="closeWindow">
        <i class="fa fa-times-circle" aria-hidden="true"></i> Close Window</span>
      <span class="selectable">
        <i class="fa fa-info-circle" aria-hidden="true"></i> v{{ appVersion }}</span>
    </div>

  </div>
</template>

<script>
import InfoCluster from '@/components/InfoCluster'
import EntryList from '@/components/EntryList'
import Spinner from 'vue-simple-spinner'
import Messenger from '@/components/Messenger'

export default {
  props: {
    /* Service dependeicies */
    unlockedState: Object,
    secureCache: Object,
    settings: Object,
    keepassService: Object
  },
  components: {
    InfoCluster,
    EntryList,
    Spinner,
    Messenger
  },
  data () {
    return {
      /* UI state data */
      unlockedMessages: {
        warn: "",
        error: ""
      },
      generalMessages: {
        warn: "",
        error: ""
      },
      busy: false,
      masterPassword: "",
      keyFiles: [],  // list of all available
      selectedKeyFile: undefined, // chosen keyfile object
      rememberPeriod: 0, // in minutes. default: do not remember
      databaseFileName: "",
      keyFilePicker: false,
      appVersion: chrome.runtime.getManifest().version
    }
  },
  computed: {
    rememberPassword: function () {
      return this.rememberPeriod !== 0
    },
    selectedKeyFileName: function () {
      if (this.selectedKeyFile !== undefined)
        return this.selectedKeyFile.name
      return "No keyfile selected.  Click to choose."
    }
  },
  watch: {
    unlockedMessages: {
      handler (newval) {
        this.unlockedState.cacheSet('unlockedMessages', newval)
      },
      deep: true
    }
  },
  methods: {
    closeWindow (event) {
      window.close()
    },
    chooseKeyFile (index) {
      if (index >= 0)
        this.selectedKeyFile = this.keyFiles[index]
      else
        console.log("GOTO options")
      this.keyFilePicker = false
    },
    chooseAnotherFile () {
      this.unlockedState.clearBackgroundState()
      this.secureCache.clear('entries')
      this.$router.route('/choose')
    },
    isUnlocked: function () {
      return this.unlockedState.cache.allEntries !== undefined
    },
    forgetPassword () {
      this.settings.saveCurrentDatabaseUsage({
        requiresKeyfile: this.selectedKeyFile ? true : false,
        keyFileName: this.selectedKeyFile ? this.selectedKeyFile.name : undefined,
        rememberPeriod: this.rememberPeriod
      }).then(nil => {
        this.secureCache.clear('entries')
        this.unlockedState.clearBackgroundState()
        this.unlockedState.clearCache() // new
      })
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

      let allEntries = entries
      let priorityEntries = entries

      //save short term (in-memory) filtered results
      priorityEntries = entries.filter(function(entry) {
        return (entry.matchRank >= 100)
      });
      if (priorityEntries.length == 0) {
        priorityEntries = entries.filter(function(entry) {
          return (entry.matchRank > 0.8 && !entry.URL); //a good match for an entry without a url
        });
      }
      if (priorityEntries.length == 0) {
        priorityEntries = entries.filter(function(entry) {
          return (entry.matchRank >= 0.4);
        });

        if (priorityEntries.length) {
          this.unlockedMessages['warn'] = "No close matches, showing " + priorityEntries.length + " partial matches.";
        }
      }
      if (priorityEntries.length == 0) {
        this.unlockedMessages['error'] = "No matches found for this site."
      }

      // Cache in memory 
      this.unlockedState.cacheSet('allEntries', allEntries)
      this.unlockedState.cacheSet('priorityEntries', priorityEntries)
      this.$forceUpdate()
      //save longer term (in encrypted storage)
      this.secureCache.save('entries', entries);
    },
    clickUnlock (event) {
      event.preventDefault()
      this.unlock()
    },
    unlock (passwordKey) {
      this.busy = true
      this.generalMessages.error = ""
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
          this.showResults(entries)
          this.busy = false
        }).catch(err => {
          let errmsg = err.message || "Incorrect password or keyfile"
          console.error(errmsg)
          this.generalMessages['error'] = errmsg
          this.busy = false
        })
      })
    }
  },
  mounted () {
    
    this.$nextTick(function() {
      let mp = this.$refs.masterPassword;
      if (mp !== undefined)
        mp.focus()
    })

    if (!this.isUnlocked()) {
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
        this.secureCache.clear('entries')
      })
    }

    //set knowlege from the URL
    this.databaseFileName = decodeURIComponent(this.$router.getRoute().title)
  }
}
</script>

<style lang="scss">
@import "../styles/settings.scss";

#masterPasswordGroup {

  #unlock-button {
    background-color: $green;

    &:hover {
      background-color: $light-green;
    }
  }

  .keyfile-picker {
    background-color: $light-background-color;
    box-sizing: border-box;
    transition: all .2s linear;
    max-height: 200px;
    overflow-y: auto;
    opacity: 1;
    border-top: 1px solid $light-gray;
    border-bottom: 1px solid $light-gray;
    padding: 5px $wall-padding;
    margin: 5px 0px;

    &.keyfile-picker-enter, &.keyfile-picker-leave-to {
      max-height: 0px;
      opacity: 0;
    }

    span {
      display: block;
      padding: 2px 0px;

      &:hover {
        padding-left: 5px;
      }
    }
  }

  #select-keyfile {
    margin: 0px $wall-padding;
    margin-bottom: 5px;

    i {
      font-size: 14px;
    }

    &:hover {
      opacity: .7;
    }
  }

  input, select, button {
    width: 100%;
    margin: 5px 0px;
    box-sizing: border-box;

    font-size: 18px;
    padding: 5px 15px;
    border-top: 1px solid $light-gray;
    border-bottom: 1px solid $light-gray;
    border-width: 1px 0px;

    &:focus {
      outline: none;
    }
  }
}
.spinner {
  padding: $wall-padding;
}

.unlockLogo {
  font-weight: 700;
  font-size: 20px;
  text-align: center;
  padding: 20px 0px;

  img {
    width: 48px;
    height: 48px;
    vertical-align: middle;
  }
}

.footer span {

  padding: 2px 4px;
  border-radius: 3px;

  &:hover {
    background-color: $dark-background-color;
  }
  
}
</style>