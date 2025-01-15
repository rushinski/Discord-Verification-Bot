const { Events } = require('discord.js');
const sharp = require('sharp');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const fs = require('fs');
const path = require('path');
const referenceImagesPath = path.join(process.cwd(), 'src', 'images', 'referenceImages');

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    const targetChannelId = '1328080329101017199';

    if (message.channel.id !== targetChannelId) return;

    console.log(`Message received in channel: ${message.channel.id}`);

    if (message.attachments.size === 0) {
      console.log('No attachments in the message.');
      return;
    }

    for (const attachment of message.attachments.values()) {
      if (attachment.contentType && attachment.contentType.startsWith('image/')) {
        console.log('Image detected, processing...');

        try {
          const response = await fetch(attachment.url);
          const arrayBuffer = await response.arrayBuffer();
          const imageBuffer = Buffer.from(arrayBuffer);

          // Step 1: Dynamic Cropping (Remove Dark Borders)
          const { data: grayscaleData, info } = await sharp(imageBuffer)
            .grayscale()
            .raw()
            .toBuffer({ resolveWithObject: true });

          const { width, height } = info;
          let minX = width, minY = height, maxX = 0, maxY = 0;

          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              const pixelValue = grayscaleData[y * width + x];
              if (pixelValue > 100) {
                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x);
                maxY = Math.max(maxY, y);
              }
            }
          }

          if (minX >= maxX || minY >= maxY) {
            console.error('No bright region detected. Skipping.');
            return message.author.send(
              `Hi ${message.author.username}, your image could not be processed because the profile box could not be identified.`
            ).catch(console.error);
          }

          const dynamicCropBuffer = await sharp(imageBuffer)
            .extract({
              left: minX,
              top: minY,
              width: maxX - minX + 1,
              height: maxY - minY + 1,
            })
            .toBuffer();

          const savedImagesPath = path.join(process.cwd(), 'src', 'images', 'savedImages');
          fs.mkdirSync(savedImagesPath, { recursive: true });
          const dynamicCropPath = path.join(savedImagesPath, `dynamicCrop-${Date.now()}.png`);
          await sharp(dynamicCropBuffer).toFile(dynamicCropPath);

          console.log('Dynamic cropping completed and saved at:', dynamicCropPath);

          // Step 2: Define Specific Regions to Crop
          const regions = [
          { name: 'Add App Button', left: 66, top: 108, width: 510, height: 708, ref: 'addApBtn.png' },
          { name: 'Settings Button', left: 0, top: 533, width: 349, height: 418, ref: 'settingsBtn.png' },
          ];

          // Define region extraction logic with validation
          for (const region of regions) {
          try {
          let searchBuffer = dynamicCropBuffer;

          // Special handling for Settings Button: Crop the rightmost 25% of the dynamic crop
          if (region.name === 'Settings Button') {
          const { width: dynamicWidth, height: dynamicHeight } = await sharp(dynamicCropBuffer).metadata();
          const cropStartX = Math.floor(dynamicWidth * 0.75); // Start from 75% of the width
          const cropWidth = dynamicWidth - cropStartX;

          if (cropStartX < 0 || cropWidth <= 0 || cropStartX + cropWidth > dynamicWidth) {
          console.warn(`Invalid crop region for ${region.name}, adjusting to fit bounds.`);
          // Adjust to ensure valid crop dimensions
          cropStartX = Math.max(0, Math.min(cropStartX, dynamicWidth - 1));
          cropWidth = Math.min(dynamicWidth - cropStartX, dynamicWidth);
          }

          console.log(`Cropping to the rightmost 25% for region: ${region.name}`);
          searchBuffer = await sharp(dynamicCropBuffer)
          .extract({
          left: cropStartX,
          top: 0,
          width: cropWidth,
          height: dynamicHeight,
          })
          .toBuffer();
          }

          // Step 3: Crop Each Specific Region
          const { width: searchWidth, height: searchHeight } = await sharp(searchBuffer).metadata();

          // Validate region bounds against the cropped search buffer
          const adjustedRegion = {
          left: Math.max(0, Math.min(region.left, searchWidth - 1)),
          top: Math.max(0, Math.min(region.top, searchHeight - 1)),
          width: Math.max(1, Math.min(region.width, searchWidth - region.left)),
          height: Math.max(1, Math.min(region.height, searchHeight - region.top)),
          };

          console.log(`Adjusted region for ${region.name}:`, adjustedRegion);

          const regionBuffer = await sharp(searchBuffer)
          .extract(adjustedRegion)
          .toBuffer();

          const referenceBuffer = fs.readFileSync(path.join(referenceImagesPath, region.ref));
          const isMatch = await matchImage(regionBuffer, referenceBuffer, 0.9);

          if (!isMatch) {
          throw new Error('Invalid match or bad extract area.');
          }

          console.log(`${region.name} match: ${isMatch}`);
          } catch (regionError) {
          console.error(`Error processing region ${region.name}:`, regionError.message);
          }
          }

          await message.delete().catch((err) =>
            console.error('Failed to delete the message:', err)
          );

        } catch (error) {
          console.error('Error processing the image:', error);
          await message.author
            .send(
              `Hi ${message.author.username}, there was an error processing your image. Please try again or contact support if the issue persists.`
            )
            .catch(console.error);
        }
        break;
      }
    }
  },
};

/**
 * Check if the reference image exists anywhere in the cropped region.
 * @param {Buffer} fullImageBuffer - The larger cropped region buffer.
 * @param {Buffer} referenceImageBuffer - The reference image buffer.
 * @param {number} threshold - Similarity threshold (e.g., 0.9 for 90% similarity).
 * @returns {boolean} - Whether the reference image is found.
 */
async function matchImage(fullImageBuffer, referenceImageBuffer, threshold = 0.9) {
  const { data: fullImageData, info: fullInfo } = await sharp(fullImageBuffer)
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data: refImageData, info: refInfo } = await sharp(referenceImageBuffer)
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const refWidth = refInfo.width;
  const refHeight = refInfo.height;

  console.log(`Full image dimensions: ${fullInfo.width}x${fullInfo.height}`);
  console.log(`Reference image dimensions: ${refWidth}x${refHeight}`);

  if (refWidth > fullInfo.width || refHeight > fullInfo.height) {
    console.error('Reference image is larger than the full image. Match impossible.');
    return false;
  }

  for (let y = 0; y <= fullInfo.height - refHeight; y++) {
    for (let x = 0; x <= fullInfo.width - refWidth; x++) {
      let totalDiff = 0;

      for (let refY = 0; refY < refHeight; refY++) {
        for (let refX = 0; refX < refWidth; refX++) {
          const refPixelIndex = refY * refWidth + refX;
          const fullPixelIndex = (y + refY) * fullInfo.width + (x + refX);
          totalDiff += Math.abs(refImageData[refPixelIndex] - fullImageData[fullPixelIndex]);
        }
      }

      const avgDiff = totalDiff / (refWidth * refHeight);
      const similarity = 1 - avgDiff / 255;

      if (similarity >= threshold) {
        console.log(`Match found at (${x}, ${y}) with similarity: ${similarity}`);
        return true;
      }
    }
  }

  console.log('No match found.');
  return false;
}
