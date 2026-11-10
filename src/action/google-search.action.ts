import { GoogleSearchPage } from '../page/google-search.page';

export class GoogleSearchAction {
  constructor(private readonly googleSearchPage: GoogleSearchPage) {}

  async searchFor(searchTerm: string) {
    await this.googleSearchPage.searchFor(searchTerm);
  }
}
