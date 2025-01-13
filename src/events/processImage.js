const { Events } = require('discord.js');
const sharp = require('sharp');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const fs = require('fs');
const path = require('path');

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    const targetChannelId = '1328080329101017199';

    // Check if the message is in the target channel
    if (message.channel.id !== targetChannelId) return;

    console.log(`Message received in channel: ${message.channel.id}`);

    // Ensure there is at least one attachment in the message
    if (message.attachments.size === 0) {
      console.log('No attachments in the message.');
      return;
    }

    for (const attachment of message.attachments.values()) {
      if (attachment.contentType && attachment.contentType.startsWith('image/')) {
        console.log('Image detected, processing...');

        try {
          // Fetch the image from the URL
          const response = await fetch(attachment.url);
          const arrayBuffer = await response.arrayBuffer();
          const imageBuffer = Buffer.from(arrayBuffer);

          // Convert the image to grayscale and get its raw pixel data
          const { data: grayscaleData, info } = await sharp(imageBuffer)
            .grayscale()
            .raw()
            .toBuffer({ resolveWithObject: true });

          const width = info.width;
          const height = info.height;

          // Analyze brightness values to find the bounding box of the bright area
          let minX = width, minY = height, maxX = 0, maxY = 0;

          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              const pixelValue = grayscaleData[y * width + x]; // Get pixel brightness (0-255)

              // Threshold: Consider bright areas as part of the governor profile box
              if (pixelValue > 100) { // Adjust threshold value (100) as needed
                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x);
                maxY = Math.max(maxY, y);
              }
            }
          }

          // Ensure valid cropping dimensions
          if (minX >= maxX || minY >= maxY) {
            console.error('No bright region detected. Skipping.');
            return message.author.send(
              `Hi ${message.author.username}, your image could not be processed because the profile box could not be identified.`
            ).catch(console.error);
          }

          console.log('Bright region detected. Cropping to:', { minX, minY, maxX, maxY });

          // Crop the image dynamically to the detected region
          const croppedImageBuffer = await sharp(imageBuffer)
            .extract({
              left: minX,
              top: minY,
              width: maxX - minX + 1,
              height: maxY - minY + 1,
            })
            .toBuffer();

          // Save the cropped image in the src/images/savedImages folder
          const savedImagesPath = path.join(process.cwd(), 'src', 'images', 'savedImages');
          const outputFilePath = path.join(savedImagesPath, `croppedProfile-${Date.now()}.png`);
          
          // Ensure the directory exists before saving
          fs.mkdirSync(savedImagesPath, { recursive: true });
          
          await sharp(croppedImageBuffer).toFile(outputFilePath);
          
          console.log('Image successfully cropped and saved:', outputFilePath);

          // Delete the image from Discord after saving it
          await message.delete().catch((err) =>
            console.error('Failed to delete the message:', err)
          );

        } catch (error) {
          console.error('Error processing the image:', error);
          await message.author.send(
            `Hi ${message.author.username}, there was an error processing your image. Please try again or contact support if the issue persists.`
          ).catch(console.error);
        }
        break; // Process only the first valid image attachment
      }
    }
  },
};
