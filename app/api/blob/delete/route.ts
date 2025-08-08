import { del } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
    }

    // Delete the blob
    await del(filename);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete blob' }, { status: 500 });
  }
}
