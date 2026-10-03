# LaborTracker

LaborTracker is a browser-based dispatch and labor dashboard for managing deliveries, crew assignments, work hours, and basic labor costs. The [live app](https://labortracker-cab93.web.app/) includes a fictional demo workspace so you can explore it without creating an account.

## What works today

- Track deliveries from Pending to In Transit to Delivered, assign crew, flag escalations, and review activity and delivery history.
- Record work hours, review a filtered timesheet and crew roster, and export labor hours or completed deliveries as CSV.
- Review dashboard totals and daily crew progress; change workspace preferences and reset the sample data.
- Use a read-only guest view, a writable demo with Admin/Lead/User interface views, or Firebase email/password sign-in when enabled in the Firebase project.

The demo starts with 12 fictional deliveries, four crew members, and eight work entries. **This release stores workspace records in the current browser**, including records for signed-in accounts. It does not sync deliveries or timesheets between devices or coworkers. The demo role selector changes the presentation and local actions; it is not an authorization system for shared data. Export important records before clearing browser storage. See [Data and access](docs/wiki/Data-and-Access.md) for the exact boundaries.

## Try the app

Open the [live site](https://labortracker-cab93.web.app/) and choose **Open demo workspace**. The [walkthrough](docs/wiki/Walkthrough.md) covers the main tasks. **Continue as guest** provides a read-only sample dashboard.

For local development, use Node.js 20.19 or newer:

```sh
npm ci
npm run dev
```

Open `http://localhost:5173`. Run `npm test` for workspace validation and `npm run build` for the production bundle. The active browser entry point is `src/main.jsx`; `src/app.jsx` defines routes. Older Expo/React Native files in `app/` are retained for reference but are not part of this Vite build.

## Hosting

The static app is hosted at [labortracker-cab93.web.app](https://labortracker-cab93.web.app/). Firebase Hosting serves `dist/` and rewrites browser routes to `index.html`. To deploy a reviewed build from a machine with access to this Firebase project:

```sh
npm ci
npm run build
firebase deploy --only hosting --project labortracker-cab93
```

Firebase Authentication and account recovery depend on the project's enabled providers and authorized domains. The client looks up an account role at `users/{uid}` in Firestore. Demo data does not require Firestore writes. No service-account key or private credential belongs in this repository. Firebase's browser SDK configuration identifies the project; it is public client configuration, so access control must be enforced by Firebase rules.

You can also run the static site locally with Docker:

```sh
docker build -t labor-tracker .
docker run --rm -p 8080:80 labor-tracker
```

Open `http://localhost:8080`. The Docker image is an alternative local/static host; the Firebase URL above is the current public endpoint.

## Contributing and maintenance

Pull requests run tests and a production build. Dependabot proposes dependency updates. Repository instructions and two optional GitHub Copilot custom agents live in `.github/`; they help review bugs and build features when Copilot coding agent is available on the account. They do not run independently or deploy changes. See the [development guide](docs/wiki/Development.md) for project layout, checks, and deployment boundaries.

The [documentation guide](docs/wiki/Home.md) contains the overview and walkthrough. Its source lives under [`docs/wiki`](docs/wiki) so documentation changes can be reviewed with code.
