# LaborTracker

LaborTracker is a browser-based dispatch and labor dashboard for managing deliveries, crew assignments, work hours, and basic labor costs. The [live app](https://labortracker-cab93.web.app/) includes a fictional demo workspace so you can explore it without creating an account.

## What works today

- Track deliveries from Pending to In Transit to Delivered, assign crew, flag escalations, and review activity and delivery history.
- Record work hours, review a filtered timesheet and crew roster, and export labor hours or completed deliveries as CSV.
- Review dashboard totals and daily crew progress; change workspace preferences, optionally enable Heshware Ads, Analytics cookies, or Performance Monitoring, and reset the sample data.
- Use a read-only guest view, a writable demo with Super Admin, Admin, OperationsAdmin, RegionalAdmin, Lead, and User views, or Firebase email/password sign-in when enabled in the Firebase project.

The demo starts with 12 fictional deliveries, four crew members, and eight work entries. **This release stores workspace records in the current browser**, including records for signed-in accounts. It does not sync deliveries or timesheets between devices or coworkers. The demo role selector changes local presentation only. Staff roles use hierarchical `resource:action` permissions in the UI, and Firestore rules enforce access to cloud customer tracking and the cloud collections that are currently configured. See [Data and access](docs/wiki/Data-and-Access.md) for role scopes and data boundaries.

## Try the app

Open the [live site](https://labortracker-cab93.web.app/) and choose **Open demo workspace** to explore sample operations data. **Continue as guest** provides a read-only sample dashboard.

For local development, use Node.js 20.19 or newer:

```sh
npm ci
cp .env.example .env.local
# Set VITE_FIREBASE_API_KEY in .env.local to this project's current browser key.
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

The build reads `VITE_FIREBASE_API_KEY` from your ignored `.env.local`. GitHub Hosting workflows read the same value from the `LABORTRACKER_FIREBASE_API_KEY` repository secret and stop before deployment if it is absent. Rotate the key in Google Cloud, update both locations, deploy and test, then delete the old key. The browser key appears in the built site by design; keeping it out of source control avoids repeat source alerts but does not make it a private credential. Firebase Authentication and account recovery depend on the project's enabled providers and authorized domains. The client looks up an account role at `users/{uid}` in Firestore. Demo data does not require Firestore writes. No service-account key or private credential belongs in this repository; Firebase rules enforce access control.

You can also run the static site locally with Docker:

```sh
docker build --build-arg VITE_FIREBASE_API_KEY="your-current-browser-key" -t labor-tracker .
docker run --rm -p 8080:80 labor-tracker
```

Open `http://localhost:8080`. The Docker image is an alternative local/static host; the Firebase URL above is the current public endpoint.

## Contributing and maintenance

Pull requests run tests, a dependency audit, a production build, and CodeQL security scanning. Dependabot proposes dependency updates. Repository instructions and two optional GitHub Copilot custom agents live in `.github/`; they help review bugs and build features when Copilot coding agent is available on the account. They do not run independently or deploy changes. See the [development guide](docs/wiki/Development.md) for project layout, checks, and deployment boundaries.

The [GitHub Wiki](https://github.com/ahesh001/labor/wiki) contains the overview and walkthrough. Source copies live under [`docs/wiki`](docs/wiki) so documentation changes can be reviewed with code.
