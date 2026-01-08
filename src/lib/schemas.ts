import { z } from 'zod';

const MAX_TOTAL_SIZE = 1 * 1024 * 1024; // 1MB total
const ACCEPTED_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

const fileSchema = z
  .instanceof(File)
  .refine(file => ACCEPTED_FILE_TYPES.includes(file.type), ".jpg, .jpeg, .png and .pdf files are accepted.")
  .optional();

export const referralSchema = z.object({
  // Referrer Info
  organizationName: z.string().min(1, { message: "Organization/Facility Name is required." }),
  contactName: z.string().min(1, { message: "Contact Name is required." }),
  phone: z.string().min(1, { message: "Phone Number is required." }),
  email: z.string().email({ message: "Invalid email address." }).optional().or(z.literal('')),

  // Patient Info
  patientFullName: z.string().min(1, { message: "Patient Full Name is required." }),
  patientDOB: z.string().min(1, { message: "Patient's Date of Birth is required." }),
  patientZipCode: z.string().length(5, { message: "Enter a 5-digit ZIP code."}),

  // Insurance Info
  primaryInsurance: z.string().min(1, { message: "Primary Insurance is required." }),
  
  // Services Needed
  servicesNeeded: z.preprocess(
    (val) => (Array.isArray(val) ? val : [val].filter(Boolean)),
    z.array(z.string()).min(1, { message: "Please select at least one service." })
  ),
  
  // Documents
  documents: z.preprocess(
    (val) => (Array.isArray(val) ? val : [val].filter(val => val instanceof File && val.size > 0)),
    z.array(fileSchema)
      .refine(files => {
        const totalSize = files.reduce((acc, file) => acc + (file?.size || 0), 0);
        return totalSize <= MAX_TOTAL_SIZE;
      }, `Total file size must not exceed 1MB.`)
      .optional()
  ),
});


export const statusCheckSchema = z.object({
    referralId: z.string().min(1, { message: "Referral ID is required." }),
    patientDOB: z.string().min(1, { message: "Patient's Date of Birth is required." }),
    optionalNote: z.string().optional(),
});

export const noteSchema = z.object({
    note: z.string().min(1, { message: "Note cannot be empty." }),
});

    