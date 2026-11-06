import process from 'node:process';globalThis._importMeta_=globalThis._importMeta_||{url:"file:///_entry.js",env:process.env};import { hasInjectionContext, getCurrentInstance, defineComponent, createElementBlock, shallowRef, provide, cloneVNode, h, useSSRContext, createApp, mergeProps, inject, useId, computed, createVNode, resolveDynamicComponent, unref, toHandlers, useModel, ref, watchEffect, withCtx, renderSlot, openBlock, createBlock, Fragment, renderList, mergeModels, reactive, isRef, onErrorCaptured, onServerPrefetch, shallowReactive, effectScope, defineAsyncComponent, getCurrentScope, toRef, isReadonly, isShallow, isReactive, toRaw } from 'vue';
import { p as parseURL, e as encodePath, i as decodePath, k as hasProtocol, l as isScriptProtocol, m as joinURL, w as withQuery, s as sanitizeStatusCode, n as getContext, $ as $fetch, o as createHooks, c as createError$1, q as isEqual, r as stringifyParsedURL, t as stringifyQuery, v as parseQuery, x as defu } from '../nitro/nitro.mjs';
import { b as baseURL } from '../routes/renderer.mjs';
import { useDryv } from '@softwareproduction/dryvue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderAttr, ssrIncludeBooleanAttr, ssrLooseContain, ssrRenderList, ssrLooseEqual, ssrRenderComponent, ssrRenderVNode, ssrRenderSlot, ssrRenderSuspense } from 'vue/server-renderer';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/utils';
import 'unhead/plugins';

