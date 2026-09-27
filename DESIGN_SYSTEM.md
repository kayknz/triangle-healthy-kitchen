# Triangle Healthy Kitchen Global Design System

This file is the permanent UI standard for the Triangle Healthy Kitchen system.
Every future UI change must read and follow this file before creating or modifying any page.

## Purpose

The application must feel like one premium enterprise product across:

- CEO dashboard
- Admin dashboard
- Customers
- Customer Review
- Nutrition Plans
- Subscriptions
- Deliveries
- Payments
- Reports
- Team
- Settings
- Customer Registration
- Customer Portal
- Kitchen dashboard
- Driver dashboard

The style target is modern SaaS quality: clean, calm, premium, fast, responsive, and professional.

## Platform Support

All pages must work on:

- Desktop and laptop
- Tablet
- Mobile phone
- English LTR
- Arabic RTL

Use responsive layouts and logical spacing where possible. Never create desktop-only UI.

## Non-Negotiable Rules

1. Before changing UI, check this file, `AGENTS.md`, and `src/design-system`.
2. Do not create a new color, spacing value, type style, radius, shadow, animation, button, form, card, table, badge, modal, toast, or navigation pattern unless it is added here first.
3. Reuse existing design-system patterns before adding page-specific CSS.
4. Do not duplicate component code when an existing component pattern can be reused.
5. Do not add one-off page styles that conflict with the global system.
6. Every page must be checked in English LTR and Arabic RTL when language support is active.
7. Every page must be usable on mobile, tablet, laptop, and desktop.
8. Use the Triangle Healthy Kitchen brand style, not generic template styling.

## Brand Identity

The product should feel healthy, precise, premium, and operationally reliable.

Brand signals:

- Dark green navigation
- White cards
- Soft green accents
- Clean table-heavy enterprise interface
- Clear status badges
- Rounded but not cartoonish controls
- Professional icon system
- Calm spacing and readable typography

## Design Tokens

### Colors

Use these colors only unless this file is updated.

| Token | Value | Usage |
| --- | --- | --- |
| `--thk-green-950` | `#0F5D4E` | Main dark navigation and primary login button |
| `--thk-portal-bg-deep` | `#0F4C45` | Customer portal soft top background atmosphere |
| `--thk-green-900` | `#0F5D4E` | Navigation gradient |
| `--thk-green-800` | `#0F5D4E` | Brand text and dark accents |
| `--thk-green-700` | `#1B7A63` | Active navigation start |
| `--thk-green-600` | `#1B7A63` | Primary action |
| `--thk-green-500` | `#1B7A63` | Success and positive action |
| `--thk-green-100` | `#DFF5EC` | Soft icon background and accent green |
| `--thk-green-50` | `#F3FBF7` | Soft surfaces |
| `--thk-white` | `#ffffff` | Cards and inputs |
| `--thk-bg` | `#F8FAFC` | App background |
| `--thk-bg-soft` | `#F8FAFC` | Login and portal background |
| `--thk-border` | `#E5E7EB` | Card and form borders |
| `--thk-border-strong` | `#CBD5E1` | Focus and table borders |
| `--thk-text` | `#111827` | Main text |
| `--thk-muted` | `#6B7280` | Secondary text |
| `--thk-success` | `#087a42` | Success badges |
| `--thk-warning` | `#f59a10` | Warning badges |
| `--thk-danger` | `#dc2626` | Error/reject actions |
| `--thk-info` | `#1f78d1` | Info badges |
| `--thk-purple` | `#7c4de0` | Secondary category/status |

Do not use dominant purple, beige, brown, dark blue, or one-note palettes.

### Typography

Use a modern system font stack:

```css
font-family: Inter, "Segoe UI", Arial, sans-serif;
```

Arabic fallback:

```css
font-family: Inter, "Segoe UI", Tahoma, Arial, sans-serif;
```

Rules:

- Do not scale font size with viewport width.
- Letter spacing must be `0` except for brand text and uppercase micro labels.
- Use bold text for operational clarity, not decoration.
- Keep table text compact and readable.
- Reserve hero-scale text for login/registration onboarding, not dashboard cards.

Type scale:

