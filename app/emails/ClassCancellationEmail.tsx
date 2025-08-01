import {
  Body,
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

interface ClassCancellationEmailProps {
  studentName?: string;
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
                Clase Cancelada
              </Heading>
              <Text className="text-slate-300 text-[14px] m-0 mt-[4px] leading-[20px]">
                Notificación importante sobre tu clase programada
              </Text>
            </Section>

            {/* Content */}
            <Section className="px-[32px] py-[32px]">
              <Text className="text-slate-600 text-[12px] leading-[24px] m-0 mb-[24px]">
                Hola, te informamos que la siguiente clase ha sido cancelada:
              </Text>

              {/* Class Details Card */}
              <Section className="mb-[24px]">
                <div className="space-y-[12px]">
                  <div>
                    <Text className="text-[12px] font-medium text-slate-500 tracking-normal m-0 mb-[4px]">
                      Asignatura
                    </Text>
                    <Text className="text-[10px] text-black m-0 leading-[24px]">{subjectName}</Text>
                  </div>

                  <div>
                    <Text className="text-[12px] font-medium text-slate-500 tracking-normal m-0 mb-[4px]">
                      Docente
                    </Text>
                    <Text className="text-[10px] text-black m-0 leading-[24px]">{teacherName}</Text>
                  </div>

                  <div>
                    <Text className="text-[12px] font-medium text-slate-500 tracking-normal m-0 mb-[4px]">
                      Fecha
                    </Text>
                    <Text className="text-[10px] text-black m-0 leading-[24px]">
                      {new Date(classDate).toLocaleDateString('es-CO', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </Text>
                  </div>
                </div>
              </Section>

              {/* Reason */}
              <Section className="mb-[32px]">
                <Text className="text-[12px] font-medium text-slate-500 tracking-normal m-0 mb-[8px]">
                  Motivo de la cancelación
                </Text>
                <Text className="text-[10px] text-slate-700 leading-[24px] m-0 py-[12px] italic bg-slate-50 border border-slate-200 rounded-[8px] px-[12px]">
                  "{reason}"
                </Text>
              </Section>

              <Hr className="border-slate-200 my-[24px]" />

              {/* Footer Message */}
              <Text className="text-slate-600 text-[12px] leading-[20px] m-0 mb-[16px]">
                Lamentamos cualquier inconveniente. Si tienes preguntas, contacta a tu docente o
                soporte académico.
              </Text>

              <Text className="text-[12px] text-slate-500 m-0">
                Soporte:{' '}
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

export default ClassCancellationEmail;
