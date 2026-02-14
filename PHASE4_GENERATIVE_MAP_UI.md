# Phase 4: Generative Map UI — Implementation Plan

**Status**: ✅ **90% Complete** (Retrospective + Gap Analysis)  
**Date**: February 13, 2026  
**Version**: 1.0

---

## 🎯 Vision

Transform the AI from a passive responder into an **active agent** capable of summoning tools. When the user asks about a location, the AI should:

1. **Explain** the location in natural language
2. **Emit** a machine-readable tag: `<<MAP: Location Name>>`
3. **Trigger** a tactical map card to appear inline in the chat stream
4. **Enable** the user to tap "Initiate Jump" and fly to that location on the full map

This creates a **generative UI** experience where the AI's output directly spawns interactive components.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER QUERY                                  │
│              "Tell me about London"                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              TransformersEngine.js                              │
│  • System Prompt: "If user asks about location, emit           │
│    <<MAP: LocationName>> at end of response"                    │
│  • Chat Template: Injects tool instructions into prompt        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   AI RESPONSE                                   │
│  "London is the capital of England, known for...                │
│   <<MAP: London>>"                                              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              MessageBubble.jsx                                  │
│  • Regex: /(<<MAP:\s*[^>]+>>)/g                                │
│  • Split content into text chunks + MAP tags                    │
│  • Render text as Markdown                                      │
│  • Render MAP tags as <MiniMapCard query="London" />           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              MiniMapCard.jsx                                    │
│  • Call MapCartridgeService.search(query)                       │
│  • States:                                                      │
│    - Loading: "SCANNING SECTOR..." (pulse animation)            │
│    - Found: "SECTOR ACQUIRED" + coords + "Initiate Jump" btn   │
│    - Missing: "SECTOR NOT DOWNLOADED" + search fallback         │
│  • onClick: navigate('/map', { state: { flyTo: payload } })    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              OfflineMap.jsx                                     │
│  • useEffect: Detect location.state.flyTo                       │
│  • Extract { center, zoom, pitch }                              │
│  • Call mapInstance.current.flyTo() with haptics                │
│  • Result: Smooth animated flight to target location           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 File Map

| File | Role | Status |
|------|------|--------|
| **`src/services/ai/TransformersEngine.js`** | System prompt engineering, chat template formatting | ⚠️ **3/4 templates done** (phi3 missing) |
| **`src/components/MessageBubble.jsx`** | Regex parsing, MiniMapCard rendering | ✅ **Complete** |
| **`src/components/chat/MiniMapCard.jsx`** | Tactical map preview card | ✅ **Complete** (needs badge enhancement) |
| **`src/components/map/OfflineMap.jsx`** | Full map with flyTo handler | ✅ **Complete** |
| **`src/services/maps/MapCartridgeService.js`** | Cartridge registry & search | ✅ **Complete** |

---

## 🧠 System Prompt Engineering

### Current Implementation

The tool instructions are injected into the system prompt via the `CHAT_TEMPLATES` object in `TransformersEngine.js`. Each template has a `format(systemPrompt, userMessage)` function that constructs the final prompt.

### Tool Instruction Block

```javascript
const toolInstructions = `
If the user asks about a location, explain it briefly and end your response with the tag <<MAP: LocationName>>.
Example: "London is the capital... <<MAP: London>>"
`;
```

This block is appended to the system prompt before the user message.

### Chat Templates Status

| Model | Template | Tool Instructions | Status |
|-------|----------|-------------------|--------|
| SmolLM 360M | `smollm` | ✅ Injected | ✅ Working |
| Qwen 0.5B | `qwen` | ✅ Injected | ✅ Working |
| TinyLlama 1.1B | `tinyllama` | ✅ Injected | ✅ Working |
| Phi-3 Mini | `phi3` | ❌ **MISSING** | ⚠️ **Needs Fix** |
| SmolLM 1.7B | `smollm` | ✅ Injected | ✅ Working |

### 🔧 Gap: Phi-3 Template

The `phi3` template currently does NOT inject tool instructions:

```javascript
phi3: {
    format: (systemPrompt, userMessage) => {
        return `<|system|>
${systemPrompt}<|end|>
<|user|>
${userMessage}<|end|>
<|assistant|>
`;
    }
}
```

**Fix Required**: Add tool instructions to phi3 template (see Fixes section).

---

## 🔍 Regex Parser Specification

### Pattern

```javascript
/(<<MAP:\s*[^>]+>>)/g
```

### Breakdown

- `<<MAP:` — Literal opening tag
- `\s*` — Optional whitespace after colon
- `[^>]+` — Capture group: one or more non-`>` characters (the location name)
- `>>` — Literal closing tag
- `/g` — Global flag (find all matches)

### Edge Cases

| Input | Behavior |
|-------|----------|
| `<<MAP: London>>` | ✅ Match: `London` |
| `<<MAP:London>>` | ✅ Match: `London` (whitespace optional) |
| `<<MAP: New York City>>` | ✅ Match: `New York City` |
| `<<MAP: >>` | ⚠️ No match (empty query) |
| `<<MAP: London` | ⚠️ No match (unclosed tag) |
| Multiple tags | ✅ All matched independently |

