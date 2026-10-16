import { OAuth2Client } from "google-auth-library";
import { config } from "../config/index.js";
import { prisma } from "../infrastructure/prisma.js";
import { signToken } from "../middleware/auth.js";
import { HttpError } from "../middleware/errorHandler.js";

export interface GoogleIdentity {
  sub: string;
  email: string;
  emailVerified: boolean;
  name?: string;
}

export function roleForGoogleSignup(opts: {
  existingRole: "admin" | "csm" | null;
  email: string;
  adminEmails: readonly string[];
  hasGoogleAdmin: boolean;
}): "admin" | "csm" {
  if (opts.existingRole) return opts.existingRole;
  const email = opts.email.trim().toLowerCase();
  if (opts.adminEmails.includes(email)) return "admin";
  if (!opts.hasGoogleAdmin) return "admin";
  return "csm";
}

export async function verifyGoogleIdToken(idToken: string): Promise<GoogleIdentity> {
  if (!config.googleClientId) {
    throw new HttpError(503, "Service Unavailable", "Google sign-in is not configured.");
  }
  const client = new OAuth2Client(config.googleClientId);
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: config.googleClientId,
    });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email) {
      throw new HttpError(401, "Unauthorized", "Google did not return an email for this account.");
    }
    return {
      sub: payload.sub,
      email: payload.email.trim().toLowerCase(),
      emailVerified: payload.email_verified === true,
      name: payload.name,
    };
  } catch (err) {
    if (err instanceof HttpError) throw err;
    throw new HttpError(401, "Unauthorized", "Google sign-in could not be verified.");
  }
}

export async function loginWithGoogle(idToken: string) {
  const identity = await verifyGoogleIdToken(idToken);
  if (!identity.emailVerified) {
    throw new HttpError(401, "Unauthorized", "Google has not verified this email address.");
  }

  const linked = await prisma.adminUser.findUnique({ where: { googleSub: identity.sub } });
  const byEmail = linked ? null : await prisma.adminUser.findUnique({ where: { email: identity.email } });
  const existing = linked ?? byEmail;

  const googleAdmin = existing
    ? null
    : await prisma.adminUser.findFirst({
        where: { role: "admin", googleSub: { not: null } },
        select: { id: true },
      });

  const role = roleForGoogleSignup({
    existingRole: existing ? (existing.role as "admin" | "csm") : null,
    email: identity.email,
    adminEmails: config.googleAdminEmails,
    hasGoogleAdmin: Boolean(googleAdmin),
  });

  const user = existing
    ? await prisma.adminUser.update({
        where: { id: existing.id },
        data: {
          googleSub: identity.sub,
          email: identity.email,
          name: identity.name ?? existing.name,
        },
      })
    : await prisma.adminUser.create({
        data: {
          email: identity.email,
          name: identity.name,
          role,
          googleSub: identity.sub,
        },
      });

  const session = signToken({
    id: user.id,
    email: user.email,
    role: user.role as "admin" | "csm",
    name: user.name ?? undefined,
  });

  return {
    ...session,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
  };
}
