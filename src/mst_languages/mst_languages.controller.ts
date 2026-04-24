// src\mst_skills\mst_skills.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Res,
  UseInterceptors,
  HttpException,
  HttpStatus,
  UploadedFile,
} from "@nestjs/common";
import { MstLanguagesService } from "./mst_languages.service";
import { CreateMstLanguageDto } from "./dto/create-mst_language.dto";
import { UpdateMstLanguageDto } from "./dto/update-mst_language.dto";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiQuery,
  ApiResponse,
} from "@nestjs/swagger";
import { MstLanguage } from "./entities/mst_language.entity";
import { BasePagination } from "src/base.pagination";
import { FieldsService } from "src/zfields/fields.service";
import { DynamicFiltersDto } from "src/zfields/dto/dynamic-filters.dto";
import { Response } from "express";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";

@Controller("mst-languages")
@ApiTags("mst-languages")
@ApiBearerAuth()
export class MstLanguagesController {
  constructor(
    private readonly mstLanguagesService: MstLanguagesService,
    private readonly fieldsService: FieldsService,
  ) {}

  @Get("search")
  @ApiOperation({ summary: "Search with filters", operationId: "search" })
  @ApiQuery({ name: "id", required: false })
  @ApiQuery({ name: "expands", required: false })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({
    name: "filters",
    required: false,
    type: "object",
    style: "deepObject",
    explode: true,
    description: "Dynamic filters for searching",
    example: { name: "", code: "" },
  })
  @ApiQuery({
    name: "sortBy",
    required: false,
    type: "object",
    style: "deepObject",
    explode: true,
    description: "Dynamic sorting",
    example: {
      created_at: "DESC",
    },
  })
  @ApiQuery({
    name: "isExcel",
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: "Returns the list of users matching the search criteria.",
    type: BasePagination<MstLanguage>,
  })
  @ApiResponse({ status: 400, description: "Bad request." })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async search(
    @Query("id") id?: string,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("expands") expands?: string,
    @Query("filters") filters?: DynamicFiltersDto,
    @Query("sortBy") sortBy?: any,
    @Query("isExcel") isExcel?: string,
    @Res() res?: Response,
  ) {
    const parsedFilters = this.fieldsService.parseFilters(filters);
    const parsedSortBy = this.fieldsService.parseSortBy(sortBy);
    return this.fieldsService.search(MstLanguage, {
      id,
      filters: parsedFilters,
      page,
      limit,
      sortBy: parsedSortBy,
      expands,
      isExcel,
      res,
    });
  }

  @Post("import-xls")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: "./uploads", // Direktori sementara
        filename: (req, file, cb) => {
          const filename = `${Date.now()}-${file.originalname}`;
          cb(null, filename);
        },
      }),
      fileFilter: (req, file, cb) => {
        // Validasi tipe file
        const allowedTypes = [
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/vnd.ms-excel",
        ];
        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new HttpException(
              "Hanya file Excel yang diperbolehkan.",
              HttpStatus.BAD_REQUEST,
            ),
            false,
          );
        }
      },
    }),
  )
  async uploadExcel(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new HttpException("File tidak ditemukan.", HttpStatus.BAD_REQUEST);
    }
    return this.fieldsService.importFromExcel(MstLanguage, file);
  }

  @Post()
  @ApiOperation({ summary: "Create a new MstSkill", operationId: "create" })
  @ApiResponse({
    status: 201,
    description: "The MstSkill has been successfully created.",
    type: MstLanguage,
  })
  @ApiResponse({ status: 400, description: "Bad request." })
  create(@Body() createMstSkillDto: CreateMstLanguageDto) {
    return this.mstLanguagesService.create(createMstSkillDto);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a MstSkill by ID", operationId: "update" })
  @ApiResponse({
    status: 200,
    description: "The MstSkill has been successfully updated.",
    type: MstLanguage,
  })
  @ApiResponse({ status: 404, description: "MstSkill not found." })
  update(
    @Param("id") id: string,
    @Body() updateMstSkillDto: UpdateMstLanguageDto,
  ) {
    return this.mstLanguagesService.update(id, updateMstSkillDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a MstSkill by ID", operationId: "remove" })
  @ApiResponse({
    status: 204,
    description: "The MstSkill has been successfully deleted.",
  })
  @ApiResponse({ status: 404, description: "MstSkill not found." })
  remove(@Param("id") id: string) {
    return this.mstLanguagesService.remove(id);
  }
}
