import {
  Body,
  Container,
  Font,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from '@react-email/components';

interface UnenrollStatusEmailProps {
  studentName: string;
  subjectName: string;
  isApproved: boolean;
  reason?: string;
  requestDate: string;
  decisionDate: string;
  supportEmail: string;
}

const UnenrollStatusEmail = ({
  studentName,
  subjectName,
  isApproved,
  reason = '',
  requestDate,
  decisionDate,
  supportEmail,
}: UnenrollStatusEmailProps) => {
  const previewText = `Solicitud de desmatriculación ${isApproved ? 'aprobada' : 'rechazada'}`;
  const formattedRequestDate = new Date(requestDate).toLocaleDateString('es-CO');
  const formattedDecisionDate = new Date(decisionDate).toLocaleDateString('es-CO');

  return (
    <Html lang="es" dir="ltr">
      <Tailwind>
        <Head>
          <Font
            fontFamily="Geist"
            fallbackFontFamily="Helvetica"
            webFont={{
              url: 'https://cdn.jsdelivr.net/npm/@vercel/style-guide@6.0.0/fonts/GeistVF.woff2',
              format: 'woff2',
            }}
            fontWeight={400}
            fontStyle="normal"
          />
        </Head>
        <Preview>{previewText}</Preview>
        <Body className="bg-gray-50 font-sans">
          <Container className="mx-auto max-w-2xl p-6 bg-white rounded-lg shadow-sm mt-8">
            <Section className="text-center">
              <Heading as="h1" className="text-2xl font-semibold text-gray-900 mb-2">
                {isApproved ? '✅ Solicitud Aprobada' : '❌ Solicitud Rechazada'}
              </Heading>
              <Text className="text-gray-600 mb-6">
                Se ha {isApproved ? 'aprobado' : 'rechazado'} tu solicitud de desmatriculación.
              </Text>
            </Section>

            <Section className="mb-6">
              <Text className="text-lg font-semibold text-gray-800">Detalles de la solicitud:</Text>
              <Hr className="my-4" />
              <Text className="text-gray-700">
                <strong>Estudiante:</strong> {studentName}
              </Text>
              <Text className="text-gray-700">
                <strong>Asignatura:</strong> {subjectName}
              </Text>
              <Text className="text-gray-700">
                <strong>Fecha de la solicitud:</strong> {formattedRequestDate}
              </Text>
              <Text className="text-gray-700">
                <strong>Fecha de la decisión:</strong> {formattedDecisionDate}
              </Text>
              {!isApproved && reason && (
                <Text className="mt-4 text-gray-700">
                  <strong>Motivo del rechazo:</strong>
                  <br />
                  <span className="italic">"{reason}"</span>
                </Text>
              )}
            </Section>

            <Hr className="my-6" />

            <Section>
              <Text className="text-gray-600">
                {isApproved
                  ? `El estudiante ha sido desmatriculado exitosamente de la asignatura ${subjectName}.`
                  : 'El estudiante permanecerá matriculado en la asignatura.'}
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

export default UnenrollStatusEmail;
