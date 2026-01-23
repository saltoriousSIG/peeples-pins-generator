import { Router, Request } from "express";
import authenticate from "../middleware/middleware.js";
import axios from "axios";
import sharp from "sharp";

const PINATA_GATEWAY = process.env.PINATA_GATEWAY;

const router = Router();

type ModifyPfpRequest = {
  baseCID: string;
  appliedFlair: Array<string>;
};

const BASE_SIZE = 1024;
const FLAIR_SIZE = 75;

// Positions for flair slots (top-left coordinates for 75px flair)
// Center positions: (291, 830), (482, 830), (662, 830)
// Top-left = center - (FLAIR_SIZE / 2)
const FLAIR_POSITIONS: Array<{ top: number; left: number }> = [
  { top: 793, left: 254 },   // slot 0 - left pinhole (center: 291, 830)
  { top: 793, left: 445 },   // slot 1 - center pinhole (center: 482, 830)
  { top: 793, left: 625 },   // slot 2 - right pinhole (center: 662, 830)
];

const modifyImage = async (
  baseBuffer: Buffer,
  flairBuffers: Array<Buffer>
): Promise<Buffer> => {
  // Resize base image to consistent 1024x1024 dimensions
  const resizedBase = await sharp(baseBuffer)
    .resize(BASE_SIZE, BASE_SIZE)
    .png()
    .toBuffer();

  // Resize all flair images
  const resizedFlairs = await Promise.all(
    flairBuffers.map((buffer) =>
      sharp(buffer).resize(FLAIR_SIZE, FLAIR_SIZE).toBuffer()
    )
  );

  const composites = resizedFlairs
    .slice(0, FLAIR_POSITIONS.length)
    .map((buffer, index) => ({
      input: buffer,
      top: FLAIR_POSITIONS[index]!.top,
      left: FLAIR_POSITIONS[index]!.left,
    }));

  return sharp(resizedBase)
    .composite(composites)
    .png()
    .toBuffer();
};

router.post(
  "/",
  authenticate,
  async (req: Request<{}, {}, ModifyPfpRequest>, res) => {
    const { baseCID, appliedFlair } = req.body;

    try {
      // get the image at body from ipfs
      const { data: baseImage } = await axios.get(`${PINATA_GATEWAY}/ipfs/${baseCID}`, {
        responseType: "arraybuffer",
      });
      const baseImageBuffer = Buffer.from(baseImage);
      console.log(baseImageBuffer);

      const flairBuffers: Array<Buffer> = [];

      for (const flair of appliedFlair) {
        const { data: flairImage } = await axios.get(`${PINATA_GATEWAY}/ipfs/${flair}`, {
          responseType: "arraybuffer"
        }); 

        const flairBuffer = Buffer.from(flairImage);
        flairBuffers.push(flairBuffer);
      }




      const result = await modifyImage(baseImageBuffer, flairBuffers);

      res.set("Content-Type", "image/png");
      res.status(200).send(result);

    } catch (e) {
      console.log(e)
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
