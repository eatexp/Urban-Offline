# Urban-Offline Design System V4.0
## "Premium Offline Intelligence"

---

## 1. DESIGN PHILOSOPHY

### Core Principles
1. **Emergency-First**: Critical content in <100ms, zero friction
2. **Offline-Native**: Works beautifully without connectivity
3. **Premium Minimalism**: iOS/Android first-party quality
4. **Intelligent Adaptation**: Device-aware, context-sensitive

### Brand Essence
- **Trustworthy**: Solid, reliable, always there
- **Intelligent**: Smart recommendations, proactive assistance
- **Premium**: Polished, native, delightful micro-interactions
- **Focused**: No clutter, purposeful every element

---

## 2. COLOUR SYSTEM

### Primary Palette
```css
/* SLATE BLUE - Primary Identity */
--color-primary-50:  #f8fafc;   /* Lightest surfaces */
--color-primary-100: #f1f5f9;   /* Secondary backgrounds */
--color-primary-200: #e2e8f0;   /* Borders, dividers */
--color-primary-300: #cbd5e1;   /* Disabled states */
--color-primary-400: #94a3b8;   /* Placeholder text */
--color-primary-500: #64748b;   /* Primary actions */
--color-primary-600: #475569;   /* Hover states */
--color-primary-700: #334155;   /* Active states */
--color-primary-800: #1e293b;   /* Dark surfaces */
--color-primary-900: #0f172a;   /* Primary text, deepest bg */
--color-primary-950: #020617;   /* Pure black substitute */

/* INDIGO - Secondary/Accent */
--color-secondary-500: #6366f1;  /* Focus states, links */
--color-secondary-600: #4f46e5;  /* Knowledge/Grokopedia */
```

### Semantic Colours
```css
/* EMERGENCY - Used ONLY for true danger */
--color-emergency-500: #dc4446;  /* Desaturated red */
--color-emergency-600: #b91c1c;
--color-emergency-bg:  rgba(220, 68, 70, 0.1);

/* SUCCESS - Positive actions */
--color-success-500: #16a34a;    /* Muted green */
--color-success-600: #15803d;
--color-success-bg:  rgba(22, 163, 74, 0.1);

/* WARNING - Caution, not danger */
--color-warning-500: #d97706;    /* Soft amber */
--color-warning-600: #b45309;
--color-warning-bg:  rgba(217, 119, 6, 0.1);

/* INFO - Neutral information */
--color-info-500: #3b82f6;
--color-info-600: #2563eb;
```

### Premium Accents
```css
/* GOLD - Premium features, Pro tier */
--color-premium:      #d4a574;
--color-premium-light: #e8c9a8;
--color-premium-dark:  #b8935f;
--color-premium-glow:  rgba(212, 165, 116, 0.15);

/* GLOW EFFECTS - Subtle only */
--shadow-glow-premium: 0 0 20px var(--color-premium-glow);
--shadow-glow-success: 0 0 20px rgba(52, 199, 89, 0.2);
--shadow-glow-purple:  0 0 20px rgba(168, 85, 247, 0.2);
```

### Dark Mode Surfaces
```css
/* Z-DEPTH LAYER SYSTEM */
--color-bg-depth-0: #000000;     /* Deepest black */
--color-bg-depth-1: #0a0f1a;     /* Base background */
--color-bg-depth-2: #0f172a;     /* Card backgrounds */
--color-bg-depth-3: #1e293b;     /* Elevated surfaces */
--color-bg-depth-4: #334155;     /* Modals, sheets */
--color-bg-depth-5: #475569;     /* Maximum elevation */
```

---

## 3. TYPOGRAPHY

### Font Stack
```css
--font-family-primary: 'Inter', -apple-system, BlinkMacSystemFont, 
                       'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
--font-family-mono:    'SF Mono', Monaco, 'Cascadia Code', 
                       'Roboto Mono', monospace;
```

