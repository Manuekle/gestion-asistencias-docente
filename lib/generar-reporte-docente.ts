import ReportReadyEmail from '@/app/emails/ReportReadyEmail';
import { sendEmail } from '@/lib/email';
import { db } from '@/lib/prisma';
import { Class, Report, Subject, User } from '@prisma/client';
import { put } from '@vercel/blob';
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';

// Define types for the report details
interface ReportWithRelations extends Report {
  requestedBy: {
    correoPersonal: string | null;
    name: string | null;
  } | null;
  subject: {
    name: string;
    code: string | null;
  } | null;
}

// Tipos de datos para el nuevo formato de reporte de clases
type ClassReportData = {
  subject: Subject & { teacher: User; classes: Class[] };
};

/**
 * Genera el contenido HTML para el reporte de "Registro de Clases y Asistencia Docente".
 * @param data - Contiene la información de la asignatura, el docente y las clases.
 * @param logoDataUri - El logo de la FUP en formato Data URI.
 * @returns El string del HTML del reporte.
 */
const getReportHTMLForClassRegistry = (
  data: ClassReportData,
  logoDataUri: string,
  signatureDataUri: string | null
): string => {
  const { subject } = data;
  const { teacher, classes } = subject;

  // Validar que el período sea 1 o 2
  const periodo = subject.semester?.toString() === '2' ? '2' : '1'; // Por defecto 1 si no es 2

  const formatTime = (date: Date | null | undefined): string => {
    if (!date) return '';
    return new Date(date).toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const calculateHours = (start: Date | null | undefined, end: Date | null | undefined): number => {
    if (!start || !end) return 4; // Default a 4 horas si no hay datos
    const diff = new Date(end).getTime() - new Date(start).getTime();
    return Math.round(diff / (1000 * 60 * 60));
  };

  // Separar clases normales de canceladas
  const normalClasses = classes.filter(cls => cls.status !== 'CANCELADA');
  const canceledClasses = classes.filter(cls => cls.status === 'CANCELADA');

  const classRows = normalClasses
    .map(
      (cls, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${new Date(cls.date).getDate()}</td>
      <td>${new Date(cls.date).getMonth() + 1}</td>
      <td>${formatTime(cls.startTime)}</td>
      <td>${formatTime(cls.endTime)}</td>
      <td class="tema">${cls.topic || ''}</td>
      <td>${calculateHours(cls.startTime, cls.endTime)}</td>
      <td class="signature-cell">${signatureDataUri ? `<img src="${signatureDataUri}" alt="Firma" class="signature-image"/>` : ''}</td>
    </tr>
  `
    )
    .join('');

  // Crear filas para las clases canceladas
  const canceledClassRows = canceledClasses
    .map(
      (cls, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${new Date(cls.date).getDate()}</td>
      <td>${new Date(cls.date).getMonth() + 1}</td>
      <td>${formatTime(cls.startTime)}</td>
      <td>${formatTime(cls.endTime)}</td>
      <td class="tema">${cls.cancellationReason || (cls.description?.includes('cancelada') ? cls.description : 'Clase cancelada')}</td>
      <td>${calculateHours(cls.startTime, cls.endTime)}</td>
      <td class="signature-cell">${signatureDataUri ? `<img src="${signatureDataUri}" alt="Firma" class="signature-image"/>` : ''}</td>
    </tr>
  `
    )
    .join('');

  const currentYear = new Date().getFullYear();

  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Geist:wght@100..900&display=swap');
    body { 
      font-family: 'Geist', Arial, sans-serif; 
      margin: 20px; 
      color: #333; 
      font-size: 9pt; 
    }
    .page-header {
      margin-bottom: 25px;
    }
    .header-grid {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: center;
      gap: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #005a9c;
    }
    .logo-container {
      justify-self: start;
    }
    .logo-container img {
      width: 130px;
      height: auto;
    }
    .title-container {
      text-align: center;
      color: #003366;
    }
    .title-container h1 {
      margin: 0;
      font-size: 16pt;
      font-weight: 700;
    }
    .title-container h2 {
      margin: 5px 0 0 0;
      font-size: 13pt;
      font-weight: 400;
    }
    .meta-table {
      font-size: 8pt;
      border-collapse: collapse;
      width: 100%;
      justify-self: end;
    }
    .meta-table td {
      border: 1px solid #ccc;
      padding: 4px 6px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 5px 20px;
      border: 1px solid #eee;
      padding: 15px;
      margin-bottom: 20px;
      border-radius: 8px;
      background-color: #f9f9f9;
    }
    .info-grid p {
      margin: 0;
      font-size: 9pt;
    }
    .bold {
      font-weight: 700;
    }
    .main-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8pt;
    }
    .main-table th, .main-table td {
      border: 1px solid #ccc;
      padding: 6px;
      text-align: center;
    }
    .main-table th {
      background-color: #005a9c;
      color: #fff;
      font-weight: 700;
    }
    .main-table tbody tr:nth-child(even) {
      background-color: #f2f2f2;
    }
    .tema {
      text-align: left;
      width: 50%;
    }
    .signature-cell {
      height: 50px;
      padding: 2px;
    }
    .signature-image {
      max-width: 100%;
      max-height: 45px;
      object-fit: contain;
    }
  `;

  return `
    <html>
      <head><style>${styles}</style></head>
      <body>
        <div class="page-header">
          <div class="header-grid">
            <div class="logo-container">
              ${logoDataUri ? `<img src="${logoDataUri}" alt="Logo FUP"/>` : '<span></span>'}
            </div>
            <div class="title-container">
              <h1>REGISTRO DE CLASES Y ASISTENCIA</h1>
              <h2>DOCENCIA</h2>
            </div>
            <div>
              <table class="meta-table">
                <tr><td><span class="bold">Código:</span> FO-DO-005</td></tr>
                <tr><td><span class="bold">Versión:</span> 08</td></tr>
                <tr><td><span class="bold">Fecha:</span> Marzo 2023</td></tr>
              </table>
            </div>
          </div>
        </div>

        <div class="info-grid">
          <p><span class="bold">NOMBRE DEL DOCENTE:</span> ${teacher.name || ''}</p>
          <p><span class="bold">PROGRAMA:</span> ${subject.program || ''}</p>
          <p><span class="bold">ASIGNATURA:</span> ${subject.name || ''}</p>
          <p><span class="bold">AÑO:</span> ${currentYear}</p>
          <p><span class="bold">PERIODO:</span> ${periodo}</p>
        </div>

        <table class="main-table">
          <thead>
            <tr>
              <th rowspan="2">No.</th>
              <th colspan="2">FECHA</th>
              <th colspan="2">HORA</th>
              <th rowspan="2" class="tema">TEMA</th>
              <th rowspan="2">TOTAL HORAS</th>
              <th rowspan="2">FIRMA DOCENTE</th>
            </tr>
            <tr>
              <th>DD</th><th>MM</th><th>INICIO</th><th>FINAL</th>
            </tr>
          </thead>
          <tbody>${classRows}</tbody>
        </table>

        ${
          canceledClasses.length > 0
            ? `
        <h3 style="margin-top: 30px; color: #000;">CLASES CANCELADAS</h3>
        <table class="main-table">
          <thead>
            <tr>
              <th rowspan="2">No.</th>
              <th colspan="2">FECHA</th>
              <th colspan="2">HORA</th>
              <th rowspan="2" class="tema">RAZÓN DE CANCELACIÓN</th>
              <th rowspan="2">HORAS</th>
              <th rowspan="2">FIRMA DOCENTE</th>
            </tr>
            <tr>
              <th>DD</th><th>MM</th><th>INICIO</th><th>FINAL</th>
            </tr>
          </thead>
          <tbody>${canceledClassRows}</tbody>
        </table>
        `
            : ''
        }
      </body>
    </html>
  `;
};

/**
 * Genera un reporte en PDF para una asignatura con el formato "Registro de Clases".
 * @param subjectId - El ID de la asignatura.
 * @param reportId - El ID del registro del reporte para actualizar su estado.
 */
export const generateAttendanceReportPDF = async (subjectId: string, reportId: string) => {
  try {
    await db.report.update({
      where: { id: reportId },
      data: { status: 'EN_PROCESO' },
    });

    const subjectData = await db.subject.findUnique({
      where: { id: subjectId },
      include: {
        teacher: true,
        classes: { orderBy: { date: 'asc' } },
      },
    });

    if (!subjectData) throw new Error('Asignatura no encontrada');

    const reportData: ClassReportData = {
      subject: subjectData as Subject & { teacher: User; classes: Class[] },
    };

    // Obtener la firma del docente y convertirla a Data URI
    const { teacher } = subjectData;
    let signatureDataUri: string | null = null;
    if (teacher.signatureUrl) {
      try {
        if (teacher.signatureUrl.startsWith('http')) {
          // Es una URL externa, la descargamos
          console.log(`Descargando firma desde URL externa: ${teacher.signatureUrl}`);
          const response = await fetch(teacher.signatureUrl);
          if (response.ok) {
            const imageBuffer = await response.arrayBuffer();
            const imageBase64 = Buffer.from(imageBuffer).toString('base64');
            const mimeType = response.headers.get('content-type') || 'image/png';
            signatureDataUri = `data:${mimeType};base64,${imageBase64}`;
          } else {
            console.warn(
              `No se pudo descargar la firma desde: ${teacher.signatureUrl}. Estado: ${response.status}`
            );
          }
        } else {
          // Es una ruta local, la leemos del disco
          const signaturePath = path.join(process.cwd(), 'public', teacher.signatureUrl);
          if (fs.existsSync(signaturePath)) {
            const signatureBuffer = fs.readFileSync(signaturePath);
            const extension = path.extname(teacher.signatureUrl).slice(1);
            const mimeType = `image/${extension === 'svg' ? 'svg+xml' : extension}`;
            signatureDataUri = `data:${mimeType};base64,${signatureBuffer.toString('base64')}`;
          } else {
            console.warn(`Archivo de firma no encontrado en: ${signaturePath}`);
          }
        }
      } catch (error) {
        console.error('Error al procesar la imagen de la firma:', error);
      }
    }

    // Obtener el logo y convertirlo a Data URI
    const logoUrl = 'https://fup.edu.co/wp-content/uploads/Logo-FUP-2018-Isotipo-01-300x300-1.png';
    let logoDataUri = '';
    try {
      const response = await fetch(logoUrl);
      if (response.ok) {
        const imageBuffer = await response.arrayBuffer();
        const imageBase64 = Buffer.from(imageBuffer).toString('base64');
        logoDataUri = `data:image/png;base64,${imageBase64}`;
      }
    } catch (error) {
      console.error('Error al obtener el logo:', error);
    }

    const htmlContent = getReportHTMLForClassRegistry(reportData, logoDataUri, signatureDataUri);

    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    });
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '25px', right: '25px', bottom: '25px', left: '25px' },
    });
    await browser.close();

    const fileName = `registro-clases_${subjectData.code || subjectId}_${Date.now()}.pdf`;
    // Convert Uint8Array to Buffer
    const buffer = Buffer.from(pdfBuffer);
    const blob = await put(`reports/${fileName}`, buffer, {
      access: 'public',
    });

    // First, update the report with the file URL
    await db.report.update({
      where: { id: reportId },
      data: { status: 'COMPLETADO', fileUrl: blob.url, fileName: fileName },
    });

    console.log(`Reporte generado exitosamente y subido a: ${blob.url}`);

    // Then fetch the related data in a separate query with proper includes
    const reportWithDetails = (await db.report.findUnique({
      where: { id: reportId },
      include: {
        requestedBy: {
          select: {
            correoPersonal: true, // Using correoPersonal instead of email
            name: true,
          },
        },
        subject: {
          select: {
            name: true,
            code: true,
          },
        },
      },
    })) as unknown as ReportWithRelations | null;

    // Send email notification to the teacher if we have the required data
    if (reportWithDetails?.requestedBy?.correoPersonal && reportWithDetails.subject) {
      const subjectName = reportWithDetails.subject?.name || 'la asignatura';
      const userName = reportWithDetails.requestedBy?.name || 'Docente';

      try {
        await sendEmail({
          to: reportWithDetails.requestedBy.correoPersonal,
          subject: `Reporte de asistencia listo - ${subjectName}`,
          react: ReportReadyEmail({
            subjectName,
            reportName: fileName,
            downloadUrl: blob.url,
            userName,
            supportEmail: 'soporte@institucion.edu.co',
          }),
        });
        console.log(`Notificación enviada a: ${reportWithDetails.requestedBy.correoPersonal}`);
      } catch (emailError) {
        console.error('Error enviando notificación por correo:', emailError);
        // Update the report with a warning about the email failure
        await db.report.update({
          where: { id: reportId },
          data: {
            status: 'COMPLETADO',
            error:
              'El reporte se generó correctamente, pero hubo un error al enviar la notificación por correo.',
          },
        });
        return; // Exit early since the report was generated successfully
      }
    }
  } catch (error) {
    console.error(`Error al generar el reporte para la asignatura ${subjectId}:`, error);
    await db.report.update({
      where: { id: reportId },
      data: {
        status: 'FALLIDO',
        error: error instanceof Error ? error.message : 'Error desconocido',
      },
    });
  }
};
