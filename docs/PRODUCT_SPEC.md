# Master Product Specification

This document preserves the complete master product specification supplied by the project owner. It is the authoritative detailed product source of truth. The final build requirements below describe the whole product, not authorisation to implement every phase in the current task.

## Delivery instructions and project rules

Do NOT attempt to build the entire application in one pass.

Before implementing application features:

1. Read the entire specification carefully.
2. Create `/docs/PRODUCT_SPEC.md` containing the complete specification so it remains the permanent source of truth for the project.
3. Create a concise root-level `AGENTS.md` that tells future coding agents:
   - what the product is
   - that V1 is a managed equipment-rental service, NOT a public marketplace
   - the approved technology stack
   - the most important architectural/security rules
   - that `/docs/PRODUCT_SPEC.md` is the authoritative detailed specification
   - that agents must read the relevant sections of PRODUCT_SPEC.md before changing a feature
4. Create `/docs/ARCHITECTURE.md` describing the actual architecture chosen.
5. Create `/docs/IMPLEMENTATION_STATUS.md` containing:
   - completed functionality
   - current phase
   - outstanding work
   - known issues
   - external integrations still requiring configuration
6. Create the initial project structure only.
7. Do NOT implement later product phases yet.

Important project rules:

- Never knowingly contradict PRODUCT_SPEC.md.
- If implementation decisions cause the specification or architecture to evolve, update the relevant project documentation.
- Never silently replace a product requirement with an easier implementation.
- Never fake external integrations.
- Never expose marketplace/third-party-owner functionality publicly in V1.
- Prioritise production-quality architecture, security and working functionality over superficial visual completeness.
- At the beginning of every substantial implementation task, inspect AGENTS.md and the relevant PRODUCT_SPEC.md sections.
- At the end of every substantial task, update IMPLEMENTATION_STATUS.md.

After creating these project knowledge files, stop and give me:

1. the architecture you chose,
2. the files created,
3. any important assumptions,
4. the recommended first implementation phase.

---

You are a senior SaaS product architect, product designer, full-stack engineer, database architect, security engineer and payments engineer.

Build a production-quality, database-backed, responsive managed equipment-rental web application.

This must be a genuinely functional application, not a static website or visual prototype.

Use the requirements below as the authoritative product specification.

---

# 1. PRODUCT OBJECTIVE

Build a modern managed equipment-rental platform for a professional rental company.

The company rents:

1. Equipment owned directly by the rental business.
2. Equipment supplied by third-party businesses or individuals and managed by the rental business.

The customer must NOT perceive this as a peer-to-peer marketplace.

The customer experience must always feel like they are dealing with:

- one rental company
- one brand
- one checkout
- one booking system
- one support team
- one delivery/collection process
- one standard of equipment quality
- one inspection process

Third-party ownership is an internal operational detail.

Do NOT expose third-party owners publicly in V1.

Do NOT build public self-service equipment listing.

Do NOT build public owner profiles.

Do NOT build direct customer-to-owner messaging.

Architect the platform so it can later evolve through:

Managed rental company → private owner portal → professional lender marketplace → broader peer-to-peer marketplace

But V1 must remain a managed rental service.

---

# 2. INITIAL MARKET

Initial launch market:

Glasgow, Scotland, United Kingdom.

Use:

- GBP (£)
- UK English
- UK postcodes
- UK date formatting
- UK rental/hire terminology
- UK address structures

Do not hard-code Glasgow so deeply that another city cannot be added later.

Model service areas, locations and delivery zones independently.

Future expansion must support:

- Edinburgh
- Manchester
- Birmingham
- London
- other UK cities

---

# 3. TECHNOLOGY STACK

Use:

- Next.js
- App Router
- React
- TypeScript
- Tailwind CSS
- Supabase
- PostgreSQL
- Supabase Auth
- Supabase Storage
- Stripe
- Stripe Identity
- Vercel

Use current stable versions compatible with each other.

Use server-side application logic for all security-sensitive operations.

Use clean modular architecture.

Suggested structure:
```text
/app
  /(public)
  /(auth)
  /(account)
  /(admin)
  /api

/components
  /ui
  /equipment
  /booking
  /checkout
  /admin

/lib
  /supabase
  /stripe
  /auth
  /pricing
  /booking
  /availability
  /delivery
  /permissions
  /validation
  /audit

/services

/types

/database
  /migrations
  /seed
```

Do not create a monolithic application file.

---

# 4. PRODUCT POSITIONING

The product should visually feel like:

Turo/Airbnb-quality booking UX combined with the trust and professionalism of a serious plant and equipment hire company.

The user should immediately think:

"This is a professional modern rental company."

It must NOT resemble:

- Facebook Marketplace
- Gumtree
- a classifieds website
- a dated plant-hire catalogue
- an obvious P2P marketplace
- a generic SaaS landing-page template
- an unfinished startup prototype

---

# 5. DESIGN SYSTEM

Design mobile-first.

Use:

- large professional equipment photography
- generous whitespace
- strong contemporary typography
- excellent visual hierarchy
- premium but practical layouts
- one strong configurable brand accent colour
- neutral background colours
- clear card layouts
- subtle borders
- restrained shadows
- professional rounded corners
- highly visible prices
- highly visible availability
- clear primary calls to action
- accessible form controls
- strong contrast
- obvious loading and success states

Avoid:

- excessive gradients
- excessive animations
- glassmorphism
- neon/futuristic styling
- decorative 3D effects
- oversized marketing sections
- gimmicky interactions

The equipment and booking experience should remain the focus.

Create design tokens for:

- primary colour
- secondary colour
- background
- surface
- text
- muted text
- success
- warning
- destructive
- border
- radius
- shadow

Do not scatter random colours throughout components.

Make the brand name configurable.

If a temporary demo brand name is necessary, centralise it in configuration rather than hard-coding it throughout the application.

---

# 6. GLOBAL NAVIGATION

Public desktop navigation should contain approximately:

- Equipment
- Categories
- How It Works
- Delivery
- Help
- Sign In

Primary CTA:

"Browse Equipment"

or

"Hire Equipment"

When logged in, show:

- My Bookings
- Account
- Logout

Admin users should have access to:

"Admin"

but only when permitted.

Mobile navigation should use a clean menu/drawer.

Do not expose admin navigation to normal customers.

---

# 7. CORE CUSTOMER JOURNEY

The primary user journey is:

