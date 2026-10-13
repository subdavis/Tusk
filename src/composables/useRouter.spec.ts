import { describe, expect, it } from 'vitest';
import { useRouter } from './useRouter';

const routes = [
  { path: '/' },
  { path: '/choose' },
  { path: '/unlock/:provider/:title' },
  { path: '/entry-details/:entryId' },
];

describe('useRouter', () => {
  it('navigates to a static route', () => {
    const router = useRouter(routes);
    router.navigate('/choose');
    expect(router.isActive('/choose')).toBe(true);
    expect(router.isActive('/')).toBe(false);
  });

  it('parses named params out of a dynamic route', () => {
    const router = useRouter(routes);
    router.navigate('/unlock/dropbox/My%20Vault');
    expect(router.isActive('/unlock/:provider/:title')).toBe(true);
    expect(router.getRoute()?.params).toEqual({ provider: 'dropbox', title: 'My%20Vault' });
  });

  it('does not match a path with a different segment count', () => {
    const router = useRouter(routes);
    router.navigate('/unlock/dropbox');
    expect(router.getRoute()).toBeNull();
  });

  it('rejects a path with no matching route without navigating', () => {
    const router = useRouter(routes);
    router.navigate('/choose');
    router.navigate('/does-not-exist');
    // stays on the last valid route rather than pushing a bad entry
    expect(router.isActive('/choose')).toBe(true);
  });

  it('goBack pops the route stack', () => {
    const router = useRouter(routes);
    router.navigate('/');
    router.navigate('/choose');
    expect(router.isActive('/choose')).toBe(true);
    router.goBack();
    expect(router.isActive('/')).toBe(true);
  });

  it('processHash only accepts a valid #/ path', () => {
    const router = useRouter(routes);
    expect(router.processHash('#/choose')).toBe('/choose');
    expect(router.processHash('#/nope')).toBeNull();
    expect(router.processHash('choose')).toBeNull();
    expect(router.processHash('')).toBeNull();
  });
});
