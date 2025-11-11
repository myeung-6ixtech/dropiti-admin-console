export async function getBearerToken(): Promise<string | null> {
  try {
    const response = await fetch("https://api-demo.airwallex.com/api/v1/authentication/login", {
      method: "POST",
      headers: {
        "x-client-id": process.env.AIRWALLEX_CLIENT_ID!,
        "x-api-key": process.env.AIRWALLEX_API_KEY!,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to authenticate with Airwallex");
    }

    const data = await response.json();
    return data.token || null;
  } catch (error) {
    console.error("Error getting bearer token:", error);
    return null;
  }
} 