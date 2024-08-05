import fs from 'fs-extra'
import type { Manifest } from 'webextension-polyfill'
import { isDev, log, port, r } from './utils'

const _manifest: Manifest.WebExtensionManifest = {
  "name": "KeePass Tusk - Password Access and Autofill",
  "short_name": "KeePass Tusk",
  "version": "2024.8.2",
  "manifest_version": 3,
  "minimum_chrome_version": "88",
  "description": "Readonly KeePass password database integration for Chrome and Firefox",
  "icons": {
    "16": "/assets/16x16.png",
    "48": "/assets/48x48.png"
  },
	// @ts-expect-error undocumented type is still supported
	incognito: 'split',
	action: {
		"default_icon": "/assets/38x38.png",
		"default_popup": "./dist/popup.html",
		"default_title": "KeePass Tusk"
	},
	content_security_policy: {
		extension_pages: isDev
			// this is required on dev for Vite script to load
			? `script-src \'self\' http://localhost:${port}; object-src \'self\'`
			: 'script-src \'self\'; object-src \'self\''
	},
	"options_ui": {
		"page": "./dist/options.html",
		"open_in_tab": true
	},
	"commands": {
		"_execute_action": {
			"suggested_key": {
				"windows": "Ctrl+Shift+Space",
				"mac": "Command+Shift+Space",
				"chromeos": "Ctrl+Shift+Space",
				"linux": "Ctrl+Shift+Space",
				"default": "Ctrl+Shift+Space"
			}
		}
	},
	"permissions": [
		"activeTab",
		"scripting",
		"storage",
		"clipboardWrite",
		"identity",
		"alarms",
		"notifications"
	],
	"optional_host_permissions": [
		"https://*/",
		"http://*/",
		"file:///*/"
	],
	"static_data": {
		"dropbox": {
			"client_id": "lau0eigo4cfthqz"
		},
		"onedrive": {
			"client_id": "f4c55645-3f43-4f8e-a7d2-ec167b416f1d"
		},
		"gdrive": {
			"client_id": "876467817034-rlas0hnb5jc9dt1qmp11l6g4724ktoqn.apps.googleusercontent.com"
		},
		"pcloud": {
			"client_id": "1NklWhTApYR"
		}
	}
}

function chromeManifest() {
	return Object.assign({}, _manifest, {
		"minimum_chrome_version": "88",
		"oauth2": {
			"client_id": "876467817034-al13p9m2bphgregs0rij76n1tumakcqr.apps.googleusercontent.com",
			"scopes": [
				"https://www.googleapis.com/auth/drive.readonly"
			]
		},
		"key": "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAhoF/A6nYIxSHW2AekTQRJga9QodwEJBTeAA5r0tW9djrTHY3Ei0FdnUE1FrH2Hx03tsj4RjXMWDHtsqMg4REJdFNzndsRKWvliGomXtxE8XByawJf/NGx0/imAtVBrHc846D/Bn4q1dRaRauqkPMKgpcHoPeg+uLTBIfAn5qPgLlvLLqNSKRg6zGYkm0iBYFiyLd1cqWjsDrVhant90W5rE7qmGQPXZudkc2ejtijuMJL4CF9BeQXOVv/9a0XzAwNbArSr+zHnNOicZPyeEnT7mujFDvLRzXvi7OPW+8mdEsm3AeagKZ6bGUuqyzwxs8XlysWqJsXBoX6tjZCGGVpQIDAQAB",
		"background": {
			"service_worker": "./dist/background/index.mjs",
		},
	})
}

function firefoxManifest() {
	return Object.assign({}, _manifest, {
		"browser_specific_settings": {
			"gecko": {
				"id": "brandon@subdavis.com"
			}
		},
		"background": {
			"scripts": ["./dist/background/index.mjs"]
		},
		// Firefox is incapable of detecting user input through promise chains.
		"host_permissions": [
			"https://*/*",
			"http://*/*",
			"file:///*/*"
		],
	});
}

export async function writeManifest(target: 'chrome' | 'firefox' = 'chrome') {
	const manifest = target === 'chrome' ? chromeManifest() : firefoxManifest()
	await fs.writeJSON(r('extension/manifest.json'), manifest, { spaces: 2 })
	log('PRE', 'write manifest.json')
}

writeManifest(process.env.TARGET as 'chrome' | 'firefox')
