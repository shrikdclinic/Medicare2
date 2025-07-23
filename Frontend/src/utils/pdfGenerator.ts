import jsPDF from "jspdf";
import { PatientData, TreatmentEntry } from "@/types/patient"; // Assuming types are in this path
import logo from "@/assets/nobglogo.png"; // Assuming logo is in this path

export const generatePDF = async (
  patient: PatientData,
  treatment: TreatmentEntry
) => {
  const pdf = new jsPDF("p", "mm", "a4");

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

  /**
   * Draws a rectangle with rounded corners.
   */
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

  /**
   * Creates a standardized, professional-looking header for each section.
   */
  const drawSectionHeader = (title: string, y: number): number => {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.setTextColor(...secondaryColor);
    pdf.text(title, pageMargin, y);
    pdf.setDrawColor(...mutedColor);
    pdf.setLineWidth(0.2);
    pdf.line(pageMargin, y + 2, pageWidth - pageMargin, y + 2);
    return y + 10;
  };

  /**
   * Draws medical items in a 3-column horizontal grid with numbers.
   * @param maxItems - Maximum number of items to display (for symptoms limiting)
   * @returns The total height of the generated grid.
   */
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

    // Limit items if maxItems is specified (for symptoms)
    if (maxItems && points.length > maxItems) {
      points = points.slice(0, maxItems);
    }

    if (points.length === 0) {
      pdf.setFont("helvetica", "italic");
      pdf.setFontSize(9);
      pdf.setTextColor(...mutedColor);
      pdf.text("No items recorded for this section.", pageMargin + 5, y);
      return 15;
    }

    const itemPadding = 10;
    const rowHeight = 7;
    const numColumns = 3;
    const colWidth =
      (contentWidth - itemPadding * (numColumns - 1)) / numColumns;
    let currentY = y;
    let isTruncated = false;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(...textColor);

    for (let i = 0; i < points.length; i++) {
      const colIndex = i % numColumns;

      if (currentY + rowHeight > maxContentY) {
        isTruncated = true;
        break;
      }

      const currentX = pageMargin + (colWidth + itemPadding) * colIndex;
      const itemNumber = `${i + 1}.`;
      const numberWidth =
        (pdf.getStringUnitWidth(itemNumber) * pdf.getFontSize()) /
          pdf.internal.scaleFactor +
        2;

      // Draw item number
      pdf.setTextColor(...secondaryColor);
      pdf.setFont("helvetica", "bold");
      pdf.text(itemNumber, currentX, currentY);

      // Draw item text
      pdf.setTextColor(...textColor);
      pdf.setFont("helvetica", "normal");
      const truncatedText = pdf.splitTextToSize(
        points[i],
        colWidth - numberWidth
      )[0];
      pdf.text(truncatedText, currentX + numberWidth, currentY);

      if (colIndex === numColumns - 1) {
        currentY += rowHeight;
      }
    }

    if (isTruncated) {
      pdf
        .setFont("helvetica", "italic")
        .setTextColor(...mutedColor)
        .text("[...content truncated to fit page]", pageMargin, currentY + 5);
    }

    // Add note if items were limited due to maxItems
    if (
      maxItems &&
      text &&
      text.split(/\n/).filter(Boolean).length > maxItems
    ) {
      pdf.setFont("helvetica", "italic").setTextColor(...mutedColor);
      pdf.text(
        `[Showing first ${maxItems} symptoms - ${
          text.split(/\n/).filter(Boolean).length - maxItems
        } more in full record]`,
        pageMargin,
        currentY + (isTruncated ? 10 : 5)
      );
      return currentY - startY + 15;
    }

    return currentY - startY + (isTruncated ? 10 : 10);
  };

  // =================================================================
  //                       PDF DOCUMENT GENERATION
  // =================================================================

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

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.setTextColor(...primaryColor);
  pdf.text("SHRI K D HOMEOPATHIC", pageMargin + 30, 23);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(...secondaryColor);
  pdf.text("CLINIC AND PHARMACY", pageMargin + 30, 30);

  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...primaryColor);
  pdf.text("Dr. RAHUL KATARIYA", pageWidth - pageMargin - 45, 23, {
    align: "left",
  });
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(...textColor);
  pdf.text("BHMS, MD(EH)", pageWidth - pageMargin - 45, 30, { align: "left" });
  pdf.text("Reg. No. 22880", pageWidth - pageMargin - 45, 36, {
    align: "left",
  });

  // --- 3. Patient Details Section ---
  let yPosition = headerHeight + 25;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.setTextColor(...primaryColor);
  pdf.text("Patient Medical Record", pageMargin, yPosition);
  yPosition += 10;

  pdf.setFillColor(...whiteColor);
  pdf.setDrawColor(...mutedColor);
  pdf.setLineWidth(0.2);
  drawRoundedRect(pageMargin, yPosition, contentWidth, 50, 3, "FD");

  const cellY = yPosition + 10;
  const fields = [
    { label: "Patient Name", value: patient.patientName },
    { label: "Patient ID", value: patient.referenceNumber || "N/A" },
    {
      label: "Record Date",
      value: new Date(treatment.date).toLocaleDateString("en-GB"),
    },
  ];
  const colWidthDetails = contentWidth / fields.length;

  fields.forEach((field, i) => {
    const x = pageMargin + colWidthDetails * i;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(...secondaryColor);
    pdf.text(field.label.toUpperCase(), x + 10, cellY);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(...textColor);
    pdf.text(field.value, x + 10, cellY + 6);

    if (i < fields.length - 1) {
      pdf.setDrawColor(...backgroundColor);
      pdf.line(
        x + colWidthDetails,
        yPosition + 2,
        x + colWidthDetails,
        yPosition + 30
      );
    }
  });

  // Add vital signs section
  const vitalSignsY = yPosition + 22;
  const vitalFields = [
    { label: "Weight", value: patient.weight ? `${patient.weight} kg` : "N/A" },
    { label: "Height", value: patient.height || "N/A" },
    { label: "RBS", value: patient.rbs ? `${patient.rbs} mg/dL` : "N/A" },
    { label: "Age", value: `${patient.age} Years` },
  ];
  const vitalColWidth = contentWidth / 4;
  vitalFields.forEach((field, i) => {
    const x = pageMargin + vitalColWidth * i;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(...mutedColor);
    pdf.text(field.label.toUpperCase(), x + 10, vitalSignsY);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(...textColor);
    pdf.text(field.value, x + 10, vitalSignsY + 5);
  });

  const subFields = [
    { label: "Contact", value: patient.contactNumber || "N/A" },
    { label: "Address", value: patient.address || "N/A" },
    { label: "Reference", value: patient.referencePerson || "N/A" },
  ];
  const subY = yPosition + 34;
  const subColWidth = contentWidth / 3;
  subFields.forEach((field, i) => {
    const x = pageMargin + subColWidth * i;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(...mutedColor);
    pdf.text(field.label.toUpperCase(), x + 10, subY);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(...textColor);
    pdf.text(
      pdf.splitTextToSize(field.value, subColWidth - 12),
      x + 10,
      subY + 5
    );
  });

  yPosition += 63; // Move cursor down past the expanded details box

  // --- 4. Medical Information Sections ---

  // Patient Problems & Symptoms (limited to 21 items)
  if (yPosition < maxContentY) {
    yPosition = drawSectionHeader("Patient Problems & Symptoms", yPosition);
    yPosition += drawHorizontalGrid(
      patient.patientProblem || "",
      yPosition,
      21
    );
  }

  // Medicine Prescriptions (no limit - highest priority)
  if (yPosition < maxContentY) {
    yPosition = drawSectionHeader("Medicine Prescriptions", yPosition);
    yPosition += drawHorizontalGrid(
      treatment.medicinePrescriptions || "",
      yPosition
    );
  }

  // Medical Advisories & Instructions (can be cut if space runs out)
  if (yPosition < maxContentY) {
    const advisories = treatment.advisories || treatment.notes || "";
    yPosition = drawSectionHeader(
      "Medical Advisories & Instructions",
      yPosition
    );
    yPosition += drawHorizontalGrid(advisories, yPosition);
  }

  // --- 5. Footer ---
  const footerY = pageHeight - 15;
  pdf.setDrawColor(...mutedColor);
  pdf.setLineWidth(0.3);
  pdf.line(pageMargin, footerY, pageWidth - pageMargin, footerY);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(...mutedColor);
  pdf.text(
    "SHRI K D HOMEOPATHIC CLINIC",
    pageMargin,
    footerY + 5
  );
  const generationDate = `Generated on: ${new Date().toLocaleDateString(
    "en-GB"
  )}`;
  pdf.text(generationDate, pageWidth - pageMargin, footerY + 5, {
    align: "right",
  });

  // --- 6. Generate and Save PDF ---
  const fileName = `Record_${patient.patientName.replace(/\s+/g, "_")}_${
    patient.referenceNumber
  }.pdf`;
  pdf.save(fileName);
};
