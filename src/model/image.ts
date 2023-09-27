import { Expose } from 'class-transformer';
import { IsDefined, IsEnum, IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';
import {ImageModelStatus, PhotoType} from "../enums/image";
export const COLLECTION_IMAGE_MIGRATE = 'image_migrate';

export type ImageMigrationModel = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  cid: string;
  type: PhotoType;
  source: string;
  destination: string;
  user: string;
  originalName: string;
  fileName: string;
  compressedFileName: string;
  photoId: string;
  readyToMigrate: boolean;
  migrated: boolean;
  status: ImageModelStatus;
  error: string;
};

export class ImageMigrationModelDto {
  @Expose()
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  createdAt: Date;

  @Expose()
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  updatedAt: Date;

  @Expose()
  @IsDefined()
  @IsOptional()
  @IsString()
  cid: string;

  @Expose()
  @IsDefined()
  @IsNotEmpty()
  @IsEnum(PhotoType)
  type: PhotoType;

  @Expose()
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  source: string;

  @Expose()
  @IsDefined()
  @IsOptional()
  @IsString()
  destination: string;

  @Expose()
  @IsDefined()
  @IsOptional()
  @IsString()
  user: string;

  @Expose()
  @IsDefined()
  @IsOptional()
  @IsString()
  originalName: string = null;

  @Expose()
  @IsDefined()
  @IsOptional()
  @IsString()
  fileName: string = null;

  @Expose()
  @IsDefined()
  @IsOptional()
  @IsString()
  compressedFileName: string = null;

  @Expose()
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  photoId: string = null;

  @Expose()
  @IsDefined()
  @IsNotEmpty()
  @IsBoolean()
  readyToMigrate: boolean;

  @Expose()
  @IsDefined()
  @IsNotEmpty()
  @IsBoolean()
  migrated: boolean;

  @Expose()
  @IsDefined()
  @IsNotEmpty()
  @IsEnum(ImageModelStatus)
  status: ImageModelStatus;

  @Expose()
  @IsDefined()
  @IsOptional()
  @IsString()
  error: string;
}
