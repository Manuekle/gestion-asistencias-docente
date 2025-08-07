import { ClassStatus, PrismaClient, Role } from '@prisma/client';
import { hash } from 'bcryptjs';
import { addDays } from 'date-fns';

const prisma = new PrismaClient();

// Helper function to generate class dates (twice a week for 8 weeks)
const generateClassDates = (startDate: Date, numberOfClasses: number): Date[] => {
  const dates: Date[] = [];
  let currentDate = new Date(startDate);

  // Set start date to next Monday
  const dayOfWeek = currentDate.getDay();
  if (dayOfWeek !== 1) {
    // 1 is Monday
    const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
    currentDate = addDays(currentDate, daysUntilMonday);
  }

  // Generate classes on Monday and Thursday
  for (let i = 0; i < numberOfClasses; i++) {
    const classDate = new Date(currentDate);

    if (i % 2 === 0) {
      // Monday at 10:00 AM
      classDate.setHours(10, 0, 0, 0);
      dates.push(classDate);
    } else {
      // Thursday (3 days after Monday) at 10:00 AM
      const thursdayDate = addDays(classDate, 3);
      thursdayDate.setHours(10, 0, 0, 0);
      dates.push(thursdayDate);
      // Move to next week
      currentDate = addDays(currentDate, 7);
    }
  }

  return dates.slice(0, numberOfClasses);
};

// Helper function to create end time (10 PM)
const createEndTime = (startTime: Date): Date => {
  const endTime = new Date(startTime);
  endTime.setHours(22, 0, 0, 0); // 10 PM
  return endTime;
};

// Hash password helper
const hashPassword = async (password: string): Promise<string> => {
  return hash(password, 12);
};

async function main() {
  console.log('🚀 Starting seeding...');

  // Clean existing data in correct order to avoid foreign key constraints
  console.log('🧹 Cleaning existing data...');

  try {
    await prisma.attendance.deleteMany({});
    await prisma.class.deleteMany({});
    await prisma.subjectEvent.deleteMany({});
    await prisma.report.deleteMany({});
    await prisma.unenrollRequest.deleteMany({});
    await prisma.subject.deleteMany({});

    // Clear any existing users to avoid unique constraint errors
    await prisma.user.deleteMany({});

    console.log('✅ Successfully cleaned all existing data');
  } catch (error) {
    console.log('⚠️ Some tables might not exist yet, continuing...');
  }

  console.log('👥 Creating users...');

  // 1. Create admin user
  const admin = await prisma.user.create({
    data: {
      name: 'Admin',
      correoInstitucional: 'meerazo7@hotmail.com',
      correoPersonal: 'admin.personal@example.com',
      password: await hashPassword('admin123'),
      document: '10000000',
      role: Role.ADMIN,
      isActive: true,
    },
  });
  console.log(`✅ Created admin user: ${admin.correoInstitucional}`);

  // 2. Create teacher user
  const teacher = await prisma.user.create({
    data: {
      name: 'Docente Ejemplo',
      correoInstitucional: 'elustondo129@gmail.com',
      correoPersonal: 'docente.personal@example.com',
      password: await hashPassword('docente123'),
      document: '20000000',
      codigoDocente: 'DOC-001',
      role: Role.DOCENTE,
      isActive: true,
    },
  });
  console.log(`✅ Created teacher user: ${teacher.correoInstitucional}`);

  // 3. Create students
  const student1 = await prisma.user.create({
    data: {
      name: 'Manuel Erazo',
      correoInstitucional: 'manuel.erazo@estudiante.fup.edu.co',
      correoPersonal: 'manuel.personal@example.com',
      password: await hashPassword('estudiante123'),
      document: '30000001',
      codigoEstudiantil: 'EST-001',
      role: Role.ESTUDIANTE,
      isActive: true,
    },
  });
  console.log(`✅ Created student: ${student1.name}`);

  const student2 = await prisma.user.create({
    data: {
      name: 'Andres Peña',
      correoInstitucional: 'andres.pena@estudiante.fup.edu.co',
      correoPersonal: 'andres.personal@example.com',
      password: await hashPassword('estudiante123'),
      document: '30000002',
      codigoEstudiantil: 'EST-002',
      role: Role.ESTUDIANTE,
      isActive: true,
    },
  });
  console.log(`✅ Created student: ${student2.name}`);

  // 4. Create subjects
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

  const createdSubjects = [];
  const studentIds = [student1.id, student2.id];

  // 5. Create each subject and its classes
  for (const subjectData of subjects) {
    const subject = await prisma.subject.create({
      data: {
        name: subjectData.name,
        code: subjectData.code,
        program: subjectData.program,
        semester: subjectData.semester,
        credits: subjectData.credits,
        teacherId: teacher.id,
        studentIds, // Both students are enrolled in all subjects
      },
    });
    createdSubjects.push(subject);
    console.log(`✅ Created subject: ${subject.name}`);

    // Create 16 classes for this subject
    console.log(`   Creating classes for ${subject.name}...`);
    const classDates = generateClassDates(new Date(), 16);

    for (let i = 0; i < 16; i++) {
      const startTime = classDates[i];
      const endTime = createEndTime(startTime);

      // Create class with start and end times
      await prisma.class.create({
        data: {
          date: startTime,
          startTime: startTime,
          endTime: endTime,
          topic: `Clase ${i + 1}: ${subject.name}`,
          status: ClassStatus.PROGRAMADA,
          subjectId: subject.id,
        },
      });
    }
    console.log(`   ✅ Created 16 classes for ${subject.name} (10:00 AM - 10:00 PM)`);
  }

  console.log('\n🎉 Seeding completed successfully!');
  console.log('================================');
  console.log('Summary:');
  console.log(`👤 Admin: 1 user`);
  console.log(`👨‍🏫 Teachers: 1 user`);
  console.log(`👨‍🎓 Students: 2 users`);
  console.log(`📚 Subjects: 3 subjects`);
  console.log(`📅 Classes: 48 classes total (16 per subject)`);
  console.log(`⏰ Schedule: Monday & Thursday, 10:00 AM - 10:00 PM`);
  console.log('================================');
  console.log('Credentials:');
  console.log('Admin:');
  console.log('  Email: meerazo7@hotmail.com');
  console.log('  Password: admin123');
  console.log('');
  console.log('Teacher:');
  console.log('  Email: elustondo129@gmail.com');
  console.log('  Password: docente123');
  console.log('');
  console.log('Students:');
  console.log('  Email: manuel.erazo@estudiante.fup.edu.co');
  console.log('  Email: andres.pena@estudiante.fup.edu.co');
  console.log('  Password: estudiante123');
  console.log('================================');
}

// Execute the main function
main()
  .catch(e => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
