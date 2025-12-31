/**
 * CSV Parser for Boring Log Data
 * Converts CSV spreadsheet data into the boring log JSON schema
 */

/**
 * Parse CSV content into boring log data structure
 * @param {string} csvContent - Raw CSV text
 * @param {object} options - Parser options
 * @returns {object} Boring log data object
 */
function parseBoringLogCSV(csvContent, options = {}) {
  const defaults = {
    delimiter: ',',
    boringId: 'B-1',
    project: 'Imported Project',
    date: new Date().toISOString().split('T')[0],
    driller: 'Unknown'
  };

  const config = { ...defaults, ...options };

  // Parse CSV into rows
  const rows = parseCSVRows(csvContent, config.delimiter);
  if (rows.length < 2) {
    throw new Error('CSV must have a header row and at least one data row');
  }

  // Extract header and normalize column names
  const header = rows[0].map(col => normalizeColumnName(col));
  const dataRows = rows.slice(1).filter(row => row.some(cell => cell.trim()));

  // Build the data structure
  const layers = [];
  const samples = [];
  let maxDepth = 0;
  let groundwaterDepth = null;
  let groundwaterNote = null;

  // Track metadata from CSV if present
  let metaBoringId = config.boringId;
  let metaProject = config.project;
  let metaClient = null;
  let metaDate = config.date;
  let metaTime = null;
  let metaWeather = null;
  let metaElevation = null;
  let metaCoord1 = null;
  let metaCoord2 = null;
  let metaCoordSystem = null;

  // Consultant info
  let consultantCompany = null;
  let consultantContact = null;
  let consultantPhone = null;

  // Driller info (can be string or object)
  let drillerCompany = null;
  let drillerName = null;
  let drillerLicense = null;

  // Well construction
  let wellType = null;
  let wellCasingDiameter = null;
  let wellCasingMaterial = null;
  let wellScreenTop = null;
  let wellScreenBottom = null;
  let wellScreenSlotSize = null;
  let wellFilterPack = null;
  let wellSealTop = null;
  let wellSealBottom = null;
  let wellSealMaterial = null;

  // Column index mapping
  const colIndex = {};
  header.forEach((col, i) => {
    colIndex[col] = i;
  });

  // Helper to get cell value
  const getCell = (row, colName) => {
    const idx = colIndex[colName];
    return idx !== undefined ? (row[idx] || '').trim() : '';
  };

  const getNumericCell = (row, colName) => {
    const val = getCell(row, colName);
    const num = parseFloat(val);
    return isNaN(num) ? null : num;
  };

  // Process each row
  for (const row of dataRows) {
    // === Boring metadata ===
    if (colIndex['boring_id'] !== undefined && getCell(row, 'boring_id')) {
      metaBoringId = getCell(row, 'boring_id');
    }
    if (colIndex['project'] !== undefined && getCell(row, 'project')) {
      metaProject = getCell(row, 'project');
    }
    if (colIndex['client'] !== undefined && getCell(row, 'client')) {
      metaClient = getCell(row, 'client');
    }
    if (colIndex['date'] !== undefined && getCell(row, 'date')) {
      metaDate = getCell(row, 'date');
    }
    if (colIndex['time'] !== undefined && getCell(row, 'time')) {
      metaTime = getCell(row, 'time');
    }
    if (colIndex['weather'] !== undefined && getCell(row, 'weather')) {
      metaWeather = getCell(row, 'weather');
    }
    if (colIndex['elevation'] !== undefined) {
      const elev = getNumericCell(row, 'elevation');
      if (elev !== null) metaElevation = elev;
    }
    if (colIndex['coord_1'] !== undefined) {
      const c1 = getNumericCell(row, 'coord_1');
      if (c1 !== null) metaCoord1 = c1;
    }
    if (colIndex['coord_2'] !== undefined) {
      const c2 = getNumericCell(row, 'coord_2');
      if (c2 !== null) metaCoord2 = c2;
    }
    if (colIndex['coord_system'] !== undefined && getCell(row, 'coord_system')) {
      metaCoordSystem = getCell(row, 'coord_system');
    }

    // === Consultant info ===
    if (colIndex['consultant_company'] !== undefined && getCell(row, 'consultant_company')) {
      consultantCompany = getCell(row, 'consultant_company');
    }
    if (colIndex['consultant_contact'] !== undefined && getCell(row, 'consultant_contact')) {
      consultantContact = getCell(row, 'consultant_contact');
    }
    if (colIndex['consultant_phone'] !== undefined && getCell(row, 'consultant_phone')) {
      consultantPhone = getCell(row, 'consultant_phone');
    }

    // === Driller info ===
    // Support both old format (driller) and new format (driller_company, driller_name, driller_license)
    if (colIndex['driller'] !== undefined && getCell(row, 'driller')) {
      drillerName = getCell(row, 'driller');
    }
    if (colIndex['driller_company'] !== undefined && getCell(row, 'driller_company')) {
      drillerCompany = getCell(row, 'driller_company');
    }
    if (colIndex['driller_name'] !== undefined && getCell(row, 'driller_name')) {
      drillerName = getCell(row, 'driller_name');
    }
    if (colIndex['driller_license'] !== undefined && getCell(row, 'driller_license')) {
      drillerLicense = getCell(row, 'driller_license');
    }

    // === Groundwater ===
    if (colIndex['groundwater_depth'] !== undefined) {
      const gwDepth = getNumericCell(row, 'groundwater_depth');
      if (gwDepth !== null) groundwaterDepth = gwDepth;
    }
    if (colIndex['groundwater_note'] !== undefined) {
      const gwNote = getCell(row, 'groundwater_note');
      if (gwNote) groundwaterNote = gwNote;
    }

    // === Well construction ===
    if (colIndex['well_type'] !== undefined && getCell(row, 'well_type')) {
      wellType = getCell(row, 'well_type');
    }
    if (colIndex['well_casing_diameter'] !== undefined) {
      const val = getNumericCell(row, 'well_casing_diameter');
      if (val !== null) wellCasingDiameter = val;
    }
    if (colIndex['well_casing_material'] !== undefined && getCell(row, 'well_casing_material')) {
      wellCasingMaterial = getCell(row, 'well_casing_material');
    }
    if (colIndex['well_screen_top'] !== undefined) {
      const val = getNumericCell(row, 'well_screen_top');
      if (val !== null) wellScreenTop = val;
    }
    if (colIndex['well_screen_bottom'] !== undefined) {
      const val = getNumericCell(row, 'well_screen_bottom');
      if (val !== null) wellScreenBottom = val;
    }
    if (colIndex['well_screen_slot_size'] !== undefined) {
      const val = getNumericCell(row, 'well_screen_slot_size');
      if (val !== null) wellScreenSlotSize = val;
    }
    if (colIndex['well_filter_pack'] !== undefined && getCell(row, 'well_filter_pack')) {
      wellFilterPack = getCell(row, 'well_filter_pack');
    }
    if (colIndex['well_seal_top'] !== undefined) {
      const val = getNumericCell(row, 'well_seal_top');
      if (val !== null) wellSealTop = val;
    }
    if (colIndex['well_seal_bottom'] !== undefined) {
      const val = getNumericCell(row, 'well_seal_bottom');
      if (val !== null) wellSealBottom = val;
    }
    if (colIndex['well_seal_material'] !== undefined && getCell(row, 'well_seal_material')) {
      wellSealMaterial = getCell(row, 'well_seal_material');
    }

    // === Layer data ===
    const depthTop = getNumericCell(row, 'depth_top');
    const depthBottom = getNumericCell(row, 'depth_bottom');
    const uscs = getCell(row, 'uscs');
    const description = getCell(row, 'description');

    if (depthTop !== null && depthBottom !== null && uscs) {
      // Check for duplicate layer
      const existingLayer = layers.find(l => l.depthTop === depthTop && l.depthBottom === depthBottom);
      if (!existingLayer) {
        const layer = {
          depthTop,
          depthBottom,
          uscs: uscs.toUpperCase(),
          description: description || `${uscs} soil`
        };

        // Moisture (structured)
        const moisture = getCell(row, 'moisture');
        if (moisture) {
          layer.moisture = moisture.toLowerCase();
        }

        // Odor
        const odor = getCell(row, 'odor');
        if (odor) {
          layer.odor = odor.toLowerCase();
        }

        // PID reading
        const pid = getNumericCell(row, 'pid');
        if (pid !== null) {
          layer.pid = pid;
        }

        layers.push(layer);
        maxDepth = Math.max(maxDepth, depthBottom);
      }
    }

    // === Sample data ===
    const sampleDepth = getNumericCell(row, 'sample_depth');
    const sampleType = getCell(row, 'sample_type');
    const sampleId = getCell(row, 'sample_id');

    if (sampleDepth !== null && sampleType && sampleId) {
      const sample = {
        depth: sampleDepth,
        type: sampleType.toUpperCase(),
        id: sampleId
      };

      // SPT blows
      const blow1 = getNumericCell(row, 'blow1');
      const blow2 = getNumericCell(row, 'blow2');
      const blow3 = getNumericCell(row, 'blow3');

      if (blow1 !== null && blow2 !== null && blow3 !== null) {
        sample.blows = [blow1, blow2, blow3];
      }

      // Recovery
      const recovery = getNumericCell(row, 'recovery');
      if (recovery !== null) {
        sample.recovery = recovery;
      }

      // Check for duplicate sample
      const existingSample = samples.find(s => s.depth === sampleDepth && s.id === sampleId);
      if (!existingSample) {
        samples.push(sample);
      }

      maxDepth = Math.max(maxDepth, sampleDepth);
    }
  }

  // Sort layers and samples by depth
  layers.sort((a, b) => a.depthTop - b.depthTop);
  samples.sort((a, b) => a.depth - b.depth);

  // Build result object
  const result = {
    boring: {
      id: metaBoringId,
      project: metaProject,
      date: metaDate,
      totalDepth: maxDepth || 30
    },
    layers,
    samples
  };

  // Add optional boring fields
  if (metaClient) {
    result.boring.client = metaClient;
  }
  if (metaTime) {
    result.boring.time = metaTime;
  }
  if (metaWeather) {
    result.boring.weather = metaWeather;
  }
  if (metaElevation !== null) {
    result.boring.elevation = metaElevation;
  }
  if (metaCoord1 !== null && metaCoord2 !== null) {
    result.boring.location = {
      coords: [metaCoord1, metaCoord2],
      system: metaCoordSystem || 'Unknown'
    };
  }

  // Add consultant info
  if (consultantCompany || consultantContact || consultantPhone) {
    result.boring.consultant = {};
    if (consultantCompany) result.boring.consultant.company = consultantCompany;
    if (consultantContact) result.boring.consultant.contact = consultantContact;
    if (consultantPhone) result.boring.consultant.phone = consultantPhone;
  }

  // Add driller info
  if (drillerCompany || drillerLicense) {
    // Use object format if we have company or license
    result.boring.driller = {};
    if (drillerCompany) result.boring.driller.company = drillerCompany;
    if (drillerName) result.boring.driller.name = drillerName;
    if (drillerLicense) result.boring.driller.license = drillerLicense;
  } else if (drillerName) {
    // Use simple string format for backward compatibility
    result.boring.driller = drillerName;
  }

  // Add groundwater
  if (groundwaterDepth !== null) {
    result.groundwater = {
      depth: groundwaterDepth
    };
    if (groundwaterNote) {
      result.groundwater.note = groundwaterNote;
    }
  }

  // Add well construction
  if (wellType || wellCasingDiameter !== null || wellScreenTop !== null) {
    result.well = {};
    if (wellType) result.well.type = wellType;
    if (wellCasingDiameter !== null) result.well.casingDiameter = wellCasingDiameter;
    if (wellCasingMaterial) result.well.casingMaterial = wellCasingMaterial;
    if (wellScreenTop !== null) result.well.screenTop = wellScreenTop;
    if (wellScreenBottom !== null) result.well.screenBottom = wellScreenBottom;
    if (wellScreenSlotSize !== null) result.well.screenSlotSize = wellScreenSlotSize;
    if (wellFilterPack) result.well.filterPack = wellFilterPack;
    if (wellSealTop !== null) result.well.sealTop = wellSealTop;
    if (wellSealBottom !== null) result.well.sealBottom = wellSealBottom;
    if (wellSealMaterial) result.well.sealMaterial = wellSealMaterial;
  }

  return result;
}

