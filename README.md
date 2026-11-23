# LaborTracker

LaborTracker is a browser-based workspace for dispatching deliveries, assigning crews, tracking work hours, and sharing delivery updates with customers. Explore the [hosted demo](https://labortracker-cab93.web.app/) with fictional data.

## What works today

- Track deliveries from Pending to In Transit to Delivered, assign crew, flag escalations, and review activity and delivery history.
- Record work hours, review a filtered timesheet and crew roster, and export labor hours or completed deliveries as CSV.
- Review dashboard totals and daily crew progress; change workspace preferences, optionally enable Heshware Ads, Analytics cookies, or Performance Monitoring, and reset the sample data.
- Explore the demo as staff or a customer. Signed-in customers can see tracking updates that staff publish to their accounts.

In the live staff workspace, deliveries, crew, and work hours sync across devices. Staff share data with people assigned to the same team workspace. In **Settings → Workspace storage**, download an existing browser backup and import the records into your cloud workspace. The demo and this browser’s display and optional collection preferences stay local. See [Data and access](docs/wiki/Data-and-Access.md) for role scopes and storage details.

## Try the app

Open the [live site](https://labortracker-cab93.web.app/) and choose **Open demo workspace**. Guest lookups by recipient name and order number are planned for a separate backend rollout.

For local development, use Node.js 20.19 or newer:

```sh
npm ci
cp .env.example .env.local
# Set VITE_FIREBASE_API_KEY in .env.local to this project's current browser key.
npm run dev
```

Open `http://localhost:5173`. Run `npm test` for workspace validation and `npm run build` for the production bundle. The browser entry point is `src/main.jsx`, with routes in `src/app.jsx`. The older Expo app lives in `app/` for reference.

## Hosting

The static app is hosted at [labortracker-cab93.web.app](https://labortracker-cab93.web.app/). Firebase Hosting serves `dist/` and rewrites browser routes to `index.html`. To deploy a reviewed build from a machine with access to this Firebase project:

```sh
npm ci
npm run build
firebase deploy --only hosting --project labortracker-cab93
```

Apply Firestore Rules separately after a rules review. The guest lookup in `functions/` requires the Firebase Blaze plan and a separate deployment decision.

The build reads `VITE_FIREBASE_API_KEY` from your ignored `.env.local`. GitHub Hosting workflows read the same value from the `LABORTRACKER_FIREBASE_API_KEY` repository secret and stop before deployment if it is absent. Rotate the key in Google Cloud, update both locations, deploy and test, then delete the old key. The browser key appears in the built site by design; keeping it out of source control avoids repeat source alerts but does not make it a private credential. Firebase Authentication and account recovery depend on the project's enabled providers and authorized domains. The client looks up an account role at `users/{uid}` in Firestore. Demo data does not require Firestore writes. No service-account key or private credential belongs in this repository; Firebase rules enforce access control.

You can also run the static site locally with Docker:

```sh
docker build --build-arg VITE_FIREBASE_API_KEY="your-current-browser-key" -t labor-tracker .
docker run --rm -p 8080:80 labor-tracker
```

Open `http://localhost:8080`. The Docker image is an alternative local/static host; the Firebase URL above is the current public endpoint.

## Commercial licensing

LaborTracker is proprietary. Paid use is available under a separate written agreement when offered by the rights holder. The hosted demo is for evaluation. Contact [Heshware](https://heshware.it.com/) for licensing inquiries. See the [license notice](LICENSE) and the proposed [Solo, Team, and Organization purchase workflow](docs/commercial-purchase.md).

## Support and maintenance

Use the [issue forms](https://github.com/ahesh001/labor/issues/new/choose) for bugs and feature requests. Report security vulnerabilities privately as described in the [Security Policy](SECURITY.md). Track the work toward public launch in [GitHub Milestones](https://github.com/ahesh001/labor/milestones).

Pull requests run workspace checks, a dependency audit, a production build, and CodeQL scanning. Dependabot watches the web app and Functions npm packages, GitHub Actions, and Docker base images. The Supported Versions Bot tracks stable releases and flags updates to the Security Policy. See the [development guide](docs/wiki/Development.md) for project layout and deployment details.

The [GitHub Wiki](https://github.com/ahesh001/labor/wiki) contains the overview and walkthrough. Source copies live under [`docs/wiki`](docs/wiki) so documentation changes can be reviewed with code.
