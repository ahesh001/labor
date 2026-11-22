# LaborTracker commercial purchase workflow

This is the proposed process for a paid pilot. Pricing, billing intervals, seat limits, support commitments, and contract terms need approval before an offer is sent. See the [commercial launch milestone](https://github.com/ahesh001/labor/milestone/5) for implementation work.

## Proposed access tiers

| Tier | Buyer | Proposed product access | Billing model |
| --- | --- | --- | --- |
| Solo | One-person company | One workspace and one internal operator. Delivery dispatch, work hours, CSV exports, and customer tracking. | Flat subscription per workspace. |
| Team | Small organization | One shared workspace, multiple internal seats, staff invitations and scoped roles, shared delivery and crew records, and standard exports. | Workspace subscription with a base seat allowance and paid additional seats. |
| Organization | Company with multiple locations or teams | Multiple locations under one organization, location-scoped staff access, centralized billing, audit exports, and agreed onboarding or support. | Contract with seat or location limits and a negotiated support term. |

People who only view their own delivery do not consume staff seats. All tiers include accessibility settings and the same baseline data protection. An organization owner administers their organization through scoped permissions. LaborTracker’s platform Super Admin role is reserved for the operator of the service.

## Pilot purchase and provisioning

1. Receive the inquiry through [Heshware](https://heshware.it.com/). Record the buyer’s legal name, owner contact, requested tier, locations, and seats in a private sales system. Assign an order reference.
2. Send a quote and written license or hosted-service agreement. State the purchased features, term, price, seat limits, renewal and cancellation terms, support, and any separate right to install or distribute the software. Record acceptance and the version of the terms.
3. Issue an invoice or send an approved hosted payment link. Record the provider’s invoice or checkout reference against the order. Keep payment card details with the provider.
4. Verify the payment in the provider dashboard. In a private order record, confirm the buyer, amount, currency, and collected payment reference. Move the order from `awaiting_payment` to `paid`. Delay activation while payment is pending.
5. After tenant isolation and access controls are available, create or locate the organization by order reference and grant only the purchased entitlement and seats. Send an invitation to the verified owner, confirm activation in the order record, and provide the receipt, onboarding guide, and support contact. Mark provisioning `active` only after the tenant and permissions are confirmed.
6. For renewal, upgrades, seat changes, cancellation, refunds, or disputes, verify the billing event and apply the agreed effective date. Record entitlement changes and give the owner a supported path to export data when the contract allows it. Follow the approved data retention and deletion policy.

If payment is verified but provisioning fails, keep the order in `paid` with a provisioning error and retry against the same order reference. Check the existing organization and invitation before retrying to avoid duplicates. Confirm the launch gates before offering live customer onboarding.

## Requirements for automated checkout

- Map provider price IDs to an approved tier and seat allowance on the server. Bind checkout to an internal order and verified account. Save the accepted agreement version and billing references in restricted records.
- Verify webhook signatures and confirmed payment state before fulfillment. Handle delayed payments, renewals, and refunds. Deduplicate provider events and make activation idempotent by order reference. Reconcile missed and out-of-order events with the provider. See [Stripe’s hosted checkout fulfillment guide](https://docs.stripe.com/checkout/fulfillment) for an example integration.
- Store entitlements separately from staff roles. Authorize each server request based on tenant membership, the requested action, and the purchased entitlement. Block cross-tenant reads and writes, seat overruns, and client-side changes to billing or plan state.
- Prove the lifecycle in a test environment with two tenants, then in the paid pilot. Cover delayed and failed payments, duplicate events, expired invitations, upgrades, cancellation, refunds, and retry after partial provisioning. Launch checkout after the provider and deployment are approved.
