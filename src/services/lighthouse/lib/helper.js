const fs = require('fs');

/**
 * Wraps an async function in a retry loop that retries it until it succeeds or the maximum number of retries is reached.
 *
 * @param fn - The async function to wrap.
 * @param retries - The maximum number of retries. Defaults to 3.
 * @param retryDelay - The delay (in milliseconds) between retries. Defaults to 1000.
 * @returns The result of the function if it succeeds.
 * @throws An error if the function fails after the maximum number of retries is reached.
 */
async function retryAsync (fn, retries = 3, retryDelay = 1000) {
  let retryCount = 0;
  let success = false;

  while (!success && retryCount <= retries) {
    try {
      const result = await fn();
      success = true;
      return result;
    } catch (error) {
      retryCount++;
      console.error(`Error (retry ${retryCount} of ${retries}): ${error}`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }

  throw new Error(`Failed after ${retries} retries`);
}

function writeResultsToFile (results, fileName) {
  const fs = require('fs');
  const data = JSON.stringify(results, null, 2);
  fs.writeFileSync(fileName, data);
  console.log(`Results written to file: ${fileName}`);
}

async function sendResultsToUrl (url, results) {
  const axios = require('axios');
  try {
    const response = await axios.post(url, results);
    console.log(`Results sent successfully: ${response.data}`);
  } catch (error) {
    console.error(`Error sending results: ${error}`);
  }
}

module.exports = { retryAsync, writeResultsToFile, sendResultsToUrl };
