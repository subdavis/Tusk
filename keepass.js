chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
	if (message == "tabLoaded") {
		//the tab has loaded.  
		handleTabLoaded();
	}
})

function handleTabLoaded() {

    //identify user/password pairs
    var inputPattern = "input[type='text'], input[type='email'], input[type='password'], input:not([type])";
    var possibleUserName;
    var userPasswordPairs = [];
    $(inputPattern).each(function() {
        var field = $(this);
        if (field.attr('type') && field.attr('type').toLowerCase() == 'password') {
            if (possibleUserName) {
                userPasswordPairs.push({
                    'u': possibleUserName,
                    'p': field
                });
                possibleUserName = null;
            }
        }
        else {
            possibleUserName = field;
        }
    })

    if (userPasswordPairs.length > 0) {
        //we have found some possible username/passwords.  Monitor them to see if any
        //of them become visible:
        setInterval(function() {
            for (var i = 0; i < userPasswordPairs.length; i++) {
                var pair = userPasswordPairs[i];
                if (isElementInViewport(pair.u) && isElementInViewport(pair.p)) {
                    pair.visible = true;
                    showOptionToFillPasswords(pair);
                }
                else pair.visible = false;
            }
        }, 1000)
    }

	function showOptionToFillPasswords(pair) {
		pair.id = pair.u[0].id;
		var message = {'m': "passwordFieldFound", 'pairId': pair.id};
		chrome.runtime.sendMessage(message);  //send message to background script
	}
	
    /** 
        function to determine if element is visible
    */
    function isElementInViewport(el) {
        //special bonus for those using jQuery
        if (el instanceof jQuery) {
            el = el[0];
        }

        var rect = el.getBoundingClientRect();

        return (
        rect.top >= 0 && rect.left >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && /*or $(window).height() */
        rect.right <= (window.innerWidth || document.documentElement.clientWidth) /*or $(window).width() */ );
    }
}