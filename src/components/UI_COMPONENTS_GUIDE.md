# Enhanced UI Components Guide

This guide explains the new professional UI components and how to integrate them into your application for improved desktop and mobile experiences.

## New Components

### 1. **Hooks** (`src/hooks/useDeviceType.ts`)

#### `useDeviceType()`
Detects the current device type based on viewport width.
```typescript
const deviceType = useDeviceType() // 'mobile' | 'tablet' | 'desktop'
```

#### `useMediaQuery(query: string)`
Check if viewport matches a media query.
```typescript
const isSmallScreen = useMediaQuery('(max-width: 768px)')
```

#### `useTouch()`
Detect if device supports touch.
```typescript
const isTouch = useTouch()
```

### 2. **UI Components** (`src/components/ui/`)

#### Button Component
```typescript
import { Button } from './ui/Button'

<Button variant="primary" size="md">
  Save
</Button>
```

Variants: `primary`, `secondary`, `danger`, `ghost`  
Sizes: `sm`, `md`, `lg`

#### IconButton Component
```typescript
import { IconButton } from './ui/Button'
import * as Icons from './ui/Icons'

<IconButton 
  icon={<Icons.PlayIcon />} 
  label="Play"
  size="md"
  onClick={handlePlay}
/>
```

#### Icon Set
Comprehensive SVG icon library for all controls:
```typescript
import * as Icons from './ui/Icons'

<Icons.PlayIcon />
<Icons.PauseIcon />
<Icons.LineIcon />
<Icons.CircleIcon />
<Icons.UndoIcon />
// ... and more
```

#### ResponsiveToolbar Component
Automatically adapts layout based on device type.
```typescript
import ResponsiveToolbar from './ui/ResponsiveToolbar'

const groups = [
  {
    id: 'playback',
    label: 'Playback',
    items: [
      {
        id: 'play',
        icon: <Icons.PlayIcon />,
        label: 'Play',
        onClick: handlePlay,
        active: isPlaying
      }
    ]
  }
]

<ResponsiveToolbar groups={groups} />
```

### 3. **PlaybackToolbar Component** (`src/components/PlaybackToolbar.tsx`)

Modern replacement for Controls component with responsive design.

```typescript
import PlaybackToolbar from './components/PlaybackToolbar'

<PlaybackToolbar
  isPlaying={isPlaying}
  playbackRate={playbackRate}
  currentTime={currentTime}
  duration={duration}
  onPlay={handlePlay}
  onPause={handlePause}
  onSpeedChange={handleSpeedChange}
  onSeek={handleSeek}
  videoLoaded={videoLoaded}
  onToggleDrawing={handleToggleDrawing}
  showDrawingCanvas={showDrawingCanvas}
  onToggleFullscreen={handleToggleFullscreen}
  isFullscreen={isFullscreen}
/>
```

**Features:**
- Mobile: Tab-based interface with seek bar
- Desktop: Horizontal toolbar with integrated seek
- Tablet: Hybrid layout with scroll support
- Automatic speed selector dropdown
- Time display with digital clock styling
- Quick access to tools

### 4. **DrawingToolbar Component** (`src/components/DrawingToolbar.tsx`)

Professional drawing tools interface with responsive design.

```typescript
import DrawingToolbar from './components/DrawingToolbar'

<DrawingToolbar
  selectedTool={selectedTool}
  onToolChange={handleToolChange}
  onUndo={handleUndo}
  onRedo={handleRedo}
  canUndo={canUndo}
  canRedo={canRedo}
  color={color}
  onColorChange={handleColorChange}
  strokeWidth={strokeWidth}
  onStrokeWidthChange={handleStrokeChange}
  opacity={opacity}
  onOpacityChange={handleOpacityChange}
  onClear={handleClear}
/>
```

**Features:**
- Mobile: Tab-based (Tools | Properties) with drawer
- Desktop: Vertical sidebar with organized sections
- Tablet: Horizontal toolbar
- Color picker (8 predefined colors + custom)
- Stroke width selector with 5 presets
- Opacity slider
- Undo/Redo support
- Clear all functionality
- Visual feedback for active states

## CSS Files

### `ui-components.css`
- Button styling (variants and sizes)
- Icon button styling
- Tooltip component
- Responsive toolbar base styles
- Breakpoint-specific adjustments

