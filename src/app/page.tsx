import { redirect } from "next/navigation";
import { cookies } from "next/headers";

const ACCESS_TOKEN_COOKIE = "nhost_access_token";

/**
 * Root `/` — same cookie as middleware. Login sets httpOnly `nhost_access_token` (not legacy `admin_session`).
 */
export default async function RootPage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;

  if (accessToken) {
    redirect("/dashboard");
  } else {
    redirect("/signin");
  }
}
