/*
  This page runs as an Event page, not a Background page, so don't use global variables
  (they will be lost)
*/

function addRules() {
  var passwordField = {conditions: [
    new chrome.declarativeContent.PageStateMatcher({
        css: ["input[type='password']"]
      })
    ],
    actions: [ new chrome.declarativeContent.ShowPageAction() ]
  };
  chrome.declarativeContent.onPageChanged.addRules([passwordField]);
}

addRules();
chrome.runtime.onInstalled.addListener(function(details) {
  //chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
    addRules();
  //});
});

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
	if (!message || !message.m) return;  //message format unrecognized

  if (message.m == 'requestPageInfo') {

  }
});

chrome.pageAction.onClicked.addListener(function(tab) {
	//handle click of action
  //chrome.pageAction.setPopup({'tabId': tab.tabId, 'popup': '/popups/popup.html'});
  //chrome.pageAction.setTitle({'tabId': tab.tabId, 'title': 'Password field detected.  Click to unlock.'});
	//chrome.pageAction.show(tab.tabId);

  chome.tabs.sendMessage(tab.id, {
    m: 'pageInfo', 'url': tab.url, 'title': tab.title
  });

	//chrome.tabs.sendMessage(tab.id, {'m': 'fillPassword', 'u':'testuser', 'p':'testpassword'});
});

chrome.alarms.onAlarm.addListener(function(alarm) {
  if (alarm.name == "clearClipboard") {
    //clear the clipboard on timer
    document.addEventListener('copy', function(e) {
      e.clipboardData.setData('text/plain', "");
      e.preventDefault();
    });

    document.execCommand('copy');
  }
});