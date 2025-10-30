# Project: JusBro (Custom Browserless Fork)

## Project Overview

This is a monorepo for **JusBro**, a custom fork of the open-source [Browserless](https://github.com/browserless/browserless) project. It is a specialized platform for automated web scraping of legal data from Brazilian courts, particularly the PJE (Processo Judicial Eletrônico) system used by TRTs (Tribunais Regionais do Trabalho).

The project is composed of two main parts:

1.  **Next.js Frontend**: A modern web application built with Next.js 16, React 19, and Shadcn/ui. It provides a user-friendly interface for managing credentials, configuring and running scraping jobs, and viewing the extracted data. It uses Prisma with a SQLite database for local data persistence.
2.  **Node.js Backend**: The core of the application, based on Browserless. It manages headless browser instances (Chromium, Firefox, WebKit) using Puppeteer and Playwright. This backend exposes a WebSocket endpoint for browser automation and includes specialized scripts for logging into and scraping data from the PJE system, complete with anti-bot detection mechanisms.

### Key Technologies

*   **Runtime**: Node.js v24
*   **Languages**: TypeScript 5.9, JavaScript
*   **Frontend**: Next.js 16, React 19, Tailwind CSS 4, Shadcn/ui
*   **Backend**: Express (via Browserless), Puppeteer, Playwright
*   **Database**: Prisma, SQLite (default), PostgreSQL (supported)
*   **Testing**: Mocha, c8, Playwright (for E2E)
*   **Code Quality**: ESLint, Prettier
*   **Containerization**: Docker

## Building and Running

### Prerequisites

*   Node.js v24.x
*   npm

### Development

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Set up Environment Variables**:
    Copy the example environment file and configure it.
    ```bash
    cp .env.example .env
    ```
    Edit `.env` to add your database URL and any necessary credentials for testing.

3.  **Run Database Migrations**:
    ```bash
    npx prisma migrate dev
    ```

4.  **Start the Development Server**:
    This command starts the Next.js frontend on `http://localhost:3000`.
    ```bash
    npm run dev
    ```

### Production

1.  **Build the Application**:
    This builds both the Next.js frontend and the Node.js backend.
    ```bash
    npm run build
    ```

2.  **Start in Production Mode**:
    ```bash
    npm start
    ```

### Running Tests

*   **Run all tests**:
    ```bash
    npm test
    ```
*   **Run tests with code coverage**:
    ```bash
    npm run coverage
    ```

## Development Conventions

*   **Monorepo Structure**: The frontend code resides in the root (`app`, `components`, `lib`, etc.), while the backend Browserless code is in the `server` directory. Each has its own `tsconfig.json`.
*   **Styling**: Utility-first CSS with Tailwind CSS. UI components are built using Shadcn/ui.
*   **State Management**: Zustand is available, but the primary data flow for the frontend relies on Next.js Server Actions and Prisma for data fetching and mutations.
*   **Database**: The schema is managed with Prisma. Changes should be made in `prisma/schema.prisma`, followed by running `npx prisma migrate dev`.
*   **Code Style**: Enforced by ESLint and Prettier. Imports are automatically sorted. Follow `camelCase` for functions/variables and `PascalCase` for types/components.
*   **Commits**: Use Conventional Commits format (e.g., `feat(pje): ...`, `fix(ui): ...`).
*   **PJE Scripts**: The core scraping logic is located in `server/scripts/pje-trt/`. These are designed to be modular and reusable.