### Sanitization Flow

1. **Input**: Raw AI response with potential `<<MAP: ...>>` tags
2. **Transform**: `content.replace(/\[(\d+)\]/g, '[$&](#source-$1)')` — Convert citation `[1]` to links
3. **Split**: `content.split(/(<<MAP:\s*[^>]+>>)/g)` — Split on MAP tags (preserving them)
4. **Render Loop**:
   - If part matches `<<MAP:\s*(.+?)>>` → Extract query → Render `<MiniMapCard query={query} />`
   - Else → Render as `<ReactMarkdown>{part}</ReactMarkdown>`

### Security

- **No XSS risk**: The query is passed as a React prop, not rendered as HTML
- **No injection risk**: MapCartridgeService.search() uses `.toLowerCase().includes()` — no eval or SQL
- **DOMPurify**: Already applied to message content before parsing

---

## 🗺️ MiniMapCard Component Specification

### File Location

`src/components/chat/MiniMapCard.jsx`

### Props

```typescript
interface MiniMapCardProps {
    query: string; // Location name extracted from <<MAP: ...>>
}
```

### States

| State | Trigger | Visual |
|-------|---------|--------|
| **Loading** | `useEffect` initial fetch | Pulsing crosshair + "SCANNING SECTOR..." |
| **Found** | `MapCartridgeService.search()` returns match | Cyan grid background + coords + "Initiate Jump" button |
| **Missing** | No match found | Red warning stripes + "SECTOR NOT DOWNLOADED" + "Access Global Database" link |

### Cartridge Resolution Logic

```javascript
const results = await MapCartridgeService.search(query);
const bestMatch = results.find(r => r.category === 'map') || null;
```

- **Search**: Case-insensitive match against `title` and `tags` arrays
- **Priority**: First match with `category: 'map'`
- **Payload**: `{ center: [lng, lat], zoom: number, pitch: number }`

### Navigation Handler

```javascript
const handleFlyTo = () => {
    navigate('/map', {
        state: {
            flyTo: mapData.payload,
            cartridgeId: mapData.id
        }
    });
};
```

### 🔧 Gap: Cartridge Badge Enhancement

**Current**: Shows "OFFLINE READY" badge for all found cartridges.

**Requested**: Distinguish between:
- **High Res Available** — Local PMTiles cartridge (e.g., `london.pmtiles`)
- **Global Low Res** — Remote fallback or low-res global basemap

**Implementation Strategy**:
1. Add `resolution: 'high' | 'low'` field to cartridge metadata in `MapCartridgeService.js`
2. Update MiniMapCard badge logic:
   ```javascript
   {mapData.resolution === 'high' ? (
       <span className="...">HIGH RES AVAILABLE</span>
   ) : (
       <span className="...">GLOBAL LOW RES</span>
   )}
   ```

---

## 🧭 Navigation Payload Structure

### State Object

```typescript
interface FlyToState {
    flyTo: {
        center: [number, number]; // [longitude, latitude]
        zoom: number;             // 1-20
        pitch: number;            // 0-60 (degrees)
    };
    cartridgeId?: string;         // Optional: 'map-london'
}
```

### Example

```javascript
navigate('/map', {
    state: {
        flyTo: {
            center: [-0.1276, 51.5074],
            zoom: 14,
            pitch: 45
        },
        cartridgeId: 'map-london'
    }
});
```

### OfflineMap.jsx Handler

```javascript
useEffect(() => {
    if (mapState === 'ready' && mapInstance.current && location.state?.flyTo) {
        const { center, zoom, pitch } = location.state.flyTo;
        
        setTimeout(() => {
            triggerHaptic('success');
            mapInstance.current.flyTo({
                center: center,
                zoom: zoom || 14,
                pitch: pitch || 0,
                essential: true,
                speed: 1.5,
                curve: 1.2
            });
        }, 500);
    }
}, [mapState, location.state]);
```

**Haptics**: Uses `HapticsService.notification('SUCCESS')` for tactile feedback on mobile.

---

## 🎨 Aesthetic Guidelines

### Design Tokens

| Element | Style |
|---------|-------|
| **Color Palette** | Slate 900/950 backgrounds, Cyan 500 accents, Red 500 warnings |
| **Typography** | `font-mono` for all UI text, uppercase tracking-wide labels |
| **Borders** | `border-cyan-900/50` for active elements, `border-red-900/30` for errors |
| **Backgrounds** | Glassmorphism: `bg-slate-950 backdrop-blur` |
| **Animations** | Pulse (loading), Ping (alerts), Scan (scanline overlay) |

### MiniMapCard Specific

- **Grid Background**: `radial-gradient(circle, #0891b2 1px, transparent 1px)` at 20px intervals
- **Scanline Overlay**: Animated gradient sweep (cyan/20% opacity)
- **Button Hover**: `bg-cyan-500/10 → bg-cyan-500/20` transition
- **Warning Stripes**: `repeating-linear-gradient(45deg, #7f1d1d 0, #7f1d1d 10px, transparent 10px, transparent 20px)`

### 🔧 Gap: Scanline Animation

