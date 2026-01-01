# Interactive Configuration Form - Design Document

## Overview

This document outlines design options for an interactive form that allows users to modify boring log data through a GUI instead of editing JSON directly.

---

## 1. Form Layout Approaches

### Option A: Single Scrollable Form

A single page with all sections stacked vertically, divided by clear section headers.

```
┌─────────────────────────────────┐
│ Boring Information              │
│ ├─ ID, Project, Client          │
│ ├─ Dates, Location, Elevation   │
│ └─ Equipment, Method, Logged By │
├─────────────────────────────────┤
│ Consultant & Driller            │
│ ├─ Consultant fields            │
│ └─ Driller fields               │
├─────────────────────────────────┤
│ Soil Layers                     │
│ └─ [Layer editing UI]           │
├─────────────────────────────────┤
│ Samples                         │
│ └─ [Sample editing UI]          │
├─────────────────────────────────┤
│ Groundwater                     │
├─────────────────────────────────┤
│ Well Construction               │
└─────────────────────────────────┘
```

**Pros:**
- Simple mental model - everything visible
- Easy to implement
- Good for smaller datasets
- No hidden state

**Cons:**
- Can become overwhelming with many layers/samples
- Lots of scrolling
- Hard to see relationship between form and preview

**Best for:** Simple boring logs, users who want to see everything at once

---

### Option B: Tabbed Interface

Horizontal tabs at the top, each tab shows one section.

