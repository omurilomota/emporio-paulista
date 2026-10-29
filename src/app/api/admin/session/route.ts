import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  ADMIN_SESSION_SECONDS,
  createAdminSession,
  isAdminConfigured,
  isValidAdminSession,
  verifyAdminPassword,
} from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

// Session probe: always 200 so the login screen can render without console errors.
export async function GET(request: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { authenticated: false, configured: false },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
  return NextResponse.json(
    { authenticated: isValidAdminSession(request), configured: true },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: "Configure ADMIN_PASSWORD com no mínimo 12 caracteres nas variáveis de ambiente." },
      { status: 503 },
    );
  }

  let candidate = "";
  try {
    const body = (await request.json()) as { password?: unknown };
    candidate = typeof body.password === "string" ? body.password.slice(0, 512) : "";
  } catch {
    return NextResponse.json({ error: "Não foi possível ler a senha." }, { status: 400 });
  }

  if (!verifyAdminPassword(candidate)) {
    return NextResponse.json({ error: "Senha incorreta. Confira e tente novamente." }, { status: 401 });
  }

  const response = NextResponse.json({ authenticated: true });
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: createAdminSession(),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: ADMIN_SESSION_SECONDS,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  return response;
}
