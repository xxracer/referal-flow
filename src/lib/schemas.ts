import { z } from 'zod';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

export const referralSchema = z.object({
  patientName: z.string().min(2, { message: "Full name must be at least 2 characters." }),
  patientDOB: z.string().min(1, { message: "Date of birth is required." }),
  patientContact: z.string().min(5, { message: "Contact information is required." }),
  patientId: z.string().optional(),
  referrerName: z.string().min(2, { message: "Your name or organization is required." }),
  referrerContact: z.string().min(5, { message: "Your contact information is required." }),
  referrerRelation: z.string().min(2, { message: "Your relationship to the patient is required." }),
  documents: z
    .custom<FileList>()
    .refine(files => !files || Array.from(files).every(file => file.size <= MAX_FILE_SIZE), `Max file size is 5MB.`)
    .refine(
      files => !files || Array.from(files).every(file => ACCEPTED_FILE_TYPES.includes(file.type)),
      "Only .jpg, .png, .pdf, and .doc files are accepted."
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