Search for equipment → view results → select equipment → inspect equipment details → choose hire dates → enter postcode → choose delivery or collection → receive server-calculated price → sign in/create account when required → complete ID verification if required → pay → receive confirmation → manage booking from dashboard → equipment delivered/collected → equipment returned → review equipment after completion

Users must be allowed to browse without an account.

Do not create a signup wall at the homepage.

---

# 8. HOMEPAGE

Create a premium homepage.

Hero headline:

"Hire equipment without the hassle."

Supporting copy similar to:

"Tools, plant and machinery available across Glasgow. Delivered to site or ready for collection."

The hero must include a functional equipment search interface with:

- equipment/category/keyword input
- postcode
- start date
- end date
- Search button

On mobile, make the search interface easy to use with full-width inputs.

Below the hero, show category cards such as:

- Plant & Machinery
- Power Tools
- Cleaning
- Landscaping
- Access Equipment
- Site Equipment

Below that, show real inventory from the database.

Each equipment card should show:

- hero image
- equipment name
- category
- daily rate
- optional weekly rate
- current availability indicator
- delivery available indicator
- rating if reviews exist
- service location when useful
- CTA

Examples:
```text
JCB 3CX Backhoe Loader
£195/day
Available tomorrow
Delivery available
View equipment
```
```text
Industrial Pressure Washer
£35/day
Available today
Collection or delivery
View equipment
```

Also include a concise trust section:

- professionally inspected equipment
- secure online payments
- verified renters where required
- delivery or collection
- professional support

Do not overwhelm the homepage with generic company copy.

Prioritise inventory.

---

# 9. SEARCH AND CATALOGUE

Create a real search/results page backed by the database.

Search criteria:

- keyword
- category
- postcode
- start date
- end date

Filters:

- category
- price range
- available for selected dates
- delivery available
- collection available

Design future filter architecture for:

- brand
- weight
- capacity
- machine dimensions
- power source
- fuel type
- working height
- equipment-specific specifications

Do not hard-code every possible specification into columns.

Support flexible equipment specifications through structured data where appropriate.

Equipment search result cards must show:

- image
- title
- category
- day rate
- availability
- delivery status
- rating
- CTA

Create:

- loading skeleton
- zero-results state
- error state
- reset filters control

Zero-results state should suggest:

- changing dates
- increasing location range
- viewing related categories

---

# 10. EQUIPMENT DETAIL PAGE

This is a critical conversion page.

Include:

## Gallery

- one large hero image
- thumbnail gallery
- mobile swipe gallery
- image modal/lightbox where sensible

## Equipment information

Show:

- equipment name
- category
- rating
- review count
- daily hire price
- optional weekly rate
- availability indicator

## Sticky booking panel

Desktop: sticky panel on right.

Mobile: clear sticky or easily accessible booking CTA.

Inputs:

- start date
- end date
- postcode
- delivery or collection

Display server-calculated price summary.

Example:
```text
JCB 3CX Backhoe Loader

£195/day

22 Sep – 24 Sep

2 days hire          £390
Delivery              £75
Service fee            £0
Deposit              £500

Total due             £965

[ Continue to booking ]
```

Do NOT calculate the authoritative price only in the browser.

## Equipment page sections

Include:

- About this equipment
- Technical specifications
- What's included
- Requirements
- Delivery & collection
- Security deposit
- ID verification
- Operator requirements
- Cancellation policy
- Reviews
- Related equipment

For expensive/risk-sensitive equipment show clear trust requirements such as:

- ID verification required
- refundable security deposit
- before and after inspection
- operator requirements may apply

Never reveal equipment owner identity.

---

# 11. EQUIPMENT SPECIFICATIONS

Allow equipment to store general fields plus flexible specifications.

Example specifications:
```text
Operating weight: 8,100 kg
Maximum digging depth: 5.97 m
Fuel type: Diesel
Transmission: Powershift
```

Other equipment may have completely different specifications:
```text
Working height: 8.2 m
Platform capacity: 230 kg
Power source: Electric
```

Use a flexible specification model.

Do not create dozens of nullable database columns for every machine type.

---

# 12. BOOKING FLOW

Use four customer-facing stages:

1. Dates
2. Delivery
3. Verify
4. Payment

Create a clear progress indicator.

Desktop should show a persistent booking summary.

Mobile should provide an accessible collapsible booking summary.

---

# 13. AUTHORITATIVE PRICING

Never trust client-calculated values.

Frontend submits only information such as:

- equipment ID
- start date
- end date
- postcode
- delivery method
- promo code if supported

Server calculates:

- rental duration
- daily or weekly pricing
- rental subtotal
- discount
- delivery fee
- service/platform fee
- tax if applicable/configured
- security deposit
- total due

Use integer minor currency units:

GBP pennies.

Example:

£195.00 = 19500

Avoid floating-point currency maths.

Create a reusable pricing service.

Pricing engine should be capable of future rules such as:

- daily rate
- weekly rate
- weekend rate
- promotional rate
- long-hire discount
- owner-specific commercial arrangement

Do not build unnecessary pricing complexity in the UI now.

---

# 14. PRICE SNAPSHOTS

When a booking is created, preserve the actual pricing values used.

Do not recalculate historical bookings using future settings.

A booking should store pricing snapshot values including:

- daily rate
- weekly rate if used
- rental subtotal
- delivery fee
- service fee
- discount
- security deposit
- commission basis points
- commission amount
- owner net
- total

Historical bookings must remain financially consistent even if rates later change.

---

# 15. COMMISSION MODEL

Do not hard-code commission.

Use hierarchy:

Global default commission → owner-specific commission → equipment-specific override

The most specific valid rule wins.

Store percentages in basis points.

Examples:
```text
100 bp = 1%
1500 bp = 15%
2000 bp = 20%
```

For third-party-owned equipment calculate:
```text
Gross equipment rental
- Platform commission
= Owner net earnings
```

Do not calculate commission against refundable deposits.

Make the commission base explicitly defined in code.

Store the commission rate used on each booking.

---

# 16. BOOKING STATES

Use explicit booking states:
```text
REQUESTED
APPROVED
PAYMENT_PENDING
CONFIRMED
CHECKED_OUT
RETURNED
COMPLETED

DECLINED
CANCELLED
DISPUTED
```

Define legal state transitions.

Examples:

REQUESTED → APPROVED

APPROVED → PAYMENT_PENDING

PAYMENT_PENDING → CONFIRMED

CONFIRMED → CHECKED_OUT

CHECKED_OUT → RETURNED

RETURNED → COMPLETED

Sensitive transitions must be validated server-side.

Store booking status history.

Each status-history record should include:

