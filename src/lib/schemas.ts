import { z } from 'zod';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

// This schema is now for client-side validation only before uploading
const fileSchema = z
  .instanceof(File)
  .refine(file => file.size <= MAX_FILE_SIZE, `Max file size is 5MB per file.`)
  .refine(
    file => ACCEPTED_FILE_TYPES.includes(file.type),
    "Only .pdf, .jpeg, and .png files are accepted."
  );

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

  // Document URLs will be passed, not files
  documentUrls: z.array(z.string()).optional(),
});


export const statusCheckSchema = z.object({
    referralId: z.string().min(1, { message: "Referral ID is required." }),
    patientDOB: z.string().min(1, { message: "Patient's Date of Birth is required." }),
    optionalNote: z.string().optional(),
});

export const noteSchema = z.object({
    note: z.string().min(1, { message: "Note cannot be empty." }),
});
