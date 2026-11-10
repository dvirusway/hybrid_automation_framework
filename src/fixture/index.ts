import { test as base } from '@playwright/test';
import { ApiClient } from '../api/api-client';
import { GoogleSearchAction } from '../action/google-search.action';
import { GoogleSearchPage } from '../page/google-search.page';
import { getEnvironmentConfig } from '../config/environment';

type Fixtures = {
  googleSearchAction: GoogleSearchAction;
  apiClient: ApiClient;
};

export const test = base.extend<Fixtures>({
  googleSearchAction: async ({ page }, use) => {
    await use(new GoogleSearchAction(new GoogleSearchPage(page)));
  },
  apiClient: async ({ request }, use) => {
    const config = getEnvironmentConfig();
    await use(new ApiClient(request, config.apiBaseUrl, {
      timeout: config.requestTimeoutMs,
    }));
  },
});

export { expect } from '@playwright/test';
