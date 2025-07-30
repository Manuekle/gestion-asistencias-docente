import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/prisma';
import { AttendanceStatus } from '@prisma/client';

import { ReporteAsistenciaResponseSchema } from './schema';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'No autorizado', data: null }, { status: 401 });
  }
  const studentId = session.user.id;
  try {
    const attendances = await db.attendance.findMany({
      where: { studentId },
      include: {
        class: {
          include: {
            subject: true,
          },
        },
      },
      orderBy: {
        class: { date: 'asc' },
      },
    });
    if (!attendances.length) {
      const empty = {
        summary: {
          totalClasses: 0,
          presentCount: 0,
          absentCount: 0,
          lateCount: 0,
          justifiedCount: 0,
          attendancePercentage: 100,
        },
        bySubject: [],
      };
      const validated = ReporteAsistenciaResponseSchema.safeParse(empty);
      if (!validated.success) {
        return NextResponse.json(
          {
            message: 'Error de validación en la respuesta',
            errors: validated.error.errors,
            data: null,
          },
          { status: 500 }
        );
      }
      return NextResponse.json({
        data: validated.data,
        message: 'Sin registros de asistencia',
      });
    }
    // ...lógica de resumen y agrupación igual...
    const totalClasses = attendances.length;
    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;
    let justifiedCount = 0;
    attendances.forEach((att: (typeof attendances)[0]) => {
      switch (att.status) {
        case AttendanceStatus.PRESENTE:
          presentCount++;
          break;
        case AttendanceStatus.AUSENTE:
          absentCount++;
          break;
        case AttendanceStatus.TARDANZA:
          lateCount++;
          break;
        case AttendanceStatus.JUSTIFICADO:
          justifiedCount++;
          break;
      }
    });
    const attendedCount = presentCount + lateCount + justifiedCount;
    const attendancePercentage = totalClasses > 0 ? (attendedCount / totalClasses) * 100 : 100;
    const summary = {
      totalClasses,
      presentCount,
      absentCount,
      lateCount,
      justifiedCount,
      attendancePercentage: parseFloat(attendancePercentage.toFixed(2)),
    };
    // Agrupar por materia
    type SubjectAccumulator = {
      [key: string]: {
        subjectId: string;
        subjectName: string;
        subjectCode: string;
        attendances: {
          classId: string;
          classDate: Date;
          classTopic: string | null;
          status: AttendanceStatus;
        }[];
      };
    };
    const bySubject = attendances.reduce(
      (acc: SubjectAccumulator, att: (typeof attendances)[0]) => {
        const subjectId = att.class.subject.id;
        if (!acc[subjectId]) {
          acc[subjectId] = {
            subjectId: subjectId,
            subjectName: att.class.subject.name,
            subjectCode: att.class.subject.code,
            attendances: [],
          };
        }
        acc[subjectId].attendances.push({
          classId: att.classId,
          classDate: att.class.date,
          classTopic: att.class.topic,
          status: att.status,
        });
        return acc;
      },
      {} as SubjectAccumulator
    );
    type SubjectAttendanceData = {
      subjectId: string;
      subjectName: string;
      subjectCode: string;
      attendances: {
        classId: string;
        classDate: Date;
        classTopic: string | null;
        status: AttendanceStatus;
      }[];
    };

    const bySubjectArray = Object.values(bySubject).map((subj: SubjectAttendanceData) => {
      const subjectTotal = subj.attendances.length;
      let subjectPresent = 0;
      let subjectAbsent = 0;
      let subjectLate = 0;
      let subjectJustified = 0;
      subj.attendances.forEach((att: { status: AttendanceStatus }) => {
        switch (att.status) {
          case AttendanceStatus.PRESENTE:
            subjectPresent++;
            break;
          case AttendanceStatus.AUSENTE:
            subjectAbsent++;
            break;
          case AttendanceStatus.TARDANZA:
            subjectLate++;
            break;
          case AttendanceStatus.JUSTIFICADO:
            subjectJustified++;
            break;
        }
      });
      const subjectAttended = subjectPresent + subjectLate + subjectJustified;
      const subjectPercentage = subjectTotal > 0 ? (subjectAttended / subjectTotal) * 100 : 100;
      return {
        ...subj,
        summary: {
          totalClasses: subjectTotal,
          presentCount: subjectPresent,
          absentCount: subjectAbsent,
          lateCount: subjectLate,
          justifiedCount: subjectJustified,
          attendancePercentage: parseFloat(subjectPercentage.toFixed(2)),
        },
      };
    });
    const response = { summary, bySubject: bySubjectArray };
    const validated = ReporteAsistenciaResponseSchema.safeParse(response);
    if (!validated.success) {
      return NextResponse.json(
        {
          message: 'Error de validación en la respuesta',
          errors: validated.error.errors,
          data: null,
        },
        { status: 500 }
      );
    }
    return NextResponse.json({
      data: validated.data,
      message: 'Reporte de asistencia generado correctamente',
    });
  } catch (error) {
    console.error('[REPORTES_ASISTENCIA_GET]', error);
    return NextResponse.json(
      { message: 'Error interno del servidor', data: null },
      { status: 500 }
    );
  }
}