if (!globalThis.$fetch) {
  globalThis.$fetch = $fetch.create({
    baseURL: baseURL()
  });
}
if (!("global" in globalThis)) {
  globalThis.global = globalThis;
}
const nuxtLinkDefaults = { "componentName": "NuxtLink" };
const appId = "nuxt-app";
function getNuxtAppCtx(id = appId) {
  return getContext(id, {
    asyncContext: false
  });
}
const NuxtPluginIndicator = "__nuxt_plugin";
function createNuxtApp(options) {
  let hydratingCount = 0;
  const nuxtApp = {
    _id: options.id || appId || "nuxt-app",
    _scope: effectScope(),
    provide: void 0,
    globalName: "nuxt",
    versions: {
      get nuxt() {
        return "3.21.7";
      },
      get vue() {
        return nuxtApp.vueApp.version;
      }
    },
    payload: shallowReactive({
      ...options.ssrContext?.payload || {},
      data: shallowReactive({}),
      state: reactive({}),
      once: /* @__PURE__ */ new Set(),
      _errors: shallowReactive({})
    }),
    static: {
      data: {}
    },
    runWithContext(fn) {
      if (nuxtApp._scope.active && !getCurrentScope()) {
        return nuxtApp._scope.run(() => callWithNuxt(nuxtApp, fn));
      }
      return callWithNuxt(nuxtApp, fn);
    },
    isHydrating: false,
    deferHydration() {
      if (!nuxtApp.isHydrating) {
        return () => {
        };
      }
      hydratingCount++;
      let called = false;
      return () => {
        if (called) {
          return;
        }
        called = true;
        hydratingCount--;
        if (hydratingCount === 0) {
          nuxtApp.isHydrating = false;
          return nuxtApp.callHook("app:suspense:resolve");
        }
      };
    },
    _asyncDataPromises: {},
    _asyncData: shallowReactive({}),
    _payloadRevivers: {},
    ...options
  };
  {
    nuxtApp.payload.serverRendered = true;
  }
  if (nuxtApp.ssrContext) {
    nuxtApp.payload.path = nuxtApp.ssrContext.url;
    nuxtApp.ssrContext.nuxt = nuxtApp;
    nuxtApp.ssrContext.payload = nuxtApp.payload;
    nuxtApp.ssrContext.config = {
      public: nuxtApp.ssrContext.runtimeConfig.public,
      app: nuxtApp.ssrContext.runtimeConfig.app
    };
  }
  nuxtApp.hooks = createHooks();
  nuxtApp.hook = nuxtApp.hooks.hook;
  {
    const contextCaller = async function(hooks, args) {
      for (const hook of hooks) {
        await nuxtApp.runWithContext(() => hook(...args));
      }
    };
    nuxtApp.hooks.callHook = (name, ...args) => nuxtApp.hooks.callHookWith(contextCaller, name, ...args);
  }
  nuxtApp.callHook = nuxtApp.hooks.callHook;
  nuxtApp.provide = (name, value) => {
    const $name = "$" + name;
    defineGetter(nuxtApp, $name, value);
    defineGetter(nuxtApp.vueApp.config.globalProperties, $name, value);
  };
  defineGetter(nuxtApp.vueApp, "$nuxt", nuxtApp);
  defineGetter(nuxtApp.vueApp.config.globalProperties, "$nuxt", nuxtApp);
  const runtimeConfig = options.ssrContext.runtimeConfig;
  nuxtApp.provide("config", runtimeConfig);
  return nuxtApp;
}
function registerPluginHooks(nuxtApp, plugin) {
  if (plugin.hooks) {
    nuxtApp.hooks.addHooks(plugin.hooks);
  }
}
async function applyPlugin(nuxtApp, plugin) {
  if (typeof plugin === "function") {
    const { provide: provide2 } = await nuxtApp.runWithContext(() => plugin(nuxtApp)) || {};
    if (provide2 && typeof provide2 === "object") {
      for (const key in provide2) {
        nuxtApp.provide(key, provide2[key]);
      }
    }
  }
}
async function applyPlugins(nuxtApp, plugins2) {
  const resolvedPlugins = /* @__PURE__ */ new Set();
  const unresolvedPlugins = [];
  const parallels = [];
  let error = void 0;
  let promiseDepth = 0;
  async function executePlugin(plugin) {
    const unresolvedPluginsForThisPlugin = plugin.dependsOn?.filter((name) => plugins2.some((p) => p._name === name) && !resolvedPlugins.has(name)) ?? [];
    if (unresolvedPluginsForThisPlugin.length > 0) {
      unresolvedPlugins.push([new Set(unresolvedPluginsForThisPlugin), plugin]);
    } else {
      const promise = applyPlugin(nuxtApp, plugin).then(async () => {
        if (plugin._name) {
          resolvedPlugins.add(plugin._name);
          await Promise.all(unresolvedPlugins.map(async ([dependsOn, unexecutedPlugin]) => {
            if (dependsOn.has(plugin._name)) {
              dependsOn.delete(plugin._name);
              if (dependsOn.size === 0) {
                promiseDepth++;
                await executePlugin(unexecutedPlugin);
              }
            }
          }));
        }
      }).catch((e) => {
        if (!plugin.parallel && !nuxtApp.payload.error) {
          throw e;
        }
        error ||= e;
      });
      if (plugin.parallel) {
        parallels.push(promise);
      } else {
        await promise;
      }
    }
  }
  for (const plugin of plugins2) {
    if (nuxtApp.ssrContext?.islandContext && plugin.env?.islands === false) {
      continue;
    }
    registerPluginHooks(nuxtApp, plugin);
  }
  for (const plugin of plugins2) {
    if (nuxtApp.ssrContext?.islandContext && plugin.env?.islands === false) {
      continue;
    }
    await executePlugin(plugin);
  }
  await Promise.all(parallels);
  if (promiseDepth) {
    for (let i = 0; i < promiseDepth; i++) {
      await Promise.all(parallels);
    }
  }
  if (error) {
    throw nuxtApp.payload.error || error;
  }
}
// @__NO_SIDE_EFFECTS__
function defineNuxtPlugin(plugin) {
  if (typeof plugin === "function") {
    return plugin;
  }
  const _name = plugin._name || plugin.name;
  delete plugin.name;
  return Object.assign(plugin.setup || (() => {
  }), plugin, { [NuxtPluginIndicator]: true, _name });
}
function callWithNuxt(nuxt, setup, args) {
  const fn = () => setup();
  const nuxtAppCtx = getNuxtAppCtx(nuxt._id);
  {
    return nuxt.vueApp.runWithContext(() => nuxtAppCtx.callAsync(nuxt, fn));
  }
}
function tryUseNuxtApp(id) {
  let nuxtAppInstance;
  if (hasInjectionContext()) {
    nuxtAppInstance = getCurrentInstance()?.appContext.app.$nuxt;
  }
  nuxtAppInstance ||= getNuxtAppCtx(id).tryUse();
  return nuxtAppInstance || null;
}
function useNuxtApp(id) {
  const nuxtAppInstance = tryUseNuxtApp(id);
  if (!nuxtAppInstance) {
    {
      throw new Error("[nuxt] instance unavailable");
    }
  }
  return nuxtAppInstance;
}
// @__NO_SIDE_EFFECTS__
function useRuntimeConfig(_event) {
  return useNuxtApp().$config;
}
function defineGetter(obj, key, val) {
  Object.defineProperty(obj, key, { get: () => val });
}
const PageRouteSymbol = /* @__PURE__ */ Symbol("route");
globalThis._importMeta_.url.replace(/\/app\/.*$/, "/");
const useRouter = () => {
  return useNuxtApp()?.$router;
};
const useRoute = () => {
  if (hasInjectionContext()) {
    return inject(PageRouteSymbol, useNuxtApp()._route);
  }
  return useNuxtApp()._route;
};
// @__NO_SIDE_EFFECTS__
function defineNuxtRouteMiddleware(middleware) {
  return middleware;
}
const isProcessingMiddleware = () => {
  try {
    if (useNuxtApp()._processingMiddleware) {
      return true;
    }
  } catch {
    return false;
  }
  return false;
};
const HTML_ATTR_UNSAFE_RE = /[&"'<>]/g;
const HTML_ATTR_ENCODE_MAP = {
  "&": "%26",
  '"': "%22",
  "'": "%27",
  "<": "%3C",
  ">": "%3E"
};
function encodeForHtmlAttr(value) {
  return value.replace(HTML_ATTR_UNSAFE_RE, (c) => HTML_ATTR_ENCODE_MAP[c]);
}
const navigateTo = (to, options) => {
  to ||= "/";
  const toPath = typeof to === "string" ? to : "path" in to ? resolveRouteObject(to) : useRouter().resolve(to).href;
  const isExternalHost = hasProtocol(toPath, { acceptRelative: true });
  const isExternal = options?.external || isExternalHost;
  if (isExternal) {
    if (!options?.external) {
      throw new Error("Navigating to an external URL is not allowed by default. Use `navigateTo(url, { external: true })`.");
    }
    const { protocol } = new URL(toPath, "http://localhost");
    if (protocol && isScriptProtocol(protocol)) {
      throw new Error(`Cannot navigate to a URL with '${protocol}' protocol.`);
    }
  }
  const inMiddleware = isProcessingMiddleware();
  const router = useRouter();
  const nuxtApp = useNuxtApp();
  {
    if (nuxtApp.ssrContext) {
      const fullPath = typeof to === "string" || isExternal ? toPath : router.resolve(to).fullPath || "/";
      const location2 = isExternal ? toPath : joinURL((/* @__PURE__ */ useRuntimeConfig()).app.baseURL, fullPath);
      const redirect = async function(response) {
        await nuxtApp.callHook("app:redirected");
        const encodedHeader = encodeURL(location2, isExternalHost);
        const encodedLoc = encodeForHtmlAttr(encodedHeader);
        nuxtApp.ssrContext["~renderResponse"] = {
          statusCode: sanitizeStatusCode(options?.redirectCode || 302, 302),
          body: `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0; url=${encodedLoc}"></head></html>`,
          headers: { location: encodedHeader }
        };
        return response;
      };
      if (!isExternal && inMiddleware) {
        router.afterEach((final) => final.fullPath === fullPath ? redirect(false) : void 0);
        return to;
      }
      return redirect(!inMiddleware ? void 0 : (
        /* abort route navigation */
        false
      ));
    }
  }
  if (isExternal) {
    nuxtApp._scope.stop();
    if (options?.replace) {
      (void 0).replace(toPath);
    } else {
      (void 0).href = toPath;
    }
    if (inMiddleware) {
      if (!nuxtApp.isHydrating) {
        return false;
      }
      return new Promise(() => {
      });
    }
    return Promise.resolve();
  }
  const encodedTo = typeof to === "string" ? encodeRoutePath(to) : to;
  return options?.replace ? router.replace(encodedTo) : router.push(encodedTo);
};
function resolveRouteObject(to) {
  return withQuery(to.path || "", to.query || {}) + (to.hash || "");
}
function encodeURL(location2, isExternalHost = false) {
  const url = new URL(location2, "http://localhost");
  if (!isExternalHost) {
    const pathname = url.pathname.replace(/^\/{2,}/, "/");
    return pathname + url.search + url.hash;
  }
  if (location2.startsWith("//")) {
    return url.toString().replace(url.protocol, "");
  }
  return url.toString();
}
function encodeRoutePath(url) {
  const parsed = parseURL(url);
  return encodePath(decodePath(parsed.pathname)) + parsed.search + parsed.hash;
}
const NUXT_ERROR_SIGNATURE = "__nuxt_error";
const useError = /* @__NO_SIDE_EFFECTS__ */ () => toRef(useNuxtApp().payload, "error");
const showError = (error) => {
  const nuxtError = createError(error);
  try {
    const error2 = /* @__PURE__ */ useError();
    if (false) ;
    error2.value ||= nuxtError;
  } catch {
    throw nuxtError;
  }
  return nuxtError;
};
const isNuxtError = (error) => !!error && typeof error === "object" && NUXT_ERROR_SIGNATURE in error;
const createError = (error) => {
  if (typeof error !== "string" && error.statusText) {
    error.message ??= error.statusText;
  }
  const nuxtError = createError$1(error);
  Object.defineProperty(nuxtError, NUXT_ERROR_SIGNATURE, {
    value: true,
    configurable: false,
    writable: false
  });
  Object.defineProperty(nuxtError, "status", {
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    get: () => nuxtError.statusCode,
    configurable: true
  });
  Object.defineProperty(nuxtError, "statusText", {
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    get: () => nuxtError.statusMessage,
    configurable: true
  });
  return nuxtError;
};
function freezeHead(head) {
  const realPush = head.push;
  head.push = () => ({ dispose: () => {
  }, patch: () => {
  }, _poll: () => {
  } });
  return () => {
    head.push = realPush;
  };
}
const unhead_iaNBKD85E0BdZlEjRbBcefzt3E0mGDGmWlNHfw1nbdw = /* @__PURE__ */ defineNuxtPlugin({
  name: "nuxt:head",
  enforce: "pre",
  setup(nuxtApp) {
    const head = nuxtApp.ssrContext.head;
    if (nuxtApp.ssrContext.islandContext) {
      const unfreeze = freezeHead(head);
      nuxtApp.hooks.hookOnce("app:created", unfreeze);
    }
    nuxtApp.vueApp.use(head);
  }
});
const matcher = (m, p) => {
  return [];
};
const _routeRulesMatcher = (path) => defu({}, ...matcher("", typeof path === "string" ? path.toLowerCase() : path).map((r) => r.data).reverse());
const routeRulesMatcher = _routeRulesMatcher;
function getRouteRules(arg) {
  const path = typeof arg === "string" ? arg : arg.path;
  try {
    return routeRulesMatcher(path.toLowerCase());
  } catch (e) {
    console.error("[nuxt] Error matching route rules.", e);
    return {};
  }
}
const manifest_45route_45rule = /* @__PURE__ */ defineNuxtRouteMiddleware((to) => {
  {
    return;
  }
});
const globalMiddleware = [
  manifest_45route_45rule
];
function getRouteFromPath(fullPath) {
  const route = fullPath && typeof fullPath === "object" ? fullPath : {};
  if (typeof fullPath === "object") {
    fullPath = stringifyParsedURL({
      pathname: fullPath.path || "",
      search: stringifyQuery(fullPath.query || {}),
      hash: fullPath.hash || ""
    });
  }
  const url = new URL(fullPath.toString(), "http://localhost");
  return {
    path: url.pathname,
    fullPath,
    query: parseQuery(url.search),
    hash: url.hash,
    // stub properties for compat with vue-router
    params: route.params || {},
    name: void 0,
    matched: route.matched || [],
    redirectedFrom: void 0,
    meta: route.meta || {},
    href: fullPath
  };
}
const router_bUAODN0ZPdItqvM8BVWW5DArQn1SR1couZ4T8AG1uBU = /* @__PURE__ */ defineNuxtPlugin({
  name: "nuxt:router",
  enforce: "pre",
  setup(nuxtApp) {
    const initialURL = nuxtApp.ssrContext.url;
    const routes = [];
    const hooks = {
      "navigate:before": [],
      "resolve:before": [],
      "navigate:after": [],
      "error": []
    };
    const registerHook = (hook, guard) => {
      hooks[hook].push(guard);
      return () => hooks[hook].splice(hooks[hook].indexOf(guard), 1);
    };
    (/* @__PURE__ */ useRuntimeConfig()).app.baseURL;
    const route = reactive(getRouteFromPath(initialURL));
    async function handleNavigation(url, replace) {
      try {
        const to = getRouteFromPath(url);
        for (const middleware of hooks["navigate:before"]) {
          const result = await middleware(to, route);
          if (result === false || result instanceof Error) {
            return;
          }
          if (typeof result === "string" && result.length) {
            return await handleNavigation(result, true);
          }
        }
        for (const handler of hooks["resolve:before"]) {
          await handler(to, route);
        }
        Object.assign(route, to);
        if (false) ;
        for (const middleware of hooks["navigate:after"]) {
          await middleware(to, route);
        }
      } catch (err) {
        for (const handler of hooks.error) {
          await handler(err);
        }
      }
    }
    const currentRoute = computed(() => route);
    const router = {
      currentRoute,
      isReady: () => Promise.resolve(),
      // These options provide a similar API to vue-router but have no effect
      options: {},
      install: () => Promise.resolve(),
      // Navigation
      push: (url) => handleNavigation(url),
      replace: (url) => handleNavigation(url),
      back: () => (void 0).history.go(-1),
      go: (delta) => (void 0).history.go(delta),
      forward: () => (void 0).history.go(1),
      // Guards
      beforeResolve: (guard) => registerHook("resolve:before", guard),
      beforeEach: (guard) => registerHook("navigate:before", guard),
      afterEach: (guard) => registerHook("navigate:after", guard),
      onError: (handler) => registerHook("error", handler),
      // Routes
      resolve: getRouteFromPath,
      addRoute: (parentName, route2) => {
        routes.push(route2);
      },
      getRoutes: () => routes,
      hasRoute: (name) => routes.some((route2) => route2.name === name),
      removeRoute: (name) => {
        const index = routes.findIndex((route2) => route2.name === name);
        if (index !== -1) {
          routes.splice(index, 1);
        }
      }
    };
    nuxtApp.vueApp.component("RouterLink", defineComponent({
      functional: true,
      props: {
        to: {
          type: String,
          required: true
        },
        custom: Boolean,
        replace: Boolean,
        // Not implemented
        activeClass: String,
        exactActiveClass: String,
        ariaCurrentValue: String
      },
      setup: (props, { slots }) => {
        const navigate = () => handleNavigation(props.to, props.replace);
        return () => {
          const route2 = router.resolve(props.to);
          return props.custom ? slots.default?.({ href: props.to, navigate, route: route2 }) : h("a", { href: props.to, onClick: (e) => {
            e.preventDefault();
            return navigate();
          } }, slots);
        };
      }
    }));
    nuxtApp._route = route;
    nuxtApp._middleware ||= {
      global: [],
      named: {}
    };
    const initialLayout = nuxtApp.payload.state._layout;
    const initialLayoutProps = nuxtApp.payload.state._layoutProps;
    nuxtApp.hooks.hookOnce("app:created", async () => {
      router.beforeEach(async (to, from) => {
        to.meta = reactive(to.meta || {});
        if (nuxtApp.isHydrating && initialLayout && !isReadonly(to.meta.layout)) {
          to.meta.layout = initialLayout;
          to.meta.layoutProps = initialLayoutProps;
        }
        nuxtApp._processingMiddleware = true;
        if (!nuxtApp.ssrContext?.islandContext) {
          const middlewareEntries = /* @__PURE__ */ new Set([...globalMiddleware, ...nuxtApp._middleware.global]);
          const routeRules = getRouteRules({ path: to.path });
          if (routeRules.appMiddleware) {
            for (const key in routeRules.appMiddleware) {
              const guard = nuxtApp._middleware.named[key];
              if (!guard) {
                continue;
              }
              if (routeRules.appMiddleware[key]) {
                middlewareEntries.add(guard);
              } else {
                middlewareEntries.delete(guard);
              }
            }
          }
          for (const middleware of middlewareEntries) {
            const result = await nuxtApp.runWithContext(() => middleware(to, from));
            {
              if (result === false || result instanceof Error) {
                const error = result || createError$1({
                  status: 404,
                  statusText: `Page Not Found: ${initialURL}`,
                  data: {
                    path: initialURL
                  }
                });
                delete nuxtApp._processingMiddleware;
                return nuxtApp.runWithContext(() => showError(error));
              }
            }
            if (result === true) {
              continue;
            }
            if (result || result === false) {
              return result;
            }
          }
        }
      });
      router.afterEach(() => {
        delete nuxtApp._processingMiddleware;
      });
      await router.replace(initialURL);
      if (!isEqual(route.fullPath, initialURL)) {
        await nuxtApp.runWithContext(() => navigateTo(route.fullPath));
      }
    });
    return {
      provide: {
        route,
        router
      }
    };
  }
});
function definePayloadReducer(name, reduce) {
  {
    useNuxtApp().ssrContext["~payloadReducers"][name] = reduce;
  }
}
const reducers = [
  ["NuxtError", (data) => isNuxtError(data) && data.toJSON()],
  ["EmptyShallowRef", (data) => isRef(data) && isShallow(data) && !data.value && (typeof data.value === "bigint" ? "0n" : JSON.stringify(data.value) || "_")],
  ["EmptyRef", (data) => isRef(data) && !data.value && (typeof data.value === "bigint" ? "0n" : JSON.stringify(data.value) || "_")],
  ["ShallowRef", (data) => isRef(data) && isShallow(data) && data.value],
  ["ShallowReactive", (data) => isReactive(data) && isShallow(data) && toRaw(data)],
  ["Ref", (data) => isRef(data) && data.value],
  ["Reactive", (data) => isReactive(data) && toRaw(data)]
];
const revive_payload_server_Rp_g8NljhKpOjf6hgSLZj_me1dqT3r7lMZ5ghBb2kPo = /* @__PURE__ */ defineNuxtPlugin({
  name: "nuxt:revive-payload:server",
  setup() {
    for (const [reducer, fn] of reducers) {
      definePayloadReducer(reducer, fn);
    }
  }
});
const components_plugin_z4hgvsiddfKkfXTP6M8M4zG5Cb7sGnDhcryKVM45Di4 = /* @__PURE__ */ defineNuxtPlugin({
  name: "nuxt:global-components"
});
defineComponent({
  name: "ServerPlaceholder",
  render() {
    return createElementBlock("div");
  }
});
const clientOnlySymbol = /* @__PURE__ */ Symbol.for("nuxt:client-only");
defineComponent({
  name: "ClientOnly",
  inheritAttrs: false,
  props: ["fallback", "placeholder", "placeholderTag", "fallbackTag"],
  ...false,
  setup(props, { slots, attrs }) {
    const mounted = shallowRef(false);
    const vm = getCurrentInstance();
    if (vm) {
      vm._nuxtClientOnly = true;
    }
    provide(clientOnlySymbol, true);
    return () => {
      if (mounted.value) {
        const vnodes = slots.default?.();
        if (vnodes && vnodes.length === 1) {
          return [cloneVNode(vnodes[0], attrs)];
        }
        return vnodes;
      }
      const slot = slots.fallback || slots.placeholder;
      if (slot) {
        return h(slot);
      }
      const fallbackStr = props.fallback || props.placeholder || "";
      const fallbackTag = props.fallbackTag || props.placeholderTag || "span";
      return createElementBlock(fallbackTag, attrs, fallbackStr);
    };
  }
});
var INTROSPECTION_FORMS_KEY = /* @__PURE__ */ Symbol("introspection-forms");
var INTROSPECTION_FORMS_USE_DRYV_KEY = /* @__PURE__ */ Symbol("introspection-forms:useDryv");
var IntrospectionFormsPlugin = {
  install(app, options) {
    if (options?.defaults) {
      app.provide(INTROSPECTION_FORMS_KEY, options.defaults);
    }
    if (options?.useDryv) {
      app.provide(INTROSPECTION_FORMS_USE_DRYV_KEY, options.useDryv);
    }
    if (options?.translate) {
      app.provide("introspection-forms:translate", options.translate);
    }
    app.provide("introspection-forms:translationPrefix", options?.translationPrefix ?? "forms.");
    if (options?.components?.IntrospectionForm) {
      app.component("IntrospectionForm", options.components.IntrospectionForm);
    }
    if (options?.components?.IntrospectionField) {
      app.component("IntrospectionField", options.components.IntrospectionField);
    }
  }
};
const dryv_TNuZcpA8cJEhyUubJmlDlK6DBOf_JxCCloP7BIyf2Pc = /* @__PURE__ */ defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.provide(INTROSPECTION_FORMS_USE_DRYV_KEY, useDryv);
});
const _sfc_main$7 = /* @__PURE__ */ defineComponent({
  __name: "FormInput",
  __ssrInlineRender: true,
  props: {
    id: {},
    name: {},
    label: {},
    disabled: { type: Boolean },
    required: { type: Boolean },
    validatable: {}
  },
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "field" }, _attrs))}><label>${ssrInterpolate(__props.label)}</label><input${ssrRenderAttr("value", __props.validatable.value)} type="text">`);
      if (__props.validatable?.text) {
        _push(`<p class="err">${ssrInterpolate(__props.validatable.text)}</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup$7 = _sfc_main$7.setup;
