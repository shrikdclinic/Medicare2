import jsPDF from "jspdf";
import { PatientData, TreatmentEntry } from "@/types/patient"; // Assuming types are in this path
import logo from "@/assets/nobglogo.png"; // Assuming logo is in this path

// Main function for generating a single PDF, defaults to "visit - 1"
export const generatePDF = async (
  patient: PatientData,
  treatment: TreatmentEntry
) => {
  const pdf = new jsPDF("p", "mm", "a4");
  // A single call to generatePDF is always visit 1 of 1.
  await generateSingleVisitPage(pdf, patient, treatment, 1, 1);

  const fileName = `Record_${patient.patientName.replace(/\s+/g, "_")}_${
    patient.referenceNumber
  }.pdf`;
  pdf.save(fileName);
};

/**
 * Generates a multi-visit PDF where each visit is on a separate page
 */
export const generateMultiVisitPDF = async (
  patient: PatientData,
  treatments: TreatmentEntry[]
) => {
  if (!treatments || treatments.length === 0) {
    throw new Error("No treatments provided for PDF generation");
  }

  // Sort treatments by date (oldest first for logical page order)
  const sortedTreatments = treatments.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const pdf = new jsPDF("p", "mm", "a4");

  // Generate a page for each treatment
  for (let i = 0; i < sortedTreatments.length; i++) {
    if (i > 0) {
      pdf.addPage();
    }
    await generateSingleVisitPage(
      pdf,
      patient,
      sortedTreatments[i],
      i + 1, // Page number (visit number)
      sortedTreatments.length // Total pages
    );
  }

  // Save the multi-visit PDF
  const fileName = `MultiVisit_Record_${patient.patientName.replace(
    /\s+/g,
    "_"
  )}_${patient.referenceNumber}_${sortedTreatments.length}visits.pdf`;
  pdf.save(fileName);
};

/**
 * HELPER FUNCTION: Generates a single page for a visit.
 * This is the core logic that creates the visual layout.
 */
