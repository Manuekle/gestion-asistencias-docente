'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Check, Clock, Copy, Loader2, Maximize2, RefreshCw } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { useEffect, useRef, useState } from 'react';

interface QRViewerProps {
  qrUrl: string;
  qrToken: string;
  expiresIn: number | null;
  onRefresh?: () => void;
  onClose: () => void;
  isRefreshing?: boolean;
}

export function QRViewer({
  qrUrl,
  qrToken,
  expiresIn,
  onRefresh,
  onClose,
  isRefreshing = false,
}: QRViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  // Removed unused isDarkMode state as it's not being used in the component
  const [copied, setCopied] = useState(false);
  const qrContainerRef = useRef<HTMLDivElement>(null);

  const qrSize = isFullscreen ? 400 : 240;

  // Removed unused dark mode detection effect

  const toggleFullscreen = () => {
    if (!qrContainerRef.current) return;
    if (!document.fullscreenElement) {
      qrContainerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const formatTime = (seconds: number | null) => {
    if (seconds === null) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const copyToken = async () => {
    try {
      await navigator.clipboard.writeText(qrToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error('Failed to copy token:', error);
    }
  };

  return (
    <div
      ref={qrContainerRef}
      className={cn(
        'transition-all duration-300',
        isFullscreen
          ? 'bg-white w-screen h-screen fixed inset-0 z-50 flex items-center justify-center'
          : 'bg-background rounded-xl shadow-lg w-full max-w-md mx-auto p-8 flex flex-col items-center justify-center'
      )}
    >
      {isFullscreen ? (
        // Solo QR en pantalla completa
        <QRCodeCanvas value={qrUrl} size={qrSize} level="H" fgColor="#000000" bgColor="#ffffff" />
      ) : (
        // Vista normal con todos los elementos
        <>
          {/* QR Code */}
          <div className="relative mb-8">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <QRCodeCanvas
                value={qrUrl}
                size={qrSize}
                level="H"
                fgColor="#000000"
                bgColor="#ffffff"
              />
            </div>

            {/* Timer */}
            {expiresIn !== null && (
              <div className="absolute -top-2 -right-2 bg-background border rounded-full px-3 py-1 shadow-sm">
                <div className="flex items-center gap-1 text-sm">
                  <Clock className="w-3 h-3" />
                  <span className="font-mono">{formatTime(expiresIn)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Manual Code */}
          <div className="w-full mb-6 space-y-3">
            <div className="relative">
              <div className="font-mono text-center p-3 bg-muted rounded-lg text-sm break-all select-all">
                {qrToken}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyToken}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="w-full space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" onClick={toggleFullscreen}>
                <Maximize2 className="h-4 w-4" />
              </Button>

              {onRefresh && (
                <Button variant="outline" size="sm" onClick={onRefresh} disabled={isRefreshing}>
                  {isRefreshing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>

            <Button onClick={onClose} className="w-full font-medium">
              Finalizar
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
