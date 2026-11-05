# Task Manager

A web application for task management, developed as a solution to a technical challenge.

## Features

- Task listing with initial data loaded on the server.
- Task creation, editing, and deletion.
- Input validation and feedback for successful and failed operations.
- Sample task import to facilitate demonstration.
- Infinite scrolling with cursor-based pagination.
- Bilingual interface supporting English and Portuguese, with English as the default language.

Each task has an automatically generated unique identifier, a required title, an optional description, and a creation timestamp.

## Technologies

- **Next.js 15** — React framework using the App Router and server-side rendering.
- **React** — UI development with functional components and hooks.
- **TypeScript** — static typing.
- **tRPC** — type-safe communication between the frontend and backend.
- **TanStack React Query** — query management, mutations, and infinite pagination.
- **Zod** — runtime validation of input data.
- **Tailwind CSS** — UI styling.

## Requirements

- Node.js 20.9 or later.
- pnpm.

## Getting Started

Clone the repository and navigate to the project directory:

```bash
git clone https://github.com/slipjfa/artefact.git
cd artefact
```

Install dependencies:

```bash
pnpm install
```

Start the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Architecture

The application uses the Next.js App Router. The initial task page is loaded directly on the server, avoiding an additional HTTP request to retrieve the initial data.

Frontend operations are handled through tRPC. Procedures validate input data with Zod and delegate operations to the in-memory store.

The main project directories are organized as follows:

```text
src/
├── app/                  # Home page, layout, and tRPC endpoint
├── components/tasks/     # Task management interface
├── server/
│   ├── tasks/            # Task validation and in-memory storage
│   └── trpc/             # tRPC initialization and procedures
└── trpc/                 # Frontend client and providers
```

## Data Storage

Task data is stored in memory within the server process, as required by the challenge. No database configuration or environment variables are needed.

**Important:** All tasks are lost when the server process restarts. Data is not shared between independent processes or instances, so this implementation does not provide reliable persistence.

## Validation

To check types, run the linter, and verify the production build:

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm build
```