# Customer tracking

Staff delivery editing remains browser-local. Publishing creates a separate cloud-backed, customer-safe tracking record; saving an internal delivery does not automatically publish it.

1. A customer signs up and shares their User ID from Profile with staff.
2. A real Admin or Lead opens the saved delivery and enters that ID in Customer tracking.
3. Publish saved delivery status. The assigned customer sees the delivery on My deliveries, across browsers.
4. After changing a status, save it and publish again. Status changes append server-timestamped timeline events atomically with the tracking update.

Demo mode never publishes to Firestore. Existing local records are not uploaded automatically. There is no GPS or arrival estimate integration.

## Access model

`customerTracking/{deliveryId}` contains only customerUid, address, scheduledDate, status, updatedAt. Status events live in its events subcollection. Customers query by their own UID. Rules enforce ownership for both documents and events; customers cannot write. Admin and Lead accounts publish, and an assignment cannot be changed through the client. Role assignment must be done by a trusted administrator, never by self-registration.

Internal deliveries are staff-only. Labor records, internal notes, escalation flags and crew assignments are not copied into customer tracking. There is no GPS or arrival estimate integration.

## Required release verification

The production build and existing workspace tests pass. Firestore integration and security tests have not yet been run. Before deploying rules and Hosting together, verify with staff and two customer accounts (preferably in the emulator):

- Staff can publish to an existing User profile; non-staff writes fail.
- Assigned customer can query and directly read their delivery and timeline.
- A different customer, anonymous request, and unfiltered customer query are denied.
- Customer cannot read internal deliveries, change their role, change assignment, or edit events.
- Extra internal fields in a tracking write are rejected.
- Two concurrent status publications retain timeline entries; repeated unchanged status does not create another event.
- Disconnect/reconnect displays cached state and recovers; publishing failures never show success.

Deploy both firestore rules and Hosting after these checks. No rules or Hosting deployment was performed as part of this implementation.