| Token | Size | Usage |
| --- | --- | --- |
| `--text-xs` | `11px` | Table helpers, badges |
| `--text-sm` | `12px` | Labels, metadata |
| `--text-md` | `14px` | Body, inputs |
| `--text-lg` | `16px` | Card labels |
| `--text-xl` | `20px` | Section titles |
| `--text-2xl` | `24px` | Page title |
| `--text-3xl` | `30px` | Major dashboard title |

### Spacing

Use a 4px spacing scale.

| Token | Value |
| --- | --- |
| `--space-1` | `4px` |
| `--space-2` | `8px` |
| `--space-3` | `12px` |
| `--space-4` | `16px` |
| `--space-5` | `20px` |
| `--space-6` | `24px` |
| `--space-8` | `32px` |
| `--space-10` | `40px` |

Page padding:

- Desktop: `22px`
- Tablet: `16px`
- Mobile: `14px`

### Radius

| Token | Value | Usage |
| --- | --- | --- |
| `--radius-sm` | `8px` | Small controls |
| `--radius-md` | `12px` | Buttons and inputs |
| `--radius-lg` | `16px` | Cards and tables |
| `--radius-xl` | `24px` | Login/register cards |
| `--radius-pill` | `999px` | Pills and avatars |

Cards should normally use `16px`. Avoid very large rounded corners except login/register surfaces.

### Shadows

| Token | Value | Usage |
| --- | --- | --- |
| `--shadow-soft` | `0 10px 28px rgba(15,23,42,.07)` | Cards |
| `--shadow-lift` | `0 18px 48px rgba(15,23,42,.12)` | Hover |
| `--shadow-nav` | `0 18px 42px rgba(4,38,34,.28)` | Top navigation |
| `--shadow-focus` | `0 0 0 4px rgba(22,166,106,.13)` | Form focus |

### Motion

Use short, smooth motion:

- Default duration: `180ms`
- Page/card animation: `280ms`
- Maximum UI animation: `300ms`
- Easing: `ease`

Allowed animations:

- Card hover lift
- Button hover lift
- Dropdown fade/slide
- Toast fade/slide
- Page fade in
- Number/count animation
- Chart animation
- Notification pulse

Avoid slow or decorative animations that distract from operations.

### Breakpoints

| Breakpoint | Width | Behavior |
| --- | --- | --- |
| Mobile | `<= 760px` | Single-column layout, horizontal nav scroll or compact nav |
| Tablet | `761px - 900px` | Two-column where possible |
| Laptop | `901px - 1380px` | Full product layout, compact nav |
| Desktop | `> 1380px` | Full grid layout |

## Components

### Navigation

The primary authenticated navigation is horizontal and dark green.

Required items:

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

- Notification bell with badge
- User avatar
- User name
- User role
- Profile dropdown

Rules:

- Exactly one navigation item can be active.
- Active state uses green background, white text, white icon, rounded corners, and soft shadow.
- Every item must have an icon from the same icon style.
- Navigation must remain usable on mobile and tablet.
- Do not create a second navigation style for a page unless added here.

### Buttons

Button variants:

- Primary green: main save/approve/add action.
- Primary blue: legacy/customer portal action only when already used.
- Secondary light: neutral action.
- Danger: reject/remove/archive/stop action.
- Icon button: table actions.

Rules:

- Buttons use `12px` radius.
- Buttons use icon + text when action needs clarity.
- Icon-only buttons require tooltip/title.
- Buttons must have hover and focus states.
- Do not place oversized text inside compact buttons.

### Forms

Inputs, selects, textareas:

- White background
- `1px` soft border
- `12px` radius
- Clear focus ring using `--shadow-focus`
- Labels above controls
- Validation messages below controls

Phone/country selector:

- Selected display may show flag only where required.
- Country search list may show flag, country name, and code.
- Numeric phone length validation must use country-specific rules where available.

### Cards

Cards are for:

- KPI cards
- Repeated records
- Dashboard widgets
- Modal content
- Report blocks

Rules:

- Use white background, soft border, soft shadow.
- Use `16px` radius.
- Do not nest cards inside cards unless it is a modal or repeated record list.
- Hover lift is allowed for interactive cards only.

### Tables

Tables must support large operational data.

Rules:

- Sticky header when useful.
- Rounded table container.
- Hover row state.
- Status badges.
- Avatar/profile cell where useful.
- Horizontal scroll on mobile.
- Pagination for large tables.
- Search/filter row above table.
- Do not make text overlap inside table cells.

### Badges

