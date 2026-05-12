import { AppRoleCode, BookingStatus, NotificationType, PrismaClient } from "@prisma/client";
import * as argon2 from "argon2";

const prisma = new PrismaClient();
const DEMO_PASSWORD = "Password123!";

const ROLE_TITLES: Record<AppRoleCode, string> = {
  CLIENT: "Client",
  MANAGER: "Manager",
  ADMIN: "Administrator",
  SUPER_ADMIN: "Super Administrator"
};

type DemoUser = {
  email: string;
  firstName: string;
  lastName: string;
  roles: AppRoleCode[];
};

const DEMO_USERS: DemoUser[] = [
  {
    email: "client@example.com",
    firstName: "Ivan",
    lastName: "Petrov",
    roles: [AppRoleCode.CLIENT]
  },
  {
    email: "client2@example.com",
    firstName: "Anna",
    lastName: "Sidorova",
    roles: [AppRoleCode.CLIENT]
  },
  {
    email: "manager@example.com",
    firstName: "Maksim",
    lastName: "Smirnov",
    roles: [AppRoleCode.MANAGER]
  },
  {
    email: "admin@example.com",
    firstName: "Olga",
    lastName: "Kuznetsova",
    roles: [AppRoleCode.ADMIN]
  },
  {
    email: "superadmin@example.com",
    firstName: "Sergey",
    lastName: "Ivanov",
    roles: [AppRoleCode.SUPER_ADMIN]
  }
];

const DEMO_SERVICES = [
  {
    title: "Замена масла",
    description: "Замена моторного масла и масляного фильтра.",
    durationMinutes: 45,
    price: 2500
  },
  {
    title: "Диагностика двигателя",
    description: "Комплексная проверка системы двигателя.",
    durationMinutes: 60,
    price: 3200
  },
  {
    title: "Замена тормозных колодок",
    description: "Передняя ось, с базовой проверкой тормозной системы.",
    durationMinutes: 90,
    price: 4800
  },
  {
    title: "Шиномонтаж",
    description: "Снятие, балансировка и установка комплекта колес.",
    durationMinutes: 60,
    price: 3000
  },
  {
    title: "Компьютерная диагностика",
    description: "Считывание ошибок ЭБУ и базовый отчет.",
    durationMinutes: 40,
    price: 2200
  }
];

const DEMO_CARS = [
  {
    ownerEmail: "client@example.com",
    brand: "Toyota",
    model: "Camry",
    year: 2020,
    vin: "JTNB11HK0L3000001",
    plateNumber: "A111AA777"
  },
  {
    ownerEmail: "client@example.com",
    brand: "Hyundai",
    model: "Solaris",
    year: 2019,
    vin: "Z94CU41DBKR000002",
    plateNumber: "B222BB777"
  },
  {
    ownerEmail: "client2@example.com",
    brand: "Kia",
    model: "Rio",
    year: 2021,
    vin: "Z94C241BBMR000003",
    plateNumber: "C333CC777"
  }
];

