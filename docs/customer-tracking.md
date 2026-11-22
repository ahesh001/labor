# Customer tracking

Staff delivery editing remains browser-local. Publishing creates a separate cloud-backed, customer-safe tracking record; saving an internal delivery does not automatically publish it. A guest can use **Continue as guest** and enter the recipient name and customer order number to look up the published customer-facing delivery details.

1. Staff enters the recipient name, customer order number, and customer-facing order description in Delivery details.
2. A real Admin or Lead opens Customer tracking and may link a customer's User ID for signed-in account tracking.
3. Publish saved delivery status. The assigned account sees it under My deliveries, and a guest can find it with the recipient name and order number.
4. After changing status or customer-facing details, save the delivery and publish again. Status changes append server-timestamped timeline events atomically with the tracking update.

Demo mode never publishes to Firestore. Existing local records are not uploaded automatically. There is no GPS or arrival estimate integration.

## Access model

`customerTracking/{deliveryId}` contains only the optional customerUid, recipient and order lookup fields, customer-facing description, address, schedule date, status, updatedAt and regionId. Status events live in its events subcollection. Signed-in customers query by their own UID. Guest lookups go through the rate-limited `lookupGuestOrder` callable and never receive access to Firestore collection reads. Admin and Lead accounts publish, and an assignment cannot be changed through the client. Role assignment must be done by a trusted administrator, never by self-registration.

Internal deliveries are staff-only. Labor records, internal notes, escalation flags and crew assignments are not copied into customer tracking. There is no GPS or arrival-time estimate integration; the customer sees the scheduled date only. Existing tracking records must be republished with recipient name and order number before guest lookup can find them.

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
