import {
  Body,
  Button,
  Container,
  Font,
  Head,
  Heading,
  Hr,
  Html,
  Link,
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

const WelcomeUserEmail = ({
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

        <Body className="bg-slate-50 font-sans py-[40px]">
          <Container className="mx-auto max-w-[580px] bg-white border border-slate-200 rounded-[12px] overflow-hidden">
            {/* Header */}
            <Section className="bg-black px-[32px] py-[24px]">
              <Heading className="text-[20px] font-semibold text-white m-0 leading-[28px]">
                ¡Bienvenido/a!
              </Heading>
              <Text className="text-slate-300 text-[14px] m-0 mt-[4px] leading-[20px]">
                Tu cuenta ha sido creada exitosamente
              </Text>
            </Section>

            {/* Content */}
            <Section className="px-[32px] py-[32px]">
              {/* Welcome Message */}
              <Section className="mb-[32px] text-center">
                <div className="inline-flex items-center justify-center w-[64px] h-[64px] rounded-full bg-green-100 mb-[16px]">
                  <Text className="text-[32px] text-green-600 m-0">👋</Text>
                </div>
                <Heading className="text-[24px] font-semibold text-black m-0 mb-[8px] leading-[32px]">
                  Hola, {name}
                </Heading>
                <Text className="text-slate-600 text-[12px] leading-[24px] m-0">
                  Un administrador ha creado una cuenta para ti en la plataforma de gestión de
                  asistencias.
                </Text>
              </Section>

              {/* Credentials */}
              <Section className="mb-[32px]">
                <Text className="text-[12px] font-medium text-slate-500 tracking-normal m-0 mb-[12px]">
                  CREDENCIALES DE ACCESO
                </Text>
                <div className="bg-slate-50 border border-slate-200 rounded-[8px] px-[16px] py-[16px] space-y-[12px]">
                  <div>
                    <Text className="text-[12px] font-medium text-slate-500 tracking-normal m-0 mb-[4px]">
                      Correo electrónico
                    </Text>
                    <Text className="text-[10px] text-black m-0 leading-[20px]">{email}</Text>
                  </div>

                  <div>
                    <Text className="text-[12px] font-medium text-slate-500 tracking-normal m-0 mb-[4px]">
                      Contraseña temporal
                    </Text>
                    <Text className="text-[10px] text-black m-0 leading-[20px]">{password}</Text>
                  </div>
                </div>
              </Section>

              {/* Security Notice */}
              <Section className="mb-[32px]">
                <div className="bg-amber-50 border border-amber-200 rounded-[8px] px-[16px] py-[12px]">
                  <Text className="text-[14px] text-amber-800 m-0 leading-[20px]">
                    <strong>Importante:</strong> Por seguridad, te recomendamos cambiar tu
                    contraseña después de iniciar sesión por primera vez.
                  </Text>
                </div>
              </Section>

              {/* CTA Button */}
              <Section className="mb-[32px] text-center">
                <Button
                  href={loginUrl}
                  className="bg-black text-white text-[14px] font-medium px-[24px] py-[12px] rounded-[8px] box-border inline-block text-center no-underline leading-[20px]"
                >
                  Iniciar sesión ahora
                </Button>
              </Section>

              <Hr className="border-slate-200 my-[24px]" />

              {/* Next Steps */}
              <Section className="mb-[24px]">
                <Text className="text-[12px] font-medium text-slate-500 tracking-normal m-0 mb-[12px]">
                  PRÓXIMOS PASOS
                </Text>
                <div className="space-y-[8px]">
                  <Text className="text-[14px] text-slate-700 m-0 leading-[20px]">
                    • Inicia sesión con las credenciales proporcionadas
                  </Text>
                  <Text className="text-[14px] text-slate-700 m-0 leading-[20px]">
                    • Cambia tu contraseña por una más segura
                  </Text>
                  <Text className="text-[14px] text-slate-700 m-0 leading-[20px]">
                    • Explora las funcionalidades de la plataforma
                  </Text>
                </div>
              </Section>

              <Text className="text-[12px] text-slate-500 m-0">
                Si no reconoces esta actividad o necesitas ayuda, contáctanos en{' '}
                <Link href={`mailto:${supportEmail}`} className="text-slate-700 underline">
                  {supportEmail}
                </Link>
              </Text>
            </Section>

            {/* Footer */}
            <Section className="bg-slate-50 px-[32px] py-[16px] border-t border-slate-200">
              <Text className="text-[11px] text-slate-400 text-center m-0">
                Este es un correo automático, por favor no respondas a este mensaje.
              </Text>
              <Text className="text-[11px] text-slate-400 text-center m-0 mt-[4px]">
                © {new Date().getFullYear()} Sistema de Gestión de Asistencias. Todos los derechos
                reservados.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default WelcomeUserEmail;
