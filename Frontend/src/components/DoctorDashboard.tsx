import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Search, Download, Calendar, User, Phone, MapPin, Pill, FileText, Edit, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generatePDF } from "@/utils/pdfGenerator";
import { PatientData } from "@/types/patient";
import EditPatientModal from "@/components/EditPatientModal";

const API_BASE_URL ='https://medicare-z4js.onrender.com/api';

const DoctorDashboard = () => {
  const { toast } = useToast();
  const [patients, setPatients] = useState<PatientData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingPatient, setEditingPatient] = useState<PatientData | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      setLoading(true);
      setError("");
      
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        setError("Authentication required. Please log in.");
        setLoading(false);
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/patients`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch patients');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setPatients(data.data);
      } else {
        throw new Error(data.message || 'Failed to load patients');
      }
    } catch (error) {
      console.error('Error loading patients:', error);
      setError("Failed to load patients. Please try again.");
      toast({
        title: "Error",
        description: "Failed to load patient records",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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

  const handleSavePatient = async (updatedPatient: PatientData) => {
    try {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`${API_BASE_URL}/patients/${updatedPatient._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedPatient)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update patient');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Update local state
        setPatients(patients.map(p => 
          p._id === updatedPatient._id ? data.data : p
        ));
        
        toast({
          title: "Patient Updated",
          description: `${updatedPatient.patientName}'s record has been updated successfully`,
        });
      } else {
        throw new Error(data.message || 'Failed to update patient');
      }
    } catch (error) {
      console.error('Error updating patient:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update patient record",
        variant: "destructive",
      });
    }
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Data</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadPatients}>Try Again</Button>
        </CardContent>
      </Card>
    );
  }

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
              <Card key={patient._id} className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl text-gray-900 mb-1">{patient.patientName}</CardTitle>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>Created: {formatDate(patient.createdAt)}</span>
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
