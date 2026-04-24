import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Res,
  ServiceUnavailableException,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import { Response } from "express";
import { Public } from "src/auth/public.decorator";
import { StorageService } from "src/storage/storage.service";

@ApiTags("media")
@Controller("media")
@ApiBearerAuth()
export class MediaController {
  constructor(private storageService: StorageService) {}

  private detectImageContentType(buffer: Buffer): string | null {
    if (!buffer || buffer.length < 12) return null;
    // JPEG
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return "image/jpeg";
    }
    // PNG
    if (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    ) {
      return "image/png";
    }
    // GIF
    if (
      buffer[0] === 0x47 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x38
    ) {
      return "image/gif";
    }
    // WEBP (RIFF....WEBP)
    if (
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46 &&
      buffer[8] === 0x57 &&
      buffer[9] === 0x45 &&
      buffer[10] === 0x42 &&
      buffer[11] === 0x50
    ) {
      return "image/webp";
    }
    return null;
  }

  @Post()
  @UseInterceptors(
    FileInterceptor("file", {
      limits: {
        files: 1,
        fileSize: 50 * 1024 * 1024, // 50MB limit (atau sesuai kebutuhan)
      },
    }),
  )
  @ApiOperation({ summary: "Upload a media file" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    description: "Upload media file",
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
        },
        category: {
          type: "string",
          default: "others",
          description: "Category of the media file as subpath or folder",
        },
      },
    },
  })
  async uploadMedia(
    @UploadedFile() file: Express.Multer.File,
    @Body("category") category: string,
  ) {
    const extension = file.originalname.split(".").pop();
    const mediaId = `id-${Date.now()}-${Math.floor(Math.random() * 10000)}.${extension}`;
    return await this.storageService.save(
      `media/${category || "others"}/` + mediaId,
      file.mimetype,
      file.buffer,
      { mediaId: mediaId, category: category },
    );
  }

  @Public()
  @Get("/:category/:mediaId")
  @ApiParam({
    name: "category",
    required: false,
    description: "Category of the media file",
    schema: {
      type: "string",
      default: "others",
    },
  })
  @ApiParam({
    name: "mediaId",
    required: true,
    description: "ID of the media file",
  })
  async downloadMedia(
    @Param("category") category: string = "others",
    @Param("mediaId") mediaId: string,
    @Res() res: Response,
  ) {
    let storageFile: any;
    try {
      storageFile = await this.storageService.get(
        `media/${category || "others"}/` + mediaId,
      );
    } catch (e) {
      if (e.message.toString().includes("No such object")) {
        throw new NotFoundException("image not found");
      } else {
        throw new ServiceUnavailableException("internal error");
      }
    }
    let contentType = storageFile.contentType;
    if (!contentType || contentType === "application/octet-stream") {
      if (category === "image") {
        contentType = this.detectImageContentType(storageFile.buffer);
      }
    }
    res.setHeader("Content-Type", contentType || "application/octet-stream");
    res.setHeader("Content-Disposition", `inline; filename="${mediaId}"`);
    res.setHeader("Cache-Control", "max-age=60d");
    res.end(storageFile.buffer);
  }
}
