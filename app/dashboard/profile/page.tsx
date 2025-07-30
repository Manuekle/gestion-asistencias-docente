// app/dashboard/profile/page.tsx
'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Loader2, Lock, PenLine, Upload, User } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useState } from 'react';
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
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        // 2MB limit
        toast.error('El archivo es demasiado grande. El tamaño máximo permitido es 2MB.');
        return;
      }
      setSignatureFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSignaturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  // Update profile
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: session?.user?.id,
          name,
          correoInstitucional,
          correoPersonal: correoPersonal || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al actualizar el perfil');
      }

      // Update session
      await update({
        ...session,
        user: {
          ...session?.user,
          name,
          correoInstitucional,
          correoPersonal,
        },
      });

      toast.success('Perfil actualizado correctamente');
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar el perfil');
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
    } catch (error: any) {
      toast.error(error.message || 'Error al cambiar la contraseña');
    } finally {
      setIsPasswordLoading(false);
    }
  };

  // Upload signature
  const handleUploadSignature = async () => {
    if (!signatureFile) return;

    const formData = new FormData();
    formData.append('signature', signatureFile);

    setIsSignatureLoading(true);
    try {
      const response = await fetch('/api/upload/signature', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al subir la firma');
      }

      const data = await response.json();
      await update({ signatureUrl: data.url });
      toast.success('Firma actualizada correctamente');
    } catch (error: any) {
      toast.error(error.message || 'Error al subir la firma');
    } finally {
      setIsSignatureLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
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
                  <div className="relative group">
                    <Avatar className="h-24 w-24">
                      <AvatarImage
                        src={session?.user?.image || ''}
                        alt={session?.user?.name || 'Usuario'}
                      />
                      <AvatarFallback className="text-2xl">
                        {session?.user?.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                        <Upload className="h-6 w-6 text-white" />
                      </div>
                    </Avatar>
                    <input
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={e => {
                        // Handle profile picture upload
                        const file = e.target.files?.[0];
                        if (file) {
                          // Add your profile picture upload logic here
                        }
                      }}
                    />
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
                <div className="flex flex-col sm:flex-row items-start gap-8">
                  <div className="space-y-2 flex-1">
                    <div className="space-y-2">
                      <Label>Vista previa</Label>
                      <div className="border-2 border-dashed rounded-lg p-6 flex items-center justify-center h-48 bg-muted/30">
                        {signaturePreview ? (
                          <img
                            src={signaturePreview}
                            alt="Firma digital"
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <div className="text-center text-muted-foreground">
                            <p>No hay firma cargada</p>
                            <p className="text-xs mt-1">La firma aparecerá aquí</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Formato: PNG o JPG (máx. 2MB). La firma debe estar en fondo transparente.
                    </p>
                  </div>

                  <div className="border-l pl-6 space-y-6 w-full sm:max-w-xs">
                    <div>
                      <Label htmlFor="signature-upload" className="cursor-pointer">
                        <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 space-y-2 hover:bg-muted/30 transition-colors">
                          <Upload className="h-6 w-6 text-muted-foreground" />
                          <p className="text-sm font-normal">Seleccionar archivo</p>
                          <p className="text-xs text-muted-foreground text-center">
                            Arrastra y suelta la imagen, o haz clic para seleccionar
                          </p>
                        </div>
                      </Label>
                      <input
                        id="signature-upload"
                        type="file"
                        accept="image/png, image/jpeg"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                      {signatureFile && (
                        <p className="mt-2 text-sm text-muted-foreground">
                          Seleccionado: {signatureFile.name}
                        </p>
                      )}
                    </div>

                    <div className="pt-2">
                      <Button
                        type="button"
                        onClick={handleUploadSignature}
                        disabled={!signatureFile || isSignatureLoading}
                        className="w-full"
                      >
                        {isSignatureLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Subiendo...
                          </>
                        ) : (
                          'Guardar Firma'
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
