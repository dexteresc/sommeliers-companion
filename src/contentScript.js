function getRating(query) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { type: 'getRating', query },
      (messageResponse) => {
        const [response, error] = messageResponse;

        console.log(`Rating response for ${query}:`, response);
        console.log(`Rating error for ${query}:`, error);

        if (!response) {
          reject(error);
        }

        resolve(response);
      }
    );
  });
}

function initializeScript() {
  appendRatings();

  // Create an observer instance linked to the callback function
  const observer = new MutationObserver(() => {
    appendRatings();
  });

  // Start observing the document with the configured mutations
  observer.observe(document, { childList: true, subtree: true });
}

function appendRatings() {
  const wineListItems = document.querySelectorAll(
    'a[id*="tile"][href*="/vin/"]:not([href="/vin/"]):not([href="/sortiment/vin/"])'
  );

  wineListItems.forEach((item, index) => {
    appendRating(item);
  });
}

// Create a Set to keep track of elements currently fetching a rating
const fetchingRating = new Set();

async function appendRating(element) {
  // If the element has the 'has-rating' class or a rating is being fetched for this element, don't append a rating
  if (element.classList.contains('has-rating') || fetchingRating.has(element)) {
    return;
  }

  // Start fetching the rating for this element
  fetchingRating.add(element);

  element.parentElement.style.position = 'relative';
  const div = element.querySelector(
    ':scope > div > div:nth-last-child(2) > div > div:nth-child(2)'
  );
  if (!div) {
    console.log(`No last div found in element with id ${element.id}`);
    return;
  }

  // Get all paragraph elements within the second div
  const nameParagraphs = Array.from(div.querySelectorAll('p'));

  if (nameParagraphs.length < 2) {
    console.log(
      `Not enough name paragraphs found in element with id ${element.id}`
    );
    return;
  }

  // Concatenate the text from the first two paragraphs to get the wine name
  const wineName = `${nameParagraphs[1].innerText} ${nameParagraphs[2].innerText}`;

  console.log(`Wine name: ${wineName}`);

  if (!wineName) {
    return;
  }

  try {
    const { score, numOfReviews, url } = await getRating(wineName);

    const priceElement = document.createElement('a');
    priceElement.href = url;
    priceElement.innerText = `${score} (${numOfReviews} reviews)`;
    priceElement.style.fontFamily = 'system-ui';
    priceElement.style.backgroundColor = '#800020';
    priceElement.style.display = 'flex';
    priceElement.style.alignSelf = 'end';
    priceElement.style.padding = '0.2em 0.5em';
    priceElement.style.borderRadius = '0.5em';
    priceElement.style.color = 'white';
    priceElement.style.marginTop = '0.2em';
    priceElement.style.marginRight = '0.2em';

    element.appendChild(priceElement);

    // Add the 'has-rating' class to the element
    element.classList.add('has-rating');
  } catch (e) {
    console.error(`${wineName} is not found on Vivino`, e);
    element.classList.add('has-rating');
    element.appendChild(document.createTextNode('Not found on Vivino'));
  } finally {
    // Done fetching the rating for this element
    fetchingRating.delete(element);
  }
}

window.addEventListener('load', initializeScript);
