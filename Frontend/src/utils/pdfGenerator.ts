import jsPDF from 'jspdf';
import { PatientData, TreatmentEntry } from '@/types/patient';
import logo from '@/assets/nobglogo.png';


export const generatePDF = async (patient: PatientData , treatment: TreatmentEntry) => {
  const pdf = new jsPDF();

  // Define colors
  const headerBlue = [41, 128, 185] as const;
  const darkBlue = [52, 73, 94] as const;
  const borderGray = [149, 165, 166] as const;
  const textBlack = [0, 0, 0] as const;
  const lightGray = [248, 249, 250] as const;

  const tableWidth = 170;
  const columnWidth = (tableWidth - 4) / 3; // 3 columns with 2px spacing

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
    const margin = 3;
    const effectiveWidth = maxWidth - margin * 2;
    const lines = pdf.splitTextToSize(cleanText, effectiveWidth);
    lines.forEach((line, i) => pdf.text(line, x + margin, y + i * lineHeight));
    return lines.length * lineHeight;
  };

  const calculateTextHeight = (text: string, maxWidth: number, fontSize = 8, lineHeight = 4) => {
    if (!text) return 0;
    pdf.setFontSize(fontSize);
    const cleanText = text.replace(/\s+/g, ' ').trim();
    const margin = 3;
    const effectiveWidth = maxWidth - margin * 2;
    const lines = pdf.splitTextToSize(cleanText, effectiveWidth);
    return lines.length * lineHeight;
  };

  const parsePointsFromText = (text: string): string[] => {
    if (!text) return [];
    
    // First, check if the text already contains numbered points (1., 2., 3., etc.)
    const numberedPointsRegex = /^\d+\.\s*(.+?)(?=\d+\.\s*|$)/gm;
    const numberedMatches = text.match(numberedPointsRegex);
    
    if (numberedMatches && numberedMatches.length > 1) {
      // If numbered points are found, extract the content after the numbers
      return numberedMatches
        .map(point => point.replace(/^\d+\.\s*/, '').trim())
        .filter(point => point.length > 0)
        .slice(0, 30);
    }
    
    // If no numbered points, split by common delimiters but avoid splitting on numbers
    const points = text
      .split(/[,;]|\band\b|\s&\s|\n/)
      .map(point => point.trim())
      .filter(point => point.length > 3) // Filter out very short segments
      .slice(0, 30); // Limit to 30 points max
    
    return points;
  };

  const drawThreeColumnPoints = (
    title: string, 
    text: string, 
    x: number, 
    y: number, 
    width: number
  ) => {
    const points = parsePointsFromText(text);
    const pointsPerColumn = 10;
    const baseRowHeight = 6;
    const headerHeight = 15;
    const minContainerHeight = headerHeight + (pointsPerColumn * baseRowHeight) + 10;

    // Calculate actual height needed for wrapped text
    let actualHeight = headerHeight + 10;
    const columnHeights = [0, 0, 0]; // Track height for each column
    
    // Draw column headers
    const col1X = x + 2;
    const col2X = x + columnWidth + 3;
    const col3X = x + (columnWidth * 2) + 4;
    const headerY = y + headerHeight;
    
    // Pre-calculate heights for each column
    pdf.setFontSize(7);
    for (let i = 0; i < Math.min(points.length, 30); i++) {
      const columnIndex = Math.floor(i / pointsPerColumn);
      const pointText = points[i];
      
      // Calculate wrapped text height for this point
      const numberWidth = 18; // Space for number
      const textWidth = columnWidth - numberWidth - 2; // Minimal margin
      const wrappedHeight = Math.max(baseRowHeight, calculateTextHeight(pointText, textWidth, 7, 3) + 2);
      
      columnHeights[columnIndex] += wrappedHeight;
    }
    
    // Use the tallest column to determine total height
    const maxColumnHeight = Math.max(...columnHeights, pointsPerColumn * baseRowHeight);
    const totalHeight = headerHeight + maxColumnHeight + 10;

    // Draw main container
    drawBorderedRect(x, y, width, totalHeight, lightGray);
    
    // Draw title
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(...darkBlue);
    pdf.text(title, x + 5, y + 10);

    // Column dividers removed for cleaner look

    // Column headers
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(...textBlack);
    pdf.text('', col1X + 2, headerY);
    pdf.text('', col2X + 2, headerY);
    pdf.text('', col3X + 2, headerY);

    // Draw points in columns with proper wrapping
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    
    const columnYPositions = [headerY + 8, headerY + 8, headerY + 8]; // Track Y position for each column
    
    for (let i = 0; i < Math.min(points.length, 30); i++) {
      const columnIndex = Math.floor(i / pointsPerColumn);
      const pointText = points[i];
      
      let pointX: number;
      switch (columnIndex) {
        case 0:
          pointX = col1X;
          break;
        case 1:
          pointX = col2X;
          break;
        case 2:
          pointX = col3X;
          break;
        default:
          continue;
      }

      const currentY = columnYPositions[columnIndex];
      
      // Add number
      const pointNumber = `${i + 1}.`;
      pdf.setFont('helvetica', 'bold');
      pdf.text(pointNumber, pointX, currentY);
      
      // Add wrapped text - aligned directly with number
      pdf.setFont('helvetica', 'normal');
      const numberWidth = 4; // Space for number
      const textWidth = columnWidth - numberWidth - 2;
      const textHeight = addWrappedText(pointText, pointX + numberWidth, currentY, textWidth, 7, 3);
      
      // Update Y position for next point in this column
      columnYPositions[columnIndex] += Math.max(baseRowHeight, textHeight + 2);
    }

    // If no points, show placeholder
    if (points.length === 0) {
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.text('No specific points recorded', x + 5, headerY + 20);
    }

    return totalHeight;
  };

  const drawTextBox = (title: string, text: string, x: number, y: number, width: number, fontSize = 8, lineHeight = 4) => {
    const textHeight = calculateTextHeight(text, width, fontSize, lineHeight);
    const height = textHeight + 20;
    drawBorderedRect(x, y, width, height);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(...darkBlue);
    pdf.text(title, x + 2, y + 6);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...textBlack);
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
  pdf.text('Patient Medical Record', 20, yPosition);
  yPosition += 8;

  // Patient Info Rows
  const cellHeight = 12;
  drawBorderedRect(20, yPosition, 85, cellHeight);
  drawBorderedRect(105, yPosition, 85, cellHeight);
  pdf.setFontSize(9);
  pdf.setTextColor(...textBlack);
  pdf.text(`ID: ${patient.referenceNumber || '01'}`, 22, yPosition + 8);
  const formattedDate = new Date(patient.createdAt).toLocaleDateString('en-GB', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  });
  pdf.text(`Date: ${formattedDate}`, 107, yPosition + 8);

  yPosition += cellHeight;
  drawBorderedRect(20, yPosition, 85, cellHeight);
  drawBorderedRect(105, yPosition, 85, cellHeight);
  pdf.text(`Name: ${patient.patientName}`, 22, yPosition + 8);
  const birthYear = new Date().getFullYear() - parseInt(patient.age);
  pdf.text(`DOB: 01Aug${birthYear}`, 107, yPosition + 8);

  yPosition += cellHeight;
  drawBorderedRect(20, yPosition, 85, cellHeight);
  drawBorderedRect(105, yPosition, 85, cellHeight);
  pdf.text(`Mobile: ${patient.contactNumber}`, 22, yPosition + 8);
  pdf.text(`Reference: ${patient.referencePerson || 'N/A'}`, 107, yPosition + 8);
  yPosition += cellHeight;

  // Address
  const addressText = (patient.address || 'Gwalior');
  yPosition += drawTextBox('Address', addressText, 20, yPosition, tableWidth) + 10;

  // Patient Problems - 3 Column Format
  const problemsText = patient.patientProblem || '';
  yPosition += drawThreeColumnPoints('Patient Problems & Symptoms', problemsText, 20, yPosition, tableWidth) + 10;

  // Check if we need a new page
  if (yPosition > 200) {
    pdf.addPage();
    yPosition = 20;
  }

  // Treatment/Prescriptions - 3 Column Format
  const recentTreatment = patient.treatmentEntries?.at(-1);
  // console.log('Recent Treatment:', recentTreatment);
  const treatmentText = recentTreatment?.medicinePrescriptions || '';
  // console.log('Treatment Text:', treatmentText);
  yPosition += drawThreeColumnPoints('Medicine Prescriptions', treatmentText, 20, yPosition, tableWidth) + 10;

  // Check if we need a new page
  if (yPosition > 200) {
    pdf.addPage();
    yPosition = 20;
  }

  // Advisories - 3 Column Format
  const advisoriesText = recentTreatment?.advisories || recentTreatment?.notes || '';
  yPosition += drawThreeColumnPoints('Medical Advisories & Instructions', advisoriesText, 20, yPosition, tableWidth) + 10;

  // Additional Visits
  const visits = [...(patient.treatmentEntries || [])];

if (visits.length > 1) {
  // Sort visits by date
  visits.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  for (let i = 1; i < visits.length; i++) {
    const treatment = visits[i];
    // console.log(visits);
    pdf.addPage();
    
    // Header for additional visits
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
    pdf.text(`Follow-up Visit ${i + 1}`, 20, yPosition);
    
    yPosition += 15;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text(`Patient: ${patient.patientName} | ID: ${patient.referenceNumber} | Date: ${new Date(treatment.date).toLocaleDateString('en-GB')}`, 20, yPosition);
    
    yPosition += 20;
    
    // Visit prescriptions
    yPosition += drawThreeColumnPoints('Visit Prescriptions', treatment.medicinePrescriptions || '', 20, yPosition, tableWidth) + 10;
    
    // Visit notes
    // yPosition += drawThreeColumnPoints('Visit Notes & Observations', treatment.notes || '', 20, yPosition, tableWidth) + 10;
    
    // Visit advisories
    yPosition += drawThreeColumnPoints('Visit Advisories', treatment.advisories || '', 20, yPosition, tableWidth) + 10;
  }
}

  // Generate filename
  const fileName = `KD_Homeopathic_${patient.patientName.replace(/\s+/g, '_')}_${patient.referenceNumber}_${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
};