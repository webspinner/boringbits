"use strict";

// just so linting doesn't break
const containers = [];
const modules = {};
/**
 * This file is used to append to the generated entrypoint
 * of beforeEntry.  It's purpose is to maintain the code
 * in a JS file that can be linted,
 * as opposed to writing a string with JS.
 *
 * Since boring only babels to node, we need to write
 * our JavaScript ES5'y
 */

module.exports = function beforeEntryLoader() {
  if (!window.__boring_internals) {
    window.__boring_internals = {
      wutsthis: 'DO NOT LOOK HERE OR YOU ARE FIRED'
    };
  }

  const internals = window.__boring_internals;
  internals.containers = containers || [];
  internals.modules = modules || {};

  if (!internals.hot) {
    internals.hot = {
      subscribers: [],
      subscribe: function (fn) {
        this.subscribers.push(fn);
      },
      notify: function () {
        this.subscribers.forEach(fn => fn());
      }
    };
  } else {
    internals.hot.notify();
  }

  if (module.hot) {
    module.hot.accept(err => console.log('error reloading', err));
  }
};
//# sourceMappingURL=beforeEntryLoader.js.map