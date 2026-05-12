import { ROLES_KEY, AppRole } from "../../common/decorators/roles.decorator";
import { ServicesController } from "./services.controller";

describe("ServicesController RBAC", () => {
  const controller = new ServicesController({} as never);

  it("public endpoints: get list and details без role metadata", () => {
    expect(Reflect.getMetadata(ROLES_KEY, controller.getActiveServices)).toBeUndefined();
    expect(Reflect.getMetadata(ROLES_KEY, controller.getActiveServiceById)).toBeUndefined();
  });

  it("admin endpoints: create/update/delete только ADMIN/SUPER_ADMIN", () => {
    const expected = [AppRole.ADMIN, AppRole.SUPER_ADMIN];
    expect(Reflect.getMetadata(ROLES_KEY, controller.createService)).toEqual(expected);
    expect(Reflect.getMetadata(ROLES_KEY, controller.updateService)).toEqual(expected);
    expect(Reflect.getMetadata(ROLES_KEY, controller.deleteService)).toEqual(expected);
  });
});
