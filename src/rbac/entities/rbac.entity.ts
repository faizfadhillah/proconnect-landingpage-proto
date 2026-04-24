// src\rbac\entities\rbac.entity.ts
import { Entity, Column } from "typeorm";
import { BaseEntity } from "../../base.entity";
import { ApiProperty } from "@nestjs/swagger";

export enum RbacType {
  role = "role",
  permission = "permission",
  route = "route",
  sub_role = "sub_role",
}

export enum RbacMethod {
  ALL = "ALL",
  GET = "GET",
  POST = "POST",
  PATCH = "PATCH",
  DELETE = "DELETE",
}

@Entity("rbac")
export class Rbac extends BaseEntity {
  @ApiProperty({
    description: "The of type the role/routes",
    example: "role",
    enum: RbacType,
  })
  @Column({ type: "enum", enum: RbacType })
  type: RbacType;

  @ApiProperty({
    description: "The name of the role",
    example: "Admin",
    maxLength: 255,
  })
  @Column({ length: 255 })
  name: string;

  @ApiProperty({
    description: "The parent role of the RBAC entry",
    example: "employer",
  })
  @Column({ name: "parent_role", length: 255 })
  parent_role: string;

  @ApiProperty({
    description: "The method of the routes",
    example: "PATCH",
    enum: RbacMethod,
  })
  @Column({ type: "enum", enum: RbacMethod })
  method: RbacMethod | any;

  @ApiProperty({
    description: "The description of the role",
    example: "Owner of HQ",
    maxLength: 255,
  })
  @Column({ length: 255 })
  description: string;

  @ApiProperty({
    description: "The permissions associated with the role",
    example: '["read", "write", "delete"]',
  })
  @Column("jsonb")
  meta: any;
}