Use badges for:

- Status
- Category
- Role
- Payment state
- Subscription state

Badge colors:

- Green: active/paid/approved
- Orange: trial/warning/pending soon
- Blue: uploaded/in progress/info
- Purple: secondary status
- Red: rejected/expired/overdue/problem
- Grey: inactive/archived

### Modals

Use modals for:

- Confirmation
- Edit details
- Review payment proof
- Approve/reject actions

Rules:

- Modal content max width must be responsive.
- Close button required.
- Primary action on the right in LTR and mirrored logically in RTL.
- Dangerous actions must be visually clear.

### Toasts

Use toast messages for:

- Save success
- Upload success/error
- Validation error
- Action completed

Rules:

- Toasts must be short.
- Toasts must not hide important buttons on mobile.

## Page Standards

### Dashboard

Use:

- KPI cards
- Charts
- Alerts
- Recent activity
- Quick actions
- Tables

Dashboard numbers must come from real app data or show `0`. Do not show fake operational values as if real.

### Customers Page

The Customers page must use:

- Premium page header
- KPI cards
- Search
- Status/category/subscription/source filters
- Responsive table
- Customer avatar
- Phone and WhatsApp indicator
- Category badge
- Status badge
- Subscription end / days left
- Assigned driver
- Action buttons
- Pagination

On mobile, the table must scroll horizontally or become card-style. It must not break layout.

### Customer Registration

Registration must feel mobile-first and premium:

- Step-based flow
- Clear progress
- Large accessible touch targets
- Green brand accents
- Arabic RTL support
- No accidental submit on Enter before final step
- Customer-facing labels translated
- Admin review data displayed in English for staff review where required

### Customer Login

The customer login screen is the compact mobile-first reference surface for customer-facing pages:

- Maximum content width is `480px` on tablet and desktop.
- Do not stretch the mobile layout on larger screens.
- Use one clean outer card with `18px` radius and soft shadow.
- Inner form controls may have input borders, but avoid nested card-like boxes.
- Order: logo, customer/register tabs, welcome section, phone number, password, forgot password, login button, create account, footer/support.
- Touch targets must be at least `44px`.
- Use the official palette: primary green `#0F5D4E`, secondary green `#1B7A63`, accent green `#DFF5EC`, background `#F8FAFC`, border `#E5E7EB`.
- Heading `34px` bold, subheading `18px` medium, label `14px` semibold, input `17px` medium, button `18px` bold.
- Keep smooth `200-300ms` transitions for page fade, logo fade, tab slide, input focus, and buttons.

### Customer Portal

Portal must show only customer-relevant details:

- Delivery
- Subscription
- Package remaining count
- Menu selection
- Pause/resume request
- Payment proof/renewal
- Goal progress
- Support links

Do not expose internal admin fields to customers.

## RTL and Arabic

Rules:

- Use `dir="rtl"` when Arabic is selected.
- Text alignment becomes right side.
- Use logical CSS where possible: `margin-inline`, `padding-inline`, `inset-inline`.
- Icons remain readable and should not overlap text.
- Tables may keep numeric data readable but headers and text must align correctly.
- Mobile Arabic layout must be tested.

## Responsive Rules

Desktop:

- Full horizontal navigation.
- Multi-column KPI grids.
- Wide tables.

Tablet:

- Reduce grid columns.
- Keep nav scrollable or compact.
- Maintain large touch targets.

Mobile:

- Single-column cards.
- Horizontal table scroll or card table.
- Buttons full-width where helpful.
- No overlapping text.
- No clipped labels.

## Implementation Notes For Current App

The current app is plain HTML/CSS/JavaScript:

- `index.html`
- `styles.css`
- `app.js`
- `en.json`
- `ar.json`

Do not convert to React or another framework unless the user asks.

Use this design system with existing classes first. If a new shared component is needed, add it to `src/design-system/components` and document it here before using it.

## Required QA Before Finishing UI Work

For every UI change:

1. Refresh with a new cache query/version.
2. Check browser console errors.
3. Check desktop width.
4. Check tablet width.
5. Check mobile width.
6. Check English LTR.
7. Check Arabic RTL when the page has translated text.
8. Confirm no unwanted horizontal overflow except intentional table/nav scroll.
9. Confirm no hidden login/dashboard overlap.
10. Confirm buttons and icons still work.
