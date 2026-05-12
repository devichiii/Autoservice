import { IsEnum } from "class-validator";
import { AppRole } from "../../../common/decorators/roles.decorator";

export class SetUserRoleDto {
  @IsEnum(AppRole)
  roleCode!: AppRole;
}