### Type Scale
| Token | Size | Line Height | Weight | Use Case |
|-------|------|-------------|--------|----------|
| `text-hero` | 30px | 1.2 | 700 (Bold) | Page titles |
| `text-h1` | 24px | 1.3 | 700 | Section headers |
| `text-h2` | 20px | 1.4 | 600 (Semibold) | Card titles |
| `text-h3` | 18px | 1.4 | 600 | Subsection |
| `text-body` | 16px | 1.5 | 400 (Regular) | Body text |
| `text-small` | 14px | 1.5 | 400 | Secondary text |
| `text-caption` | 12px | 1.4 | 500 (Medium) | Labels, badges |
| `text-emergency` | 16px | 1.4 | 600 | Critical alerts |

### Letter Spacing
```css
--tracking-tight:  -0.02em;  /* Headlines */
--tracking-normal: 0;        /* Body text */
--tracking-wide:   0.02em;   /* Labels, buttons */
--tracking-wider:  0.05em;   /* Emergency, uppercase */
```

---

## 4. SPACING SYSTEM

### 8px Grid Base
```css
--space-1:  0.25rem;  /* 4px - Micro gaps */
--space-2:  0.5rem;   /* 8px - Tight spacing */
--space-3:  0.75rem;  /* 12px - Default gaps */
--space-4:  1rem;     /* 16px - Standard padding */
--space-5:  1.25rem;  /* 20px - Card padding */
--space-6:  1.5rem;   /* 24px - Section gaps */
--space-8:  2rem;     /* 32px - Large sections */
--space-10: 2.5rem;   /* 40px - Major breaks */
--space-12: 3rem;     /* 48px - Hero spacing */
```

### Safe Area Support
```css
--safe-area-top:    env(safe-area-inset-top);
--safe-area-bottom: env(safe-area-inset-bottom);
--safe-area-left:   env(safe-area-inset-left);
--safe-area-right:  env(safe-area-inset-right);
```

---

## 5. ELEVATION & SHADOWS

### iOS-Style Shadows
```css
--shadow-native-sm: 0 1px 2px rgba(0, 0, 0, 0.08), 
                    0 1px 3px rgba(0, 0, 0, 0.05);
--shadow-native-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 
                    0 2px 4px -2px rgba(0, 0, 0, 0.08);
--shadow-native-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.12), 
                    0 4px 6px -4px rgba(0, 0, 0, 0.08);
```

### Android Material Elevation
```css
--shadow-material-1: 0 1px 3px rgba(0, 0, 0, 0.12), 
                     0 1px 2px rgba(0, 0, 0, 0.24);
--shadow-material-2: 0 3px 6px rgba(0, 0, 0, 0.15), 
                     0 2px 4px rgba(0, 0, 0, 0.12);
--shadow-material-3: 0 10px 20px rgba(0, 0, 0, 0.15), 
                     0 3px 6px rgba(0, 0, 0, 0.1);
```

### Glass Morphism
```css
--glass-bg:      rgba(30, 41, 59, 0.72);
--glass-border:  rgba(255, 255, 255, 0.08);
--glass-blur:    20px;
--glass-saturate: 180%;
```

---

## 6. ANIMATION

### Duration Standards
```css
--duration-instant: 50ms;    /* Micro-feedback */
--duration-fast:    150ms;   /* Button presses */
--duration-normal:  250ms;   /* State changes */
--duration-slow:    350ms;   /* Page transitions */
--duration-slower:  500ms;   /* Complex animations */
```

### Easing Curves
```css
/* iOS Spring Physics */
--ease-ios-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);

/* Smooth Standard */
--ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);

/* Decelerate (entering) */
--ease-decelerate: cubic-bezier(0, 0, 0.2, 1);

/* Accelerate (exiting) */
--ease-accelerate: cubic-bezier(0.4, 0, 1, 1);

/* Emphasized (Material) */
--ease-emphasized: cubic-bezier(0.2, 0, 0, 1);
```

