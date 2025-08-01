import {
  Body,
  Button,
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

interface ResetPasswordEmailProps {
  resetUrl: string;
  userEmail: string;
  supportEmail: string;
}

const ResetPasswordEmail = ({ resetUrl, userEmail, supportEmail }: ResetPasswordEmailProps) => {
  const previewText = 'Restablece tu contraseña de Sistema de Asistencias FUP';

  return (
    <Html>
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
                Restablece tu contraseña
              </Heading>
              <Text className="text-gray-600 mb-6">
                Hola {userEmail}, hemos recibido una solicitud para restablecer la contraseña de tu
                cuenta.
              </Text>

              <Button
                href={resetUrl}
                className="bg-black text-white font-normal py-2 px-6 rounded-md hover:bg-black/80 transition-colors"
              >
                Restablecer contraseña
              </Button>

              <Text className="text-gray-500 text-sm mt-6">
                O copia y pega esta URL en tu navegador:
              </Text>
              <Text className="text-black text-sm break-all mb-6">
                {resetUrl.replace('http://', '').replace('https://', '')}
              </Text>

              <Hr className="border-gray-200 my-6" />

              <Text className="text-gray-500 text-sm">
                Si no solicitaste este restablecimiento, puedes ignorar este correo de manera
                segura.
              </Text>

              <Text className="text-gray-500 text-xs mt-8">
                Si tienes alguna pregunta, contáctanos en{' '}
                <a href={`mailto:${supportEmail}`} className="text-black hover:underline">
                  {supportEmail}
                </a>
              </Text>

              <Text className="text-gray-400 text-xs mt-4">
                © {new Date().getFullYear()} Sistema de Asistencias FUP. Todos los derechos
                reservados.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default ResetPasswordEmail;
