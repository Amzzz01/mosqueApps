import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { key } = await request.json();

    if (!key) {
      return NextResponse.json(
        { error: 'Kunci pendaftaran diperlukan' },
        { status: 400 }
      );
    }

    const registrationKey = process.env.ADMIN_REGISTRATION_KEY;

    if (!registrationKey) {
      console.error('ADMIN_REGISTRATION_KEY is not configured in environment variables');
      return NextResponse.json(
        { error: 'Sistem pendaftaran tidak dikonfigurasi. Hubungi pentadbir.' },
        { status: 500 }
      );
    }

    if (key !== registrationKey) {
      return NextResponse.json(
        { error: 'Kunci pendaftaran tidak sah' },
        { status: 403 }
      );
    }

    return NextResponse.json({ valid: true });
  } catch {
    return NextResponse.json(
      { error: 'Ralat pelayan. Sila cuba lagi.' },
      { status: 500 }
    );
  }
}
