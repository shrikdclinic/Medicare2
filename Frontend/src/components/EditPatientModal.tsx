import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Save,
  Plus,
  Calendar,
  Pill,
  FileText,
  Trash2,
  Scale,
  Heart,
  Activity,
  User,
  UserCheck,
  Users,
} from "lucide-react";
import { PatientData, TreatmentEntry } from "@/types/patient";

interface EditPatientModalProps {
  patient: PatientData | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedPatient: PatientData) => void;
}

const EditPatientModal = ({
  patient,
  isOpen,
  onClose,
  onSave,
}: EditPatientModalProps) => {
  const { toast } = useToast();
  const [editedPatient, setEditedPatient] = useState<PatientData | null>(null);
  const [newTreatmentEntry, setNewTreatmentEntry] = useState<
    Omit<TreatmentEntry, "id">
  >({
    date: new Date().toISOString().split("T")[0],
    medicinePrescriptions: "",
    advisories: "",
    notes: "",
  });

  useEffect(() => {
    if (patient) {
      setEditedPatient({
        ...patient,
        treatmentEntries: patient.treatmentEntries || [],
      });
    }
  }, [patient]);

  const handleBasicInfoChange = (field: keyof PatientData, value: string) => {
    if (editedPatient) {
      setEditedPatient({
        ...editedPatient,
        [field]: value,
      });
    }
  };

  const handleAddTreatmentEntry = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!newTreatmentEntry.medicinePrescriptions.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter medicine prescriptions for this visit",
        variant: "destructive",
      });
      return;
    }

    if (editedPatient) {
      const entry: TreatmentEntry = {
        ...newTreatmentEntry,
        id: Date.now().toString(),
      };

      setEditedPatient({
        ...editedPatient,
        treatmentEntries: [...editedPatient.treatmentEntries, entry],
      });

      setNewTreatmentEntry({
        date: new Date().toISOString().split("T")[0],
        medicinePrescriptions: "",
        advisories: "",
        notes: "",
      });

      toast({
        title: "Treatment Entry Added",
        description:
          "New treatment visit has been recorded. Remember to save changes.",
      });
    }
  };

  const handleRemoveTreatmentEntry = (entryId: string) => {
    if (editedPatient) {
      setEditedPatient({
        ...editedPatient,
        treatmentEntries: editedPatient.treatmentEntries.filter(
          (entry) => (entry._id || entry.id) !== entryId
        ),
      });
    }
  };

  const handleSave = () => {
    if (editedPatient) {
      onSave(editedPatient);
    }
  };

  const handleModalClose = () => {
    onClose();
  };

  if (!editedPatient) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleModalClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Edit Patient Record - {editedPatient.patientName}
          </DialogTitle>
          <DialogDescription>
            Make changes to the patient record and treatment history. Remember
            to save your changes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Patient Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label
                    htmlFor="edit-prefix"
                    className="flex items-center space-x-2"
                  >
                    <UserCheck className="h-4 w-4 text-blue-600" />
                    <span>Prefix</span>
                  </Label>
                  <Select
                    value={editedPatient.prefix || "Mr."}
                    onValueChange={(value) =>
                      handleBasicInfoChange("prefix", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select prefix" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mr.">Mr.</SelectItem>
                      <SelectItem value="Mrs.">Mrs.</SelectItem>
                      <SelectItem value="Ms.">Ms.</SelectItem>
                      <SelectItem value="Dr.">Dr.</SelectItem>
                      <SelectItem value="Master">Master</SelectItem>
                      <SelectItem value="Miss">Miss</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-3">
                  <Label
                    htmlFor="edit-name"
                    className="flex items-center space-x-2"
                  >
                    <User className="h-4 w-4 text-blue-600" />
                    <span>Patient Name</span>
                  </Label>
                  <Input
                    id="edit-name"
                    value={editedPatient.patientName}
                    onChange={(e) =>
                      handleBasicInfoChange("patientName", e.target.value)
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-age">Age</Label>
                  <Input
                    id="edit-age"
                    value={editedPatient.age}
                    onChange={(e) =>
                      handleBasicInfoChange("age", e.target.value)
                    }
                  />
                </div>
                <div>
                  <Label
                    htmlFor="edit-gender"
                    className="flex items-center space-x-2"
                  >
                    <Users className="h-4 w-4 text-blue-600" />
                    <span>Gender</span>
                  </Label>
                  <Select
                    value={editedPatient.gender || ""}
                    onValueChange={(value) =>
                      handleBasicInfoChange("gender", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label
                    htmlFor="edit-weight"
                    className="flex items-center space-x-2"
                  >
                    <Scale className="h-4 w-4 text-blue-600" />
                    <span>Weight (kg)</span>
                  </Label>
                  <Input
                    id="edit-weight"
                    value={editedPatient.weight || ""}
                    onChange={(e) =>
                      handleBasicInfoChange("weight", e.target.value)
                    }
                    placeholder="Enter weight in kg"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="edit-bp"
                    className="flex items-center space-x-2"
                  >
                    <Heart className="h-4 w-4 text-blue-600" />
                    <span>BP (mmHg)</span>
                  </Label>
                  <Input
                    id="edit-bp"
                    value={editedPatient.bp || ""}
                    onChange={(e) =>
                      handleBasicInfoChange("bp", e.target.value)
                    }
                    placeholder="Enter blood pressure"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="edit-rbs"
                    className="flex items-center space-x-2"
                  >
                    <Activity className="h-4 w-4 text-blue-600" />
                    <span>RBS (mg/dL)</span>
                  </Label>
                  <Input
                    id="edit-rbs"
                    value={editedPatient.rbs || ""}
                    onChange={(e) =>
                      handleBasicInfoChange("rbs", e.target.value)
                    }
                    placeholder="Enter RBS level"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-contact">Contact Number</Label>
                  <Input
                    id="edit-contact"
                    value={editedPatient.contactNumber}
                    onChange={(e) =>
                      handleBasicInfoChange("contactNumber", e.target.value)
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="edit-ref">ID</Label>
                  <Input
                    id="edit-ref"
                    value={editedPatient.referenceNumber}
                    onChange={(e) =>
                      handleBasicInfoChange("referenceNumber", e.target.value)
                    }
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-reference-person">
                  Reference Person Name
                </Label>
                <Input
                  id="edit-reference-person"
                  value={editedPatient.referencePerson || ""}
                  onChange={(e) =>
                    handleBasicInfoChange("referencePerson", e.target.value)
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-address">Address</Label>
                <Textarea
                  id="edit-address"
                  value={editedPatient.address}
                  onChange={(e) =>
                    handleBasicInfoChange("address", e.target.value)
                  }
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="edit-problem">Patient's Problem/Symptoms</Label>
                <Textarea
                  id="edit-problem"
                  value={editedPatient.patientProblem || ""}
                  onChange={(e) =>
                    handleBasicInfoChange("patientProblem", e.target.value)
                  }
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Treatment History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Treatment History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {editedPatient.treatmentEntries.map((entry, index) => (
                <div
                  key={entry._id || entry.id || `entry-${index}`}
                  className="border rounded-lg p-4 bg-gray-50"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-semibold flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <span>
                        Visit {index + 1} -{" "}
                        {new Date(entry.date).toLocaleDateString()}
                      </span>
                    </h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleRemoveTreatmentEntry(
                          entry._id || entry.id || `entry-${index}`
                        )
                      }
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <Label className="flex items-center space-x-1 mb-1">
                        <Pill className="h-4 w-4 text-blue-600" />
                        <span>Prescriptions</span>
                      </Label>
                      <div className="bg-white p-3 rounded border">
                        <p className="text-sm whitespace-pre-wrap">
                          {entry.medicinePrescriptions}
                        </p>
                      </div>
                    </div>
                    {entry.advisories && (
                      <div>
                        <Label className="flex items-center space-x-1 mb-1">
                          <FileText className="h-4 w-4 text-blue-600" />
                          <span>Advisories</span>
                        </Label>
                        <div className="bg-white p-3 rounded border">
                          <p className="text-sm whitespace-pre-wrap">
                            {entry.advisories}
                          </p>
                        </div>
                      </div>
                    )}
                    {entry.notes && (
                      <div>
                        <Label>Notes</Label>
                        <div className="bg-white p-3 rounded border">
                          <p className="text-sm whitespace-pre-wrap">
                            {entry.notes}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Add New Treatment Entry */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Plus className="h-5 w-5" />
                <span>Add New Treatment Visit</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="new-date">Visit Date</Label>
                <Input
                  id="new-date"
                  type="date"
                  value={newTreatmentEntry.date}
                  onChange={(e) =>
                    setNewTreatmentEntry((prev) => ({
                      ...prev,
                      date: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <Label htmlFor="new-prescriptions">
                  Medicine Prescriptions *
                </Label>
                <Textarea
                  id="new-prescriptions"
                  value={newTreatmentEntry.medicinePrescriptions}
                  onChange={(e) =>
                    setNewTreatmentEntry((prev) => ({
                      ...prev,
                      medicinePrescriptions: e.target.value,
                    }))
                  }
                  placeholder="Enter prescribed medicines, dosages, and instructions"
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="new-advisories">Advisories</Label>
                <Textarea
                  id="new-advisories"
                  value={newTreatmentEntry.advisories}
                  onChange={(e) =>
                    setNewTreatmentEntry((prev) => ({
                      ...prev,
                      advisories: e.target.value,
                    }))
                  }
                  placeholder="Enter any medical advisories or recommendations"
                  rows={3}
                />
              </div>

              {/* <div>
                <Label htmlFor="new-notes">Additional Notess</Label>
                <Textarea
                  id="new-notes"
                  value={newTreatmentEntry.notes}
                  onChange={(e) => setNewTreatmentEntry(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any additional notes for this visit"
                  rows={2}
                />
              </div> */}

              <Button
                onClick={handleAddTreatmentEntry}
                className="w-full"
                type="button"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Treatment Entry
              </Button>
            </CardContent>
          </Card>

          <Separator />

          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditPatientModal;
