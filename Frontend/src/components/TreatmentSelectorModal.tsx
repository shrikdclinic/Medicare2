import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Download, Calendar, Pill, FileText, FileStack } from "lucide-react";
import { generatePDF, generateMultiVisitPDF } from "@/utils/pdfGenerator";
import { PatientData, TreatmentEntry } from "@/types/patient";
import { useToast } from "@/hooks/use-toast";

interface TreatmentSelectorModalProps {
  patient: PatientData;
}

const TreatmentSelectorModal: React.FC<TreatmentSelectorModalProps> = ({
  patient,
}) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTreatmentId, setSelectedTreatmentId] = useState<string>("");
  const [downloadMode, setDownloadMode] = useState<"single" | "multiple">(
    "single"
  );
  const [selectedTreatmentIds, setSelectedTreatmentIds] = useState<string[]>(
    []
  );

  const handleDownloadPDF = async () => {
    if (downloadMode === "single") {
      if (!selectedTreatmentId) {
        toast({
          title: "Selection Required",
          description: "Please select a treatment entry to download",
          variant: "destructive",
        });
        return;
      }

      const selectedTreatment = patient.treatmentEntries?.find(
        (treatment, index) =>
          (treatment._id || `treatment-${index}`) === selectedTreatmentId
      );

      if (!selectedTreatment) {
        toast({
          title: "Error",
          description: "Selected treatment not found",
          variant: "destructive",
        });
        return;
      }

      try {
        await generatePDF(patient, selectedTreatment);
        toast({
          title: "PDF Downloaded",
          description: `Treatment record for ${patient.patientName} has been downloaded successfully.`,
        });
        setIsOpen(false);
      } catch (error) {
        console.error("Error generating PDF:", error);
        toast({
          title: "Download Failed",
          description: "Failed to generate PDF. Please try again.",
          variant: "destructive",
        });
      }
    } else {
      // Multiple visits mode
      if (selectedTreatmentIds.length === 0) {
        toast({
          title: "Selection Required",
          description: "Please select at least one treatment entry to download",
          variant: "destructive",
        });
        return;
      }

      const selectedTreatments =
        patient.treatmentEntries?.filter((treatment, index) =>
          selectedTreatmentIds.includes(treatment._id || `treatment-${index}`)
        ) || [];

      if (selectedTreatments.length === 0) {
        toast({
          title: "Error",
          description: "Selected treatments not found",
          variant: "destructive",
        });
        return;
      }

      try {
        await generateMultiVisitPDF(patient, selectedTreatments);
        toast({
          title: "Multi-Visit PDF Downloaded",
          description: `${selectedTreatments.length} visits for ${patient.patientName} downloaded successfully.`,
        });
        setIsOpen(false);
      } catch (error) {
        console.error("Error generating multi-visit PDF:", error);
        toast({
          title: "Download Failed",
          description: "Failed to generate multi-visit PDF. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleTreatmentToggle = (treatmentId: string, checked: boolean) => {
    if (checked) {
      setSelectedTreatmentIds((prev) => [...prev, treatmentId]);
    } else {
      setSelectedTreatmentIds((prev) =>
        prev.filter((id) => id !== treatmentId)
      );
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds =
        patient.treatmentEntries?.map(
          (treatment, index) => treatment._id || `treatment-${index}`
        ) || [];
      setSelectedTreatmentIds(allIds);
    } else {
      setSelectedTreatmentIds([]);
    }
  };

  // If only one treatment, download directly
  const handleTriggerClick = () => {
    if (!patient.treatmentEntries || patient.treatmentEntries.length === 0) {
      toast({
        title: "No Treatment Records",
        description: "This patient has no treatment records to download",
        variant: "destructive",
      });
      return;
    }

    if (patient.treatmentEntries.length === 1) {
      // Download directly if only one treatment
      generatePDF(patient, patient.treatmentEntries[0])
        .then(() => {
          toast({
            title: "PDF Downloaded",
            description: `Treatment record for ${patient.patientName} has been downloaded successfully.`,
          });
        })
        .catch((error) => {
          console.error("Error generating PDF:", error);
          toast({
            title: "Download Failed",
            description: "Failed to generate PDF. Please try again.",
            variant: "destructive",
          });
        });
    } else {
      // Open modal for selection
      setIsOpen(true);
      // Set the latest treatment as default for single mode
      const sortedTreatments = patient.treatmentEntries.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setSelectedTreatmentId(sortedTreatments[0]._id || `treatment-0`);
      // Reset multiple selection
      setSelectedTreatmentIds([]);
      setDownloadMode("single");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          onClick={handleTriggerClick}
          variant="outline"
          size="sm"
          className="flex items-center space-x-2 hover:bg-blue-50 hover:border-blue-300"
        >
          <Download className="h-4 w-4" />
          <span>PDF</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Download className="h-5 w-5 text-blue-600" />
            <span>Download Treatment Report</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Choose how you'd like to download the treatment report for{" "}
            <strong>{patient.patientName}</strong>:
          </p>

          {/* Download Mode Selection */}
          <div className="space-y-3">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="single-mode"
                  name="downloadMode"
                  value="single"
                  checked={downloadMode === "single"}
                  onChange={(e) =>
                    setDownloadMode(e.target.value as "single" | "multiple")
                  }
                  className="h-4 w-4 text-blue-600"
                />
                <Label
                  htmlFor="single-mode"
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span>Single Visit Report</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="multiple-mode"
                  name="downloadMode"
                  value="multiple"
                  checked={downloadMode === "multiple"}
                  onChange={(e) =>
                    setDownloadMode(e.target.value as "single" | "multiple")
                  }
                  className="h-4 w-4 text-blue-600"
                />
                <Label
                  htmlFor="multiple-mode"
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <FileStack className="h-4 w-4 text-green-600" />
                  <span>Multi-Visit Report</span>
                </Label>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              {downloadMode === "single"
                ? "Download a single visit report"
                : "Download multiple visits in one PDF (each visit on a separate page)"}
            </p>
          </div>

          <Separator />

          {downloadMode === "single" ? (
            <RadioGroup
              value={selectedTreatmentId}
              onValueChange={setSelectedTreatmentId}
            >
              {patient.treatmentEntries
                ?.sort(
                  (a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                )
                .map((treatment, index) => {
                  const treatmentId = treatment._id || `treatment-${index}`;
                  return (
                    <div
                      key={treatmentId}
                      className="flex items-start space-x-3"
                    >
                      <RadioGroupItem
                        value={treatmentId}
                        id={treatmentId}
                        className="mt-4"
                      />
                      <Label
                        htmlFor={treatmentId}
                        className="flex-1 cursor-pointer"
                      >
                        <Card className="hover:bg-gray-50 transition-colors">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <Calendar className="h-4 w-4 text-blue-600" />
                                <span className="font-medium">
                                  Visit{" "}
                                  {patient.treatmentEntries.length - index}
                                </span>
                                {index === 0 && (
                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                    Latest
                                  </span>
                                )}
                              </div>
                              <span className="text-sm text-gray-600">
                                {new Date(treatment.date).toLocaleDateString(
                                  "en-US",
                                  {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </span>
                            </div>

                            <div className="space-y-2 text-sm">
                              {treatment.medicinePrescriptions && (
                                <div className="flex items-start space-x-2">
                                  <Pill className="h-3 w-3 text-green-600 mt-1 flex-shrink-0" />
                                  <div className="flex-1">
                                    <p className="text-gray-700 font-medium">
                                      Prescriptions:
                                    </p>
                                    <p className="text-gray-600 line-clamp-2">
                                      {treatment.medicinePrescriptions}
                                    </p>
                                  </div>
                                </div>
                              )}

                              {treatment.advisories && (
                                <div className="flex items-start space-x-2">
                                  <FileText className="h-3 w-3 text-blue-600 mt-1 flex-shrink-0" />
                                  <div className="flex-1">
                                    <p className="text-gray-700 font-medium">
                                      Advisories:
                                    </p>
                                    <p className="text-gray-600 line-clamp-2">
                                      {treatment.advisories}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </Label>
                    </div>
                  );
                })}
            </RadioGroup>
          ) : (
            /* Multiple visits mode */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">
                  Select visits to include in the report:
                </h4>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all"
                    checked={
                      selectedTreatmentIds.length ===
                      patient.treatmentEntries?.length
                    }
                    onCheckedChange={handleSelectAll}
                  />
                  <Label
                    htmlFor="select-all"
                    className="text-sm cursor-pointer"
                  >
                    Select All
                  </Label>
                </div>
              </div>

              <div className="space-y-3 max-h-60 overflow-y-auto">
                {patient.treatmentEntries
                  ?.sort(
                    (a, b) =>
                      new Date(b.date).getTime() - new Date(a.date).getTime()
                  )
                  .map((treatment, index) => {
                    const treatmentId = treatment._id || `treatment-${index}`;
                    return (
                      <div
                        key={treatmentId}
                        className="flex items-start space-x-3"
                      >
                        <Checkbox
                          id={`checkbox-${treatmentId}`}
                          checked={selectedTreatmentIds.includes(treatmentId)}
                          onCheckedChange={(checked) =>
                            handleTreatmentToggle(
                              treatmentId,
                              checked as boolean
                            )
                          }
                          className="mt-4"
                        />
                        <Label
                          htmlFor={`checkbox-${treatmentId}`}
                          className="flex-1 cursor-pointer"
                        >
                          <Card className="hover:bg-gray-50 transition-colors">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  <Calendar className="h-4 w-4 text-blue-600" />
                                  <span className="font-medium">
                                    Visit{" "}
                                    {patient.treatmentEntries.length - index}
                                  </span>
                                  {index === 0 && (
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                      Latest
                                    </span>
                                  )}
                                </div>
                                <span className="text-sm text-gray-600">
                                  {new Date(treatment.date).toLocaleDateString(
                                    "en-US",
                                    {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }
                                  )}
                                </span>
                              </div>

                              <div className="space-y-2 text-sm">
                                {treatment.medicinePrescriptions && (
                                  <div className="flex items-start space-x-2">
                                    <Pill className="h-3 w-3 text-green-600 mt-1 flex-shrink-0" />
                                    <div className="flex-1">
                                      <p className="text-gray-700 font-medium">
                                        Prescriptions:
                                      </p>
                                      <p className="text-gray-600 line-clamp-2">
                                        {treatment.medicinePrescriptions}
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {treatment.advisories && (
                                  <div className="flex items-start space-x-2">
                                    <FileText className="h-3 w-3 text-blue-600 mt-1 flex-shrink-0" />
                                    <div className="flex-1">
                                      <p className="text-gray-700 font-medium">
                                        Advisories:
                                      </p>
                                      <p className="text-gray-600 line-clamp-2">
                                        {treatment.advisories}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </Label>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleDownloadPDF}
              disabled={
                downloadMode === "single"
                  ? !selectedTreatmentId
                  : selectedTreatmentIds.length === 0
              }
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Download className="h-4 w-4 mr-2" />
              {downloadMode === "single"
                ? "Download PDF"
                : `Download ${selectedTreatmentIds.length} Visit${
                    selectedTreatmentIds.length !== 1 ? "s" : ""
                  } PDF`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TreatmentSelectorModal;
