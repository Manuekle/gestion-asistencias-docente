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

interface ClassCancellationEmailProps {
  studentName?: string; // Optional, in case you want to personalize
  subjectName: string;
  teacherName: string;
  classDate: string;
  reason: string;
  supportEmail: string;
}

const ClassCancellationEmail = ({
  subjectName,
  teacherName,
  classDate,
  reason,
  supportEmail,
}: ClassCancellationEmailProps) => {
  const previewText = `Cancelación de clase: ${subjectName}`;

  return (
    <Html>
      <Head>
        <title>Cancelación de Clase - Sistema de Asistencias FUP</title>
      </Head>
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-gray-50 font-sans">
          <Container className="mx-auto max-w-2xl p-6 bg-white rounded-lg shadow-sm mt-8">
            <Section className="text-center">
              <Heading as="h1" className="text-2xl font-semibold text-gray-900 mb-2">
                Notificación de Cancelación de Clase
              </Heading>
              <Text className="text-gray-600 mb-6">
                Hola, te informamos que la siguiente clase ha sido cancelada.
              </Text>
            </Section>

            <Section className="mb-6">
              <Text className="text-lg font-semibold text-gray-800">Detalles de la clase:</Text>
              <Hr className="my-4" />
              <Text className="text-gray-700">
                <strong>Asignatura:</strong> {subjectName}
              </Text>
              <Text className="text-gray-700">
                <strong>Docente:</strong> {teacherName}
              </Text>
              <Text className="text-gray-700">
                <strong>Fecha:</strong>{' '}
                {new Date(classDate).toLocaleDateString('es-CO', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </Section>

            <Section className="mb-6">
              <Text className="text-lg font-semibold text-gray-800">Motivo de la cancelación:</Text>
              <Hr className="my-4" />
              <Text className="text-gray-700 italic">"{reason}"</Text>
            </Section>

            <Hr className="my-6" />

            <Section>
              <Text className="text-gray-600">
                Lamentamos cualquier inconveniente que esto pueda causar. Si tienes alguna pregunta,
                no dudes en contactar a tu docente o al soporte académico.
              </Text>
              <Text className="text-sm text-gray-500 mt-4">
                Para soporte, puedes escribir a:{' '}
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

export default ClassCancellationEmail;
