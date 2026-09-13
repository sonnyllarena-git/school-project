# TCP Vault Icon Library — Complete Reference

**Total Icons:** 45+ Heroicons-style monochrome icons  
**Style:** Stroke-based (2px), 24px base grid, scalable to any size  
**Colors:** Use `currentColor` for theme-aware rendering  
**Formats:** SVG (native), PNG (generated), CSS utilities included

---

## Icon Categories

### Navigation & Core (3 icons)
- `dashboard` — Grid/Dashboard view
- `home` — Home/Main navigation
- `menu` — Menu/Hamburger navigation

### Users & Roles (4 icons)
- `users` — Multiple users/Team view
- `user` — Single user/Profile
- `group` — User group/Teams
- `admin` — Admin/Shield role indicator

### Credentials & Security (5 icons)
- `credentials` — Key/Credentials indicator
- `lock` — Locked/Secured state
- `lock-open` — Unlocked/Open state
- `eye` — Show/Reveal password
- `eye-off` — Hide/Mask password

### Settings & Policies (4 icons)
- `settings` — Settings/Configuration
- `policy` — Policy/Rules document
- `filter` — Filter/Search refined
- `sort` — Sort/Order items

### Audit & Monitoring (3 icons)
- `audit` — Audit trail/Verified
- `activity` — Activity log/History
- `bell` — Notifications/Alerts

### File Management (6 icons)
- `folder` — Folder/Directory
- `folder-open` — Open folder
- `file` — Document/File
- `share` — Share/Link credential
- `share-folder` — Share folder
- `share-file` — Share file

### Actions (6 icons)
- `edit` — Edit/Modify item
- `delete` — Delete/Trash item
- `copy` — Copy/Clone credential
- `plus` — Add/Create new item
- `minus` — Remove/Delete item
- `close` — Close/Cancel dialog

### Navigation Arrows (4 icons)
- `arrow-left` — Previous/Back
- `arrow-right` — Next/Forward
- `chevron-up` — Collapse section
- `chevron-down` — Expand section

### Upload & Download (3 icons)
- `download` — Download/Save file
- `upload` — Upload/Import file
- `refresh` — Refresh/Sync data

### Status & Alerts (4 icons)
- `check-circle` — Success/Confirmed
- `exclamation-circle` — Warning/Caution
- `error` — Error/Failed state
- `info` — Information/Help

---

## Usage Guide

### HTML (Inline SVG)
```html
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="3" y="3" width="7" height="7"></rect>
  <!-- ... icon path data ... -->
</svg>
```

### React Component
```jsx
export const DashboardIcon = ({ size = 24, color = '#1a3a52' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="7" height="7"></rect>
    <rect x="14" y="3" width="7" height="7"></rect>
    <rect x="14" y="14" width="7" height="7"></rect>
    <rect x="3" y="14" width="7" height="7"></rect>
  </svg>
);
```

### CSS Utility Classes
```css
.icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: currentColor;
}

.icon.sm { width: 16px; height: 16px; }
.icon.md { width: 24px; height: 24px; }
.icon.lg { width: 32px; height: 32px; }
.icon.xl { width: 48px; height: 48px; }

/* Color variants */
.icon.navy { color: #1a3a52; }
.icon.orange { color: #FF8C00; }
.icon.gray { color: #6B7280; }
.icon.white { color: #FFFFFF; }
```

### Usage Example
```html
<!-- Inline SVG with styling -->
<button class="btn">
  <svg class="icon orange" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
  Add Credential
</button>

<style>
  button { display: flex; align-items: center; gap: 8px; }
  .icon { width: 20px; height: 20px; }
</style>
```

---

## Design Token Integration

### Colors (TCP Brand)
- **Navy (Primary):** `#1a3a52` — Main text, headers, sidebar
- **Orange (Accent):** `#FF8C00` — Buttons, active states, CTAs
- **White (Ground):** `#FFFFFF` — Card backgrounds, contrast
- **Gray (Borders):** `#E5E7EB` — Dividers, disabled states, secondary text (#6B7280)

### Sizing Scale
- **16px:** Icon badges, small inline icons
- **24px:** Standard UI icons (default)
- **32px:** Button icons, list items
- **48px:** Large displays, hero sections

### Stroke Weight
- **1.5px:** Delicate (very small sizes)
- **2px:** Standard (24px default)
- **2.5px:** Bold (large sizes)

---

## Implementation Checklist

- [ ] Extract individual SVG files to `src/assets/icons/`
- [ ] Create React icon components wrapper (e.g., `useIcon()` hook)
- [ ] Add to design tokens (CSS custom properties)
- [ ] Create dashboard component library with icon integration
- [ ] Test in light and dark themes
- [ ] Document in Storybook / component library
- [ ] Add to TypeScript types (icon name enum)
- [ ] Create icon sprite sheet for optimization (optional)

---

## Quick Access

**All Icons in Interactive Library:**  
👉 Open the `tcp-vault-icon-library.html` file in your browser

**Features:**
- ✓ Click any icon to copy SVG code
- ✓ Adjust preview size (24px–64px)
- ✓ View all 45+ icons organized by category
- ✓ Copy CSS framework utilities
- ✓ See TCP brand color palette

---

## For Phase 2 Extensions

These icons work perfectly for the browser extension:
- **Dashboard:** Icon sidebar navigation
- **Credentials:** Visual indicators for password/key types
- **Status:** Show lock/unlock, visibility states
- **Actions:** Edit, delete, copy, share operations
- **Alerts:** Notification badge, warning states

Suggested extension icon sizes:
- Toolbar icon: 16px (or 32px/48px with retina)
- Popup UI: 24px (default)
- Context menu: 16px–24px

---

## Customization Guide

### Color Override (CSS)
```css
.icon { color: #FF8C00; } /* All icons orange */
.icon.primary { color: #1a3a52; } /* Navy */
.icon.success { color: #10b981; } /* Green for success states */
.icon.warning { color: #f59e0b; } /* Amber for warnings */
.icon.danger { color: #ef4444; } /* Red for errors */
```

### Dynamic Size (CSS)
```css
.icon-btn .icon { width: 20px; height: 20px; }
.sidebar .icon { width: 24px; height: 24px; }
.header .icon { width: 32px; height: 32px; }
```

### Stroke Adjustment (CSS)
```css
svg { stroke-width: 1.5; } /* Lighter */
svg { stroke-width: 2.5; } /* Bolder */
```

---

**Version:** 1.0  
**Last Updated:** 2026-09-04  
**Project:** TCP Vault — Internal Password Manager  
**Design System:** TCP Brand Color Palette + Heroicons Conventions
