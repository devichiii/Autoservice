import {
  AppRoleCode,
  BookingStatus,
  NotificationType,
  Prisma,
  PrismaClient
} from "@prisma/client";
import * as argon2 from "argon2";

const prisma = new PrismaClient();

/** Единый пароль для всех демо-аккаунтов (локальная среда только). */
const DEMO_PASSWORD = "Password123!";
/** Комментарий в booking: по нему сид удаляет старые демо-записи перед пересозданием. */
const DEMO_BOOKING_MARKER = "[demo-seed]";

const ROLE_TITLES: Record<AppRoleCode, string> = {
  CLIENT: "Client",
  MANAGER: "Manager",
  ADMIN: "Administrator",
  SUPER_ADMIN: "Super Administrator"
};

type DemoUserSpec = {
  email: string;
  firstName: string;
  lastName: string;
  roleCodes: AppRoleCode[];
};

const DEMO_USERS: DemoUserSpec[] = [
  {
    email: "demo.client@autoservice.local",
    firstName: "Демо",
    lastName: "Клиент",
    roleCodes: [AppRoleCode.CLIENT]
  },
  {
    email: "demo.manager@autoservice.local",
    firstName: "Демо",
    lastName: "Менеджер",
    roleCodes: [AppRoleCode.MANAGER]
  },
  {
    email: "demo.admin@autoservice.local",
    firstName: "Демо",
    lastName: "Администратор",
    roleCodes: [AppRoleCode.ADMIN]
  },
  {
    email: "demo.superadmin@autoservice.local",
    firstName: "Демо",
    lastName: "Суперадмин",
    roleCodes: [AppRoleCode.SUPER_ADMIN]
  }
];

const DEMO_SERVICES = [
  {
    title: "Замена моторного масла и фильтра",
    description: "Стандартная замена масла и масляного фильтра.",
    durationMinutes: 60,
    price: "4500.00"
  },
  {
    title: "Диагностика перед покупкой",
    description: "Осмотр ходовой, тормозов, ошибок ЭБУ.",
    durationMinutes: 90,
    price: "5500.00"
  },
  {
    title: "Шиномонтаж R16–R18",
    description: "Балансировка в комплекте.",
    durationMinutes: 45,
    price: "2800.00"
  }
] as const;

const DEMO_CLIENT_EMAIL = DEMO_USERS.find((u) => u.roleCodes.includes(AppRoleCode.CLIENT))!.email;

async function seedRoles(roleMap: Map<AppRoleCode, string>) {
  const codes = Object.values(AppRoleCode) as AppRoleCode[];
  for (const code of codes) {
    const role = await prisma.role.upsert({
      where: { code },
      update: { title: ROLE_TITLES[code] },
      create: { code, title: ROLE_TITLES[code] }
    });
    roleMap.set(code, role.id);
  }
}

async function upsertDemoUsers(passwordHash: string, roleMap: Map<AppRoleCode, string>) {
  const byEmail = new Map<string, string>();

  for (const spec of DEMO_USERS) {
    const saved = await prisma.user.upsert({
      where: { email: spec.email },
      update: {
        firstName: spec.firstName,
        lastName: spec.lastName,
        isActive: true,
        passwordHash
      },
      create: {
        email: spec.email,
        passwordHash,
        firstName: spec.firstName,
        lastName: spec.lastName,
        isActive: true
      }
    });

    byEmail.set(spec.email, saved.id);

    await prisma.userRole.deleteMany({
      where: {
        userId: saved.id,
        roleId: {
          notIn: spec.roleCodes.map((code) => roleMap.get(code)!)
        }
      }
    });

    for (const code of spec.roleCodes) {
      const roleId = roleMap.get(code)!;
      await prisma.userRole.upsert({
        where: {
          userId_roleId: { userId: saved.id, roleId }
        },
        update: {},
        create: { userId: saved.id, roleId }
      });
    }
  }

  return byEmail;
}

async function upsertServices() {
  const map = new Map<string, string>();
  for (const svc of DEMO_SERVICES) {
    const existing = await prisma.service.findFirst({
      where: { title: svc.title }
    });
    const saved = existing
      ? await prisma.service.update({
          where: { id: existing.id },
          data: {
            title: svc.title,
            description: svc.description,
            durationMinutes: svc.durationMinutes,
            price: new Prisma.Decimal(svc.price),
            isActive: true
          }
        })
      : await prisma.service.create({
          data: {
            title: svc.title,
            description: svc.description,
            durationMinutes: svc.durationMinutes,
            price: new Prisma.Decimal(svc.price),
            isActive: true
          }
        });
    map.set(svc.title, saved.id);
  }
  return map;
}

async function upsertClientCars(clientId: string) {
  const demos = [
    {
      vin: "DEMO-CLIENT-VIN-0001",
      brand: "Toyota",
      model: "Camry",
      year: 2020,
      plateNumber: "ДЕМО001",
      notes: DEMO_BOOKING_MARKER
    },
    {
      vin: "DEMO-CLIENT-VIN-0002",
      brand: "Lada",
      model: "Vesta",
      year: 2021,
      plateNumber: "ДЕМО002",
      notes: DEMO_BOOKING_MARKER
    }
  ];

  const ids: string[] = [];
  for (const car of demos) {
    const existingByVin = await prisma.car.findFirst({
      where: { vin: car.vin }
    });
    if (existingByVin) {
      if (existingByVin.userId !== clientId) {
        throw new Error(
          `Seed: VIN ${car.vin} занят другим пользователем. Очистите БД или смените VIN в seed.`
        );
      }
      const updated = await prisma.car.update({
        where: { id: existingByVin.id },
        data: {
          brand: car.brand,
          model: car.model,
          year: car.year,
          plateNumber: car.plateNumber,
          notes: car.notes
        }
      });
      ids.push(updated.id);
      continue;
    }

    const created = await prisma.car.create({
      data: {
        userId: clientId,
        brand: car.brand,
        model: car.model,
        year: car.year,
        vin: car.vin,
        plateNumber: car.plateNumber,
        notes: car.notes
      }
    });
    ids.push(created.id);
  }

  return ids;
}