_sfc_main$7.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/FormInput.vue");
  return _sfc_setup$7 ? _sfc_setup$7(props, ctx) : void 0;
};
const _sfc_main$6 = /* @__PURE__ */ defineComponent({
  __name: "FormCheckbox",
  __ssrInlineRender: true,
  props: {
    id: {},
    name: {},
    label: {},
    disabled: { type: Boolean },
    required: { type: Boolean },
    validatable: {}
  },
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<label${ssrRenderAttrs(mergeProps({ class: "field" }, _attrs))}><input type="checkbox"${ssrIncludeBooleanAttr(Array.isArray(__props.validatable.value) ? ssrLooseContain(__props.validatable.value, null) : __props.validatable.value) ? " checked" : ""}> ${ssrInterpolate(__props.label)}</label>`);
    };
  }
});
const _sfc_setup$6 = _sfc_main$6.setup;
_sfc_main$6.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/FormCheckbox.vue");
  return _sfc_setup$6 ? _sfc_setup$6(props, ctx) : void 0;
};
const _sfc_main$5 = /* @__PURE__ */ defineComponent({
  __name: "FormSelect",
  __ssrInlineRender: true,
  props: {
    id: {},
    name: {},
    label: {},
    disabled: { type: Boolean },
    required: { type: Boolean },
    validatable: {},
    options: {}
  },
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "field" }, _attrs))}><label>${ssrInterpolate(__props.label)}</label><select><!--[-->`);
      ssrRenderList(__props.options ?? [], (o) => {
        _push(`<option${ssrRenderAttr("value", o)}${ssrIncludeBooleanAttr(Array.isArray(__props.validatable.value) ? ssrLooseContain(__props.validatable.value, o) : ssrLooseEqual(__props.validatable.value, o)) ? " selected" : ""}>${ssrInterpolate(o)}</option>`);
      });
      _push(`<!--]--></select></div>`);
    };
  }
});
const _sfc_setup$5 = _sfc_main$5.setup;
_sfc_main$5.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/FormSelect.vue");
  return _sfc_setup$5 ? _sfc_setup$5(props, ctx) : void 0;
};
const forms_HUSDi4BCJh46IkUS_OZjsoWkXGBnSauQWzXkYoHHkHc = /* @__PURE__ */ defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(IntrospectionFormsPlugin, {
    defaults: {
      byFieldType: {
        string: { component: _sfc_main$7 },
        boolean: { component: _sfc_main$6 },
        enum: { component: _sfc_main$5 }
      }
    }
  });
});
const plugins = [
  unhead_iaNBKD85E0BdZlEjRbBcefzt3E0mGDGmWlNHfw1nbdw,
  router_bUAODN0ZPdItqvM8BVWW5DArQn1SR1couZ4T8AG1uBU,
  revive_payload_server_Rp_g8NljhKpOjf6hgSLZj_me1dqT3r7lMZ5ghBb2kPo,
  components_plugin_z4hgvsiddfKkfXTP6M8M4zG5Cb7sGnDhcryKVM45Di4,
  dryv_TNuZcpA8cJEhyUubJmlDlK6DBOf_JxCCloP7BIyf2Pc,
  forms_HUSDi4BCJh46IkUS_OZjsoWkXGBnSauQWzXkYoHHkHc
];
function findFieldConfiguration(defaults, introspection, t) {
  if (!defaults || !introspection) {
    return void 0;
  }
  return findConfigByFieldName(defaults, introspection, t) ?? findBy(defaults.byOriginalType, introspection.originalType, introspection, t) ?? findBy(defaults.byFieldType, introspection.type, introspection, t);
}
function findBy(defaults, key, introspection, t) {
  if (!defaults) {
    return void 0;
  }
  const configOrFn = defaults[key];
  return typeof configOrFn === "function" ? configOrFn(introspection, t) : configOrFn;
}
function findConfigByFieldName(defaults, introspection, t) {
  if (!defaults.byFieldName) {
    return void 0;
  }
  const fieldName = introspection.name;
  const configOrFn = defaults.byFieldName.find((f) => f.regexp.test(fieldName))?.config;
  return typeof configOrFn === "function" ? configOrFn(introspection, t) : configOrFn;
}
function useIntrospectionForm(arg0, arg1, ...args) {
  const defaults = inject(INTROSPECTION_FORMS_KEY, void 0);
  const t = inject("introspection-forms:translate", (key) => key);
  const { introspection, rules, config, options } = parseArguments([arg0, arg1, ...args]);
  const order = getFieldOrder(config);
  const fieldIntrospections = Object.fromEntries(introspection.fields.map((f) => [f.name, f]));
  const configFromArgs = buildFieldConfiguration(config, defaults, fieldIntrospections, t);
  const configFromDefaults = findMatchingFieldConfiguration(
    configFromArgs,
    defaults,
    fieldIntrospections,
    t,
    introspection
  );
  const mergedConfigs = {};
  for (const fieldName of [.../* @__PURE__ */ new Set([...Object.keys(configFromDefaults), ...Object.keys(configFromArgs)])]) {
    const def = configFromDefaults[fieldName];
    const arg = configFromArgs[fieldName];
    mergedConfigs[fieldName] = {
      ...def,
      ...arg,
      props: {
        ...def?.props,
        ...arg?.props
      },
      emits: {
        ...def?.emits,
        ...arg?.emits
      }
    };
  }
  const fieldRuntimes = createRuntimeFields(mergedConfigs, introspection, order);
  return {
    introspection,
    rules,
    fields: fieldRuntimes,
    visible: (item) => options?.visible ? options.visible(item) : true,
    disabled: (item) => options?.disabled ? options.disabled(item) : false,
    props: options?.props ? convertToFunctions(options.props) : {}
  };
}
function createFieldRuntime(name, value, introspection) {
  return {
    name,
    ...convertToFunctions(value),
    introspection: introspection.fields.find((f) => f.name === name),
    props: value?.props ? convertToFunctions(value.props) : {},
    emits: value?.emits
  };
}
function convertToFunctions(config) {
  if (!config) return {};
  return Object.fromEntries(
    Object.entries(config).map(
      ([key, value]) => key === "props" || key === "emits" ? [key, value] : typeof value === "function" ? [key, value] : [key, () => isRef(value) ? value.value : value]
    )
  );
}
function getFieldOrder(config) {
  const order = [];
  for (const cf of config) {
    if (typeof cf === "string") {
      order.push(cf);
    } else {
      order.push(...Object.keys(cf));
    }
  }
  return order;
}
function findMatchingFieldConfiguration(configFromArgs, defaults, fieldIntrospections, t, introspection) {
  const fieldNames = Object.keys(configFromArgs);
  return Object.fromEntries(
    fieldNames.length ? fieldNames.map((fieldName) => [fieldName, findFieldConfiguration(defaults, fieldIntrospections[fieldName], t)]).filter(([, v]) => !!v) : introspection.fields.map((f) => [f.name, findFieldConfiguration(defaults, f, t)])
  );
}
function buildFieldConfiguration(config, defaults, fieldIntrospections, t) {
  return Object.fromEntries(
    config.map(
      (cfg) => typeof cfg === "string" ? [cfg, findFieldConfiguration(defaults, fieldIntrospections[cfg], t)] : Object.entries(cfg).map(
        ([fieldName, fieldConfig]) => typeof fieldConfig === "boolean" ? fieldConfig ? [fieldName, findFieldConfiguration(defaults, fieldIntrospections[fieldName], t)] : void 0 : [fieldName, fieldConfig]
      )
    ).flat().filter(Boolean)
  );
}
function isValidationRuleSet(arg) {
  return typeof arg === "object" && arg !== null && "validators" in arg;
}
function parseArguments(args) {
  let introspection;
  let rules;
  let config;
  let options;
  args = args.filter(Boolean);
  const arg0 = args[0];
  if (typeof arg0 === "object" && arg0 !== null && "introspection" in arg0) {
    options = arg0;
    introspection = options.introspection;
    rules = options.rules;
    config = [options.config];
  } else {
    introspection = arg0;
    const arg1 = args[1];
    if (isValidationRuleSet(arg1)) {
      rules = arg1;
      config = args.slice(2);
    } else {
      config = args.slice(1);
    }
  }
  return { introspection, rules, config, options };
}
function createRuntimeFields(mergedConfigs, introspection, order) {
  return Object.entries(mergedConfigs).map(([fieldName, config]) => createFieldRuntime(fieldName, config, introspection)).sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));
}
function convert(value, type) {
  switch (type) {
    case "boolean":
      return !!value && !/false|0|off|no/i.test(String(value));
    case "number":
      return value == null ? value : Number(value);
    case "string":
      return value == null ? value : String(value);
    default:
      return value;
  }
}
function writeStorage(type, key, data) {
  return;
}
const _sfc_main$4 = /* @__PURE__ */ defineComponent({
  __name: "IntrospectionField",
  __ssrInlineRender: true,
  props: {
    validatable: {},
    model: {},
    type: {},
    field: {},
    columns: { default: 2 }
  },
  setup(__props) {
    const props = __props;
    const t = inject("introspection-forms:translate", (key) => key);
    const translationPrefix = inject("introspection-forms:translationPrefix", "forms.");
    const id = useId();
    const typingProxy = computed(
      () => props.validatable && props.field?.introspection ? createTypingProxy(props.validatable, props.field.introspection, (newValue) => {
        const handler = props.field.emits?.["update:modelValue"];
        if (handler) handler(props.model, t, newValue);
      }) : props.validatable
    );
    const fieldForm = computed(() => props.field.form?.());
    const visible = computed(
      () => (props.field.visible?.(props.model) ?? true) && (fieldForm.value?.visible(props.model) ?? true)
    );
    const spanClass = computed(() => `introspection-field introspection-field--${props.field.name} span-${props.field.span?.(props.model) ?? props.columns}`);
    function toValues(item, functions) {
      return functions ? Object.fromEntries(Object.entries(functions).map(([key, value]) => [key, value(item, t)])) : {};
    }
    function toEmits(item, emits) {
      return emits ? Object.fromEntries(
        Object.entries(emits).map(([key, handler]) => [key, (...args) => handler(item, t, ...args)])
      ) : {};
    }
    function createTypingProxy(validatable, introspection, onValueChange) {
      return new Proxy(validatable, {
        get(target, prop) {
          return target[prop];
        },
        set(target, prop, newValue) {
          const value = prop === "value" ? convert(newValue, introspection.type) : newValue;
          target[prop] = value;
          if (prop === "value" && onValueChange) onValueChange(value);
          return true;
        }
      });
    }
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: spanClass.value }, _attrs, {
        style: visible.value ? null : { display: "none" }
      }))}>`);
      if (fieldForm.value) {
        _push(ssrRenderComponent(_sfc_main$3, {
          as: "div",
          form: fieldForm.value,
          columns: __props.columns,
          model: __props.validatable,
          dependent: ""
        }, null, _parent));
      } else if (typeof __props.field.component !== "function") {
        _push(`<div class="introspection-field-error"> The field &#39;${ssrInterpolate(__props.field.name)}&#39; does not have an assigned component. </div>`);
      } else if (!__props.field.introspection) {
        ssrRenderVNode(_push, createVNode(resolveDynamicComponent(__props.field.component(__props.model)), mergeProps({ id: unref(id) }, toValues(__props.model, __props.field.props), toHandlers(toEmits(__props.model, __props.field.emits)), { validatable: typingProxy.value }), null), _parent);
      } else {
        ssrRenderVNode(_push, createVNode(resolveDynamicComponent(__props.field.component(__props.model)), mergeProps({
          id: unref(id),
          name: `${__props.type.name}.${__props.field.name}`,
          required: __props.validatable?.required,
          label: __props.field.label?.(__props.model) ?? unref(t)(`${unref(translationPrefix)}${__props.type.name}.${__props.field.name}`),
          info: __props.field.info?.(__props.model)
        }, toValues(__props.model, __props.field.props), toHandlers(toEmits(__props.model, __props.field.emits)), {
          validatable: typingProxy.value,
          disabled: __props.field.disabled?.(__props.model)
        }), null), _parent);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup$4 = _sfc_main$4.setup;
_sfc_main$4.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("../../introspection-forms/dist/components/IntrospectionField.vue");
  return _sfc_setup$4 ? _sfc_setup$4(props, ctx) : void 0;
};
const _sfc_main$3 = /* @__PURE__ */ defineComponent({
  __name: "IntrospectionForm",
  __ssrInlineRender: true,
  props: /* @__PURE__ */ mergeModels({
    as: { default: "form" },
    model: {},
    form: {},
    columns: { default: 2 },
    dependent: { type: Boolean },
    storage: { type: [String, Boolean], default: "session" },
    interceptStorage: {},
    validatable: {}
  }, {
    "validate": {},
    "validateModifiers": {},
    "reset": {},
    "resetModifiers": {},
    "dirty": { type: Boolean, ...{ default: false } },
    "dirtyModifiers": {},
    "loaded": { type: Boolean, ...{ default: false } },
    "loadedModifiers": {},
    "parameters": {},
    "parametersModifiers": {},
    "el": {},
    "elModifiers": {}
  }),
  emits: ["update:validate", "update:reset", "update:dirty", "update:loaded", "update:parameters", "update:el"],
  setup(__props, { expose: __expose }) {
    const useDryvFn = inject(INTROSPECTION_FORMS_USE_DRYV_KEY, void 0);
    const props = __props;
    const validateModel = useModel(__props, "validate");
    const resetModel = useModel(__props, "reset");
    const dirtyModel = useModel(__props, "dirty");
    useModel(__props, "loaded");
    const parametersOut = useModel(__props, "parameters");
    const el = useModel(__props, "el");
    const elRef = ref();
    const storageType = computed(
      () => props.storage === true ? "session" : props.storage === false ? "none" : props.storage
    );
    inject("introspection-forms:translate", (key) => key);
    let session;
    if (props.dependent) {
      session = {
        resolvedValidatable: props.model,
        innerModel: props.model,
        validate: async () => {
          throw new Error("Dependent forms cannot be validated");
        }
      };
    } else if (props.validatable) {
      session = {
        resolvedValidatable: props.validatable,
        innerModel: props.model,
        validate: async () => ({ success: true })
      };
    } else if (props.form.rules) {
      if (!useDryvFn) {
        throw new Error(
          "IntrospectionForm: `form.rules` is set but no `useDryv` function was provided. Install @softwareproduction/dryvue and register it via `IntrospectionFormsPlugin` option `useDryv` (or the Nuxt module `dryv` option) — validation must never silently switch off."
        );
      }
      const dryvResult = useDryvFn(
        props.model,
        props.form.rules
      );
      session = {
        resolvedValidatable: dryvResult.validatable,
        innerModel: dryvResult.model,
        validate: dryvResult.validate,
        dirty: dryvResult.dirty,
        reset: dryvResult.reset,
        revert: dryvResult.revert,
        parameters: dryvResult.parameters
      };
    } else {
      session = {
        resolvedValidatable: new Proxy(props.model, {
          get(_, prop) {
            return {
              get value() {
                return props.model[prop];
              },
              set value(value) {
                props.model[prop] = value;
              },
              text: null
            };
          }
        }),
        innerModel: props.model,
        validate: async () => ({ success: true })
      };
    }
    const { resolvedValidatable, innerModel, dirty, reset, revert, parameters } = session;
    if (!props.dependent && resolvedValidatable && props.model) {
      watchEffect(() => {
        const validatableRef = resolvedValidatable;
        if (validatableRef?.value) {
          Object.assign(validatableRef.value, props.model);
        }
      });
    }
    if (dirty) {
      watchEffect(() => {
        dirtyModel.value = !!dirty.value;
      });
    }
    if (parameters) {
      watchEffect(() => {
        parametersOut.value = unref(parameters);
      });
    }
    watchEffect(() => {
      if (elRef.value) {
        el.value = elRef.value;
      }
    });
    validateModel.value = async (checkOnly) => {
      const result = await session.validate();
      const validationSuccessful = !result.hasErrors && !result.hasNewWarnings;
      if (checkOnly) {
        if (reset) reset();
        return validationSuccessful;
      }
      if (validationSuccessful) {
        const resolvedModel = unref(innerModel);
        if (resolvedModel) {
          Object.assign(props.model, resolvedModel);
        }
        if (storageType.value !== "none") {
          writeStorage(storageType.value, props.form.introspection.name, props.model);
        }
      }
      return validationSuccessful;
    };
    resetModel.value = () => {
      if (revert) revert();
      if (reset) reset();
    };
    function getFieldValidatable(fieldName) {
      return resolvedValidatable?.[fieldName];
    }
    function toValues(item, functions) {
      const resolved = unref(item);
      return functions ? Object.fromEntries(Object.entries(functions).map(([key, value]) => [key, value(resolved)])) : {};
    }
    __expose({
      el: elRef,
      persistToStorage() {
        if (storageType.value !== "none") {
          writeStorage(storageType.value, props.form.introspection.name, props.model);
        }
      }
    });
    return (_ctx, _push, _parent, _attrs) => {
      ssrRenderVNode(_push, createVNode(resolveDynamicComponent(__props.as), mergeProps({
        name: __props.form.introspection.name,
        style: __props.form.visible(unref(unref(innerModel))) ? null : { display: "none" }
      }, toValues(unref(innerModel), __props.form.props), {
        ref_key: "elRef",
        ref: elRef,
        onSubmit: () => {
        }
      }, _attrs), {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            ssrRenderSlot(_ctx.$slots, "fields", {
              fields: __props.form.fields,
              model: unref(innerModel),
              validatable: unref(resolvedValidatable)
            }, () => {
              _push2(`<!--[-->`);
              ssrRenderList(__props.form.fields, (field) => {
                _push2(ssrRenderComponent(_sfc_main$4, {
                  key: field.name,
                  type: __props.form.introspection,
                  field,
                  model: unref(innerModel),
                  validatable: getFieldValidatable(field.name),
                  columns: __props.columns
                }, null, _parent2, _scopeId));
              });
              _push2(`<!--]-->`);
            }, _push2, _parent2, _scopeId);
            ssrRenderSlot(_ctx.$slots, "default", {}, null, _push2, _parent2, _scopeId);
          } else {
            return [
              renderSlot(_ctx.$slots, "fields", {
                fields: __props.form.fields,
                model: unref(innerModel),
                validatable: unref(resolvedValidatable)
              }, () => [
                (openBlock(true), createBlock(Fragment, null, renderList(__props.form.fields, (field) => {
                  return openBlock(), createBlock(_sfc_main$4, {
                    key: field.name,
                    type: __props.form.introspection,
                    field,
                    model: unref(innerModel),
                    validatable: getFieldValidatable(field.name),
                    columns: __props.columns
                  }, null, 8, ["type", "field", "model", "validatable", "columns"]);
                }), 128))
              ]),
              renderSlot(_ctx.$slots, "default")
            ];
          }
        }),
        _: 3
      }), _parent);
    };
  }
});
const _sfc_setup$3 = _sfc_main$3.setup;
_sfc_main$3.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("../../introspection-forms/dist/components/IntrospectionForm.vue");
  return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
