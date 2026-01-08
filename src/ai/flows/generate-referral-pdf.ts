'use server';

/**
 * @fileOverview An AI-powered flow to generate a PDF summary from referral form data.
 *
 * - generateReferralPdf - Takes form data, creates a text summary via Gemini, and converts it to a PDF.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

// We need a schema that matches the form data, excluding files.
const PdfInputSchema = z.object({
  patientFullName: z.string(),
  patientDOB: z.string(),
  patientAddress: z.string(),
  patientZipCode: z.string(),
  memberId: z.string(),
  primaryInsurance: z.string(),
  insuranceType: z.string().optional(),
  planName: z.string().optional(),
  planNumber: z.string().optional(),
  groupNumber: z.string().optional(),
  pcpName: z.string().optional(),
  pcpPhone: z.string().optional(),
  surgeryDate: z.string().optional(),
  covidStatus: z.string().optional(),
  servicesNeeded: z.array(z.string()),
  diagnosis: z.string(),
  // Referrer info also needed for context, though not directly on the PDF image
  organizationName: z.string(),
  contactName: z.string(),
  phone: z.string(),
  email: z.string().optional(),
});

export type PdfInput = z.infer<typeof PdfInputSchema>;

const SummaryPromptOutputSchema = z.object({
  summaryText: z.string().describe('A clean, well-formatted summary of the referral data, suitable for a PDF document. Use sections and clear headings based on the provided format.'),
});

const summaryPrompt = ai.definePrompt({
    name: 'referralSummaryPrompt',
    input: { schema: PdfInputSchema },
    output: { schema: SummaryPromptOutputSchema },
    prompt: `You are an expert administrative assistant creating a patient referral summary.
    Format the output EXACTLY as specified below, using the provided data.
    - Use two columns for General Patient Info and Insurance Info.
    - Use fixed labels like "PATIENT NAME", "MEM ID#", etc.
    - If a field is not provided, leave the value blank but keep the label.

    ## GENERAL PATIENT INFO
    PATIENT NAME: {{{patientFullName}}}
    PATIENT DATE OF BIRTH: {{{patientDOB}}}
    PATIENT FULL ADDRESS: {{{patientAddress}}}, {{{patientZipCode}}}

    PCP: NAME LISTED: {{{pcpName}}}
    PCP: PHONE# LISTED: {{{pcpPhone}}}
    SURGERY DATE: {{{surgeryDate}}}
    COVID? YES/NO: {{{covidStatus}}}

    ## INSURANCE INFO
    MEM ID#: {{{memberId}}}
    TYPE: {{{insuranceType}}}
    INSURANCE PAYER: {{{primaryInsurance}}}
    PLAN NUMBER#: {{{planNumber}}}
    PLAN NAME: {{{planName}}}
    GROUP NUMBER#: {{{groupNumber}}}
    
    ## OTHER PAYER INFORMATION
    (This section can be left blank or include additional notes if available)

    ## SERVICES REQUESTED
    {{{servicesNeeded}}}

    ## PATIENT DIAGNOSIS & ORDER NOTES
    {{{diagnosis}}}
    `,
});

const generateReferralPdfFlow = ai.defineFlow(
  {
    name: 'generateReferralPdfFlow',
    inputSchema: PdfInputSchema,
    outputSchema: z.instanceof(Uint8Array),
  },
  async (data) => {
    // 1. Get the text summary from Gemini
    const { output } = await summaryPrompt(data);
    
    if (!output?.summaryText) {
        throw new Error("Failed to generate summary text from AI.");
    }
    const summaryText = output.summaryText;

    // 2. Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    const margin = 50;
    const y_start = height - margin;

    // Simple text parsing and drawing logic
    // A more robust solution would use a library or more complex logic to handle columns
    const lines = summaryText.split('\n').filter(line => line.trim() !== '');
    let y = y_start;

    for (const line of lines) {
        if (line.startsWith('## ')) {
            // Section Header
            page.drawText(line.replace('## ', ''), {
                x: margin,
                y: y,
                font: boldFont,
                size: 14,
                color: rgb(0, 0, 0),
            });
            y -= 25; // Space after header
        } else {
            // Regular text line
             page.drawText(line, {
                x: margin,
                y: y,
                font: font,
                size: 10,
                lineHeight: 15,
                color: rgb(0.1, 0.1, 0.1),
             });
             y -= 15;
        }

        if (y < margin) {
            // Add new page if content overflows (basic handling)
            y = height - margin;
            page.addPage();
        }
    }
    
    // 3. Save the PDF to a byte array
    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
  }
);

// Wrapper function to be called from server actions
export async function generateReferralPdf(data: PdfInput): Promise<Uint8Array> {
  return await generateReferralPdfFlow(data);
}