const generateSingleVisitPage = async (
  pdf: jsPDF,
  patient: PatientData,
  treatment: TreatmentEntry,
  pageNumber: number,
  totalPages: number
) => {
  // --- Professional Color & Style Definitions ---
  const primaryColor = [45, 52, 54] as const; // Dark Slate
  const secondaryColor = [9, 132, 227] as const; // Bright Blue
  const mutedColor = [178, 190, 195] as const; // Light Gray
  const backgroundColor = [245, 246, 250] as const; // Off-white
  const whiteColor = [255, 255, 255] as const;
  const textColor = [45, 52, 54] as const;

  // --- Page and Layout Variables ---
  const pageMargin = 15;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const contentWidth = pageWidth - pageMargin * 2;
  const pageHeight = pdf.internal.pageSize.getHeight();
  const maxContentY = pageHeight - 30; // Reserve space for footer

  // --- Reusable Drawing Functions ---
  const drawRoundedRect = (
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
    style: "F" | "FD" | "S" = "F"
  ) => {
    pdf.roundedRect(x, y, w, h, r, r, style);
  };

  const drawSectionHeader = (title: string, y: number): number => {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.setTextColor(...secondaryColor);
    pdf.text(title, pageMargin, y);
    pdf.setDrawColor(...mutedColor);
    pdf.setLineWidth(0.5);
    pdf.line(pageMargin, y + 3, pageMargin + contentWidth, y + 3);
    return y + 12;
  };

  const drawHorizontalGrid = (
    text: string,
    y: number,
    maxItems?: number
  ): number => {
    const startY = y;
    let points = text
      ? text
          .split(/\n/)
          .map((p) => p.replace(/^\d+\.\s*/, "").trim())
          .filter(Boolean)
      : [];
    if (maxItems && points.length > maxItems) {
      points = points.slice(0, maxItems);
    }
    if (points.length === 0) {
      pdf
        .setFont("helvetica", "italic")
        .setFontSize(8)
        .setTextColor(...mutedColor);
      pdf.text("No items recorded for this section.", pageMargin + 5, y);
      return 15;
    }
    const itemPadding = 10,
      rowHeight = 6,
      numColumns = 3;
    const colWidth =
      (contentWidth - itemPadding * (numColumns - 1)) / numColumns;
    let currentY = y;
    for (let i = 0; i < points.length; i++) {
      const colIndex = i % numColumns;
      if (currentY + rowHeight > maxContentY) {
        break;
      }
      const currentX = pageMargin + (colWidth + itemPadding) * colIndex;
      const itemNumber = `${i + 1}.`;
      const numberWidth =
        (pdf.getStringUnitWidth(itemNumber) * pdf.getFontSize()) /
          pdf.internal.scaleFactor +
        2;
      pdf
        .setTextColor(...secondaryColor)
        .setFont("helvetica", "bold")
        .setFontSize(9);
      pdf.text(itemNumber, currentX, currentY);
      pdf
        .setTextColor(...textColor)
        .setFont("helvetica", "normal")
        .setFontSize(9);
      const truncatedText = pdf.splitTextToSize(
        points[i],
        colWidth - numberWidth
      )[0];
      pdf.text(truncatedText, currentX + numberWidth, currentY);
      if (colIndex === numColumns - 1) {
        currentY += rowHeight;
      }
    }
    return currentY - startY + 10;
  };

  // --- 1. Background ---
  pdf.setFillColor(...backgroundColor);
  pdf.rect(0, 0, pageWidth, pageHeight, "F");

  // --- 2. Header ---
  const headerHeight = 30;
  pdf.setFillColor(...whiteColor);
  drawRoundedRect(pageMargin, 10, contentWidth, headerHeight, 3, "F");
  if (logo) {
    pdf.addImage(logo, "PNG", pageMargin + 5, 15, 20, 20);
  }
  pdf
    .setFont("helvetica", "bold")
    .setFontSize(16)
    .setTextColor(...primaryColor);
  pdf.text("SHRI K D HOMEOPATHIC", pageMargin + 30, 23);
  pdf
    .setFont("helvetica", "normal")
    .setFontSize(10)
    .setTextColor(...secondaryColor);
  pdf.text("CLINIC AND PHARMACY", pageMargin + 30, 30);
  pdf.setFont("helvetica", "bold").setTextColor(...primaryColor);
  pdf.text("Dr. RAHUL KATARIYA", pageWidth - pageMargin - 45, 23, {
    align: "left",
  });
  pdf.setFont("helvetica", "normal").setTextColor(...textColor);
  pdf.text("BHMS, MD(EH)", pageWidth - pageMargin - 45, 30, { align: "left" });
  pdf.text("Reg. No. 22880", pageWidth - pageMargin - 45, 36, {
    align: "left",
  });

  // --- 3. Patient Details Section ---
  let yPosition = headerHeight + 25;
  pdf
    .setFont("helvetica", "bold")
    .setFontSize(18)
    .setTextColor(...primaryColor);
  // CHANGE 1: Title now includes the visit number
  pdf.text(
    `Patient Medical Record visit - ${pageNumber}`,
    pageMargin,
    yPosition
  );
  yPosition += 10;

  pdf
    .setFillColor(...whiteColor)
    .setDrawColor(...mutedColor)
    .setLineWidth(0.2);
  // Adjusted height to fit the new 3-row layout
  drawRoundedRect(pageMargin, yPosition, contentWidth, 42, 3, "FD");

  // CHANGE 2 & 3: New patient details layout matching the image
  // CHANGE 2: Format patient name with age and gender
  const genderChar = patient.gender
    ? patient.gender.charAt(0).toUpperCase()
    : "U"; // U for Unknown instead of defaulting to M
  const patientDisplayName = patient.prefix
    ? `${patient.prefix} ${patient.patientName}`
    : patient.patientName;
  const formattedName = `${patientDisplayName} / ${patient.age} ${genderChar}`;

  const detailsFields = [
    // Row 1
    { label: "PATIENT NAME", value: formattedName },
    { label: "PATIENT ID", value: patient.referenceNumber || "N/A" },
    {
      label: "RECORD DATE",
      value: new Date(treatment.date).toLocaleDateString("en-GB"),
    },
    // Row 2
    { label: "WEIGHT", value: patient.weight ? `${patient.weight} kg` : "N/A" },
    { label: "BP", value: patient.bp ? `${patient.bp} mmHg` : "N/A" },
    { label: "RBS", value: patient.rbs ? `${patient.rbs} mg/dL` : "N/A" },
    // Row 3
    { label: "CONTACT", value: patient.contactNumber || "N/A" },
    { label: "ADDRESS", value: patient.address || "N/A" },
    { label: "REFERENCE", value: patient.referencePerson || "N/A" },
  ];

  const colWidth = contentWidth / 3;
  const rowHeight = 13;

  detailsFields.forEach((field, i) => {
    const rowIndex = Math.floor(i / 3);
    const colIndex = i % 3;
    const x = pageMargin + colWidth * colIndex + 5; // +5 for inner padding
    const y = yPosition + rowHeight * rowIndex + 7;

    pdf
      .setFont("helvetica", "bold")
      .setFontSize(8)
      .setTextColor(...mutedColor);
    pdf.text(field.label, x, y);

    pdf
      .setFont("helvetica", "normal")
      .setFontSize(10)
      .setTextColor(...textColor);
    pdf.text(field.value, x, y + 5);
  });

  yPosition += 55; // Move cursor down past the details box

  // --- 4. Medical Information Sections ---
  if (yPosition < maxContentY && patient.patientProblem) {
    yPosition = drawSectionHeader("Patient Problems & Symptoms", yPosition);
    yPosition += drawHorizontalGrid(patient.patientProblem, yPosition, 21);
  }

  // Dynamic section titles based on visit number
  if (yPosition < maxContentY) {
    const medicineTitle =
      pageNumber === 1 ? "Medicine Prescriptions" : "Follow-up";
    yPosition = drawSectionHeader(medicineTitle, yPosition);
    yPosition += drawHorizontalGrid(
      treatment.medicinePrescriptions || "",
      yPosition
    );
  }

  if (yPosition < maxContentY) {
    const advisories = treatment.advisories || treatment.notes || "";
    const advisoryTitle =
      pageNumber === 1 ? "Medical Advisories & Instructions" : "Prescriptions";
    yPosition = drawSectionHeader(advisoryTitle, yPosition);
    yPosition += drawHorizontalGrid(advisories, yPosition);
  }

  // --- 5. Footer ---
  const footerY = pageHeight - 15;
  pdf.setDrawColor(...mutedColor).setLineWidth(0.3);
  pdf.line(pageMargin, footerY, pageWidth - pageMargin, footerY);
  pdf
    .setFont("helvetica", "normal")
    .setFontSize(8)
    .setTextColor(...mutedColor);
  pdf.text("SHRI K D HOMEOPATHIC CLINIC", pageMargin, footerY + 5);
  const generationDate = `Generated on: ${new Date().toLocaleDateString(
    "en-GB"
  )} | Visit ${pageNumber}/${totalPages}`;
  pdf.text(generationDate, pageWidth - pageMargin, footerY + 5, {
    align: "right",
  });
};
