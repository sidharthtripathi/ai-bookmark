import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

// Simple in-memory rate limiter for registration (keyed by IP)
// In production, use Redis-based rate limiting
const registrationAttempts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 5; // 5 registrations per 15 minutes per IP

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = registrationAttempts.get(ip);

  if (!record || now > record.resetAt) {
    registrationAttempts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }

  record.count++;
  return true;
}

const MIN_PASSWORD_LENGTH = 8;
const MAX_FIELD_LENGTH = 10000;

export async function POST(req: NextRequest) {
  // Get client IP for rate limiting
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? req.headers.get('x-real-ip')
    ?? 'unknown';

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Too many registration attempts. Please try again in 15 minutes.' },
      { status: 429 }
    );
  }

  const { name, email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
  }

  // Enforce minimum password length
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` },
      { status: 400 }
    );
  }

  // Enforce max field lengths to prevent DoS
  if (email.length > 255 || (name && name.length > MAX_FIELD_LENGTH) || password.length > 128) {
    return NextResponse.json({ error: 'Field length exceeded' }, { status: 400 });
  }

  const existing = await db.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await db.user.create({
    data: {
      email: email.toLowerCase(),
      name: name ?? null,
      passwordHash
    }
  });

  return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
}
