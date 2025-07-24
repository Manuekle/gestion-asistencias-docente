import React from 'react';

interface ReportData {
  studentCount: number;
  teacherCount: number;
  attendanceRate: number;
  bestSubject: { name: string; rate: number };
  worstSubject: { name: string; rate: number };
}

interface SummaryReportTemplateProps {
  data: ReportData;
}

// Estilos en línea para asegurar la compatibilidad con la generación de PDF
const styles = {
  page: {
    fontFamily: 'Helvetica, Arial, sans-serif',
    padding: '40px',
    color: '#333',
  },
  header: {
    borderBottom: '2px solid #eee',
    paddingBottom: '20px',
    marginBottom: '40px',
    textAlign: 'center' as const,
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold' as const,
    color: '#1a202c',
  },
  subtitle: {
    fontSize: '16px',
    color: '#718096',
  },
  section: {
    marginBottom: '40px',
  },
  sectionTitle: {
    fontSize: '22px',
    fontWeight: 'bold' as const,
    borderBottom: '1px solid #ddd',
    paddingBottom: '10px',
    marginBottom: '20px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '20px',
    marginBottom: '20px',
  },
  statBox: {
    backgroundColor: '#f7fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '20px',
    textAlign: 'center' as const,
  },
  statValue: {
    fontSize: '24px',
    fontWeight: 'bold' as const,
  },
  statLabel: {
    fontSize: '14px',
    color: '#a0aec0',
  },
  footer: {
    marginTop: '40px',
    paddingTop: '20px',
    borderTop: '1px solid #eee',
    textAlign: 'center' as const,
    fontSize: '12px',
    color: '#a0aec0',
  },
};

export const SummaryReportTemplate: React.FC<SummaryReportTemplateProps> = ({ data }) => {
  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Reporte de Resumen del Sistema</h1>
        <p style={styles.subtitle}>Generado el {new Date().toLocaleDateString('es-ES')}</p>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Estadísticas Generales</h2>
        <div style={styles.grid}>
          <div style={styles.statBox}>
            <div style={styles.statValue}>{data.studentCount}</div>
            <div style={styles.statLabel}>Estudiantes</div>
          </div>
          <div style={styles.statBox}>
            <div style={styles.statValue}>{data.teacherCount}</div>
            <div style={styles.statLabel}>Docentes</div>
          </div>
          <div style={styles.statBox}>
            <div style={styles.statValue}>{`${(data.attendanceRate * 100).toFixed(1)}%`}</div>
            <div style={styles.statLabel}>Asistencia General</div>
          </div>
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Rendimiento por Asignatura</h2>
        <div style={styles.grid}>
          <div style={styles.statBox}>
            <div style={styles.statValue}>{data.bestSubject.name}</div>
            <div style={styles.statLabel}>
              Mejor Asistencia ({(data.bestSubject.rate * 100).toFixed(1)}%)
            </div>
          </div>
          <div style={styles.statBox}>
            <div style={styles.statValue}>{data.worstSubject.name}</div>
            <div style={styles.statLabel}>
              Peor Asistencia ({(data.worstSubject.rate * 100).toFixed(1)}%)
            </div>
          </div>
        </div>
      </div>

      <div style={styles.footer}>
        <p>Sistema de Gestión de Asistencias - FUP</p>
      </div>
    </div>
  );
};