- booking ID
- previous status
- new status
- actor
- timestamp
- optional reason

---

# 17. AVAILABILITY SYSTEM

Availability depends on:

- operational equipment status
- accepted/reserved bookings
- confirmed bookings
- manual availability blocks
- maintenance
- servicing
- repair
- internal use

Create:

`availability_blocks`

with fields such as:

- id
- equipment_id
- start_at
- end_at
- type
- reason
- created_by
- created_at

Types can include:

- maintenance
- servicing
- repair
- internal_use
- unavailable
- manual_block

Availability must be checked server-side.

---

# 18. DOUBLE-BOOKING PROTECTION

This is critical.

Do not rely solely on frontend availability.

Before creating or confirming a booking:

1. Re-check availability server-side.
2. Re-check blocking reservations.
3. Execute booking creation transactionally.
4. Prevent overlapping active bookings for the same equipment.

Two customers attempting to reserve the same machine concurrently must not both succeed.

Implement database-level protection where practical.

Return a user-friendly error such as:

"Unfortunately this equipment was just booked for those dates. Please choose different dates."

Do not expose raw database errors.

---

# 19. AUTHENTICATION

Use Supabase Auth.

Support:

- email/password
- secure password reset
- email verification where appropriate

Architect for future magic link/social auth without requiring it now.

Users can browse anonymously.

Authentication becomes required for booking/account actions.

---

# 20. ROLES

Initial roles:

- customer
- staff
- admin
- super_admin

Architect to allow future:

- owner
- business_owner

Role descriptions:

## Customer

Can:

- browse
- book
- view own bookings
- manage own profile
- complete verification
- leave eligible reviews

Cannot:

- access other users
- access internal owners
- access admin
- modify financial totals

## Staff

Can access operational workflows such as:

- bookings
- equipment status
- deliveries
- inspections

Restrict high-risk finance/settings actions.

## Admin

Can manage:

- equipment
- bookings
- owners
- deliveries
- payouts
- pricing
- operational settings

## Super admin

Can additionally manage:

- roles
- critical settings
- permissions
- commission defaults
- sensitive administrative configuration

Do not trust a client-supplied role.

---

# 21. AUTHORIZATION

Permissions must exist at multiple layers:

1. UI-level visibility
2. server/API authorization
3. Supabase Row Level Security
4. database constraints

Hiding a button is not security.

Create reusable permission helpers.

Examples:
```text
requireAuthenticatedUser()
requireRole(["staff", "admin", "super_admin"])
requireAdmin()
requireSuperAdmin()
```

---

# 22. CUSTOMER ACCOUNT AREA

Create:

`/account`

Navigation:

- Overview
- My Bookings
- Verification
- Profile

Optional:

- Saved Addresses

Account overview should show:

- next upcoming rental
- active booking
- verification status
- recent bookings

Bookings should be grouped:

- Upcoming
- Active
- Past
- Cancelled

Each booking card/detail should display:

- booking reference
- equipment
- images
- dates
- booking status
- payment status
- deposit status
- delivery/collection method
- delivery window
- return/collection time
- total
- support action

Do not expose owner information.

---

# 23. SUPPORT

Do not implement customer-to-owner messaging.

All support communication goes through the rental company.

Provide:

- support/contact CTA
- booking reference visible
- optional support request form architecture

Do not create a fake live-chat experience unless actual messaging infrastructure exists.

---

# 24. ADMIN APPLICATION

Create a protected admin application.

Suggested route:

`/admin`

Admin design should feel closer to:

- Stripe
- Shopify
- Linear

than an old plant-hire system.

Sidebar:

- Overview
- Bookings
- Equipment
- Calendar
- Deliveries
- Customers
- Owners
- Payments
- Payouts
- Inspections
- Reviews
- Settings
- Audit Log

Responsive desktop layouts can be denser than customer pages.

Admin inspection pages must remain excellent on mobile.

---

# 25. ADMIN OVERVIEW

Show useful operational metrics.

Examples:
```text
Revenue today
£1,860

Equipment on hire
8

Deliveries today
4

Returns today
3
```

Also surface:

- bookings awaiting approval
- overdue rentals
- pending inspections
- equipment under maintenance
- failed payments
- payouts ready for review

Create an operations timeline/list:
```text
08:00
Deliver JCB 3CX
Newton Mearns
READY

10:30
Collect Industrial Pressure Washer
Giffnock
DRIVER ASSIGNED

14:00
Return inspection
1.5T Mini Excavator
AWAITING INSPECTION
```

Metrics must be derived from database data, not static numbers.

---

# 26. ADMIN BOOKING MANAGEMENT

Create bookings table/list.

Filters:

- booking status
- date
- equipment
- customer
- delivery method
- payment status

Search:

- booking reference
- customer name/email
- equipment

Booking detail page must show:

- booking reference
- customer
- equipment
- dates
- financial breakdown
- booking status
- payment status
- deposit status
- delivery record
- verification status
- inspection records
- owner payout information if third-party equipment
- status history
- admin actions

Sensitive actions must require server-side authorization.

Actions may include:

- approve
- decline
- cancel
- refund
- mark checked out
- mark returned
- complete
- open dispute

Record actions in audit logs.

---

# 27. ADMIN EQUIPMENT MANAGEMENT

Admins can:

- create
- edit
- archive
- upload photos
- configure specifications
- set pricing
- set deposit
- set verification requirement
- configure delivery eligibility
- assign owner
- set company-owned vs third-party
- override commission
- manage availability
- change operational status

Equipment statuses:
```text
AVAILABLE
RESERVED
ON_HIRE
MAINTENANCE
UNAVAILABLE
ARCHIVED
```

Equipment fields should include:

- id
- title
- slug
- category_id
- description
- daily_rate
- weekly_rate nullable
- security_deposit
- verification_required
- delivery_eligible
- collection_eligible
- ownership_type
- owner_id nullable
- commission_override_bps nullable
- operational_status
- base_location_id
- serial/reference information if needed
- created_at
- updated_at
- archived_at

Ownership types:
```text
COMPANY
THIRD_PARTY
```

Do not display ownership type publicly.

---

# 28. CATEGORIES

Create a categories table.

Fields:

- id
- name
- slug
- description
- image/icon reference
- active
- display_order

Seed categories:

- Plant & Machinery
- Power Tools
- Cleaning
- Landscaping
- Access Equipment
- Site Equipment

Do not hard-code categories exclusively into frontend arrays.

---

# 29. EQUIPMENT IMAGES

Create `equipment_images`.

