'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle, Upload } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { useState } from 'react';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith('image/')) {
        toast.error('Por favor, selecciona un archivo de imagen válido (PNG, JPG, etc.).');
        return;
      }
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) {
      toast.error('Por favor, selecciona un archivo para subir.');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('signature', file);

    try {
      const response = await fetch('/api/docente/perfil/firma', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al subir la firma.');
      }

      // Actualizar la sesión de NextAuth con la nueva URL de la firma
      await update({ signatureUrl: result.signatureUrl });

      toast.success('¡Firma actualizada con éxito!', {
        icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      });

      setFile(null);
      setPreview(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
      toast.error(errorMessage, {
        icon: <AlertCircle className="h-5 w-5 text-red-500" />,
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl tracking-card">Gestionar Firma Digital</CardTitle>
          <CardDescription>
            Sube o actualiza la imagen de tu firma. Esta se usará en los reportes que generes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Firma Actual</h3>
              <div className="border-2 border-dashed rounded-lg p-4 h-40 flex items-center justify-center bg-gray-50">
                {session?.user.signatureUrl ? (
                  <Image
                    src={session.user.signatureUrl}
                    alt="Firma actual"
                    width={200}
                    height={100}
                    className="object-contain max-h-full"
                  />
                ) : (
                  <p className="text-gray-500">No has subido ninguna firma.</p>
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="signature-upload" className="text-lg font-semibold">
                  Subir Nueva Firma
                </Label>
                <Input
                  id="signature-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="mt-2 file:text-white file:bg-blue-600 file:hover:bg-blue-700 file:rounded-lg file:px-4 file:py-2 file:border-0"
                />
              </div>

              {preview && (
                <div>
                  <p className="font-semibold mb-2">Previsualización:</p>
                  <div className="border rounded-lg p-2 flex justify-center">
                    <Image
                      src={preview}
                      alt="Previsualización de la firma"
                      width={240}
                      height={120}
                      className="object-contain max-h-full"
                    />
                  </div>
                </div>
              )}

              <Button type="submit" disabled={!file || isUploading} className="w-full">
                {isUploading ? 'Subiendo...' : 'Guardar Nueva Firma'}
                <Upload className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
