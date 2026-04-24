import { ApiProperty } from "@nestjs/swagger";
import { Meta, BasePagination } from "src/base.pagination";

export class CompanyMemberMeta extends Meta {
    @ApiProperty({
        type: Number,
        description: 'Total number of show member',
        required: false,
    })
    totalShowMember: number;
}

export class BasePaginationCompanyMember<T> extends BasePagination<T> {
    @ApiProperty({
        type: CompanyMemberMeta,
        description: 'Pagination metadata',
    })
    meta: CompanyMemberMeta;
}