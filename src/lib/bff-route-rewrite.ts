/**
 * Maps REST-style admin BFF paths (admin console) to Nhost static function paths.
 * Nhost does not support dynamic [id] route files; legacy action segments are used upstream.
 */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Airwallex-style ids (cus_, pi_, etc.) */
const AIRWALLEX_ID_RE = /^[a-zA-Z0-9_-]{6,128}$/;

function isResourceId(segment: string): boolean {
  return UUID_RE.test(segment) || AIRWALLEX_ID_RE.test(segment);
}

export type RewriteResult = {
  pathSegments: string[];
  searchParams: URLSearchParams;
};

export function rewriteAdminBffPath(
  method: string,
  segments: string[],
  incomingSearch: URLSearchParams
): RewriteResult {
  const params = new URLSearchParams(incomingSearch);
  const path = [...segments];

  if (path[0] !== "admin" || path.length < 2) {
    return { pathSegments: path, searchParams: params };
  }

  const [, resource, a, b] = path;

  // GET collection routes → .../index (Nhost maps admin/<domain>/index.ts to /v1/admin/<domain>/index).
  // Properties list uses functions/admin/properties.ts → /v1/admin/properties (no /index).
  if (
    method === "GET" &&
    path.length === 2 &&
    (resource === "users" ||
      resource === "customers" ||
      resource === "beneficiaries" ||
      resource === "transfers" ||
      resource === "payment-intents")
  ) {
    return { pathSegments: ["admin", resource, "index"], searchParams: params };
  }

  // GET admin/users/:userId
  if (resource === "users" && a && path.length === 3 && method === "GET" && isResourceId(a)) {
    params.set("userId", a);
    return { pathSegments: ["admin", "users", "get-user"], searchParams: params };
  }

  // admin/properties
  if (resource === "properties") {
    if (path.length === 2 && method === "POST") {
      return { pathSegments: ["admin", "properties", "create-property"], searchParams: params };
    }
    if (a && path.length === 3 && UUID_RE.test(a)) {
      if (method === "GET") {
        params.set("propertyUuid", a);
        return { pathSegments: ["admin", "properties", "get-property"], searchParams: params };
      }
      if (method === "PUT" || method === "PATCH") {
        params.set("propertyUuid", a);
        return { pathSegments: ["admin", "properties", "update-property"], searchParams: params };
      }
    }
  }

  // GET admin/offers/incoming/:offerId
  if (
    resource === "offers" &&
    a === "incoming" &&
    b &&
    path.length === 4 &&
    method === "GET" &&
    /^\d+$/.test(b)
  ) {
    params.set("id", b);
    return { pathSegments: ["admin", "offers", "incoming-detail"], searchParams: params };
  }

  // GET admin/media → index handler
  if (resource === "media" && path.length === 2 && method === "GET") {
    return { pathSegments: ["admin", "media", "index"], searchParams: params };
  }

  // admin/customers/:id[/client-secret]
  if (resource === "customers" && a && isResourceId(a)) {
    if (path.length === 3) {
      if (method === "GET") {
        params.set("id", a);
        return { pathSegments: ["admin", "customers", "get-customer"], searchParams: params };
      }
      if (method === "PUT" || method === "PATCH") {
        params.set("id", a);
        return { pathSegments: ["admin", "customers", "update"], searchParams: params };
      }
      if (method === "DELETE") {
        params.set("id", a);
        return { pathSegments: ["admin", "customers", "delete"], searchParams: params };
      }
    }
    if (path.length === 4 && b === "client-secret" && (method === "POST" || method === "GET")) {
      params.set("id", a);
      return { pathSegments: ["admin", "customers", "client-secret"], searchParams: params };
    }
  }

  if (resource === "payment-methods") {
    if (path.length === 2 && method === "GET") {
      return { pathSegments: ["admin", "payment-methods", "index"], searchParams: params };
    }
    if (path.length === 2 && method === "POST") {
      return { pathSegments: ["admin", "payment-methods", "create"], searchParams: params };
    }
  }

  if (resource === "payment-consents") {
    if (path.length === 2 && method === "GET") {
      return { pathSegments: ["admin", "payment-consents", "index"], searchParams: params };
    }
    if (path.length === 2 && method === "POST") {
      return { pathSegments: ["admin", "payment-consents", "create"], searchParams: params };
    }
  }

  // admin/payment-intents/:id
  if (resource === "payment-intents" && a && path.length === 3 && isResourceId(a)) {
    if (method === "GET") {
      params.set("id", a);
      return { pathSegments: ["admin", "payment-intents", "get-intent"], searchParams: params };
    }
    if (method === "PUT" || method === "PATCH") {
      params.set("id", a);
      return { pathSegments: ["admin", "payments", "update"], searchParams: params };
    }
  }

  // admin/payments/:id/cancel|attach-method
  if (resource === "payments" && a && isResourceId(a) && b) {
    if (b === "cancel" && method === "POST") {
      params.set("id", a);
      return { pathSegments: ["admin", "payments", "cancel"], searchParams: params };
    }
    if (b === "attach-method" && method === "POST") {
      params.set("id", a);
      return { pathSegments: ["admin", "payments", "attach-method"], searchParams: params };
    }
  }

  // admin/beneficiaries/:id
  if (resource === "beneficiaries" && a && path.length === 3 && isResourceId(a)) {
    if (method === "GET") {
      params.set("id", a);
      return { pathSegments: ["admin", "beneficiaries", "get-beneficiary"], searchParams: params };
    }
    if (method === "PUT" || method === "PATCH") {
      params.set("id", a);
      return { pathSegments: ["admin", "beneficiaries", "update"], searchParams: params };
    }
    if (method === "DELETE") {
      params.set("id", a);
      return { pathSegments: ["admin", "beneficiaries", "delete"], searchParams: params };
    }
  }

  // admin/transfers/:id/cancel
  if (resource === "transfers" && a && b === "cancel" && method === "POST" && isResourceId(a)) {
    params.set("id", a);
    return { pathSegments: ["admin", "transfers", "cancel"], searchParams: params };
  }

  // admin/administrator-users/:id
  if (resource === "administrator-users" && a && path.length === 3 && isResourceId(a)) {
    if (method === "GET") {
      params.set("id", a);
      return { pathSegments: ["admin", "administrator-users", "get"], searchParams: params };
    }
    if (method === "PUT" || method === "PATCH") {
      params.set("id", a);
      return { pathSegments: ["admin", "administrator-users", "update"], searchParams: params };
    }
    if (method === "DELETE") {
      params.set("id", a);
      return { pathSegments: ["admin", "administrator-users", "delete"], searchParams: params };
    }
  }

  return { pathSegments: path, searchParams: params };
}
