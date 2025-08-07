import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

interface Class {
  id: string;
  date: Date;
  startTime?: Date | null;
  topic: string | null;
  status: string;
}

interface Subject {
  id: string;
  name: string;
  code: string;
  classes: Class[];
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'DOCENTE') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener las asignaturas del docente
    const subjects: Subject[] = await db.subject.findMany({
      where: {
        teacherId: session.user.id,
      },
      include: {
        classes: {
          select: {
            id: true,
            date: true,
            startTime: true,
            topic: true,
            status: true,
          },
          orderBy: {
            date: 'asc',
          },
        },
      },
    });

    // Procesar los datos para el dashboard
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(now.getDate() + 7);

    const processedSubjects = subjects.map((subject: Subject) => {
      const totalClasses = subject.classes.length;
      const completedClasses = subject.classes.filter(
        cls => cls.status === 'REALIZADA' || cls.status === 'CANCELADA'
      ).length;

      const upcomingClass = subject.classes.find(
        cls => cls.status === 'PROGRAMADA' && new Date(cls.date) >= now
      );

      return {
        id: subject.id,
        name: subject.name,
        code: subject.code,
        totalClasses,
        completedClasses,
        nextClass: upcomingClass
          ? {
              id: upcomingClass.id,
              date: upcomingClass.date.toISOString(),
              startTime: upcomingClass.startTime?.toISOString() || null,
              topic: upcomingClass.topic || 'Sin tema definido',
            }
          : undefined,
      };
    });

    // Obtener todas las próximas clases (próximos 7 días)
    const allUpcomingClasses = subjects
      .flatMap((subject: Subject) =>
        subject.classes
          .filter((cls: Class) => {
            const classDate = new Date(cls.date);
            return classDate >= now && classDate <= sevenDaysFromNow;
          })
          .map((cls: Class) => ({
            id: cls.id,
            subjectId: subject.id,
            subjectName: subject.name,
            subjectCode: subject.code,
            date: cls.date.toISOString(),
            startTime: cls.startTime?.toISOString() || null,
            topic: cls.topic || 'Sin tema definido',
          }))
      )
      .sort(
        (a: { date: string }, b: { date: string }) =>
          new Date(a.date).getTime() - new Date(b.date).getTime()
      );

    return NextResponse.json({
      subjects: processedSubjects,
      upcomingClasses: allUpcomingClasses,
    });
  } catch (error) {
    console.error('Error en la API del dashboard del docente:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
