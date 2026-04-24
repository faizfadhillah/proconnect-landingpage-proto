import { Injectable, Logger } from "@nestjs/common";
import { promises as fs } from "fs";
import * as path from "path";
import * as fs2 from "fs";
import { v4 as uuidv4 } from "uuid";
import { MstProfession } from "src/mst_professions/entities/mst_profession.entity";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";

interface JobTitle {
  id: string;
  name: string;
  level: number;
  parent_id: string | null;
}

@Injectable()
export class ProfessionService {
  private readonly jobTitlesFile = "console/data/job-title.txt";
  private readonly outputJsonFile = "console/data/job-title.json";
  private readonly logger = new Logger(ProfessionService.name);

  constructor(
    @InjectRepository(MstProfession)
    private readonly regionRepository: Repository<MstProfession>,
  ) {}

  async run(): Promise<void> {
    const jobTitles = await this.readJobTitles();
    const jobTitleData = this.transformJobTitles(jobTitles);
    await this.saveToJsonFile(jobTitleData);
    await this.insertRegionsFromJson();
  }

  private async readJobTitles(): Promise<string[]> {
    const fileContent = await fs.readFile(this.jobTitlesFile, "utf-8");
    return fileContent
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }

  private transformJobTitles(jobTitles: string[]): JobTitle[] {
    const jobTitleData: JobTitle[] = [];
    const parentMap = new Map<string, string>();

    jobTitles.forEach((name) => {
      const id = uuidv4();
      const level = this.getLevelFromTitle(name);
      const parent_id = parentMap.get(name) || null;

      jobTitleData.push({
        id,
        name,
        level,
        parent_id,
      });

      // Set parent ID for hierarchical titles (e.g., "1st grade teacher" could be parent for "2nd grade teacher")
      if (level && name.includes("teacher")) {
        parentMap.set(`grade teacher ${level + 1}`, id);
      }
    });

    return jobTitleData;
  }

  private getLevelFromTitle(title: string): number {
    const match = title.match(/^(\d+)(st|nd|rd|th)/);
    return match ? parseInt(match[1]) : 0;
  }

  private async saveToJsonFile(data: JobTitle[]): Promise<void> {
    await fs.writeFile(
      this.outputJsonFile,
      JSON.stringify(data, null, 2),
      "utf-8",
    );
  }

  async insertRegionsFromJson() {
    try {
      // Load the JSON data
      const dataPath = path.join(__dirname, "data/job-title.json");

      const data = JSON.parse(fs2.readFileSync(dataPath, "utf-8"));

      // Transform JSON data into an array of MstRegion entities
      const regions = data.map((region: any) => {
        const newRegion = new MstProfession();
        newRegion.id = region.id;
        newRegion.name = region.name;
        newRegion.level = region.level;
        newRegion.parent_id = region.parent_id || null;

        return newRegion;
      });

      // Use bulk insert by passing all entities at once
      await this.regionRepository.save(regions, { chunk: 500 }); // Adjust chunk size if needed

      this.logger.log("Professions successfully inserted in bulk");
    } catch (error) {
      this.logger.error(`Error inserting profession: ${error.message}`);
    }
  }
}