```
┌─────────────────────────────────────────────────────┐
│ [Boring] [People] [Layers] [Samples] [GW] [Well]    │
├─────────────────────────────────────────────────────┤
│                                                     │
│   Content for selected tab                          │
│                                                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Pros:**
- Clean, organized interface
- Each section gets full space
- Familiar pattern (like current CSV/JSON tabs)
- Reduces cognitive load per screen

**Cons:**
- Can't see multiple sections at once
- Easy to forget what's in other tabs
- More clicks to navigate
- Tab count could grow unwieldy

**Best for:** Complex boring logs, users who work section-by-section

---

### Option C: Accordion/Collapsible Sections

All sections visible as headers, click to expand one or more.

```
┌─────────────────────────────────┐
│ ▼ Boring Information            │
│   ├─ [expanded fields]          │
│   └─ [expanded fields]          │
├─────────────────────────────────┤
│ ▶ Consultant & Driller          │
├─────────────────────────────────┤
│ ▶ Soil Layers (4)               │
├─────────────────────────────────┤
│ ▼ Samples (7)                   │
│   └─ [expanded content]         │
├─────────────────────────────────┤
│ ▶ Groundwater                   │
├─────────────────────────────────┤
│ ▶ Well Construction             │
└─────────────────────────────────┘
```

**Pros:**
- Shows all sections at a glance
- User controls what's visible
- Can expand multiple sections
- Shows counts (e.g., "4 layers")
- Compact when collapsed

**Cons:**
- Expanding multiple sections still leads to scrolling
- Interaction required to see content
- Animation can feel slow

**Best for:** Users who frequently switch between sections

---

### Option D: Sidebar Navigation

Fixed sidebar with section links, main area shows selected section.

```
┌──────────┬──────────────────────────────┐
│ Boring   │                              │
│ People   │   Selected section content   │
│ Layers   │                              │
│ Samples  │                              │
│ GW       │                              │
│ Well     │                              │
│          │                              │
│ ──────── │                              │
│ [Apply]  │                              │
│ [Reset]  │                              │
└──────────┴──────────────────────────────┘
```

**Pros:**
- Navigation always visible
- Clean separation of nav and content
- Good for larger screens
- Can show validation status per section in sidebar

**Cons:**
- Takes horizontal space
- May feel like overkill for simple forms
- Less suitable for narrow screens

**Best for:** Desktop-focused users, complex configurations

---

## 2. Layer/Sample Editing Approaches

### Option A: Table-Based (Spreadsheet-like)

Rows represent layers/samples, columns are fields.

```
┌─────────┬─────────┬──────┬─────────────────┬──────────┐
│ Top (ft)│ Bot (ft)│ USCS │ Description     │ Moisture │
├─────────┼─────────┼──────┼─────────────────┼──────────┤
│ 0.0     │ 3.5     │ SM ▼ │ Brown silty SAND│ moist  ▼ │
├─────────┼─────────┼──────┼─────────────────┼──────────┤
│ 3.5     │ 12.0    │ CL ▼ │ Gray lean CLAY  │ wet    ▼ │
├─────────┼─────────┼──────┼─────────────────┼──────────┤
│ [+ Add Layer]                                         │
└───────────────────────────────────────────────────────┘
```

**Pros:**
- Familiar spreadsheet pattern
- Efficient for bulk editing
- Easy to compare values across rows
- Compact display of many items
- Tab/Enter navigation between cells

**Cons:**
- Limited space for long descriptions
- Can feel cramped
- Hard to show nested data (e.g., blows array)
- Horizontal scrolling on mobile

**Best for:** Users comfortable with spreadsheets, bulk data entry

---

### Option B: Card-Based

Each layer/sample is a card that can be expanded.

```
┌─────────────────────────────────────────┐
│ Layer 1: SM (0.0 - 3.5 ft)         [▼]  │
│ Brown silty SAND                   [✕]  │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│ Layer 2: CL (3.5 - 12.0 ft)        [▼]  │
│ Gray lean CLAY                     [✕]  │
│ ─────────────────────────────────────── │
│ Depth Top:    [3.5    ]                 │
│ Depth Bottom: [12.0   ]                 │
│ USCS:         [CL        ▼]             │
│ Description:  [Gray lean CLAY    ]      │
│ Moisture:     [wet       ▼]             │
│ Odor:         [none      ▼]             │
│ PID:          [0.5     ]                │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│ [+ Add Layer]                           │
└─────────────────────────────────────────┘
```

**Pros:**
- Clear visual grouping
- Room for all fields
- Easy drag-to-reorder
- Good for complex items (samples with blows)
- Mobile-friendly

**Cons:**
- Takes more vertical space
- Harder to compare across items
- More clicks to edit

**Best for:** Detailed editing, mobile users, complex sample data

---

### Option C: Inline Diagram Editing

Click directly on the diagram to edit.

```
┌─────────────────────────────────┐
│      [Click layer to edit]      │
│  ┌─────────────────────────┐    │
│  │ SM - Brown silty SAND   │◄───┼── Click opens popover
│  │     [Edit] [Delete]     │    │
│  └─────────────────────────┘    │
│  ┌─────────────────────────┐    │
│  │ CL - Gray lean CLAY     │    │
│  └─────────────────────────┘    │
└─────────────────────────────────┘
```

**Pros:**
- Direct manipulation - intuitive
- See changes in context immediately
- Spatial relationship preserved
- Feels modern/interactive

**Cons:**
- Complex to implement (SVG interaction)
- Limited space for editing controls
- Hard to add new layers at specific depths
- Accessibility challenges

**Best for:** Visual thinkers, quick edits, touch interfaces

---

### Option D: Modal Dialogs

List shows summary, click opens modal for full editing.

```
┌─────────────────────────────────┐    ┌──────────────────────┐
│ Layers:                         │    │ Edit Layer           │
│ • SM (0-3.5 ft) [Edit]          │───►│                      │
│ • CL (3.5-12 ft) [Edit]         │    │ Top: [3.5]           │
│ • SP (12-22 ft) [Edit]          │    │ Bottom: [12.0]       │
│ [+ Add Layer]                   │    │ USCS: [CL ▼]         │
└─────────────────────────────────┘    │ ...                  │
                                       │ [Cancel] [Save]      │
                                       └──────────────────────┘
