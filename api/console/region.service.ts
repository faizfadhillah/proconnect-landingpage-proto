import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as fs from "fs";
import * as path from "path";
import { MstRegion } from "src/mst_regions/entities/mst_region.entity";

interface Wilayah {
  id: string;
  name: string;
  parent_id: string | null;
  full_name?: string;
  type: string;
}

@Injectable()
export class RegionService {
  private readonly logger = new Logger(RegionService.name);

  constructor(
    @InjectRepository(MstRegion)
    private readonly regionRepository: Repository<MstRegion>,
  ) {}

  async run() {
    const filePath = path.join(__dirname, "./data/wilayah.sql");
    const sqlData = fs.readFileSync(filePath, "utf-8");
    const wilayahData = this.parseWilayahData(sqlData);

    const wilayahDataWithFullNames = this.generateFullNames(wilayahData);

    const jsonOutputPath = path.join(__dirname, "./data/wilayah.json");
    fs.writeFileSync(
      jsonOutputPath,
      JSON.stringify(wilayahDataWithFullNames, null, 2),
    );

    await this.insertRegionsFromJson();
  }

  private parseWilayahData(sqlData: string): Wilayah[] {
    const wilayahArray: Wilayah[] = [];
    const insertRegex =
      /INSERT INTO wilayah \(kode, nama\)\s*VALUES\s*\(([^;]+)\);/g;
    let match;

    while ((match = insertRegex.exec(sqlData)) !== null) {
      const values = match[1]
        .split(/\),\s*\(/)
        .map((row) => row.replace(/[()]/g, "").split(","));

      values.forEach(([kode, nama]) => {
        const kodeTrimmed = kode.replace(/'/g, "").trim();
        const namaTrimmed = nama.replace(/'/g, "").trim().toUpperCase();
        const parent_id = this.getParentId(kodeTrimmed);
        const type = this.getType(kodeTrimmed);

        wilayahArray.push({
          id: kodeTrimmed,
          name: namaTrimmed,
          parent_id,
          type,
        });
      });
    }

    return wilayahArray;
  }

  private getParentId(kode: string): string | null {
    const kodeParts = kode.split(".");
    if (kodeParts.length === 1) return null; // Provinsi
    if (kodeParts.length === 2) return kodeParts[0]; // Kabupaten/Kota
    if (kodeParts.length === 3) return `${kodeParts[0]}.${kodeParts[1]}`; // Kecamatan
    if (kodeParts.length === 4)
      return `${kodeParts[0]}.${kodeParts[1]}.${kodeParts[2]}`; // Desa/Kelurahan
    return null;
  }

  private getType(kode: string): string {
    const kodeParts = kode.split(".");
    if (kodeParts.length === 1) return "PROVINSI";
    if (kodeParts.length === 2) return "KOTA";
    if (kodeParts.length === 3) return "KECAMATAN";
    if (kodeParts.length === 4) return "KELURAHAN";
    return "UNKNOWN";
  }

  private generateFullNames(wilayahArray: Wilayah[]): Wilayah[] {
    const wilayahMap = new Map(
      wilayahArray.map((wilayah) => [wilayah.id, wilayah]),
    );

    wilayahArray.forEach((wilayah) => {
      wilayah.full_name = this.capitalizeFullName(
        this.getFullName(wilayah, wilayahMap),
      );
    });

    return wilayahArray;
  }

  private getFullName(
    wilayah: Wilayah,
    wilayahMap: Map<string, Wilayah>,
  ): string {
    if (!wilayah.parent_id) {
      return wilayah.name;
    }
    const parent = wilayahMap.get(wilayah.parent_id);
    if (parent) {
      return `${wilayah.name}, ${this.getFullName(parent, wilayahMap)}`;
    }
    return wilayah.name;
  }

  private capitalizeFullName(fullName: string): string {
    return fullName
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  private async insertRegions(wilayahData: Wilayah[]) {
    for (const regionData of wilayahData) {
      const region = new MstRegion();
      region.id = regionData.id;
      region.name = regionData.name;
      region.type = regionData.type;
      region.full_name = regionData.full_name!;
      region.parent_id = regionData.parent_id;

      try {
        await this.regionRepository.save(region);
      } catch (error) {
        console.error(`Error inserting region ${region.id}:`, error);
      }
    }
  }

  async insertRegionsFromJson() {
    try {
      // Load the JSON data
      const dataPath = path.join(__dirname, "data/wilayah.json");
      const data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

      const regions = data.map((region: any) => {
        const newRegion = new MstRegion();
        newRegion.id = region.id;
        newRegion.name = region.name;
        newRegion.type = region.type;
        newRegion.parent_id = region.parent_id || null;
        newRegion.full_name = region.full_name;
        return newRegion;
      });

      // Use bulk insert by passing all entities at once
      await this.regionRepository.save(regions, { chunk: 500 });

      this.logger.log("Regions successfully inserted in bulk");
    } catch (error) {
      this.logger.error(`Error inserting regions: ${error.message}`);
    }
  }
}
