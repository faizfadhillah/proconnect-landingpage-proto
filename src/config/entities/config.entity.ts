import { BaseEntity } from "../../base.entity";
import { Entity, Column } from "typeorm";
import { ApiProperty } from "@nestjs/swagger";

@Entity("configs")
export class Config extends BaseEntity {
  @ApiProperty({
    description: "The key of the config",
    example: "APP_NAME",
  })
  @Column({ unique: true })
  key!: string;

  @ApiProperty({
    description: "The description of the config",
    example: "The name of the application",
  })
  @Column()
  description!: string;

  @ApiProperty({
    description: "The value of the config",
    example: '{"value": "My App"}',
  })
  @Column({ type: "jsonb" })
  value!: any;
}
