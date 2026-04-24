import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, EntityManager, IsNull, In, Not } from "typeorm";
import { UserCertificate } from "./entities/user_certificates.entity";

@Injectable()
export class UserCertificateDao {
  constructor(
    @InjectRepository(UserCertificate)
    private userCertificateRepository: Repository<UserCertificate>,
  ) {}

  /**
   * Save certificate
   */
  async save(
    certificate: UserCertificate,
    manager?: EntityManager,
  ): Promise<UserCertificate> {
    const repo = manager
      ? manager.getRepository(UserCertificate)
      : this.userCertificateRepository;
    return repo.save(certificate);
  }

  /**
   * Find all certificates by user ID and license ID
   * Returns multiple certificates if they exist (one per education)
   */
  async findAllByUserAndLicense(
    userId: string,
    licenseId: string,
    manager?: EntityManager,
  ): Promise<UserCertificate[]> {
    const repo = manager
      ? manager.getRepository(UserCertificate)
      : this.userCertificateRepository;
    return repo.find({
      where: {
        user_id: userId,
        mst_license_id: licenseId,
        deleted_at: IsNull(),
      },
    });
  }

  /**
   * Find all certificates for multiple users in one query
   * Used for bulk fetching certificates for student response
   */
  async findByUserIds(
    userIds: string[],
    manager?: EntityManager,
  ): Promise<UserCertificate[]> {
    const repo = manager
      ? manager.getRepository(UserCertificate)
      : this.userCertificateRepository;

    if (userIds.length === 0) {
      return [];
    }

    return repo.find({
      where: {
        user_id: In(userIds),
        deleted_at: IsNull(),
      },
      relations: ["mst_license"],
    });
  }

  /**
   * Find all certificates for multiple users in one query
   * Used for bulk fetching certificates for student response
   */
  async findByUserIdsWithEducation(
    userIds: string[],
    manager?: EntityManager,
  ): Promise<UserCertificate[]> {
    const repo = manager
      ? manager.getRepository(UserCertificate)
      : this.userCertificateRepository;

    if (userIds.length === 0) {
      return [];
    }

    return repo.find({
      where: {
        user_id: In(userIds),
        user_education_id: Not(IsNull()),
        deleted_at: IsNull(),
      },
      relations: ["mst_license"],
    });
  }

  /**
   * Find all certificates by user education ID
   */
  async findByUserEducationId(
    userEducationId: string,
    manager?: EntityManager,
  ): Promise<UserCertificate[]> {
    const repo = manager
      ? manager.getRepository(UserCertificate)
      : this.userCertificateRepository;
    return repo.find({
      where: {
        user_education_id: userEducationId,
        deleted_at: IsNull(),
      },
    });
  }

  /**
   * Find certificate by user ID, license ID, and user education ID
   */
  async findByUserLicenseAndEducation(
    userId: string,
    licenseId: string,
    userEducationId: string,
    manager?: EntityManager,
  ): Promise<UserCertificate | null> {
    const repo = manager
      ? manager.getRepository(UserCertificate)
      : this.userCertificateRepository;
    return repo.findOne({
      where: {
        user_id: userId,
        mst_license_id: licenseId,
        user_education_id: userEducationId,
        deleted_at: IsNull(),
      },
    });
  }

  /**
   * Soft delete certificate by ID
   */
  async softDelete(id: string, manager?: EntityManager): Promise<void> {
    const repo = manager
      ? manager.getRepository(UserCertificate)
      : this.userCertificateRepository;
    const result = await repo.softDelete(id);
    if (result.affected === 0) {
      throw new Error(`Certificate with ID ${id} not found for deletion`);
    }
  }
}
