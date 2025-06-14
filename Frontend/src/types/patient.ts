
export interface TreatmentEntry {
  id: string;
  date: string;
  medicinePrescriptions: string;
  advisories: string;
  notes?: string;
}

export interface PatientData {
  id: string;
  patientName: string;
  age: string;
  address: string;
  referenceNumber: string;
  referencePerson: string;
  contactNumber: string;
  patientProblem: string;
  dateCreated: string;
  treatmentEntries: TreatmentEntry[];
}
