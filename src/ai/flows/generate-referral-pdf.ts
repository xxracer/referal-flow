'use server';

/**
 * @fileOverview An AI-powered flow to generate a PDF summary from referral form data.
 *
 * - generateReferralPdf - Takes form data, creates a text summary via Gemini, and converts it to a PDF.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { referralSchema } from '@/lib/schemas';

// We only need a subset of the schema for the PDF, excluding files.
const PdfInputSchema = referralSchema.omit({ documents: true });
export type PdfInput = z.infer<typeof PdfInputSchema>;

const SummaryPromptInputSchema = z.object({
  formData: PdfInputSchema,
});

const SummaryPromptOutputSchema = z.object({
  summaryText: z.string().describe('A clean, well-formatted summary of the referral data, suitable for a PDF document. Use sections and clear headings.'),
});

const summaryPrompt = ai.definePrompt({
    name: 'referralSummaryPrompt',
    input: { schema: SummaryPromptInputSchema },
    output: { schema: SummaryPromptOutputSchema },
    prompt: `You are an expert administrative assistant in a medical office.
    Your task is to take the following raw referral data and format it into a clean, professional summary document.
    Use clear headings for each section (Referrer, Patient, Insurance, Services).
    Present the information in an easy-to-read format.

    ## Referrer Information
    - Organization / Facility: {{{formData.organizationName}}}
    - Contact Person: {{{formData.contactName}}}
    - Contact Phone: {{{formData.phone}}}
    - Contact Email: {{{formData.email}}}
    
    ## Patient Information
    - Full Name: {{{formData.patientFullName}}}
    - Date of Birth: {{{formData.patientDOB}}}
    - ZIP Code: {{{formData.patientZipCode}}}

    ## Insurance Information
    - Primary Insurance: {{{formData.primaryInsurance}}}

    ## Services Requested
    {{#each formData.servicesNeeded}}
    - {{{this}}}
    {{/each}}
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
    const { output } = await summaryPrompt({ formData: data });
    const summaryText = output!.summaryText;

    // 2. Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 12;

    const margin = 50;
    const y_start = height - margin;
    
    page.drawText('Referral Summary', {
        x: margin,
        y: y_start,
        font: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
        size: 18,
        color: rgb(0, 0, 0),
    });

    page.drawText(`Generated on: ${new Date().toLocaleDateString('en-US')}`, {
        x: margin,
        y: y_start - 20,
        font,
        size: 10,
        color: rgb(0.5, 0.5, 0.5),
    });

    page.drawText(summaryText, {
      x: margin,
      y: y_start - 60,
      font,
      size: fontSize,
      lineHeight: 18,
      maxWidth: width - margin * 2,
    });
    
    // 3. Save the PDF to a byte array
    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
  }
);

// Wrapper function to be called from server actions
export async function generateReferralPdf(data: PdfInput): Promise<Uint8Array> {
  return await generateReferralPdfFlow(data);
}
