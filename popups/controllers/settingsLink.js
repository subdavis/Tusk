
"use strict";

function SettingsLinkController($scope, $location) {
  $scope.showSettingsPage = function() {
    var optionsUrl = "chrome://extensions/?options=" + chrome.runtime.id
    //  + '#!from=' + encodeURIComponent($location.path());  //doesn't work
    chrome.tabs.query({url: optionsUrl}, function(tabs) {
      if (tabs.length) {
        chrome.tabs.update(tabs[0].id, {active: true});
      } else {
        chrome.tabs.create({url: optionsUrl});
      }
    });
  }
}