```

**Pros:**
- Full focus on one item
- Room for all fields and validation
- Clear save/cancel actions
- Prevents accidental changes

**Cons:**
- Context switch (can't see diagram)
- More clicks
- Can feel heavy for small edits
- Interrupts flow

**Best for:** Careful editing, complex validation, less frequent edits

---

## 3. Live Preview Options

### Option A: Real-time Updates

Diagram updates as you type each character.

**Pros:**
- Immediate feedback
- See impact of changes instantly
- Engaging/interactive feel

**Cons:**
- Performance overhead (re-render on every keystroke)
- Can be distracting while typing
- May show invalid intermediate states

**Implementation:** Debounce updates (e.g., 300ms after last keystroke)

---

### Option B: Apply Button

Changes only reflect when user clicks "Apply" or "Update Preview".

**Pros:**
- User controls when to update
- No performance issues
- Can batch multiple changes
- Clear before/after comparison

**Cons:**
- Extra click required
- Easy to forget to apply
- Can't see impact until applied

**Implementation:** Show "unsaved changes" indicator, keyboard shortcut (Ctrl+Enter)

---

### Option C: Hybrid (Blur/Focus)

Update when field loses focus (blur event), not on every keystroke.

**Pros:**
- Balances immediacy and performance
- Updates feel natural (when you move to next field)
- No explicit button needed

**Cons:**
- Still updates during editing session
- May miss updates if user doesn't blur (clicks directly on preview)

**Implementation:** Update on blur + periodic auto-save

---

## 4. Layout: Form + Preview Relationship

### Option A: Side-by-Side Split

```
┌────────────────────┬────────────────────┐
│                    │                    │
│    Edit Form       │    SVG Preview     │
│                    │                    │
│                    │                    │
└────────────────────┴────────────────────┘
```

**Pros:**
- See both simultaneously
- Direct correlation visible
- Professional feel

**Cons:**
- Each panel gets less width
- Not great on narrow screens
- Form may need scrolling

---

### Option B: Stacked (Form Above Preview)

```
┌────────────────────────────────────────┐
│              Edit Form                 │
├────────────────────────────────────────┤
│              SVG Preview               │
└────────────────────────────────────────┘
```

**Pros:**
- Full width for both
- Works on all screen sizes
- Natural top-to-bottom flow

**Cons:**
- Can't see both without scrolling
- Preview may be off-screen while editing

---

### Option C: Toggleable Panel

Form slides out over preview, or preview is collapsible.

```
┌─────────────────────────────────────────┐
│ [Edit ▼]                                │
├─────────────────────────────────────────┤
│                                         │
│              SVG Preview                │
│                                         │
└─────────────────────────────────────────┘

        ↓ Click "Edit" ↓

┌─────────────────────────────────────────┐
│ [Edit ▲]                                │
│ ┌─────────────────────────────────────┐ │
│ │ Form fields...                      │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│              SVG Preview (smaller)      │
└─────────────────────────────────────────┘
```

**Pros:**
- Maximizes space for active task
- User controls visibility
- Flexible

**Cons:**
- More complex interaction
- State to manage (open/closed)

---

## 5. Validation & Feedback

### Field-Level Validation

- Red border on invalid fields
- Inline error message below field
- Validate on blur or after delay

```
Depth Top: [abc    ]
           ⚠ Must be a number
```

### Cross-Field Validation

- Layer depths must not overlap
- Sample depth must be within boring total depth
- Screen bottom must be > screen top

### Visual Indicators on Diagram

- Highlight problem areas
- Warning icons on affected elements
- Tooltip with error details

---

## 6. Recommendation

Based on typical use cases for boring log editing:

| Aspect | Recommended | Rationale |
|--------|-------------|-----------|
| Form Layout | **Accordion** | Shows all sections, user controls focus |
| Layer/Sample | **Card-based** | Handles complex data (blows array), mobile-friendly |
| Preview | **Hybrid (blur)** | Balance of immediacy and performance |
| Layout | **Side-by-side** (desktop), **Stacked** (mobile) | Responsive approach |
| Validation | **Inline + summary** | Immediate feedback + overview before save |

---

## Decisions

The following options were selected:

| Aspect | Decision |
|--------|----------|
| Form Layout | **Accordion/Collapsible Sections** |
| Layer/Sample Editing | **Card-based** |
| Live Preview | **Hybrid (update on blur)** |
| Layout | **Side-by-side** (desktop) / **Stacked** (mobile) |
| Validation | **Inline + summary** |

## Implementation Plan

### Phase 1: Foundation
- [ ] Create form container with responsive split/stacked layout
- [ ] Add accordion component for section management
- [ ] Set up data binding (form ↔ boringLog data)
- [ ] Implement blur-triggered preview updates

### Phase 2: Boring Metadata Section
- [ ] Basic fields: ID, project, client
- [ ] Date fields (single date or start/complete)
- [ ] Location fields with coordinate system
- [ ] Equipment, method, logged by fields

### Phase 3: People Section
- [ ] Consultant fields (company, contact, phone)
- [ ] Driller fields (company, name, license)

### Phase 4: Soil Layers Section
- [ ] Card component for individual layers
- [ ] Add/remove layer functionality
- [ ] USCS dropdown with pattern preview
- [ ] Depth validation (no overlaps)
- [ ] Drag-to-reorder layers

### Phase 5: Samples Section
- [ ] Card component for samples
- [ ] Support both single depth and depth range
- [ ] SPT blows input (3 fields)
- [ ] Sample type dropdown

### Phase 6: Groundwater & Well
- [ ] Groundwater depth and notes
- [ ] Well construction fields
- [ ] Visual validation (screen within boring depth, etc.)

### Phase 7: Polish
- [ ] Validation summary panel
- [ ] Keyboard navigation
- [ ] Mobile responsiveness testing
- [ ] Accessibility review
