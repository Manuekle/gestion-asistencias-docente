import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Error | Authentication',
  description: 'An error occurred during authentication',
};

export default function AuthErrorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">{children}</div>
  );
}
