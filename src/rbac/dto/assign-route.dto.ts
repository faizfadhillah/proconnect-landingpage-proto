import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsArray } from "class-validator";

export class AssignRouteDto {
  @ApiProperty({
    description: "Role to which the route is assigned",
    example: "admin",
  })
  @IsString()
  rolePermission: string;

  @ApiProperty({
    description: "Route name(s) to be assigned",
    example: ["/users/*", "/rbac"],
  })
  @IsArray()
  @IsString({ each: true })
  routes: string[];
}
