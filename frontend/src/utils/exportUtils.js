/**
 * =============================================
 * UNIVERSAL EXPORT UTILITY
 * =============================================
 * CSV & PDF export for all tools:
 * - Profit Calculator
 * - Keyword Research
 * - Listing Optimizer
 * - Competitor Monitor
 * =============================================
 */

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { saveAs } from 'file-saver';

// ============ CSV EXPORT ============
export function exportToCSV(data, columns, filename = 'export') {
  if (!data || data.length === 0) return;

  const header = columns.map((c) => c.label).join(',');
  const rows = data.map((row) =>
    columns.map((c) => {
      let val = typeof c.accessor === 'function' ? c.accessor(row) : row[c.accessor];
      // Escape commas and quotes in CSV
      if (typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
        val = `"${val.replace(/"/g, '""')}"`;
      }
      return val ?? '';
    }).join(',')
  );

  const csv = [header, ...rows].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `${filename}-${getDateStr()}.csv`);
}

// ============ PDF EXPORT ============
export function exportToPDF(data, columns, filename = 'export', title = 'Report') {
  if (!data || data.length === 0) return;

  const doc = new jsPDF('l', 'mm', 'a4'); // landscape

  // Header
  doc.setFontSize(18);
  doc.setTextColor(40, 40, 40);
  doc.text(`Amazon Seller Toolkit`, 14, 15);

  doc.setFontSize(14);
  doc.setTextColor(80, 80, 80);
  doc.text(title, 14, 24);

  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text(`Generated: ${new Date().toLocaleString()} | palians.com`, 14, 30);

  // Table
  const tableColumns = columns.map((c) => c.label);
  const tableRows = data.map((row) =>
    columns.map((c) => {
      const val = typeof c.accessor === 'function' ? c.accessor(row) : row[c.accessor];
      return val ?? '';
    })
  );

  doc.autoTable({
    head: [tableColumns],
    body: tableRows,
    startY: 35,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [255, 153, 0], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { left: 14, right: 14 },
  });

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${pageCount} | Amazon Seller Toolkit by Palians`,
      doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  doc.save(`${filename}-${getDateStr()}.pdf`);
}

// ============ PROFIT CALCULATOR EXPORT ============
export function exportProfitResult(result, form) {
  if (!result) return;

  const sym = result.country?.currencySymbol || '₹';

  const data = [
    { item: 'Buy Price', value: `${sym}${form.buyPrice}` },
    { item: 'Sell Price', value: `${sym}${form.sellPrice}` },
    { item: 'Category', value: form.category },
    { item: 'Weight', value: `${form.weightKg} kg` },
    { item: 'Fulfillment', value: form.isFBA ? 'FBA' : 'FBM' },
    { item: 'Quantity', value: form.quantity },
    { item: '---', value: '---' },
    { item: 'Referral Fee', value: `${sym}${result.amazonFees?.referralFee} (${result.amazonFees?.referralFeePercent}%)` },
    { item: 'FBA Fulfillment Fee', value: `${sym}${result.amazonFees?.fulfillmentFee}` },
    { item: 'Storage Fee', value: `${sym}${result.amazonFees?.storageFee}` },
    { item: 'Closing Fee', value: `${sym}${result.amazonFees?.closingFee}` },
    { item: 'Total Amazon Fees', value: `${sym}${result.amazonFees?.totalFees}` },
    { item: '---', value: '---' },
    { item: 'Tax Amount', value: `${sym}${result.tax?.taxAmount} (${result.tax?.taxRate}%)` },
    { item: 'Profit Per Unit', value: `${sym}${result.profit?.profitPerUnit}` },
    { item: 'Profit Margin', value: `${result.profit?.profitMargin}%` },
    { item: 'ROI', value: `${result.profit?.roi}%` },
    { item: 'Total Revenue', value: `${sym}${result.bulk?.totalRevenue}` },
    { item: 'Total Profit', value: `${sym}${result.bulk?.totalProfit}` },
    { item: 'Break-even Price', value: result.breakeven?.formattedBreakevenPrice },
    { item: 'Rating', value: `${result.profit?.profitRating?.emoji} ${result.profit?.profitRating?.label}` },
  ];

  const columns = [
    { label: 'Item', accessor: 'item' },
    { label: 'Value', accessor: 'value' },
  ];

  return { data, columns };
}

// ============ KEYWORD RESEARCH EXPORT ============
export function getKeywordColumns() {
  return [
    { label: '#', accessor: (row, i) => i + 1 },
    { label: 'Keyword', accessor: 'keyword' },
    { label: 'Est. Volume', accessor: 'searchVolumeEstimate' },
    { label: 'Competition', accessor: 'competitionLevel' },
    { label: 'Trend Score', accessor: 'trendingScore' },
  ];
}

// ============ LISTING OPTIMIZER EXPORT ============
export function exportListingResult(result) {
  if (!result) return;

  const data = [
    { section: 'Optimized Title', content: result.optimizedTitle },
    { section: 'Optimized Description', content: result.optimizedDescription },
    ...result.optimizedBullets.map((b, i) => ({ section: `Bullet ${i + 1}`, content: b })),
    ...result.backendKeywords.map((k, i) => ({ section: `Backend Keyword ${i + 1}`, content: k })),
    { section: 'Score', content: `${result.optimizationScore}/100` },
    { section: 'AI Model', content: result.aiModel },
    { section: 'Language', content: result.language },
  ];

  const columns = [
    { label: 'Section', accessor: 'section' },
    { label: 'Content', accessor: 'content' },
  ];

  return { data, columns };
}

// ============ COMPETITOR MONITOR EXPORT ============
export function getCompetitorColumns() {
  return [
    { label: 'ASIN', accessor: 'asin' },
    { label: 'Title', accessor: 'title' },
    { label: 'Price', accessor: (row) => `${row.currency || ''}${row.price || 'N/A'}` },
    { label: 'Rating', accessor: 'rating' },
    { label: 'Reviews', accessor: 'reviews' },
    { label: 'BSR', accessor: 'bsr' },
    { label: 'Status', accessor: 'status' },
    { label: 'Last Checked', accessor: (row) => row.last_checked ? new Date(row.last_checked).toLocaleDateString() : 'N/A' },
  ];
}

// ============ HELPER ============
function getDateStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
