<template>
	<div>

		<div class="box-bar roomy">

			<div class="unlockLogo stack-item optionsheader">
				<img src="assets/icons/logo.png">
				<span>Getting Started with Tusk</span>
			</div>

			<p>Tusk helps you keep track of all your accounts by storing your passwords in an encrypted file called a Keepass Database. You choose where this file is stored - most people keep them in a cloud storage provider like Dropbox or Google Drive for easy access
				and syncing between laptops, desktops, and phones. To use Tusk, you should first enable one of the storage providers below.</p>

			<a @click="$router.route('/manage/databases')" class="waves-effect waves-light btn">1. Cloud Storage Setup</a>

			<p>Optionally, you may also import any required keyfiles. A keyfile can be used together with a password to provide even better security, or even used instead of one.</p>

			<a @click="$router.route('/manage/keyfiles')" class="waves-effect waves-light btn">2. Keyfile Setup (optional)</a>

			<p>That's it! Tusk will automatically discover any Keepass databases that your have in your cloud storage, and allow you to switch between databases from the browser popup.</p>

			<p>If you are a new Keepass user, you will be prompted to create a new database from the popup window after you enable a cloud storage provider. Most people keep all their passwords in a single database, so you will only need to do this once.</p>
		</div>

		<div class="box-bar roomy lighter">
			<h4>Support Tusk</h4>
			<p>If you like Tusk, please consider <a href="https://chrome.google.com/webstore/detail/keepass-tusk-a-better-pas/fmhmiaejopepamlcjkncpgpdjichnecm">leaving a review on the google web store</a> or <a href="https://addons.mozilla.org/en-US/firefox/addon/keepass-tusk/">firefox addon store</a>.  If you find a problem or are dissatisfied, please instead open an issue on the <a href="https://github.com/suBDavis/Tusk/issues">issue tracker</a> so we can make Tusk better.</p>
		</div>
	</div>
</template>

<script>
	export default {
		props: {}
	}
</script>

<style lang="scss">
	@import "../styles/settings.scss";
	.optionsheader {
		text-align: left;
		font-size: 28px;
	}
</style>