import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import { Tailwind } from '@react-email/tailwind';

interface UnenrollRequestEmailProps {
  studentName: string;
  studentEmail: string;
  subjectName: string;
  reason: string;
  requestDate: string;
  supportEmail: string;
}

const UnenrollRequestEmail = ({
  studentName,
  studentEmail,
  subjectName,
  reason,
  requestDate,
  supportEmail,
}: UnenrollRequestEmailProps) => {
  const previewText = `Nueva solicitud de desmatriculación - ${subjectName}`;

  return (
    <Html>
      <Head>
        <title>Solicitud de Desmatriculación - Sistema de Asistencias FUP</title>
      </Head>
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-gray-50 font-sans">
          <Container className="mx-auto max-w-2xl p-6 bg-white rounded-lg shadow-sm mt-8">
            <Section className="text-center">
              <Heading as="h1" className="text-2xl font-semibold text-gray-900 mb-2">
                Nueva Solicitud de Desmatriculación
              </Heading>
              <Text className="text-gray-600 mb-6">
                Se ha recibido una nueva solicitud de desmatriculación que requiere su revisión.
              </Text>
            </Section>

            <Section className="mb-6">
              <Text className="text-lg font-semibold text-gray-800">Detalles de la solicitud:</Text>
              <Hr className="my-4" />
              <Text className="text-gray-700">
                <strong>Estudiante:</strong> {studentName}
              </Text>
              <Text className="text-gray-700">
                <strong>Correo:</strong> {studentEmail}
              </Text>
              <Text className="text-gray-700">
                <strong>Asignatura:</strong> {subjectName}
              </Text>
              <Text className="text-gray-700">
                <strong>Fecha de la solicitud:</strong>{' '}
                {new Date(requestDate).toLocaleDateString('es-CO', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </Section>

            <Section className="mb-6">
              <Text className="text-lg font-semibold text-gray-800">Motivo de la solicitud:</Text>
              <Hr className="my-4" />
              <Text className="text-gray-700 italic">"{reason}"</Text>
            </Section>

            <Hr className="my-6" />

            <Section>
              <Text className="text-gray-600">
                Por favor, ingrese al sistema para revisar y gestionar esta solicitud de
                desmatriculación.
              </Text>
              <Text className="text-sm text-gray-500 mt-4">
                Para cualquier consulta, puede escribir a:{' '}
                <a href={`mailto:${supportEmail}`} className="text-blue-600">
                  {supportEmail}
                </a>
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default UnenrollRequestEmail;
