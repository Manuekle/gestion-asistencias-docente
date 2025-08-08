'use client';

import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const errorMessages: Record<string, string> = {
    Configuration: 'There is a problem with the server configuration.',
    AccessDenied: 'You do not have permission to sign in.',
    Verification: 'The verification link is no longer valid.',
    Default: 'An error occurred while trying to authenticate.',
  };

  const errorMessage = error
    ? errorMessages[error as keyof typeof errorMessages] || errorMessages.Default
    : errorMessages.Default;

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-red-100 rounded-full">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Authentication Error</h1>
        <p className="mt-2 text-gray-600">{errorMessage}</p>
      </div>

      <div className="mt-6">
        <Link
          href="/auth/signin"
          className="flex w-full justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Return to Sign In
        </Link>
      </div>

      <div className="mt-4 text-center text-sm text-gray-600">
        <p>
          Need help?{' '}
          <a
            href="mailto:support@edutrack.com"
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Contact support
          </a>
        </p>
      </div>
    </div>
  );
}
