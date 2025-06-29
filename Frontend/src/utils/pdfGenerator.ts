import jsPDF from 'jspdf';
import { PatientData } from '@/types/patient';
import logo from '@/assets/nobglogo.png'; // Adjust the path as necessary

export const generatePDF = async (patient: PatientData) => {
  const pdf = new jsPDF();

  // Define colors
  const headerBlue = [41, 128, 185] as const;
  const darkBlue = [52, 73, 94] as const;
  const borderGray = [149, 165, 166] as const;
  const textBlack = [0, 0, 0] as const;

  const tableWidth = 170;

  const drawBorderedRect = (x: number, y: number, width: number, height: number, fillColor?: [number, number, number]) => {
    if (fillColor) {
      pdf.setFillColor(...fillColor);
      pdf.rect(x, y, width, height, 'F');
    }
    pdf.setDrawColor(...borderGray);
    pdf.setLineWidth(0.5);
    pdf.rect(x, y, width, height);
  };

  const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize = 8, lineHeight = 4) => {
    if (!text) return 0;
    pdf.setFontSize(fontSize);
    const cleanText = text.replace(/\s+/g, ' ').trim();
    const margin = 6;
    const effectiveWidth = maxWidth - margin * 2;
    const lines = pdf.splitTextToSize(cleanText, effectiveWidth);
    lines.forEach((line, i) => pdf.text(line, x + margin, y + i * lineHeight));
    return lines.length * lineHeight;
  };

  const calculateTextHeight = (text: string, maxWidth: number, fontSize = 8, lineHeight = 4) => {
    if (!text) return 0;
    pdf.setFontSize(fontSize);
    const cleanText = text.replace(/\s+/g, ' ').trim();
    const margin = 6;
    const effectiveWidth = maxWidth - margin * 2;
    const lines = pdf.splitTextToSize(cleanText, effectiveWidth);
    return lines.length * lineHeight;
  };

  const drawTextBox = (title: string, text: string, x: number, y: number, width: number, fontSize = 8, lineHeight = 4) => {
    const textHeight = calculateTextHeight(text, width, fontSize, lineHeight);
    const height = textHeight + 20;
    drawBorderedRect(x, y, width, height);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text(title, x + 2, y + 6);
    pdf.setFont('helvetica', 'normal');
    addWrappedText(text, x, y + 12, width, fontSize, lineHeight);
    return height;
  };

  // Header
  const headerHeight = 40;
  pdf.setFillColor(...headerBlue);
  pdf.rect(0, 0, 210, headerHeight, 'F');
  pdf.addImage(logo, 'PNG', 10, 10, 30, 30);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.setTextColor(255, 255, 255);
  pdf.text('SHRI K D HOMEOPATHIC', 45, 18);
  pdf.text('CLINIC AND PHARMACY', 45, 26);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.text('Dr. RAHUL KATARIYA', 150, 18);
  pdf.text('BHMS, MD(EH)', 150, 26);

  let yPosition = 55;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(...textBlack);
  pdf.text('Patient Details', 20, yPosition);
  yPosition += 8;

  // Patient Info Rows
  const cellHeight = 12;
  drawBorderedRect(20, yPosition, 85, cellHeight);
  drawBorderedRect(105, yPosition, 85, cellHeight);
  pdf.setFontSize(9);
  pdf.text(`Id : ${patient.referenceNumber || '01'}`, 22, yPosition + 8);
  const formattedDate = new Date(patient.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  pdf.text(`Date : ${formattedDate}`, 107, yPosition + 8);

  yPosition += cellHeight;
  drawBorderedRect(20, yPosition, 85, cellHeight);
  drawBorderedRect(105, yPosition, 85, cellHeight);
  pdf.text(`Name : ${patient.patientName}`, 22, yPosition + 8);
  const birthYear = new Date().getFullYear() - parseInt(patient.age);
  pdf.text(`Date Of Birth : 01Aug${birthYear}`, 107, yPosition + 8);

  yPosition += cellHeight;
  drawBorderedRect(20, yPosition, 85, cellHeight);
  drawBorderedRect(105, yPosition, 85, cellHeight);
  pdf.text(`Mobile : ${patient.contactNumber}`, 22, yPosition + 8);
  pdf.text(`Reference : ${patient.referencePerson || 'N/A'}`, 107, yPosition + 8);
  yPosition += cellHeight;

  // Address
  // pdf.text(`Address`, 22, yPosition + 8);
  const addressText = (patient.address || 'Gwalior');
  yPosition += drawTextBox('Address', addressText, 20, yPosition, tableWidth) + 10;

  // Treatment
  const recentTreatment = patient.treatmentEntries?.at(0);
  const treatmentText = recentTreatment?.medicinePrescriptions || '';
  yPosition += drawTextBox('Patient Treatment', treatmentText, 20, yPosition, tableWidth) + 10;

  // Problems
  yPosition += drawTextBox('Patient Problems', patient.patientProblem || '', 20, yPosition, tableWidth) + 10;

  // Advisories
  const advisoriesText = recentTreatment?.advisories || recentTreatment?.notes || '';
  yPosition += drawTextBox('Medical Advisories', advisoriesText, 20, yPosition, tableWidth) + 10;

  // Additional Visits
  const visits = [...(patient.treatmentEntries || [])];
  if (visits.length > 1) {
    visits.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    for (let i = 0; i < visits.length - 1; i++) {
      const treatment = visits[i];
      pdf.addPage();
      pdf.setFillColor(...headerBlue);
      pdf.rect(0, 0, 210, headerHeight, 'F');
      pdf.addImage(logo, 'PNG', 10, 10, 30, 30);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.setTextColor(255, 255, 255);
      pdf.text('SHRI K D HOMEOPATHIC', 45, 18);
      pdf.text('CLINIC AND PHARMACY', 45, 26);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.text('Dr. RAHUL KATARIYA', 150, 18);
      pdf.text('BHMS, MD(EH)', 150, 26);

      yPosition = 55;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.setTextColor(...textBlack);
      pdf.text(`Patient Details - Visit ${i + 2}`, 20, yPosition);

      yPosition += 15;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.text(`Patient: ${patient.patientName} | ID: ${patient.referenceNumber} | Date: ${new Date(treatment.date).toLocaleDateString('en-GB')}`, 20, yPosition);

      yPosition += 20;
      yPosition += drawTextBox('Patient Treatment', treatment.medicinePrescriptions || '', 20, yPosition, tableWidth) + 10;
      yPosition += drawTextBox('Visit Notes', treatment.notes || '', 20, yPosition, tableWidth) + 10;
      yPosition += drawTextBox('Medical Advisories', treatment.advisories || '', 20, yPosition, tableWidth) + 10;
    }
  }

  const fileName = `KD_Homeopathic_${patient.patientName.replace(/\s+/g, '_')}_${patient.referenceNumber}_${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
};
