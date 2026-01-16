# OGTO - AI Agent Development Guide

Application for AI agent development and execution with real-time monitoring capabilities. The project follows a modular architecture with clear separation between UI, AI logic, and data persistence.

## Dev Environment Tips
- Use `npm run dev` to start the Next.js development server on http://localhost:3000
- Run `npm run type-check` to verify TypeScript types without building
- Use `npm run lint:fix` to automatically fix ESLint issues
- Run `npm run format` to format code with Prettier
- Check the AI SDK integration with `npm run test` to ensure all components work correctly

## Project Structure
- Next.js 15 — 15 — React 19–ready App Router in app/, Server Components + streaming by default.
- AI SDK 5 — ai, @ai-sdk/openai— type-safe chat/agents, tool calling, unified provider API.
- Tailwind CSS v4 — utility-first styling with design tokens and faster v4 pipeline.
- shadcn/ui — (no runtime pkg; generate components into components/ui/) — CLI shadcn@3.x.x
- Latest Drizzle ORM — type-first SQL/ORM with schema-driven migrations. npm install drizzle-orm@latest postgres and npm install -D drizzle-kit@latest
- Latest Supabase (JS client) — @supabase/supabase-js@2.x.x — auth, Postgres, storage, Realtime, with vector search capabilities.
- Vitest — 3.x.x — Vite-native unit testing (stable).
- Jotai — 2.x.x — minimal atomic state management for React.
- React Hook Form (RHF) — 7.x.x— lightweight, performant forms; works with resolvers (Zod v4).
- Zod 4 — 4.x.x — fast, TS-first schema validation and parsing.

## Global Files
- constants.ts (global sharable constants for agents, runs, tools and settings)

## Components Folder and Files Structure
What each component or sub-component file is for:
- index.tsx — the UI component. Composes hooks, renders the composer, accepts typed props.
- hooks/
 - useComponentName.ts
 - useComponentNameFormSchemaInit.ts
 - useComponentNameFormError.ts (watch for form fields and handle form field errors)
 - useComponentNameForm.ts (handle get, post, put, delete interactions with api routes)
- types.ts
- styles.ts
- constants.ts

## Testing Instructions
- Run `npm test` to execute the full test suite with Vitest
- Use `npm run test:ui` to open the interactive Vitest UI
- Focus on specific tests with `npm test -- -t "test name"`
- All tests must pass before committing changes
- Add tests for new components and AI agent functionality
- Test database operations with proper mocking of Supabase calls

## AI Agent Development
- Agents components should be placed in `components/agents/`
- Runs components should be placed in `components/runs/`
- Toos components should be placed in `components/tools/`
- Settings components should be placed in `components/settings/`
- Use streamText() to streams text generations from a language model. You can use the streamText function for interactive use cases such as chat bots and other real-time applications
- API Routes: RESTful endpoints for agents, runs, memory, tools, database operations, and settings management.
- App Shell: Navigation sidebar and main layout wrapper
- Leverage local Supabase for agent, run, tool, setting state persistence and user data
- Follow the established patterns in existing agent components
- Test AI functionality with proper error handling and fallbacks

## Database & Integration Guidelines
- Use Drizzle ORM for type-safe database operations
- Supabase integration is pre-configured with environment variables
- Run database migrations with `npx drizzle-kit push`
- Always use Row Level Security (RLS) for data protection
- Test database operations in isolation before integration

## Code Quality Standards
- TypeScript strict mode is enabled - fix all type errors
- ESLint and Prettier are configured - run `npm run lint` and `npm run format`
- Use semantic HTML and proper ARIA attributes for accessibility
- Follow the established component patterns in `components/ui/`
- Maintain consistent styling with Tailwind CSS design tokens

## Commit Guidelines
- Run `npm run lint`, `npm run type-check`, and `npm test` before committing
- Use conventional commit messages: `feat:`, `fix:`, `docs:`, etc.
- Ensure all TypeScript types are properly defined
- Test AI agent functionality thoroughly before pushing
- Update documentation for new agent capabilities or API changes