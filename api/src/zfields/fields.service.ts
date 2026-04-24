import { HttpException, HttpStatus, Injectable, Type } from "@nestjs/common";
import {
  Brackets,
  EntityManager,
  getMetadataArgsStorage,
  Repository,
  SelectQueryBuilder,
} from "typeorm";
import { isUUID } from "class-validator";
import { BasePagination } from "src/base.pagination";
import * as ExcelJS from "exceljs";
import { Response } from "express";
import * as path from "path";
import * as fs from "fs";
import { UserWithRoles } from "src/users/interfaces/user-with-roles.interface";
import { Job } from "src/jobs/entities/job.entity";
import { MstCompany } from "src/mst_companies/entities/mst_company.entity";
import { toNumber } from "src/utils/number.util";
import { LoggingService } from "src/logs/logs.service";

@Injectable()
export class FieldsService {
  constructor(
    private readonly entityManager: EntityManager,
    private readonly logger: LoggingService,
  ) { }

  generateFields(entityClass: Type<any>) {
    const fields = [];
    const columns = getMetadataArgsStorage().columns.filter(
      (col) => col.target === entityClass,
    );

    for (const column of columns) {
      const field: any = {
        name: column.propertyName,
        label: this.toTitleCase(column.propertyName),
        inputType: "text", // default to text, will adjust based on type
        required:
          column.options.nullable == undefined ||
            column.options.nullable == true
            ? false
            : true,
        options: column.options,
        rules: [
          (v) => !!v || `${this.toTitleCase(column.propertyName)} is required`,
        ],
        enums: [],
      };

      if (field.name.includes("email")) {
        field.inputType = "email";
      }

      if (field.options.type == "enum") {
        field.inputType = "select";
        field.enums = [];
        Object.keys(field.options.enum).forEach((key) => {
          field.enums.push({ key: key, value: field.options.enum[key] });
        });
      }

      if (field.options.type == "text") {
        field.inputType = "textarea";
      }

      // Custom field types based on property names and types
      /*if (column.propertyName === "email") {
        field.inputType = "email";
        field.rules.push((v) => /.+@.+\..+/.test(v) || "Must be a valid email");
      } else if (column.propertyName.includes("role")) {
        field.type = "select";
        field.options = this.getOptions(column.propertyName);
      } else if (column.propertyName === "company_id") {
        field.rules.push((v) =>
          v ? /^[0-9a-fA-F-]{36}$/.test(v) || "Must be a valid UUID" : true,
        );
      } else if (column.propertyName === "personal_summary") {
        field.type = "textarea";
      } else if (
        column.propertyName === "availability" ||
        column.propertyName === "gender"
      ) {
        field.type = "select";
        field.options = this.getOptions(column.propertyName);
      }*/

      fields.push(field);
    }
    return fields;
  }

  getFieldMetadata(entityClass: Type<any>, field: string) {
    const columns = getMetadataArgsStorage().columns.filter(
      (col) => col.target === entityClass,
    );

    for (const column of columns) {
      if (field == column.propertyName) {
        return {
          name: column.propertyName,
          label: this.toTitleCase(column.propertyName),
          inputType: "text", // default to text, will adjust based on type
          required:
            column.options.nullable == undefined ||
              column.options.nullable == true
              ? false
              : true,
          options: column.options,
          rules: [
            (v) =>
              !!v || `${this.toTitleCase(column.propertyName)} is required`,
          ],
          enums: [],
        };
      }
    }
    return null;
  }

  getJoinColumns(entityClass: Type<any>) {
    const relations = getMetadataArgsStorage().relations.filter(
      (rel) => rel.target === entityClass,
    );

    return relations.map((rel) => {
      const joinColumns = getMetadataArgsStorage().joinColumns.filter(
        (jc) =>
          jc.target === entityClass && jc.propertyName === rel.propertyName,
      );

      return {
        propertyName: rel.propertyName,
        type: rel.relationType,
        joinColumns: joinColumns.map((jc) => ({
          name: jc.name,
          referencedColumnName: jc.referencedColumnName,
        })),
      };
    });
  }

