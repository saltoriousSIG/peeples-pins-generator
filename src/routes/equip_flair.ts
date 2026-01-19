import { Router } from "express";
import authenticate from "../middleware/middleware.js";
import { PinataClient } from "../clients/PinataClient.js";
import { FLAIR_SLOT_POSITIONS } from "../types/flair.js";
import {
  fetchImageFromIPFS,
  compositeMultipleFlairOnBadge,
} from "../utils/imageComposite.js";

const router = Router();

const PINATA_GATEWAY = process.env.PINATA_GATEWAY!;

/**
 * POST /equip_flair
 * Equips a piece of flair to an NFT badge
 *
 * Expected request body:
 * {
 *   fid: string,              // Farcaster ID of the user
 *   pinTokenId: string,       // NFT token ID
 *   newFlairCid: string,      // IPFS CID of the flair image to equip
 *   slotIndex: number         // Slot index (0, 1, or 2) to equip the flair in
 * }
 *
 * Returns:
 * {
 *   success: true,
 *   newImageCid: string,      // New IPFS CID of the badge with flair
 *   imageUrl: string          // Gateway URL to view the image
 * }
 */
router.post("/", authenticate, async (req, res) => {
  try {
    const { fid, pinTokenId, newFlairCid, slotIndex } = req.body;

    // Validate input
    if (!fid || !pinTokenId || !newFlairCid || slotIndex === undefined) {
      return res.status(400).json({
        error: "Missing required fields: fid, pinTokenId, newFlairCid, slotIndex"
      });
    }

    if (slotIndex < 0 || slotIndex > 2) {
      return res.status(400).json({
        error: "slotIndex must be 0, 1, or 2"
      });
    }

    const pinataClient = PinataClient.getInstance();

    // TODO: Query blockchain/smart contract to get current NFT state
    // This should return:
    // - currentImageCid: the current badge image CID
    // - baseBadgeCid: the original badge without any flair (for re-compositing)
    // - equippedFlair: array of currently equipped flair items
    //
    // Example blockchain query (pseudo-code):
    // const nftState = await blockchainClient.getNFTState(pinTokenId);
    // const { currentImageCid, baseBadgeCid, equippedFlair } = nftState;

    // TEMPORARY: For testing, accept these in the request body
    const { currentImageCid, baseBadgeCid, equippedFlair = [] } = req.body;

    if (!currentImageCid || !baseBadgeCid) {
      return res.status(400).json({
        error: "Missing currentImageCid or baseBadgeCid (temporary - will be fetched from blockchain)"
      });
    }

    // Check if the slot is already occupied
    const slotOccupied = equippedFlair.some(
      (flair: any) => flair.slotIndex === slotIndex
    );

    if (slotOccupied) {
      return res.status(400).json({
        error: `Slot ${slotIndex} is already occupied. Unequip the existing flair first.`
      });
    }

    // Fetch the base badge image (without any flair)
    console.log(`Fetching base badge from IPFS: ${baseBadgeCid}`);
    const baseBadgeBuffer = await fetchImageFromIPFS(baseBadgeCid, PINATA_GATEWAY);

    // Fetch the new flair image
    console.log(`Fetching new flair from IPFS: ${newFlairCid}`);
    const newFlairBuffer = await fetchImageFromIPFS(newFlairCid, PINATA_GATEWAY);

    // Prepare all flair items to composite (existing + new)
    const allFlairToComposite = [
      ...equippedFlair,
      {
        flairCid: newFlairCid,
        slotIndex
      }
    ];

    // Fetch all flair images and prepare for compositing
    const flairItems = await Promise.all(
      allFlairToComposite.map(async (flair: any) => {
        const flairBuffer = flair.flairCid === newFlairCid
          ? newFlairBuffer
          : await fetchImageFromIPFS(flair.flairCid, PINATA_GATEWAY);

        const slotPosition = FLAIR_SLOT_POSITIONS[flair.slotIndex];
        if (!slotPosition) {
          throw new Error(`Invalid slot index: ${flair.slotIndex}`);
        }

        return {
          imageBuffer: flairBuffer,
          slotPosition,
        };
      })
    );

    // Composite all flair onto the base badge
    console.log(`Compositing ${flairItems.length} flair items onto badge`);
    const compositedImageBuffer = await compositeMultipleFlairOnBadge(
      baseBadgeBuffer,
      flairItems
    );

    // Upload the new image to IPFS
    console.log("Uploading composited image to IPFS");
    //const uploadResponse = await pinataClient.uploadBuffer(
    //  compositedImageBuffer,
    //  `badge-${pinTokenId}-${Date.now()}.png`
    //);

    //console.log(`New badge uploaded to IPFS: ${uploadResponse.cid}`);

    // TODO: Update blockchain/smart contract with new state
    // This should update:
    // - currentImageCid to the new uploadResponse.cid
    // - equippedFlair array to include the new flair
    //
    // Example blockchain update (pseudo-code):
    // await blockchainClient.updateNFTState(pinTokenId, {
    //   currentImageCid: uploadResponse.cid,
    //   equippedFlair: allFlairToComposite
    // });

    res.status(200).json({
      success: true,
      //newImageCid: uploadResponse.cid,
      //imageUrl: `${PINATA_GATEWAY}/ipfs/${uploadResponse.cid}`,
      message: `Flair equipped in slot ${slotIndex}`,
    });

  } catch (e: any) {
    console.error("Error equipping flair:", e);
    res.status(500).json({ error: "Internal server error: " + e.message });
  }
});

export default router;
