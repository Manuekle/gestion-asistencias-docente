import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { ClassStatus, EventType } from '@prisma/client';
import { format } from 'date-fns';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

type SubjectResponse = {
  id: string;
  name: string;
  code: string;
  teacher: string;
  nextClass: {
    name: string;
    date: string;
    timeUntil: string;
    topic: string | null;
  } | null;
  attendancePercentage: number;
  totalClasses: number;
  attendedClasses: number;
};

type CardsResponse = {
  totalClasses: number;
  attendedClasses: number;
  globalAttendancePercentage: number;
  subjectsAtRisk: number;
  weeklyAttendanceAverage: number;
};

type EventResponse = {
  id: string;
  title: string;
  code: string;
  type: EventType;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  teacher: string;
  subjectName: string;
  description: string;
  isEvent: boolean;
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const now = new Date();

    // Variables for general cards statistics
    let globalTotalClasses = 0;
    let globalAttendedClasses = 0;
    let subjectsAtRisk = 0;

    // Calculate date range for weekly average (last 4 weeks)
    const fourWeeksAgo = new Date(now);
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    let weeklyTotalClasses = 0;
    let weeklyAttendedClasses = 0;

    // Get all subjects for the student
    const subjects = await db.subject.findMany({
      where: {
        studentIds: {
          has: session.user.id,
        },
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Process subjects
    const processedSubjects: SubjectResponse[] = [];
    for (const subject of subjects) {
      console.log(`\n[DEBUG] Processing Subject: ${subject.name} (${subject.id})`);

      // Get ALL classes for this subject (not just past ones)
      const allSubjectClasses = await db.class.findMany({
        where: {
          subjectId: subject.id,
          status: 'PROGRAMADA', // Only include PROGRAMADA classes
        },
        orderBy: {
          date: 'asc',
        },
      });

      console.log(
        `[DEBUG] Total classes in subject (all, not cancelled): ${allSubjectClasses.length}`
      );
      allSubjectClasses.forEach((cls, idx) => {
        console.log(
          `[DEBUG] Class ${idx + 1}: ${cls.id} | Date: ${cls.date} | Status: ${cls.status} | Past? ${cls.date <= now}`
        );
      });

      // Get ALL attendances for this student in this subject
      const allAttendances = await db.attendance.findMany({
        where: {
          studentId: session.user.id,
          class: {
            subjectId: subject.id,
            status: { not: ClassStatus.CANCELADA },
          },
        },
        include: {
          class: {
            select: {
              id: true,
              date: true,
              status: true,
            },
          },
        },
      });

      console.log(`[DEBUG] All attendances for student in this subject: ${allAttendances.length}`);
      allAttendances.forEach((att, idx) => {
        console.log(
          `[DEBUG] Attendance ${idx + 1}: ClassId: ${att.classId} | Status: ${att.status} | Class Date: ${att.class.date} | Class Status: ${att.class.status}`
        );
      });

      // Count total classes for this subject
      const totalClasses = allSubjectClasses.length;

      // Count attended classes (PRESENTE + TARDANZA) from attendance records
      const attendedClasses = allAttendances.filter(
        att => att.status === 'PRESENTE' || att.status === 'TARDANZA'
      ).length;

      // Calcular porcentaje de asistencia antes de usarlo
      let attendancePercentage = 0;
      if (totalClasses > 0) {
        attendancePercentage = Math.round((attendedClasses / totalClasses) * 100);
      }

      console.log(
        `[DEBUG] FINAL COUNTS - Total classes: ${totalClasses}, Attended: ${attendedClasses}`
      );

      // Add to global counters
      globalTotalClasses += totalClasses;
      globalAttendedClasses += attendedClasses;

      // Check if subject is at risk (less than 70% attendance)
      if (attendancePercentage < 70 && totalClasses > 0) {
        subjectsAtRisk++;
        console.log(`[DEBUG] Subject at risk: ${subject.name} (${attendancePercentage}%)`);
      }

      // Calculate weekly attendance for this subject (last 4 weeks)
      const weeklyClasses = await db.class.findMany({
        where: {
          subjectId: subject.id,
          date: {
            gte: fourWeeksAgo,
            lte: now,
          },
          status: 'PROGRAMADA', // Only include PROGRAMADA classes
        },
      });

      const weeklyAttendances = await db.attendance.findMany({
        where: {
          studentId: session.user.id,
          class: {
            subjectId: subject.id,
            date: {
              gte: fourWeeksAgo,
              lte: now,
            },
            status: 'PROGRAMADA',
          },
        },
      });

      const weeklySubjectAttended = weeklyAttendances.filter(
        att => att.status === 'PRESENTE' || att.status === 'TARDANZA'
      ).length;

      weeklyTotalClasses += weeklyClasses.length;
      weeklyAttendedClasses += weeklySubjectAttended;

      console.log(
        `[DEBUG] Weekly stats for ${subject.name}: ${weeklySubjectAttended}/${weeklyClasses.length} classes`
      );

      // Find next class
      const nextClass = await db.class.findFirst({
        where: {
          subjectId: subject.id,
          date: { gte: now },
          status: { not: ClassStatus.CANCELADA },
        },
        orderBy: { date: 'asc' },
      });

      // Calculate time until next class
      let timeUntilNextClass = '';
      if (nextClass) {
        const timeDiff = new Date(nextClass.date).getTime() - now.getTime();
        const hoursDiff = Math.floor(timeDiff / (1000 * 60 * 60));

        if (hoursDiff < 1) {
          const minutesDiff = Math.floor(timeDiff / (1000 * 60));
          timeUntilNextClass = `En ${minutesDiff} minutos`;
        } else if (hoursDiff < 24) {
          timeUntilNextClass = `En ${hoursDiff} horas`;
        } else {
          const daysDiff = Math.floor(hoursDiff / 24);
          timeUntilNextClass = `En ${daysDiff} días`;
        }
      }

      // Add the processed subject to the results
      processedSubjects.push({
        id: subject.id,
        name: subject.name,
        code: subject.code,
        teacher: subject.teacher?.name || 'Docente no asignado',
        nextClass: nextClass
          ? {
              name: `Clase de ${subject.name}`,
              date: nextClass.date.toISOString().split('T')[0],
              timeUntil: timeUntilNextClass,
              topic: nextClass.topic || null,
            }
          : null,
        attendancePercentage: attendancePercentage,
        totalClasses,
        attendedClasses,
      });
    }

    // Process events
    const upcomingEvents: EventResponse[] = [];
    for (const subject of subjects) {
      // Get events for this subject
      const events = await db.subjectEvent.findMany({
        where: {
          subjectId: subject.id,
          date: {
            gte: now,
          },
        },
        include: {
          subject: {
            select: {
              name: true,
              code: true,
              teacher: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          date: 'asc',
        },
        take: 10, // Limit to 10 upcoming events per subject
      });

      for (const event of events) {
        upcomingEvents.push({
          id: event.id,
          title: event.title || 'Evento sin título',
          code: event.subject.code,
          type: event.type,
          date: event.date.toISOString().split('T')[0],
          startTime: format(event.date, 'HH:mm'),
          endTime: event.date
            ? format(new Date(event.date.getTime() + 60 * 60 * 1000), 'HH:mm')
            : '23:59',
          location: 'No especificada',
          teacher: event.subject.teacher?.name || 'Docente no asignado',
          subjectName: event.subject.name,
          description: event.description || 'Sin descripción',
          isEvent: true,
        });
      }
    }

    // Sort events by date
    upcomingEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate global attendance percentage
    const globalAttendancePercentage =
      globalTotalClasses > 0 ? Math.round((globalAttendedClasses / globalTotalClasses) * 100) : 0;

    // Calculate weekly attendance average
    const weeklyAttendanceAverage =
      weeklyTotalClasses > 0 ? Math.round((weeklyAttendedClasses / weeklyTotalClasses) * 100) : 0;

    // Create cards object with general statistics
    const cards: CardsResponse = {
      totalClasses: globalTotalClasses,
      attendedClasses: globalAttendedClasses,
      globalAttendancePercentage: globalAttendancePercentage,
      subjectsAtRisk: subjectsAtRisk,
      weeklyAttendanceAverage: weeklyAttendanceAverage,
    };

    console.log(
      `[DEBUG] GLOBAL STATS - Total: ${globalTotalClasses}, Attended: ${globalAttendedClasses}, Percentage: ${globalAttendancePercentage}%`
    );
    console.log(`[DEBUG] RISK STATS - Subjects at risk: ${subjectsAtRisk}`);
    console.log(
      `[DEBUG] WEEKLY STATS - Weekly average: ${weeklyAttendanceAverage}% (${weeklyAttendedClasses}/${weeklyTotalClasses})`
    );

    return NextResponse.json({
      cards,
      subjects: processedSubjects,
      upcomingItems: upcomingEvents,
    });
  } catch (error: unknown) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json({ error: 'Error al cargar los datos del dashboard' }, { status: 500 });
  }
}