Fields:

- id
- equipment_id
- storage_path
- alt_text
- display_order
- is_primary
- created_at

Public equipment photography may be publicly accessible through an appropriate storage policy.

Create admin upload/reorder/delete functionality.

---

# 30. ADMIN CALENDAR

Create a rental operations calendar.

Desktop:

Rows = equipment

Columns = dates

Display booking blocks spanning hire dates.

Use different visual treatments for:

- requested
- confirmed
- on hire
- maintenance/unavailable

Clicking a booking opens booking detail.

Clicking an empty period should allow authorised staff to create an availability block.

Calendar should support:

- week
- multi-week
- month-style planning where practical

Provide filters:

- category
- equipment status
- location

Do not build an excessively complex Gantt system.

Prioritise operational usefulness.

---

# 31. DELIVERY

Support:

- customer collection
- delivery

Customer enters UK postcode.

V1 architecture supports:

- fixed delivery zones
- postcode-based delivery rules
- manual quote fallback

Create tables or configuration sufficient for:

- service zones
- price
- location
- postcode prefix/pattern where appropriate

Future architecture should support:

- mileage pricing
- drivers
- vehicles
- delivery windows
- collection windows
- route management

A delivery record should include fields such as:

- id
- booking_id
- type
- status
- address
- postcode
- scheduled_start
- scheduled_end
- assigned_staff nullable
- assigned_vehicle nullable
- fee
- notes
- created_at
- updated_at

Delivery types:

- outbound_delivery
- return_collection

Delivery statuses:

- pending
- scheduled
- assigned
- en_route
- completed
- failed
- cancelled

---

# 32. ADMIN DELIVERY SCHEDULE

Create a delivery operations page.

Views:

- Today
- Upcoming
- Completed

Each card/row should show:

- booking
- equipment
- customer
- address
- postcode
- scheduled window
- delivery/collection
- status
- assigned staff

Admin can update delivery status.

Record important delivery changes in audit logs.

---

# 33. INSPECTION SYSTEM

Build a mobile-first inspection workflow.

Types:

- checkout inspection
- return inspection

Inspection fields:

- id
- booking_id
- equipment_id
- inspection_type
- staff_id
- fuel_level
- machine_hours
- condition_notes
- existing_damage_notes
- completed_at
- created_at

Before handover capture:

- front photo
- rear photo
- left side
- right side
- additional photos
- fuel level where relevant
- machine hours where relevant
- existing damage
- notes
- staff identity
- timestamp

Return inspection captures equivalent data.

Inspection photo table:

- id
- inspection_id
- storage_path
- type
- caption
- created_at

Store inspection evidence privately.

Use authenticated/signed access.

Do not expose private inspection media as permanently public URLs.

---

# 34. CUSTOMER HANDOVER

Create architecture for digital handover confirmation.

V1 can support:

- staff confirms handover
- timestamp recorded
- optional customer confirmation

Future architecture may support:

- QR code
- one-time handover PIN
- digital signature

Do not overbuild this if not necessary for initial workflow.

---

# 35. OWNERS

Create internal third-party owner management.

Owners can represent:

- company
- individual

Customer-facing pages must never expose owners.

Owner fields should include:

- id
- owner_type
- company_name
- contact_name
- email
- phone
- billing/contact address
- commission_bps nullable
- payout_reference
- active
- notes
- created_at
- updated_at

Do not store unnecessary banking credentials directly.

Design payment/payout details around Stripe or appropriate secure references later.

Owner detail page should show:

- contact information
- linked equipment
- gross rental revenue
- commission
- net earnings
- pending payouts
- completed payouts
- booking history

Do not build owner login in V1.

---

# 36. OWNER PAYOUTS

Create `owner_payouts`.

Owner payouts are relevant only to third-party-owned equipment.

Fields should include:

- id
- owner_id
- booking_id
- gross_rental_amount
- commission_bps
- commission_amount
- owner_net_amount
- status
- eligible_at
- released_at
- payment_reference
- notes
- created_at

Statuses:
```text
PENDING
NOT_ELIGIBLE
ELIGIBLE
APPROVED
PAID
HELD
CANCELLED
```

Payout must not become eligible merely because the renter paid.

Normally make payout eligible only when:

- booking is returned
- return inspection is complete
- no unresolved dispute exists

Admin reviews and releases payouts.

Record payout actions in audit logs.

Architect for future Stripe Connect integration.

Do not fake owner transfers if Stripe Connect is not configured.

---

# 37. STRIPE PAYMENTS

Use Stripe for payments.

Implement a proper server-side payment flow.

Never trust:

- client total
- client payment state
- success page redirect
- client deposit state

Use Stripe webhooks as the authoritative payment confirmation mechanism.

Implement:

- PaymentIntent creation where appropriate
- payment status tracking
- success handling
- failure handling
- refunds
- webhook signature verification
- webhook idempotency
- Stripe event ID storage

Create `webhook_events`.

Fields:

- provider
- event_id
- event_type
- processed_at
- status
- payload reference or limited safe metadata
- error if processing failed

Reject duplicate processing.

---

# 38. PAYMENT MODEL

Create `payments`.

Possible fields:

- id
- booking_id
- type
- provider
- provider_payment_id
- amount
- currency
- status
- created_at
- updated_at

Payment types can include:

- rental
- deposit
- additional_charge
- refund

Payment statuses:

- pending
- requires_action
- succeeded
- failed
- cancelled
- partially_refunded
- refunded

Do not collapse all financial movements into one field.

---

# 39. SECURITY DEPOSITS

Treat security deposits separately from rental revenue.

Do not call deposits "escrow."

Create a deposit domain model that can support:

- payment authorisation
- separate refundable payment
- release
- partial retention where legally/operationally appropriate
- refund
- expiry/failure

Do not pretend that an authorisation can be held indefinitely.

Use actual Stripe capabilities.

If the chosen deposit strategy cannot cover the required rental period using an authorisation, architect a supported alternative such as a separate refundable payment.

Make deposit strategy configurable rather than fake.

Show customer deposit status such as:

- not required
- pending
- authorised
- captured
- released
- refunded
- partially retained

Any retention/refund action must be auditable.

---

# 40. STRIPE IDENTITY

Use Stripe Identity.

Do not upload/store passport or driving licence images directly in the application unless absolutely required.

Store application references such as:

- verification session ID
- verification status
- verified timestamp

Verification statuses:

- not_started
- pending
- verified
- failed
- requires_input

Verification requirement must be configurable by equipment.

