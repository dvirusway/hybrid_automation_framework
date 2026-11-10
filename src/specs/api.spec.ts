import { expect, test as base } from '../fixture';
import { ApiClient } from '../api/api-client';
import { expectStatus, readJson } from '../api/api-assertions';
import { startLocalApiServer, type LocalApiServer } from '../support/testing/api-server';

interface Post {
  id: number;
  title: string;
  body: string;
  userId: number;
}

type ApiFixtures = {
  localApiServer: LocalApiServer;
};

const test = base.extend<ApiFixtures>({
  localApiServer: async ({}, use) => {
    const server = await startLocalApiServer();
    try {
      await use(server);
    } finally {
      await server.close();
    }
  },
  apiClient: async ({ request, localApiServer }, use) => {
    await use(new ApiClient(request, localApiServer.baseUrl));
  },
});

test('GET requests apply query parameters and decode typed JSON', async ({ apiClient }) => {
  const response = await apiClient.get<Post[]>('/posts', {
    params: { userId: 7 },
  });
  await expectStatus(response, 200);

  const posts = await readJson<Post[]>(response);
  expect(posts).toHaveLength(2);
  expect(posts.every((post) => post.userId === 7)).toBe(true);
});

test('POST requests send JSON and return the created resource', async ({ apiClient }) => {
  const response = await apiClient.post<Post>('/posts', {
    title: 'API test',
    body: 'Created from a Playwright API test.',
    userId: 9,
  });
  await expectStatus(response, 201);

  const post = await readJson<Post>(response);
  expect(post).toMatchObject({
    id: 3,
    title: 'API test',
    body: 'Created from a Playwright API test.',
    userId: 9,
  });
});

test('unexpected response statuses include the response details', async ({ apiClient }) => {
  const response = await apiClient.get('/posts/999');

  await expect(
    expectStatus(response, 200),
  ).rejects.toMatchObject({
    name: 'ApiResponseError',
    status: 404,
    responseBody: '{"message":"Post not found."}',
  });
});
