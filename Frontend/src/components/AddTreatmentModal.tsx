import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pill, FileText, Scale, Ruler, Activity } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface AddTreatmentModalProps {
  patientId: string;
  onTreatmentAdded: () => void;
}

const AddTreatmentModal: React.FC<AddTreatmentModalProps> = ({
  patientId,
  onTreatmentAdded,
}) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    medicinePrescriptions: "1. ",
    advisories: "1. ",
    notes: "",
    weight: "",
    height: "",
    rbs: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePrescriptionKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const currentValue = e.currentTarget.value;
      const lines = currentValue.split("\n");
      const nextNumber = lines.length + 1;
      const newValue = currentValue + `\n${nextNumber}. `;
      setFormData((prev) => ({
        ...prev,
        medicinePrescriptions: newValue,
      }));
    }
  };

  const handleAdvisoryKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const currentValue = e.currentTarget.value;
      const lines = currentValue.split("\n");
      const nextNumber = lines.length + 1;
      const newValue = currentValue + `\n${nextNumber}. `;
      setFormData((prev) => ({
        ...prev,
        advisories: newValue,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!formData.medicinePrescriptions.trim()) {
        toast({
          title: "Missing Information",
          description: "Please add at least one medicine prescription",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      const token = localStorage.getItem("authToken");
      if (!token) {
        toast({
          title: "Authentication Required",
          description: "Please log in to add treatment",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/patients/${patientId}/treatments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to add treatment");
      }

      toast({
        title: "Treatment Added",
        description: "New treatment entry has been added successfully",
      });

      // Reset form
      setFormData({
        medicinePrescriptions: "1. ",
        advisories: "1. ",
        notes: "",
        weight: "",
        height: "",
        rbs: "",
      });

      setIsOpen(false);
      onTreatmentAdded();
    } catch (error) {
      console.error("Error adding treatment:", error);
      toast({
        title: "Error",
        description: "Failed to add treatment entry. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4 mr-2" />
          Add New Visit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5 text-green-600" />
            <span>Add New Treatment Entry</span>
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Vital Signs Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
              <Activity className="h-5 w-5 text-blue-600" />
              <span>Update Vital Signs (Optional)</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight" className="flex items-center space-x-2">
                  <Scale className="h-4 w-4 text-blue-600" />
                  <span>Weight (kg)</span>
                </Label>
                <Input
                  id="weight"
                  name="weight"
                  value={formData.weight}
                  onChange={handleInputChange}
                  placeholder="Enter current weight"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height" className="flex items-center space-x-2">
                  <Ruler className="h-4 w-4 text-blue-600" />
                  <span>Height</span>
                </Label>
                <Input
                  id="height"
                  name="height"
                  value={formData.height}
                  onChange={handleInputChange}
                  placeholder="Enter height"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rbs" className="flex items-center space-x-2">
                  <Activity className="h-4 w-4 text-blue-600" />
                  <span>RBS (mg/dL)</span>
                </Label>
                <Input
                  id="rbs"
                  name="rbs"
                  value={formData.rbs}
                  onChange={handleInputChange}
                  placeholder="Enter RBS level"
                />
              </div>
            </div>
          </div>

          {/* Medicine Prescriptions */}
          <div className="space-y-2">
            <Label
              htmlFor="medicinePrescriptions"
              className="flex items-center space-x-2"
            >
              <Pill className="h-4 w-4 text-green-600" />
              <span>Medicine Prescriptions *</span>
            </Label>
            <Textarea
              id="medicinePrescriptions"
              name="medicinePrescriptions"
              value={formData.medicinePrescriptions}
              onChange={handleInputChange}
              onKeyDown={handlePrescriptionKeyDown}
              placeholder="1. Medicine name, dosage, frequency..."
              rows={6}
              required
              className="transition-all duration-200 focus:ring-2 focus:ring-green-500"
            />
            <p className="text-sm text-gray-500">
              Press Enter to add a new medicine (auto-numbered)
            </p>
          </div>

          {/* Medical Advisories */}
          <div className="space-y-2">
            <Label htmlFor="advisories" className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <span>Medical Advisories & Instructions</span>
            </Label>
            <Textarea
              id="advisories"
              name="advisories"
              value={formData.advisories}
              onChange={handleInputChange}
              onKeyDown={handleAdvisoryKeyDown}
              placeholder="1. Medical advice, diet instructions, precautions..."
              rows={4}
              className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-sm text-gray-500">
              Press Enter to add a new advisory (auto-numbered)
            </p>
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-gray-600" />
              <span>Additional Notes</span>
            </Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Any additional observations, patient feedback, or notes..."
              rows={3}
              className="transition-all duration-200 focus:ring-2 focus:ring-gray-500"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? "Adding..." : "Add Treatment Entry"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTreatmentModal;
