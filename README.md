# Soil Boring Log Generator

A web-based tool for creating soil boring log diagrams with USCS (Unified Soil Classification System) soil patterns.

**Live Demo:** https://soil-log-generator.vercel.app

## Features

- **SVG Rendering** - Scalable vector diagrams with USCS-style pattern fills
- **15 USCS Soil Types** - GW, GP, GM, GC, SW, SP, SM, SC, ML, MH, CL, CH, OL, OH, PT
- **SPT Data** - Standard Penetration Test blow counts with N-value calculation
- **Sample Types** - SPT, Shelby tube, grab samples, and more
- **Groundwater Level** - Visual indicator with depth annotation
- **CSV Import** - Import boring log data from spreadsheets
- **Dynamic Legend** - Shows only soil types and sample types used in the diagram
- **Export** - Download as SVG or PNG

## Usage

### Component API

```js
const container = document.getElementById('log-container');
const boringLog = new BoringLog(container);

// Set data and render
boringLog.setData(data);

// Retrieve current data
const data = boringLog.getData();
```

### Configuration Options

```js
const boringLog = new BoringLog(container, {
  showLegend: true,      // Show/hide legend
  depthScale: 20,        // Pixels per depth unit
  width: 700             // SVG width
});
```

## Data Schema

```json
{
  "boring": {
    "id": "B-1",
    "project": "Site Investigation Project",
    "location": {
      "coords": [34.0522, -118.2437],
      "system": "WGS84"
    },
    "elevation": 125.5,
    "date": "2025-01-15",
    "driller": "ABC Drilling Co.",
    "totalDepth": 30.0
  },
  "groundwater": {
    "depth": 12.5,
    "note": "Stabilized after 24 hrs"
  },
  "layers": [
    {
      "depthTop": 0.0,
      "depthBottom": 3.5,
      "uscs": "SM",
      "description": "Brown silty SAND, fine grained, loose, moist"
    }
  ],
  "samples": [
    {
      "depth": 2.0,
      "type": "SPT",
      "id": "S-1",
      "blows": [4, 5, 6],
      "recovery": 18
    }
  ]
}
```

## CSV Import Format

```csv
boring_id,project,date,driller,elevation,coord_1,coord_2,coord_system,groundwater_depth,groundwater_note,depth_top,depth_bottom,uscs,description,sample_depth,sample_type,sample_id,blow1,blow2,blow3,recovery
B-1,Site Investigation,2025-01-15,ABC Drilling,125.5,34.0522,-118.2437,WGS84,12.5,Stabilized after 24 hrs,0,3.5,SM,"Brown silty SAND, loose",2,SPT,S-1,4,5,6,18
```

## USCS Soil Classifications

| Code | Description |
|------|-------------|
| GW | Well-graded gravel |
| GP | Poorly graded gravel |
| GM | Silty gravel |
| GC | Clayey gravel |
| SW | Well-graded sand |
| SP | Poorly graded sand |
| SM | Silty sand |
| SC | Clayey sand |
| ML | Silt (low plasticity) |
| MH | Silt (high plasticity) |
| CL | Clay (low plasticity) |
| CH | Clay (high plasticity) |
| OL | Organic silt |
| OH | Organic clay |
| PT | Peat |

## Development

```bash
# Start local server
python3 -m http.server 8080

# Open in browser
open http://localhost:8080
```

## License

MIT
