import browser from 'webextension-polyfill';

export function urlencode(str: string): string {
  // https://stackoverflow.com/questions/10896807/javascript-encodeuricomponent-doesnt-encode-single-quotes?foo=%27%27
  return encodeURIComponent(str).replace(/[!'()*]/g, escape);
}

export function getValidTokens(tokenString: string | undefined | null): string[] {
  if (!tokenString) return [];
  return tokenString
    .toLowerCase()
    .split(/\.|\s|\//)
    .filter((t) => t && t !== 'com' && t !== 'www' && t.length > 1);
}

export function parseUrl(url: string | undefined | null): URL | null {
  if (!url) return null;
  // Default to http, unencrypted if not specified.
  if (url.indexOf('http') !== 0) {
    url = 'http://' + url;
  }
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

/** function to tell if the element can be seen by a human. */
export function isVisible(el: HTMLElement): boolean {
  return (
    el.offsetWidth > 0 &&
    el.offsetHeight > 0 &&
    parseFloat(window.getComputedStyle(el).getPropertyValue('opacity')) > 0.1
  );
}

export function isFirefox(): boolean {
  return 'browser' in window;
}

/**
 * Firefox requests all host permissions at install time (see README) - dynamic
 * permissions.contains()/request() calls are unreliable outside a user gesture there,
 * so just trust the install-time grant instead of re-checking at runtime.
 */
export async function hasOriginPermission(origins: string[]): Promise<boolean> {
  if (isFirefox()) return true;
  try {
    return await browser.permissions.contains({ origins });
  } catch {
    return false;
  }
}
