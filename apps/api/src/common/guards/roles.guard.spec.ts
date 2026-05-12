import { UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AppRole } from "../decorators/roles.decorator";
import { RolesGuard } from "./roles.guard";

describe("RolesGuard regression", () => {
  const reflector = {
    getAllAndOverride: jest.fn()
  } as unknown as jest.Mocked<Reflector>;

  let guard: RolesGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new RolesGuard(reflector);
  });

  function makeContext(user?: { roles: AppRole[] }) {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user })
      })
    } as never;
  }

  it("пропускает маршрут без roles metadata", () => {
    reflector.getAllAndOverride = jest.fn().mockReturnValue(undefined) as never;

    const canActivate = guard.canActivate(makeContext({ roles: [AppRole.CLIENT] }));
    expect(canActivate).toBe(true);
  });

  it("блокирует CLIENT на ADMIN-only endpoint", () => {
    reflector.getAllAndOverride = jest.fn().mockReturnValue([AppRole.ADMIN]) as never;

    const canActivate = guard.canActivate(makeContext({ roles: [AppRole.CLIENT] }));
    expect(canActivate).toBe(false);
  });

  it("разрешает ADMIN на ADMIN-only endpoint", () => {
    reflector.getAllAndOverride = jest.fn().mockReturnValue([AppRole.ADMIN]) as never;

    const canActivate = guard.canActivate(makeContext({ roles: [AppRole.ADMIN] }));
    expect(canActivate).toBe(true);
  });

  it("возвращает 401 когда user отсутствует", () => {
    reflector.getAllAndOverride = jest.fn().mockReturnValue([AppRole.ADMIN]) as never;

    expect(() => guard.canActivate(makeContext(undefined))).toThrow(UnauthorizedException);
  });
});
