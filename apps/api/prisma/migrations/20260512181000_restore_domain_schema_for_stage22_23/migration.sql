-- Drop dependent tables first (safe on local dev reset path).
DROP TABLE IF EXISTS `BookingStatusHistory`;
DROP TABLE IF EXISTS `Booking`;
DROP TABLE IF EXISTS `BookingSlot`;
DROP TABLE IF EXISTS `Notification`;
DROP TABLE IF EXISTS `Service`;

-- Recreate Service with fields expected by backend/frontend.
CREATE TABLE `Service` (
  `id` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `description` VARCHAR(191) NULL,
  `durationMinutes` INTEGER NOT NULL,
  `price` DECIMAL(10, 2) NOT NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Recreate Booking with schedule window fields.
CREATE TABLE `Booking` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `carId` VARCHAR(191) NOT NULL,
  `serviceId` VARCHAR(191) NOT NULL,
  `scheduledAt` DATETIME(3) NOT NULL,
  `endTime` DATETIME(3) NOT NULL,
  `status` ENUM(
    'PENDING',
    'CONFIRMED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELED'
  ) NOT NULL DEFAULT 'PENDING',
  `comment` VARCHAR(191) NULL,
  `statusComment` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  INDEX `Booking_userId_idx`(`userId`),
  INDEX `Booking_scheduledAt_endTime_status_idx`(`scheduledAt`, `endTime`, `status`),
  INDEX `Booking_status_createdAt_idx`(`status`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Recreate BookingStatusHistory with actor relation.
CREATE TABLE `BookingStatusHistory` (
  `id` VARCHAR(191) NOT NULL,
  `bookingId` VARCHAR(191) NOT NULL,
  `changedByUserId` VARCHAR(191) NOT NULL,
  `fromStatus` ENUM(
    'PENDING',
    'CONFIRMED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELED'
  ) NOT NULL,
  `toStatus` ENUM(
    'PENDING',
    'CONFIRMED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELED'
  ) NOT NULL,
  `reason` VARCHAR(191) NULL,
  `changedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `BookingStatusHistory_changedByUserId_changedAt_idx`(`changedByUserId`, `changedAt`),
  INDEX `BookingStatusHistory_bookingId_changedAt_idx`(`bookingId`, `changedAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Recreate Notification with read state and delivery status fields.
CREATE TABLE `Notification` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `type` ENUM('BOOKING_CREATED', 'BOOKING_STATUS_CHANGED', 'SYSTEM') NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `message` TEXT NOT NULL,
  `isRead` BOOLEAN NOT NULL DEFAULT false,
  `readAt` DATETIME(3) NULL,
  `deliveryStatus` ENUM('PENDING', 'DELIVERED', 'FAILED') NOT NULL DEFAULT 'PENDING',
  `deliveredAt` DATETIME(3) NULL,
  `deliveryError` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Add foreign keys.
ALTER TABLE `Booking`
  ADD CONSTRAINT `Booking_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`)
      ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `Booking`
  ADD CONSTRAINT `Booking_carId_fkey`
    FOREIGN KEY (`carId`) REFERENCES `Car`(`id`)
      ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `Booking`
  ADD CONSTRAINT `Booking_serviceId_fkey`
    FOREIGN KEY (`serviceId`) REFERENCES `Service`(`id`)
      ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `BookingStatusHistory`
  ADD CONSTRAINT `BookingStatusHistory_bookingId_fkey`
    FOREIGN KEY (`bookingId`) REFERENCES `Booking`(`id`)
      ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `BookingStatusHistory`
  ADD CONSTRAINT `BookingStatusHistory_changedByUserId_fkey`
    FOREIGN KEY (`changedByUserId`) REFERENCES `User`(`id`)
      ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `Notification`
  ADD CONSTRAINT `Notification_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`)
      ON DELETE CASCADE ON UPDATE CASCADE;
