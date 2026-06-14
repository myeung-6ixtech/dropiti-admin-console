const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type DisplayUser = {
  id?: string;
  name?: string | null;
  email?: string | null;
};

/** Human-readable label for header/profile — never show a raw Nhost user id. */
export function getAdminDisplayName(user: DisplayUser | null | undefined): string {
  if (!user) return "Admin";

  const name = user.name?.trim();
  if (name && name !== user.id && !UUID_RE.test(name)) {
    return name;
  }

  const email = user.email?.trim();
  if (email) {
    return email;
  }

  return "Admin";
}

export function getAdminInitial(user: DisplayUser | null | undefined): string {
  return getAdminDisplayName(user).charAt(0).toUpperCase();
}
