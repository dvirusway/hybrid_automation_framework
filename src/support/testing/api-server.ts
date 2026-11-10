import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';

export interface LocalApiServer {
  baseUrl: string;
  close(): Promise<void>;
}

interface DemoPost {
  id: number;
  title: string;
  body: string;
  userId: number;
}

const POSTS: DemoPost[] = [
  { id: 1, title: 'First post', body: 'Hello from the local API.', userId: 7 },
  { id: 2, title: 'Second post', body: 'A second record for list tests.', userId: 7 },
];

function sendJson(
  response: ServerResponse,
  status: number,
  body: unknown,
): void {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(body));
}

async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const text = Buffer.concat(chunks).toString('utf8');
  return text === '' ? undefined : JSON.parse(text);
}

function isPost(value: unknown): value is Omit<DemoPost, 'id'> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const post = value as Record<string, unknown>;
  return (
    typeof post.title === 'string' &&
    typeof post.body === 'string' &&
    typeof post.userId === 'number'
  );
}

async function handleRequest(
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  const url = new URL(request.url ?? '/', 'http://127.0.0.1');

  if (request.method === 'GET' && url.pathname === '/health') {
    sendJson(response, 200, { status: 'ok' });
    return;
  }

  if (request.method === 'GET' && url.pathname === '/posts') {
    const userId = url.searchParams.get('userId');
    const posts = userId
      ? POSTS.filter((post) => String(post.userId) === userId)
      : POSTS;
    sendJson(response, 200, posts);
    return;
  }

  const postMatch = /^\/posts\/(\d+)$/.exec(url.pathname);
  if (request.method === 'GET' && postMatch) {
    const post = POSTS.find((item) => item.id === Number(postMatch[1]));
    if (!post) {
      sendJson(response, 404, { message: 'Post not found.' });
      return;
    }
    sendJson(response, 200, post);
    return;
  }

  if (request.method === 'POST' && url.pathname === '/posts') {
    const body = await readJsonBody(request);
    if (!isPost(body)) {
      sendJson(response, 400, { message: 'A title, body, and numeric userId are required.' });
      return;
    }

    const created = { id: POSTS.length + 1, ...body };
    sendJson(response, 201, created);
    return;
  }

  sendJson(response, 404, { message: `No route for ${request.method} ${url.pathname}.` });
}

export async function startLocalApiServer(): Promise<LocalApiServer> {
  const server: Server = createServer((request, response) => {
    void handleRequest(request, response).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unexpected server error.';
      if (!response.headersSent) {
        sendJson(response, 500, { message });
      } else {
        response.destroy(error instanceof Error ? error : undefined);
      }
    });
  });

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      server.removeListener('error', reject);
      resolve();
    });
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    throw new Error('Local API server did not receive a TCP address.');
  }
  const { port } = address;

  return {
    baseUrl: `http://127.0.0.1:${port}/`,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  };
}
