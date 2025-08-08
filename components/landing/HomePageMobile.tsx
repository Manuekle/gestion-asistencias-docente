'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Clock, Eye, EyeOff, Loader2, Mail, QrCode, Users, X } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Alert, AlertDescription } from '../ui/alert';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

export default function HomePageMobile() {
  const [showLogin, setShowLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: formData.email,
        password: formData.password,
        callbackUrl: '/dashboard',
      });

      if (result?.error) {
        throw new Error('Credenciales inválidas. Por favor, inténtalo de nuevo.');
      } else {
        // Use the return URL if it exists, otherwise go to dashboard
        const returnUrl = new URL(window.location.href).searchParams.get('callbackUrl');
        router.push(returnUrl || '/dashboard');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setForgotPasswordMessage(null);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo: forgotPasswordEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al procesar la solicitud');
      }

      setForgotPasswordMessage({
        type: 'success',
        text: 'Si el correo existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña.',
      });
    } catch (error) {
      setForgotPasswordMessage({
        type: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Error al enviar el correo de recuperación. Por favor, inténtalo de nuevo.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: <QrCode className="w-4 h-4 text-foreground" />,
      title: 'Registro con QR',
      description: 'Escanea y registra en segundos',
    },
    {
      icon: <Clock className="w-4 h-4 text-foreground" />,
      title: 'Tiempo Real',
      description: 'Control instantáneo',
    },
    {
      icon: <Users className="w-4 h-4 text-foreground" />,
      title: 'Gestión Simple',
      description: 'Administra tus grupos fácilmente',
    },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background blur elements - shadcn style */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-10 w-24 h-24 bg-secondary/20 rounded-full blur-3xl"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-accent/10 rounded-full blur-3xl"></div>

      <div className="relative z-10 p-6">
        {!showLogin ? (
          // Landing Content
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-md mx-auto pt-16 text-center"
          >
            {/* Logo and Title */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mb-12"
            >
              <div className="w-16 h-16 bg-primary rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg">
                <QrCode className="w-8 h-8 text-primary-foreground" />
              </div>
              <h1 className="text-4xl font-semibold tracking-tight text-foreground mb-3">
                edu<span className="text-amber-500">Track</span>
              </h1>
              <p className="text-muted-foreground text-xs max-w-xs mx-auto">
                Gestión de asistencia inteligente para instituciones educativas
              </p>
            </motion.div>

            {/* Features */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="space-y-4 mb-10"
            >
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="group relative overflow-hidden rounded-2xl backdrop-blur-sm bg-card border border-border hover:bg-accent/50 transition-all duration-300 shadow-sm p-4"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-muted rounded-lg flex items-center justify-center">
                      {feature.icon}
                    </div>
                    <div className="flex flex-col justify-end items-start w-full">
                      <h3 className="font-normal text-foreground text-xs">{feature.title}</h3>
                      <p className="text-muted-foreground text-xs">{feature.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="w-full"
            >
              <Button
                size="lg"
                onClick={() => setShowLogin(true)}
                variant="default"
                className="w-full"
              >
                Iniciar Sesión
              </Button>
            </motion.div>
          </motion.div>
        ) : (
          <div>{/* Login form will be rendered here */}</div>
        )}
      </div>

      <AnimatePresence>
        {showLogin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
            onClick={e => e.target === e.currentTarget && setShowLogin(false)}
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="w-full max-w-md rounded-xl border bg-card p-6 shadow-lg"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold tracking-tight">
                  {forgotPasswordMode ? 'Recuperar Contraseña' : 'Iniciar Sesión'}
                </h2>
                <Button
                  onClick={() => setShowLogin(false)}
                  variant="ghost"
                  size="icon"
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="space-y-4">
                <AnimatePresence mode="wait">
                  {forgotPasswordMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <Alert
                        variant={forgotPasswordMessage.type === 'error' ? 'destructive' : 'default'}
                      >
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{forgotPasswordMessage.text}</AlertDescription>
                      </Alert>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={forgotPasswordMode ? 'forgot' : 'login'}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.15 }}
                  >
                    {!forgotPasswordMode ? (
                      <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-xs">
                            Correo electrónico
                          </Label>
                          <div className="relative">
                            <Input
                              id="email"
                              name="email"
                              type="email"
                              value={formData.email}
                              onChange={handleInputChange}
                              placeholder="tu@email.com"
                              required
                              className="text-xs"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="password" className="text-xs">
                              Contraseña
                            </Label>
                          </div>
                          <div className="relative">
                            <Input
                              id="password"
                              name="password"
                              type={showPassword ? 'text' : 'password'}
                              value={formData.password}
                              onChange={handleInputChange}
                              placeholder="Introduce tu contraseña"
                              required
                              minLength={8}
                              className="text-xs"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground hover:bg-transparent hover:text-foreground"
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        <Button type="submit" disabled={isLoading} className="w-full text-xs">
                          {isLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Ingresando...
                            </>
                          ) : (
                            'Ingresar'
                          )}
                        </Button>
                        <div className="flex items-center justify-center text-xs w-full">
                          <Button
                            type="button"
                            variant="link"
                            size="sm"
                            className="h-auto p-0 text-xs font-normal"
                            onClick={() => setForgotPasswordMode(true)}
                          >
                            ¿Olvidaste tu contraseña?
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <form onSubmit={handleForgotPassword} className="space-y-4">
                        <p className="text-muted-foreground text-xs">
                          Ingresa tu correo electrónico y te enviaremos un enlace para restablecer
                          tu contraseña.
                        </p>

                        <div className="space-y-2">
                          <Label className="text-xs">Correo electrónico</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                            <Input
                              type="email"
                              value={forgotPasswordEmail}
                              onChange={e => setForgotPasswordEmail(e.target.value)}
                              placeholder="tu@email.com"
                              required
                              className="pl-10 text-xs"
                            />
                          </div>
                        </div>

                        <Button type="submit" disabled={isLoading} className="w-full">
                          {isLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Enviando...
                            </>
                          ) : (
                            'Enviar enlace de recuperación'
                          )}
                        </Button>

                        <Button
                          variant="link"
                          size="sm"
                          className="w-full text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            setForgotPasswordMode(false);
                            setForgotPasswordMessage(null);
                          }}
                        >
                          Volver al inicio de sesión
                        </Button>
                      </form>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
