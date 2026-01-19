import sharp from "sharp";
import axios from "axios";
import { FlairSlotPosition, FlairItem, BADGE_WIDTH, BADGE_HEIGHT } from "../types/flair.js";

/**
 * Fetches an image from IPFS using the Pinata gateway
 */
export async function fetchImageFromIPFS(cid: string, gatewayUrl: string): Promise<Buffer> {
  try {
    const imageUrl = `${gatewayUrl}/ipfs/${cid}`;
    const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
    return Buffer.from(response.data);
  } catch (error) {
    throw new Error(`Failed to fetch image from IPFS: ${error}`);
  }
}

/**
 * Fetches an image from a URL
 */
export async function fetchImageFromUrl(url: string): Promise<Buffer> {
  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    return Buffer.from(response.data);
  } catch (error) {
    throw new Error(`Failed to fetch image from URL: ${error}`);
  }
}

/**
 * Composites a flair image onto a badge at a specific slot position
 */
export async function compositeFlairOnBadge(
  badgeImageBuffer: Buffer,
  flairImageBuffer: Buffer,
  slotPosition: FlairSlotPosition
): Promise<Buffer> {
  try {
    // Resize the flair image to fit the slot
    const resizedFlair = await sharp(flairImageBuffer)
      .resize(slotPosition.width, slotPosition.height, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .toBuffer();

    // Composite the flair onto the badge
    const composited = await sharp(badgeImageBuffer)
      .composite([
        {
          input: resizedFlair,
          top: slotPosition.y,
          left: slotPosition.x,
        },
      ])
      .toBuffer();

    return composited;
  } catch (error) {
    throw new Error(`Failed to composite flair on badge: ${error}`);
  }
}

/**
 * Composites multiple flair items onto a badge
 */
export async function compositeMultipleFlairOnBadge(
  badgeImageBuffer: Buffer,
  flairItems: Array<{ imageBuffer: Buffer; slotPosition: FlairSlotPosition }>
): Promise<Buffer> {
  try {
    // Prepare all flair overlays
    const overlays = await Promise.all(
      flairItems.map(async ({ imageBuffer, slotPosition }) => {
        const resizedFlair = await sharp(imageBuffer)
          .resize(slotPosition.width, slotPosition.height, {
            fit: "contain",
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          })
          .toBuffer();

        return {
          input: resizedFlair,
          top: slotPosition.y,
          left: slotPosition.x,
        };
      })
    );

    // Composite all flair onto the badge in one operation
    const composited = await sharp(badgeImageBuffer)
      .composite(overlays)
      .toBuffer();

    return composited;
  } catch (error) {
    throw new Error(`Failed to composite multiple flair on badge: ${error}`);
  }
}

/**
 * Creates a base badge image with no flair (useful for unequip operations)
 * This fetches the original badge and returns it as-is, or you can provide
 * a base badge CID to start from
 */
export async function getBaseBadgeImage(
  baseBadgeCid: string,
  gatewayUrl: string
): Promise<Buffer> {
  return fetchImageFromIPFS(baseBadgeCid, gatewayUrl);
}
