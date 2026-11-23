# Data, roles and access

Delivery, crew, work-hour and preference data remains in browser local storage. Customer tracking records and status events are shared through Firestore and protected by `firestore.rules`. Demo changes are local only. Never rely on hidden buttons or client-side role checks as a security boundary.

## Hierarchical resource-action roles

The app and Firestore rules use `resource:action` names. Roles inherit permissions through the definitions in `src/auth/permissions.js`:

- **Super Admin**: `*:*`.
- **Admin**: `*:*` (full access, per the configured policy).
- **OperationsAdmin**: includes Lead permissions plus operational user creation, order creation, dispatch override, tracking view and report export. Cloud records are restricted to regions listed in the trusted `users/{uid}` profile. Financial, payout, role-management and system-security actions remain excluded.
- **RegionalAdmin**: inherits Lead; adds user read, order creation and report export, limited to `regions` listed in that account's trusted `users/{uid}` profile.
- **Lead**: read and update orders, dispatch read, publish customer tracking and manage labor.
- **User**: read tracking assigned to their own UID.
- **Guest**: no cloud permissions.

`roles:assign` and `roles:manage` are granted only by the `*:*` roles. Users cannot set their own role, permission list, or region list. Scoped staff need a trusted `regions` list on their user profile, and region-tagged cloud records. Missing region data fails closed for scoped access. The current app defaults newly published sample tracking to the `default` region; assign that region to the staff profile before testing scoped publication. User profile listings are scoped using each profile's `regionId`. Promoting an account to Admin or Super Admin requires `roles:manage`, while scoped role assignment uses `roles:assign` and cannot grant those top-level roles.

The current Firestore collections cover `users`, `deliveries`, `customerTracking` and tracking `events`. Permissions for drivers, vehicles, pricing, payouts, integrations, audit, and other proposed resources are reserved policy names; those services and records do not exist in this app yet. No financial or payout operation is exposed. Add backend data and a matching rule before exposing one of those actions.

Admin wildcard access is broad by design. Protect Admin/Super Admin accounts with strong sign-in and restrict who can assign those roles. The client permission map controls navigation and presentation; Firestore rules are the enforcement boundary for cloud data. Keep both definitions aligned during changes.

Firebase Authentication identifies staff. Deliveries, crew, and work hours sync in a private workspace for each staff account by default. A trusted administrator can assign the same `workspaceId` to staff accounts under `users/{uid}` to give them access to the same team workspace. Give region-scoped staff a workspace containing only records they are authorized to see. Before changing an account’s workspace assignment, review and transfer any records already saved to its old cloud workspace. A membership change selects a different workspace and does not move its data.

Existing local records are kept in each browser. Sign in as the account that originally saved them on each device, open **Settings → Workspace storage**, and download the JSON backup before selecting **Import browser records**. Identical records are skipped on retries. Conflicts with different records using the same ID stop the import before those records can be overwritten. Keep the local backup until all devices and record counts have been checked. For interrupted imports, retry in the same workspace. The original browser copy remains available after import.

The demo uses browser storage. Customer accounts receive only their published tracking records. Display and optional collection preferences remain local. Use the Firebase Auth and Firestore emulators with `--project demo-labortracker` to run `tests/shared-workspace.test.js` with synthetic accounts and data.

## Optional Heshware Ads

The **Optional** disclosure in Settings has three independent choices, all off by default. **Heshware Ads** loads up to two recent public Heshware project announcements with links when enabled; the feed does not personalize announcements using work activity. **Analytics cookies** enables Firebase Analytics only after consent; page-view collection and Google ad personalization signals are disabled. **Performance information** enables Firebase Performance Monitoring for automatic app and network timing metrics. Choices are stored with the browser workspace and can be changed at any time. Essential browser storage and Firebase Authentication remain necessary for core sign-in and workspace functionality.
