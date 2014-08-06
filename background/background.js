chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {

    if (changeInfo.status != 'complete') return; //wait for the tab to finish loading

    chrome.tabs.sendMessage(tabId, 'tabLoaded', function() {
        //handle possible callbacks here
    })
});

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
	if (message.m == "passwordFieldFound") {
		//password field was found
		tabId = sender.tab.id;
        chrome.pageAction.show(tabId);
	}
});

