import 'server-only';
import sharp from 'sharp';
import { downloadFromS3, uploadBufferToS3 } from './s3';

type VariantConfig = {
  name: string;
  width?: number;
  height?: number;
  quality: number;
  fit?: keyof sharp.FitEnum;
};

const POST_VARIANTS: VariantConfig[] = [
  { name: 'thumb', height: 96, quality: 75, fit: 'inside' },
  { name: 'sm', width: 400, quality: 80, fit: 'inside' },
  { name: 'md', width: 720, quality: 80, fit: 'inside' },
  { name: 'lg', width: 1200, quality: 80, fit: 'inside' },
  { name: 'og', width: 1200, height: 630, quality: 80, fit: 'cover' },
];

const AVATAR_VARIANTS: VariantConfig[] = [
  { name: 'avatar-sm', width: 80, height: 80, quality: 80, fit: 'cover' },
  { name: 'avatar-lg', width: 160, height: 160, quality: 80, fit: 'cover' },
];

/**
 * Derives the S3 key for a variant from the original key.
 * e.g. "posts/1/1700000000.jpg" -> "posts/1/1700000000/sm.webp"
 */
function getVariantKey(originalKey: string, variantName: string): string {
  const dotIndex = originalKey.lastIndexOf('.');
  const base = dotIndex !== -1 ? originalKey.slice(0, dotIndex) : originalKey;
  return `${base}/${variantName}.webp`;
}

async function generateVariant(
  source: Buffer,
  config: VariantConfig
): Promise<Buffer> {
  let pipeline = sharp(source);

  if (config.width && config.height) {
    pipeline = pipeline.resize(config.width, config.height, {
      fit: config.fit || 'cover',
      withoutEnlargement: true,
    });
  } else if (config.width) {
    pipeline = pipeline.resize(config.width, undefined, {
      fit: config.fit || 'inside',
      withoutEnlargement: true,
    });
  } else if (config.height) {
    pipeline = pipeline.resize(undefined, config.height, {
      fit: config.fit || 'inside',
      withoutEnlargement: true,
    });
  }

  return pipeline.webp({ quality: config.quality }).toBuffer();
}

/**
 * Downloads the original image from S3, generates WebP variants, and uploads them back.
 */
export async function processUploadedImage(
  s3Key: string,
  category: 'avatar' | 'post'
): Promise<string[]> {
  // Only process image files
  if (!/\.(jpe?g|png|webp)$/i.test(s3Key)) {
    throw new Error('Only image files can be processed');
  }

  const source = await downloadFromS3(s3Key);
  const variants = category === 'avatar' ? AVATAR_VARIANTS : POST_VARIANTS;
  const uploadedKeys: string[] = [];

  await Promise.all(
    variants.map(async (config) => {
      const buffer = await generateVariant(source, config);
      const variantKey = getVariantKey(s3Key, config.name);
      await uploadBufferToS3(variantKey, buffer, 'image/webp');
      uploadedKeys.push(variantKey);
    })
  );

  return uploadedKeys;
}
