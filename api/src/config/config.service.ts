import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateConfigDto } from "./dto/create-config.dto";
import { UpdateConfigDto } from "./dto/update-config.dto";
import { Config } from "./entities/config.entity";
import { CONFIG_SEED_DATA } from "./config.seed.constants";
import { LoggingService } from "src/logs/logs.service";

@Injectable()
export class ConfigsService {
  constructor(
    @InjectRepository(Config)
    private configRepository: Repository<Config>,
    private readonly loggingService: LoggingService,
  ) {}

  async create(createConfigDto: CreateConfigDto): Promise<Config> {
    const config = this.configRepository.create(createConfigDto);
    return await this.configRepository.save(config);
  }

  async findAll(): Promise<Config[]> {
    return await this.configRepository.find();
  }

  async findOne(id: string): Promise<Config> {
    const config = await this.configRepository.findOne({ where: { id } });
    if (!config) {
      throw new NotFoundException(`Config with ID ${id} not found`);
    }
    return config;
  }

  async update(id: string, updateConfigDto: UpdateConfigDto): Promise<Config> {
    const config = await this.findOne(id);
    Object.assign(config, updateConfigDto);
    return await this.configRepository.save(config);
  }

  async remove(id: string): Promise<void> {
    const result = await this.configRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Config with ID ${id} not found`);
    }
  }

  async findByKey(key: string): Promise<Config> {
    const config = await this.configRepository.findOne({ where: { key } });
    if (!config) {
      throw new NotFoundException(`Config with key ${key} not found`);
    }
    return config;
  }

  /**
   * Get config value by key. Returns defaultValue when key is not found.
   */
  async getValueByKey<T = string>(key: string, defaultValue: T): Promise<T> {
    const config = await this.configRepository.findOne({ where: { key } });
    if (!config || config.value == null) {
      return defaultValue;
    }
    return (config.value as T) ?? defaultValue;
  }

  private async seedConfig(key: string, description: string, values: any[]): Promise<void> {
    try {
      // Check if config already exists
      const existingConfig = await this.configRepository.findOne({
        where: { key },
      });

      if (existingConfig) {
        this.loggingService.log(`Config '${key}' already exists. Skipping seed.`, 'config-seed');
        return;
      }

      // Create new config
      const config = this.configRepository.create({
        key,
        description,
        value: values,
      });

      await this.configRepository.save(config);
      this.loggingService.log(`Config '${key}' seeded successfully`, 'config-seed');
    } catch (error) {
      this.loggingService.error(`Failed to seed config '${key}': ${error instanceof Error ? error.message : String(error)}`, 'config-seed', error instanceof Error ? error.stack : undefined);
    }
  }

  async seedAllConfigs(): Promise<void> {
    for (const seedData of CONFIG_SEED_DATA) {
      await this.seedConfig(seedData.key, seedData.description, seedData.values);
    }
  }
}
