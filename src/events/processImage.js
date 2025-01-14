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

          const savedImagesPath = path.join(process.cwd(), 'src', 'images', 'savedImages');
          fs.mkdirSync(savedImagesPath, { recursive: true });

          const outputFilePath = path.join(savedImagesPath, `original-${Date.now()}.png`);
          await sharp(imageBuffer).toFile(outputFilePath);
          console.log('Original image saved at:', outputFilePath);

          const referenceImagesPath = path.join(process.cwd(), 'src', 'images', 'referenceImages');

          const references = [
            { name: 'Add App Button', path: path.join(referenceImagesPath, 'addApBtn.png') },
            { name: 'Settings Button', path: path.join(referenceImagesPath, 'settingsBtn.png') },
          ];

          for (const ref of references) {
            const referenceBuffer = fs.readFileSync(ref.path);
            const isMatch = await matchImage(imageBuffer, referenceBuffer, 0.9);
            console.log(`${ref.name} match: ${isMatch}`);
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
 * Check if the reference image exists anywhere in the larger image.
 * @param {Buffer} fullImageBuffer - The larger image buffer.
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
      const similarity = 1 - avgDiff / 255; // Normalize to a 0-1 scale

      if (similarity >= threshold) {
        console.log(`Match found at (${x}, ${y}) with similarity: ${similarity}`);
        return true; // Match found
      }
    }
  }

  return false; // No match found
}
