// ============================================================================
// Export Utilities - PDF, CSV, Excel Export for CancerGuard AI
// ============================================================================

// ============================================================================
// CSV EXPORT
// ============================================================================

interface CSVOptions {
  filename?: string;
  headers?: string[];
  delimiter?: string;
  includeHeaders?: boolean;
  dateFormat?: string;
}

/**
 * Convert array of objects to CSV string
 */
export const objectsToCSV = (
  data: Record<string, any>[],
  options: CSVOptions = {}
): string => {
  if (data.length === 0) return '';
  const { headers, delimiter = ',', includeHeaders = true } = options;
  const keys = headers || Object.keys(data[0]);

  const escapeCSV = (value: any): string => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(delimiter) || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows: string[] = [];
  if (includeHeaders) {
    rows.push(keys.map(escapeCSV).join(delimiter));
  }

  data.forEach((row) => {
    const values = keys.map((key) => escapeCSV(row[key]));
    rows.push(values.join(delimiter));
  });

  return rows.join('\n');
};

/**
 * Parse CSV string to array of objects
 */
export const parseCSV = (csv: string, delimiter: string = ','): Record<string, string>[] => {
  const lines = csv.split('\n').filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(delimiter).map((h) => h.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).map((line) => {
    const values = line.split(delimiter).map((v) => v.trim().replace(/^"|"$/g, ''));
    const obj: Record<string, string> = {};
    headers.forEach((header, i) => {
      obj[header] = values[i] || '';
    });
    return obj;
  });
};

/**
 * Download data as CSV file
 */
export const downloadCSV = (
  data: Record<string, any>[],
  options: CSVOptions = {}
): void => {
  const { filename = 'export.csv' } = options;
  const csv = objectsToCSV(data, options);
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, filename);
};

// ============================================================================
// JSON EXPORT  
// ============================================================================

/**
 * Download data as JSON file
 */
export const downloadJSON = (
  data: any,
  filename: string = 'export.json',
  pretty: boolean = true
): void => {
  const json = JSON.stringify(data, null, pretty ? 2 : 0);
  const blob = new Blob([json], { type: 'application/json' });
  downloadBlob(blob, filename);
};

// ============================================================================
// EXCEL-LIKE EXPORT (TSV with .xls extension for basic compatibility)
// ============================================================================

interface ExcelOptions {
  filename?: string;
  sheetName?: string;
  headers?: string[];
  columnWidths?: number[];
}

/**
 * Generate basic Excel-compatible HTML table format
 */
