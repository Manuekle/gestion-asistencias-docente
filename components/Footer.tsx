import { BookOpen, Code2, Github, HelpCircle, Linkedin, Mail, Twitter, Users } from 'lucide-react';
import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const links = [
    {
      title: 'Recursos',
      items: [
        { name: 'Documentación', href: '/docs', icon: BookOpen },
        { name: 'API', href: '/api-docs', icon: Code2 },
        { name: 'Soporte', href: '/soporte', icon: HelpCircle },
        { name: 'Comunidad', href: '/comunidad', icon: Users },
      ],
    },
  ];

  const socials = [
    {
      name: 'GitHub',
      href: 'https://github.com/fup-asistencias/sistema-asistencias',
      icon: Github,
    },
    {
      name: 'Twitter',
      href: 'https://twitter.com',
      icon: Twitter,
    },
    {
      name: 'LinkedIn',
      href: 'https://linkedin.com',
      icon: Linkedin,
    },
    {
      name: 'Contacto',
      href: 'mailto:contacto@edutrack.com',
      icon: Mail,
    },
  ];

  return (
    <footer className="border-t bg-muted/20 backdrop-blur-sm w-full">
      <div className="container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Branding */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl font-semibold bg-gradient-to-r from-primary to-amber-500 bg-clip-text text-transparent">
                edu<span className="text-amber-500">Track</span>
              </span>
            </Link>
            <p className="text-muted-foreground text-xs">
              Transformando la gestión de asistencia en entornos educativos con tecnología moderna y
              accesible.
            </p>
            <div className="flex space-x-4 pt-2">
              {socials.map(social => (
                <Link
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={social.name}
                >
                  <social.icon className="h-5 w-5" />
                </Link>
              ))}
            </div>
          </div>

          {/* Links */}
          {links.map(section => (
            <div key={section.title}>
              <h3 className="text-xs font-medium tracking-card mb-4">{section.title}</h3>
              <ul className="space-y-3">
                {section.items.map(item => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="flex  items-center text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact Info */}
          <div>
            <h3 className="text-xs font-medium tracking-card mb-4">Contacto</h3>
            <ul className="space-y-3 text-xs text-muted-foreground">
              <li className="flex items-start">
                <Mail className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                <a
                  href="mailto:contacto@edutrack.com"
                  className="hover:text-foreground transition-colors"
                >
                  contacto@edutrack.com
                </a>
              </li>
              <li className="flex items-start">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>Popayán, Colombia</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border/40 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-xs text-muted-foreground text-center md:text-left">
            &copy; {currentYear} eduTrack. Todos los derechos reservados.
          </p>
          <div className="flex items-center space-x-6 mt-4 md:mt-0">
            <Link
              href="/terminos"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Términos de servicio
            </Link>
            <Link
              href="/privacidad"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Política de privacidad
            </Link>
            <Link
              href="https://github.com/Manuekle"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center"
            >
              <span>Hecho con ❤️ por Manuel Erazo</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
