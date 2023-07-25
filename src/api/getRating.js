import { fetchWithCache } from './fetch';

import cheerio from 'cheerio';

const extractRating = (html, query) => {
  const $ = cheerio.load(html);

  let wines = [];
  $('.card').each((i, el) => {
    const name = $(el)
      .find('.wine-card__name .link-color-alt-grey')
      .text()
      .trim();
    const score = $(el)
      .find('.average__number')
      .text()
      .trim()
      .replace(',', '.');
    const numOfReviews = $(el)
      .find('.average__stars .text-micro')
      .text()
      .trim();
    const href = $(el).find('a').attr('href');
    const url = `https://www.vivino.com` + href;

    if (!numOfReviews) {
      return;
    }

    wines.push({
      name,
      score: parseFloat(score),
      numOfReviews: parseFloat(numOfReviews),
      url,
    });
  });

  return wines[0];
};

export default async function getRating(query) {
  const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
  const targetUrl = `https://www.vivino.com/search/wines?q=${encodeURIComponent(
    query
  )}`;
  const response = await fetchWithCache(proxyUrl + targetUrl, {
    method: 'GET',
  });

  const data = await response.text();

  return extractRating(data, query);
}
