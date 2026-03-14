import { NextRequest } from "next/server";
import { appendFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";

const DEBUG_LOG_PATH = join(process.cwd(), ".cursor", "debug.log");

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const line = JSON.stringify({ ...payload, timestamp: Date.now() }) + "\n";
    mkdirSync(dirname(DEBUG_LOG_PATH), { recursive: true });
    appendFileSync(DEBUG_LOG_PATH, line);
  } catch {}
  return new Response(null, { status: 204 });
}
