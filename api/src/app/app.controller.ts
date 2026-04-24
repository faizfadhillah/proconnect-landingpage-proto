import { Controller, Get, BadRequestException } from "@nestjs/common";
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { AppService } from "./app.service";
import { Public } from "src/auth/public.decorator";

@ApiTags("App")
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get("Tests/HelloWorld")
  @Public()
  @ApiOperation({ summary: "Get Hello World message" })
  @ApiResponse({
    status: 200,
    description: "Returns Hello User message",
    type: Object,
  })
  getHelloWorld(): { message: string } {
    return this.appService.getHelloWorld();
  }

  @Get("Tests/ThrowError")
  @Public()
  @ApiOperation({ summary: "Test endpoint that throws BadRequestException for logging test" })
  @ApiResponse({
    status: 400,
    description: "Returns BadRequestException for testing error logging",
  })
  throwError(): void {
    throw new BadRequestException("Mapping already exists");
  }
}
