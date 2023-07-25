import { configureFetchCache } from "./api/fetch";
import getRating from "./api/getRating";

const setup = async () => {
  await configureFetchCache();

  chrome.runtime.onMessage.addListener(function (
    request,
    sender,
    sendResponse
  ) {
    if (request.type === "getRating") {
      console.log(`Getting rating for: ${request.query}`);
      getRating(request.query)
        .then((response) => sendResponse([response, null]))
        .catch((error) => {
          console.log(error)
          sendResponse([null, error]);
        });

      // Important: return true from the event listener to indicate you wish to send a response asynchronously
      return true;
    }
  });
};

setup();
