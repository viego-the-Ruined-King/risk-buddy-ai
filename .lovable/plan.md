

# Fix 4 UI/Layout Bugs

## Bug Analysis

1. **Sidebar icons misaligned when collapsed**: In `AppSidebar.tsx`, collapsed NavLink items use `px-3` padding pushing icons left. Need `justify-center` when collapsed.

2. **Table overflow breaking page layout**: Both `HazopResults.tsx` and `HazidResults.tsx` tables already have `overflow-x-auto`, but the parent `AppLayout.tsx` main content area uses `overflow-auto` which propagates horizontal scroll to the page body. Need to constrain the main content with `overflow-x-hidden` and ensure tables stay within bounds.

3. **Z-index overlap**: Sidebar has `z-10` (line 195 of sidebar.tsx), header has `z-40`. When scrolling horizontally, header content bleeds over the sidebar. Fix: bump sidebar to `z-50` so it always stays on top.

4. **LOPA action button broken**: In `HazopResults.tsx` line 88, `handleStartLopa` navigates to `/lopa-study` but the actual route in `App.tsx` is `/lopa`. Simple route mismatch fix.

## Changes

### 1. `src/components/ui/sidebar.tsx` (line ~195)
- Change the sidebar fixed container from `z-10` to `z-50`

### 2. `src/components/AppSidebar.tsx` (line ~56)
- When collapsed, add `justify-center` to the NavLink className so icons center in the narrow strip
- Remove horizontal padding when collapsed (`px-0` instead of `px-3`)

### 3. `src/components/AppLayout.tsx`
- On the `SidebarInset` or `main` element, add `overflow-x-hidden` to prevent horizontal scroll from propagating to the page body
- Add `min-w-0` to the flex child to allow proper flex shrinking

### 4. `src/components/HazopResults.tsx` (line 88)
- Change `navigate('/lopa-study', ...)` to `navigate('/lopa', ...)`

### 5. `src/components/HazidResults.tsx` and `src/components/HazopResults.tsx`
- Ensure table wrapper containers have `max-w-full` and the card content has `overflow-hidden` to prevent bleed

