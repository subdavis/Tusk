import pluginVue from 'eslint-plugin-vue';
import globals from 'globals';
import js from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

export default [
	js.configs.recommended, // Recommended config applied to all files
	...pluginVue.configs['flat/recommended'],
	eslintPluginPrettierRecommended,
	{
		rules: {
			// override/add rules settings here, such as:
			'vue/no-unused-vars': 'error',
			// "indent": ["error", 2],
		},
		languageOptions: {
			sourceType: 'module',
			globals: {
				...globals.browser,
			},
		},
	},
];
