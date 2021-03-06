process.env.SUPPRESS_NO_CONFIG_WARNING = 'y';

const config = require('config');
require('./env');

const path = require('path');

const ourConfigDir = path.join(__dirname, '/../../config')
const baseConfig = config.util.loadFileConfigs(ourConfigDir)

config.util.setModuleDefaults('boring', baseConfig)

const get = config.get;
const has = config.has;

config.get = function config_get_shadowed(key, defaultVal) {
  if (key in process.env) return process.env[key];
  const flattendKey = key.split('.').join('_')
  if (flattendKey in process.env) return process.env[flattendKey];

  if (!config.has(key)) return defaultVal; // this will simply be undefined if no param is passed
  return get.call(config, key)
}

config.has = function config_has_shadowed(key) {
  if (key in process.env) return true;
  const flattendKey = key.split('.').join('_')
  if (flattendKey in process.env) return true;

  if (has.call(config, key)) return true;
  else return false;
}

module.exports = config;
