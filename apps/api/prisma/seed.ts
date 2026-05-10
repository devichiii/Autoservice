import { AppRoleCode, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ROLE_TITLES: Record<AppRoleCode, string> = {
  CLIENT: "Client",
  MANAGER: "Manager",
  ADMIN: "Administrator",
  SUPER_ADMIN: "Super Administrator"
};

async function main() {
  const roleCodes = Object.values(AppRoleCode);

  for (const code of roleCodes) {
    await prisma.role.upsert({
      where: { code },
      update: { title: ROLE_TITLES[code] },
      create: {
        code,
        title: ROLE_TITLES[code]
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    // Keep visible error details for CI logs and local debugging.
    console.error("Role seed failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
