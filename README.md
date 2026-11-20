# MerchantPay Portal Demo

An Angular 22 standalone application for a merchant onboarding and underwriting workflow. It uses Angular Material, Reactive Forms, signals, RxJS, lazy routes, and Vitest.

## Run locally

```bash
npm install
npm start
```

Open `http://localhost:4200`. The application seeds clearly synthetic records the first time the mock API is used.

## Mock API and token refresh

`provideHttpClient` registers the bearer-token interceptor followed by an in-app mock API interceptor. The mock API provides asynchronous HTTP responses for:

- `GET /api/applications` with server-style pagination, search, status, and risk filters
- `GET /api/applications/:id`
- `POST /api/applications` for draft saves and submissions
- `POST /api/applications/:id/review`
- `PATCH /api/applications/:id/assignment`
- `GET /api/reviewers`
- `POST /auth/refresh`

The interceptor adds an access token and shares one refresh request when concurrent requests receive 401 responses. The **Concurrent 401 Demo** page sends four requests through that same flow.

This is an in-browser mock API, not a separately deployed server. Its storage, tokens, role checks, and authorization are for demonstration and testing; production authorization must run on a trusted server.

## Demo roles

| Role | Access |
| --- | --- |
| SALES | Creates and edits records they created; sees only those records; cannot submit review decisions. |
| REVIEWER | Sees records assigned to the selected reviewer identity and can submit decisions for those records. |
| ADMIN | Sees all records and can reassign them to a reviewer. |

The role selector is a demo identity switch, not authentication. Review and sensitive-field reveals are role-aware in the interface and mock API.

## Drafts and storage

The five-step Reactive Form validates each step and autosaves changes after a 500 ms RxJS debounce. The mock API persists records in browser `localStorage`; clearing the `merchant-applications` key resets the demo records. Do not enter real merchant, personal, or payment information.

## Routes

Features are loaded with `loadComponent`. Role guards restrict application creation/editing and the interceptor demo. The mock API separately checks record ownership, reviewer assignment, and role permissions.

## Tests and build

```bash
npm test
npm run build -- --configuration development
```

Vitest runs Angular TestBed specs in jsdom. Tests cover the shared concurrent refresh, role-scoped API responses, dashboard pagination/filter requests, form validation, review submission, and shared components.

## Security and CSP

The Security & CSP page explains a sample policy. This repository does not configure an HTTP server response header, so the sample policy is not enforced locally. Browser `localStorage` is readable by page scripts and is not suitable for production secrets.

## AI assistance disclosure

AI assistance was used to implement and revise this project. Verification performed: development build and Vitest suite.
