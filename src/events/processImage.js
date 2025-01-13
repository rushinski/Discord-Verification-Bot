const { Events } = require('discord.js');
const sharp = require('sharp');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const fs = require('fs');
const path = require('path');

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

          const { data: grayscaleData, info } = await sharp(imageBuffer)
            .grayscale()
            .raw()
            .toBuffer({ resolveWithObject: true });

          const width = info.width;
          const height = info.height;

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

          console.log('Bright region detected. Cropping to:', { minX, minY, maxX, maxY });

          const croppedImageBuffer = await sharp(imageBuffer)
            .extract({
              left: minX,
              top: minY,
              width: maxX - minX + 1,
              height: maxY - minY + 1,
            })
            .toBuffer();

          const savedImagesPath = path.join(process.cwd(), 'src', 'images', 'savedImages');
          const outputFilePath = path.join(savedImagesPath, `croppedProfile-${Date.now()}.png`);

          fs.mkdirSync(savedImagesPath, { recursive: true });
          await sharp(croppedImageBuffer).toFile(outputFilePath);

          console.log('Image successfully cropped and saved:', outputFilePath);

          // Further Crop 1: Add App Button Area
          const addApBtnBuffer = await sharp(croppedImageBuffer)
            .extract({ left: 425, top: 591, width: 29, height: 34 })
            .toBuffer();

          const referenceAddAppPath = path.join(
            process.cwd(),
            'src',
            'images',
            'referenceImages',
            'addApBtn.png'
          );

          const addAppComparisonResult = await compareImages(
            addApBtnBuffer,
            referenceAddAppPath
          );
          console.log('Add App Button Comparison Result:', addAppComparisonResult);

          // Further Crop 2: Settings Button Area
          const settingsBtnBuffer = await sharp(croppedImageBuffer)
            .extract({ left: 1488, top: 776, width: 62, height: 62 })
            .toBuffer();

          const referenceSettingsPath = path.join(
            process.cwd(),
            'src',
            'images',
            'referenceImages',
            'settingsBtn.png'
          );

          const settingsComparisonResult = await compareImages(
            settingsBtnBuffer,
            referenceSettingsPath
          );
          console.log('Settings Button Comparison Result:', settingsComparisonResult);

          await message.delete().catch((err) =>
            console.error('Failed to delete the message:', err)
          );

        } catch (error) {
          console.error('Error processing the image:', error);
          await message.author.send(
            `Hi ${message.author.username}, there was an error processing your image. Please try again or contact support if the issue persists.`
          ).catch(console.error);
        }
        break;
      }
    }
  },
};

// Helper function for pixel-by-pixel comparison
async function compareImages(buffer1, referencePath) {
  const referenceBuffer = fs.readFileSync(referencePath);

  const { data: data1, info: info1 } = await sharp(buffer1).raw().toBuffer({ resolveWithObject: true });
  const { data: data2, info: info2 } = await sharp(referenceBuffer)
    .resize(info1.width, info1.height)
    .raw()
    .toBuffer({ resolveWithObject: true });

  if (info1.width !== info2.width || info1.height !== info2.height) {
    console.error('Image dimensions do not match for comparison.');
    return false;
  }

  let totalDiff = 0;
  for (let i = 0; i < data1.length; i++) {
    totalDiff += Math.abs(data1[i] - data2[i]);
  }

  const avgDiff = totalDiff / data1.length;
  return avgDiff <= 20; // Threshold for acceptable difference
}
