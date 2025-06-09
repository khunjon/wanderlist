# Cursor Rules

## General Principles
- Prioritize **clarity**, **modularity**, and **separation of concerns**.
- Suggest **more optimal solutions** if you're confident they improve performance, readability, or simplicity.
- Avoid over-complication or unnecessary abstraction.
- Only make **architectural changes** (e.g., reorganizing folders, splitting modules) after explaining pros/cons and confirming with me. 
- Only introduce new concepts (e.g., hooks, services, helpers) when reuse or separation makes the code easier to understand.
- Be proactive about simplifying logic and eliminating redundancy.
- If any code becomes longer than **150 lines**, suggest breaking it down.
- Do not add external libraries unless necessary and justified.

## Language & Stack
- The project uses **Next.js 15**, **TypeScript**, **React**, **Tailwind CSS**, **Firebase (Firestore, Auth, Storage)**, and **Google Places API.**
- Use **modern TypeScript features** like type inference, union types, and optional chaining where appropriate.
- Prefer **functional components** with hooks over class-based components.
- Follow **Next.js 15 conventions**: use app/ directory structure, separate server and client components appropriately.
- Firebase queries should be clean, safe, and follow best practices — use proper error handling and type safety.

## Next.js 15 Specific
- **Dynamic route segments** receive params as a Promise that must be awaited in server components.
- **Client components** using hooks like useSearchParams must be wrapped in Suspense boundaries.
- Properly separate **server and client components** for optimal performance.
- Use **server actions** for form submissions when appropriate.
- Leverage **streaming** and **partial prerendering** features where beneficial.


## Coding Style
- Follow the **Airbnb JavaScript Style Guide**, but be flexible where simpler alternatives make sense.
- Use:
  - `const` by default, `let` only when reassignment is required.
  - `camelCase` for variables and functions.
  - `PascalCase` for component names.
- Prefer **arrow functions** for all function expressions.
- Limit line length to **100 characters**.
- Add **inline comments** only when the code isn't self-explanatory.

## Components & UI
- Keep React components **small and focused** — ideally < 100 lines.
- Use **Tailwind CSS** for all styling — avoid custom CSS unless absolutely necessary.
- Ensure **mobile-first responsive design** with Tailwind's responsive utilities.
- Maintain **accessibility standards** with proper ARIA labels and semantic HTML.

## Firebase Integration
- Use proper type safety with Firebase operations.
- Handle loading states and errors gracefully in all Firebase operations.
- Follow established patterns for:
  - Authentication state management
  - Firestore queries with proper error handling
  - Storage operations (especially profile photo uploads)
- Respect **security rules** — don't attempt operations that violate Firestore rules.
- Use **Firebase hooks** consistently for reactive data.

## State Management
- Use **React hooks** (useState, useEffect, useContext) for local state.
- Leverage **custom hooks** for complex state logic that's reused across components.
- Keep state as **local as possible** — only lift state up when necessary.
- Use **Firebase's real-time capabilities** for data synchronization.

## API Integration
- **Google Places API** calls should be properly typed and handle errors.
- Use **environment variables** for all API keys and sensitive configuration.
- Implement proper **rate limiting** and **caching** strategies where appropriate.
- Follow the established patterns for search functionality.

## User Experience
- Maintain **mobile-first design** principles.
- Implement proper **loading states** and **error boundaries**.
- Follow the established **view modes** pattern (Grid, Map, Swipe views).
- Ensure **touch-friendly interactions** and **keyboard navigation**.
- Provide **contextual feedback** for user actions (success/error messages).

## AI Behavior
- Be **proactive** in identifying areas for improvement, like:
  - Simplifying logic
  - Removing dead code
  - Refactoring duplicated patterns
  - Improving mobile responsiveness
  - Enhancing accessibility
- Always aim for **safe, deterministic edits**. If unsure about a change’s side effects, ask me first.
- When suggesting large-scale refactors or new abstractions, include:
  - Tradeoffs
  - Time/complexity implications
  - Alternatives I might consider

## Testing
- No test framework is currently used.
- Do not auto-generate test files.
- If I ask for a test, keep it **minimal and logic-focused**, using plain functions unless told otherwise.

## Security & Privacy
- Respect **user privacy** — follow the established patterns for profile information.
- Ensure **proper authentication** checks before sensitive operations.
- Don't expose sensitive data in client-side code.
- Follow **Firebase security rules** and don't attempt to bypass them.

## Documentation
- Write clean, minimal code. Only add comments when it improves understanding.
- For complex functions, include a short docstring-style comment above explaining the **intent**.
- Update type definitions when adding new features.
- Document any breaking changes or migration steps when updating patterns.