import { z } from 'zod';

const MAX_TOTAL_SIZE = 5 * 1024 * 1024; // 5MB total
const ACCEPTED_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf', 'image/jpg'];

const fileSchema = z
  .instanceof(File)
  .refine(file => ACCEPTED_FILE_TYPES.includes(file.type), ".jpg, .jpeg, .png and .pdf files are accepted.")
  .optional();
  
const fileArraySchema = z.array(fileSchema).optional();

export const referralSchema = z.object({
  // Referrer Info
  organizationName: z.string().min(1, { message: "Organization/Facility Name is required." }),
  contactName: z.string().min(1, { message: "Contact Name is required." }),
  phone: z.string().min(1, { message: "Phone Number is required." }),
  email: z.string().email({ message: "Invalid email address." }).optional().or(z.literal('')),

  // Patient Info
  patientFullName: z.string().min(1, { message: "Patient Full Name is required." }),
  patientDOB: z.string().min(1, { message: "Patient's Date of Birth is required." }),
  patientAddress: z.string().min(1, { message: "Patient's Full Address is required." }),
  patientZipCode: z.string().length(5, { message: "Enter a 5-digit ZIP code."}),
  pcpName: z.string().optional(),
  pcpPhone: z.string().optional(),
  surgeryDate: z.string().optional(),
  covidStatus: z.string().optional(),

  // Insurance Info
  primaryInsurance: z.string().min(1, { message: "Primary Insurance is required." }),
  memberId: z.string().min(1, { message: "Member ID is required." }),
  insuranceType: z.string().optional(),
  planName: z.string().optional(),
  planNumber: z.string().optional(),
  groupNumber: z.string().optional(),
  
  // Services & Diagnosis
  servicesNeeded: z.preprocess(
    (val) => (Array.isArray(val) ? val : [val].filter(Boolean)),
    z.array(z.string()).min(1, { message: "Please select at least one service." })
  ),
  diagnosis: z.string().min(1, { message: "Patient Diagnosis is required." }),
  
  // Documents
  referralDocuments: fileArraySchema,
  progressNotes: fileArraySchema,
}).refine(data => {
    const referralDocsSize = data.referralDocuments?.reduce((acc, file) => acc + (file?.size || 0), 0) || 0;
    const progressNotesSize = data.progressNotes?.reduce((acc, file) => acc + (file?.size || 0), 0) || 0;
    return (referralDocsSize + progressNotesSize) <= MAX_TOTAL_SIZE;
}, {
    message: `Total file size must not exceed 5MB.`,
    path: ["referralDocuments"], // Assign error to one of the fields
});


export const statusCheckSchema = z.object({
    referralId: z.string().min(1, { message: "Referral ID is required." }),
    patientDOB: z.string().min(1, { message: "Patient's Date of Birth is required." }),
    optionalNote: z.string().optional(),
});

export const noteSchema = z.object({
    note: z.string().min(1, { message: "Note cannot be empty." }),
});
