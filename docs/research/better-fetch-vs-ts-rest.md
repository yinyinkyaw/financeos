# Better Fetch, `createAuthClient`, and ts-rest in FinanceOS

Research date: 2026-08-24

## Short answer

- `betterFetch` does **not** require `createAuthClient`. `betterFetch` is a standalone function from `@better-fetch/fetch`; `createFetch` creates a configured standalone instance. [Better Fetch documents both APIs directly.](https://better-fetch.vercel.app/docs/getting-started)
- FinanceOS should still keep `createAuthClient`. Better Auth's client provides typed auth actions, React's reactive `useSession`, auth plugins, and auth-specific client behavior. Internally, the client uses Better Fetch and exposes its configured instance as `authClient.$fetch`; this means Better Fetch is an implementation layer of the auth client, not a substitute for the auth client. [Better Auth client documentation](https://better-auth.com/docs/concepts/client)
- Do **not** replace ts-rest + TanStack React Query with Better Fetch in the current architecture. They overlap only at the HTTP transport boundary. Better Fetch does not replace the shared client/server contract, Express adapter, typed status-code responses, or React Query cache integration that FinanceOS gets from ts-rest.

## What each tool owns

| Tool | Appropriate responsibility | What it does not replace |
| --- | --- | --- |
| Better Auth `createAuthClient` | Sign-in/out, sign-up, session state (`useSession`), auth plugins, and auth-specific request behavior | The application API contract and server route validation |
| Better Fetch `betterFetch` / `createFetch` | General HTTP calls with parsing, optional runtime schemas, hooks, plugins, timeout, and retry | React Query's cache/server-state lifecycle or a server adapter that enforces the same contract |
| ts-rest | A shared HTTP contract used by both client and server, including methods, paths, request schemas, response schemas by status, server adapters, and typed clients | Authentication/session management |
| TanStack React Query | Client-side server-state caching, invalidation, mutations, optimistic updates, retries, and hydration | The API's client/server contract |

Better Auth explicitly says its framework clients are built on a framework-agnostic client and provide methods and reactive hooks. It also says the client uses Better Fetch and accepts Better Fetch options through `fetchOptions`. [Better Auth client concepts](https://better-auth.com/docs/concepts/client)

Better Fetch describes itself as a fetch wrapper with Standard Schema validation, error-as-value handling, predefined routes, hooks, plugins, and retry. Its one-shot `betterFetch` call and configured `createFetch` instance can be used without Better Auth. [Better Fetch introduction](https://better-fetch.vercel.app/docs) and [getting started](https://better-fetch.vercel.app/docs/getting-started)

ts-rest describes its contract as the specification that both server and client follow, preserving type safety while retaining HTTP/REST semantics. The contract can define request body, query, path parameters, headers, and status-specific responses with Standard Schema-compatible validators. [ts-rest contract overview](https://ts-rest.com/contract/overview)

## Does using Better Fetch mean `createAuthClient` is unnecessary?

No, not when the application uses Better Auth from React.

FinanceOS currently uses `authClient.signIn.social`, `authClient.signOut`, and `authClient.useSession`. Those are Better Auth client capabilities, not Better Fetch capabilities. Replacing `createAuthClient` with raw `betterFetch` would mean manually calling auth endpoints and recreating reactive session behavior, plugin actions, and auth-client lifecycle behavior.

The relationship is:

```text
FinanceOS auth UI
  -> createAuthClient (typed auth methods, useSession, plugins)
       -> configured Better Fetch instance
            -> Better Auth HTTP endpoints
```

Better Auth's documented configuration passes Better Fetch options into `createAuthClient({ fetchOptions: ... })`; its client plugin API also receives the client's `$fetch` instance. [Better Auth client concepts](https://better-auth.com/docs/concepts/client) and [Better Auth plugin concepts](https://better-auth.com/docs/concepts/plugins)

Practical rule:

- Keep `createAuthClient` for `/api/auth/*` and auth state.
- If a standalone Better Fetch client is ever useful for unrelated APIs, create a separate `createFetch` instance with the application API base URL. Do not treat `authClient.$fetch` as the general FinanceOS API abstraction merely because it is available; it is configured around the auth client's base URL and lifecycle.

## How ts-rest should authenticate with Better Auth session cookies

For FinanceOS's browser client, the ts-rest request normally needs **no authorization header**. Better Auth stores the session identifier in an HTTP-only cookie, so browser JavaScript should not read it and turn it into a bearer token. The browser should attach the cookie, and the server should continue resolving the session from the incoming request headers with `auth.api.getSession`. [Better Auth cookie concepts](https://better-auth.com/docs/concepts/cookies)

The existing client configuration is the appropriate shape:

```ts
initTsrReactQuery(apiContract, {
  baseUrl: `${backendUrl}/api`,
  baseHeaders: {},
  credentials: 'include',
});
```

ts-rest documents `credentials: 'include'` specifically for sending cookies. The React Query v5 adapter accepts the same client options as the core fetch client, so this setting applies to its hooks and direct calls. [ts-rest credentials and cookies](https://ts-rest.com/client/fetch#credentials-and-cookies) and [React Query v5 initialization](https://ts-rest.com/client/react-query-v5#3-initialize-ts-rest-react-query)

If the web app and API are different origins, the browser and server configuration must agree:

- the client request uses `credentials: 'include'`;
- the API's CORS response allows the specific frontend origin and credentials (a wildcard origin cannot be used for a credentialed request);
- the cookie's domain, `SameSite`, and `Secure` attributes permit that deployment topology.

FinanceOS's Express app currently sets the frontend origin plus `credentials: true`, matching the client. Better Auth warns that a truly cross-site frontend/API setup can still lose cookies under Safari ITP and recommends a same-origin reverse proxy or shared parent domain. [MDN credentialed CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS#credentialed_requests_and_wildcards) and [Better Auth cross-domain cookie guidance](https://better-auth.com/docs/concepts/cookies#safari-itp-and-cross-domain-setups)

### Global and per-request headers in ts-rest 3.53 RC

The installed v3.53.0-rc.1 API supports both:

- `baseHeaders` at `initTsrReactQuery` initialization for headers sent on every request. Values may be strings or functions evaluated for each request.
- contract-declared `headers`, or arbitrary `extraHeaders`, on an individual request. With React Query v5, query headers go inside `queryData`; mutation headers go in the object passed to `mutate`/`mutateAsync`, because the adapter uses the core client's request type.

```ts
const result = tsr.financeAccounts.list.useQuery({
  queryKey: ['finance-accounts'],
  queryData: {
    extraHeaders: { 'x-request-id': requestId },
  },
});

createAccount.mutate({
  body: account,
  extraHeaders: { 'x-request-id': requestId },
});
```

The core client documentation lists `headers` and `extraHeaders` as per-request parameters, while the v5 documentation says its options are the core fetch-client options and replaces `queryFn` with typed `queryData`. [ts-rest request parameters](https://ts-rest.com/client/fetch#breaking-down-the-request-object) and [ts-rest React Query v5](https://ts-rest.com/client/react-query-v5)

One limitation matters for token-based auth: in v3.53.0-rc.1, a `baseHeaders` callback returns `string`, not `Promise<string>`, and the implementation invokes it synchronously. Therefore it works for a token already available synchronously in memory/storage, but cannot directly await token refresh or `authClient.getSession()`. For async token acquisition, obtain the token before the request and pass `extraHeaders`, or supply an async custom `api` fetcher. [Pinned v3.53.0-rc.1 client source](https://github.com/ts-rest/ts-rest/blob/v3.53.0-rc.1/libs/ts-rest/core/src/lib/client.ts) and [custom API documentation](https://ts-rest.com/client/fetch#custom-api-implementation)

That limitation does not affect FinanceOS's recommended cookie-session flow: the browser owns cookie attachment, so no token lookup is needed. An `Authorization` header should only be introduced if FinanceOS deliberately enables a bearer-token authentication mode for non-browser clients.

## Would Better Fetch be a better replacement for ts-rest + React Query?

### Where Better Fetch is attractive

Better Fetch has a smaller conceptual surface for direct calls. It can define input, output, query, and path-parameter schemas, enforce a strict path set, validate output, and configure lifecycle hooks, timeouts, and retry. [Fetch Schema](https://better-fetch.vercel.app/docs/fetch-schema), [Hooks](https://better-fetch.vercel.app/docs/hooks), and [Timeout and Retry](https://better-fetch.vercel.app/docs/timeout-and-retry)

For a small client consuming an external API, or an API whose server contract is generated/enforced elsewhere, a configured `createFetch` instance can be a good choice. It can also be used inside an ordinary TanStack Query `queryFn` or `mutationFn`.

### What FinanceOS would lose or have to rebuild

1. **One contract enforced at both ends.** FinanceOS's `packages/contract` contract is imported by the web client and by Express route registration. Better Fetch's documented Fetch Schema configures the fetch client; its official documentation does not provide an Express route adapter that consumes that schema and enforces the same status-specific server contract.
2. **Status-specific typed responses and errors.** ts-rest contracts enumerate response schemas by HTTP status. Its React Query client types non-2xx errors from the declared status responses and provides guards for expected, unknown-response, and network errors. [ts-rest React Query error handling](https://ts-rest.com/client/react-query-v5#error-handling)
3. **Native React Query bindings.** ts-rest wraps React Query v5 hooks and its query client while retaining the contract's request/response types. It supports typed cache access, optimistic updates, invalidation, direct fetching, SSR hydration, and infinite queries. [ts-rest React Query v5](https://ts-rest.com/client/react-query-v5)
4. **Server request validation and route wiring.** FinanceOS currently registers Express handlers from the same contract. Replacing ts-rest with Better Fetch would require choosing and maintaining a separate server validation/routing convention, then ensuring its schemas do not drift from the fetch schema.
5. **Migration work without a demonstrated product gain.** Current application code already contains the shared contracts, Express integration, ts-rest React Query provider, and cookie credentials configuration. Better Fetch would mainly replace the lowest-level fetch call while forcing work in the higher-value contract and server-state layers.

Better Fetch also returns `{ data, error }` by default, whereas TanStack Query expects a rejected promise to enter its error state. Its documented `throw: true` mode makes it suitable for a Query function, but query keys, caching, invalidation, optimistic updates, and hydration still remain TanStack Query responsibilities. [Better Fetch throwing errors](https://better-fetch.vercel.app/docs/getting-started#throwing-errors)

Both Better Fetch and TanStack Query can perform retries. If they are composed, retries should be owned by one layer deliberately; otherwise, nested retry policies can multiply the number of HTTP attempts. [Better Fetch retry](https://better-fetch.vercel.app/docs/timeout-and-retry) and [TanStack Query retry](https://tanstack.com/query/latest/docs/framework/react/guides/query-retries)

## Recommendation for FinanceOS

Keep the current separation:

```text
Auth endpoints:       createAuthClient -> Better Auth server
Finance API endpoints: ts-rest React Query -> ts-rest Express -> services
Server-state cache:   TanStack React Query
```

Specifically:

1. Keep [`apps/web/lib/auth-client.ts`](../../apps/web/lib/auth-client.ts) and use it only for Better Auth actions/session state.
2. Keep [`apps/web/lib/tsr.ts`](../../apps/web/lib/tsr.ts), the contracts in [`packages/contract`](../../packages/contract), and the ts-rest Express handlers.
3. Do not add a standalone Better Fetch abstraction until there is a concrete endpoint category that ts-rest handles poorly, such as a third-party API without a shared FinanceOS server contract.
4. If the motivation is retry, hooks, or auth-aware transport, first use the existing extension points: TanStack Query already handles server-state retry, and ts-rest allows a custom API fetcher. [ts-rest React Query setup](https://ts-rest.com/client/react-query-v5#3-initialize-ts-rest-react-query)

One caveat worth tracking separately: FinanceOS uses ts-rest `3.53.0-rc.1`, which the official docs identify as the release-candidate line for Zod 4 / Standard Schema support. That is a dependency-stability consideration, but it is not evidence that Better Fetch is an architectural replacement for ts-rest. [ts-rest React Query v5](https://ts-rest.com/client/react-query-v5)

## Decision

**Keep both `createAuthClient` and ts-rest + React Query. Do not migrate the FinanceOS application API to Better Fetch now.** Better Fetch is already the transport underneath Better Auth and remains a reasonable standalone tool for isolated direct-fetch cases, but replacing ts-rest would trade an end-to-end contract for a client-side fetch abstraction and create avoidable schema, server-validation, and cache-integration work.
