import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from "@nestjs/common";
import { EncryptedUserDataService } from "./encrypted_user_data.service";
import { CreateEncryptedUserDataDto } from "./dto/create-encrypted_user_data.dto";
import { UpdateEncryptedUserDataDto } from "./dto/update-encrypted_user_data.dto";
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiResponse,
} from "@nestjs/swagger";
import { FieldsService } from "src/zfields/fields.service";
import { EncryptedUserData } from "./entities/encrypted_user_data.entity";
import { DynamicFiltersDto } from "src/zfields/dto/dynamic-filters.dto";
import { BasePagination } from "src/base.pagination";
import { decrypt } from "./encryption.util";
import * as moment from "moment-timezone";

@Controller("encrypted-user-data")
@ApiTags("encrypted-user-data")
@ApiBearerAuth()
export class EncryptedUserDataController {
  constructor(
    private readonly encryptedUserDataService: EncryptedUserDataService,
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
    example: { user_id: "" },
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
    type: BasePagination<EncryptedUserData>,
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
  ) {
    const parsedFilters = this.fieldsService.parseFilters(filters);
    const parsedSortBy = this.fieldsService.parseSortBy(sortBy);
    const results = await this.fieldsService.search(EncryptedUserData, {
      id,
      filters: parsedFilters,
      page,
      limit,
      sortBy: parsedSortBy,
      expands,
    });

    // Decrypt sensitive fields
    const decryptedResults = results.items.map((item: EncryptedUserData) => {
      const decrypt_date_of_birth = item.encrypted_date_of_birth
        ? moment
            .tz(decrypt(item.encrypted_date_of_birth), "Asia/Jakarta")
            .format("YYYY-MM-DD")
        : null;

      return {
        ...item,
        encrypted_date_of_birth: decrypt_date_of_birth,
        encrypted_nik: decrypt(item.encrypted_nik),
        encrypted_phone: decrypt(item.encrypted_phone),
        encrypted_address: decrypt(item.encrypted_address),
      };
    });

    // Return the decrypted results
    return {
      ...results,
      items: decryptedResults,
    };
  }

  @Post()
  @ApiOperation({ summary: "Create encrypted user data" })
  create(@Body() createEncryptedUserDataDto: CreateEncryptedUserDataDto) {
    return this.encryptedUserDataService.create(createEncryptedUserDataDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all encrypted user data" })
  findAll() {
    return this.encryptedUserDataService.findAll();
  }

  @Get(":user_id")
  @ApiOperation({ summary: "Get encrypted user data by user id" })
  findOne(@Param("user_id") user_id: string) {
    return this.encryptedUserDataService.findOne(user_id);
  }

  @Patch(":user_id")
  @ApiOperation({ summary: "Update encrypted user data by user id" })
  update(
    @Param("user_id") id: string,
    @Body() updateEncryptedUserDataDto: UpdateEncryptedUserDataDto,
  ) {
    return this.encryptedUserDataService.update(id, updateEncryptedUserDataDto);
  }

  @Delete(":user_id")
  @ApiOperation({ summary: "Delete encrypted user data by user id" })
  remove(@Param("user_id") user_id: string) {
    return this.encryptedUserDataService.remove(user_id);
  }
}
