# Data and access

LaborTracker currently saves deliveries, crew, work entries, and preferences in browser local storage. Demo data is fictional and can be reset in Settings. A Firebase account identifies a user, but this version does not synchronize workspaces across devices or users. Clearing browser storage can remove records; export CSVs you need to keep.

**Guest** is read-only. The demo's **Admin**, **Lead**, and **User** selector changes visible controls and local actions for a presentation. It is not a server-side permission boundary. Admin and Lead can add crew in the current interface; User can record hours and manage deliveries. Actual multi-user operations require a shared data model and Firebase Security Rules that enforce access on the server.

Firebase Authentication supports account registration, sign-in, and password recovery if the project's provider and authorized domains are configured. The app reads an optional role from `users/{uid}` in Firestore. Workspace records themselves are not stored there. Never put a service-account key or private credential in the browser app or repository. The browser Firebase SDK configuration is public project identification; the rules determine what data is accessible.

This release should be used for demonstration or individual browser-local work until shared persistence, authorization rules, backup, and restore are implemented and verified.
