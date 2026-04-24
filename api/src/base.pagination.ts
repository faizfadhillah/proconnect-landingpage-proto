import { ApiProperty } from "@nestjs/swagger";

export class Meta {
    @ApiProperty({
        type: Number,
        description: 'Total number of items',
    })
    total: number;
    @ApiProperty({
        type: Number,
        description: 'Current page number',
    })
    page: number;
    @ApiProperty({
        type: Number,
        description: 'Items per page',
    })
    limit: number;
    @ApiProperty({
        type: Number,
        description: 'Total number of pages',
    })
    totalPages: number;
}

export class BasePagination<T> {
    @ApiProperty({
        type: [Object],
        description: 'Array of items',
    })
    items: T[];
    @ApiProperty({
        type: Meta,
        description: 'Pagination metadata',
    })
    meta: Meta;
}