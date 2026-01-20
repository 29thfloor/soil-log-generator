# Geotechnical Data Format Standards

This document outlines industry-standard data exchange formats for soil boring logs and evaluates the complexity of adding support for them.

## Current State

This project uses a **custom CSV format** designed for simplicity. Each row represents a soil layer, with boring metadata repeated on each row. While easy to create in spreadsheets, this format is not interoperable with professional geotechnical software.

---

## Industry Standards

### AGS Format (UK)

**Association of Geotechnical and Geoenvironmental Specialists**

The AGS format is the industry-standard exchange format for geotechnical data in the UK, first published in 1992. It has been adopted in most specifications for ground investigations within the UK and by organizations in other countries.

#### Structure

- **Text-based, CSV-like format** - can be opened in any text editor
- **Hierarchical groups** - data organized into predefined groups by subject area
- **Self-describing** - includes headers, units, and data types

#### Key Groups for Boring Logs

| Group | Description |
|-------|-------------|
| PROJ | Project information (one row per file) |
| LOCA | Location/borehole data (coordinates, elevation, depth) |
| GEOL | Geology/stratigraphy descriptions |
| SAMP | Sample information |
| ISPT | In-situ SPT test results |
| WSTG | Groundwater strikes/levels |
| MONG | Monitoring installations (wells) |

#### Example File Structure

```
"GROUP","PROJ"
"HEADING","PROJ_ID","PROJ_NAME","PROJ_LOC","PROJ_CLNT","PROJ_CONT"
"UNIT","","","","",""
"TYPE","ID","X","X","X","X"
"DATA","12345","Phase II ESA","Industrial Site","State EPA","Geo Services Inc"

"GROUP","LOCA"
"HEADING","LOCA_ID","LOCA_NATE","LOCA_NATN","LOCA_GL","LOCA_FDEP"
"UNIT","","m","m","m","m"
"TYPE","ID","2DP","2DP","2DP","2DP"
"DATA","B-1","523145.00","184329.00","38.25","9.14"

"GROUP","GEOL"
"HEADING","LOCA_ID","GEOL_TOP","GEOL_BASE","GEOL_DESC","GEOL_LEG"
"UNIT","","m","m","",""
"TYPE","ID","2DP","2DP","X","X"
"DATA","B-1","0.00","1.07","Brown silty SAND, fine grained, loose","SM"
"DATA","B-1","1.07","3.66","Gray lean CLAY, stiff","CL"
```

#### Available Tools

| Tool | Language | Notes |
|------|----------|-------|
| [python-ags4](https://github.com/asitha-sena/python-ags4) | Python | Read, write, validate AGS4 files |
| [Open GeoTechnical](https://open-geotechnical.github.io/) | Multi | Project aims to support JS, but no npm package exists yet |
| [AGS Validator](https://www.ags.org.uk/data-format/ags-validator/) | Web | Official online validation tool |

**No JavaScript/npm library currently exists for AGS parsing.**

---

### DIGGS Format (US)

**Data Interchange for Geotechnical and Geoenvironmental Specialists**

DIGGS is an XML-based data exchange standard developed by the Geo-Institute of ASCE. Version 1.0 combines data dictionaries from AGS, University of Florida, and COSMOS.

#### Structure

- **XML-based** - uses XML schema for validation
- **Comprehensive** - covers geotechnical, geoenvironmental, deep foundations, and borehole geophysics
- **GML-compatible** - location data uses Geographic Markup Language

#### Example Structure

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Diggs xmlns="http://diggsml.org/schemas/2.6">
  <Project gml:id="proj_1">
    <name>Phase II ESA</name>
    <client>State EPA</client>
  </Project>
  <SamplingActivity gml:id="bh_1">
    <name>B-1</name>
    <location>
      <Point>
        <pos>34.0522 -118.2437</pos>
      </Point>
    </location>
    <Lithology>
      <LithologyInterval>
        <topDepth>0.0</topDepth>
        <baseDepth>1.07</baseDepth>
        <description>Brown silty SAND</description>
        <classification>SM</classification>
      </LithologyInterval>
    </Lithology>
  </SamplingActivity>
</Diggs>
```

#### Available Tools

| Tool | Language | Notes |
|------|----------|-------|
| [DIGGS Data Processing](https://github.com/DIGGSml) | Python | Open-source converter tools |
| Standard XML parsers | Any | Can use native XML parsing |

---

## Complexity Assessment

### AGS Import Support

| Aspect | Complexity | Notes |
|--------|------------|-------|
| **Parser** | Medium | No JS library exists; must write custom parser |
| **Group handling** | Medium | Need to handle PROJ, LOCA, GEOL, SAMP, ISPT, WSTG, MONG |
| **Data mapping** | Low | AGS fields map reasonably well to our schema |
| **Validation** | Medium | AGS has strict validation rules |
| **Unit conversion** | Medium | AGS uses metric; may need ft↔m conversion |

**Implementation approach:**
1. Write line-by-line parser to extract groups
2. Parse CSV-like rows within each group
3. Map AGS fields to internal schema:
   - LOCA → boring (id, location, elevation, totalDepth)
   - GEOL → layers (depthTop, depthBottom, description, uscs)
   - SAMP + ISPT → samples (depth, type, blows, recovery)
   - WSTG → groundwater
   - MONG → well

### AGS Export Support

| Aspect | Complexity | Notes |
|--------|------------|-------|
| **Serialization** | Low-Medium | Straightforward string formatting |
| **Group generation** | Medium | Must generate proper GROUP/HEADING/UNIT/TYPE/DATA rows |
| **Field mapping** | Medium | Some fields may not have AGS equivalents |
| **Validation** | Medium | Should validate output against AGS rules |

### DIGGS Import Support

| Aspect | Complexity | Notes |
|--------|------------|-------|
| **Parser** | Low | Can use browser's DOMParser for XML |
| **Schema complexity** | High | DIGGS schema is large and complex |
| **Data mapping** | Medium-High | Nested XML structure requires careful traversal |
| **Namespace handling** | Medium | Must handle XML namespaces (DIGGS, GML) |

### DIGGS Export Support

| Aspect | Complexity | Notes |
|--------|------------|-------|
| **Serialization** | Medium | XML generation with proper namespaces |
| **Schema compliance** | High | Must conform to DIGGS XSD schema |
| **Completeness** | Medium | Many optional elements to consider |

---

## Recommendation

| Format | Priority | Rationale |
|--------|----------|-----------|
| **AGS Import** | High | Most common format for data exchange; enables importing existing project data |
| **AGS Export** | Medium | Allows sharing data with other tools |
| **DIGGS Import** | Low | Less common; XML parsing is straightforward if needed |
| **DIGGS Export** | Low | Complex schema; limited demand |

### Suggested Implementation Order

1. **AGS Import** - Highest value; unlocks existing datasets
2. **AGS Export** - Completes bidirectional AGS support
3. **DIGGS Import** - Add if user demand warrants
4. **DIGGS Export** - Add if user demand warrants

---

## References

- [AGS Data Format](https://www.ags.org.uk/data-format/) - Official AGS specification
- [AGS4 Developers Guide](https://open-geotechnical.github.io/unofficial-ags4-guide/intro.html) - Open GeoTechnical
- [python-ags4](https://github.com/asitha-sena/python-ags4) - Python library (reference implementation)
- [DIGGS Standard](https://www.geoinstitute.org/committees/codes-and-standards/diggs-standard) - Geo-Institute
- [DIGGS Brochure](https://www.geoinstitute.org/sites/default/files/inline-files/DIGGS+Brochure.pdf) - Overview PDF