async function removeOldDemoBookings() {
  await prisma.booking.deleteMany({
    where: {
      comment: {
        contains: DEMO_BOOKING_MARKER
      }
    }
  });
}

async function seedDemoBookings(input: {
  clientId: string;
  adminId: string;
  carIds: string[];
  serviceTitleToId: Map<string, string>;
}) {
  const { clientId, adminId, carIds, serviceTitleToId } = input;
  const svcOil = serviceTitleToId.get(DEMO_SERVICES[0].title)!;
  const svcDiag = serviceTitleToId.get(DEMO_SERVICES[1].title)!;
  const svcTire = serviceTitleToId.get(DEMO_SERVICES[2].title)!;

  const car1 = carIds[0]!;
  const car2 = carIds[1] ?? carIds[0]!;

  const slot = (isoStart: string, durationMinutes: number) => {
    const scheduledAt = new Date(isoStart);
    const endTime = new Date(scheduledAt.getTime() + durationMinutes * 60_000);
    return { scheduledAt, endTime };
  };

  const specs: Array<{
    carId: string;
    serviceId: string;
    status: BookingStatus;
    isoStart: string;
    durationMinutes: number;
    comment: string;
    history?: Array<{
      from: BookingStatus;
      to: BookingStatus;
      byUserId: string;
      reason: string;
    }>;
    notify?: boolean;
  }> = [
    {
      carId: car1,
      serviceId: svcOil,
      status: BookingStatus.PENDING,
      isoStart: "2026-06-02T07:00:00.000Z",
      durationMinutes: 60,
      comment: `${DEMO_BOOKING_MARKER} новая запись`
    },
    {
      carId: car2,
      serviceId: svcDiag,
      status: BookingStatus.CONFIRMED,
      isoStart: "2026-06-05T07:30:00.000Z",
      durationMinutes: 90,
      comment: `${DEMO_BOOKING_MARKER} подтверждённая`,
      history: [
        {
          from: BookingStatus.PENDING,
          to: BookingStatus.CONFIRMED,
          byUserId: adminId,
          reason: "Демо: подтверждение менеджером"
        }
      ],
      notify: true
    },
    {
      carId: car1,
      serviceId: svcTire,
      status: BookingStatus.COMPLETED,
      isoStart: "2026-05-01T06:45:00.000Z",
      durationMinutes: 45,
      comment: `${DEMO_BOOKING_MARKER} завершённая`,
      history: [
        {
          from: BookingStatus.PENDING,
          to: BookingStatus.CONFIRMED,
          byUserId: adminId,
          reason: "Демо"
        },
        {
          from: BookingStatus.CONFIRMED,
          to: BookingStatus.IN_PROGRESS,
          byUserId: adminId,
          reason: "Демо"
        },
        {
          from: BookingStatus.IN_PROGRESS,
          to: BookingStatus.COMPLETED,
          byUserId: adminId,
          reason: "Демо: работы выполнены"
        }
      ],
      notify: true
    }
  ];

  for (const row of specs) {
    const { scheduledAt, endTime } = slot(row.isoStart, row.durationMinutes);

    const booking = await prisma.booking.create({
      data: {
        userId: clientId,
        carId: row.carId,
        serviceId: row.serviceId,
        scheduledAt,
        endTime,
        status: row.status,
        comment: row.comment
      }
    });

    if (row.history?.length) {
      for (const h of row.history) {
        await prisma.bookingStatusHistory.create({
          data: {
            bookingId: booking.id,
            changedByUserId: h.byUserId,
            fromStatus: h.from,
            toStatus: h.to,
            reason: h.reason
          }
        });
      }
    }

    if (row.notify) {
      await prisma.notification.create({
        data: {
          userId: clientId,
          type: NotificationType.BOOKING_STATUS_CHANGED,
          title: "Демо: статус записи",
          message: `Запись #${booking.id} переведена в статус ${row.status}.`
        }
      });
    }
  }
}

async function main() {
  const roleMap = new Map<AppRoleCode, string>();
  await seedRoles(roleMap);

  const passwordHash = await argon2.hash(DEMO_PASSWORD);
  const byEmail = await upsertDemoUsers(passwordHash, roleMap);

  const clientId = byEmail.get(DEMO_CLIENT_EMAIL);
  const adminEmail = DEMO_USERS.find((u) => u.roleCodes.includes(AppRoleCode.ADMIN))!.email;
  const adminId = byEmail.get(adminEmail);
  if (!clientId || !adminId) {
    throw new Error("Seed: не найден demo client или admin.");
  }

  const serviceTitleToId = await upsertServices();
  const carIds = await upsertClientCars(clientId);

  await removeOldDemoBookings();
  await seedDemoBookings({ clientId, adminId, carIds, serviceTitleToId });

  console.log("Seed OK: роли, демо-пользователи, услуги, автомобили клиента и демо-записи.");
  console.log(`Пароль всех демо-аккаунтов: ${DEMO_PASSWORD}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error("Seed failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
