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
| SALES | Can see every application in the dashboard table, create applications, and edit their own records. Can open details for their own records. Cannot submit review decisions. Sensitive values can be revealed or hidden. The navbar menu is hidden; **Create Merchant App** is available on the dashboard. |
| REVIEWER | Can see and review every application. Cannot create or edit applications. Sensitive values can be revealed or hidden one field at a time. The navbar menu and reviewer identity selector are hidden. |
| ADMIN | Can see, create, and edit all applications, submit review decisions, and manage reviewer assignments from the dashboard. Every row has **Review** and **Edit** actions. Sensitive values can be revealed one field at a time. |

The role selector is a demo identity switch, not authentication. All three roles receive the full, paginated dashboard list. Sales can open details and edit only applications they created, but can see every row in the dashboard table. Reviewers and Admin can open and review every application; only Admin can edit assignments. Sensitive fields start masked and can be revealed or hidden independently by any role on the dashboard or application detail page. When switching to Sales, navigation returns to the dashboard except when already on an application detail page. Switching to Reviewer from the New Application page returns to the dashboard.

## Drafts and storage

The five-step Reactive Form validates each step and autosaves changes after a 500 ms RxJS debounce. The mock API persists records in browser `localStorage`; clearing the `merchant-applications` key resets the demo records. Do not enter real merchant, personal, or payment information.

## Routes

Features are loaded with `loadComponent`. Role guards prevent Reviewer from opening application creation/editing routes and Sales from opening the interceptor demo. The mock API returns all applications in dashboard lists, limits Sales detail access and edits to their own records, allows Reviewer and Admin to review all records, and restricts assignment management to Admin.

## Tests and build

```bash
npm test
npm run build -- --configuration development
```

Vitest runs Angular TestBed specs in jsdom. Tests cover the shared concurrent refresh, role-based API permissions, dashboard pagination/filter requests, form validation, review submission, and shared components.

## Security and CSP

The Security & CSP page explains a sample policy. This repository does not configure an HTTP server response header, so the sample policy is not enforced locally. Browser `localStorage` is readable by page scripts and is not suitable for production secrets.

## AI assistance disclosure

AI assistance was used to implement and revise this project. Verification performed: development build and Vitest suite.
