import { ApiProperty, PartialType } from "@nestjs/swagger";
import { CreateMstRightToWorkDto } from "./create-mst_right_to_work.dto";
import { IsString, Length } from "class-validator";

export class UpdateMstRightToWorkDto extends PartialType(
  CreateMstRightToWorkDto,
) {
  @ApiProperty({
    example: "RTW-001",
  })
  @IsString()
  @Length(3, 50)
  code: string;

  @ApiProperty({
    example: "Kartu Izin Tinggal Terbatas (KITAS)",
  })
  @IsString()
  @Length(3, 255)
  name: string;
}
