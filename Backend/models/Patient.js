// backend/models/Patient.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const treatmentEntrySchema = new Schema({
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  medicinePrescriptions: {
    type: String,
    required: true,
  },
  advisories: String,
  notes: String,
});

const patientSchema = new Schema(
  {
    patientName: {
      type: String,
      required: true,
      trim: true,
    },
    age: {
      type: String,
      required: true,
    },
    weight: {
      type: String,
      trim: true,
    },
    height: {
      type: String,
      trim: true,
    },
    rbs: {
      type: String,
      trim: true,
    },
    address: String,
    referenceNumber: {
      type: String,
      required: true,
      unique: true,
    },
    referencePerson: String,
    contactNumber: {
      type: String,
      required: true,
    },
    patientProblem: String,
    doctor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    treatmentEntries: [treatmentEntrySchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Patient", patientSchema);
