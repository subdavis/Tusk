/* 
  This page runs as an Event page, not a Background page, so don't use global variables 
  (they will be lost)
*/

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.status != 'complete') return; //wait for the tab to finish loading

    chrome.tabs.sendMessage(tabId, {'m': 'tabLoaded'});
});

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
	if (!message || !message.m) return;  //message format unrecognized
	
	if (message.m == "passwordFieldFound") {
		//password field was found
		tabId = sender.tab.id;

		var passwordFileName;
		chrome.storage.sync.get('passwordFileName', function(items) {
			if (items.passwordFileName) {
				passwordFileName = items.passwordFileName;
			} else {
				//user must select file before we can supply a password
				chrome.pageAction.setPopup({'tabId': tabId, 'popup': '/popups/popup.html'});
			}
			chrome.pageAction.show(tabId);
		});
		
		/*
		//save tab info in storage
		var storageKey = 'tab' + tabId;
		var details = {);
		details[storageKey] = {
			'url': tab.url  //requires the "tabs" permission
		};
		chrome.storage.local.set(details);
		*/
	}
});

chrome.pageAction.onClicked.addListener(function(tab) {
	//handle click of action
	var havePassword = false;
	
	if (havePassword) 
		chrome.tabs.sendMessage(tab.id, {'m': 'fillPassword', 'u':'testuser', 'p':'testpassword'});
});
