#!/usr/bin/env node

const program = require('commander');
const checkLighthouse = require('./src/services/lighthouse');

program
.version('1.0.0')
.description('Run Lighthouse on an array of URLs. For example: "npm run start https://www.example.com". Optionally write the results to a file or send them to a URL.')
.option('-e, --example', 'run an example Lighthouse test of "https://google.com"')
.option('-o, --output <file>', 'write results to a file')
.helpOption('-h, --help', 'output usage information')
.arguments('<urls...>')
.action((urls = [], options) => {
  if (!urls || !urls.length) {
    console.error('error: missing required argument \'urls\'');
    program.help();
    return;
  }
  console.log('Lighthouse urls:', urls.join(', '));
  console.log('Please wait...');

  checkLighthouse(urls, { outputFileName: options.output })
  .then((results) => {
    console.log('Lighthouse tests complete.');
    console.log(results);
  })
  .catch((err) => {
    console.error('Lighthouse tests failed.', err);
  });
});

// Helper options.
program.on('--help', () => {
  console.log('');
  console.log('Example call: node index.js https://www.google.com');
  console.log('  $ custom-help --help');
});

program
.command('example')
.description('Run an example Lighthouse test with test of "google.com"')
.action(() => {
  const urls = ['https://www.google.com'];
  checkLighthouse(urls)
  .then((results) => {
    console.log(results);
  })
  .catch((err) => {
    console.error(err);
  });
});

// Print help message if no arguments are passed.
if (process.argv.length < 3) {
  console.error('error: missing required argument \'urls\'');
  program.help();
}

program.parse(process.argv);
