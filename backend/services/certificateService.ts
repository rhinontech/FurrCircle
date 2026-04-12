import PDFDocument from 'pdfkit';
import axios from 'axios';
import { uploadFileToS3 } from './s3Service.ts';

interface CertificateOptions {
  petName: string;
  petSpecies?: string;
  petBreed?: string;
  vaccineName: string;
  dateAdministered: string;
  nextDueDate?: string;
  vetName: string;
  clinicName?: string;
  clinicCity?: string;
  licenseNumber?: string;
  clinicStampUrl?: string;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return 'N/A';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export async function generateVaccineCertificate(opts: CertificateOptions): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', async () => {
        const buffer = Buffer.concat(chunks);
        try {
          const url = await uploadFileToS3(buffer, 'application/pdf', 'certificates');
          resolve(url);
        } catch (uploadErr) {
          reject(uploadErr);
        }
      });
      doc.on('error', reject);

      const brandColor = '#6366f1';
      const lightGray = '#f3f4f6';
      const darkText = '#111827';
      const mutedText = '#6b7280';

      // Header banner
      doc.rect(0, 0, doc.page.width, 120).fill(brandColor);

      // Clinic stamp / logo (top right of header)
      if (opts.clinicStampUrl) {
        try {
          const response = await axios.get(opts.clinicStampUrl, { responseType: 'arraybuffer', timeout: 5000 });
          const imgBuffer = Buffer.from(response.data);
          doc.image(imgBuffer, doc.page.width - 130, 20, { width: 80, height: 80, fit: [80, 80] });
        } catch {
          // Stamp load failed — skip silently
        }
      }

      // Title
      doc.font('Helvetica-Bold').fontSize(22).fillColor('#ffffff').text('Vaccination Certificate', 50, 35);
      doc.font('Helvetica').fontSize(13).fillColor('rgba(255,255,255,0.8)').text('Official Pet Health Record', 50, 62);

      // Cert ID
      const certId = Date.now().toString(36).toUpperCase();
      doc.font('Helvetica').fontSize(10).fillColor('rgba(255,255,255,0.65)').text(`Certificate #: VX-${certId}`, 50, 90);

      // Issued date (top-right of header)
      const todayStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      doc.font('Helvetica').fontSize(10).fillColor('rgba(255,255,255,0.65)')
        .text(`Issued: ${todayStr}`, 0, 90, { align: 'right', width: doc.page.width - (opts.clinicStampUrl ? 140 : 50) });

      // Separator
      doc.moveDown(3);

      // --- Pet Details section ---
      const sectionY = 145;
      doc.rect(50, sectionY, doc.page.width - 100, 28).fill(lightGray).stroke(lightGray);
      doc.font('Helvetica-Bold').fontSize(11).fillColor(brandColor).text('PET INFORMATION', 62, sectionY + 8);

      const petRow = sectionY + 40;
      const col2 = 300;

      doc.font('Helvetica-Bold').fontSize(10).fillColor(mutedText).text('Pet Name', 50, petRow);
      doc.font('Helvetica').fontSize(12).fillColor(darkText).text(opts.petName, 50, petRow + 14);

      if (opts.petSpecies) {
        doc.font('Helvetica-Bold').fontSize(10).fillColor(mutedText).text('Species', col2, petRow);
        doc.font('Helvetica').fontSize(12).fillColor(darkText).text(opts.petSpecies, col2, petRow + 14);
      }

      const breedRow = petRow + 45;
      if (opts.petBreed) {
        doc.font('Helvetica-Bold').fontSize(10).fillColor(mutedText).text('Breed', 50, breedRow);
        doc.font('Helvetica').fontSize(12).fillColor(darkText).text(opts.petBreed, 50, breedRow + 14);
      }

      // --- Vaccine Details ---
      const vaccSection = breedRow + 55;
      doc.rect(50, vaccSection, doc.page.width - 100, 28).fill(lightGray).stroke(lightGray);
      doc.font('Helvetica-Bold').fontSize(11).fillColor(brandColor).text('VACCINE DETAILS', 62, vaccSection + 8);

      const vaccRow = vaccSection + 40;
      doc.font('Helvetica-Bold').fontSize(10).fillColor(mutedText).text('Vaccine Name', 50, vaccRow);
      doc.font('Helvetica').fontSize(14).fillColor(darkText).text(opts.vaccineName, 50, vaccRow + 14);

      const dateRow = vaccRow + 46;
      doc.font('Helvetica-Bold').fontSize(10).fillColor(mutedText).text('Date Administered', 50, dateRow);
      doc.font('Helvetica').fontSize(12).fillColor(darkText).text(formatDate(opts.dateAdministered), 50, dateRow + 14);

      if (opts.nextDueDate) {
        doc.font('Helvetica-Bold').fontSize(10).fillColor(mutedText).text('Next Due Date', col2, dateRow);
        doc.font('Helvetica').fontSize(12).fillColor(darkText).text(formatDate(opts.nextDueDate), col2, dateRow + 14);
      }

      // --- Administered By ---
      const vetSection = dateRow + 70;
      doc.rect(50, vetSection, doc.page.width - 100, 28).fill(lightGray).stroke(lightGray);
      doc.font('Helvetica-Bold').fontSize(11).fillColor(brandColor).text('ADMINISTERED BY', 62, vetSection + 8);

      const vetRow = vetSection + 40;
      doc.font('Helvetica-Bold').fontSize(10).fillColor(mutedText).text('Veterinarian', 50, vetRow);
      doc.font('Helvetica').fontSize(12).fillColor(darkText).text(opts.vetName, 50, vetRow + 14);

      if (opts.clinicName) {
        doc.font('Helvetica-Bold').fontSize(10).fillColor(mutedText).text('Clinic / Hospital', col2, vetRow);
        doc.font('Helvetica').fontSize(12).fillColor(darkText).text(opts.clinicName, col2, vetRow + 14);
      }

      if (opts.clinicCity || opts.licenseNumber) {
        const extraRow = vetRow + 46;
        if (opts.clinicCity) {
          doc.font('Helvetica-Bold').fontSize(10).fillColor(mutedText).text('City', 50, extraRow);
          doc.font('Helvetica').fontSize(12).fillColor(darkText).text(opts.clinicCity, 50, extraRow + 14);
        }
        if (opts.licenseNumber) {
          doc.font('Helvetica-Bold').fontSize(10).fillColor(mutedText).text('License #', col2, extraRow);
          doc.font('Helvetica').fontSize(12).fillColor(darkText).text(opts.licenseNumber, col2, extraRow + 14);
        }
      }

      // --- Footer ---
      const footerY = doc.page.height - 80;
      doc.rect(0, footerY, doc.page.width, 80).fill('#f9fafb');
      doc.moveTo(0, footerY).lineTo(doc.page.width, footerY).strokeColor('#e5e7eb').lineWidth(1).stroke();

      doc.font('Helvetica').fontSize(9).fillColor(mutedText)
        .text('This certificate was generated by PawsHub and is for informational purposes only.', 50, footerY + 16, { align: 'center', width: doc.page.width - 100 });
      doc.font('Helvetica').fontSize(9).fillColor(mutedText)
        .text('pawshub.app', 50, footerY + 34, { align: 'center', width: doc.page.width - 100 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
