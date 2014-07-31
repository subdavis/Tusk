// contains already called method names
var _called = {};

chrome.extension.onMessage.addListener(function(req, sender, callback) {
	if ('action' in req) {
		if(req.action == "fill_user_pass_with_specific_login") {
			if(cip.credentials[req.id]) {
				var combination = null;
				if (cip.u) {
					cip.u.val(cip.credentials[req.id].Login);
					combination = cipFields.getCombination("username", cip.u);
					cip.u.focus();
				}
				if (cip.p) {
					cip.p.val(cip.credentials[req.id].Password);
					combination = cipFields.getCombination("password", cip.p);
				}

                var list = {};
				if(cip.fillInStringFields(combination.fields, cip.credentials[req.id].StringFields, list)) {
                    cipForm.destroy(false, {"password": list.list[0], "username": list.list[1]});
                }
			}
			// wish I could clear out _logins and _u, but a subsequent
			// selection may be requested.
		}
		else if (req.action == "fill_user_pass") {
			cip.fillInFromActiveElement(false);
		}
		else if (req.action == "fill_pass_only") {
			cip.fillInFromActiveElementPassOnly(false);
		}
		else if (req.action == "activate_password_generator") {
			cip.initPasswordGenerator(cipFields.getAllFields());
		}
		else if(req.action == "remember_credentials") {
			cip.contextMenuRememberCredentials();
		}
		else if (req.action == "choose_credential_fields") {
			cipDefine.init();
		}
		else if (req.action == "clear_credentials") {
			cipEvents.clearCredentials();
		}
		else if (req.action == "activated_tab") {
			cipEvents.triggerActivatedTab();
		}
		else if (req.action == "redetect_fields") {
			chrome.extension.sendMessage({
				"action": "get_settings",
			}, function(response) {
				cip.settings = response.data;
				cip.initCredentialFields(true);
			});
		}
	}
});

// Hotkeys for every page
// ctrl + shift + p = fill only password
// ctrl + shift + u = fill username + password
window.addEventListener("keydown", function(e) {
	if (e.ctrlKey && e.shiftKey) {
		if (e.keyCode == 80) { // P
			e.preventDefault();
			cip.fillInFromActiveElementPassOnly(false);
		} else if (e.keyCode == 85) { // U
			e.preventDefault();
			cip.fillInFromActiveElement(false);
		}
	}
}, false);

function _f(fieldId) {
	var field = (fieldId) ? cIPJQ("input[data-cip-id='"+fieldId+"']:first") : [];
	return (field.length > 0) ? field : null;
}

function _fs(fieldId) {
	var field = (fieldId) ? cIPJQ("input[data-cip-id='"+fieldId+"']:first,select[data-cip-id='"+fieldId+"']:first").first() : [];
	return (field.length > 0) ? field : null;
}