/**
 * Parse CSV text into array of rows
 * Handles quoted fields with commas and newlines
 */
function parseCSVRows(csvContent, delimiter = ',') {
  const rows = [];
  let currentRow = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < csvContent.length; i++) {
    const char = csvContent[i];
    const nextChar = csvContent[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote
          currentField += '"';
          i++;
        } else {
          // End of quoted field
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === delimiter) {
        currentRow.push(currentField);
        currentField = '';
      } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
        if (char === '\r') i++;
      } else if (char !== '\r') {
        currentField += char;
      }
    }
  }

  // Add final field and row
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  return rows;
}

/**
 * Normalize column name to standard format
 */
function normalizeColumnName(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Generate sample CSV template with all fields
 */
function generateCSVTemplate() {
  const headers = [
    'boring_id', 'project', 'client', 'date', 'time', 'weather',
    'consultant_company', 'consultant_contact', 'consultant_phone',
    'driller_company', 'driller_name', 'driller_license',
    'elevation', 'coord_1', 'coord_2', 'coord_system',
    'groundwater_depth', 'groundwater_note',
    'well_type', 'well_casing_diameter', 'well_casing_material',
    'well_screen_top', 'well_screen_bottom', 'well_screen_slot_size',
    'well_filter_pack', 'well_seal_top', 'well_seal_bottom', 'well_seal_material',
    'depth_top', 'depth_bottom', 'uscs', 'description', 'moisture', 'odor', 'pid',
    'sample_depth', 'sample_type', 'sample_id', 'blow1', 'blow2', 'blow3', 'recovery'
  ];

  return headers.join(',');
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { parseBoringLogCSV, generateCSVTemplate };
}
