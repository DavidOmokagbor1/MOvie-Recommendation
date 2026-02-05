# Apple TV–Style Design System

Design tokens and component specs for implementation in React. Use these as the single source of truth for theme and FocusableCard.

## 1. Tokens

### Colors
| Token | Value | Usage |
|-------|--------|--------|
| `--color-bg` | `#0a0e1a` | Page background |
| `--color-surface` | `rgba(26, 31, 46, 0.9)` | Cards, nav, modals |
| `--color-text` | `#ffffff` | Primary text |
| `--color-text-secondary` | `rgba(255, 255, 255, 0.75)` | Subtitle, metadata |
| `--color-accent` | `#0A84FF` | CTAs, links, focus accent (Apple blue) |
| `--color-focus-ring` | `#0A84FF` | Focus outline/ring; 2–3px, offset 2px |

### Typography
| Token | Value | Usage |
|-------|--------|--------|
| `--font-heading` | `-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif` | Hero title, section titles |
| `--font-body` | `-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif` | Body, labels |
| `--font-size-hero` | `32px` | Hero title |
| `--font-size-section` | `20px` | Rail section title |
| `--font-size-card` | `14px` | Card label |
| `--font-size-body` | `16px` | Body text |
| `--font-weight-bold` | `700` | Headings |
| `--font-weight-medium` | `500` | Buttons, labels |

### Spacing
| Token | Value |
|-------|--------|
| `--space-4` | `4px` |
| `--space-8` | `8px` |
| `--space-16` | `16px` |
| `--space-24` | `24px` |
| `--space-32` | `32px` |
| `--space-48` | `48px` |

### Layout
| Token | Value | Usage |
|-------|--------|--------|
| `--radius-card` | `12px` | Card corners |
| `--radius-button` | `8px` | Buttons |
| `--shadow-focus` | `0 0 0 3px var(--color-focus-ring)` | Focus ring (or outline) |
| `--blur-glass` | `20px` | Backdrop blur for nav, modals |
| `--blur-glass-strong` | `24px` | Modal overlay |

### Motion
| Token | Value | Usage |
|-------|--------|--------|
| `--transition-focus` | `200ms ease` | Card scale/focus |
| `--transition-modal` | `300ms ease` | Modal open/close |
| `--scale-focus` | `1.05` | Card scale when focused |

---

## 2. Card (FocusableCard) – Rest + Focus State

### Rest state
- Poster: aspect ratio 2:3, width from Rail (e.g. 160px or 180px), `border-radius: var(--radius-card)`.
- Label: below poster, one line, `--font-size-card`, `--color-text`, truncate with ellipsis.
- Background: none on card; rail/surface behind.
- No outline, no scale.

### Focus state
- **Scale:** `transform: scale(var(--scale-focus))` (1.05).
- **Ring:** `box-shadow: var(--shadow-focus)` or `outline: 2px solid var(--color-focus-ring); outline-offset: 2px`.
- **Transition:** `transition: transform var(--transition-focus), box-shadow var(--transition-focus)`.
- **z-index:** Slightly raised so focus ring is not clipped (e.g. `position: relative; z-index: 1` when focused).

### Interaction
- `tabIndex={0}` so card is focusable.
- Enter or Space triggers `onSelect` (e.g. open detail).
- Click also triggers `onSelect`.

---

## 3. Button

- **Default:** Background `--color-accent`, color white, `--radius-button`, padding from spacing.
- **Focus:** Visible focus ring (`--color-focus-ring`), same as cards.
- **Disabled:** Reduced opacity (0.5), no pointer events.

---

## 4. Text input

- Background: `--color-surface`, border 1px solid rgba(255,255,255,0.2), `--radius-button`.
- Focus: border color `--color-accent`, optional ring.
- Placeholder: `--color-text-secondary` at 0.7 opacity.