Potential future configuration can include risk/value thresholds.

For V1, equipment can have:

`verification_required: boolean`

Never fake successful verification.

If Stripe Identity keys are unavailable, create a clearly labelled integration state and development mode rather than auto-marking users as verified.

---

# 41. VERIFICATION FLOW

During booking:

If equipment does not require verification:

Proceed to payment.

If verification is required and customer is already verified:

Proceed to payment.

If verification is required and customer is not verified:

1. Create Stripe Identity session server-side.
2. Redirect/start verification.
3. Receive authoritative status.
4. Update verification record securely.
5. Continue booking only if requirement is satisfied.

Display clear status messaging.

---

# 42. REVIEWS

Allow reviews only after completed bookings.

Fields:

- id
- booking_id
- equipment_id
- customer_id
- rating
- body
- publication_status
- created_at

Only one review per eligible completed booking.

Rating range:

1–5.

Do not allow arbitrary users to review equipment.

Admin can:

- review
- publish
- hide where moderation is necessary

Never fabricate ratings for real inventory.

Seed reviews may clearly be demo data.

---

# 43. ADMIN CUSTOMER MANAGEMENT

Create a customer directory.

Admin can search customers.

Customer admin detail should show:

- name
- email
- phone
- verification status
- booking history
- active rentals
- total spend
- disputes
- account status

Account statuses can include:

- active
- restricted
- suspended

Sensitive actions require appropriate role permissions.

Record suspensions in audit logs.

---

# 44. AUDIT LOG

Create `audit_logs`.

Record important administrative actions including:

- booking status change
- approval
- cancellation
- refund
- deposit action
- payout release
- commission change
- equipment creation
- equipment edit
- equipment archive
- price change
- delivery change
- availability override
- user suspension
- permission change
- critical settings change

Audit record should include:

- actor ID
- action
- resource type
- resource ID
- timestamp
- previous data where appropriate
- new data where appropriate
- safe metadata

Audit logs should not expose secrets.

Admin audit log page should support:

- date filter
- actor
- resource type
- action

Only authorised admin/super admin users can view sensitive audit information.

---

# 45. PLATFORM SETTINGS

Create a database-backed configuration system.

Examples:

- default commission basis points
- default currency
- default timezone
- support email
- brand name
- default service region
- booking minimum duration
- booking maximum duration if configured
- cancellation rules
- deposit policy
- delivery configuration

Do not bury critical business configuration throughout the source code.

Protect settings editing appropriately.

---

# 46. DATABASE SCHEMA

Design relational tables around at least:
```text
profiles
owners
locations
categories
equipment
equipment_images
equipment_specifications
availability_blocks

bookings
booking_status_history

payments
deposit_transactions

verifications

deliveries

inspections
inspection_photos

owner_payouts

reviews

platform_settings

audit_logs

webhook_events
```

Add supporting tables as required.

Use:

- foreign keys
- unique constraints
- indexes
- check constraints
- not-null constraints where appropriate
- timestamps
- consistent IDs

Use UUIDs where sensible.

---

# 47. PROFILE MODEL

Create profile linked to Supabase Auth.

Fields can include:

- id matching auth user ID
- first_name
- last_name
- phone
- role
- account_status
- created_at
- updated_at

Do not allow customers to update their role.

Role modifications must be privileged.

---

# 48. BOOKING MODEL

Booking should include sufficient data for historical integrity.

Fields should include:

- id
- reference
- equipment_id
- customer_id
- start_date
- end_date
- status
- fulfilment_method
- service address/postcode when delivery
- rental_subtotal
- delivery_fee
- service_fee
- discount_amount
- deposit_amount
- total_amount
- currency
- ownership_type_snapshot
- owner_id_snapshot nullable
- commission_bps_snapshot nullable
- commission_amount_snapshot
- owner_net_snapshot
- pricing_snapshot JSON where helpful
- created_at
- updated_at

Generate a customer-friendly booking reference.

Example:

`RNT-26-10482`

Do not expose sequential database IDs.

---

# 49. ROW LEVEL SECURITY

Enable Supabase RLS for sensitive tables.

Customers should only be able to access:

- their own profile
- their own bookings
- their own verification metadata where appropriate
- their own legitimate reviews

Public users may read only:

- active categories
- publicly listed available equipment
- public equipment images
- published reviews

Owners remain internal.

Inspection evidence remains private.

Payments remain private.

Payouts remain private.

Admin/server operations should use correctly privileged server logic.

Never expose Supabase service-role credentials to the browser.

---

# 50. INPUT VALIDATION

Use robust schema validation.

Prefer a library such as Zod.

Validate:

- IDs
- dates
- postcode
- prices when entered by admins
- basis points
- ratings
- strings
- enum states
- file uploads
- pagination parameters

Reject invalid state transitions.

Do not rely exclusively on HTML form validation.

---

# 51. RATE LIMITING

Rate limit security-sensitive actions.

At minimum:

- login/auth-related actions
- booking creation
- pricing/availability abuse if necessary
- payment creation
- identity verification creation
- sensitive admin mutations

Use a production-compatible distributed rate-limit system.

Do not depend solely on an in-memory Map in Vercel production.

Return graceful rate-limit responses.

---

# 52. ERROR HANDLING

Implement:

- user-friendly validation messages
- not-found states
- unauthorised states
- forbidden states
- payment errors
- booking-conflict errors
- Stripe integration errors
- upload errors

Do not expose:

- SQL messages
- server stack traces
- secret keys
- raw Stripe errors unnecessarily

Log server-side diagnostics safely.

---

# 53. STORAGE

Use Supabase Storage.

Separate:

## Public equipment photography

Used on customer-facing catalogue.

## Private inspection evidence

Requires authenticated signed access.

Potential buckets:
```text
equipment-public
inspection-private
equipment-private
```

Apply appropriate policies.

File uploads should validate:

- type
- size
- ownership/permission

---

# 54. SEO

Public catalogue pages should be SEO-friendly.

Use meaningful URLs:
```text
/equipment
/equipment/jcb-3cx-backhoe-loader
/category/plant-machinery
```

Implement:

- metadata
- titles
- descriptions
- canonical URLs
- semantic headings
- accessible alt text

Architect future location SEO without generating spam pages.

Potential later structure:
```text
/hire/pressure-washer/glasgow
```

Do not create thousands of empty programmatic pages in V1.

---

# 55. RESPONSIVE BEHAVIOUR

Customer experience must be excellent on mobile.

Prioritise:

- search
- date selection
- catalogue
- galleries
- postcode entry
- checkout
- booking management

