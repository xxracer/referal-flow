import { z } from 'zod';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf', 'image/gif'];

export const referralSchema = z.object({
  // Referrer Info
  referrerName: z.string().min(1, { message: "Referring Provider/Office is required." }),
  providerNpi: z.string().min(1, { message: "Provider NPI# is required." }),
  referrerContact: z.string().min(1, { message: "Referring Provider Phone Number is required." }),
  referrerFax: z.string().min(1, { message: "Referring Provider Fax is required." }),
  contactPerson: z.string().min(1, { message: "Contact Person is required." }),
  confirmationEmail: z.string().email({ message: "Invalid email address." }),

  // Patient Info
  patientFirstName: z.string().min(1, { message: "Patient First Name is required." }),
  patientLastName: z.string().min(1, { message: "Patient Last Name is required." }),
  patientContact: z.string().min(1, { message: "Patient Phone Number is required." }),
  patientDOB: z.string().min(1, { message: "Patient's Date of Birth is required." }),
  patientInsurance: z.string().min(1, { message: "Patient's Insurance is required." }),
  memberId: z.string().min(1, { message: "Member ID# is required." }),
  authorizationNumber: z.string().optional(),

  // Exam Info
  examRequested: z.enum(['MRI', 'CT', 'Ultrasound', 'X-RAY', 'DEXA', 'Other']),
  examOther: z.string().optional(),
  diagnosis: z.string().min(1, { message: "Diagnosis/Signs/Symptoms is required." }),
  priority: z.enum(['STAT', 'URGENT', 'ROUTINE']).optional(),
  contrast: z.enum(['With', 'Without', 'With and Without']).optional(),
  reasonForExam: z.string().optional(),

  documents: z
    .custom<FileList>()
    .refine(files => !files || Array.from(files).every(file => file.size <= MAX_FILE_SIZE), `Max file size is 5MB.`)
    .refine(
      files => !files || Array.from(files).every(file => ACCEPTED_FILE_TYPES.includes(file.type)),
      "Only .pdf, .jpeg, .png, and .gif files are accepted."
    )
    .optional(),
}).superRefine((data, ctx) => {
    if (data.examRequested === 'Other' && !data.examOther) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['examOther'],
            message: 'Please specify if "Other" is selected.',
        });
    }
});

export const statusCheckSchema = z.object({
    referralId: z.string().min(1, { message: "Referral ID is required." }),
    patientDOB: z.string().min(1, { message: "Patient's Date of Birth is required." }),
});

export const noteSchema = z.object({
    note: z.string().min(1, { message: "Note cannot be empty." }),
});
