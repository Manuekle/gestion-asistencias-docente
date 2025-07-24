'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Loading } from '@/components/ui/loading';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useEffect, useState } from 'react';

interface Subject {
  id: string;
  name: string;
}

interface Student {
  id: string;
  name: string | null;
  email: string | null;
  isEnrolled: boolean;
}

export default function ManageEnrollmentsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Cargar la lista de asignaturas al montar el componente
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await fetch('/api/admin/asignaturas');
        if (!response.ok) throw new Error('No se pudieron cargar las asignaturas.');
        const data = await response.json();
        setSubjects(data);
      } catch (err: any) {
        setFeedback({ type: 'error', message: err.message });
      }
    };
    fetchSubjects();
  }, []);

  // Cargar los estudiantes cuando se selecciona una asignatura
  useEffect(() => {
    if (!selectedSubject) {
      setStudents([]);
      return;
    }

    const fetchStudentsForSubject = async () => {
      setIsLoading(true);
      setFeedback(null);
      try {
        const response = await fetch(`/api/admin/matriculas?subjectId=${selectedSubject}`);
        if (!response.ok)
          throw new Error('No se pudieron cargar los estudiantes para esta asignatura.');
        const data = await response.json();
        setStudents(data);
      } catch (err: any) {
        setFeedback({ type: 'error', message: err.message });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudentsForSubject();
  }, [selectedSubject]);

  const handleStudentCheck = (studentId: string, isChecked: boolean) => {
    setStudents(currentStudents =>
      currentStudents.map(student =>
        student.id === studentId ? { ...student, isEnrolled: isChecked } : student
      )
    );
  };

  const handleSaveChanges = async () => {
    if (!selectedSubject) return;

    setIsSubmitting(true);
    setFeedback(null);
    try {
      const enrolledStudentIds = students.filter(s => s.isEnrolled).map(s => s.id);
      const response = await fetch('/api/admin/matriculas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId: selectedSubject,
          studentIds: enrolledStudentIds,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'No se pudieron guardar los cambios.');

      setFeedback({
        type: 'success',
        message: '¡Matrículas actualizadas con éxito!',
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestionar Matrículas</CardTitle>
        <CardDescription>
          Seleccione una asignatura para ver y modificar los estudiantes matriculados.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {feedback && (
          <Alert
            className={`mb-4 ${feedback.type === 'error' ? 'border-red-500 text-red-700' : 'border-green-500 text-green-700'}`}
          >
            <AlertTitle>{feedback.type === 'success' ? 'Éxito' : 'Error'}</AlertTitle>
            <AlertDescription>{feedback.message}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center gap-4">
          <Select onValueChange={setSelectedSubject} value={selectedSubject}>
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Seleccione una asignatura..." />
            </SelectTrigger>
            <SelectContent>
              {subjects.map(subject => (
                <SelectItem key={subject.id} value={subject.id}>
                  {subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading && <Loading />}

        {!isLoading && selectedSubject && students.length > 0 && (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Matric.</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map(student => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <Checkbox
                        checked={student.isEnrolled}
                        onCheckedChange={(checked: boolean) =>
                          handleStudentCheck(student.id, checked)
                        }
                      />
                    </TableCell>
                    <TableCell>{student.name}</TableCell>
                    <TableCell>{student.email}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex justify-end">
              <Button onClick={handleSaveChanges} disabled={isSubmitting}>
                {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </div>
        )}

        {!isLoading && selectedSubject && students.length === 0 && (
          <p>No se encontraron estudiantes en el sistema.</p>
        )}
      </CardContent>
    </Card>
  );
}
