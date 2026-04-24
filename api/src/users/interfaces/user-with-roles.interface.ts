import { User } from "../entities/user.entity";

export interface UserWithRoles extends User {
  isSysAdmin?: boolean;
  isCandidate?: boolean;
  isEmployer?: boolean;
}