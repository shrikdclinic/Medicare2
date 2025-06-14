
import jsPDF from 'jspdf';
import { PatientData } from '@/types/patient';

export const generatePDF = async (patient: PatientData) => {
  const pdf = new jsPDF();
  
  // Define colors
  const primaryBlue = [44, 82, 130] as const;
  const lightBlue = [59, 130, 246] as const;
  const darkGray = [55, 65, 81] as const;
  const lightGray = [156, 163, 175] as const;
  const accentGreen = [34, 197, 94] as const;
  
  // Helper function to add background gradient effect
  const addHeaderBackground = () => {
    pdf.setFillColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
    pdf.rect(0, 0, 210, 50, 'F');
    pdf.setFillColor(lightBlue[0], lightBlue[1], lightBlue[2]);
    pdf.rect(0, 40, 210, 10, 'F');
  };

  // Header section with modern design
  addHeaderBackground();
  
  // Logo placeholder (medical cross)
  pdf.setFillColor(255, 255, 255);
  pdf.rect(15, 15, 20, 20, 'F');
  pdf.setDrawColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
  pdf.setLineWidth(2);
  pdf.line(20, 25, 30, 25); // Horizontal line
  pdf.line(25, 20, 25, 30); // Vertical line
  
  // Clinic name and title
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(24);
  pdf.setTextColor(255, 255, 255);
  pdf.text('MediCare Clinic', 45, 25);
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Advanced Patient Management System', 45, 35);
  
  // Professional header line
  pdf.setDrawColor(255, 255, 255);
  pdf.setLineWidth(0.5);
  pdf.line(45, 40, 180, 40);
  
  // Document title
  pdf.setFontSize(18);
  pdf.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
  pdf.setFont('helvetica', 'bold');
  pdf.text('PATIENT MEDICAL RECORD', 20, 65);
  
  // Patient info section with modern card design
  let yPosition = 80;
  
  // Patient info card background
  pdf.setFillColor(248, 250, 252);
  pdf.rect(15, yPosition - 5, 180, 85, 'F');
  pdf.setDrawColor(lightGray[0], lightGray[1], lightGray[2]);
  pdf.setLineWidth(0.3);
  pdf.rect(15, yPosition - 5, 180, 85);
  
  // Section header
  pdf.setFillColor(lightBlue[0], lightBlue[1], lightBlue[2]);
  pdf.rect(15, yPosition - 5, 180, 15, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(255, 255, 255);
  pdf.text('PATIENT INFORMATION', 20, yPosition + 5);
  
  yPosition += 20;
  
  // Patient details in two columns
  const addPatientField = (label: string, value: string, x: number, y: number, isHighlight = false) => {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    pdf.text(label + ':', x, y);
    
    pdf.setFont('helvetica', isHighlight ? 'bold' : 'normal');
    pdf.setFontSize(isHighlight ? 12 : 10);
    pdf.setTextColor(isHighlight ? primaryBlue[0] : 0, isHighlight ? primaryBlue[1] : 0, isHighlight ? primaryBlue[2] : 0);
    const textValue = value || 'Not provided';
    pdf.text(textValue, x, y + 8);
  };
  
  // Left column
  addPatientField('PATIENT NAME', patient.patientName, 25, yPosition, true);
  yPosition += 20;
  addPatientField('AGE', patient.age + ' years', 25, yPosition);
  yPosition += 20;
  addPatientField('PATIENT ID', patient.referenceNumber, 25, yPosition);
  yPosition += 20;
  
  // Right column
  yPosition = 100;
  addPatientField('REFERENCE PERSON', patient.referencePerson || 'Not provided', 110, yPosition);
  yPosition += 20;
  addPatientField('CONTACT NUMBER', patient.contactNumber, 110, yPosition);
  yPosition += 20;
  addPatientField('RECORD DATE', new Date(patient.dateCreated).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }), 110, yPosition);
  
  yPosition = 180;
  
  // Address section
  if (patient.address) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    pdf.text('ADDRESS:', 25, yPosition);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    const addressLines = pdf.splitTextToSize(patient.address, 150);
    pdf.text(addressLines, 25, yPosition + 8);
    yPosition += addressLines.length * 6 + 15;
  }

  // Patient problem section
  if (patient.patientProblem) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    pdf.text('CHIEF COMPLAINT:', 25, yPosition);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    const problemLines = pdf.splitTextToSize(patient.patientProblem, 150);
    pdf.text(problemLines, 25, yPosition + 8);
    yPosition += problemLines.length * 6 + 20;
  }
  
  // Treatment History section
  if (patient.treatmentEntries && patient.treatmentEntries.length > 0) {
    // Add new page if needed
    if (yPosition > 200) {
      pdf.addPage();
      yPosition = 30;
    }
    
    // Treatment history header
    pdf.setFillColor(lightBlue[0], lightBlue[1], lightBlue[2]);
    pdf.rect(15, yPosition - 5, 180, 15, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(255, 255, 255);
    pdf.text('TREATMENT HISTORY', 20, yPosition + 5);
    yPosition += 25;
    
    // Sort treatments by date (newest first)
    const sortedTreatments = [...patient.treatmentEntries].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    sortedTreatments.forEach((treatment, index) => {
      // Check if we need a new page
      if (yPosition > 240) {
        pdf.addPage();
        yPosition = 30;
      }
      
      // Visit card background
      pdf.setFillColor(250, 252, 255);
      const cardHeight = 70; // Estimated height
      pdf.rect(15, yPosition - 5, 180, cardHeight, 'F');
      
      // Visit header with accent
      pdf.setFillColor(accentGreen[0], accentGreen[1], accentGreen[2]);
      pdf.rect(15, yPosition - 5, 5, cardHeight, 'F');
      
      // Visit number and date
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
      pdf.text('Visit ' + (sortedTreatments.length - index), 25, yPosition + 5);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      const visitDate = new Date(treatment.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      pdf.text(visitDate, 25, yPosition + 15);
      
      yPosition += 25;
      
      // Treatment details
      const addTreatmentField = (icon: string, label: string, content: string) => {
        if (content && content.trim()) {
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(9);
          pdf.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
          pdf.text(icon + ' ' + label + ':', 30, yPosition);
          
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(0, 0, 0);
          const lines = pdf.splitTextToSize(content, 150);
          pdf.text(lines, 30, yPosition + 7);
          yPosition += lines.length * 5 + 8;
        }
      };
      
      addTreatmentField('💊', 'PRESCRIBED MEDICATIONS', treatment.medicinePrescriptions);
      addTreatmentField('⚠️', 'MEDICAL ADVISORIES', treatment.advisories);
      addTreatmentField('📝', 'CLINICAL NOTES', treatment.notes);
      
      // Card border
      pdf.setDrawColor(lightGray[0], lightGray[1], lightGray[2]);
      pdf.setLineWidth(0.3);
      pdf.rect(15, yPosition - cardHeight, 180, cardHeight);
      
      yPosition += 15;
    });
  }
  
  // Footer with professional styling
  const pageCount = pdf.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    const pageHeight = pdf.internal.pageSize.height;
    
    // Footer background
    pdf.setFillColor(248, 250, 252);
    pdf.rect(0, pageHeight - 25, 210, 25, 'F');
    
    // Footer line
    pdf.setDrawColor(lightGray[0], lightGray[1], lightGray[2]);
    pdf.setLineWidth(0.5);
    pdf.line(15, pageHeight - 25, 195, pageHeight - 25);
    
    // Footer text
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
    pdf.text('Generated by MediCare Clinic Patient Management System', 20, pageHeight - 15);
    pdf.text('Generated on: ' + new Date().toLocaleDateString(), 20, pageHeight - 8);
    
    // Page number
    pdf.text('Page ' + i + ' of ' + pageCount, 170, pageHeight - 8);
  }
  
  // Save the PDF with improved filename
  const fileName = 'MediCare_' + patient.patientName.replace(/\s+/g, '_') + '_' + patient.referenceNumber + '_' + new Date().toISOString().split('T')[0] + '.pdf';
  pdf.save(fileName);
};
