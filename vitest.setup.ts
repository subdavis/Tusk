// webextension-polyfill refuses to load unless it sees a real extension context
// (globalThis.chrome.runtime.id). Stub the minimum shape so importing modules that
// touch `browser` at module scope doesn't crash tests that never call into it.
(globalThis as { chrome?: unknown }).chrome ??= { runtime: { id: 'test' } };
