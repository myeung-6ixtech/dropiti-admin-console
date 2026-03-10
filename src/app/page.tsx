import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function RootPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("admin_session")?.value;
  
  if (sessionToken) {
    redirect("/dashboard");
  } else {
    redirect("/signin");
  }
}
