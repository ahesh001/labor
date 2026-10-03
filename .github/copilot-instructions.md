# LaborTracker repository guidance

The active product is the React/Vite browser app under `src/`. `src/main.jsx` is the entry point, `src/app.jsx` defines routes, and `src/context/WorkspaceContext.jsx` owns browser-persisted workspace changes. `src/data/workspace.js` contains the data model, validation, seed data, summaries, and CSV formatting. The `app/` directory is older Expo code kept for reference; do not use it as the implementation target for web app issues.

Keep claims about persistence accurate: Firebase Auth identifies accounts, while deliveries, crew, entries, and preferences currently live in local browser storage. The demo Admin/Lead/User switch is for presentation and local UI behavior, not server-side authorization. Do not present shared cloud synchronization as implemented.

For code changes, reproduce the issue, make a focused fix, and run `npm test` and `npm run build`. Add or adjust a test when it protects a meaningful behavior. Never commit service-account files, environment secrets, personal data, or debug logs. Do not deploy or change Firebase settings without an explicit request and an opportunity to review the result.
