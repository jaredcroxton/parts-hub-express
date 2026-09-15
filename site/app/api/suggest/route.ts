import type { NextRequest } from "next/server";
import { suggest } from "@/lib/catalogue";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") || "";
  return Response.json(suggest(q), { headers: { "Cache-Control": "public, max-age=300" } });
}
