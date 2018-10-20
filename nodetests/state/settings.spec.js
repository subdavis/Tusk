import { 
	createCacheKey,
} from 'src/store/modules/settings.js';
import {
	FORGET_TIME_SET,
	FORGET_TIMES_CLEAR
} from 'src/store/modules/settings.js';
import settings from 'src/store/modules/settings.js';
import { generateSettingsAdapter } from 'src/store/helpers.js';
import { FREEFORM_SET, ENABLED_PROVIDERS } from 'src/store/modules/settings.js'

describe('settings', () => {
	it('createCacheKey', () => {
		expect(createCacheKey({
			databaseFileName: 'foo',
			providerKey: 'bar'
		})).toBe('foo.bar')
	})
});

describe('mutations', () => {
  it(FORGET_TIME_SET, () => {
		let state = {
			forgetTimes: {}
		};
    settings.mutations[FORGET_TIME_SET](state, {
			key: 'fookey',
			time: 800,
		});
		expect(state.forgetTimes.fookey).toBe(800);
	});
	
	it(FORGET_TIMES_CLEAR, () => {
		let state = {
			forgetTimes: {
				some: 100,
				b: 'invalidvalue',
			}
		};
		settings.mutations[FORGET_TIMES_CLEAR](state, {keys: ['some']});
		expect(state.forgetTimes.b).toBe('invalidvalue');
		expect(state.forgetTimes.some).toBeUndefined();
	})
});

describe('settingsAdapter', () => {
	it('create a working settings adapter', () => {
		const store = {
			commit({type, key, value}) {
				expect(type).toBe(FREEFORM_SET)
			},
			state: {
				settings: {
					freeform: {},
				}
			},
		}
		const adapter = generateSettingsAdapter(store);
		const args = {
			name: 'fooname',
			type: 'object',
			defaultVal: {a:1},
		}
		expect(adapter.getSet(args, 9).a).toBe(1)
		expect(adapter.getSet(args).a).toBe(1)
		store.state.settings.freeform.fooname = 4000
		expect(adapter.getSet(args).a).toBe(1)
		store.state.settings.freeform.fooname = { a: 2 }
		expect(adapter.getSet(args).a).toBe(2)
		expect(adapter.getSet(args, {a: 3}).a).toBe(3)
	});

	it('manages enabled providers', () => {
		const store = {
			commit({type, key, value}) {
				expect(type).toBe(FREEFORM_SET)
			},
			state: {
				settings: {
					freeform: {},
				}
			},
		}
		const adapter = generateSettingsAdapter(store);
		expect(adapter.getProviderEnabled('fooprovider')).toBe(false);
		store.state.settings.freeform[ENABLED_PROVIDERS.name] = [ 'fooprovider', 'barprovider' ];
		expect(adapter.getProviderEnabled('fooprovider')).toBe(true);
		expect(adapter.setProviderEnabled('fooprovider', false)).toBeUndefined();
		expect(adapter.getProviderEnabled('fooprovider')).toBe(false);
	});
});
