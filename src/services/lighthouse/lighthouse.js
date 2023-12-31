const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const { retryAsync, writeResultsToFile } = require('./lib/helper');

/**
 * Returns an async generator that yields Lighthouse scores for a list of URLs.
 *
 * @param {string[]} urls - An array of URLs to test.
 * @param {number} retries - The number of times to retry a failed test.
 * @param {number} retryDelay - The delay (in milliseconds) between retries.
 * @yields {{score: {performance: number, accessibility: number, 'best-practices': number, pwa: number, seo: number}, time: number, url}} - An object containing the scores, time, and URL for each test.
 * @throws If the test fails more than `retries` times.
 */
async function* checkUrl(urls, retries = 3, retryDelay = 1000) {
  for (const url of urls) {
    try {
      console.log(`Testing URL '${url}'...`);
      const result = await retryAsync(async () => {
        const nStartTime = Date.now();
        const chrome = await chromeLauncher.launch(
          { chromeFlags: ['--headless'] });
        const options = { output: 'json', port: chrome.port };
        const runnerResult = await lighthouse(url, options);
        const nEndTime = Date.now();

        await chrome.kill();

        const {
          accessibility: { score: accessibilityScore },
          'best-practices': { score: bestPracticesScore },
          performance: { score: performanceScore },
          pwa: { score: pwaScore },
          seo: { score: seoScore },
        } = runnerResult.lhr.categories;

        return {
          url: runnerResult.lhr.finalUrl,
          time: (nEndTime - nStartTime) / 1000,
          score: {
            accessibility: accessibilityScore * 100,
            'best-practices': bestPracticesScore * 100,
            performance: performanceScore * 100,
            pwa: pwaScore * 100,
            seo: seoScore * 100,
          },
        };
      }, retries, retryDelay);

      yield result;
    } catch (error) {
      console.error(`Error testing URL '${url}': ${error.message}`);
    }
  }
}

/**
 * Checks Lighthouse scores for a list of URLs.
 *
 * @param {string[]} urls - An array of URLs to test.
 * @param {Object} options - Options for the Lighthouse tests.
 * @param {number} options.retries - The number of times to retry a failed test.
 * @param {number} options.retryDelay - The delay (in milliseconds) between retries.
 * @param {string} options.outputFileName - The name of the file to write the results to.
 * @returns {Promise<{score: {performance: number, accessibility: number, 'best-practices': number, pwa: number, seo: number}, time: number, url}[]>} - A Promise that resolves to an array of objects containing the scores, time, and URL for each test.
 */
async function checkLighthouse (urls, options = {}) {
  const {
    retries = 3,
    retryDelay = 1000,
    outputFileName = options.outputFileName || './output/results.json',
  } = options;
  const results = [];
  const nStartTime = Date.now();

  try {
    for await (const item of checkUrl(urls, retries, retryDelay)) {
      results.push(item);
    }
  } catch (error) {
    console.error(`Error running Lighthouse tests: ${error.message}`);
  }

  const nEndTime = Date.now();

  console.log('Results:');
  console.table(results);
  console.log(`Total Time: ${((nEndTime - nStartTime) / 1000).toFixed(2)} sec`);

  // Write the results to a file
  try {
    await writeResultsToFile(results, outputFileName);
    console.log(`Results written to file '${outputFileName}'`);
  } catch (error) {
    console.error(
      `Error writing results to file '${outputFileName}': ${error.message}`);
  }

  return results;
}

module.exports = checkLighthouse;
