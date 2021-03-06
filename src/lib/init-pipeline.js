import {getNamespace, createNamespace} from 'boring-cls';

const nodenopack = require('nodenopack');

const config = require('boring-config');
const express = require('express');
const initRouters = require('./init-routers');
const logger = require('boring-logger');
const initMiddleware = require('./init-middleware');
const initHooks = require('./init-hooks');
const initModules = require('./init-modules');
const EventEmitter = require('eventemitter2');
const paths = require('paths');
const Understudy = require('boring-understudy');
const decorators = require('./decorators');
const appUseOverride = require('./server/appUseOverride');
const injecture = require('injecture');
const uuid = require('node-uuid');

class InitPipeline extends EventEmitter {

  constructor(args = {}) {
    super({wildcard: true});
    Understudy.call(this);

    const options = {
      initNS: createNamespace('boring-init'),
      requestNS: createNamespace('http-request'),
      middleware: {},
      app: express(),
      ...args,
    };

    this.initNS = options.initNS;
    this.requestNS = options.requestNS;

    // these are exposed purely for convenience to callers
    this.createNamespace = createNamespace;
    this.getNamespace = getNamespace;
    this.config = config;
    this.logger = logger;
    this.paths = paths;

    this.middleware = options.middleware;
    this.hooks = {};
    this.app = options.app;
    this.decorators = decorators;

    this.app.oldUse = this.app.use;
    const perform = this.perform.bind(this);

    this.app.use = appUseOverride(this.app, perform);
  }

  // eslint-disable-next-line camelcase
  add_middleware(name, middleware) {
    if (this.middleware[name]) throw new Error('Cannot add middleware with the same key as '+ name);
    this.middleware[name] = middleware;
    this.emit('added.middleware', name, middleware);
  }

  // eslint-disable-next-line camelcase
  add_hook(name, hook) {
    if (this.hooks[name]) throw new Error('Cannot add hook with the same key as '+ name);
    this.hooks[name] = hook;
    this.emit('added.hook', name, hook);
  }

  // eslint-disable-next-line camelcase
  add_router(router) {

    const routePath = router.path || '';
    const app = this.app;

    router.endpoints.forEach((endpoint = {path: '', methods: {}}) => {

      // don't blow up if there are no methods
      const methods = endpoint.methods || {};
      Object.keys(methods).forEach(method => {
        const methodsObj = endpoint.methods[method];
        let path = methodsObj.path;
        if (!path) return;
        else path = routePath + path;

        app[method](path, methodsObj.handler);
        logger.info(`Installed {${method.toUpperCase()}} for path ${path}`);
      });

      this.emit('added.endpoint', endpoint);
    });

  }

  async build(options) {
    const injections = {
      boring: this,
      logger,
      config,
      injecture,
      getNamespace,
      createNamespace,
      ...options,
    };

    await this.initNS.runPromise(async () => {
      this.initNS.set('corrId', uuid.v4());

      const modules = await this.perform('init-modules', injections, async () => {
        return await initModules(injections);
      });

      injections.modules = modules;

      const hooks = await this.perform('init-hooks', injections, async () => {
        return await initHooks(injections);
      });

      injections.hooks = hooks;

      await this.perform('add-hooks', injections, async () => {
        Object.keys(injections.hooks).forEach(name => this.add_hook(name, injections.hooks[name]));
        return injections;
      });

      const middleware = await this.perform('init-middleware', injections, async () => {
        return await initMiddleware(injections);
      });

      injections.middleware = middleware;

      await this.perform('add-middleware', injections, async () => {
        Object.keys(injections.middleware).forEach(name => this.add_middleware(name, injections.middleware[name]));
        return injections;
      });

      const routers = await this.perform('init-routers', injections, async () => {
        return await initRouters(injections);
      });

      injections.routers = routers;

      await this.perform('add-routers', injections, async () => {
        injections.routers.forEach(route => this.add_router(route));
        return injections;
      });

    });

    return injections;
  }
}

module.exports = InitPipeline;
