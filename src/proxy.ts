import { updateSession } from "@/utils/supabase/middleware";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const result = await updateSession(request);
  return result;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - assets (browser extension files)
     * - api (API routes handle their own auth)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|assets/|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
