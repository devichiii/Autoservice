-- CreateTable
CREATE TABLE `User` (
  `id` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `passwordHash` VARCHAR(191) NOT NULL,
  `refreshTokenHash` VARCHAR(191) NULL,
  `firstName` VARCHAR(191) NOT NULL,
  `lastName` VARCHAR(191) NOT NULL,
  `phone` VARCHAR(191) NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `User_email_key`(`email`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Role` (
  `id` VARCHAR(191) NOT NULL,
  `code` ENUM('CLIENT', 'MANAGER', 'ADMIN', 'SUPER_ADMIN') NOT NULL,
  `title` VARCHAR(191) NOT NULL,

  UNIQUE INDEX `Role_code_key`(`code`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserRole` (
  `userId` VARCHAR(191) NOT NULL,
  `roleId` VARCHAR(191) NOT NULL,
  `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`userId`, `roleId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Car` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `brand` VARCHAR(191) NOT NULL,
  `model` VARCHAR(191) NOT NULL,
  `year` INTEGER NULL,
  `vin` VARCHAR(191) NULL,
  `plateNumber` VARCHAR(191) NULL,
  `notes` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `Car_vin_key`(`vin`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Service` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `durationMinutes` INTEGER NOT NULL,
  `basePrice` DECIMAL(10, 2) NOT NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BookingSlot` (
  `id` VARCHAR(191) NOT NULL,
  `startsAt` DATETIME(3) NOT NULL,
  `endsAt` DATETIME(3) NOT NULL,
  `capacity` INTEGER NOT NULL,
  `reservedCount` INTEGER NOT NULL DEFAULT 0,
  `isBlocked` BOOLEAN NOT NULL DEFAULT false,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Booking` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `carId` VARCHAR(191) NOT NULL,
  `serviceId` VARCHAR(191) NOT NULL,
  `slotId` VARCHAR(191) NOT NULL,
  `status` ENUM(
    'PENDING',
    'CONFIRMED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED_BY_CLIENT',
    'CANCELLED_BY_MANAGER',
    'NO_SHOW'
  ) NOT NULL DEFAULT 'PENDING',
  `comment` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  INDEX `Booking_userId_idx`(`userId`),
  INDEX `Booking_status_createdAt_idx`(`status`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BookingStatusHistory` (
  `id` VARCHAR(191) NOT NULL,
  `bookingId` VARCHAR(191) NOT NULL,
  `fromStatus` ENUM(
    'PENDING',
    'CONFIRMED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED_BY_CLIENT',
    'CANCELLED_BY_MANAGER',
    'NO_SHOW'
  ) NOT NULL,
  `toStatus` ENUM(
    'PENDING',
    'CONFIRMED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED_BY_CLIENT',
    'CANCELLED_BY_MANAGER',
    'NO_SHOW'
  ) NOT NULL,
  `reason` VARCHAR(191) NULL,
  `changedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `BookingStatusHistory_bookingId_changedAt_idx`(`bookingId`, `changedAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Notification` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `channel` VARCHAR(191) NOT NULL,
  `payload` TEXT NOT NULL,
  `status` VARCHAR(191) NOT NULL,
  `sentAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuditLog` (
  `id` VARCHAR(191) NOT NULL,
  `actorUserId` VARCHAR(191) NOT NULL,
  `action` VARCHAR(191) NOT NULL,
  `resourceType` VARCHAR(191) NOT NULL,
  `resourceId` VARCHAR(191) NOT NULL,
  `metadataJson` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `AuditLog_actorUserId_createdAt_idx`(`actorUserId`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SystemSetting` (
  `key` VARCHAR(191) NOT NULL,
  `value` TEXT NOT NULL,
  `updatedBy` VARCHAR(191) NOT NULL,
  `updatedAt` DATETIME(3) NOT NULL,

  PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UserRole`
  ADD CONSTRAINT `UserRole_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`)
      ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserRole`
  ADD CONSTRAINT `UserRole_roleId_fkey`
    FOREIGN KEY (`roleId`) REFERENCES `Role`(`id`)
      ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Car`
  ADD CONSTRAINT `Car_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`)
      ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Booking`
  ADD CONSTRAINT `Booking_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`)
      ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Booking`
  ADD CONSTRAINT `Booking_carId_fkey`
    FOREIGN KEY (`carId`) REFERENCES `Car`(`id`)
      ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Booking`
  ADD CONSTRAINT `Booking_serviceId_fkey`
    FOREIGN KEY (`serviceId`) REFERENCES `Service`(`id`)
      ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Booking`
  ADD CONSTRAINT `Booking_slotId_fkey`
    FOREIGN KEY (`slotId`) REFERENCES `BookingSlot`(`id`)
      ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BookingStatusHistory`
  ADD CONSTRAINT `BookingStatusHistory_bookingId_fkey`
    FOREIGN KEY (`bookingId`) REFERENCES `Booking`(`id`)
      ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification`
  ADD CONSTRAINT `Notification_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`)
      ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuditLog`
  ADD CONSTRAINT `AuditLog_actorUserId_fkey`
    FOREIGN KEY (`actorUserId`) REFERENCES `User`(`id`)
      ON DELETE RESTRICT ON UPDATE CASCADE;
