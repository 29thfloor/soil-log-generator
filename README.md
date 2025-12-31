# Soil Boring Log Generator

A web-based tool for creating soil boring log diagrams with USCS (Unified Soil Classification System) soil patterns.

**Live Demo:** https://soil-log-generator.vercel.app

## Features

- **SVG Rendering** - Scalable vector diagrams with USCS-style pattern fills
- **15 USCS Soil Types** - GW, GP, GM, GC, SW, SP, SM, SC, ML, MH, CL, CH, OL, OH, PT
- **SPT Data** - Standard Penetration Test blow counts with N-value calculation
- **Sample Types** - SPT, Shelby tube, grab samples, and more
- **Groundwater Level** - Visual indicator with depth annotation
- **Environmental Data** - Moisture, odor, and PID readings (columns shown only when data exists)
- **Well Construction** - Side panel diagram with casing, screen, seal, and filter pack
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
});
```

## Data Schema

```json
{
  "boring": {
    "id": "B-1",
    "project": "Phase II ESA - Industrial Site",
    "client": "State Environmental Agency",
    "consultant": {
      "company": "Geotechnical Services Inc.",
      "contact": "John Smith, P.E.",
      "phone": "555-123-4567"
    },
    "driller": {
      "company": "ABC Drilling Co.",
      "name": "Mike Johnson",
      "license": "DRL-12345"
    },
    "location": {
      "coords": [34.0522, -118.2437],
      "system": "WGS84"
    },
    "elevation": 125.5,
    "date": "2025-01-15",
    "time": "08:30",
    "weather": "Clear, 65°F",
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
      "description": "Brown silty SAND, fine grained, loose",
      "moisture": "moist",
      "odor": "petroleum",
      "pid": 45.2
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
  ],
  "well": {
    "type": "monitoring",
    "casingDiameter": 2.0,
    "casingMaterial": "PVC",
    "screenTop": 15.0,
    "screenBottom": 25.0,
    "screenSlotSize": 0.010,
    "filterPack": "8-12 silica sand",
    "sealTop": 0.0,
    "sealBottom": 14.0,
    "sealMaterial": "bentonite grout"
  }
}
```

### Schema Field Reference

| Section | Field | Description |
|---------|-------|-------------|
| **boring** | id | Boring identifier (e.g., "B-1") |
| | project | Project name |
| | client | Client name |
| | consultant.company | Consulting firm name |
| | consultant.contact | Consultant contact name |
| | consultant.phone | Consultant phone number |
| | driller.company | Drilling company name |
| | driller.name | Driller name |
| | driller.license | Driller license number |
| | location.coords | [lat, long] or [x, y] coordinates |
| | location.system | Coordinate system (e.g., "WGS84") |
| | elevation | Ground surface elevation (ft) |
| | date | Date of drilling (single-day) |
| | dateStart | Start date (multi-day drilling) |
| | dateComplete | Completion date (multi-day drilling) |
| | time | Time of drilling |
| | weather | Weather conditions |
| | equipment | Drill rig model/type |
| | loggedBy | Field geologist/engineer name |
| | drillingMethod | HSA, mud rotary, sonic, etc. |
| | totalDepth | Total boring depth (ft) |
| **groundwater** | depth | Depth to groundwater (ft) |
| | note | Groundwater notes |
| **layers[]** | depthTop | Top of layer (ft) |
| | depthBottom | Bottom of layer (ft) |
| | uscs | USCS soil classification |
| | description | Soil description |
| | moisture | dry, moist, wet, saturated |
| | odor | none, petroleum, chlorinated, organic |
| | pid | PID reading (ppm) |
| **samples[]** | depth | Sample depth (ft) - single point |
| | depthTop | Top of sample interval (ft) |
| | depthBottom | Bottom of sample interval (ft) |
| | type | SPT, SHELBY, GRAB, etc. |
| | id | Sample identifier |
| | blows | [blow1, blow2, blow3] for SPT |
| | recovery | Sample recovery (in) |
| **well** | type | Well type (monitoring, etc.) |
| | casingDiameter | Casing diameter (in) |
| | casingMaterial | Casing material |
| | screenTop | Top of screen (ft) |
| | screenBottom | Bottom of screen (ft) |
| | screenSlotSize | Screen slot size (in) |
| | filterPack | Filter pack description |
| | sealTop | Top of seal (ft) |
| | sealBottom | Bottom of seal (ft) |
| | sealMaterial | Seal material |

## CSV Import Format

### All Columns

```
boring_id, project, client, date, time, weather,
consultant_company, consultant_contact, consultant_phone,
driller_company, driller_name, driller_license,
elevation, coord_1, coord_2, coord_system,
groundwater_depth, groundwater_note,
well_type, well_casing_diameter, well_casing_material,
well_screen_top, well_screen_bottom, well_screen_slot_size,
well_filter_pack, well_seal_top, well_seal_bottom, well_seal_material,
depth_top, depth_bottom, uscs, description, moisture, odor, pid,
sample_depth, sample_type, sample_id, blow1, blow2, blow3, recovery
```

### Example

```csv
boring_id,project,client,date,time,weather,consultant_company,depth_top,depth_bottom,uscs,description,moisture,odor,pid,sample_depth,sample_type,sample_id,blow1,blow2,blow3,recovery
B-1,Phase II ESA,State EPA,2025-01-20,09:15,Clear 65F,Geo Services Inc,0,4,SM,"Brown silty SAND",moist,petroleum,35.2,2,SPT,S-1,3,4,5,18
B-1,,,,,,,4,10,CL,"Gray lean CLAY",wet,none,1.2,5,SPT,S-2,7,9,11,16
```

## Soil Classifications

### USCS Codes

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

### Extended Codes

| Code | Description |
|------|-------------|
| TS | Topsoil |
| FILL | Fill material |
| ROCK | Rock |
| BR | Bedrock |
| QUA | Quartz |
| ARG | Argillite |
| MK | Micaceous silt |

Custom codes are also supported - unknown codes will display with a default pattern.

## Comparison to Professional Boring Logs

Based on analysis of professional boring log examples, this tool implements the core features while some advanced features remain on the roadmap.

### Implemented

| Feature | Status |
|---------|--------|
| Header with project info, boring ID, location | Implemented |
| Coordinates with user-defined system | Implemented |
| Surface elevation | Implemented |
| Depth column with tick marks | Implemented |
| **Elevation column** | Implemented - calculated from surface elevation |
| USCS classification with pattern fills | Implemented |
| **Non-USCS codes** | Implemented - TS, FILL, ROCK, QUA, ARG, custom |
| Soil description column | Implemented |
| SPT blow counts (3 intervals) + N-value | Implemented |
| Sample recovery | Implemented |
| Sample type indicators | Implemented |
| **Sample depth ranges** | Implemented - shows interval like "S-1 (9-10)" |
| Groundwater level indicator | Implemented |
| Moisture column | Implemented |
| PID readings (conditional column) | Implemented |
| Odor column (conditional) | Implemented |
| Well construction diagram | Implemented |
| Dynamic legend | Implemented |
| SVG/PNG export | Implemented |
| **Equipment field** | Implemented |
| **Logged by field** | Implemented |
| **Drilling method** | Implemented |
| **Separate start/complete dates** | Implemented |

### Roadmap

These features are commonly found in professional boring logs but not yet implemented:

| Feature | Description |
|---------|-------------|
| Water levels column | First encountered vs. completion depth markers |
| Sheet numbering | "Sheet 1 of 2" pagination for multi-page logs |
| Remarks section | Additional notes area |
| Station field | Survey station reference |
| Footer disclaimer | Professional liability text |
| Logo/branding area | Company logo placement |
| Graphic scale bar | Visual depth reference |
| Plastic/liquid limits | Atterberg limits for cohesive soils |
| Hammer type/weight | SPT equipment details |

### Example Sources

Professional boring log examples were reviewed from geotechnical consulting firms to identify standard industry practices. Common formats include single-column logs with integrated well diagrams, multi-page layouts for deep borings, and environmental logs with contaminant tracking columns.

## Development

```bash
# Start local server
python3 -m http.server 8080

# Open in browser
open http://localhost:8080
```

## License

MIT
