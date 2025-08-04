import { ClassStatus, PrismaClient, Role } from '@prisma/client';
import { hash } from 'bcryptjs';

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
];

const teacherNames = ['Andrés Cepeda', 'Carolina Herrera', 'Miguel Ángel'];

// Helper function to generate dates for classes (skipping weekends)
const generateClassDates = (startDate: Date, count: number): Date[] => {
  const dates: Date[] = [];
  const dateCounter = new Date(startDate);

  while (dates.length < count) {
    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (dateCounter.getDay() !== 0 && dateCounter.getDay() !== 6) {
      const date = new Date(dateCounter);
      dates.push(date);
    }
    dateCounter.setDate(dateCounter.getDate() + 1);
  }

  return dates;
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

  // Create 3 teachers
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
        isActive: true,
      },
    });
    teachers.push(teacher);
    console.log(`✅ Created teacher ${i + 1}: ${teacher.name}`);
  }

  // Create 8 students
  const students = [];
  for (let i = 0; i < studentNames.length; i++) {
    const student = await prisma.user.create({
      data: {
        name: studentNames[i],
        correoInstitucional: `estudiante${i + 1}@fup.edu.co`,
        correoPersonal: `estudiante${i + 1}@example.com`,
        password: await hashPassword('estudiante123'),
        document: `4${String(i + 1).padStart(7, '0')}`,
        codigoEstudiantil: generateStudentCode(i + 1),
        role: Role.ESTUDIANTE,
        isActive: true,
        telefono: `3${String(1000000 + i).padStart(7, '0')}`,
      },
    });
    students.push(student);
    console.log(`✅ Created student ${i + 1}: ${student.name}`);
  }

  console.log('📚 Creating subjects...');
  const subjects = [
    {
      name: 'Programación Web',
      code: 'PW-2025-1',
      program: 'Ingeniería de Sistemas',
      semester: 5,
      credits: 3,
    },
    {
      name: 'Bases de Datos',
      code: 'BD-2025-1',
      program: 'Ingeniería de Sistemas',
      semester: 4,
      credits: 4,
    },
    {
      name: 'Inteligencia Artificial',
      code: 'IA-2025-1',
      program: 'Ingeniería de Sistemas',
      semester: 7,
      credits: 4,
    },
  ];

  // Create subjects and assign teachers
  const createdSubjects: { id: string; name: string; code: string }[] = [];
  for (let i = 0; i < subjects.length; i++) {
    const subjectData = subjects[i];
    const teacher = teachers[i % teachers.length];

    const subject = await prisma.subject.create({
      data: {
        ...subjectData,
        teacher: {
          connect: { id: teacher.id },
        },
        studentIds: students.map(student => student.id),
      },
    });
    createdSubjects.push(subject);
    console.log(
      `✅ Created subject: ${subject.name} (${subject.code}) with teacher ${teacher.name}`
    );
  }

  // Update students with enrolled subjects
  await Promise.all(
    students.map(student =>
      prisma.user.update({
        where: { id: student.id },
        data: {
          enrolledSubjectIds: createdSubjects.map(subject => subject.id),
        },
      })
    )
  );

  console.log('📅 Creating classes...');
  // Create 16 classes for each subject, starting from today, skipping weekends
  const totalClasses = 16;
  const allClasses = [];

  for (const subject of createdSubjects) {
    const classDates = generateClassDates(new Date(), totalClasses);
    const subjectClasses = [];

    for (let i = 0; i < totalClasses; i++) {
      const classDate = new Date(classDates[i]);
      const startTime = new Date(classDate);

      // Alternate between morning (7AM-11AM) and afternoon (2PM-6PM) slots
      const isMorningSlot = i % 2 === 0;
      if (isMorningSlot) {
        // Morning slot: 7AM - 11AM (4 hours total, 2 slots of 2 hours each)
        startTime.setHours(7 + ((i / 2) % 2) * 2, 0, 0, 0);
      } else {
        // Afternoon slot: 2PM - 6PM (4 hours total, 2 slots of 2 hours each)
        startTime.setHours(14 + (Math.floor(i / 2) % 2) * 2, 0, 0, 0);
      }

      const endTime = new Date(startTime);
      endTime.setHours(startTime.getHours() + 2); // 2-hour classes

      const classItem = await prisma.class.create({
        data: {
          date: startTime,
          startTime,
          endTime,
          topic: `Tema ${i + 1}: ${subject.name}`,
          description: `Clase ${i + 1} de ${subject.name}. ${i % 3 === 0 ? 'Evaluación parcial' : 'Clase teórico-práctica'}`,
          status: i === 0 ? ClassStatus.PROGRAMADA : ClassStatus.PROGRAMADA,
          subject: {
            connect: { id: subject.id },
          },
          classroom: `A${Math.floor(Math.random() * 5) + 1}0${Math.floor(Math.random() * 5) + 1}`,
          qrToken:
            Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15),
          qrTokenExpiresAt: new Date(endTime.getTime() + 30 * 60000), // 30 minutes after class ends
          totalStudents: students.length,
        },
      });
      subjectClasses.push(classItem);
    }

    allClasses.push(...subjectClasses);
    console.log(`✅ Created ${subjectClasses.length} classes for ${subject.name}`);
  }

  console.log('🎉 Seeding completed!');
  console.log('================================');
  console.log('Summary:');
  console.log(`👤 Admin: 1`);
  console.log(`👨‍🏫 Teachers: ${teachers.length}`);
  console.log(`👨‍🎓 Students: ${students.length}`);
  console.log(`📚 Subjects: ${createdSubjects.length}`);
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
