const { Events } = require('discord.js');
const sharp = require('sharp');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const tesseract = require('tesseract.js');
const fs = require('fs');
const path = require('path');

const referenceImages = {
  addApBtn: './src/images/referenceImages/addApBtn.png',
  settingsBtn: './src/images/referenceImages/settingsBtn.png',
};
const savedImagesPath = './src/images/savedImages';
const whitelistedAlliances = ['AllianceA', 'AllianceB', 'AllianceC'];

function compareImages(buffer1, buffer2) {
  return Promise.all([sharp(buffer1).raw().toBuffer(), sharp(buffer2).raw().toBuffer()])
    .then(([image1, image2]) => {
      if (image1.length !== image2.length) return false;
      for (let i = 0; i < image1.length; i++) {
        if (image1[i] !== image2[i]) return false;
      }
      return true;
    });
}

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
      if (attachment.contentType.startsWith('image/')) {
        console.log('Image detected, processing...');
        try {
          // Fetch the image from the URL
          const response = await fetch(attachment.url);
          const arrayBuffer = await response.arrayBuffer();
          const imageBuffer = Buffer.from(arrayBuffer);

          // Check image metadata
          const metadata = await sharp(imageBuffer).metadata();
          console.log('Image metadata:', metadata);

          const cropArea = { left: 152, top: 93, width: 1608, height: 885 };
          if (
            cropArea.left + cropArea.width > metadata.width ||
            cropArea.top + cropArea.height > metadata.height
          ) {
            console.error('Crop area exceeds image dimensions. Skipping.');
            await message.author.send(
              `Hi ${message.author.username}, your image couldn't be processed because it's too small. ` +
              `The minimum dimensions are ${cropArea.width}x${cropArea.height} pixels. Please upload a larger image.`
            ).catch(console.error);
            await message.delete();
            return;
          }

          // Crop the main region of interest
          const croppedImageBuffer = await sharp(imageBuffer)
            .extract(cropArea)
            .toBuffer();
          console.log('Image successfully cropped.');

          // Save cropped main image
          await sharp(croppedImageBuffer).toFile(
            path.join(savedImagesPath, `croppedMain-${Date.now()}.png`)
          );

          // Crop Add AP Button region and save
          const addApBtnBuffer = await sharp(croppedImageBuffer)
            .extract({ left: 400, top: 567, width: 28, height: 27 })
            .toBuffer();
          await sharp(addApBtnBuffer).toFile(
            path.join(savedImagesPath, `addApBtn-${Date.now()}.png`)
          );

          const addApBtnReference = fs.readFileSync(referenceImages.addApBtn);
          const addApMatch = await compareImages(addApBtnBuffer, addApBtnReference);
          if (!addApMatch) {
            console.log('Add AP Button does not match.');
            await message.delete();
            return message.author.send(
              `Your image doesn't meet the expected criteria for the add AP button.`
            ).catch(console.error);
          }

          // Crop Settings Button region and save
          const settingsBtnBuffer = await sharp(croppedImageBuffer)
            .extract({ left: 1459, top: 749, width: 76, height: 69 })
            .toBuffer();
          await sharp(settingsBtnBuffer).toFile(
            path.join(savedImagesPath, `settingsBtn-${Date.now()}.png`)
          );

          const settingsBtnReference = fs.readFileSync(referenceImages.settingsBtn);
          const settingsBtnMatch = await compareImages(settingsBtnBuffer, settingsBtnReference);
          if (!settingsBtnMatch) {
            console.log('Settings Button does not match.');
            await message.delete();
            return message.author.send(
              `Your image doesn't meet the expected criteria for the settings button.`
            ).catch(console.error);
          }

          // Process OCR for the cropped image
          const ocrBuffer = await sharp(croppedImageBuffer)
            .extract({ left: 552, top: 296, width: 87, height: 33 })
            .toBuffer();
          await sharp(ocrBuffer).toFile(
            path.join(savedImagesPath, `ocrRegion-${Date.now()}.png`)
          );

          const { data: { text } } = await tesseract.recognize(ocrBuffer);
          const extractedAlliance = text.replace(/[\[\]]/g, '').trim();
          console.log('Extracted alliance name:', extractedAlliance);

          if (!whitelistedAlliances.includes(extractedAlliance)) {
            console.log('Alliance not whitelisted.');
            await message.delete();
            return message.author.send(
              `Your image references an alliance (${extractedAlliance}) that is not on the whitelist.`
            ).catch(console.error);
          }

          console.log('Image successfully validated.');
          await message.delete();
          console.log('Original message deleted after processing.');
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
