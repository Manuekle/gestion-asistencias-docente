import ReportReadyEmail from '@/app/emails/ReportReadyEmail';
import { sendEmail } from '@/lib/email';
import { db } from '@/lib/prisma';
import { Class, ReportStatus, Subject, User } from '@prisma/client';
import { put } from '@vercel/blob';
import fs from 'fs';
import Handlebars from 'handlebars';
import path from 'path';

// Se importa la nueva librería para generar la imagen desde el HTML
import nodeHtmlToImage from 'node-html-to-image';

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
  const stylesTemplate = `
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

  const source = `
    <html>
      <head><style>${stylesTemplate}</style></head>
      <body>
        <div class="page-header">
          <div class="header-grid">
            <div class="logo-container">
              {{#if logoDataUri}}<img src="{{logoDataUri}}" alt="Logo FUP"/>{{/if}}
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
          <p><span class="bold">NOMBRE DEL DOCENTE:</span> {{teacherName}}</p>
          <p><span class="bold">PROGRAMA:</span> {{program}}</p>
          <p><span class="bold">ASIGNATURA:</span> {{subjectName}}</p>
          <p><span class="bold">AÑO:</span> {{currentYear}}</p>
          <p><span class="bold">PERIODO:</span> {{periodo}}</p>
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
          <tbody>
            {{#each normalClasses}}
            <tr>
              <td>{{index}}</td>
              <td>{{day}}</td>
              <td>{{month}}</td>
              <td>{{startTime}}</td>
              <td>{{endTime}}</td>
              <td class="tema">{{topic}}</td>
              <td>{{totalHours}}</td>
              <td class="signature-cell">{{#if ../signatureDataUri}}<img src="{{../signatureDataUri}}" alt="Firma" class="signature-image"/>{{/if}}</td>
            </tr>
            {{/each}}
          </tbody>
        </table>
        {{#if canceledClasses.length}}
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
          <tbody>
            {{#each canceledClasses}}
            <tr>
              <td>{{index}}</td>
              <td>{{day}}</td>
              <td>{{month}}</td>
              <td>{{startTime}}</td>
              <td>{{endTime}}</td>
              <td class="tema">{{reason}}</td>
              <td>{{totalHours}}</td>
              <td class="signature-cell">{{#if ../signatureDataUri}}<img src="{{../signatureDataUri}}" alt="Firma" class="signature-image"/>{{/if}}</td>
            </tr>
            {{/each}}
          </tbody>
        </table>
        {{/if}}
      </body>
    </html>
  `;

  const template = Handlebars.compile(source);

  const { subject } = data;
  const { teacher, classes } = subject;
  const currentYear = new Date().getFullYear();

  const normalClasses = classes
    .filter(cls => cls.status !== 'CANCELADA')
    .map((cls, index) => ({
      index: index + 1,
      day: new Date(cls.date).getDate(),
      month: new Date(cls.date).getMonth() + 1,
      startTime: cls.startTime
        ? new Date(cls.startTime).toLocaleTimeString('es-CO', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          })
        : '',
      endTime: cls.endTime
        ? new Date(cls.endTime).toLocaleTimeString('es-CO', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          })
        : '',
      topic: cls.topic || '',
      totalHours:
        cls.endTime && cls.startTime
          ? Math.round(
              (new Date(cls.endTime).getTime() - new Date(cls.startTime).getTime()) /
                (1000 * 60 * 60)
            )
          : 0,
    }));

  const canceledClasses = classes
    .filter(cls => cls.status === 'CANCELADA')
    .map((cls, index) => ({
      index: index + 1,
      day: new Date(cls.date).getDate(),
      month: new Date(cls.date).getMonth() + 1,
      startTime: cls.startTime
        ? new Date(cls.startTime).toLocaleTimeString('es-CO', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          })
        : '',
      endTime: cls.endTime
        ? new Date(cls.endTime).toLocaleTimeString('es-CO', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          })
        : '',
      reason:
        cls.cancellationReason ||
        (cls.description?.includes('cancelada') ? cls.description : 'Clase cancelada'),
      totalHours:
        cls.endTime && cls.startTime
          ? Math.round(
              (new Date(cls.endTime).getTime() - new Date(cls.startTime).getTime()) /
                (1000 * 60 * 60)
            )
          : 0,
    }));

  const templateData = {
    teacherName: teacher.name || '',
    program: subject.program || '',
    subjectName: subject.name || '',
    currentYear,
    periodo: subject.semester?.toString() === '2' ? '2' : '1',
    normalClasses,
    canceledClasses,
    logoDataUri,
    signatureDataUri,
  };

  return template(templateData);
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

    const { teacher } = subjectData;
    let signatureDataUri: string | null = null;
    if (teacher.signatureUrl) {
      try {
        if (teacher.signatureUrl.startsWith('http')) {
          const response = await fetch(teacher.signatureUrl);
          if (response.ok) {
            const imageBuffer = await response.arrayBuffer();
            const imageBase64 = Buffer.from(imageBuffer).toString('base64');
            const mimeType = response.headers.get('content-type') || 'image/png';
            signatureDataUri = `data:${mimeType};base64,${imageBase64}`;
          }
        } else {
          const signaturePath = path.join(process.cwd(), 'public', teacher.signatureUrl);
          if (fs.existsSync(signaturePath)) {
            const signatureBuffer = fs.readFileSync(signaturePath);
            const extension = path.extname(teacher.signatureUrl).slice(1);
            const mimeType = `image/${extension === 'svg' ? 'svg+xml' : extension}`;
            signatureDataUri = `data:${mimeType};base64,${signatureBuffer.toString('base64')}`;
          }
        }
      } catch (error) {
        console.error('Error al procesar la imagen de la firma:', error);
      }
    }

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

    try {
      console.log('Iniciando generación del PDF...');

      const pdfBuffer = await nodeHtmlToImage({
        html: htmlContent,
        output: undefined, // Se cambia 'null' a 'undefined' para compatibilidad
        puppeteerArgs: {
          args: ['--no-sandbox'],
        },
      });

      // Se asegura que pdfBuffer sea un solo Buffer antes de subirlo
      if (Array.isArray(pdfBuffer)) {
        console.error('node-html-to-image devolvió un array, se esperaba un Buffer.');
        throw new Error('Error al generar el PDF: se recibió un formato inesperado.');
      }

      console.log('PDF generado exitosamente');

      const fileName = `registro-clases_${subjectData.code || subjectId}_${Date.now()}.pdf`;
      const blob = await put(`reports/${fileName}`, pdfBuffer, {
        access: 'public',
      });

      const updatedReport = await db.report.update({
        where: { id: reportId },
        data: {
          status: 'COMPLETADO',
          fileUrl: blob.url,
          fileName: fileName,
        },
        include: {
          requestedBy: {
            select: {
              correoPersonal: true,
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
      });

      if (updatedReport.requestedBy?.correoPersonal && updatedReport.subject) {
        try {
          await sendEmail({
            to: updatedReport.requestedBy.correoPersonal,
            subject: `Reporte de asistencia generado - ${updatedReport.subject.name}`,
            react: ReportReadyEmail({
              subjectName: updatedReport.subject.name,
              reportName: fileName,
              downloadUrl: blob.url,
              userName: updatedReport.requestedBy.name || 'Docente',
              supportEmail: 'soporte@institucion.edu.co',
            }),
          });
          console.log(`Notificación enviada a: ${updatedReport.requestedBy.correoPersonal}`);
        } catch (emailError) {
          console.error('Error al enviar el correo de notificación:', emailError);
          await db.report.update({
            where: { id: reportId },
            data: {
              status: ReportStatus.COMPLETADO,
              error:
                'El reporte se generó correctamente, pero hubo un error al enviar la notificación por correo.',
            },
          });
        }
      }

      return { success: true, fileUrl: blob.url };
    } catch (error) {
      console.error('Error al generar el reporte PDF:', error);
      await db.report.update({
        where: { id: reportId },
        data: {
          status: ReportStatus.FALLIDO,
          error: error instanceof Error ? error.message : 'Error desconocido',
        },
      });
      throw error;
    }
  } catch (error) {
    console.error(`Error al generar el reporte para la asignatura ${subjectId}:`, error);
    await db.report.update({
      where: { id: reportId },
      data: {
        status: ReportStatus.FALLIDO,
        error: error instanceof Error ? error.message : 'Error desconocido',
      },
    });
    throw error;
  }
};