Mobile equipment pages should use a prominent booking CTA.

Admin inspection workflows must be designed for phone use.

Admin calendar and data tables can optimise for desktop with mobile fallback.

No horizontal overflow on normal customer pages.

---

# 56. ACCESSIBILITY

Use accessible:

- labels
- buttons
- form fields
- keyboard navigation
- focus states
- colour contrast
- semantic HTML
- modal focus handling

Images require meaningful alt text.

Do not communicate status through colour alone.

---

# 57. LOADING STATES

Every important data-backed screen needs appropriate loading UI.

Examples:

- catalogue skeletons
- equipment page skeleton
- dashboard skeleton
- booking submission pending state
- payment pending
- verification pending
- admin table loading

Prevent duplicate form submissions.

---

# 58. EMPTY STATES

Build thoughtful empty states.

Examples:

No bookings:

"You don't have any rentals yet."

CTA:

"Browse equipment"

No equipment found:

"No equipment matches those dates and filters."

Admin no deliveries:

"No deliveries scheduled for today."

Do not leave blank screens.

---

# 59. SEED DATA

Populate realistic demo data.

Clearly mark seed/demo content.

Suggested inventory:

- JCB 3CX Backhoe Loader
- 1.5T Mini Excavator
- 3T Mini Excavator
- Diesel Plate Compactor
- Industrial Pressure Washer
- Petrol Generator
- Concrete Mixer
- Scaffold Tower
- Floor Sander
- SDS Rotary Hammer
- Stihl Cut-Off Saw
- Commercial Carpet Cleaner

Use realistic-looking sample rates in GBP.

Example:
```text
JCB 3CX Backhoe Loader
£195/day

1.5T Mini Excavator
£115/day

Industrial Pressure Washer
£35/day

Commercial Carpet Cleaner
£28/day
```

These are demo values only.

Add useful specifications and high-quality placeholder/demo imagery where legally appropriate.

Do not use lorem ipsum.

---

# 60. DEMO OWNER DATA

Create at least:

1. Company-owned equipment.
2. One third-party owner.

Example third-party owner:

`ABC Groundworks Ltd`

Link several demo assets internally.

Do not reveal ABC Groundworks on public equipment pages.

Use an example owner commission such as 15% only as seed data.

Do not hard-code that value into business logic.

---

# 61. SECURITY PRINCIPLES

Apply production-oriented security.

Use:

- server-side authorization
- RLS
- least privilege
- secure environment variables
- protected admin routes
- database constraints
- webhook signature validation
- input validation
- rate limiting
- signed private media access
- safe error handling
- audit logging

Never trust client values for:

- role
- booking status
- payment state
- verification state
- commission
- rental total
- owner payout
- deposit state

---

# 62. ENVIRONMENT VARIABLES

Use environment variables for integrations.

Examples:
```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

STRIPE_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET

NEXT_PUBLIC_APP_URL
```

Never expose server-only keys to the browser.

Provide an `.env.example`.

Never commit real secrets.

---

# 63. EXTERNAL INTEGRATION FALLBACK RULE

If an external service cannot be fully configured automatically:

Do NOT pretend it works.

Instead:

1. Build the correct service abstraction.
2. Build database fields.
3. Build API routes/server actions.
4. Build UI states.
5. Add environment-variable integration points.
6. Clearly mark setup requirements.
7. Fail safely.

Never fake:

- successful payment
- successful identity verification
- successful refund
- owner payout
- deposit authorisation

---

# 64. ADMIN PAYMENTS

Create payment operations page.

Allow authorised admins to inspect:

- booking
- customer
- payment amount
- payment type
- Stripe reference
- status
- created date
- refund state

Do not expose sensitive card information.

Refund action must:

- require appropriate role
- execute server-side
- update state from Stripe
- generate audit entry

---

# 65. ADMIN PAYOUTS

Create payout list.

Filters:

- pending
- eligible
- held
- paid

Each payout should display:

- owner
- booking
- equipment
- gross rental
- commission
- owner net
- eligibility
- status

Admin can release eligible payouts if integration is configured.

If automated transfer is not configured, support a manual payment-record workflow:

"Mark paid"

with:

- payment reference
- payment date
- note

Audit it.

---

# 66. DISPUTES

Do not build a huge dispute-resolution platform.

However, the booking model must support `DISPUTED`.

Admin should be able to:

- mark booking disputed
- record notes
- hold owner payout
- inspect before/after evidence
- resolve dispute
- return booking to appropriate final state

Create enough structure for operational use.

---

# 67. REVIEWS DISPLAY

Equipment page should show:

- average rating
- review count
- individual published reviews

If there are no reviews:

Do not invent a rating.

Display:

"New to our fleet"

or equivalent.

---

# 68. CANCELLATIONS

Architect cancellation logic cleanly.

Do not hard-code financial cancellation policy deep in random components.

Create configurable rules or service abstraction.

In V1, admin may process some cancellations manually.

Record:

- cancelled_at
- cancelled_by
- cancellation_reason
- refund amount if applicable

---

# 69. OPERATIONAL MAINTENANCE

Equipment placed into `MAINTENANCE` must not be bookable.

Admins should be able to create maintenance blocks.

Existing future bookings affected by maintenance should be clearly flagged.

Do not silently cancel customer bookings.

---

# 70. BOOKING AVAILABILITY BUFFER

Architect optional future support for turnaround buffers.

Example:

Machine returns Monday 17:00 but should not be rentable until Tuesday due to inspection/cleaning.

Do not necessarily expose this in V1 UI, but structure availability logic so buffers can be added.

---

# 71. PERFORMANCE

Optimise catalogue performance.

Use:

- pagination or sensible result limits
- responsive images
- lazy loading
- server rendering where useful
- efficient SQL indexes
- minimal unnecessary client components

Avoid fetching entire tables to filter them in the browser.

Search/filter should query the backend appropriately.

---

# 72. DATABASE INDEXES

Create indexes for common operations such as:

- equipment slug
- equipment category
- equipment status
- booking equipment/date
- booking customer
- booking status
- owner equipment
- delivery schedule
- verification customer
- review equipment
- payout owner/status

Use database query patterns responsibly.

---

# 73. FUTURE MARKETPLACE COMPATIBILITY

Design V1 so future owner portal work does not require rewriting core rental architecture.

Future possible functionality:

- owner accounts
- owner onboarding
- owner verification
- self-service listings
- owner availability control
- Stripe Connect
- automated payouts
- owner dashboard
- B2B inventory
- business accounts
- multiple cities
- peer-to-peer inventory

