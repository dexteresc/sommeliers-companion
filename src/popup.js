'use strict';

import './popup.css';

(async function () {
  const [{ successfulRequests }, { failedRequests }] = await Promise.all([
    new Promise((resolve) =>
      chrome.storage.local.get(['successfulRequests'], resolve)
    ),
    new Promise((resolve) =>
      chrome.storage.local.get(['failedRequests'], resolve)
    ),
  ]);

  document.getElementById('successfulRequests').innerText =
    successfulRequests || 0;
  document.getElementById('failedRequests').innerText = failedRequests || 0;

  function clearCache() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.clear(() => {
        const error = chrome.runtime.lastError;
        if (error) {
          console.error(error);
          reject(error);
        } else {
          console.log('Cache cleared!');
          resolve();
        }
      });
    });
  }

  document.getElementById('clearCache').addEventListener('click', () => {
    clearCache().catch((error) => {
      console.error(`Failed to clear cache: ${error}`);
    });
  });
})();
