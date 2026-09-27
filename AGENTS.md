# Triangle Healthy Kitchen Agent Instructions

This file is the permanent working agreement for Codex and future agents on this project.

## First Rule

Before creating or modifying any UI page, read:

1. `DESIGN_SYSTEM.md`
2. `AGENTS.md`
3. Existing files in `src/design-system`
4. Existing reusable code in `index.html`, `styles.css`, and `app.js`

Do not start UI edits until those files have been checked.

## Project Type

This project is currently a plain HTML/CSS/JavaScript website.

Main files:

- `index.html`
- `styles.css`
- `app.js`
- `en.json`
- `ar.json`

Do not convert this app to React, Vue, Angular, or another framework unless the user explicitly asks.

## Design System Discipline

Every future UI task must follow `DESIGN_SYSTEM.md`.

Do not create new:

- Colors
- Spacing
- Typography
- Icons
- Buttons
- Cards
- Form styles
- Table styles
- Badge styles
- Shadows
- Radius values
- Navigation styles
- Modal styles
- Toast styles
- Animations
- Breakpoints

unless the design system is updated first.

## Reuse Before Creating

Before adding page-specific CSS or JS, check whether an existing pattern already exists.

Prefer:

1. Existing component pattern
2. Existing utility/class
3. Design-system component in `src/design-system/components`
4. New shared component documented in the design system
5. Page-specific code only when truly required

Do not duplicate component code.

## Current Shared UI Direction

Use a premium enterprise dashboard style:

- Dark green horizontal navigation
- White surfaces
- Soft borders
- Soft shadows
- Rounded 12-16px controls/cards
- Professional icons
- Clear status badges
- Responsive tables
- Clean typography
- Smooth hover and page transitions

## Navigation Standard

Authenticated top navigation must include:

- Dashboard
- Customers
- Customer Review
- Nutrition Plans
- Subscriptions
- Deliveries
- Payments
- Reports
- Team
- Settings

Right side:

- Notification bell
- User avatar
- User name
- User role
- Profile dropdown

Exactly one item must be active.

## Customer Page Standard

The Customers page must follow the design system and include:

- Premium page header
- KPI cards
- Search
- Filters
- Export button
- Add customer button
- Responsive table
- Status badges
- Category badges
- Customer actions
- Pagination
- English LTR and Arabic RTL compatibility

Do not create another unrelated customer page layout.

## Data Honesty

Dashboard and report values must come from real app data or show `0`.

Do not present fake values as real. Demo/sample data must be clearly marked as demo.

## Authentication Visibility

When logged out:

- Show login/register only.
- Hide the app shell/dashboard.

When logged in:

- Hide login/register.
- Show the correct dashboard/portal for the role.

Do not allow login and dashboard to appear together.

## RTL and Arabic

For Arabic:

- Use RTL direction.
- Align text to the right.
- Preserve readable numbers and operational data.
- Ensure buttons, icons, tables, and forms do not overlap.

Do not hard-code English text inside customer-facing components when translation support exists.

## Responsive QA

Before finishing UI changes, check:

- Desktop/laptop
- Tablet
- Mobile
- English LTR
- Arabic RTL
- Console errors
- No accidental horizontal overflow
- No text clipping
- No broken active navigation

## File Editing Rules

- Prefer `apply_patch` for manual file edits.
- Do not overwrite unrelated user work.
- Do not delete customer data.
- Do not remove working features while improving UI.
- Keep edits scoped to the requested change.
- If CSS conflict exists, prefer refactoring toward shared design-system classes instead of adding more one-off overrides.

## Server And Browser Checks

The local preview is:

`http://127.0.0.1:4173/`

If it does not open, start the server using the bundled Node runtime if normal `node` is unavailable.

After CSS or JS changes:

- Bump the query/cache version in `index.html` where needed.
- Refresh with a new `?fresh=` URL.
- Check console logs.

## Future Backend Warning

This local app is still a prototype. Real production features must eventually use backend permissions and persistent database records for:

- Roles
- Payments
- Delivery credits
- Customer imports
- Production report freezes
- Audit logs
- Archive/deactivate flows

Do not pretend client-side demo logic is production security.

