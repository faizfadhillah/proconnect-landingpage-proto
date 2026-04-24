// auth.service.ts
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { User } from "../users/entities/user.entity"; // Update with the correct path to the user entity
import { DecodedIdToken } from "firebase-admin/lib/auth/token-verifier";
import { FirebaseAdmin, InjectFirebaseAdmin } from "nestjs-firebase";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    @InjectFirebaseAdmin() private readonly firebase: FirebaseAdmin,
  ) {}

  async verifyJwtToken(token: string): Promise<any> {
    return this.jwtService.verifyAsync(token);
  }

  async verifyFirebaseToken(token: string): Promise<DecodedIdToken> {
    return this.firebase.auth.verifyIdToken(token, true).catch((err) => {
      throw new UnauthorizedException(err.message);
    });
  }

  getUserDetail(id: string) {
    return this.userRepository.findOneBy({ id: id });
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (user && (await bcrypt.compare(password, user.firebase_uid))) {
      // Assuming `firebase_uid` is where the hashed password is stored
      return user;
    }
    return null;
  }

  async login(
    email: string,
    password: string,
  ): Promise<{ access_token: string }> {
    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const payload = {
      sub: user.id,
      username: user.email,
      role: user.user_role,
    };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
    };
  }
}
