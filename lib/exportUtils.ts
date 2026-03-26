import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AnakKariah } from '@/types/kariah';
import { Timestamp } from 'firebase/firestore';

function safeDate(ts: Timestamp | Date | null | undefined): string {
  if (!ts) return '-';
  try {
    if (typeof (ts as Timestamp).toDate === 'function') {
      return (ts as Timestamp).toDate().toLocaleDateString('ms-MY');
    }
    if (ts instanceof Date) return ts.toLocaleDateString('ms-MY');
  } catch {
    // ignore
  }
  return '-';
}

export function exportAnakKariahToExcel(members: AnakKariah[], filename?: string): void {
  const exportDate = new Date().toLocaleDateString('ms-MY', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const wsData: (string | number)[][] = [
    ['Masjid Al-Falah'],
    [`Tarikh Export: ${exportDate}`],
    [],
    ['No', 'Nama Penuh', 'No IC', 'Telefon', 'Jantina', 'Kawasan', 'Status', 'Alamat', 'Tarikh Daftar', 'Catatan'],
    ...members.map((m, i) => [
      i + 1,
      m.namaPenuh,
      m.ic,
      m.telefon,
      m.jantina,
      m.kawasanName || '-',
      m.status === 'aktif' ? 'Aktif' : 'Tidak Aktif',
      m.alamat,
      safeDate(m.createdAt),
      m.catatan || '',
    ]),
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 9 } },
  ];
  ws['!cols'] = [
    { wch: 5 },
    { wch: 30 },
    { wch: 16 },
    { wch: 14 },
    { wch: 10 },
    { wch: 20 },
    { wch: 12 },
    { wch: 40 },
    { wch: 14 },
    { wch: 30 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Anak Kariah');

  const fname =
    filename || `Senarai_Anak_Kariah_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fname);
}

export function exportAnakKariahToPDF(
  members: AnakKariah[],
  filename?: string,
  title?: string
): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const exportDate = new Date().toLocaleDateString('ms-MY', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  // Header
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Masjid Al-Falah', pageWidth / 2, 15, { align: 'center' });

  doc.setFontSize(12);
  doc.text(title || 'Senarai Anak Kariah', pageWidth / 2, 22, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Tarikh Cetak: ${exportDate}`, 15, 30);
  doc.text(`Jumlah Rekod: ${members.length}`, pageWidth - 15, 30, { align: 'right' });

  // Table
  autoTable(doc, {
    startY: 35,
    head: [['No', 'Nama Penuh', 'No IC', 'Telefon', 'Jantina', 'Kawasan', 'Status']],
    body: members.map((m, i) => [
      i + 1,
      m.namaPenuh,
      m.ic,
      m.telefon,
      m.jantina,
      m.kawasanName || '-',
      m.status === 'aktif' ? 'Aktif' : 'Tidak Aktif',
    ]),
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: [13, 122, 107], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [240, 253, 250] },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 60 },
      2: { cellWidth: 36 },
      3: { cellWidth: 30 },
      4: { cellWidth: 20, halign: 'center' },
      5: { cellWidth: 45 },
      6: { cellWidth: 28, halign: 'center' },
    },
    margin: { left: 15, right: 15 },
  });

  // Page numbers (second pass for correct total)
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Halaman ${i} / ${totalPages}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
  }

  const fname =
    filename || `Senarai_Anak_Kariah_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fname);
}
