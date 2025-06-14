
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Stethoscope, FileText, Users, LogOut } from "lucide-react";
import PatientForm from "@/components/PatientForm";
import DoctorDashboard from "@/components/DoctorDashboard";
import DoctorLogin from "@/components/DoctorLogin";

const Index = () => {
  const [activeTab, setActiveTab] = useState("form");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setActiveTab("form");
  };

  if (!isLoggedIn) {
    return <DoctorLogin onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Stethoscope className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">MediCare Clinic</h1>
                <p className="text-sm text-gray-600">Patient Management System</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="flex items-center space-x-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome, Doctor</h2>
          <p className="text-gray-600">Manage your patient records efficiently and securely.</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="form" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>New Patient Form</span>
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Patient Dashboard</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="form">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <span>Patient Information Form</span>
                </CardTitle>
                <CardDescription>
                  Fill out the patient details and prescription information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PatientForm />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dashboard">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <span>Patient Records Dashboard</span>
                </CardTitle>
                <CardDescription>
                  Search and manage all patient records
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DoctorDashboard />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