### Motion Patterns
| Pattern | Duration | Easing | Use Case |
|---------|----------|--------|----------|
| `fade-in` | 250ms | ease-smooth | Content appearance |
| `slide-up` | 350ms | ease-decelerate | Cards, sheets |
| `scale-in` | 200ms | ease-ios-spring | Buttons, badges |
| `pulse` | 2s | ease-in-out | Status indicators |
| `shimmer` | 1.5s | linear | Loading states |

---

## 7. COMPONENT PATTERNS

### Buttons

**Primary Button**
```css
height: var(--button-height-lg);        /* 48px */
padding: 0 24px;
border-radius: 12px;
font-weight: 600;
font-size: 15px;
letter-spacing: 0.02em;
background: var(--color-primary-600);
color: white;
transition: all var(--duration-fast) var(--ease-smooth);
```

**Emergency Button**
```css
/* Only for true emergencies */
background: var(--color-emergency-500);
color: white;
text-transform: uppercase;
letter-spacing: 0.05em;
```

### Cards

**Standard Card**
```css
background: var(--color-bg-depth-3);
border: 1px solid var(--glass-border);
border-radius: 16px;
padding: var(--space-5);
```

**Glass Card (Premium)**
```css
background: var(--glass-bg);
backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
border: 1px solid var(--glass-border);
border-radius: 20px;  /* iOS style */
```

### Input Fields

**Text Input**
```css
height: var(--input-height-lg);         /* 52px */
padding: 0 var(--space-4);
font-size: var(--font-size-base);
border: 1px solid var(--color-primary-300);
border-radius: 12px;
background: var(--color-bg-depth-2);
transition: border-color var(--duration-fast);
```

**Focus State**
```css
border-color: var(--color-secondary-500);
box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
```

---

## 8. PLATFORM ADAPTATIONS

### iOS-Specific
- Border radius: 20px for cards, 12px for buttons
- Spring animations for all enter/exit
- Status bar: Dark text on light, light text on dark
- Safe area: Respect notch, Dynamic Island

### Android-Specific
- Border radius: 16px (Material 3)
- Ripple effects on all touchables
- Elevation shadows, not borders
- Edge-to-edge with navigation bar handling

---

## 9. ACCESSIBILITY

### Contrast Requirements
- Normal text: 4.5:1 minimum
- Large text: 3:1 minimum
- Interactive elements: 3:1 against adjacent colors

### Focus Indicators
```css
/* Visible focus ring */
:focus-visible {
  outline: 2px solid var(--color-secondary-500);
  outline-offset: 2px;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Touch Targets
- Minimum: 44×44px (iOS), 48×48px (Android)
- Preferred: 48×48px everywhere

---

## 10. USAGE GUIDELINES

### Do
✓ Use `--color-primary-500` for primary actions
✓ Reserve `--color-emergency-500` for true danger only
✓ Apply glass morphism sparingly (modals, premium cards)
✓ Use spring physics on iOS, material easing on Android
✓ Maintain 8px grid alignment

### Don't
✗ Use gradients on primary buttons
✗ Apply glow effects to functional elements
✗ Mix shadow and border for depth (choose one)
✗ Use emergency red for non-critical notifications
✗ Animate layout properties (use transform/opacity)

---

## 11. THEME CONFIGURATION

### Light Mode
```css
--color-bg-primary:    #ffffff;
--color-bg-secondary:  var(--color-primary-50);
--color-text-primary:  var(--color-primary-900);
--color-text-secondary: var(--color-primary-600);
--color-border:        var(--color-primary-200);
```

### Dark Mode
```css
--color-bg-primary:    var(--color-primary-900);
--color-bg-secondary:  var(--color-bg-depth-2);
--color-text-primary:  #f8fafc;
--color-text-secondary: var(--color-primary-300);
--color-border:        var(--color-primary-700);
```

---

*Last updated: 2026-02-15*
*Version: 4.0*