  toTitleCase(str: string) {
    return str.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  toSnakeCase(str: string): string {
    return str
      .replace(/\s+/g, "_") // Ganti spasi dengan underscore
      .toLowerCase(); // Ubah semua karakter menjadi huruf kecil
  }

  getOptions(fieldName: string) {
    const optionsMap = {
      user_role: ["user", "admin", "manager"],
      company_role: ["owner", "member", "admin"],
      gender: ["male", "female", "other"],
      availability: ["full-time", "part-time", "contract"],
      // Add more mappings as needed for other entities
    };
    return optionsMap[fieldName] || [];
  }

  parseFilters(filters) {
    if (
      typeof filters === "object" &&
      !Array.isArray(filters) &&
      filters !== null
    ) {
      return filters;
    } else if (filters && Array.isArray(filters)) {
      filters = Object.assign(
        {},
        ...filters.map((filter) => JSON.parse(filter)),
      );
      return filters;
    } else if (filters) {
      return JSON.parse(filters.toString());
    } else {
      return {};
    }
  }

  parseSortBy(sortBy) {
    return sortBy && Array.isArray(sortBy)
      ? sortBy.map((item) => JSON.parse(item.toString()))
      : typeof sortBy === "object" && sortBy !== null
        ? sortBy
        : sortBy
          ? [JSON.parse(sortBy.toString())]
          : [];
  }

  async search<T>(
    entityClass: Type<T>,
    params: {
      id?: string;
      filters: Record<string, any>;
      page?: number;
      limit?: number;
      sortBy?: any;
      expands: string;
      options?: any;
      isExcel?: string;
      res?: Response;
      user?: UserWithRoles;
    },
  ): Promise<any> {
    const fields = this.generateFields(entityClass);
    const joinColumn = this.getJoinColumns(entityClass);
    const tbname = entityClass.name.toLowerCase();

    const {
      id,
      filters,
      page = 1,
      limit = 10,
      sortBy = null,
      expands = "",
      options = {},
      isExcel = false,
      res,
      user,
    } = params;

    // Convert page and limit to numbers, applying defaults for null/undefined/NaN/invalid
    const pageNum = toNumber(page, 1);
    const limitNum = toNumber(limit, 10);

    // Create a query builder using the dynamic repository
    const repository: Repository<T> =
      this.entityManager.getRepository(entityClass);
    let query: SelectQueryBuilder<T> = repository.createQueryBuilder(tbname);

    if (expands) {
      const expandFields = [];
      expands
        .split(",")
        .map((item) => item.trim())
        .forEach((expand) => {
          if (expand.includes(".")) {
            const dexpands = expand.split(".");
            let isJsonb = false;

            fields.forEach((field) => {
              if (
                field.options &&
                field.options.type == "jsonb" &&
                field.name.includes("_ids") &&
                field.name.includes(dexpands[0])
              ) {
                query
                  .leftJoinAndMapMany(
                    `${tbname}.${dexpands[0]}s`,
                    `mst_${dexpands[0]}s`,
                    dexpands[0],
                    `${dexpands[0]}.id::text IN (SELECT jsonb_array_elements_text(${tbname}.${field.name})) AND ${tbname}.${field.name} IS NOT NULL`,
                  )
                  .leftJoinAndSelect(
                    `${dexpands[0]}.${dexpands[1]}`,
                    dexpands[1] + "_",
                  );
                isJsonb = true;
              }
            });

            if (isJsonb) {
              // do nothing
            } else {
              if (dexpands[0] && !expandFields.includes(dexpands[0])) {
                query.leftJoinAndSelect(
                  `${tbname}.${dexpands[0]}`,
                  dexpands[0],
                );
                expandFields.push(dexpands[0]);
              }
              if (dexpands[1]) {
                if (dexpands[0] == "job") {
                  const jobFields = this.generateFields(Job);
                  const dfields = jobFields.find((x) =>
                    x.name.includes(dexpands[1]),
                  );
                  const fieldMetadata = this.getFieldMetadata(
                    Job,
                    dfields?.name,
                  );
                  if (
                    dfields &&
                    fieldMetadata &&
                    fieldMetadata.options.type == "jsonb"
                  ) {
                    query.leftJoinAndMapMany(
                      `${dexpands[0]}.${dexpands[1]}s`,
                      `mst_${dexpands[1]}s`,
                      dexpands[1],
                      `${dexpands[1]}.id::text IN (SELECT jsonb_array_elements_text(${dexpands[0]}.${fieldMetadata.name})) AND ${dexpands[0]}.${fieldMetadata.name} IS NOT NULL`,
                    );
                    if (dexpands[2]) {
                      query.leftJoinAndSelect(
                        `${dexpands[1]}.${dexpands[2]}`,
                        dexpands[2] + "_",
                      );
                    }
                  } else {
                    query.leftJoinAndSelect(
                      `${dexpands[0]}.${dexpands[1]}`,
                      dexpands[1],
                    );
                    if (dexpands[2]) {
                      query.leftJoinAndSelect(
                        `${dexpands[1]}.${dexpands[2]}`,
                        dexpands[2] + "_",
                      );
                    }
                  }
                } else {
                  query.leftJoinAndSelect(
                    `${dexpands[0]}.${dexpands[1]}`,
                    dexpands[1],
                  );
                }
              }
            }
          } else if (joinColumn.find((x) => x.propertyName == expand)) {
            query.leftJoinAndSelect(`${tbname}.${expand}`, expand);
          } else {
            fields.forEach((field) => {
              if (
                field.options &&
                field.options.type == "jsonb" &&
                field.name.includes("_ids") &&
                field.name.includes(expand)
              ) {
                query.leftJoinAndMapMany(
                  `${tbname}.${expand}s`,
                  `mst_${expand}s`,
                  expand,
                  `${expand}.id::text IN (SELECT jsonb_array_elements_text(${tbname}.${field.name})) AND ${tbname}.${field.name} IS NOT NULL`,
                );
              }
            });
          }
        });
    }

    //query.leftJoinAndSelect(`${tbname}.region`, "region");

    if (id) {
      query.andWhere(`${tbname}.id = :id`, { id });
    }

    const orConditions = [],
      orParams = {};
    Object.keys(filters).forEach((key) => {
      let value = filters[key];
      if (typeof value == "string" && value.includes("]")) {
        value = JSON.parse(value);
      }
      const field = fields.find((x) => x.name === key);

      // Skip UUID field jika bernilai "" atau "losing"
      if (field && field.options?.type === "uuid" && (value === "" || !value)) {
        return;
      }

      if (key === "id") {
        if (Array.isArray(value) && value.length) {
          query.andWhere(`${tbname}.${key} IN (:...${key})`, { [key]: value });
        } else {
          query.where(`${tbname}.${key} = :${key}`, { [key]: value });
        }
      } else if (field && Array.isArray(value)) {
        if (value.length) {
          switch (field.options.type) {
            case "jsonb":
              query.andWhere(
                new Brackets((qb) => {
                  value.forEach((status, index) => {
                    const paramKey = `${key}_${index}`;
                    qb.orWhere(`${tbname}.${key} @> :${paramKey}`, {
                      [paramKey]: JSON.stringify([status]),
                    });
                  });
                }),
              );
              break;
            default:
              query.andWhere(`${tbname}.${key} IN (:...${key})`, {
                [key]: value,
              });
              break;
          }
        }
      } else if (value !== undefined && value !== null && field) {
        if (key.includes("other_country")) {
          if ("indonesia".includes(value.toLowerCase())) {
            orConditions.push(`${tbname}.${key} ILIKE :${key}`);
            orParams[key] = `%${value}%`;
            orConditions.push(`${tbname}.${key} IS NULL`);
            orConditions.push(`${tbname}.${key} =''`);
          } else {
            query.andWhere(`${key} ILIKE :${key}`, {
              [key]: `%${value}%`,
            });
          }
        } else if (field.options) {
          switch (field.options.type) {
            case "text":
            case "varchar":
            case String:
              if (filters.orWhere && filters.orWhere.includes(key)) {
                // Collect the OR conditions
                orConditions.push(`${tbname}.${key} ILIKE :${key}`);
                orParams[key] = `%${value}%`;
              } else {
                query.andWhere(`${tbname}.${key} ILIKE :${key}`, {
                  [key]: `%${value}%`,
                });
              }
              break;
            case "int":
              value = parseInt(value);
              if (!isNaN(value)) {
                if (filters.orWhere && filters.orWhere.includes(key)) {
                  // Collect the OR conditions
                  orConditions.push(`${tbname}.${key} ILIKE :${key}`);
                  orParams[key] = `%${value}%`;
                } else {
                  query.andWhere(`${tbname}.${key} ILIKE :${key}`, {
                    [key]: `%${value}%`,
                  });
                }
              }
              break;
            case Date:
              if (typeof value === "object") {
                if (value.start && value.end) {
                  query.andWhere(
                    `${tbname}.${key} BETWEEN :startDate AND :endDate`,
                    { startDate: value.start, endDate: value.end },
                  );
                } else if (value.start) {
                  query.andWhere(`${tbname}.${key} >= :startDate`, {
                    startDate: value.start,
                  });
                } else if (value.end) {
                  query.andWhere(`${tbname}.${key} <= :endDate`, {
                    endDate: value.end,
                  });
                }
              } else {
                query.andWhere(`${tbname}.${key} = :${key}`, { [key]: value });
              }
              break;
            case "jsonb":
              query.andWhere(`${tbname}.${key} @> :param`, {
                param: JSON.stringify([value]),
              });
              break;
            default:
              if (filters.orWhere && filters.orWhere.includes(key)) {
                // Collect the OR conditions
                orConditions.push(`${tbname}.${key} = :${key}`);
                orParams[key] = value;
              } else {
                query.andWhere(`${tbname}.${key} = :${key}`, { [key]: value });
              }
              break;
          }
        } else {
          if (filters.orWhere && filters.orWhere.includes(key)) {
            // Collect the OR conditions
            orConditions.push(`${tbname}.${key} = :${key}`);
            orParams[key] = value;
          } else {
            query.andWhere(`${tbname}.${key} = :${key}`, { [key]: value });
          }
        }
      } else if (key.includes(".")) {
        const realKey = key;
        const keys = key.split(".");
        if (expands.includes(keys[0])) {
          if (keys.length == 2) {
            if (Array.isArray(value)) {
              if (!value.length) {
                return;
              }
              if (keys[0] == "job") {
                const fieldMetadata = this.getFieldMetadata(Job, keys[1]);
                if (fieldMetadata && fieldMetadata.options.type == "jsonb") {
                  query.andWhere(
                    new Brackets((qb) => {
                      value.forEach((status, index) => {
                        const paramKey = `${key}_${index}`;
                        qb.orWhere(`${key} @> :${paramKey}`, {
                          [paramKey]: JSON.stringify([status]),
                        });
                      });
                    }),
                  );
                } else {
                  query.andWhere(`${key} IN (:...${key})`, { [key]: value });
                }
              } else {
                query.andWhere(`${key} IN (:...${key})`, { [key]: value });
              }
            } else if (value !== undefined && value !== null) {
              if (isUUID(value)) {
                query.andWhere(`${key} = :${key}`, { [key]: value });
              } else {
                if (filters.orWhere && filters.orWhere.includes(key)) {
                  orConditions.push(`${key} ILIKE :${key}`);
                  orParams[key] = `%${value}%`;
                } else {
                  if (
                    key.includes("other_country") &&
                    "indonesia".includes(value.toLowerCase())
                  ) {
                    orConditions.push(`${key} ILIKE :${key}`);
                    orParams[key] = `%${value}%`;
                    orConditions.push(`${key} IS NULL`);
                    orConditions.push(`${key} =''`);
                  } else {
                    if (
                      typeof value === "boolean" ||
                      key.includes("is_") ||
                      key.includes("has_")
                    ) {
                      query.andWhere(`${key} = :${key}`, {
                        [key]: value,
                      });
                    } else if (typeof value === "string") {
                      query.andWhere(`${key} ILIKE :${key}`, {
                        [key]: `%${value}%`,
                      });
                    } else {
                      query.andWhere(`${key} = :${key}`, {
                        [key]: value,
                      });
                    }
                  }
                }
              }
            }
          } else if (keys.length == 3) {
            key = `${keys[1]}.${keys[2]}`;
            if (Array.isArray(value) && value.length) {
              query.andWhere(`${key} IN (:...${key})`, { [key]: value });
            } else if (value) {
              if (isUUID(value) || /^-?\d+$/.test(value)) {
                query.andWhere(`${key} = :${key}`, { [key]: value });
              } else {
                if (filters.orWhere && filters.orWhere.includes(realKey)) {
                  orConditions.push(`${key} ILIKE :${key}`);
                  orParams[key] = `%${value}%`;
                } else {
                  if (
                    key.includes("other_country") &&
                    "indonesia".includes(value.toLowerCase())
                  ) {
                    orConditions.push(`${key} ILIKE :${key}`);
                    orParams[key] = `%${value}%`;
                    orConditions.push(`${key} IS NULL`);
                    orConditions.push(`${key} =''`);
                  } else {
                    query.andWhere(`${key} ILIKE :${key}`, {
                      [key]: `%${value}%`,
                    });
                  }
                }
              }
            }
          }
        }
      }
    });

    if (orConditions.length) {
      query.andWhere(
        new Brackets((qb) => {
          orConditions.forEach((condition, index) => {
            if (index === 0) {
              qb.where(condition, orParams);
            } else {
              qb.orWhere(condition, orParams);
            }
          });
        }),
      );
    }

    if (Array.isArray(sortBy)) {
      sortBy.forEach((item: any) => {
        // Handle both formats: { key: 'field', order: 'asc' } and { field: 'ASC'}
        if (item.key && item.order) {
          query.addOrderBy(
            `${tbname}.${item.key}`,
            item.order.toUpperCase() as "ASC" | "DESC",
          );
        } else {
          Object.keys(item).forEach((key) => {
            if (key.includes(".")) {
              const keys = key.split(".");
              if (keys.length == 2) {
                // For 2-level expansions like "jobStep.step_order"
                // Check if the first part is in the expands
                if (expands.includes(keys[0])) {
                  query.addOrderBy(
                    `${keys[0]}.${keys[1]}`,
                    item[key].toUpperCase() as "ASC" | "DESC",
                  );
                } else {
                  // Fallback to the original logic
                  query.addOrderBy(
                    `${tbname}.${keys[1]}`,
                    item[key].toUpperCase() as "ASC" | "DESC",
                  );
                }
              } else if (keys.length > 2) {
                // For deeper nested expansions like "job.jobStep.step_order"
                // Build the proper alias path

                let aliasPath = keys[0];
                for (let i = 1; i < keys.length - 1; i++) {
                  aliasPath = `${keys[i]}`;
                }
                const fieldName = keys[keys.length - 1];

                // Check if the expansion path is valid
                if (expands.includes(aliasPath) || expands.includes(keys[0])) {
                  query.addOrderBy(
                    `${aliasPath}.${fieldName}`,
                    item[key].toUpperCase() as "ASC" | "DESC",
                  );
                }
              }
            } else {
              query.addOrderBy(
                `${tbname}.${key}`,
                (item[key] as string)?.toUpperCase() as "ASC" | "DESC",
              );
            }
          });
        }
      });
    } else if (sortBy) {
      // Handle single object format: { key: 'field', order: 'asc' } or { field: 'ASC' }
      if (sortBy.key && sortBy.order) {
        query.addOrderBy(
          `${tbname}.${sortBy.key}`,
          sortBy.order.toUpperCase() as "ASC" | "DESC",
        );
      } else {
        Object.keys(sortBy).forEach((key) => {
          if (key.includes(".")) {
            const keys = key.split(".");
            if (keys.length == 2) {
              // For 2-level expansions like "jobStep.step_order"
              // Check if the first part is in the expands
              if (expands.includes(keys[0])) {
                query.addOrderBy(
                  `${keys[0]}.${keys[1]}`,
                  sortBy[key].toUpperCase() as "ASC" | "DESC",
                );
              } else {
                // Fallback to the original logic
                query.addOrderBy(
                  `${tbname}.${keys[1]}`,
                  sortBy[key].toUpperCase() as "ASC" | "DESC",
                );
              }
            } else if (keys.length > 2) {
              // For deeper nested expansions like "job.jobStep.step_order"
              // Build the proper alias path
              let aliasPath = keys[0];
              for (let i = 1; i < keys.length - 1; i++) {
                aliasPath = `${keys[i]}`;
              }
              const fieldName = keys[keys.length - 1];

              // Check if the expansion path is valid
              if (expands.includes(aliasPath) || expands.includes(keys[0])) {
                query.addOrderBy(
                  `${aliasPath}.${fieldName}`,
                  sortBy[key].toUpperCase() as "ASC" | "DESC",
                );
              }
            }
          } else {
            query.addOrderBy(
              `${tbname}.${key}`,
              (sortBy[key] as string)?.toUpperCase() as "ASC" | "DESC",
            );
          }
        });
      }
    }

    query.andWhere(`${tbname}.deleted_at IS NULL`);

    query = this.queryBirthYear(query, "user", options, expands);
    query = this.queryIntervalCreatedAt(query, tbname, filters);
    query = await this.queryVisibility(user, query, tbname, fields);

    if (isExcel && isExcel == "true") {
      // Abaikan limit/pagination jika isExcel
      const data = await query.getMany();

      // Ekspor data ke Excel
      return this.exportToExcel(entityClass, data, res);
    }

    if (limitNum > 0) {
      const skipValue = (pageNum - 1) * limitNum;
      query.skip(skipValue).take(limitNum);
    }

    const [items, total] = await query.getManyAndCount();

    /*for (var i in items) {
      let item = items[i];
      Object.keys(item).forEach((key) => {
        if (key.includes("_url") && item[key] && !item[key].includes("http")) {
          items[i][key] = items[i][key];
        }
      });
    }*/
    const paginationResult = new BasePagination<T>();
    paginationResult.items = items;
    paginationResult.meta = {
      total: total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
    if (res) {
      res.status(200).json(paginationResult);
      res.end();
      return paginationResult;
    } else {
      return paginationResult;
    }
  }

  queryIntervalCreatedAt(query: any, tbname: string, options: any) {
    if (options.created_at_start && options.created_at_end) {
      query.andWhere(
        `${tbname}.created_at BETWEEN :created_at_start AND :created_at_end`,
        {
          created_at_start: options.created_at_start + " 00:00:00",
          created_at_end: options.created_at_end + " 23:59:59",
        },
      );
    } else if (options.created_at_start) {
      query.andWhere(`${tbname}.created_at >= :created_at_start`, {
        created_at_start: options.created_at_start + " 00:00:00",
      });
    } else if (options.created_at_end) {
      query.andWhere(`${tbname}.created_at <= :created_at_end`, {
        created_at_end: options.created_at_end + " 23:59:59",
      });
    }
    return query;
  }

  queryBirthYear(query: any, tbname: string, options: any, expands: string) {
    if ((options.age_start || options.age_end) && expands.includes("user")) {
      const currentYear = new Date().getFullYear();

      if (options.age_start && options.age_end) {
        const birthYearStart = currentYear - options.age_end;
        const birthYearEnd = currentYear - options.age_start;
        query.andWhere(
          `${tbname}.birth_year BETWEEN :birthYearStart AND :birthYearEnd`,
          {
            birthYearStart,
            birthYearEnd,
          },
        );
      } else if (options.age_start) {
        const birthYearStart = currentYear - 999;
        const birthYearEnd = currentYear - options.age_start;
        query.andWhere(
          `${tbname}.birth_year BETWEEN :birthYearStart AND :birthYearEnd`,
          {
            birthYearStart,
            birthYearEnd,
          },
        );
      } else if (options.age_end) {
        const birthYearStart = currentYear - options.age_end;
        const birthYearEnd = currentYear;
        query.andWhere(
          `${tbname}.birth_year BETWEEN :birthYearStart AND :birthYearEnd`,
          {
            birthYearStart,
            birthYearEnd,
          },
        );
      }
    }
    return query;
  }

  async queryVisibility(user: UserWithRoles, query: any, tbname: string, fields: any) {
    if (!user) {
      return query;
    }

    if (user.isSysAdmin) {
      return query;
    }

    // skip filter for table mst_company, job, and user. Since these table already has its own rbac logic, 
    // from their service layer
    if (tbname == "mstcompany" || tbname == "job" || tbname == "user") {
      return query;
    }

    if (
      fields.find((x: any) => x.name === "user_id") &&
      !tbname.includes("user")
    ) {
      query.andWhere(`${tbname}.user_id = :user_id`, { user_id: user.id });
    }

    return query;
  }

  async exportToExcel<T>(
    entityClass: Type<T>,
    data: T[],
    res: Response,
  ): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(entityClass.name);

    // Ambil metadata kolom entitas
    let columns = [
      ...getMetadataArgsStorage().columns.filter(
        (col) => col.target === entityClass,
      ),
      ...[
        { propertyName: "created_at" },
        { propertyName: "created_by" },
        { propertyName: "updated_at" },
        { propertyName: "updated_by" },
      ],
    ];

    if (!columns.find((x) => x.propertyName == "id")) {
      columns = [...[{ propertyName: "id" }], ...columns];
    }

    // Tambahkan header kolom
    worksheet.columns = columns.map((col) => ({
      header: this.toTitleCase(col.propertyName),
      key: col.propertyName,
      width: 20,
    }));

    // Atur style header (Opsional)
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
      //cell.alignment = { horizontal: "center" };
    });

