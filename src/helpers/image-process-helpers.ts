import * as path from 'path';
import * as crypto from 'crypto';
import * as sharp from 'sharp';
import { Bucket, File } from '@google-cloud/storage';
import { Metadata } from '@google-cloud/storage/build/src/nodejs-common';
import { PHOTO_COMPRESSION, uploadBufferToBucket } from '../../utils/helpers';

export async function readStreamFromBucket(file: File): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const data: Buffer[] = [];
    file
      .createReadStream({ validation: false })
      .on('data', (chunk) => {
        data.push(chunk);
      })
      .on('end', () => {
        const bufferData = Buffer.concat(data);
        resolve(bufferData);
      })
      .on('error', (error: Error) => {
        reject(error);
      });
  });
}

export function generateFileName(filePath: string, fileExtension = '.png'): string {
  const fileNameWithoutExtension = path.basename(filePath, fileExtension);
  const modifiedFileNameHash = crypto.createHash('sha256').update(`${fileNameWithoutExtension}${fileExtension}`).digest('hex');
  const modifiedFileName = `${modifiedFileNameHash}${fileExtension}`;
  return modifiedFileName;
}

export const getCircleMaskSvg = (size: number): Buffer => {
  return Buffer.from(`
    <svg width='${size}' height='${size}'>
      <circle cx='${size / 2}' cy='${size / 2}' r='${size / 2}' />
    </svg>
  `);
};

export const getRoundedCornersSvgData = (
  size: number,
  rx: number,
  stroke: number
): {
  cornersMask: Buffer;
  bordersOverlay: Buffer;
} => {
  const borderOffset = stroke / 2;
  const borderSize = size - stroke;

  const cornersMask = Buffer.from(`
    <svg width='${size}' height='${size}'>
      <rect width='${size}' height='${size}' rx='${rx + borderOffset}' />
    </svg>
  `);

  const bordersOverlay = Buffer.from(`
    <svg width='${size}' height='${size}' fill='none'>
      <rect x='${borderOffset}' y='${borderOffset}' width='${borderSize}' height='${borderSize}' rx='${rx}' stroke='#D5D9D9' stroke-width='${stroke}' />
    </svg>
  `);

  return {
    cornersMask,
    bordersOverlay,
  };
};

export async function getSharpInstanceAndMetadata(data: Buffer): Promise<{ image: sharp.Sharp; metadata: sharp.Metadata }> {
  const image = sharp(data).withMetadata();
  const metadata = await image.metadata();
  return {
    image,
    metadata,
  };
}

export function resizeImageWithSharp(image: sharp.Sharp, resizeOptions: sharp.ResizeOptions): sharp.Sharp {
  return image.resize(resizeOptions);
}

export async function convertImageWithSharp(data: Buffer): Promise<Buffer> {
  const { image } = await getSharpInstanceAndMetadata(data);
  return image.rotate().png().toBuffer();
}

export async function transformImageToCircleWithSharp(data: Buffer, size: number): Promise<Buffer> {
  const { image } = await getSharpInstanceAndMetadata(data);
  const circularMask = getCircleMaskSvg(size);

  return resizeImageWithSharp(image, { width: size, height: size, fit: 'cover' })
    .composite([
      {
        input: circularMask,
        blend: 'dest-in',
      },
    ])
    .toBuffer();
}

export async function transformImageToRoundedCornersWithSharp(data: Buffer, size: number): Promise<Buffer> {
  const { image } = await getSharpInstanceAndMetadata(data);
  const rx = Math.floor(size / 12);
  const stroke = Math.floor(rx / 4);
  const { cornersMask, bordersOverlay } = getRoundedCornersSvgData(size, rx, stroke);

  return resizeImageWithSharp(image, { width: size, height: size, fit: 'contain', background: 'white' })
    .composite([
      {
        input: cornersMask,
        blend: 'dest-in',
      },
      {
        input: bordersOverlay,
      },
    ])
    .toBuffer();
}

export async function compressImageWithSharp(data: Buffer, size: number): Promise<Buffer> {
  const { image, metadata } = await getSharpInstanceAndMetadata(data);
  const { width, height } = metadata;
  const divider = Math.min(width, height) / size;
  const [newWidth, newHeight] = [width, height].map((side) => Math.round(side / divider));

  return resizeImageWithSharp(image, { width: newWidth, height: newHeight }).toBuffer();
}

export async function convertAndUploadImageWithSharp(
  bucket: Bucket,
  metadata: Metadata,
  data: Buffer,
  destination: string
): Promise<Buffer> {
  const file = await convertImageWithSharp(data);
  await uploadBufferToBucket(bucket, file, destination, metadata);
  return file;
}

export async function transformAndUploadImageToCircleWithSharp(
  bucket: Bucket,
  metadata: Metadata,
  data: Buffer,
  destination: string
): Promise<void> {
  const file = await transformImageToCircleWithSharp(data, PHOTO_COMPRESSION.CIRCLE);
  await uploadBufferToBucket(bucket, file, destination, metadata);
}

export async function transformAndUploadImageToRoundedCornersWithSharp(
  bucket: Bucket,
  metadata: Metadata,
  data: Buffer,
  destination: string
): Promise<void> {
  const file = await transformImageToRoundedCornersWithSharp(data, PHOTO_COMPRESSION.PRODUCT);
  await uploadBufferToBucket(bucket, file, destination, metadata);
}

export async function transformAndUploadImageSmallWithSharp(
  bucket: Bucket,
  metadata: Metadata,
  data: Buffer,
  destination: string
): Promise<void> {
  const file = await compressImageWithSharp(data, PHOTO_COMPRESSION.REPRESENTATIVE);
  await uploadBufferToBucket(bucket, file, destination, metadata);
}
