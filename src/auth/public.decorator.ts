import { SetMetadata } from "@nestjs/common";
import { UserRoles } from "./enum/role.enum";

export const IS_PUBLIC_KEY = "isPublic";
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const Roles = (...roles: UserRoles[]) => SetMetadata(Roles, roles);
