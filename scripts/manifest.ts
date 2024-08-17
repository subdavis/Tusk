import fs from 'fs-extra'
import type { Manifest } from 'webextension-polyfill'
import { isDev, log, port, r } from './utils'

const action = {
	"default_icon": "/assets/38x38.png",
	"default_popup": "./dist/popup.html",
	"default_title": "KeePass Tusk"
}

const backgroundScript = "./dist/background/index.mjs"

const executeAction = {
	"suggested_key": {
		"windows": "Ctrl+Shift+Space",
		"mac": "Command+Shift+Space",
		"chromeos": "Ctrl+Shift+Space",
		"linux": "Ctrl+Shift+Space",
		"default": "Ctrl+Shift+Space"
	}
}

const hostPermissions = [
	"https://*/*",
	"http://*/*",
	"file:///*/*"
]

const permissions = [
	"activeTab",
	"scripting",
	"storage",
	"clipboardWrite",
	"identity",
	"alarms",
	"notifications"
]

const baseManifest: Manifest.WebExtensionManifest = {
  "name": "KeePass Tusk - Password Access and Autofill",
  "short_name": "KeePass Tusk",
  "version": "2024.8.16",
  "description": "Readonly KeePass password database integration for Chrome and Firefox",
  "icons": {
    "16": "/assets/16x16.png",
    "48": "/assets/48x48.png"
  },

	"options_ui": {
		"page": "./dist/options.html",
		"open_in_tab": true
	},

	// @ts-expect-error This is additional manifest data
	"static_data": {
		"dropbox": {
			"client_id": "lau0eigo4cfthqz"
		},
		"onedrive": {
			"client_id": "f4c55645-3f43-4f8e-a7d2-ec167b416f1d"
		},
		"gdrive": {
			// The Web Client ID for general use
			"client_id": "876467817034-rlas0hnb5jc9dt1qmp11l6g4724ktoqn.apps.googleusercontent.com"
		},
		"pcloud": {
			"client_id": "1NklWhTApYR"
		}
	}
}

/**
 * Chrome requires MV3 starting in July 2024
 */
function chromeManifestV3(): Manifest.WebExtensionManifest {
	return Object.assign({}, baseManifest, {
		"manifest_version": 3,
		"minimum_chrome_version": "102",
		"oauth2": {
			// The Chrome identity client ID for Chrome ONLY
			"client_id": "876467817034-al13p9m2bphgregs0rij76n1tumakcqr.apps.googleusercontent.com",
			"scopes": [
				"https://www.googleapis.com/auth/drive.file"
			]
		},
		permissions,
		content_security_policy: {
			extension_pages: isDev
				// this is required on dev for Vite script to load
				? `script-src \'self\' \'wasm-unsafe-eval\' http://localhost:${port}; object-src \'self\'`
				: 'script-src \'self\' \'wasm-unsafe-eval\'; object-src \'self\''
		},
		action,
		"commands": {
			"_execute_action": executeAction
		},
		"key": "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAhoF/A6nYIxSHW2AekTQRJga9QodwEJBTeAA5r0tW9djrTHY3Ei0FdnUE1FrH2Hx03tsj4RjXMWDHtsqMg4REJdFNzndsRKWvliGomXtxE8XByawJf/NGx0/imAtVBrHc846D/Bn4q1dRaRauqkPMKgpcHoPeg+uLTBIfAn5qPgLlvLLqNSKRg6zGYkm0iBYFiyLd1cqWjsDrVhant90W5rE7qmGQPXZudkc2ejtijuMJL4CF9BeQXOVv/9a0XzAwNbArSr+zHnNOicZPyeEnT7mujFDvLRzXvi7OPW+8mdEsm3AeagKZ6bGUuqyzwxs8XlysWqJsXBoX6tjZCGGVpQIDAQAB",
		"background": {
			"service_worker": backgroundScript,
		},
		"optional_host_permissions": hostPermissions,
	})
}

/**
 * Manifest V3 support in Firefox is abysmal, so we're sticking with V2 for now
 */
function firefoxManifestV2(): Manifest.WebExtensionManifest {
	return Object.assign({}, baseManifest, {
		"manifest_version": 2,
		"browser_specific_settings": {
			"gecko": {
				"id": "brandon@subdavis.com"
			}
		},
		"browser_action": action,
		"commands": {
			"_execute_browser_action": executeAction
		},
		"permissions": [
			...permissions,
			// Firefox implements user initiated flag improperly and canot prompt for site access
			// so we just have to give Tusk everything from the start.
			...hostPermissions,
		],
		"background": {
			"scripts": [backgroundScript]
		},
	});
}

export async function writeManifest(target: 'chrome' | 'firefox' = 'chrome') {
	const manifest = target === 'chrome' ? chromeManifestV3() : firefoxManifestV2()
	await fs.writeJSON(r('extension/manifest.json'), manifest, { spaces: 2 })
	log('PRE', 'write manifest.json ' + target)
}

writeManifest(process.env.TARGET as 'chrome' | 'firefox')
