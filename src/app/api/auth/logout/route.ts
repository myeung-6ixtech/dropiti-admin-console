import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("admin_session")?.value;

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
    }

    // Clear cookie
    cookieStore.delete("admin_session");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Logout failed" },
      { status: 500 }
    );
  }
}
