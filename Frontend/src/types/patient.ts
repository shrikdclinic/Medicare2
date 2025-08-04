// src/types/patient.ts
export interface TreatmentEntry {
  _id?: string; // MongoDB ID
  id?: string; // For backward compatibility
  date: string;
  medicinePrescriptions: string;
  advisories?: string;
  notes?: string;
}

export interface PatientData {
  _id?: string; // MongoDB ID
  id?: string; // For backward compatibility
  prefix?: string;
  patientName: string;
  age: string;
  gender?: string;
  weight?: string;
  bp?: string;
  rbs?: string;
  address: string;
  referenceNumber: string;
  referencePerson?: string;
  contactNumber: string;
  patientProblem?: string;
  doctor?: string; // Reference to doctor's user ID
  createdAt?: string;
  updatedAt?: string;
  dateCreated?: string; // For backward compatibility
  treatmentEntries: TreatmentEntry[];
}

export interface User {
  _id: string;
  email: string;
  userType: string;
  name?: string;
  lastLogin?: string;
}
