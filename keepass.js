chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
	if (!message || !message.m) return;  //unrecognized message format

	if (message.m == "tabLoaded") {
		//the tab has loaded.
		handleTabLoaded();
	} else if (message.m == "fillPassword") {
		//user has selected to fill the password
		for(var i=0; i<userPasswordPairs.length; i++) {
			var pair = userPasswordPairs[i];
			if (pair.known) {
				pair.u.val(message.u);
				pair.p.val(message.p);
			}
		}
	}
});

var userPasswordPairs = [];

function handleTabLoaded() {

    //identify user/password pairs
    var inputPattern = "input[type='text'], input[type='email'], input[type='password'], input:not([type])";
    var possibleUserName;
	  var lastFieldWasPassword = false;  //used to detect registration forms which have 2 password fields, one after the other
    $(inputPattern).each(function() {
        var field = $(this);
        if (field.attr('type') && field.attr('type').toLowerCase() == 'password') {
            if (possibleUserName) {
                userPasswordPairs.push({
                    'u': possibleUserName,
                    'p': field
                });
                possibleUserName = null;
				lastFieldWasPassword = true;
            } else if (lastFieldWasPassword) {
				//special case - two passwords in a row means it is a registration form, so remove last-added pair
				userPasswordPairs.pop();
				lastFieldWasPassword = false;
			}
        }
        else {
            possibleUserName = field;
			lastFieldWasPassword = false;
        }
    });

    if (userPasswordPairs.length > 0) {
        //we have found some possible username/passwords.  Monitor them to see if any
        //of them become visible:
		poll();
        setInterval(function() {
			poll();
        }, 1000);

		function poll() {
            for (var i = 0; i < userPasswordPairs.length; i++) {
                var pair = userPasswordPairs[i];
                if (!pair.known && isElementInViewport(pair.u) && isElementInViewport(pair.p)) {
                    showOptionToFillPasswords(pair);
                }
            }
		}
    }

	function showOptionToFillPasswords(pair) {
		if (pair.known) return;  //already done for this one

		pair.id = pair.u[0].id;
		var message = {'m': "passwordFieldFound", 'pairId': pair.id, 'url': window.location.pathname};
		chrome.runtime.sendMessage(message);  //send message to background script
		pair.known = true;

		/*
		//for debugging
		pair.u.css('background-color', 'yellow');
		pair.p.css('background-color', 'yellow');
		*/
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