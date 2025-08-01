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

interface WelcomeUserEmailProps {
  name: string;
  email: string;
  password: string;
  supportEmail: string;
  loginUrl: string;
}

export const WelcomeUserEmail = ({
  name,
  email,
  password,
  supportEmail,
  loginUrl,
}: WelcomeUserEmailProps) => {
  const previewText = 'Bienvenido a la Plataforma de Gestión de Asistencias';

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
                ¡Bienvenido/a, {name}!
              </Heading>
              <Text className="text-gray-600 mb-6">
                Un administrador ha creado una cuenta para ti en la plataforma de gestión de
                asistencias.
              </Text>
            </Section>

            <Section className="mb-6">
              <Text className="text-gray-700 mb-4">
                A continuación, encontrarás tus credenciales de acceso. Por seguridad, te
                recomendamos cambiar tu contraseña después de iniciar sesión por primera vez.
              </Text>

              <div className="bg-gray-50 p-4 rounded-md mb-4">
                <Text className="text-gray-800">
                  <strong>Correo:</strong> {email}
                </Text>
                <Text className="text-gray-800">
                  <strong>Contraseña temporal:</strong> {password}
                </Text>
              </div>

              <Button
                href={loginUrl}
                className="bg-black text-white font-normal py-2 px-6 rounded-md hover:bg-black/80 transition-colors text-center"
              >
                Iniciar sesión
              </Button>
            </Section>

            <Hr className="border-gray-200 my-6" />

            <Section className="text-center text-sm text-gray-500">
              <Text className="mb-2">
                Si no reconoces esta actividad o necesitas ayuda, por favor contáctanos en{' '}
                <a href={`mailto:${supportEmail}`} className="text-blue-600 hover:underline">
                  {supportEmail}
                </a>
                .
              </Text>
              <Text>Este es un correo automático, por favor no respondas a este mensaje.</Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default WelcomeUserEmail;
