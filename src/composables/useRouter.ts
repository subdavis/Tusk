import { ref, type InjectionKey } from 'vue';

export interface RouteDef {
  path: string;
  name?: string;
  hiddenFromNavbar?: boolean;
}

export interface ParsedRoute {
  path: string;
  params: Record<string, string>;
}

/**
 * Small hand-rolled router purpose-built for a browser-extension popup: a handful of
 * routes, no browser history/back-forward integration needed. Deliberately not
 * vue-router - that would be overkill for this surface.
 */
export function useRouter(routes: RouteDef[]) {
  const routeStack = ref<ParsedRoute[]>([]);

  function parse(path: string): ParsedRoute | null {
    const pathParts = path.split('/');
    for (const route of routes) {
      const candidateParts = route.path.split('/');
      if (candidateParts.length !== pathParts.length) continue;

      const params: Record<string, string> = {};
      let matched = true;
      for (let i = 0; i < candidateParts.length; i++) {
        if (candidateParts[i].indexOf(':') === 0) {
          params[candidateParts[i].substring(1)] = pathParts[i];
        } else if (candidateParts[i] !== pathParts[i]) {
          matched = false;
          break;
        }
      }
      if (matched) return { path: route.path, params };
    }
    return null;
  }

  function navigate(path: string) {
    const parsed = parse(path);
    if (parsed === null) {
      console.error(path + ' is not a valid path.');
      return;
    }
    routeStack.value.push(parsed);
  }

  function goBack() {
    routeStack.value.pop();
  }

  function getRoute(): ParsedRoute | null {
    return routeStack.value.length ? routeStack.value[routeStack.value.length - 1] : null;
  }

  function isActive(path: string): boolean {
    return getRoute()?.path === path;
  }

  /** Returns a path from a `#/...` hash, provided it parses against a registered route. */
  function processHash(hash: string): string | null {
    if (hash.length <= 1) return null;
    if (hash.indexOf('#/') !== 0) return null;
    const hashRoute = hash.substring(1);
    return parse(hashRoute) ? hashRoute : null;
  }

  return {
    routes,
    navigate,
    goBack,
    getRoute,
    isActive,
    processHash,
  };
}

export type Router = ReturnType<typeof useRouter>;

export const RouterKey: InjectionKey<Router> = Symbol('router');