Do not expose these features in V1.

Ensure equipment already has explicit ownership architecture.

---

# 74. WHAT NOT TO BUILD IN V1

Do NOT build:

- native iOS app
- native Android app
- public peer-to-peer listings
- customer-to-owner messaging
- public owner profiles
- owner self-service onboarding
- automated marketplace bidding
- AI listing generation
- AI pricing
- promoted listings
- social feeds
- complicated loyalty system
- real-time fleet GPS tracking
- overly sophisticated route optimisation
- dozens of speculative features

Focus on real rental operations.

---

# 75. CORE PAGES

At minimum build functional versions of:

## Public
```text
/
 /equipment
 /equipment/[slug]
 /category/[slug]
 /how-it-works
 /delivery
 /help
```

## Auth
```text
/login
/signup
/forgot-password
```

## Customer
```text
/account
/account/bookings
/account/bookings/[id]
/account/verification
/account/profile
```

## Booking/checkout

Create appropriate routes/components for:
```text
booking dates
delivery
verification
payment
confirmation
```

## Admin
```text
/admin
/admin/bookings
/admin/bookings/[id]
/admin/equipment
/admin/equipment/new
/admin/equipment/[id]
/admin/calendar
/admin/deliveries
/admin/customers
/admin/customers/[id]
/admin/owners
/admin/owners/[id]
/admin/payments
/admin/payouts
/admin/inspections
/admin/reviews
/admin/settings
/admin/audit
```

---

# 76. COMPONENT REUSE

Build reusable components.

Examples:
```text
EquipmentCard
EquipmentGallery
AvailabilityBadge
PriceDisplay
DateRangePicker
PostcodeInput
DeliverySelector
BookingSummary
BookingStatusBadge
PaymentStatusBadge
VerificationStatusBadge
AdminStatCard
AdminDataTable
InspectionUploader
AuditLogRow
EmptyState
LoadingSkeleton
ConfirmDialog
```

Do not duplicate near-identical markup across multiple pages.

---

# 77. FORMS

Use proper forms.

Admin equipment form should validate:

- title
- category
- rates
- deposit
- ownership
- owner if third-party
- delivery
- verification
- specifications

Customer booking form should validate:

- valid dates
- end after start
- valid equipment
- postcode when delivery required

Show inline validation.

Disable submit appropriately while processing.

---

# 78. ADMIN SAFETY

Sensitive admin actions should use confirmation dialogs.

Examples:

- cancelling confirmed booking
- issuing refund
- marking payout paid
- archiving equipment
- suspending customer

Destructive actions need explicit wording.

Do not use ambiguous "OK" dialogs.

---

# 79. DATE/TIME HANDLING

Store timestamps appropriately.

Use a consistent application timezone strategy.

Initial operational timezone:

Europe/London.

Display user-facing dates in UK format.

Be DST-aware.

Hire dates should be modeled consistently.

Do not perform fragile timezone calculations solely in browser-local time.

---

# 80. CUSTOMER TRUST

Surface trust throughout the experience.

Use concise messages such as:

- Secure online payment
- Equipment inspected before hire
- Professional support
- ID verification on selected equipment
- Transparent pricing
- Delivery available

Do not overpromise insurance or damage protection unless a real policy exists.

Do not claim all equipment is insured unless configured and legally true.

---

# 81. LEGAL/POLICY PLACEHOLDERS

Create page structure or footer links for:

- Terms
- Privacy
- Cancellation policy
- Rental terms
- Cookies if needed

Do not fabricate legal assurances.

Clearly indicate where business-specific legal content must be supplied.

---

# 82. ANALYTICS READINESS

Architect events for future analytics.

Useful events:

- search
- view_equipment
- select_dates
- delivery_quote
- begin_booking
- begin_verification
- verification_complete
- begin_payment
- booking_complete

Do not block build completion on a third-party analytics provider.

Create an abstraction or clearly marked integration point.

---

# 83. ADMIN SETTINGS UX

Settings sections may include:

- General
- Branding
- Pricing
- Commission
- Delivery
- Booking
- Payments
- Verification

Only super admins should change critical financial/security settings where appropriate.

---

# 84. TESTING

Add meaningful testing where environment supports it.

Prioritise:

- pricing calculations
- commission resolution
- booking state transitions
- overlapping availability
- authorization
- payout eligibility

Also verify:

- customer cannot access another customer's booking
- customer cannot access admin
- staff cannot change super-admin-only settings
- client-supplied price cannot alter booking total

---

# 85. BOOKING ACCEPTANCE EXAMPLE

For demo purposes, support the full functional flow:

Customer searches:

"JCB"

Selects:

JCB 3CX Backhoe Loader

Chooses:

22 Sep – 24 Sep

Chooses:

Delivery

Enters valid Glasgow postcode.

Server checks:

- equipment exists
- equipment active
- dates valid
- dates available
- delivery allowed
- delivery zone/rule

Server calculates pricing.

Customer creates/logs into account.

If required:

Stripe Identity verification.

Customer enters payment.

Stripe confirms payment through webhook.

Booking changes to:

CONFIRMED.

Admin dashboard immediately reflects booking.

Equipment calendar blocks dates.

Delivery record is visible.

Customer sees booking in account.

This path should function with real database records and integration architecture.

---

# 86. ADMIN THIRD-PARTY EQUIPMENT EXAMPLE

Create demo third-party equipment.

Example:

Owner:

ABC Groundworks Ltd

Equipment:

3T Mini Excavator

Rate:

£150/day

Owner commission:

15% platform commission

Customer rents for:

3 days.

Rental subtotal:

£450.

Platform commission:

£67.50.

Owner net:

£382.50.

Delivery and refundable deposit should not automatically become commissionable owner rental income.

Booking stores the 15% rate used.

If the owner commission later changes to 20%, this historical booking remains 15%.

After return inspection completes with no dispute:

Owner payout becomes eligible.

Admin can record/release payout.

---

# 87. UX POLISH

The finished application should feel coherent.

Use:

- consistent button hierarchy
- consistent spacing
- consistent card treatment
- consistent status badges
- clean tables
- empty states
- mobile drawer/sheets where appropriate
- confirmation toasts/messages
- polished forms

Do not make every page look visually unrelated.

---

# 88. DATABASE-BACKED REQUIREMENT

Do not simulate functionality with giant hard-coded frontend arrays where database records should exist.

Seed demo data into the database.

Equipment pages should retrieve database records.

