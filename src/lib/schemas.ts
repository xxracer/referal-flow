import { z } from 'zod';

const MAX_FILE_SIZE = 500 * 1024; // 500KB
const ACCEPTED_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

const fileListSchema = z
  .custom<FileList>()
  .refine(files => files === undefined || files === null || files.length === 0 || Array.from(files).every(file => file.size <= MAX_FILE_SIZE), `Max file size is 500KB per file.`)
  .refine(
    files => files === undefined || files === null || files.length === 0 || Array.from(files).every(file => ACCEPTED_FILE_TYPES.includes(file.type)),
    "Only .pdf, .jpeg, and .png files are accepted."
  )
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
  servicesNeeded: z.array(z.string()).min(1, { message: "Please select at least one service." }),

  // Documents
  referralDocuments: fileListSchema,
  progressNotes: fileListSchema,
});


export const statusCheckSchema = z.object({
    referralId: z.string().min(1, { message: "Referral ID is required." }),
    patientDOB: z.string().min(1, { message: "Patient's Date of Birth is required." }),
    optionalNote: z.string().optional(),
});

export const noteSchema = z.object({
    note: z.string().min(1, { message: "Note cannot be empty." }),
});
