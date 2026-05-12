import { ROLES_KEY, AppRole } from "../../common/decorators/roles.decorator";
import { BookingsController } from "./bookings.controller";

describe("BookingsController RBAC metadata regression", () => {
  const controller = new BookingsController({} as never);

  it("create/listMy/cancel не должны требовать role metadata (только auth + ownership)", () => {
    expect(Reflect.getMetadata(ROLES_KEY, controller.create)).toBeUndefined();
    expect(Reflect.getMetadata(ROLES_KEY, controller.listMy)).toBeUndefined();
    expect(Reflect.getMetadata(ROLES_KEY, controller.cancel)).toBeUndefined();
  });

  it("admin endpoints должны иметь MANAGER+ metadata", () => {
    expect(Reflect.getMetadata(ROLES_KEY, controller.listAll)).toEqual([
      AppRole.MANAGER,
      AppRole.ADMIN,
      AppRole.SUPER_ADMIN
    ]);
    expect(Reflect.getMetadata(ROLES_KEY, controller.updateStatus)).toEqual([
      AppRole.MANAGER,
      AppRole.ADMIN,
      AppRole.SUPER_ADMIN
    ]);
  });
});
