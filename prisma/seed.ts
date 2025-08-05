import {
  AttendanceStatus,
  ClassStatus,
  EventType,
  PrismaClient,
  ReportFormat,
  ReportStatus,
  Role,
  UnenrollRequestStatus,
} from '@prisma/client';
import { hash } from 'bcryptjs';
import { addDays, addHours, addWeeks, isWeekend, subMonths } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

// Define types for our enhanced subject objects
interface StudentEnrollment {
  id: string;
  isActive: boolean;
  // Add other student properties as needed
}

interface EnhancedSubject extends Awaited<ReturnType<typeof prisma.subject.create>> {
  students: StudentEnrollment[];
}

// Event titles by type
const eventTitles: Record<EventType, string[]> = {
  [EventType.EXAMEN]: [
    'Primer parcial',
    'Segundo parcial',
    'Examen final',
    'Quiz 1',
    'Quiz 2',
    'Evaluación de laboratorio',
  ],
  [EventType.TRABAJO]: [
    'Entrega proyecto final',
    'Taller práctico',
    'Informe de laboratorio',
    'Presentación oral',
    'Ensayo crítico',
  ],
  [EventType.LIMITE]: [
    'Fecha límite de entrega',
    'Último día para retiro',
    'Fecha tope para entrega de trabajos',
    'Cierre de inscripciones',
  ],
  [EventType.ANUNCIO]: [
    'Importante anuncio',
    'Cambio de aula',
    'Suspensión de clases',
    'Recordatorio importante',
  ],
  [EventType.INFO]: [
    'Material de estudio',
    'Enlaces importantes',
    'Recursos adicionales',
    'Horario de asesorías',
  ],
};

// Initialize Prisma Client
const prisma = new PrismaClient();

// Helper functions for generating user data
const generateStudentCode = (index: number): string => `S${String(index).padStart(4, '0')}`;
const generateTeacherCode = (index: number): string => `T${String(index).padStart(4, '0')}`;

const studentNames = [
  'Juan Pérez',
  'María Rodríguez',
  'Carlos Sánchez',
  'Ana García',
  'Luis González',
  'Laura Martínez',
  'Pedro López',
  'Sofía Ramírez',
  'Diego Ramírez',
  'Valentina Gómez',
  'Andrés Castro',
  'Camila Rojas',
  'Javier Torres',
  'Daniela Vargas',
  'Santiago Jiménez',
  'Mariana Díaz',
  'Alejandro Ruiz',
  'Isabel Mendoza',
  'Ricardo Silva',
  'Gabriela Núñez',
];

const teacherNames = [
  'Andrés Cepeda',
  'Carolina Herrera',
  'Miguel Ángel',
  'Patricia Benítez',
  'Roberto Mendoza',
];

const programs = [
  'Ingeniería de Sistemas',
  'Ingeniería Electrónica',
  'Administración de Empresas',
  'Contaduría Pública',
  'Psicología',
  'Derecho',
  'Medicina',
  'Arquitectura',
];

// Helper function to generate dates for classes (skipping weekends and holidays)
const generateClassDates = (
  startDate: Date,
  count: number,
  daysOfWeek: number[] = [1, 3, 5]
): Date[] => {
  const dates: Date[] = [];
  const dateCounter = new Date(startDate);

  while (dates.length < count) {
    const currentDay = dateCounter.getDay();
    if (daysOfWeek.includes(currentDay) && !isWeekend(dateCounter) && Math.random() > 0.05) {
      const classDate = new Date(dateCounter);
      classDate.setHours(7 + Math.floor(Math.random() * 12), 0, 0, 0);
      dates.push(classDate);
    }
    dateCounter.setDate(dateCounter.getDate() + 1);
  }
  return dates;
};

// Helper functions
const randomDate = (start: Date, end: Date): Date => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const randomElement = <T>(array: T[]): T => {
  if (array.length === 0) {
    throw new Error('Cannot get random element from empty array');
  }
  return array[Math.floor(Math.random() * array.length)];
};

const randomSubset = <T>(array: T[], maxSize: number): T[] => {
  if (array.length === 0) return [];
  const size = Math.min(Math.floor(Math.random() * maxSize) + 1, array.length);
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, size);
};

