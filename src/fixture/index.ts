import { test as base } from '@playwright/test';
import { GoogleSearchAction } from '../action/google-search.action';
import { GoogleSearchPage } from '../page/google-search.page';

type Fixtures = { googleSearchAction: GoogleSearchAction };

export const test = base.extend<Fixtures>({
  googleSearchAction: async ({ page }, use) => {
    await use(new GoogleSearchAction(new GoogleSearchPage(page)));
  },
});

export { expect } from '@playwright/test';
