# MUTHUR OS Terminal - UI Reference

## Visual Layout

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│  MUTHUR://CORE              v0.1.0 ALPHA    SYSTEM: ONLINE    12:34:56  2026-05-24│
├──────────────┬───────────────────────────────────────────┬──────────────────────────┤
│              │                                           │                          │
│  SYSTEM      │  ┌─TERMINAL───┬─BROWSER──┐              │  NETWORK STATUS          │
│ DIAGNOSTICS  │  │                         │              │  ┌──────────────────┐   │
│              │  │  TERM-1  TERM-2  + NEW  │              │  │                  │   │
│ CPU USAGE    │  └─────────────────────────┘              │  │   [3D GLOBE]     │   │
│ ▓▓▓▓░░░░ 45% │                                           │  │   Rotating...    │   │
│              │  $ echo "Hello MUTHUR"_                   │  │                  │   │
│ MEMORY       │  Hello MUTHUR                             │  └──────────────────┘   │
│ ▓▓▓▓▓▓░░ 75% │  $                                        │                          │
│ 6.0/8.0 GB   │                                           │  STATUS: CONNECTED       │
│              │  [Terminal Output Area]                   │  LATENCY: 12ms           │
│ TOP PROCS    │                                           │                          │
│ chrome  35%  │                                           │ ─────────────────────────│
│ firefox 12%  │                                           │                          │
│ node     8%  │                                           │  MUTHUR AI ASSISTANT     │
│ code     5%  │                                           │                          │
│              │                                           │  ┌───────────────────┐  │
│ NETWORK      │                                           │  │ SYSTEM: AI ONLINE │  │
│ RX: 124.5 MB │                                           │  │                   │  │
│ TX: 45.2 MB  │                                           │  │ > #list files     │  │
│              │                                           │  │ < ls -lah         │  │
├──────────────┴───────────────────────────────────────────┤  │                   │  │
│  FILE SYSTEM                                        ↑ UP  │  │ > Hello MUTHUR   │  │
│  ~/Documents/projects/                                    │  │ < How can I help?│  │
│                                                           │  └───────────────────┘  │
│  [DIR] muthur-os-terminal/     4.5 KB    2026-05-24      │                          │
│  [DIR] .github/                2.1 KB    2026-05-23      │  Tip: Use # prefix       │
│  [FILE] README.md             12.3 KB    2026-05-24      │  [________________]      │
│  [FILE] package.json           1.8 KB    2026-05-24      │  [SEND]                  │
└───────────────────────────────────────────────────────────┴──────────────────────────┘
```

---

## Color Palette

### Primary Colors
```css
Background:     #000000  ███████  Pure black
Primary (text): #00ff41  ███████  Matrix green
Secondary:      #00d4ff  ███████  Cyan accent
Accent:         #ff006e  ███████  Magenta/pink
Border:         #0a3622  ███████  Dark green
Panel BG:       #0a1612  ███████  Very dark green
```

### Usage Examples
```
┌─────────────────────┐
│ Panel Header (#0a3622 border, #00ff41 text)
├─────────────────────┤
│ Panel Body          │  (#0a1612 background)
│ Normal text         │  (#00ff41)
│ Secondary text      │  (#00d4ff)
│ Error/Accent        │  (#ff006e)
└─────────────────────┘
```

---

## Visual Effects

### CRT Effects

**Scanline Animation**:
```
┌─────────────────┐
│░░░░░░░░░░░░░░░░░│ ← Moves from top to bottom
│                 │   over 8 seconds
│     Content     │   Semi-transparent line
│                 │
│░░░░░░░░░░░░░░░░░│
└─────────────────┘
```

**Screen Flicker**:
- Subtle opacity change every 0.15s
- From 100% to 96% and back
- Gives authentic CRT feel

**Text Glow**:
```
  Normal:  Text
  Glowing: T̲e̲x̲t̲  (with shadow effect)
```

### Custom Cursor

```
     ●
   ┌───┐
   │ ┌─┐ │  20px circle
   │ │●│ │  4px center dot
   │ └─┘ │  #00ff41 color
   └───┘
```

Follows mouse, 0.1s smooth tracking

---

## Layout Measurements

### Window Dimensions
- **Default**: 1920x1080 (fullscreen)
- **Minimum**: 1280x720
- **Recommended**: 1920x1080 or higher

### Panel Widths
- **Left Panel**: 25% (480px at 1920px)
- **Center Panel**: 50% (960px at 1920px)
- **Right Panel**: 25% (480px at 1920px)

### Header Height
- **Height**: 48px
- **Font**: 24px (title), 14px (status)

### Component Spacing
- **Gap between panels**: 8px
- **Panel padding**: 16px
- **Component margin**: 8px

---

## Typography

### Font Families
```css
Primary: 'Share Tech Mono', monospace
Fallback: 'Courier New', monospace
```

### Font Sizes
```
Header Title:     24px  MUTHUR://CORE
Header Info:      14px  System status
Panel Headers:    12px  SYSTEM DIAGNOSTICS
Body Text:        14px  Regular content
Terminal:         14px  Monospace terminal
Small Text:       10px  Metadata, timestamps
```

### Font Weights
- **Normal**: 400 (default)
- **Bold**: 700 (headers, emphasized)

---

## Component Styles

### Panel Style
```css
.panel {
  background: rgba(10, 22, 18, 0.85);
  border: 1px solid #0a3622;
  backdrop-filter: blur(4px);
}
```

### Panel Header Style
```css
.panel-header {
  background: rgba(0, 255, 65, 0.1);
  border-bottom: 1px solid #0a3622;
  padding: 8px 12px;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 2px;
}
```

### Progress Bar Style
```
Memory: ▓▓▓▓▓▓░░░░ 60%

HTML:
┌───────────────────────┐
│▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░│
└───────────────────────┘
 Background: #0a3622
 Fill: #00ff41 or #00d4ff
 Height: 8px
 Border-radius: 4px
```

---

## Interactive Elements

### Buttons

**Primary Button**:
```css
background: #00ff41;
color: #000000;
padding: 8px 16px;
text-transform: uppercase;
```

**Secondary Button**:
```css
border: 1px solid #00ff41;
color: #00ff41;
background: transparent;
padding: 8px 16px;
```

**Hover Effect**:
- Slight glow increase
- Background brightness +10%

### Inputs

**Text Input**:
```css
background: #0a1612;
border: 1px solid #0a3622;
color: #00ff41;
padding: 8px;
focus: border-color: #00ff41;
```

### Tabs

**Active Tab**:
```css
background: #00ff41;
color: #000000;
```

**Inactive Tab**:
```css
background: transparent;
color: #00d4ff;
hover: background: #0a3622;
```

---

## Data Visualization

### System Stats Format

**CPU Usage**:
```
CPU USAGE
▓▓▓▓▓░░░░░ 45.2%

Format: Progress bar + percentage
Update: Every 2 seconds
```

**Memory Usage**:
```
MEMORY USAGE
▓▓▓▓▓▓░░░░ 75.0%
6.0 GB / 8.0 GB

Format: Progress bar + percentage + absolute
Update: Every 2 seconds
```

**Process List**:
```
TOP PROCESSES
chrome        35.2%
firefox       12.1%
node           8.5%
code           5.3%

Format: Name (left), CPU% (right)
Max: 8 processes shown
Sorted: By CPU usage descending
```

---

## 3D Globe Specifications

### Globe Properties
- **Radius**: 2 units
- **Segments**: 32 (smooth)
- **Material**: Wireframe with transparency
- **Color**: #00ff41
- **Opacity**: 0.6

### Grid Lines
- **Latitude lines**: 9 (equator + 4 each hemisphere)
- **Longitude lines**: 16 (22.5° intervals)
- **Line width**: 1px
- **Color**: #00ff41

### Animation
- **Rotation speed**: 0.15 radians/second
- **Axis**: Y-axis (vertical)
- **Direction**: Counter-clockwise

### Lighting
```javascript
Ambient Light: 0.5 intensity
Point Light:
  Position: (10, 10, 10)
  Intensity: 1.0
  Color: #00ff41
```

---

## Responsive Behavior

### Minimum Window Size
At 1280x720, layout adjusts:
- Font sizes scale down 10%
- Globe size reduces to fit
- File explorer shows fewer entries
- Process list shows 5 instead of 8

### Maximum Window Size
No upper limit, but:
- Content centers
- Max content width: 2560px
- Beyond that, panels stay proportional

---

## Accessibility

### Current Features
- High contrast colors (green on black)
- Large, readable fonts
- Clear visual hierarchy
- Keyboard navigation (some shortcuts)

### Future Improvements
- Screen reader support
- Configurable color themes
- Font size adjustment
- Keyboard-only operation

---

## Theme Variations (Future)

### Light Mode (Planned)
```
Background:     #f0f0f0
Primary:        #00a830
Secondary:      #0088cc
Border:         #cccccc
```

### Cyberpunk (Planned)
```
Background:     #0a0e27
Primary:        #ff006e
Secondary:      #00d4ff
Accent:         #ffd700
```

### Solarized (Planned)
```
Background:     #002b36
Primary:        #859900
Secondary:      #268bd2
Accent:         #dc322f
```

---

**End of UI Reference**

*This document describes the visual design of MUTHUR v0.1.0*