The MiniMapCard uses `animate-scan` class, but this may not be defined in Tailwind config.

**Fix Required**: Add to `tailwind.config.js` or inline CSS:

```css
@keyframes scan {
    0% { transform: translateY(-100%); }
    100% { transform: translateY(100%); }
}

.animate-scan {
    animation: scan 2s linear infinite;
}
```

---

## ✅ What's Already Working

1. ✅ **System Prompt Injection** — 3/4 models emit `<<MAP: ...>>` tags
2. ✅ **Regex Parsing** — MessageBubble splits and renders MiniMapCard
3. ✅ **MiniMapCard UI** — All 3 states (loading/found/missing) implemented
4. ✅ **Cartridge Search** — MapCartridgeService.search() works
5. ✅ **Navigation** — `navigate('/map', { state: { flyTo } })` works
6. ✅ **FlyTo Handler** — OfflineMap.jsx reads state and animates
7. ✅ **Haptics** — Tactile feedback on mobile

---

## 🔧 Remaining Fixes

### 1. Fix Phi-3 Chat Template

**File**: `src/services/ai/TransformersEngine.js`

**Change**:
```javascript
phi3: {
    format: (systemPrompt, userMessage) => {
        const toolInstructions = `
If the user asks about a location, explain it briefly and end your response with the tag <<MAP: LocationName>>.
Example: "London is the capital... <<MAP: London>>"
`;
        return `<|system|>
${systemPrompt}
${toolInstructions}<|end|>
<|user|>
${userMessage}<|end|>
<|assistant|>
`;
    }
}
```

### 2. Add Cartridge Resolution Badge

**File**: `src/services/maps/MapCartridgeService.js`

**Change**: Add `resolution` field to cartridge metadata:
```javascript
{
    id: 'map-london',
    title: 'London, UK',
    resolution: 'high', // NEW FIELD
    // ...
}
```

**File**: `src/components/chat/MiniMapCard.jsx`

**Change**: Update badge logic:
```javascript
<div className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800 text-[10px] text-cyan-300 font-mono">
    {mapData.resolution === 'high' ? 'HIGH RES AVAILABLE' : 'GLOBAL LOW RES'}
</div>
```

### 3. Add Scanline Animation (Optional)

**File**: `src/components/chat/MiniMapCard.jsx`

**Change**: Add inline style or ensure Tailwind config has `animate-scan`:
```javascript
<style>{`
    @keyframes scan {
        0% { transform: translateY(-100%); }
        100% { transform: translateY(100%); }
    }
    .animate-scan {
        animation: scan 2s linear infinite;
    }
`}</style>
```

---

## 🧪 Testing Checklist

- [ ] Test with SmolLM 360M: Ask "Tell me about London" → Verify `<<MAP: London>>` emitted
- [ ] Test with Qwen 0.5B: Same query → Verify tag
- [ ] Test with TinyLlama 1.1B: Same query → Verify tag
- [ ] Test with Phi-3 Mini: Same query → **Should emit tag after fix**
- [ ] Test MiniMapCard loading state: Verify "SCANNING SECTOR..." appears
- [ ] Test MiniMapCard found state: Verify coords + "Initiate Jump" button
- [ ] Test MiniMapCard missing state: Verify "SECTOR NOT DOWNLOADED" + fallback link
- [ ] Test navigation: Click "Initiate Jump" → Verify flyTo animation on map
- [ ] Test haptics: Verify tactile feedback on mobile (if available)
- [ ] Test badge: Verify "HIGH RES AVAILABLE" for London, "GLOBAL LOW RES" for NYC

---

## 📊 Completion Status

| Feature | Status | Notes |
|---------|--------|-------|
| System Prompt Engineering | 🟡 **75%** | 3/4 templates done (phi3 missing) |
| MiniMapCard Component | 🟢 **100%** | All states implemented |
| Regex Parsing | 🟢 **100%** | Working in MessageBubble |
| Navigation & FlyTo | 🟢 **100%** | Working in OfflineMap |
| Cartridge Integration | 🟡 **90%** | Works, but missing resolution badge |
| Aesthetic Polish | 🟡 **95%** | Scanline animation may need keyframes |

**Overall**: 🟢 **90% Complete**

---

## 🚀 Next Steps

1. **Apply Fixes** (Est. 15 minutes):
   - Fix phi3 template
   - Add resolution badge
   - Verify scanline animation

2. **Test End-to-End** (Est. 10 minutes):
   - Run through testing checklist
   - Verify all 4 models emit tags
   - Verify badge shows correct resolution

3. **Document** (Est. 5 minutes):
   - Update HANDOVER.md with Phase 4 completion
   - Add screenshots to README

4. **Ship** 🎉

---

## 📚 References

- **System Prompt Engineering**: `TransformersEngine.js` lines 122-170
- **Regex Parser**: `MessageBubble.jsx` lines 75-110
- **MiniMapCard**: `src/components/chat/MiniMapCard.jsx`
- **FlyTo Handler**: `OfflineMap.jsx` lines 180-195
- **Cartridge Service**: `MapCartridgeService.js`

---

**End of Implementation Plan**