const ContactForm = {
  name: "ContactForm",
  fields: [
    { name: "name", type: "string", originalType: "String", isArray: false, isNullable: false, isEnum: false, enumValues: [], defaultValue: "" },
    { name: "newsletter", type: "boolean", originalType: "Boolean", isArray: false, isNullable: false, isEnum: false, enumValues: [], defaultValue: false },
    { name: "country", type: "enum", originalType: "Country", isArray: false, isNullable: false, isEnum: true, enumValues: ["DE", "AT", "CH"], defaultValue: "DE" }
  ],
  create(defaultValues) {
    return { name: "", newsletter: false, country: "DE", ...defaultValues || {} };
  }
};
const _sfc_main$2 = /* @__PURE__ */ defineComponent({
  __name: "app",
  __ssrInlineRender: true,
  setup(__props) {
    const rules = {
      name: "ContactForm",
      validators: {
        name: [{ annotations: { required: true }, validate: ($m) => !$m.name?.trim() ? "Name is required" : null }]
      }
    };
    const model = reactive({ name: "", newsletter: false, country: "DE" });
    const form = useIntrospectionForm(ContactForm, { rules });
    const validate = ref();
    const submitted = ref(false);
    async function submit() {
      const ok = await validate.value?.();
      if (ok) submitted.value = true;
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_IntrospectionForm = _sfc_main$3;
      _push(`<main${ssrRenderAttrs(mergeProps({ class: "p-8 max-w-md mx-auto space-y-4" }, _attrs))}><h1 class="text-xl font-semibold">Introspection forms playground</h1>`);
      _push(ssrRenderComponent(_component_IntrospectionForm, {
        validate: unref(validate),
        "onUpdate:validate": ($event) => isRef(validate) ? validate.value = $event : null,
        model,
        form: unref(form),
        columns: 1,
        onSubmit: submit
      }, null, _parent));
      _push(`<button class="border px-4 py-2">Submit</button>`);
      if (unref(submitted)) {
        _push(`<p class="text-green-700">Submitted!</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</main>`);
    };
  }
});
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("app.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const _sfc_main$1 = {
  __name: "nuxt-error-page",
  __ssrInlineRender: true,
  props: {
    error: Object
  },
  setup(__props) {
    const props = __props;
    const _error = props.error;
    const status = Number(_error.statusCode || 500);
    const is404 = status === 404;
    const statusText = _error.statusMessage ?? (is404 ? "Page Not Found" : "Internal Server Error");
    const description = _error.message || _error.toString();
    const stack = void 0;
    const _Error404 = defineAsyncComponent(() => import('./error-404-CwuIMjxl.mjs'));
    const _Error = defineAsyncComponent(() => import('./error-500-3cb2E8sC.mjs'));
    const ErrorTemplate = is404 ? _Error404 : _Error;
    return (_ctx, _push, _parent, _attrs) => {
      _push(ssrRenderComponent(unref(ErrorTemplate), mergeProps({ status: unref(status), statusText: unref(statusText), statusCode: unref(status), statusMessage: unref(statusText), description: unref(description), stack: unref(stack) }, _attrs), null, _parent));
    };
  }
};
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("../../../node_modules/nuxt/dist/app/components/nuxt-error-page.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const _sfc_main = {
  __name: "nuxt-root",
  __ssrInlineRender: true,
  setup(__props) {
    const IslandRenderer = () => null;
    const nuxtApp = useNuxtApp();
    nuxtApp.deferHydration();
    nuxtApp.ssrContext.url;
    const SingleRenderer = false;
    provide(PageRouteSymbol, useRoute());
    nuxtApp.hooks.callHookWith((hooks) => hooks.map((hook) => hook()), "vue:setup", []);
    const error = /* @__PURE__ */ useError();
    const abortRender = error.value && !nuxtApp.ssrContext.error;
    function invokeAppErrorHandler(err, target, info) {
      const errorHandler = nuxtApp.vueApp.config.errorHandler;
      if (errorHandler && !errorHandler.__nuxt_default) {
        try {
          errorHandler(err, target, info);
        } catch (handlerError) {
          console.error("[nuxt] Error in `app.config.errorHandler`", handlerError);
        }
      }
    }
    onErrorCaptured((err, target, info) => {
      nuxtApp.hooks.callHook("vue:error", err, target, info).catch((hookError) => console.error("[nuxt] Error in `vue:error` hook", hookError));
      {
        const p = nuxtApp.runWithContext(() => showError(err));
        onServerPrefetch(() => p);
        invokeAppErrorHandler(err, target, info);
        return false;
      }
    });
    const islandContext = nuxtApp.ssrContext.islandContext;
    return (_ctx, _push, _parent, _attrs) => {
      ssrRenderSuspense(_push, {
        default: () => {
          if (unref(abortRender)) {
            _push(`<div></div>`);
          } else if (unref(error)) {
            _push(ssrRenderComponent(unref(_sfc_main$1), { error: unref(error) }, null, _parent));
          } else if (unref(islandContext)) {
            _push(ssrRenderComponent(unref(IslandRenderer), { context: unref(islandContext) }, null, _parent));
          } else if (unref(SingleRenderer)) {
            ssrRenderVNode(_push, createVNode(resolveDynamicComponent(unref(SingleRenderer)), null, null), _parent);
          } else {
            _push(ssrRenderComponent(unref(_sfc_main$2), null, null, _parent));
          }
        },
        _: 1
      });
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("../../../node_modules/nuxt/dist/app/components/nuxt-root.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
let entry;
{
  entry = async function createNuxtAppServer(ssrContext) {
    const vueApp = createApp(_sfc_main);
    const nuxt = createNuxtApp({ vueApp, ssrContext });
    try {
      await applyPlugins(nuxt, plugins);
      await nuxt.hooks.callHook("app:created", vueApp);
    } catch (error) {
      await nuxt.hooks.callHook("app:error", error);
      nuxt.payload.error ||= createError(error);
    }
    if (ssrContext && (ssrContext["~renderResponse"] || ssrContext._renderResponse)) {
      throw new Error("skipping render");
    }
    return vueApp;
  };
}
const entry_default = ((ssrContext) => entry(ssrContext));

export { useNuxtApp as a, useRuntimeConfig as b, nuxtLinkDefaults as c, entry_default as default, encodeRoutePath as e, navigateTo as n, resolveRouteObject as r, tryUseNuxtApp as t, useRouter as u };
//# sourceMappingURL=server.mjs.map
