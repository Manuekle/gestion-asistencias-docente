import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { AttendanceStatus } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'DOCENTE') {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  const teacherId = session.user.id;

  try {
    const now = new Date();

    // Find the currently active class for the teacher
    const liveClass = await db.class.findFirst({
      where: {
        subject: {
          teacherId: teacherId,
        },
        startTime: {
          lte: now,
        },
        endTime: {
          gte: now,
        },
      },
      include: {
        subject: true,
      },
    });

    if (!liveClass) {
      return NextResponse.json({ liveClass: null });
    }

    // Get total number of students enrolled in the subject
    const totalStudents = await db.user.count({
      where: { role: 'ESTUDIANTE' }
    });

    // Get attendance stats for the live class
    const attendanceCounts = await db.attendance.groupBy({
      by: ['status'],
      where: {
        classId: liveClass.id,
      },
      _count: {
        status: true,
      },
    });

    const stats = {
      present: 0,
      absent: 0,
      late: 0,
      justified: 0,
    };

    attendanceCounts.forEach(group => {
      switch (group.status) {
        case AttendanceStatus.PRESENTE:
          stats.present = group._count.status;
          break;
        case AttendanceStatus.AUSENTE:
          stats.absent = group._count.status;
          break;
        case AttendanceStatus.TARDANZA:
          stats.late = group._count.status;
          break;
        case AttendanceStatus.JUSTIFICADO:
          stats.justified = group._count.status;
          break;
        default:
          break;
      }
    });

    return NextResponse.json({
      liveClass: {
        id: liveClass.id,
        topic: liveClass.topic,
        subjectName: liveClass.subject.name,
        startTime: liveClass.startTime!.toISOString(),
        endTime: liveClass.endTime!.toISOString(),
        totalStudents,
        attendanceStats: stats,
      },
    });
  } catch (error) {
    console.error('Error fetching live class data:', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}
