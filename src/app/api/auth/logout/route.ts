import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { nhostSignOut } from "@/lib/nhost";

const ACCESS_TOKEN_COOKIE = "nhost_access_token";
const REFRESH_TOKEN_COOKIE = "nhost_refresh_token";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;

<<<<<<< HEAD
    if (sessionToken) {
      // Deactivate session in database
      const mutation = `
        mutation DeactivateSession($token: String!) {
          update_real_estate_user_sessions(
            where: { token: { _eq: $token } },
            _set: { is_active: false }
          ) {
            affected_rows
          }
        }
      `;

      await fetch(process.env.SDK_BACKEND_URL!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hasura-admin-secret': process.env.SDK_HASURA_ADMIN_SECRET!,
        },
        body: JSON.stringify({
          query: mutation,
          variables: { token: sessionToken }
        }),
      });
=======
    if (refreshToken) {
      // Best-effort revocation on Nhost side
      await nhostSignOut(refreshToken);
>>>>>>> 6337a06 (add new authentication path)
    }

    cookieStore.delete(ACCESS_TOKEN_COOKIE);
    cookieStore.delete(REFRESH_TOKEN_COOKIE);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: "Logout failed" }, { status: 500 });
  }
}
