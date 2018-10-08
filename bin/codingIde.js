#!/usr/bin/env node

const exec = require('child_process').exec;
const path = require('path');
const stepFactory = require('../lib/step');
const parse = require('../lib/parse');
const log4js = require('log4js');
// const generateI18n = require('../.script/generateI18n')

const logger = log4js.getLogger('webide-sdk');
logger.level = 'debug';

function execPromise(command, options = {}, callback) {
  return new Promise((resolve, reject) => {
    return exec(command, options, function (err, stdout, stderr) {
      if (err) { return reject(err,stdout, stderr); }
      if (callback) {
        callback(stdout);
      }
      return resolve(stdout);
    }
    );
  });
}

// async function i18n() {
//   process.env.NODE_ENV = 'development';
//   const PACKAGE_DIR = process.env.PACKAGE_DIR || path.resolve(__dirname, '../../../');
//   process.env.I18nTargetRoot = process.env.I18nTargetRoot || path.resolve(__dirname, '../../../', 'i18n');
//   console.log('PACKAGE_DIR', PACKAGE_DIR)
//   generateI18n(`${PACKAGE_DIR}/src`)
// }

async function serve() {
  const step = stepFactory();
  let stepNum = 1;
  
  await step(`[${stepNum++}] get current version`, () => {
    return execPromise('git describe --always --tags')
    .then((stdout) => {
      logger.info(`Current Git version is ${stdout}`);
      process.env.VERSION = stdout.replace(/\s+/, '');
      process.env.PACKAGE_DIR = process.env.PACKAGE_DIR || path.resolve(__dirname, '../../../');    
      return true;
    });
  });
   await step(`[${stepNum++}] start serve from gist`, () => {
    require('../server.prod.js')
  });
}


async function start(packageDir) {
  process.env.NODE_ENV = 'development';
  process.env.PACKAGE_DIR = packageDir || process.env.PACKAGE_DIR || path.resolve(__dirname, '../../../');
  require('../server.js')
}
async function build(packageDir) {
  console.log(`
     /$$      /$$           /$$     /$$$$$$ /$$$$$$$  /$$$$$$$$
  | $$  /$ | $$          | $$    |_  $$_/| $$__  $$| $$_____/
  | $$ /$$$| $$  /$$$$$$ | $$$$$$$ | $$  | $$  \ $$| $$      
  | $$/$$ $$ $$ /$$__  $$| $$__  $$| $$  | $$  | $$| $$$$$   
  | $$$$_  $$$$| $$$$$$$$| $$  \ $$| $$  | $$  | $$| $$__/   
  | $$$/ \  $$$| $$_____/| $$  | $$| $$  | $$  | $$| $$      
  | $$/   \  $$|  $$$$$$$| $$$$$$$/$$$$$$| $$$$$$$/| $$$$$$$$
  |__/     \__/ \_______/|_______/______/|_______/ |________/`);
  const step = stepFactory();
  let stepNum = 1;
  await step(`[${stepNum++}] get Project current version`, () => {
    return execPromise('git describe --always --tags')
    .then((stdout) => {
      logger.info(`current Project version is ${stdout}`);
      process.env.VERSION = stdout.replace(/\s+/, '');
      return true;
    });
  });
  await step(`[${stepNum++}] clean up dist folder`, () => {
    return execPromise('node_modules/.bin/rimraf dist/**').then(() => {
      logger.info('cleared');
      return true;
    });
  });
  await step(`[${stepNum++}] build source`, () => {
    process.env.PACKAGE_DIR = packageDir || process.env.PACKAGE_DIR || path.resolve(__dirname, '../../../');
    logger.info('current source dir', process.env.PACKAGE_DIR, process.env.VERSION);
    return execPromise(`webpack --config ${path.resolve(__dirname, '../', 'webpack.production.config.js')} --progress --profile --colors`)
    .then((out) => {
      logger.info(out);
      return true;
    })
    .catch((err, stdout, stderr) => {
      logger.error(err);
      return false;
    });
  });
  await step(`[${stepNum++}] generate manifest`, () => {
    try {
      require('../.script/buildManifest');
      return true;
    } catch (err) {
      throw err;
    }
  });
}

const cli = parse(process.argv);


if (cli.args[0] === 'build') {
  if (!!cli.args[1] && cli.args[1] !== '') {
    build(cli.args[1]);
  }
}

if (cli.args[0] === 'start') {
  if (!!cli.args[1] && cli.args[1] !== '') {
    start(cli.args[1]);
  }
}

if (cli.args[0] === 'i18n') {
  i18n();
}

if (cli.args[0] === 'serve') {
  serve();
}