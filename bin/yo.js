#!/usr/bin/env node
const childProcess = require('child_process');
const fs = require('fs-extra');

module.exports = function(args={argv: {}}) {
  try {

    const yoPath = __dirname + '/../yo/node_modules/.bin/yo';
    if (!fs.existsSync(yoPath)) {
      console.log('yo is not found in project, \n'+
        'performing a one time npm install into node_modules/boringbits/yo/node_modules.....');

      childProcess.spawnSync('npm', ['install', '--silent'], {
        stdio: [process.stdin, process.stdout, process.stderr],
        cwd: __dirname + '/../yo/',
      });
      console.log(' 🦕  npm install of yo complete 🦕\n\n');
    }

    return new Promise((resolve, reject) => {

      childProcess.spawnSync(yoPath, [__dirname + '/../yo/generator/app', '--args=' + JSON.stringify(args.argv)], {
        stdio: [process.stdin, process.stdout, process.stderr],
        cwd: process.cwd(),
      });

      resolve();

    });
  } catch (e) {
    console.error('There was a problem the boring command', e);
    return Promise.reject({status: 1});
  }
};
