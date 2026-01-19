import { PinataSDK, UploadResponse } from "pinata";

const PINATA_JWT = process.env.PINATA_JWT!;
const PINATA_GATEWAY = process.env.PINATA_GATEWAY!;

export class PinataClient {
  private static instance: PinataClient;
  private pinata: PinataSDK;

  constructor() {
    this.pinata = new PinataSDK({
      pinataJwt: PINATA_JWT,
      pinataGateway: PINATA_GATEWAY, 
    });
  }

  public static getInstance(): PinataClient {
    if (!PinataClient.instance) {
      PinataClient.instance = new PinataClient();
    }
    return PinataClient.instance;
  }

  public getPinata(): PinataSDK {
    return this.pinata;
  }

  public async uploadImage(url: string): Promise<UploadResponse> {
    try {
      const upload = await this.pinata.upload.public.url(url);
      return upload;
    } catch(error) {
      throw new Error(`Failed to upload image: ${error}`);
    }
  }

  //public async uploadBuffer(buffer: Buffer, filename: string): Promise<UploadResponse> {
  //  try {
  //    // Create a File-like object from the buffer for Node.js
  //    const file = new File([buffer], filename, { type: "image/png" }) as any;
  //    const upload = await (this.pinata.upload as any).file(file);
  //    return upload;
  //  } catch(error) {
  //    throw new Error(`Failed to upload buffer: ${error}`);
  //  }
  //}
}
