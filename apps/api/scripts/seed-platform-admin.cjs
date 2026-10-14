"use strict";

// Operator-invoked staging provisioning. Never run automatically at container boot.
// Credentials are passed through process environment, not committed or printed.
async function provisionPlatformAdmin({db, email, password, hashPassword}) {
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255)
    throw new Error("A valid PLATFORM_ADMIN_EMAIL is required");
  if (typeof password !== "string" || password.length < 20 || password.length > 128)
    throw new Error("PLATFORM_ADMIN_PASSWORD must have 20–128 characters");
  const normalized = email.trim().toLowerCase();
  const existing = await db.user.findUnique({where: {email: normalized}});
  if (existing) {
    if (!existing.isPlatformAdmin)
      throw new Error("The email is already used by a non-platform user; refusing privilege escalation");
    return {created: false, email: normalized};
  }
  const digest = await hashPassword(password);
  await db.user.create({
    data: {
      email: normalized,
      fullName: "Platform Administrator",
      passwordHash: digest,
      emailVerifiedAt: new Date(),
      isPlatformAdmin: true,
    },
  });
  return {created: true, email: normalized};
}

async function main() {
  const { PrismaClient } = require("@prisma/client");
  const { hashPassword } = require("../dist/security/crypto.js");
  const db = new PrismaClient();
  try {
    const result = await provisionPlatformAdmin({
      db,
      email: process.env.PLATFORM_ADMIN_EMAIL,
      password: process.env.PLATFORM_ADMIN_PASSWORD,
      hashPassword,
    });
    console.log(result.created ? "Platform staging administrator created" : "Existing platform administrator unchanged");
    console.log("Email: " + result.email);
  } finally {
    await db.$disconnect();
  }
}
if (require.main === module) {
  main().catch(err => {
    console.error("Platform seed failed:", err instanceof Error ? err.message : "Unknown error");
    process.exitCode = 1;
  });
}
module.exports = { provisionPlatformAdmin };