Bookings should create database records.

Reviews should query database records.

Owner payouts should derive from booking records.

Admin stats should derive from stored data.

---

# 89. NO DEAD BUTTONS

Every primary CTA must:

- perform an action
- navigate somewhere functional
- or clearly be disabled with explanation

No decorative buttons pretending to work.

No:

"Book Now"

button that does nothing.

No:

"Verify"

button with no integration path.

No:

"Refund"

button that only changes local UI.

---

# 90. DEVELOPMENT PRIORITY

If implementation scope must be prioritised, prioritise in this exact order:

1. Authentication/security foundation
2. Database/domain model
3. Equipment catalogue
4. Equipment detail
5. Search/filter
6. Availability
7. Booking creation
8. Server-side pricing
9. Customer booking area
10. Admin equipment management
11. Admin bookings
12. Calendar
13. Stripe payment architecture
14. Stripe Identity architecture
15. Delivery
16. Inspection
17. Owner records
18. Commission engine
19. Payout tracking
20. Audit logs
21. Reviews
22. Secondary marketing content

Do not sacrifice core working rental functionality for decorative pages.

---

# 91. ACCEPTANCE CRITERIA

Do not consider the build complete unless the following are true.

## Public application

- Homepage loads correctly.
- Search works.
- Categories work.
- Equipment comes from database.
- Equipment detail pages work.
- Images load correctly.
- Dates can be selected.
- Availability is checked.
- Delivery/collection can be chosen.
- Price is calculated server-side.
- Customer can create account.
- Customer can log in.
- Customer can start booking.
- Customer cannot manipulate authoritative price.

## Booking

- Booking records persist.
- Booking states exist.
- Status transitions are controlled.
- Double booking is protected.
- Booking history is stored.
- Customer sees only own bookings.

## Payments

- Stripe architecture is server-side.
- Webhook signature verification exists.
- Event idempotency exists.
- Success redirects are not trusted as payment confirmation.
- Refund architecture exists.
- Deposits are modeled separately.

## Verification

- Stripe Identity integration structure exists.
- Verification is configurable by equipment.
- Verification state persists.
- Verification is not faked.

## Equipment

- Admin can create equipment.
- Admin can edit equipment.
- Admin can upload equipment photos.
- Admin can change price.
- Admin can change status.
- Admin can block dates.
- Admin can assign owner.
- Third-party owner is hidden publicly.

## Admin

- Admin routes are protected.
- Dashboard uses database data.
- Booking management works.
- Equipment management works.
- Calendar exists.
- Delivery management exists.
- Owner management exists.
- Payout management exists.
- Audit page exists.

## Owners

- Third-party owner records work.
- Equipment can belong to an owner.
- Commission is configurable.
- Owner net is calculated.
- Historical commission snapshots remain immutable.
- Payout eligibility follows return/inspection/dispute rules.

## Inspections

- Checkout inspection can be created.
- Return inspection can be created.
- Photos can be uploaded.
- Photos are private.
- Inspection evidence remains tied to booking.

## Security

- RLS is configured.
- Server-side role checks exist.
- Service credentials are not exposed.
- Client cannot set role.
- Client cannot set payment success.
- Client cannot set commission.
- Client cannot set arbitrary booking state.
- Sensitive admin operations are protected.
- Rate-limit architecture exists.
- Audit logs exist.

## Responsive UX

- Homepage works on phone.
- Search works on phone.
- Equipment detail works on phone.
- Checkout works on phone.
- Customer account works on phone.
- Inspection workflow works on phone.
- Admin remains usable responsively.

---

# 92. STRICT COMPLETION CHECKLIST

Before saying the application is complete, verify all of the following:

### Architecture

[ ] Next.js + TypeScript application is organised cleanly
[ ] Supabase is connected correctly
[ ] PostgreSQL schema exists through migrations
[ ] Authentication works
[ ] Roles work
[ ] RLS policies exist
[ ] environment example file exists

### Customer product

[ ] homepage is polished
[ ] database-backed catalogue works
[ ] search works
[ ] filters work
[ ] equipment pages work
[ ] gallery works
[ ] date selection works
[ ] availability works
[ ] postcode flow works
[ ] delivery/collection works
[ ] server-side pricing works
[ ] booking creation works
[ ] account area works

### Rental operations

[ ] booking state machine works
[ ] overlapping booking protection works
[ ] admin booking management works
[ ] equipment status works
[ ] maintenance blocks work
[ ] operational calendar works
[ ] delivery records work
[ ] inspection workflow works

### Payments

[ ] Stripe service exists
[ ] PaymentIntent/payment flow exists where configured
[ ] payment records persist
[ ] webhook signatures are checked
[ ] duplicate webhooks are prevented
[ ] refund flow architecture exists
[ ] deposits are separate from rental revenue
[ ] no fake payment success state exists

### Identity

[ ] Stripe Identity service exists
[ ] verification records persist
[ ] equipment can require verification
[ ] successful verification cannot be set by the browser
[ ] no fake identity success exists

### Owners

[ ] owners table exists
[ ] owners can be managed internally
[ ] equipment can reference owners
[ ] customer never sees underlying owner
[ ] commissions are configurable
[ ] commissions use basis points
[ ] booking commission snapshot exists
[ ] owner payout records exist
[ ] payout eligibility rules work

### Security

[ ] client prices are not trusted
[ ] client commissions are not trusted
[ ] client roles are not trusted
[ ] client payment states are not trusted
[ ] client verification states are not trusted
[ ] private inspection media is protected
[ ] rate limiting exists for sensitive operations
[ ] validation exists on server
[ ] audit logs capture important admin actions

### Quality

[ ] no broken navigation
[ ] no dead primary buttons
[ ] no fake integrations
[ ] no lorem ipsum
[ ] no hard-coded inventory replacing the database
[ ] loading states exist
[ ] empty states exist
[ ] error states exist
[ ] unauthorised states exist
[ ] mobile layouts work
[ ] forms validate correctly
[ ] accessibility fundamentals are present

### Future readiness

[ ] ownership model supports third-party equipment
[ ] architecture can later support owner accounts
[ ] architecture can later support Stripe Connect
[ ] service locations are not permanently tied to Glasgow
[ ] architecture can support multiple cities
[ ] future marketplace functionality is NOT exposed publicly in V1

Build this as a credible modern rental operation that could actually be deployed and used by customers and staff.

Prioritise functionality, security, database integrity and operational usability over decorative complexity.

Do not stop at a homepage prototype.

Deliver a working managed equipment-rental application.