// Hash password helper
const hashPassword = async (password: string): Promise<string> => {
  return hash(password, 12);
};

async function main() {
  console.log('🚀 Starting seeding...');

  // Clean existing data in the correct order to avoid foreign key constraints
  console.log('🧹 Cleaning existing data...');
  await prisma.attendance.deleteMany({});
  await prisma.class.deleteMany({});
  await prisma.subjectEvent.deleteMany({});
  await prisma.report.deleteMany({});
  await prisma.unenrollRequest.deleteMany({});
  await prisma.subject.deleteMany({});

  // First, update all users to have null codigoEstudiantil to avoid unique constraint
  console.log('🔄 Updating existing users...');
  await prisma.user.updateMany({
    where: { role: 'ESTUDIANTE' },
    data: { codigoEstudiantil: null },
  });

  // Then delete all users
  await prisma.user.deleteMany({});

  console.log('👥 Creating users...');

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      name: 'Admin Principal',
      correoInstitucional: 'admin@fup.edu.co',
      correoPersonal: 'admin@example.com',
      password: await hashPassword('admin123'),
      document: '10000000',
      role: Role.ADMIN,
      isActive: true,
    },
  });
  console.log(`✅ Created admin user: ${admin.correoInstitucional}`);

  // Create coordinator
  const coordinator = await prisma.user.create({
    data: {
      name: 'Coordinador Programa',
      correoInstitucional: 'coordinador@fup.edu.co',
      correoPersonal: 'coordinador@example.com',
      password: await hashPassword('coordinador123'),
      document: '20000000',
      role: Role.COORDINADOR,
      isActive: true,
    },
  });
  console.log(`✅ Created coordinator user: ${coordinator.correoInstitucional}`);

  // Create teachers
  const teachers = [];
  for (let i = 0; i < teacherNames.length; i++) {
    const teacher = await prisma.user.create({
      data: {
        name: teacherNames[i],
        correoInstitucional: `docente${i + 1}@fup.edu.co`,
        correoPersonal: `docente${i + 1}@example.com`,
        password: await hashPassword('docente123'),
        document: `3${String(i + 1).padStart(7, '0')}`,
        codigoDocente: generateTeacherCode(i + 1),
        role: Role.DOCENTE,
        isActive: Math.random() > 0.1, // 90% active
        telefono: `3${String(2000000 + i).padStart(7, '0')}`,
        signatureUrl: Math.random() > 0.5 ? `/signatures/teacher-${i + 1}.png` : null,
      },
    });
    teachers.push(teacher);
    console.log(
      `✅ Created teacher: ${teacher.name} (${teacher.isActive ? 'active' : 'inactive'})`
    );
  }

  // Create students
  const students = [];
  for (let i = 0; i < studentNames.length; i++) {
    const isActive = Math.random() > 0.1; // 90% active
    const student = await prisma.user.create({
      data: {
        name: studentNames[i],
        correoInstitucional: `estudiante${i + 1}@fup.edu.co`,
        correoPersonal: `estudiante${i + 1}@example.com`,
        password: await hashPassword('estudiante123'),
        document: `4${String(i + 1).padStart(7, '0')}`,
        codigoEstudiantil: generateStudentCode(i + 1),
        role: Role.ESTUDIANTE,
        isActive,
        telefono: `3${String(1000000 + i).padStart(7, '0')}`,
      },
    });
    students.push(student);
    console.log(`✅ Created student: ${student.name} (${isActive ? 'active' : 'inactive'})`);
  }

  console.log('📚 Creating subjects...');
  const subjects = [
    {
      name: 'Programación Web Avanzada',
      code: 'PW-2025-1',
      program: programs[0],
      semester: 5,
      credits: 3,
      description: 'Desarrollo de aplicaciones web modernas con tecnologías avanzadas',
    },
    {
      name: 'Bases de Datos',
      code: 'BD-2025-1',
      program: programs[0],
      semester: 4,
      credits: 4,
      description: 'Diseño e implementación de bases de datos relacionales y NoSQL',
    },
    {
      name: 'Inteligencia Artificial',
      code: 'IA-2025-1',
      program: programs[0],
      semester: 7,
      credits: 4,
      description: 'Fundamentos y aplicaciones de la inteligencia artificial',
    },
    {
      name: 'Desarrollo Móvil',
      code: 'DM-2025-1',
      program: programs[0],
      semester: 6,
      credits: 3,
      description: 'Desarrollo de aplicaciones móviles multiplataforma',
    },
    {
      name: 'Circuitos Electrónicos',
      code: 'CE-2025-1',
      program: programs[1],
      semester: 3,
      credits: 4,
      description: 'Diseño y análisis de circuitos electrónicos básicos',
    },
    {
      name: 'Contabilidad Financiera',
      code: 'CF-2025-1',
      program: programs[2],
      semester: 2,
      credits: 3,
      description: 'Principios y prácticas de contabilidad financiera',
    },
  ];

  // Create subjects and assign teachers
  const createdSubjects: EnhancedSubject[] = [];
  for (let i = 0; i < subjects.length; i++) {
    const subjectData = subjects[i];
    const teacher = teachers[i % teachers.length];

    // Select a subset of students for each subject (70-100% of active students)
    const activeStudents = students.filter(s => s.isActive);
    const subjectStudents = randomSubset(
      activeStudents,
      Math.floor(activeStudents.length * (0.7 + Math.random() * 0.3))
    );

    const subject = await prisma.subject.create({
      data: {
        name: subjectData.name,
        code: subjectData.code,
        program: subjectData.program,
        semester: subjectData.semester,
        credits: subjectData.credits,
        teacher: {
          connect: { id: teacher.id },
        },
        studentIds: subjectStudents.map(s => s.id),
        createdAt: randomDate(subMonths(new Date(), 3), new Date()),
      },
    });

    createdSubjects.push({
      ...subject,
      students: subjectStudents, // Store students for attendance generation
    });

    console.log(
      `✅ Created subject: ${subject.name} (${subject.code}) with teacher ${teacher.name} and ${subjectStudents.length} students`
    );
  }

  // Update students with their enrolled subjects
  await Promise.all(
    students.map(student => {
      const enrolledSubjects = createdSubjects
        .filter(subject => subject.students.some(s => s.id === student.id))
        .map(subject => subject.id);

      return prisma.user.update({
        where: { id: student.id },
        data: {
          enrolledSubjectIds: enrolledSubjects,
        },
      });
    })
  );

  console.log('📅 Creating classes and attendance records...');
  const allClasses = [];
  const allAttendances = [];
  const today = new Date();
  const twoMonthsAgo = subMonths(today, 2);

  // Define class days for each subject (e.g., MWF, TTH, etc.)
  const classSchedules = [
    [1, 3, 5], // MWF
    [2, 4], // TTH
    [1, 4], // MTH
    [2, 5], // TF
  ];

  for (const subject of createdSubjects) {
    const totalClasses = 16; // 16 classes per subject (about 8 weeks of classes)
    const classDays = randomElement(classSchedules);
    const classDates = generateClassDates(twoMonthsAgo, totalClasses, classDays);

    console.log(`📝 Creating ${totalClasses} classes for ${subject.name}...`);

    for (let i = 0; i < totalClasses; i++) {
      const classDate = classDates[i];
      const isCancelled = Math.random() < 0.1; // 10% chance of cancellation

      const classData = {
        date: classDate,
        startTime: classDate,
        endTime: addHours(classDate, 2), // 2-hour classes
        topic: `Sesión ${i + 1}: ${randomElement([
          'Introducción',
          'Teoría',
          'Taller Práctico',
          'Discusión',
          'Evaluación',
          'Revisión',
          'Laboratorio',
          'Presentaciones',
        ])}`,
        description: `Clase ${i + 1} de ${subject.name}`,
        status: isCancelled ? ClassStatus.CANCELADA : ClassStatus.REALIZADA,
        cancellationReason: isCancelled
          ? randomElement([
              'Emergencia personal del docente',
              'Feriado institucional',
              'Evento académico',
              'Falta de luz',
              'Problemas técnicos',
            ])
          : null,
        classroom: `A${Math.floor(Math.random() * 10) + 1}0${Math.floor(Math.random() * 5) + 1}`,
        qrToken: uuidv4(),
        qrTokenExpiresAt: addHours(classDate, 24),
        subjectId: subject.id,
        totalStudents: subject.students.length,
        presentCount: 0,
        absentCount: 0,
        lateCount: 0,
        justifiedCount: 0,
      };

      const createdClass = await prisma.class.create({
        data: classData,
      });
      allClasses.push(createdClass);

      // Generate attendance records for each student in this class
      const classAttendances = [];
      for (const student of subject.students) {
        // Skip some students occasionally (5% chance)
        if (Math.random() < 0.95) {
          const status = randomElement([
            AttendanceStatus.PRESENTE,
            AttendanceStatus.PRESENTE,
            AttendanceStatus.PRESENTE,
            AttendanceStatus.PRESENTE,
            AttendanceStatus.PRESENTE,
            AttendanceStatus.TARDANZA,
            AttendanceStatus.AUSENTE,
            AttendanceStatus.JUSTIFICADO,
          ]);

          const attendance = await prisma.attendance.create({
            data: {
              status,
              justification:
                status === AttendanceStatus.JUSTIFICADO
                  ? randomElement([
                      'Enfermedad',
                      'Emergencia familiar',
                      'Cita médica',
                      'Problemas de transporte',
                    ])
                  : null,
              studentId: student.id,
              classId: createdClass.id,
              recordedAt: classDate,
            },
          });

          // Update class attendance counts
          switch (status) {
            case AttendanceStatus.PRESENTE:
              createdClass.presentCount++;
              break;
            case AttendanceStatus.AUSENTE:
              createdClass.absentCount++;
              break;
            case AttendanceStatus.TARDANZA:
              createdClass.lateCount++;
              break;
            case AttendanceStatus.JUSTIFICADO:
              createdClass.justifiedCount++;
              break;
          }

          classAttendances.push(attendance);
        }
      }

      // Update class with final attendance counts
      await prisma.class.update({
        where: { id: createdClass.id },
        data: {
          presentCount: createdClass.presentCount,
          absentCount: createdClass.absentCount,
          lateCount: createdClass.lateCount,
          justifiedCount: createdClass.justifiedCount,
        },
      });

      allAttendances.push(...classAttendances);
    }
  }

  // Create subject events (exams, assignments, etc.)
  console.log('📅 Creating subject events...');
  const allEvents = [];

  for (const subject of createdSubjects) {
    const eventCount = 5 + Math.floor(Math.random() * 6); // 5-10 events per subject
    const eventTypes = Object.values(EventType);

    for (let i = 0; i < eventCount; i++) {
      const eventType = eventTypes[i % eventTypes.length];
      const eventDate = randomDate(subMonths(new Date(), 2), addWeeks(new Date(), 4));

      const availableTitles = eventTitles[eventType] || ['Evento académico'];
      const eventTitle = randomElement([...availableTitles, `Evento ${i + 1}`]);

      const event = await prisma.subjectEvent.create({
        data: {
          title: eventTitle,
          description: `Descripción detallada para ${eventTitle.toLowerCase()} de ${subject.name}`,
          date: eventDate,
          type: eventType,
          subjectId: subject.id,
          createdById: subject.teacherId,
        },
      });

      allEvents.push(event);
      console.log(`✅ Created ${eventType} event: ${eventTitle} for ${subject.name}`);
    }
  }

  // Create reports
  console.log('📊 Generating reports...');
  const allReports = [];

  for (const subject of createdSubjects) {
    const reportCount = 2 + Math.floor(Math.random() * 3); // 2-4 reports per subject
    const reportTypes = Object.values(ReportFormat);

    for (let i = 0; i < reportCount; i++) {
      const reportDate = randomDate(subMonths(new Date(), 1), new Date());

      const reportStatus = randomElement(Object.values(ReportStatus));
      const reportType = reportTypes[i % reportTypes.length];
      const isComplete = reportStatus === ReportStatus.COMPLETADO;

      const report = await prisma.report.create({
        data: {
          subjectId: subject.id,
          requestedById: subject.teacherId,
          status: reportStatus,
          format: reportType,
          fileUrl: isComplete
            ? `/reports/${subject.code}-${i}-${Date.now()}.${reportType.toLowerCase()}`
            : null,
          fileName: isComplete ? `Reporte-${subject.code}-${i}` : null,
          error: reportStatus === ReportStatus.FALLIDO ? 'Error al generar el reporte' : null,
          createdAt: reportDate,
          updatedAt: reportDate,
        },
      });

      allReports.push(report);
      console.log(`✅ Created ${reportType} report for ${subject.name} (${reportStatus})`);
    }
  }

  // Create unenroll requests
  console.log('📝 Creating unenroll requests...');
  const allUnenrollRequests = [];

  // Get 20% of active students to create unenroll requests
  const studentsForUnenroll = students
    .filter(s => s.isActive)
    .sort(() => 0.5 - Math.random())
    .slice(0, Math.ceil(students.length * 0.2));

  for (const student of studentsForUnenroll) {
    // Get all subjects the student is enrolled in
    const enrolledSubjects = createdSubjects.filter(s =>
      s.students.some(st => st.id === student.id)
    );

    if (enrolledSubjects.length === 0) continue;

    const subject = randomElement(enrolledSubjects);
    const requestDate = randomDate(subMonths(new Date(), 1), new Date());

    const status = randomElement(Object.values(UnenrollRequestStatus));
    const activeTeachers = teachers.filter(t => t.isActive);
    const reviewedById =
      status !== UnenrollRequestStatus.PENDIENTE && activeTeachers.length > 0
        ? randomElement(activeTeachers).id
        : null;

    // Prepare reason based on status
    const reason =
      status !== UnenrollRequestStatus.PENDIENTE
        ? randomElement([
            'Solicitud aprobada',
            'Cupo disponible',
            'Caso evaluado positivamente',
            'Solicitud rechazada',
            'No cumple con los requisitos',
          ])
        : randomElement([
            'Cambio de horario laboral',
            'Problemas de salud',
            'Dificultades académicas',
            'Cambio de residencia',
            'Razones personales',
          ]);

    const unenrollRequest = await prisma.unenrollRequest.create({
      data: {
        studentId: student.id,
        subjectId: subject.id,
        requestedById: student.id,
        reviewedById,
        status,
        reason,
        createdAt: requestDate,
        updatedAt:
          status !== UnenrollRequestStatus.PENDIENTE
            ? addDays(requestDate, Math.floor(Math.random() * 7) + 1)
            : requestDate,
      },
    });

    allUnenrollRequests.push(unenrollRequest);
    console.log(`✅ Created unenroll request for ${student.name} in ${subject.name} (${status})`);
  }

  console.log('\n🌱 Seeding completed! Summary:');
  console.log(
    `- Users: ${students.length + teachers.length + 2} (${students.length} students, ${teachers.length} teachers, 1 admin, 1 coordinator)`
  );
  console.log(`- Subjects: ${createdSubjects.length}`);
  console.log(`- Classes: ${allClasses.length}`);
  console.log(`- Attendance records: ${allAttendances.length}`);
  console.log(`- Subject events: ${allEvents.length}`);
  console.log(`- Reports: ${allReports.length}`);
  console.log(`- Unenroll requests: ${allUnenrollRequests.length}`);
  console.log('\n✅ Seeding completed successfully!');
  console.log('================================');
  console.log('Summary:');
  console.log(`👤 Admin: 1`);
  console.log(`👨‍🏫 Teachers: ${teachers.length}`);
  console.log(`👨‍🎓 Students: ${students.length}`);
  console.log(`📅 Total Classes: ${allClasses.length} (16 per subject)`);
  console.log('================================');
  console.log('Admin credentials:');
  console.log(`Email: admin@fup.edu.co`);
  console.log(`Password: admin123`);
  console.log('--------------------------------');
  console.log('Teacher credentials (use any from 1-3):');
  console.log(`Email: docente1@fup.edu.co`);
  console.log(`Email: docente2@fup.edu.co`);
  console.log(`Email: docente3@fup.edu.co`);
  console.log(`Password: docente123`);
  console.log('--------------------------------');
  console.log('Student credentials (use any from 1-8):');
  console.log(`Email: estudiante1@fup.edu.co to estudiante8@fup.edu.co`);
  console.log(`Password: estudiante123`);
  console.log('================================');
}

// Execute the main function
main()
  .then(() => {
    console.log('🚀 Seeding completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  });
