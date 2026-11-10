import { expect, test } from '../fixture';

const data = require('../../config/google-search.js');

test('Google returns results for a search term', async ({ page, googleSearchAction }) => {
  await page.goto(data.baseUrl);
  await googleSearchAction.searchFor(data.searchTerm);

  await expect(page).toHaveURL(
    (url) => url.searchParams.get('q') === data.searchTerm,
  );
  await expect(page.locator('#search')).toBeVisible();
});
