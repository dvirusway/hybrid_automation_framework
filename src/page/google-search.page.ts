import { Locator, Page } from '@playwright/test';

export class GoogleSearchPage {
  readonly searchBox: Locator;

  constructor(private readonly page: Page) {
    this.searchBox = page.getByRole('combobox', { name: 'Search' });
  }

  async searchFor(searchTerm: string) {
    await this.searchBox.fill(searchTerm);
    await this.searchBox.press('Enter');
  }
}