function daysFromNowAtHour(daysFromNow: number, hour: number, minute = 0): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysFromNow, hour, minute, 0, 0)
  );
}

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

  const roleMap = new Map<AppRoleCode, string>();
  const roles = await prisma.role.findMany();
  for (const role of roles) {
    roleMap.set(role.code, role.id);
  }

  const passwordHash = await argon2.hash(DEMO_PASSWORD);
  const userMap = new Map<string, string>();

  for (const user of DEMO_USERS) {
    const savedUser = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: true
      },
      create: {
        email: user.email,
        passwordHash,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: true
      }
    });
    userMap.set(user.email, savedUser.id);

    for (const roleCode of user.roles) {
      const roleId = roleMap.get(roleCode);
      if (!roleId) {
        continue;
      }
      await prisma.userRole.upsert({
        where: {
          userId_roleId: {
            userId: savedUser.id,
            roleId
          }
        },
        update: {},
        create: {
          userId: savedUser.id,
          roleId
        }
      });
    }
  }

  const serviceMap = new Map<string, string>();
  for (const service of DEMO_SERVICES) {
    const existingService = await prisma.service.findFirst({
      where: { title: service.title }
    });

    const savedService = existingService
      ? await prisma.service.update({
          where: { id: existingService.id },
          data: {
            title: service.title,
            description: service.description,
            durationMinutes: service.durationMinutes,
            price: service.price,
            isActive: true
          }
        })
      : await prisma.service.create({
          data: {
            title: service.title,
            description: service.description,
            durationMinutes: service.durationMinutes,
            price: service.price,
            isActive: true
          }
        });

    serviceMap.set(service.title, savedService.id);
  }

  const carMap = new Map<string, string>();
  for (const car of DEMO_CARS) {
    const ownerId = userMap.get(car.ownerEmail);
    if (!ownerId) {
      continue;
    }

    const savedCar = await prisma.car.upsert({
      where: { vin: car.vin },
      update: {
        userId: ownerId,
        brand: car.brand,
        model: car.model,
        year: car.year,
        plateNumber: car.plateNumber
      },
      create: {
        userId: ownerId,
        brand: car.brand,
        model: car.model,
        year: car.year,
        vin: car.vin,
        plateNumber: car.plateNumber
      }
    });
    carMap.set(car.vin, savedCar.id);
  }

  const demoBookingInputs = [
    {
      marker: "[DEMO-BOOKING-001]",
      ownerEmail: "client@example.com",
      carVin: "JTNB11HK0L3000001",
      serviceTitle: "Замена масла",
      scheduledAt: daysFromNowAtHour(1, 10),
      status: BookingStatus.PENDING
    },
    {
      marker: "[DEMO-BOOKING-002]",
      ownerEmail: "client@example.com",
      carVin: "Z94CU41DBKR000002",
      serviceTitle: "Диагностика двигателя",
      scheduledAt: daysFromNowAtHour(2, 12),
      status: BookingStatus.CONFIRMED
    },
    {
      marker: "[DEMO-BOOKING-003]",
      ownerEmail: "client2@example.com",
      carVin: "Z94C241BBMR000003",
      serviceTitle: "Шиномонтаж",
      scheduledAt: daysFromNowAtHour(3, 14),
      status: BookingStatus.COMPLETED
    },
    {
      marker: "[DEMO-BOOKING-004]",
      ownerEmail: "client2@example.com",
      carVin: "Z94C241BBMR000003",
      serviceTitle: "Компьютерная диагностика",
      scheduledAt: daysFromNowAtHour(4, 16),
      status: BookingStatus.CANCELED
    }
  ];

  for (const input of demoBookingInputs) {
    const userId = userMap.get(input.ownerEmail);
    const carId = carMap.get(input.carVin);
    const serviceId = serviceMap.get(input.serviceTitle);
    if (!userId || !carId || !serviceId) {
      continue;
    }

    const existingBooking = await prisma.booking.findFirst({
      where: { comment: input.marker }
    });

    const endTime = new Date(input.scheduledAt.getTime() + 60 * 60_000);

    const booking = existingBooking
      ? await prisma.booking.update({
          where: { id: existingBooking.id },
          data: {
            userId,
            carId,
            serviceId,
            scheduledAt: input.scheduledAt,
            endTime,
            status: input.status
          }
        })
      : await prisma.booking.create({
          data: {
            userId,
            carId,
            serviceId,
            scheduledAt: input.scheduledAt,
            endTime,
            status: input.status,
            comment: input.marker
          }
        });

    if (input.status !== BookingStatus.PENDING) {
      const historyExists = await prisma.bookingStatusHistory.findFirst({
        where: {
          bookingId: booking.id,
          toStatus: input.status
        }
      });

      if (!historyExists) {
        await prisma.bookingStatusHistory.create({
          data: {
            bookingId: booking.id,
            changedByUserId: userId,
            fromStatus: BookingStatus.PENDING,
            toStatus: input.status,
            reason: "Demo seed status setup."
          }
        });
      }
    }
  }

  const clientUserId = userMap.get("client@example.com");
  if (clientUserId) {
    const welcomeNotification = await prisma.notification.findFirst({
      where: {
        userId: clientUserId,
        title: "Добро пожаловать в demo-режим"
      }
    });

    if (!welcomeNotification) {
      await prisma.notification.create({
        data: {
          userId: clientUserId,
          type: NotificationType.SYSTEM,
          title: "Добро пожаловать в demo-режим",
          message: "Это демонстрационные данные для локального показа проекта."
        }
      });
    }
  }

  console.log("Seed completed.");
  console.log("Demo credentials (local only):");
  console.log("CLIENT: client@example.com / Password123!");
  console.log("CLIENT-2: client2@example.com / Password123!");
  console.log("MANAGER: manager@example.com / Password123!");
  console.log("ADMIN: admin@example.com / Password123!");
  console.log("SUPER_ADMIN: superadmin@example.com / Password123!");
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
