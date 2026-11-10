# Hybrid Automation Framework

A scalable, hybrid test automation framework built on **Playwright**, written in **TypeScript** and **JavaScript**. It combines the Page Object Model with an Action (step) layer, custom fixtures and reusable utilities, so tests stay short, readable and easy to maintain.

## Features

- Playwright-based UI and API test automation
- Page Object Model (`*.page.ts`) for locators and page-level methods
- Action layer (`*.action.ts`) for business steps and reusable flows
- Custom Playwright fixtures for clean dependency injection
- Centralized test data and environment config
- Reusable authentication support (login once, reuse session state)
- Shared utilities (logging, waits, data helpers, etc.)
- Parallel execution, retries, tracing, screenshots and video
- HTML report out of the box

## Tech Stack

| Area | Tool |
|------|------|
| Test runner / automation | Playwright Test |
| Languages | TypeScript, JavaScript |
| Runtime | Node.js (v18+) |
| Reporting | Playwright HTML Report |

## Project Structure

```
.
├── config/
│   └── <testdata>.js              # Test data and environment config
├── src/
│   ├── specs/
│   │   └── <testfile>.spec.ts     # Test specifications
│   ├── page/
│   │   └── <pageclass>.page.ts    # Page objects (locators + page methods)
│   ├── action/
│   │   └── <stepclass>.action.ts  # Step classes (business flows)
│   ├── fixture/                   # Custom Playwright fixtures
│   ├── utils/                     # Helper and common utilities
│   └── support/
│       └── auth/                  # Authentication and session setup
├── playwright.config.ts           # Playwright configuration
├── package.json
└── README.md
```

### Layer Responsibilities

| Layer | Path | Purpose |
|-------|------|---------|
| Config | `config/<testdata>.js` | Test data, URLs, credentials per environment |
| Specs | `src/specs/<testfile>.spec.ts` | Test cases. Call actions only, no raw locators |
| Page | `src/page/<pageclass>.page.ts` | Locators and low-level page interactions |
| Action | `src/action/<stepclass>.action.ts` | Business steps built from page methods |
| Fixture | `src/fixture/` | Create and inject pages, actions and test data into tests |
| Utils | `src/utils/` | Generic helpers (random data, date, file, API, logger) |
| Support | `src/support/auth/` | Login, storage state and other setup helpers |

### How the layers connect

```
Spec  →  Action  →  Page  →  Playwright
  ↑         ↑
  └─ Fixture injects actions/pages
```

## Getting Started

### Prerequisites

- Node.js 20 or higher
- npm (or yarn / pnpm)

### Installation

```bash
git clone <repository-url>
cd <project-folder>
npm install
npx playwright install
```

## Running Tests

```bash
# Run all tests
npm test

# Run a single spec
npm run test:google-search

# Run in headed mode
npm run test:headed

# Run on a specific browser
npm test -- --project=chromium

# Run by tag or title
npx playwright test -g "@smoke"

# Debug mode
npx playwright test --debug
```

Install the project's dependencies and Chromium browser before running tests:

```bash
npm install
npx playwright install chromium
```

Run the TypeScript check with `npm run typecheck`. Playwright writes the HTML
report to `playwright-report/`; open it with `npm run report`.

## Reports

```bash
npx playwright show-report
```

Traces, screenshots and videos are captured on failure (configurable in `playwright.config.ts`).

## Examples

### Page class: `src/page/login.page.ts`

```ts
import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly username: Locator;
  readonly password: Locator;
  readonly submit: Locator;

  constructor(page: Page) {
    this.page = page;
    this.username = page.locator('#username');
    this.password = page.locator('#password');
    this.submit = page.locator('button[type="submit"]');
  }

  async login(user: string, pass: string) {
    await this.username.fill(user);
    await this.password.fill(pass);
    await this.submit.click();
  }
}
```

### Action class: `src/action/login.action.ts`

```ts
import { LoginPage } from '../page/login.page';

export class LoginAction {
  constructor(private loginPage: LoginPage) {}

  async loginAs(user: string, pass: string) {
    await this.loginPage.login(user, pass);
  }
}
```

### Fixture: `src/fixture/index.ts`

```ts
import { test as base } from '@playwright/test';
import { LoginPage } from '../page/login.page';
import { LoginAction } from '../action/login.action';

type Fixtures = { loginAction: LoginAction };

export const test = base.extend<Fixtures>({
  loginAction: async ({ page }, use) => {
    await use(new LoginAction(new LoginPage(page)));
  },
});

export { expect } from '@playwright/test';
```

### Spec: `src/specs/login.spec.ts`

```ts
import { test, expect } from '../fixture';
const data = require('../../config/testdata.js');

test('user can log in with valid credentials', async ({ page, loginAction }) => {
  await page.goto(data.baseUrl);
  await loginAction.loginAs(data.user.name, data.user.password);
  await expect(page).toHaveURL(/dashboard/);
});
```

## Conventions

- File names: `<name>.page.ts`, `<name>.action.ts`, `<name>.spec.ts`
- Keep locators only in page classes
- Keep assertions in specs (or clearly named verify methods in actions)
- Keep test data in `config/`, never hardcode in specs
- One responsibility per class; reuse through actions and fixtures

## Authentication

Authentication helpers live in `src/support/auth/`. Log in once, save the session (storage state) and reuse it across tests to cut execution time.

## Contributing

1. Create a feature branch
2. Follow the folder structure and naming conventions above
3. Run the tests locally before pushing
4. Open a pull request

## License
