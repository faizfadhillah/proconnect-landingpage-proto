import { NestFactory } from "@nestjs/core";
import { ConsoleModule } from "./console.module";
import { RegionService } from "./region.service";
import { ProfessionService } from "./profession.service";
import { JobSlugSeedService } from "./job-slug-seed.service";

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(ConsoleModule);

  // Uncomment the service you want to run
  // const wilayahConverterService = app.get(RegionService);
  // const professionService = app.get(ProfessionService);
  const jobSlugSeedService = app.get(JobSlugSeedService);

  try {
    //await wilayahConverterService.run();
    //await professionService.run();
    await jobSlugSeedService.run();

    await app.close();
    return { message: "Job slug generation completed successfully" };
  } catch (error) {
    console.log(error);
    await app.close();
    return { error: error.message };
  }
}

bootstrap();
