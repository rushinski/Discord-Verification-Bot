const { Events } = require('discord.js');
const fs = require('fs');
const tesseract = require('tesseract.js');
const sharp = require('sharp');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const path = require('path');
const referenceImagesPath = path.join(process.cwd(), 'src', 'images', 'referenceImages');
const User = require('../models/User');
const createTicket = require('../utils/ticketCreate');
const assignAllianceRoles = require('../utils/assignAllianceRole');
const Config = require('../models/Config');
const Keyword = require('../models/Keyword');


module.exports = {
  name: Events.MessageCreate,
  
  async execute(message) {
    const guild = message.guild;
    if (!guild) return;
  
    try {
      const config = await Config.findOne({ guildId: guild.id });
  
      // Check for missing configuration
      const missingFields = [];
      if (!config) missingFields.push('Configuration not found in the database');
      if (!config?.verificationChannelId) missingFields.push('Verification channel ID is not set');
      if (!config?.roleId) missingFields.push('Verified role ID is not set');
      if (!config?.ticketCategoryId) missingFields.push('Ticket category ID is not set');
  
      if (missingFields.length > 0) {
        console.warn(`Configuration issues for guild ${guild.id}: ${missingFields.join(', ')}`);
        return; // Stop execution if config is incomplete
      }
  
      const targetChannelId = config.verificationChannelId;
  
      if (!targetChannelId) {
        console.error(`Verification channel ID is missing for guild ${guild.id}.`);
        return;
      }
  
      // Ignore messages outside the verification channel
      if (message.channel.id !== targetChannelId) {
        return;
      }
  
      console.log(`Processing message in the verification channel: ${message.content}`);
  
      // Fetch all alliance keywords for this guild
      const keywords = await Keyword.find({ guildId: guild.id });
  
      if (!keywords.length) {
        console.log(`No alliance keywords configured for guild ${guild.id}.`);
        return;
      }
    } catch (error) {
      console.error(`An error occurred while processing the message: ${error.message}`);
    }

    const keywords = Config.keyword;

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

          console.log('Dynamic cropping completed.');

          // Define a list to keep track of failures
          const failures = [];
          console.log('Starting image processing and validation.');

          // Step 2: Define Specific Regions to Crop
          const regions = [
            { name: 'Add App Button', left: 66, top: 108, width: 510, height: 708, ref: 'addApBtn.png' },
            { name: 'Settings Button', left: 0, top: 533, width: 349, height: 418, ref: 'settingsBtn.png' },
          ];

          for (const region of regions) {
            try {
              console.log(`Processing region: ${region.name}`);
              let searchBuffer = dynamicCropBuffer;

              if (region.name === 'Settings Button') {
                const { width: dynamicWidth, height: dynamicHeight } = await sharp(dynamicCropBuffer).metadata();
                console.log(`Dynamic crop metadata: width=${dynamicWidth}, height=${dynamicHeight}`);
                
                let cropStartX = Math.floor(dynamicWidth * 0.75); 
                let cropWidth = dynamicWidth - cropStartX;

                console.log(`Cropping for Settings Button: StartX=${cropStartX}, CropWidth=${cropWidth}`);
                searchBuffer = await sharp(dynamicCropBuffer)
                  .extract({
                    left: cropStartX,
                    top: 0,
                    width: cropWidth,
                    height: dynamicHeight,
                  })
                  .toBuffer();
              }

              const { width: searchWidth, height: searchHeight } = await sharp(searchBuffer).metadata();
              console.log(`Metadata for region buffer: width=${searchWidth}, height=${searchHeight}`);

              const adjustedRegion = {
                left: Math.max(0, Math.min(region.left, searchWidth - 1)),
                top: Math.max(0, Math.min(region.top, searchHeight - 1)),
                width: Math.max(1, Math.min(region.width, searchWidth - region.left)),
                height: Math.max(1, Math.min(region.height, searchHeight - region.top)),
              };

              console.log(`Adjusted region for cropping: ${JSON.stringify(adjustedRegion)}`);
              const regionBuffer = await sharp(searchBuffer).extract(adjustedRegion).toBuffer();
              const referenceBuffer = fs.readFileSync(path.join(referenceImagesPath, region.ref));
              console.log(`Comparing region ${region.name} to its reference image.`);
              const isMatch = await matchImage(regionBuffer, referenceBuffer, 0.9);

              if (!isMatch) {
                failures.push(`Region ${region.name} did not match the reference.`);
              } else {
                console.log(`${region.name} matched successfully.`);
              }
            } catch (regionError) {
              console.error(`Error processing region ${region.name}:`, regionError.message);
              failures.push(`Error processing region ${region.name}: ${regionError.message}`);
            }
          }

          const checkAlliance = { left: 577, top: 274, width: 391, height: 156 };

          try {
            console.log('Starting alliance region extraction.');
            const extractedAllianceBuffer = await sharp(dynamicCropBuffer).extract(checkAlliance).toBuffer();
            const { data: { text } } = await tesseract.recognize(extractedAllianceBuffer, 'eng');
            console.log('OCR result for alliance region:', text);
          
            const matches = text.match(/\[([^\]]+)\]/);
            if (!matches || !matches[1]) {
              failures.push('Missing or invalid alliance brackets content.');
              console.warn('No valid alliance brackets or content found.');
              return;
            }
          
            const bracketContent = matches[1].trim();
            console.log(`Found alliance content: ${bracketContent}`);
          
            // Fetch keywords from the database (including role IDs)
            const keywordDocs = await Keyword.find({ guildId: message.guild.id });
            const keywords = keywordDocs.map(k => k.keyword);
          
            if (keywords.length === 0) {
              console.warn('No keywords configured. Skipping keyword-based validation.');
              failures.push('No alliance keywords have been set.');
              return;
            }
          
            // Check if bracketContent matches any keyword exactly (case-sensitive)
            const matchedKeyword = keywordDocs.find(k => bracketContent === k.keyword);
          
            if (!matchedKeyword) {
              failures.push(`Invalid alliance content: ${bracketContent}`);
              console.log(`No matching keyword found for: ${bracketContent}`);
            } else {
              console.log(`Alliance content is valid: ${matchedKeyword.keyword}`);
              // Store matched keyword for later processing in the `else` statement
              message.matchedKeyword = matchedKeyword.keyword;
            }
          } catch (allianceError) {
            console.error('Error during alliance region processing:', allianceError.message);
            failures.push(`Alliance region processing error: ${allianceError.message}`);
          }

          // Define the directory for saving images
          const saveDir = path.resolve(__dirname, '../images/savedImages');

          // Ensure the directory exists
          if (!fs.existsSync(saveDir)) {
            fs.mkdirSync(saveDir, { recursive: true }); // Create the directory and its parents if needed
          }

          try {
            const rokIdRegion = { left: 512, top: 39, width: 795, height: 365 };
            console.log('Extracting RoK ID region.');
            const rokIdBuffer = await sharp(dynamicCropBuffer)
              .extract(rokIdRegion)
              .modulate({ brightness: 1.5 })
              .toBuffer();

            // Save the extracted image
            const outputPath = path.join(saveDir, `rokId_${message.author.id}_${Date.now()}.png`);
            await sharp(rokIdBuffer).toFile(outputPath);
            console.log(`Saved RoK ID image to ${outputPath}`);

            console.log('Running OCR on RoK ID region.');
            const { data: { text: rokIdText } } = await tesseract.recognize(rokIdBuffer, 'eng');
            console.log('OCR result for RoK ID region:', rokIdText);

            const rokIdMatch = rokIdText.match(/ID:\s*(\d+)/);

            if (rokIdMatch && rokIdMatch[1]) {
              const rokid = rokIdMatch[1];
              console.log(`Extracted RoK ID: ${rokid}`);

              const existingUser = await User.findOne({ rokid });
              if (existingUser) {
                failures.push(`RoK ID ${rokid} already exists in the database.`);
                console.log(`RoK ID ${rokid} already exists.`);
              } else {
                console.log(`Adding RoK ID ${rokid} to the database.`);
                await User.create({
                  discordUserId: message.author.id,
                  rokid,
                });
              }
            } else {
              failures.push('Failed to extract a valid RoK ID.');
              console.warn('No valid RoK ID found in the OCR result.');
            }
          } catch (rokIdError) {
            console.error('Error processing RoK ID region:', rokIdError.message);
            failures.push(`Error processing RoK ID region: ${rokIdError.message}`);
          }

          // Ticket Creation if Failures Exist
          if (failures.length > 0) {
            console.log('Failures detected. Creating a ticket.');
            try {
              await createTicket({
                guild: message.guild,
                user: message.author,
                imageBuffer: dynamicCropBuffer,
                failures,
              });
            } catch (ticketError) {
              console.error('Failed to create ticket:', ticketError.message);
            }
          } else {
            
            // Fetch keywords from the database
            const keywords = await Keyword.find({ guildId: message.guild.id }).lean();
            
            console.log("Fetched Keywords from DB:", keywords.map(k => k.keyword)); // Debug keywords
            
            if (!keywords || keywords.length === 0) {
              console.log("No keywords found for this guild.");
              return;
            }
            
            // Process message content to check for matching keywords
            const matchedKeyword = message.matchedKeyword;

            if (matchedKeyword) {
              console.log(`Matched keyword: ${matchedKeyword}`);

              // Fetch member and assign alliance roles if applicable
              const member = await message.guild.members.fetch(message.author.id);

              // Find the corresponding keyword document to get role ID (if available)
              const keywordDoc = await Keyword.findOne({ guildId: message.guild.id, keyword: matchedKeyword });
              if (keywordDoc) {
                await assignAllianceRoles(member, keywordDoc.roleId || null); // Always call the function
              } else {
                console.log(`No specific role assigned for keyword: ${matchedKeyword}, assigning only the default role.`);
                await assignAllianceRoles(member, null); // Assign only the default role
              }
            } else {
              console.log('No matching keyword found from OCR extraction.');
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
