<script>
import { mapMutations } from 'vuex';
import EntryListItem from '@/components/EntryListItem'
import Messenger from '@/components/Messenger'
import { SEARCH_FILTER_SET } from '@/store/modules/ui.js';
import {
	HOTKEY_NAV_ENABLED,
	generateSettingsAdapter,
} from '@/store/modules/settings'

export default {
	props: {
		messages: Object,
	},
	watch: {
		searchTerm: function (val) {
			this.setSearchFilter(val);
			if (val.length) {
				this.filteredEntries = this.allEntries.filter(entry => {
					let result = entry.filterKey.indexOf(val.toLocaleLowerCase())
					return (result > -1)
				})
			}
			// Regardless of result, reset the active entry.
			this.setActive(0)
		},
	},
	components: {
		EntryListItem,
		Messenger
	},
	data() {
		return {
			searchTerm: this.$store.state.ui.searchFilter,
			filteredEntries: this.$store.state.database.allEntries,
			priorityEntries: this.$store.state.database.priorityEntries,
			allEntries: this.$store.state.database.allEntries,
			hotkeyNavEnabled: false,
			activeEntry: null,
			activeEntryIndex: 0,
			keyHandler: evt => {
				switch (evt.keyCode) {
					case 67: // C
					case 66: // B
						if (evt.ctrlKey || evt.metaKey) {
							if (evt.keyCode === 67) {
								this.unlockedState.copyPassword(this.activeEntry)
							} else if (evt.keyCode === 66) {
								this.unlockedState.copyUsername(this.activeEntry)
							}
						}
						break
					case 9:  // TAB
						const modifier = !evt.shiftKey ? 1 : -1;
						this.setActive(this.activeEntryIndex + modifier)
						evt.preventDefault()
						break
					case 40: // DOWN arrow
						this.setActive(this.activeEntryIndex + 1)
						evt.preventDefault()
						break
					case 38: // UP arrow
						this.setActive(this.activeEntryIndex - 1);
						evt.preventDefault()
						break
					case 13: // ENTER
						if (this.activeEntry !== null)
							this.unlockedState.autofill(this.activeEntry)
						break
				}
			}
		}
	},
	methods: {
		...mapMutations({
			setSearchFilter: SEARCH_FILTER_SET,
		}),
		collectFilters(data, collector) {
			if (data === null || data === undefined)
				return data
			if (data.constructor == ArrayBuffer || data.constructor == Uint8Array)
				return null
			else if (typeof (data) === 'string')
				collector.push(data.toLocaleLowerCase())
			else if (data.constructor == Array)
				for (var i = 0; i < data.length; i++)
					this.collectFilters(data[i], collector)
			else
				for (var prop in data)
					this.collectFilters(data[prop], collector)
		},
		createEntryFilters(entries) {
			entries.forEach(entry => {
				var filters = new Array()
				this.collectFilters(entry, filters)
				entry.filterKey = filters.join(' ')
			})
		},
		setActive(index) {
			if (!this.hotkeyNavEnabled) return;
			// Unset the current active entry
			if (this.activeEntry !== null) {
				this.$set(this.activeEntry, 'view_is_active', false)
			}
			let activeList;
			if (this.filteredEntries.length > 0 && this.searchTerm.length > 0)
				activeList = this.filteredEntries
			else if (this.priorityEntries.length > 0)
				activeList = this.priorityEntries
			else // Neither list has entries
				return
			if (index < 0)
				index = activeList.length + index
			index = index % activeList.length
			this.activeEntry = activeList[index]
			this.$set(this.activeEntry, 'view_is_active', true)
			this.activeEntryIndex = index
		}
	},
	mounted() {
		// Autofocus searchbox
		this.$nextTick(function () {
			this.$refs.searchbox.focus();
		})
		this.createEntryFilters(this.allEntries);
		const adapter = generateSettingsAdapter(this.$store)
		this.hotkeyNavEnabled = adapter.getSet(HOTKEY_NAV_ENABLED)
		if (this.hotkeyNavEnabled) {
			// Initialize the active entry
			this.setActive(0)
			// Listen for key events.
			window.addEventListener("keydown", this.keyHandler)
		}
	},
	beforeDestroy() {
		window.removeEventListener("keydown", this.keyHandler)
	},
}
</script>

<template lang="pug">
div
	.search
		i.fa.fa-search
		input(ref="searchbox",
				type='search',
				v-model="searchTerm",
				placeholder="search entire database...")

	messenger(:messages="messages")
	.entries
		div(v-if='priorityEntries && searchTerm.length == 0')
			entry-list-item(
					v-for='entry in priorityEntries',
					:key='entry.id',
					:entry='entry')
		div(v-if='filteredEntries && searchTerm.length > 0')
			entry-list-item(
					v-for='entry in filteredEntries',
					:key='entry.id',
					:entry='entry')
</template>

<style lang="scss">
@import "../styles/settings.scss";
.entries {
  border-bottom: 2px solid $light-gray;
  height: 350px;
  overflow-y: auto;
}

.search {
  width: 100%;
  padding: 8px $wall-padding;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  border-bottom: 2px solid $light-gray;
  input {
    float: right;
    width: 96%;
    border: 0px;
    padding: 0px;
    padding-left: 10px;
    font-size: 18px;
    background-color: $background-color;
  }
  input:focus {
    outline: none;
  }
  .fa {
    width: 4%;
    font-size: 15px;
  }
}
</style>
