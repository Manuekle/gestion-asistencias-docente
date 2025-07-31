// app/dashboard/profile/page.tsx
'use client';

import { SignatureFileUpload } from '@/components/profile/SignatureFileUpload';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingPage } from '@/components/ui/loading';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { uploadSignature } from '@/lib/actions/user.actions';
import { AlertCircle, Loader2, Lock, PenLine, User } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [isSignatureLoading, setIsSignatureLoading] = useState(false);

  // Profile form
  const [name, setName] = useState('');
  const [correoInstitucional, setCorreoInstitucional] = useState('');
  const [correoPersonal, setCorreoPersonal] = useState('');

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Signature
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);

  // Initialize form with session data
  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || '');
      setCorreoInstitucional(session.user.correoInstitucional || '');
      setCorreoPersonal(session.user.correoPersonal || '');
      if (session.user.signatureUrl) {
        setSignaturePreview(session.user.signatureUrl);
      }
    }
  }, [session]);

  // Handle file selection for signature
  const handleFileSelect = (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      // 2MB limit
      toast.error('El archivo es demasiado grande. El tamaño máximo es 2MB.');
      return;
    }
    setSignatureFile(file);
    setSignaturePreview(URL.createObjectURL(file));
  };

  const handleCancelSignature = () => {
    setSignatureFile(null);
    setSignaturePreview(session?.user?.signatureUrl || null);
  };

  // Update profile
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, correoPersonal }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al actualizar el perfil');
      }

      await update({ name, correoPersonal });
      toast.success('Perfil actualizado correctamente');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar el perfil';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Update password
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setIsPasswordLoading(true);
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al cambiar la contraseña');
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Contraseña actualizada correctamente');
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error al cambiar la contraseña';
      toast.error(errorMessage);
    } finally {
      setIsPasswordLoading(false);
    }
  };

  // Upload signature
  const handleUploadSignature = async () => {
    if (!signatureFile || !session?.user?.id) return;

    setIsSignatureLoading(true);
    const formData = new FormData();
    formData.append('file', signatureFile);

    try {
      const result = await uploadSignature(formData);

      if (result.success && result.url) {
        toast.success('Firma actualizada con éxito.');
        // Update session first to get the new data
        await update();
        // Then update the local state from the newly updated session
        setSignaturePreview(result.url);
        setSignatureFile(null);
      } else {
        toast.error(result.message || 'Error al subir la firma.');
      }
    } catch {
      toast.error('Ocurrió un error inesperado.');
    } finally {
      setIsSignatureLoading(false);
    }
  };

  if (status === 'loading') {
    return <LoadingPage />;
  }

  return (
    <div className="mx-auto space-y-8">
      <CardHeader className="p-0 w-full">
        <CardTitle className="text-2xl font-semibold tracking-tight">Mi Perfil</CardTitle>
        <CardDescription className="text-xs">
          Gestiona tu información personal y preferencias de cuenta.
        </CardDescription>
      </CardHeader>

      <Tabs
        defaultValue="profile"
        className="space-y-6"
        onValueChange={setActiveTab}
        value={activeTab}
      >
        <TabsList
          className="grid w-full max-w-md"
          style={{
            gridTemplateColumns: session?.user?.role === 'DOCENTE' ? '1fr 1fr 1fr' : '1fr 1fr',
          }}
        >
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="security">
            <Lock className="h-4 w-4 mr-2" />
            Seguridad
          </TabsTrigger>
          {session?.user?.role === 'DOCENTE' && (
            <TabsTrigger value="signature">
              <PenLine className="h-4 w-4 mr-2" />
              Firma
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold tracking-card">
                Información Personal
              </CardTitle>
              <CardDescription className="text-xs">
                Actualiza tu información personal y cómo se muestra en la plataforma.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleUpdateProfile}>
              <CardContent className="space-y-6">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="relative">
                    <Avatar className="h-24 w-24 bg-primary/10">
                      <AvatarFallback className="text-2xl">
                        {session?.user?.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1 w-full space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre completo</Label>
                      <Input
                        id="name"
                        disabled
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Tu nombre completo"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="correoInstitucional">Correo Institucional</Label>
                      <Input
                        id="correoInstitucional"
                        disabled
                        type="email"
                        value={correoInstitucional}
                        onChange={e => setCorreoInstitucional(e.target.value)}
                        placeholder="correo@institucion.edu"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="correoPersonal">Correo Personal (Opcional)</Label>
                      <Input
                        id="correoPersonal"
                        type="email"
                        value={correoPersonal}
                        onChange={e => setCorreoPersonal(e.target.value)}
                        placeholder="correo@personal.com"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="mt-6 border-t px-6">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    'Guardar cambios'
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold tracking-card">
                Cambiar Contraseña
              </CardTitle>
              <CardDescription className="text-xs">
                Actualiza tu contraseña para mantener tu cuenta segura.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleUpdatePassword}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Contraseña actual</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    placeholder="Ingresa tu contraseña actual"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nueva contraseña</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Ingresa tu nueva contraseña"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Confirma tu nueva contraseña"
                    required
                  />
                </div>
                <div className="mb-4 rounded-lg border border-gray-200 p-4 text-sm text-gray-700 dark:border-gray-800/30 dark:text-gray-300">
                  <div className="flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    <span>La contraseña debe tener al menos 6 caracteres.</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t px-6 py-4">
                <Button type="submit" disabled={isPasswordLoading}>
                  {isPasswordLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Actualizando...
                    </>
                  ) : (
                    'Cambiar contraseña'
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        {session?.user?.role === 'DOCENTE' && (
          <TabsContent value="signature" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold tracking-tight">
                  Firma Digital
                </CardTitle>
                <CardDescription className="text-xs">
                  Sube tu firma digital para usarla en documentos oficiales.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Vista previa de la Firma</Label>
                  <div className="border-2 border-dashed rounded-lg p-4 flex items-center justify-center h-40 bg-muted/30 w-full">
                    {signaturePreview ? (
                      <div className="relative w-full h-full">
                        <Image
                          src={signaturePreview}
                          alt="Firma digital'"
                          fill
                          style={{ objectFit: 'contain' }}
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground">
                        <p className="text-sm">No hay firma cargada</p>
                        <p className="text-xs mt-1">La vista previa aparecerá aquí</p>
                      </div>
                    )}
                  </div>
                </div>

                <SignatureFileUpload onFileSelect={handleFileSelect} file={signatureFile} />

                {signatureFile && (
                  <div className="text-center text-sm text-muted-foreground">
                    Archivo seleccionado:{' '}
                    <span className="font-medium text-foreground">{signatureFile.name}</span>
                  </div>
                )}

                <div className="flex flex-col gap-2 pt-2">
                  <Button
                    onClick={handleUploadSignature}
                    disabled={!signatureFile || isSignatureLoading}
                    className="w-full"
                  >
                    {isSignatureLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Subiendo...
                      </>
                    ) : (
                      'Guardar Firma'
                    )}
                  </Button>
                  {signatureFile && (
                    <Button onClick={handleCancelSignature} variant="outline" className="w-full">
                      Cancelar
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground text-center pt-2">
                  Formato recomendado: PNG con fondo transparente (máx. 2MB).
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
