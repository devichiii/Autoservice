import { Controller, Get, INestApplication, Module, Req, UseGuards } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Test } from "@nestjs/testing";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, ExtractJwt } from "passport-jwt";
import * as request from "supertest";
import { JwtAuthGuard } from "../src/common/guards/jwt-auth.guard";

class TestJwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: "test-access-secret"
    });
  }

  validate(payload: unknown) {
    return payload;
  }
}

@Controller("auth")
class TestAuthController {
  @Get("me")
  @UseGuards(JwtAuthGuard)
  me(@Req() requestArg: { user: unknown }) {
    return { user: requestArg.user };
  }
}

@Module({
  controllers: [TestAuthController],
  providers: [TestJwtStrategy]
})
class TestAppModule {}

describe("Auth guard e2e regression", () => {
  let app: INestApplication;
  const jwtService = new JwtService({ secret: "test-access-secret" });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [TestAppModule]
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /auth/me без токена -> 401", async () => {
    await request(app.getHttpServer()).get("/auth/me").expect(401);
  });

  it("GET /auth/me с валидным токеном -> 200", async () => {
    const token = await jwtService.signAsync({
      sub: "clientA",
      email: "client@example.com",
      roles: ["CLIENT"]
    });

    const response = await request(app.getHttpServer())
      .get("/auth/me")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(response.body.user.sub).toBe("clientA");
  });
});
