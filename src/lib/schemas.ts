import { z } from 'zod';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf', 'image/gif'];

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

  // The rest of the fields from the original form are no longer here
  // so we will remove them from the schema validation.

  documents: z
    .custom<FileList>()
    .refine(files => !files || Array.from(files).every(file => file.size <= MAX_FILE_SIZE), `Max file size is 5MB.`)
    .refine(
      files => !files || Array.from(files).every(file => ACCEPTED_FILE_TYPES.includes(file.type)),
      "Only .pdf, .jpeg, .png, and .gif files are accepted."
    )
    .optional(),
});


export const statusCheckSchema = z.object({
    referralId: z.string().min(1, { message: "Referral ID is required." }),
    patientDOB: z.string().min(1, { message: "Patient's Date of Birth is required." }),
});

export const noteSchema = z.object({
    note: z.string().min(1, { message: "Note cannot be empty." }),
});
