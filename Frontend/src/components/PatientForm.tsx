import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Save,
  User,
  MapPin,
  Phone,
  Hash,
  Pill,
  FileText,
  UserCheck,
  ClipboardList,
  Scale,
  Heart,
  Activity,
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const PatientForm = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    patientName: "",
    age: "",
    weight: "",
    bp: "",
    rbs: "",
    address: "",
    referenceNumber: "",
    referencePerson: "",
    contactNumber: "",
    patientProblem: "1. ",
    medicinePrescriptions: "1. ",
    advisories: "1. ",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProblemKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (e.key === "Enter") {
      e.preventDefault(); // prevent default newline

      const value = formData.patientProblem;
      const lines = value.split("\n");
      const lastLine = lines[lines.length - 1];

      // If last line starts with a number, count next
      const match = lastLine.match(/^(\d+)\./);
      const nextNumber = match ? parseInt(match[1], 10) + 1 : lines.length + 1;

      const updatedValue = value + `\n${nextNumber}. `;

      setFormData((prev) => ({
        ...prev,
        patientProblem: updatedValue,
      }));
    }
  };
  const handleProblemKeyDown2 = (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (e.key === "Enter") {
      e.preventDefault(); // prevent default newline

      const value = formData.medicinePrescriptions;
      const lines = value.split("\n");
      const lastLine = lines[lines.length - 1];

      // If last line starts with a number, count next
      const match = lastLine.match(/^(\d+)\./);
      const nextNumber = match ? parseInt(match[1], 10) + 1 : lines.length + 1;

      const updatedValue2 = value + `\n${nextNumber}. `;

      setFormData((prev) => ({
        ...prev,
        medicinePrescriptions: updatedValue2,
      }));
    }
  };
  const handleProblemKeyDown3 = (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (e.key === "Enter") {
      e.preventDefault(); // prevent default newline

      const value = formData.advisories;
      const lines = value.split("\n");
      const lastLine = lines[lines.length - 1];

      // If last line starts with a number, count next
      const match = lastLine.match(/^(\d+)\./);
      const nextNumber = match ? parseInt(match[1], 10) + 1 : lines.length + 1;

      const updatedValue3 = value + `\n${nextNumber}. `;

      setFormData((prev) => ({
        ...prev,
        advisories: updatedValue3,
      }));
    }
  };

  const generateReferenceNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    return `SKD-${timestamp}-${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (!formData.patientName || !formData.age || !formData.contactNumber) {
        toast({
          title: "Missing Information",
          description:
            "Please fill in all required fields (Name, Age, Contact Number)",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      const token = localStorage.getItem("authToken");

      if (!token) {
        toast({
          title: "Authentication Required",
          description: "Please log in to create a patient record",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Create patient via API
      const response = await fetch(`${API_BASE_URL}/patients`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          referenceNumber:
            formData.referenceNumber || generateReferenceNumber(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create patient");
      }

      toast({
        title: "Patient Record Saved",
        description: `Patient ${formData.patientName} has been successfully registered with ID ${data.data.referenceNumber}`,
      });

      // Reset form
      setFormData({
        patientName: "",
        age: "",
        weight: "",
        bp: "",
        rbs: "",
        address: "",
        referenceNumber: "",
        referencePerson: "",
        contactNumber: "",
        patientProblem: "",
        medicinePrescriptions: "",
        advisories: "",
      });
    } catch (error) {
      console.error("Error creating patient:", error);
      toast({
        title: "Error",
        description: "Failed to save patient record. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ID (formerly Reference Number) */}
        <div className="space-y-2">
          <Label
            htmlFor="referenceNumber"
            className="flex items-center space-x-2"
          >
            <Hash className="h-4 w-4 text-blue-600" />
            <span>ID</span>
          </Label>
          <Input
            id="referenceNumber"
            name="referenceNumber"
            value={formData.referenceNumber}
            onChange={handleInputChange}
            placeholder="Auto-generated if left empty"
            className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {/* Patient Name */}
        <div className="space-y-2">
          <Label htmlFor="patientName" className="flex items-center space-x-2">
            <User className="h-4 w-4 text-blue-600" />
            <span>Patient Name *</span>
          </Label>
          <Input
            id="patientName"
            name="patientName"
            value={formData.patientName}
            onChange={handleInputChange}
            placeholder="Enter patient's full name"
            required
            className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Age */}
        <div className="space-y-2">
          <Label htmlFor="age" className="flex items-center space-x-2">
            <Hash className="h-4 w-4 text-blue-600" />
            <span>Age *</span>
          </Label>
          <Input
            id="age"
            name="age"
            type="number"
            value={formData.age}
            onChange={handleInputChange}
            placeholder="Enter age"
            required
            min="0"
            max="150"
            className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Weight */}
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
            placeholder="Enter weight in kg"
            className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* BP */}
        <div className="space-y-2">
          <Label htmlFor="bp" className="flex items-center space-x-2">
            <Heart className="h-4 w-4 text-blue-600" />
            <span>BP (mmHg)</span>
          </Label>
          <Input
            id="bp"
            name="bp"
            value={formData.bp}
            onChange={handleInputChange}
            placeholder="Enter blood pressure (e.g., 120/80)"
            className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* RBS */}
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
            placeholder="Enter Random Blood Sugar level"
            className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Contact Number */}
        <div className="space-y-2">
          <Label
            htmlFor="contactNumber"
            className="flex items-center space-x-2"
          >
            <Phone className="h-4 w-4 text-blue-600" />
            <span>Contact Number *</span>
          </Label>
          <Input
            id="contactNumber"
            name="contactNumber"
            value={formData.contactNumber}
            onChange={handleInputChange}
            placeholder="Enter contact number"
            required
            className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Reference Person */}
        <div className="space-y-2 md:col-span-2">
          <Label
            htmlFor="referencePerson"
            className="flex items-center space-x-2"
          >
            <UserCheck className="h-4 w-4 text-blue-600" />
            <span>Reference Person Name</span>
          </Label>
          <Input
            id="referencePerson"
            name="referencePerson"
            value={formData.referencePerson}
            onChange={handleInputChange}
            placeholder="Enter reference person's name (if any)"
            className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <Separator />

      {/* Address */}
      <div className="space-y-2">
        <Label htmlFor="address" className="flex items-center space-x-2">
          <MapPin className="h-4 w-4 text-blue-600" />
          <span>Address</span>
        </Label>
        <Textarea
          id="address"
          name="address"
          value={formData.address}
          onChange={handleInputChange}
          placeholder="Enter complete address"
          rows={3}
          className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Patient Problem */}
      <div className="space-y-2">
        <Label htmlFor="patientProblem" className="flex items-center space-x-2">
          <ClipboardList className="h-4 w-4 text-blue-600" />
          <span>Patient's Problem/Symptoms</span>
        </Label>
        <Textarea
          id="patientProblem"
          name="patientProblem"
          value={formData.patientProblem}
          onChange={handleInputChange}
          onKeyDown={handleProblemKeyDown}
          placeholder="Describe the patient's current health problem or symptoms"
          rows={4}
          className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Medicine Prescriptions */}
      <div className="space-y-2">
        <Label
          htmlFor="medicinePrescriptions"
          className="flex items-center space-x-2"
        >
          <Pill className="h-4 w-4 text-blue-600" />
          <span>Medicine Prescriptions</span>
        </Label>
        <Textarea
          id="medicinePrescriptions"
          name="medicinePrescriptions"
          value={formData.medicinePrescriptions}
          onChange={handleInputChange}
          onKeyDown={handleProblemKeyDown2}
          placeholder="List prescribed medicines, dosages, and instructions"
          rows={5}
          className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Advisories */}
      <div className="space-y-2">
        <Label htmlFor="advisories" className="flex items-center space-x-2">
          <FileText className="h-4 w-4 text-blue-600" />
          <span>Medical Advisories</span>
        </Label>
        <Textarea
          id="advisories"
          name="advisories"
          value={formData.advisories}
          onChange={handleInputChange}
          onKeyDown={handleProblemKeyDown3}
          placeholder="Enter any medical advisories or recommendations for the patient"
          rows={4}
          className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex justify-end pt-4">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2"
        >
          <Save className="h-4 w-4" />
          <span>{isSubmitting ? "Saving..." : "Save Patient Record"}</span>
        </Button>
      </div>
    </form>
  );
};

export default PatientForm;