export const generateExcelHTML = (
  data: Record<string, any>[],
  options: ExcelOptions = {}
): string => {
  if (data.length === 0) return '';
  const { sheetName = 'Sheet1', headers } = options;
  const keys = headers || Object.keys(data[0]);

  let html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:x="urn:schemas-microsoft-com:office:spreadsheet"
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8" />
      <style>
        table { border-collapse: collapse; }
        th { background-color: #1565c0; color: white; font-weight: bold; padding: 8px 12px; border: 1px solid #ccc; }
        td { padding: 6px 12px; border: 1px solid #ddd; }
        tr:nth-child(even) { background-color: #f5f5f5; }
      </style>
    </head>
    <body>
      <table>
        <thead><tr>${keys.map((k) => `<th>${escapeHtml(formatHeader(k))}</th>`).join('')}</tr></thead>
        <tbody>
  `;

  data.forEach((row) => {
    html += '<tr>';
    keys.forEach((key) => {
      const value = row[key];
      const displayValue = value === null || value === undefined ? '' : String(value);
      html += `<td>${escapeHtml(displayValue)}</td>`;
    });
    html += '</tr>';
  });

  html += '</tbody></table></body></html>';
  return html;
};

/**
 * Download data as Excel file
 */
export const downloadExcel = (
  data: Record<string, any>[],
  options: ExcelOptions = {}
): void => {
  const { filename = 'export.xls' } = options;
  const html = generateExcelHTML(data, options);
  const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
  downloadBlob(blob, filename);
};

// ============================================================================
// PDF EXPORT (HTML-based print)
// ============================================================================

interface PDFOptions {
  title?: string;
  subtitle?: string;
  filename?: string;
  orientation?: 'portrait' | 'landscape';
  logo?: string;
  headerColor?: string;
  includeTimestamp?: boolean;
  includePageNumbers?: boolean;
  customCSS?: string;
  footer?: string;
}

/**
 * Generate printable HTML for PDF export
 */
export const generatePrintableHTML = (
  content: string,
  options: PDFOptions = {}
): string => {
  const {
    title = 'CancerGuard AI Report',
    subtitle = '',
    orientation = 'portrait',
    headerColor = '#1565c0',
    includeTimestamp = true,
    includePageNumbers = true,
    customCSS = '',
    footer = 'Generated by CancerGuard AI Healthcare Platform',
  } = options;

  const timestamp = new Date().toLocaleString();

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <title>${title}</title>
      <style>
        @page {
          size: ${orientation === 'landscape' ? 'landscape' : 'portrait'};
          margin: 20mm;
          @bottom-center {
            content: ${includePageNumbers ? '"Page " counter(page) " of " counter(pages)' : 'none'};
          }
        }
        
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        body {
          font-family: 'Segoe UI', 'Roboto', sans-serif;
          font-size: 11pt;
          line-height: 1.6;
          color: #333;
          padding: 20px;
        }
        
        .report-header {
          background: ${headerColor};
          color: white;
          padding: 24px 30px;
          border-radius: 8px;
          margin-bottom: 24px;
        }
        
        .report-header h1 {
          font-size: 22pt;
          font-weight: 700;
          margin-bottom: 4px;
        }
        
        .report-header .subtitle {
          font-size: 12pt;
          opacity: 0.9;
        }
        
        .report-header .timestamp {
          font-size: 9pt;
          opacity: 0.7;
          margin-top: 8px;
        }
        
        .report-content {
          margin: 20px 0;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 16px 0;
          page-break-inside: auto;
        }
        
        th {
          background-color: ${headerColor}15;
          color: ${headerColor};
          font-weight: 600;
          text-align: left;
          padding: 10px 14px;
          border-bottom: 2px solid ${headerColor}40;
          font-size: 10pt;
        }
        
        td {
          padding: 8px 14px;
          border-bottom: 1px solid #eee;
          font-size: 10pt;
        }
        
        tr:nth-child(even) td {
          background-color: #fafafa;
        }
        
        .stat-card {
          display: inline-block;
          width: 23%;
          background: #f8f9fa;
          border-radius: 8px;
          padding: 16px;
          margin: 4px;
          text-align: center;
          border: 1px solid #e0e0e0;
        }
        
        .stat-card .value {
          font-size: 20pt;
          font-weight: 700;
          color: ${headerColor};
        }
        
        .stat-card .label {
          font-size: 9pt;
          color: #666;
          margin-top: 4px;
        }
        
        .section-title {
          font-size: 14pt;
          font-weight: 600;
          color: ${headerColor};
          margin: 24px 0 12px;
          padding-bottom: 8px;
          border-bottom: 2px solid ${headerColor}30;
        }
        
        .report-footer {
          margin-top: 40px;
          padding-top: 16px;
          border-top: 1px solid #ddd;
          font-size: 8pt;
          color: #999;
          text-align: center;
        }
        
        .chart-placeholder {
          background: #f0f4f8;
          border: 2px dashed #ccc;
          border-radius: 8px;
          padding: 40px;
          text-align: center;
          color: #999;
          margin: 16px 0;
        }
        
        .badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 9pt;
          font-weight: 600;
        }
        
        .badge-success { background: #e8f5e9; color: #2e7d32; }
        .badge-warning { background: #fff3e0; color: #e65100; }
        .badge-danger { background: #ffebee; color: #c62828; }
        .badge-info { background: #e3f2fd; color: #1565c0; }
        
        @media print {
          body { padding: 0; }
          .no-print { display: none !important; }
          .page-break { page-break-before: always; }
        }
        
        ${customCSS}
      </style>
    </head>
    <body>
      <div class="report-header">
        <h1>${title}</h1>
        ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ''}
        ${includeTimestamp ? `<div class="timestamp">Generated: ${timestamp}</div>` : ''}
      </div>
      
      <div class="report-content">
        ${content}
      </div>
      
      <div class="report-footer">
        ${footer}
      </div>
    </body>
    </html>
  `;
};

/**
 * Generate a data table HTML for PDF
 */
export const generateTableHTML = (
  data: Record<string, any>[],
  headers?: string[],
  title?: string
): string => {
  if (data.length === 0) return '<p>No data available</p>';
  const keys = headers || Object.keys(data[0]);

  let html = title ? `<h2 class="section-title">${title}</h2>` : '';
  html += '<table><thead><tr>';
  keys.forEach((key) => {
    html += `<th>${escapeHtml(formatHeader(key))}</th>`;
  });
  html += '</tr></thead><tbody>';

  data.forEach((row) => {
    html += '<tr>';
    keys.forEach((key) => {
      const value = row[key];
      html += `<td>${escapeHtml(value === null || value === undefined ? '' : String(value))}</td>`;
    });
    html += '</tr>';
  });

  html += '</tbody></table>';
  return html;
};

/**
 * Generate summary stats HTML for PDF
 */
export const generateStatsHTML = (
  stats: { label: string; value: string | number; color?: string }[]
): string => {
  let html = '<div style="display: flex; flex-wrap: wrap; gap: 8px; margin: 16px 0;">';
  stats.forEach(({ label, value, color }) => {
    html += `
      <div class="stat-card">
        <div class="value" ${color ? `style="color: ${color}"` : ''}>${value}</div>
        <div class="label">${label}</div>
      </div>
    `;
  });
  html += '</div>';
  return html;
};

/**
 * Open print dialog for PDF generation
 */
export const printToPDF = (
  content: string,
  options: PDFOptions = {}
): void => {
  const html = generatePrintableHTML(content, options);
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    console.error('Failed to open print window. Please allow popups.');
    return;
  }
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };
};

/**
 * Export data table as PDF
 */
export const exportTableAsPDF = (
  data: Record<string, any>[],
  options: PDFOptions & { headers?: string[] } = {}
): void => {
  const tableHTML = generateTableHTML(data, options.headers as string[]);
  printToPDF(tableHTML, options);
};

// ============================================================================
// IMAGE EXPORT
// ============================================================================

/**
 * Convert a canvas element to a downloadable image
 */
export const canvasToImage = (
  canvas: HTMLCanvasElement,
  filename: string = 'chart.png',
  format: 'png' | 'jpeg' | 'webp' = 'png',
  quality: number = 0.92
): void => {
  const dataUrl = canvas.toDataURL(`image/${format}`, quality);
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Convert an HTML element to canvas (basic screenshot)
 */
export const elementToCanvas = async (element: HTMLElement): Promise<HTMLCanvasElement | null> => {
  try {
    // Use html2canvas if available, otherwise fallback
    if ((window as any).html2canvas) {
      return await (window as any).html2canvas(element);
    }
    console.warn('html2canvas not available for element screenshot');
    return null;
  } catch {
    return null;
  }
};

// ============================================================================
// REPORT GENERATORS
// ============================================================================

/**
 * Generate a patient health report PDF
 */
export const generateHealthReport = (patientData: {
  name: string;
  healthId?: string;
  dateOfBirth?: string;
  bloodType?: string;
  vitals?: Record<string, any>;
  medications?: any[];
  conditions?: string[];
  allergies?: string[];
  recentLabs?: any[];
  appointments?: any[];
}): void => {
  let content = '';

  // Patient Info Section
  content += '<h2 class="section-title">Patient Information</h2>';
  content += '<table>';
  content += `<tr><td><strong>Name</strong></td><td>${patientData.name}</td>`;
  content += `<td><strong>Health ID</strong></td><td>${patientData.healthId || 'N/A'}</td></tr>`;
  content += `<tr><td><strong>Date of Birth</strong></td><td>${patientData.dateOfBirth || 'N/A'}</td>`;
  content += `<td><strong>Blood Type</strong></td><td>${patientData.bloodType || 'N/A'}</td></tr>`;
  content += '</table>';

  // Vitals Section
  if (patientData.vitals) {
    content += '<h2 class="section-title">Current Vitals</h2>';
    const vitalStats = Object.entries(patientData.vitals).map(([label, value]) => ({
      label: formatHeader(label),
      value: String(value),
    }));
    content += generateStatsHTML(vitalStats);
  }

  // Conditions
  if (patientData.conditions && patientData.conditions.length > 0) {
    content += '<h2 class="section-title">Medical Conditions</h2>';
    content += '<ul>';
    patientData.conditions.forEach((c) => {
      content += `<li>${escapeHtml(c)}</li>`;
    });
    content += '</ul>';
  }

  // Allergies
  if (patientData.allergies && patientData.allergies.length > 0) {
    content += '<h2 class="section-title">Allergies</h2>';
    content += '<ul>';
    patientData.allergies.forEach((a) => {
      content += `<li style="color: #c62828; font-weight: 600;">${escapeHtml(a)}</li>`;
    });
    content += '</ul>';
  }

  // Medications
  if (patientData.medications && patientData.medications.length > 0) {
    content += generateTableHTML(patientData.medications, undefined, 'Current Medications');
  }

  // Recent Labs
  if (patientData.recentLabs && patientData.recentLabs.length > 0) {
    content += generateTableHTML(patientData.recentLabs, undefined, 'Recent Lab Results');
  }

  // Appointments
  if (patientData.appointments && patientData.appointments.length > 0) {
    content += generateTableHTML(patientData.appointments, undefined, 'Upcoming Appointments');
  }

  printToPDF(content, {
    title: 'Patient Health Report',
    subtitle: patientData.name,
  });
};

/**
 * Generate analytics report PDF
 */
export const generateAnalyticsReport = (data: {
  title: string;
  period: string;
  stats: { label: string; value: string | number; color?: string }[];
  tables?: { title: string; data: Record<string, any>[] }[];
}): void => {
  let content = '';

  content += generateStatsHTML(data.stats);

  if (data.tables) {
    data.tables.forEach((table) => {
      content += generateTableHTML(table.data, undefined, table.title);
    });
  }

  printToPDF(content, {
    title: data.title,
    subtitle: `Report Period: ${data.period}`,
  });
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const escapeHtml = (text: string): string => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

const formatHeader = (key: string): string => {
  return key
    .replace(/[_-]/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  objectsToCSV, parseCSV, downloadCSV,
  downloadJSON,
  generateExcelHTML, downloadExcel,
  generatePrintableHTML, generateTableHTML, generateStatsHTML,
  printToPDF, exportTableAsPDF,
  canvasToImage, elementToCanvas,
  generateHealthReport, generateAnalyticsReport,
};
