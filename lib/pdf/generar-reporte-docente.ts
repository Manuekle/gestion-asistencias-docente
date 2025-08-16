// lib/generar-reporte-playwright.ts
import ReportReadyEmail from '@/app/emails/ReportReadyEmail';
import { sendEmail } from '@/lib/email';
import { db } from '@/lib/prisma';
import { Class, ReportStatus, Subject, User } from '@prisma/client';
import chromiumPkg from '@sparticuz/chromium';
import { put } from '@vercel/blob';
import fs from 'fs';
import path from 'path';
import { chromium, type LaunchOptions } from 'playwright-core';

// Tipos de datos
type ClassReportData = {
  subject: Subject & { teacher: User; classes: Class[] };
};

// Type for launch options
type ChromiumLaunchOptions = LaunchOptions & {
  args: string[];
  headless: boolean | 'new';
  timeout: number;
  executablePath?: string;
};

/**
 * Genera el contenido HTML para el reporte usando template
 */
const generateReportHTML = (
  data: ClassReportData,
  logoDataUri: string,
  signatureDataUri: string | null
): string => {
  const { subject } = data;
  const { teacher, classes } = subject;

  // Validar que el período sea 1 o 2
  const periodo = subject.semester?.toString() === '2' ? '2' : '1';

  const formatTime = (date: Date | null | undefined): string => {
    if (!date) return '';
    return new Date(date).toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const calculateHours = (start: Date | null | undefined, end: Date | null | undefined): number => {
    if (!start || !end) return 4;
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

  // Template HTML completo
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Geist:wght@100..900&display=swap');
          
          * {
            box-sizing: border-box;
          }
          
          body { 
            font-family: 'Geist', Arial, sans-serif; 
            margin: 20px; 
            color: #333; 
            font-size: 9pt; 
            line-height: 1.4;
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
            max-width: 100%;
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
            white-space: nowrap;
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
            margin-bottom: 20px;
          }
          
          .main-table th, .main-table td {
            border: 1px solid #ccc;
            padding: 6px;
            text-align: center;
            vertical-align: middle;
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
            text-align: left !important;
            width: 50%;
          }
          
          .signature-cell {
            height: 50px;
            padding: 2px;
            width: 80px;
          }
          
          .signature-image {
            max-width: 100%;
            max-height: 45px;
            object-fit: contain;
          }

          .canceled-section {
            margin-top: 30px;
          }

          .canceled-section h3 {
            color: #000;
            margin-bottom: 15px;
            font-size: 12pt;
          }

          @media print {
            body {
              margin: 0;
            }
            .page-header {
              margin-bottom: 20px;
            }
          }

          @page {
            margin: 20mm 10mm;
            size: A4;
          }
        </style>
      </head>
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
              <th rowspan="2" style="width: 50px;">No.</th>
              <th colspan="2">FECHA</th>
              <th colspan="2">HORA</th>
              <th rowspan="2" class="tema">TEMA</th>
              <th rowspan="2" style="width: 80px;">TOTAL HORAS</th>
              <th rowspan="2" style="width: 80px;">FIRMA DOCENTE</th>
            </tr>
            <tr>
              <th style="width: 40px;">DD</th>
              <th style="width: 40px;">MM</th>
              <th style="width: 80px;">INICIO</th>
              <th style="width: 80px;">FINAL</th>
            </tr>
          </thead>
          <tbody>${classRows}</tbody>
        </table>

        ${
          canceledClasses.length > 0
            ? `
        <div class="canceled-section">
          <h3>CLASES CANCELADAS</h3>
          <table class="main-table">
            <thead>
              <tr>
                <th rowspan="2" style="width: 50px;">No.</th>
                <th colspan="2">FECHA</th>
                <th colspan="2">HORA</th>
                <th rowspan="2" class="tema">RAZÓN DE CANCELACIÓN</th>
                <th rowspan="2" style="width: 80px;">HORAS</th>
                <th rowspan="2" style="width: 80px;">FIRMA DOCENTE</th>
              </tr>
              <tr>
                <th style="width: 40px;">DD</th>
                <th style="width: 40px;">MM</th>
                <th style="width: 80px;">INICIO</th>
                <th style="width: 80px;">FINAL</th>
              </tr>
            </thead>
            <tbody>${canceledClassRows}</tbody>
          </table>
        </div>
        `
            : ''
        }
      </body>
    </html>
  `;
};

/**
 * Genera un reporte en PDF usando Playwright
 */
export const generarBitacoraDocente = async (subjectId: string, reportId: string) => {
  let browser = null;

  try {
    console.log('🚀 Iniciando generación de PDF con Playwright...');

    // Actualizar estado a EN_PROCESO
    await db.report.update({
      where: { id: reportId },
      data: { status: 'EN_PROCESO' },
    });

    // Obtener datos de la asignatura
    const subjectData = await db.subject.findUnique({
      where: { id: subjectId },
      include: {
        teacher: true,
        classes: { orderBy: { date: 'asc' } },
      },
    });

    if (!subjectData) {
      throw new Error('Asignatura no encontrada');
    }

    console.log(`📚 Procesando asignatura: ${subjectData.name}`);

    const reportData: ClassReportData = {
      subject: subjectData as Subject & { teacher: User; classes: Class[] },
    };

    // Obtener firma del docente
    const { teacher } = subjectData;
    let signatureDataUri: string | null = null;

    if (teacher.signatureUrl) {
      try {
        console.log('🖊️ Procesando firma del docente...');
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
        console.warn('⚠️ Error al procesar firma:', error);
      }
    }

    // Obtener logo
    console.log('🎨 Obteniendo logo...');
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
      console.warn('⚠️ Error al obtener logo:', error);
    }

    // Generar HTML
    console.log('📄 Generando contenido HTML...');
    const htmlContent = generateReportHTML(reportData, logoDataUri, signatureDataUri);

    // Configuración de Playwright
    const isProduction = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
    console.log(`🌍 Entorno: ${isProduction ? 'Producción' : 'Desarrollo'}`);

    // Argumentos optimizados para Chromium
    const args = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--disable-extensions',
      '--disable-plugins',
      '--disable-images',
      '--disable-javascript',
      '--virtual-time-budget=10000',
      '--run-all-compositor-stages-before-draw',
      '--disable-background-timer-throttling',
      '--disable-renderer-backgrounding',
      '--disable-backgrounding-occluded-windows',
      '--disable-ipc-flooding-protection',
      '--single-process',
      '--no-zygote',
      '--no-first-run',
      '--disable-sync',
      '--disable-features=TranslateUI',
      '--deterministic-fetch',
      '--disable-blink-features=AutomationControlled',
      '--disable-software-rasterizer',
      '--disable-remote-fonts',
      '--disable-background-networking',
      '--disable-default-apps',
      '--disable-translate',
      '--disable-web-resources',
      '--disable-session-crashed-bubble',
      '--disable-crash-reporter',
      '--disable-notifications',
      '--metrics-recording-only',
      '--mute-audio',
      '--no-default-browser-check',
      '--no-pings',
      '--password-store=basic',
      '--use-mock-keychain',
      '--disable-breakpad',
      '--disable-component-update',
      '--disable-domain-reliability',
      '--disable-client-side-phishing-detection',
      '--disable-default-apps',
      '--disable-hang-monitor',
      '--disable-prompt-on-repost',
      '--disable-sync',
      '--disable-web-security',
      '--force-color-profile=srgb',
      '--use-gl=swiftshader',
      '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader',
      '--ignore-gpu-blocklist',
      '--in-process-gpu',
    ];

    // Agregar argumentos específicos de producción si es necesario
    if (isProduction) {
      args.push(
        ...[
          '--disable-software-rasterizer',
          '--disable-dev-shm-usage',
          '--disable-setuid-sandbox',
          '--no-sandbox',
          '--disable-web-security',
          '--disable-gpu',
          '--disable-dev-shm-usage',
          '--disable-software-rasterizer',
          '--no-zygote',
          '--single-process',
          '--no-first-run',
          '--no-zygote',
          '--font-render-hinting=none',
          '--disable-features=AudioServiceOutOfProcess,IsolateOrigins,site-per-process',
          '--enable-features=NetworkService,NetworkServiceInProcess',
        ]
      );
    }

    // Crear opciones de lanzamiento de forma más robusta
    const launchOptions: ChromiumLaunchOptions = {
      args,
      headless: true,
      timeout: 60000, // Aumentar el tiempo de espera
    };

    if (isProduction) {
      console.log('☁️ Configurando para Vercel...');
      try {
        // Usar el ejecutable de @sparticuz/chromium
        launchOptions.executablePath = await chromiumPkg.executablePath();
        console.log('✅ Ruta del ejecutable de Chromium configurada correctamente');
      } catch (error) {
        console.error('❌ Error al configurar la ruta del ejecutable de Chromium:', error);
        throw new Error('No se pudo configurar el navegador para la generación de PDF');
      }
    }

    // Lanzar navegador
    console.log('🌐 Iniciando navegador...');
    browser = await chromium.launch(launchOptions);

    const context = await browser.newContext({
      viewport: { width: 1200, height: 1600 },
      deviceScaleFactor: 1,
    });

    const page = await context.newPage();

    // Configuraciones adicionales de página
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'es-ES,es;q=0.9',
    });

    // Cargar contenido HTML
    console.log('📝 Cargando contenido HTML...');
    await page.setContent(htmlContent, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    // Esperar a que las fuentes se carguen
    await page.waitForTimeout(2000);

    // Generar PDF
    console.log('📄 Generando PDF...');
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '10mm',
        bottom: '20mm',
        left: '10mm',
      },
      preferCSSPageSize: true,
      displayHeaderFooter: false,
    });

    console.log(`✅ PDF generado exitosamente: ${pdfBuffer.length} bytes`);

    // Subir a Vercel Blob
    console.log('☁️ Subiendo a Vercel Blob...');
    const fileName = `registro-clases_${subjectData.code || subjectId}_${Date.now()}.pdf`;
    const blob = await put(`reports/${fileName}`, Buffer.from(pdfBuffer), {
      access: 'public',
    });

    console.log(`📤 Archivo subido: ${blob.url}`);

    // Actualizar reporte
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

    // Enviar email de notificación
    if (updatedReport.requestedBy?.correoPersonal && updatedReport.subject) {
      try {
        console.log('📧 Enviando notificación por email...');
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
        console.log(`✅ Email enviado a: ${updatedReport.requestedBy.correoPersonal}`);
      } catch (emailError) {
        console.error('❌ Error al enviar email:', emailError);
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
    console.error('❌ Error al generar reporte:', error);

    await db.report.update({
      where: { id: reportId },
      data: {
        status: ReportStatus.FALLIDO,
        error: error instanceof Error ? error.message : 'Error desconocido',
      },
    });

    throw error;
  } finally {
    if (browser) {
      console.log('🔄 Cerrando navegador...');
      await browser.close().catch(console.error);
    }
  }
};
