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
  
  // Helper function to draw bordered rectangle
  const drawBorderedRect = (x: number, y: number, width: number, height: number, fillColor?: number[]) => {
    if (fillColor) {
      pdf.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
      pdf.rect(x, y, width, height, 'F');
    }
    pdf.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
    pdf.setLineWidth(0.5);
    pdf.rect(x, y, width, height);
  };

  // Header section with logo and clinic name
  const headerHeight = 40;
  
  // Header background
  pdf.setFillColor(headerBlue[0], headerBlue[1], headerBlue[2]);
  pdf.rect(0, 0, 210, headerHeight, 'F');
  
 pdf.addImage(logo, 'PNG', 10, 10, 30, 30); // Adjust logo size and position as needed
  
  // Clinic name and details
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.setTextColor(255, 255, 255);
  pdf.text('SHRI K D HOMEOPATHIC', 45, 18);
  pdf.text('CLINIC AND PHARMACY', 45, 26);
  
  // Doctor name (right side)
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.text('Dr. RAHUL KATARIYA', 150, 18);
  pdf.text('BHMS, MD(EH)', 150, 26);
  
  // Patient Details title
  let yPosition = 55;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(textBlack[0], textBlack[1], textBlack[2]);
  pdf.text('Patient Details', 20, yPosition);
  
  // Main patient details table
  yPosition += 8;
  const tableStartY = yPosition;
  const tableWidth = 170;
  const cellHeight = 12;
  
  // Top row with Id and Date
  drawBorderedRect(20, yPosition, 85, cellHeight);
  drawBorderedRect(105, yPosition, 85, cellHeight);
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.text('Id : ' + (patient.referenceNumber || '01'), 22, yPosition + 8);
  
  const formattedDate = new Date(patient.createdAt).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  pdf.text('Date : ' + formattedDate, 107, yPosition + 8);
  
  yPosition += cellHeight;
  
  // Second row with Name and Date of Birth
  drawBorderedRect(20, yPosition, 85, cellHeight);
  drawBorderedRect(105, yPosition, 85, cellHeight);
  
  pdf.text('Name : ' + patient.patientName, 22, yPosition + 8);
  
  // Calculate birth date from age (approximate)
  const currentYear = new Date().getFullYear();
  const birthYear = currentYear - parseInt(patient.age);
  const birthDate = `01Aug${birthYear}`;
  pdf.text('Date Of Birth : ' + birthDate, 107, yPosition + 8);
  
  yPosition += cellHeight;
  
  // Third row with Mobile and Reference
  drawBorderedRect(20, yPosition, 85, cellHeight);
  drawBorderedRect(105, yPosition, 85, cellHeight);
  
  pdf.text('Mobile : ' + patient.contactNumber, 22, yPosition + 8);
  pdf.text('Reference : ' + (patient.referencePerson || 'N/A'), 107, yPosition + 8);
  
  yPosition += cellHeight;
  
  // Address row (full width)
  const addressHeight = 25;
  drawBorderedRect(20, yPosition, tableWidth, addressHeight);
  pdf.text('Address : ' + (patient.address || 'Gwalior'), 22, yPosition + 8);
  
  yPosition += addressHeight + 10;
  
  // Two column section for treatment and problems
  const columnWidth = 85;
  const sectionHeight = 80;
  
  // Left column - Patient Treatment
  drawBorderedRect(20, yPosition, columnWidth, sectionHeight);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.text('Patient Treatment', 22, yPosition - 2);
  
  // Add treatment entries if available
  if (patient.treatmentEntries && patient.treatmentEntries.length > 0) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    const treatmentY = yPosition + 10;
    
    // Get the most recent treatment
    const recentTreatment = patient.treatmentEntries[patient.treatmentEntries.length - 1];
    
    if (recentTreatment.medicinePrescriptions) {
      const medicineLines = pdf.splitTextToSize(recentTreatment.medicinePrescriptions, columnWidth - 4);
      pdf.text(medicineLines.slice(0, 8), 22, treatmentY); // Limit to fit in box
    }
  }
  
  // Right column - Patient Problems
  drawBorderedRect(105, yPosition, columnWidth, sectionHeight);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.text('Patient Problems', 107, yPosition - 2);
  
  // Add patient problems if available
  if (patient.patientProblem) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    const problemLines = pdf.splitTextToSize(patient.patientProblem, columnWidth - 4);
    pdf.text(problemLines.slice(0, 8), 107, yPosition + 10); // Limit to fit in box
  }
  
  yPosition += sectionHeight + 10;
  
  // Other section (full width)
  const otherHeight = 30;
  drawBorderedRect(20, yPosition, tableWidth, otherHeight);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.text('Other', 22, yPosition - 2);
  
  // Add advisories or notes if available
  if (patient.treatmentEntries && patient.treatmentEntries.length > 0) {
    const recentTreatment = patient.treatmentEntries[patient.treatmentEntries.length - 1];
    if (recentTreatment.advisories || recentTreatment.notes) {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      const otherText = recentTreatment.advisories || recentTreatment.notes || '';
      const otherLines = pdf.splitTextToSize(otherText, tableWidth - 4);
      pdf.text(otherLines.slice(0, 3), 22, yPosition + 10);
    }
  }
  
  yPosition += otherHeight + 10;
  
  // Doctor Prescription section (full width)
  const prescriptionHeight = 30;
  drawBorderedRect(20, yPosition, tableWidth, prescriptionHeight);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.text('Doctor Prescription', 22, yPosition - 2);
  
  // Add prescription details if available
  if (patient.treatmentEntries && patient.treatmentEntries.length > 0) {
    const recentTreatment = patient.treatmentEntries[patient.treatmentEntries.length - 1];
    if (recentTreatment.medicinePrescriptions) {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      const prescriptionLines = pdf.splitTextToSize(recentTreatment.medicinePrescriptions, tableWidth - 4);
      pdf.text(prescriptionLines.slice(0, 4), 22, yPosition + 10);
    }
  }
  
  // Handle multiple treatment entries - create additional pages
  if (patient.treatmentEntries && patient.treatmentEntries.length > 1) {
    // Sort treatments by date (oldest first for chronological order)
    const sortedTreatments = [...patient.treatmentEntries].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Skip the first treatment (already shown on first page) and create pages for remaining
    for (let i = 1; i < sortedTreatments.length; i++) {
      const treatment = sortedTreatments[i];
      pdf.addPage();
      
      // Repeat header for new page
      pdf.setFillColor(headerBlue[0], headerBlue[1], headerBlue[2]);
      pdf.rect(0, 0, 210, headerHeight, 'F');
      
      // Logo
      pdf.setFillColor(255, 255, 255);
      pdf.circle(25, 20, 12, 'F');
      pdf.setFillColor(headerBlue[0], headerBlue[1], headerBlue[2]);
      pdf.rect(23, 16, 4, 8, 'F');
      pdf.rect(21, 18, 8, 4, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(headerBlue[0], headerBlue[1], headerBlue[2]);
      pdf.text('KD', 22, 26);
      
      // Clinic name
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.setTextColor(255, 255, 255);
      pdf.text('SHRI K D HOMEOPATHIC', 45, 18);
      pdf.text('CLINIC AND PHARMACY', 45, 26);
      
      // Doctor name
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.text('Dr. RAHUL KATARIYA', 150, 18);
      pdf.text('BHMS, MD(CH)', 150, 26);
      
      // Visit number and date
      yPosition = 55;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.setTextColor(textBlack[0], textBlack[1], textBlack[2]);
      pdf.text(`Patient Details - Visit ${i + 1}`, 20, yPosition);
      
      // Repeat patient basic info in smaller format
      yPosition += 15;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.text(`Patient: ${patient.patientName} | ID: ${patient.referenceNumber} | Date: ${new Date(treatment.date).toLocaleDateString('en-GB')}`, 20, yPosition);
      
      yPosition += 20;
      
      // Treatment details for this visit
      drawBorderedRect(20, yPosition, columnWidth, sectionHeight);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.text('Patient Treatment', 22, yPosition - 2);
      
      if (treatment.medicinePrescriptions) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        const medicineLines = pdf.splitTextToSize(treatment.medicinePrescriptions, columnWidth - 4);
        pdf.text(medicineLines, 22, yPosition + 10);
      }
      
      // Problems/Symptoms for this visit
      drawBorderedRect(105, yPosition, columnWidth, sectionHeight);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.text('Visit Notes', 107, yPosition - 2);
      
      if (treatment.notes) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        const notesLines = pdf.splitTextToSize(treatment.notes, columnWidth - 4);
        pdf.text(notesLines, 107, yPosition + 10);
      }
      
      yPosition += sectionHeight + 10;
      
      // Advisories section
      drawBorderedRect(20, yPosition, tableWidth, otherHeight);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.text('Medical Advisories', 22, yPosition - 2);
      
      if (treatment.advisories) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        const advisoryLines = pdf.splitTextToSize(treatment.advisories, tableWidth - 4);
        pdf.text(advisoryLines, 22, yPosition + 10);
      }
      
      yPosition += otherHeight + 10;
      
      // Doctor Prescription for this visit
      drawBorderedRect(20, yPosition, tableWidth, prescriptionHeight);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.text('Doctor Prescription', 22, yPosition - 2);
      
      if (treatment.medicinePrescriptions) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        const prescriptionLines = pdf.splitTextToSize(treatment.medicinePrescriptions, tableWidth - 4);
        pdf.text(prescriptionLines, 22, yPosition + 10);
      }
    }
  }
  
  // Save the PDF with clinic-specific filename
  const fileName = `KD_Homeopathic_${patient.patientName.replace(/\s+/g, '_')}_${patient.referenceNumber}_${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
};