    // Tambahkan data ke worksheet
    data.forEach((item) => {
      const rowData = {};
      columns.forEach((col) => {
        rowData[col.propertyName] = item[col.propertyName];
      });
      worksheet.addRow(rowData);
    });

    // Atur response untuk file download
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${entityClass.name.toLowerCase()}.xlsx`,
    );

    // Kirim file ke response
    await workbook.xlsx.write(res);
    res.end();
  }

  async importFromExcel<T>(
    entityClass: Type<T>,
    file: Express.Multer.File,
  ): Promise<any> {
    const filePath = path.join(__dirname, "../../../uploads", file.filename);

    try {
      // Baca file Excel menggunakan ExcelJS
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);

      const sheet = workbook.worksheets[0]; // Ambil sheet pertama
      const sheetData: any[] = [];
      const headers = sheet.getRow(1).values as string[]; // Header kolom (baris pertama)

      // Ambil repository dari entityClass
      const repository: Repository<T> =
        this.entityManager.getRepository(entityClass);

      const companyHeadquarterNames = [];
      // Kumpulkan promises untuk setiap row
      const rowPromises = [];

      sheet.eachRow(async (row, rowNumber) => {
        if (rowNumber === 1) return; // Abaikan header

        const rowData = row.values;
        const entityData: Partial<T> = {};

        // Pemetaan header ke atribut entity
        headers.forEach(async (header, index) => {
          header = this.toSnakeCase(header);
          if (header && rowData[index]) {
            entityData[header] = rowData[index];
          }
        });

        if (entityClass == MstCompany) {
          if (!entityData["branch"]) {
            companyHeadquarterNames.push(entityData["company_name"]);
          }
          if (entityData["parent_id"]) {
            const parent = await repository.findOneBy({
              id: entityData["parent_id"],
            } as any);
            if (parent) {
              (entityData as any)["company_name"] = (
                parent as any
              ).company_name; // Type assertion untuk mengatasi error 2
            }
          }
        }

        // Check jika ID atau field unik lainnya sudah ada di database
        const uniqueField = "id"; // Ganti sesuai field unik entity Anda
        if (entityData[uniqueField]) {
          const existingEntityPromise = repository
            .findOne({
              where: { [uniqueField]: entityData[uniqueField] } as any,
            })
            .then(async (existingEntity) => {
              if (existingEntity) {
                // Update data jika sudah ada
                await repository.save({ ...existingEntity, ...entityData });
              } else {
                sheetData.push(entityData); // Add to sheetData if new
              }
            });

          rowPromises.push(existingEntityPromise);
        } else {
          sheetData.push(entityData); // Add to sheetData if no ID
        }
      });

      // Tunggu semua row promises selesai
      await Promise.all(rowPromises);
      // Simpan data baru ke database
      if (sheetData.length > 0) {
        const BATCH_SIZE = 5000; // Adjust batch size as necessary

        for (let i = 0; i < sheetData.length; i += BATCH_SIZE) {
          const batch = sheetData.slice(i, i + BATCH_SIZE);
          try {
            await repository.save(batch);
          } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            const oneLineStack = err.stack ? err.stack.replace(/\s*\n\s*/g, " ") : undefined;
            this.logger.error(
              `Error saving batch: ${err.message}`,
              "fields-import",
              oneLineStack,
            );
            throw new HttpException(
              "Terjadi kesalahan saat menyimpan batch ke database. " +
              error.message,
              HttpStatus.INTERNAL_SERVER_ERROR,
            );
          }
        }
      }

      // Hapus file setelah diproses
      fs.unlinkSync(filePath);

      if (entityClass == MstCompany && companyHeadquarterNames.length > 0) {
        await this.assembleChild(companyHeadquarterNames);
      }

      return {
        message:
          "File berhasil diunggah, data diperbarui/dimasukkan ke database.",
      };
    } catch (error) {
      throw new HttpException(
        "Terjadi kesalahan saat memproses file. " + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async assembleChild(company_names: string[]) {
    for (const company_name of company_names) {
      const queryBuilder = this.entityManager
        .getRepository(MstCompany)
        .createQueryBuilder("company")
        .where("LOWER(company.company_name) = LOWER(:company_name)", {
          company_name: company_name,
        })
        .andWhere(
          "(LOWER(company.branch) IS NULL OR LOWER(company.branch) = '')",
        );

      const company = await queryBuilder.getOne();
      if (!company) {
        return;
      }

      const childCompanies = await this.entityManager
        .getRepository(MstCompany)
        .createQueryBuilder("company")
        .where("LOWER(company.company_name) = LOWER(:company_name)", {
          company_name: company.company_name,
        })
        .andWhere("company.branch IS NOT NULL")
        .andWhere("company.branch != ''")
        .andWhere("company.id != :currentCompanyId", {
          currentCompanyId: company.id,
        })
        .getMany();
      // Update parent_id for all child companies
      if (childCompanies.length > 0) {
        await this.entityManager
          .getRepository(MstCompany)
          .createQueryBuilder()
          .update(MstCompany)
          .set({ parent_id: company.id })
          .whereInIds(childCompanies.map((child) => child.id))
          .execute();
      }
    }
  }
}
