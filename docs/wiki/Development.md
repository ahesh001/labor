# Development

The active app is React 19, Vite 8, and Firebase's browser SDK. `src/main.jsx` mounts the app, `src/app.jsx` defines routes, `src/pages/` renders screens, `src/context/` manages auth and workspace state, and `src/data/workspace.js` defines seed data, validation, summaries, and CSV formatting. The older Expo code under `app/` is retained for reference and is not built by Vite.

Use Node.js 20.19 or newer, then run:

```sh
npm ci
npm test
npm run build
npm run dev
```

The development site is at `http://localhost:5173`. The production output is `dist/`, which Firebase Hosting serves with route rewrites from `firebase.json`. A local Docker image can serve the same static build with Nginx. The public endpoint currently uses Firebase Hosting; there is no automatic deploy from GitHub in this repository.

Pull requests run the web app checks workflow. Dependabot proposes dependency updates. The GitHub Copilot custom agents under `.github/agents/` provide optional bug-fix and feature-building instructions if Copilot coding agent is enabled for the account. Maintainers should review their changes, run checks, and deploy separately. Avoid committing real records, debug logs, private keys, or service-account credentials.
