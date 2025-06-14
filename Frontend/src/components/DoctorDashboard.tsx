
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Search, Download, Calendar, User, Phone, MapPin, Pill, FileText, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generatePDF } from "@/utils/pdfGenerator";
import { PatientData } from "@/types/patient";
import EditPatientModal from "@/components/EditPatientModal";

const DoctorDashboard = () => {
  const { toast } = useToast();
  const [patients, setPatients] = useState<PatientData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingPatient, setEditingPatient] = useState<PatientData | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = () => {
    const savedPatients = JSON.parse(localStorage.getItem('patients') || '[]');
    setPatients(savedPatients);
  };

  const filteredPatients = useMemo(() => {
    if (!searchTerm) return patients;
    
    return patients.filter(patient =>
      Object.values(patient).some(value => {
        if (typeof value === 'string') {
          return value.toLowerCase().includes(searchTerm.toLowerCase());
        }
        if (Array.isArray(value)) {
          return value.some(entry => 
            Object.values(entry).some(entryValue => 
              typeof entryValue === 'string' && entryValue.toLowerCase().includes(searchTerm.toLowerCase())
            )
          );
        }
        return false;
      })
    );
  }, [patients, searchTerm]);

  const handleEditPatient = (patient: PatientData) => {
    setEditingPatient(patient);
    setIsEditModalOpen(true);
  };

  const handleSavePatient = (updatedPatient: PatientData) => {
    const updatedPatients = patients.map(p => 
      p.id === updatedPatient.id ? updatedPatient : p
    );
    setPatients(updatedPatients);
    localStorage.setItem('patients', JSON.stringify(updatedPatients));
  };

  const handleDownloadPDF = async (patient: PatientData) => {
    try {
      await generatePDF(patient);
      toast({
        title: "PDF Downloaded",
        description: `Patient record for ${patient.patientName} has been downloaded successfully.`,
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getLatestTreatment = (patient: PatientData) => {
    if (!patient.treatmentEntries || patient.treatmentEntries.length === 0) {
      return null;
    }
    return patient.treatmentEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search patients by name, reference number, contact, treatments, etc..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-12 text-base"
        />
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          {filteredPatients.length === 0 && searchTerm ? (
            "No patients found matching your search"
          ) : (
            `Showing ${filteredPatients.length} of ${patients.length} patient records`
          )}
        </p>
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          Total Patients: {patients.length}
        </Badge>
      </div>

      {/* Patient Cards */}
      <div className="grid gap-6">
        {filteredPatients.length === 0 && !searchTerm ? (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Patient Records Yet</h3>
              <p className="text-gray-600">Start by adding your first patient record using the form.</p>
            </CardContent>
          </Card>
        ) : filteredPatients.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Results Found</h3>
              <p className="text-gray-600">Try adjusting your search terms.</p>
            </CardContent>
          </Card>
        ) : (
          filteredPatients.map((patient) => {
            const latestTreatment = getLatestTreatment(patient);
            return (
              <Card key={patient.id} className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl text-gray-900 mb-1">{patient.patientName}</CardTitle>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>Created: {formatDate(patient.dateCreated)}</span>
                        </span>
                        <Badge variant="outline">{patient.referenceNumber}</Badge>
                        {patient.treatmentEntries && patient.treatmentEntries.length > 0 && (
                          <Badge variant="secondary">
                            {patient.treatmentEntries.length} visit{patient.treatmentEntries.length !== 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => handleEditPatient(patient)}
                        variant="outline"
                        size="sm"
                        className="flex items-center space-x-2 hover:bg-green-50 hover:border-green-300"
                      >
                        <Edit className="h-4 w-4" />
                        <span>Edit</span>
                      </Button>
                      <Button
                        onClick={() => handleDownloadPDF(patient)}
                        variant="outline"
                        size="sm"
                        className="flex items-center space-x-2 hover:bg-blue-50 hover:border-blue-300"
                      >
                        <Download className="h-4 w-4" />
                        <span>PDF</span>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="flex items-start space-x-2">
                      <User className="h-4 w-4 text-blue-600 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Age</p>
                        <p className="text-gray-900">{patient.age} years</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-2">
                      <Phone className="h-4 w-4 text-blue-600 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Contact</p>
                        <p className="text-gray-900">{patient.contactNumber}</p>
                      </div>
                    </div>
                    
                    {patient.address && (
                      <div className="flex items-start space-x-2 md:col-span-2 lg:col-span-1">
                        <MapPin className="h-4 w-4 text-blue-600 mt-1 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">Address</p>
                          <p className="text-gray-900 text-sm">{patient.address}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {latestTreatment && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <h4 className="font-semibold text-gray-900 flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          <span>Latest Treatment - {new Date(latestTreatment.date).toLocaleDateString()}</span>
                        </h4>
                        
                        {latestTreatment.medicinePrescriptions && (
                          <div className="flex items-start space-x-2">
                            <Pill className="h-4 w-4 text-blue-600 mt-1 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-700 mb-1">Prescriptions</p>
                              <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-gray-900 text-sm whitespace-pre-wrap">
                                  {latestTreatment.medicinePrescriptions}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {latestTreatment.advisories && (
                          <div className="flex items-start space-x-2">
                            <FileText className="h-4 w-4 text-blue-600 mt-1 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-700 mb-1">Advisories</p>
                              <div className="bg-blue-50 p-3 rounded-lg">
                                <p className="text-gray-900 text-sm whitespace-pre-wrap">
                                  {latestTreatment.advisories}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <EditPatientModal
        patient={editingPatient}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingPatient(null);
        }}
        onSave={handleSavePatient}
      />
    </div>
  );
};

export default DoctorDashboard;
