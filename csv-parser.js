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
  let metaDate = config.date;
  let metaDriller = config.driller;
  let metaElevation = null;
  let metaCoord1 = null;
  let metaCoord2 = null;
  let metaCoordSystem = null;

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
    // Extract metadata if present
    if (colIndex['boring_id'] !== undefined && getCell(row, 'boring_id')) {
      metaBoringId = getCell(row, 'boring_id');
    }
    if (colIndex['project'] !== undefined && getCell(row, 'project')) {
      metaProject = getCell(row, 'project');
    }
    if (colIndex['date'] !== undefined && getCell(row, 'date')) {
      metaDate = getCell(row, 'date');
    }
    if (colIndex['driller'] !== undefined && getCell(row, 'driller')) {
      metaDriller = getCell(row, 'driller');
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

    // Extract groundwater if present
    if (colIndex['groundwater_depth'] !== undefined) {
      const gwDepth = getNumericCell(row, 'groundwater_depth');
      if (gwDepth !== null) groundwaterDepth = gwDepth;
    }
    if (colIndex['groundwater_note'] !== undefined) {
      const gwNote = getCell(row, 'groundwater_note');
      if (gwNote) groundwaterNote = gwNote;
    }

    // Extract layer data
    const depthTop = getNumericCell(row, 'depth_top');
    const depthBottom = getNumericCell(row, 'depth_bottom');
    const uscs = getCell(row, 'uscs');
    const description = getCell(row, 'description');

    if (depthTop !== null && depthBottom !== null && uscs) {
      // Check for duplicate layer
      const existingLayer = layers.find(l => l.depthTop === depthTop && l.depthBottom === depthBottom);
      if (!existingLayer) {
        layers.push({
          depthTop,
          depthBottom,
          uscs: uscs.toUpperCase(),
          description: description || `${uscs} soil`
        });
        maxDepth = Math.max(maxDepth, depthBottom);
      }
    }

    // Extract sample data
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
      driller: metaDriller,
      totalDepth: maxDepth || 30
    },
    layers,
    samples
  };

  // Add optional fields
  if (metaElevation !== null) {
    result.boring.elevation = metaElevation;
  }

  if (metaCoord1 !== null && metaCoord2 !== null) {
    result.boring.location = {
      coords: [metaCoord1, metaCoord2],
      system: metaCoordSystem || 'Unknown'
    };
  }

  if (groundwaterDepth !== null) {
    result.groundwater = {
      depth: groundwaterDepth
    };
    if (groundwaterNote) {
      result.groundwater.note = groundwaterNote;
    }
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
 * Generate sample CSV template
 */
function generateCSVTemplate() {
  return `boring_id,project,date,driller,elevation,coord_1,coord_2,coord_system,groundwater_depth,groundwater_note,depth_top,depth_bottom,uscs,description,sample_depth,sample_type,sample_id,blow1,blow2,blow3,recovery
B-1,Site Investigation Project,2025-01-15,ABC Drilling,125.5,34.0522,-118.2437,WGS84,12.5,Stabilized after 24 hrs,0,3.5,SM,"Brown silty SAND, fine grained, loose, moist",2,SPT,S-1,4,5,6,18
B-1,,,,,,,,,,,,,5,SPT,S-2,8,10,12,16
B-1,,,,,,,,,,3.5,12,CL,"Gray lean CLAY, stiff, moist to wet",10,SPT,S-3,12,14,15,14
B-1,,,,,,,,,,12,30,SP,"Gray-brown poorly graded SAND, medium dense, saturated",15,SPT,S-4,18,20,22,12
B-1,,,,,,,,,,,,,25,SHELBY,U-1,,,24`;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { parseBoringLogCSV, generateCSVTemplate };
}
