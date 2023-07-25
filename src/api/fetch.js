export let fetchWithCache;

export async function configureFetchCache() {
  if (fetchWithCache) {
    console.log('Fetch cache already configured.');
    return;
  }
  console.log('Configuring fetch cache...');

  const cache = {
    async getItem(key) {
      return new Promise((resolve) => {
        chrome.storage.local.get([key], function (result) {
          if (
            result[key] &&
            Date.now() - result[key].timestamp < 24 * 60 * 60 * 1000
          ) {
            resolve(result[key].data);
          } else {
            resolve(null);
          }
        });
      });
    },
    async setItem(key, value) {
      return new Promise((resolve) => {
        chrome.storage.local.set(
          { [key]: { data: value, timestamp: Date.now() } },
          function () {
            resolve(value);
          }
        );
      });
    },
  };

  const maxRPS = 2; // Max requests per second
  let queue = [];

  setInterval(() => {
    if (queue.length) {
      const { url, options, resolve, reject } = queue.shift();
      const request = new Request(url, options);
      request.headers.delete('Origin');
      fetch(request).then(resolve).catch(reject);
    }
  }, 1000 / maxRPS);

  fetchWithCache = async (url, options) => {
    const key = url;
    const cachedData = await cache.getItem(key);

    if (cachedData) {
      console.log(`Cache hit for ${key}`);
      return new Response(new Blob([cachedData]));
    }

    return new Promise((resolve, reject) => {
      queue.push({ url, options, resolve, reject });
      console.log(`Queue after push: ${JSON.stringify(queue)}`);
    }).then(async (response) => {
      if (response.ok) {
        const data = await response.text();
        await cache.setItem(key, data);
        return new Response(new Blob([data]));
      }

      throw new Error(`Request failed: ${response.status}`);
    });
  };
}
