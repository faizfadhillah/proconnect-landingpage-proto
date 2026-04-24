import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsArray } from "class-validator";

export class RevokeRouteDto {
  @ApiProperty({
    description: "Role from which the route is revoked",
    example: "admin",
  })
  @IsString()
  rolePermission: string;

  @ApiProperty({
    description: "Route name(s) to be revoked",
    example: ["/users/*", "/rbac"],
  })
  @IsArray()
  @IsString({ each: true })
  routes: string[];
}