### `playback-toolbar.css`
- Playback toolbar layouts (mobile, tablet, desktop)
- Seek slider styling with custom thumb
- Time display formatting
- Gradient backgrounds and shadows
- Touch-friendly sizing

### `drawing-toolbar.css`
- Drawing toolbar layouts (desktop sidebar, mobile drawer)
- Tool button grid
- Color picker swatches
- Stroke width preview buttons
- Property sliders
- Tab interface for mobile
- Scrollbar styling

### `responsive-layout.css`
- Video editor layout system
- Analyze page grid layout
- Sidebar positioning
- Mobile-first breakpoints
- Sticky positioning for toolbars
- Safe area support for notched devices

## Integration Guide

### Step 1: Replace Controls Component in VideoEditor

**Before:**
```typescript
import Controls from '../components/Controls.tsx'
<Controls {...props} />
```

**After:**
```typescript
import PlaybackToolbar from '../components/PlaybackToolbar.tsx'
<PlaybackToolbar {...props} />
```

### Step 2: Replace Drawing Tools in Analyze

**Before:**
```typescript
// Old drawing tools scattered across component
```

**After:**
```typescript
import DrawingToolbar from '../components/DrawingToolbar.tsx'
<DrawingToolbar 
  selectedTool={selectedTool}
  onToolChange={handleToolChange}
  // ... other props
/>
```

### Step 3: Update Styling

The new CSS files are automatically imported via `global.css`. No additional setup needed.

### Step 4: Add Translations

New translation keys supported:
- `controls.playback`
- `controls.speed`
- `controls.tools`
- `controls.play`
- `controls.pause`

Already added for: Swedish, English, Spanish

## Responsive Behavior

### Mobile (< 768px)
- Fixed floating toolbars at bottom
- Tab-based interface for tools
- Touch-friendly 48x48px buttons
- Vertical stacked layout for fullscreen video
- Drawer/sheet UI patterns

### Tablet (768px - 991px)
- Horizontal toolbars with horizontal scroll
- Two-column layout
- Medium-sized buttons
- Hybrid interface combining desktop and mobile features

### Desktop (992px+)
- Horizontal toolbar with all controls visible
- Vertical sidebar for drawing tools
- Full labels and icons
- Sticky positioning for easy access
- Three-column layout for analyzer

## Customization

### Add New Tool
```typescript
const toolOptions = [
  { id: 'line', icon: <Icons.LineIcon />, label: 'Line' },
  // Add new tool:
  { id: 'polygon', icon: <Icons.PolygonIcon />, label: 'Polygon' }
]
```

### Customize Colors
Edit `src/styles/ui-components.css` color variables or override in your custom CSS.

### Add Keyboard Shortcuts
```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'Space') onPlay()
    if (e.code === 'KeyZ' && e.ctrlKey) onUndo()
  }
  window.addEventListener('keydown', handleKeyDown)
}, [])
```

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile browsers: iOS Safari, Chrome mobile

## Accessibility Features

- ✅ Semantic HTML buttons
- ✅ ARIA labels on icon buttons
- ✅ Keyboard navigation support
- ✅ Touch target minimum 44x44px
- ✅ High contrast colors
- ✅ Tooltips for desktop users

## Performance Notes

- Hooks are lightweight and don't cause unnecessary re-renders
- Icons are inline SVGs (no external requests)
- CSS is optimized with CSS Grid for layout
- Toolbar components use React.memo for optimization
- No external UI library dependencies

## Troubleshooting

**Toolbar not showing:**
- Ensure CSS files are imported in `global.css`
- Check that component props are passed correctly

**Buttons not responsive:**
- Verify device breakpoints in `responsive-layout.css`
- Check `useDeviceType()` returns correct value

**Touch issues on mobile:**
- Ensure buttons are at least 44x44px
- Use `useTouch()` hook to detect and adjust interaction model

**Styling conflicts:**
- Check CSS specificity
- Use browser DevTools to inspect computed styles
- CSS is scoped with class names to avoid conflicts

## Future Enhancements

- [ ] Keyboard shortcuts
- [ ] Voice commands
- [ ] Advanced color picker
- [ ] Shape library/templates
- [ ] Undo/Redo with UI history
- [ ] Gradient fills
- [ ] Custom brush patterns
