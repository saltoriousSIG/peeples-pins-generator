import Replicate from "replicate";

export class ReplicateClient {
  private apiKey: string = process.env.REPLICATE_API_KEY || "";
  private static instance: ReplicateClient;
  public modelId: `${string}/${string}` = "google/nano-banana-pro";
  private replicate: Replicate;

  constructor() {
    this.replicate = new Replicate({ auth: this.apiKey });
  }

  public static getInstance(): ReplicateClient {
    if (!ReplicateClient.instance) {
      ReplicateClient.instance = new ReplicateClient();
    }
    return ReplicateClient.instance;
  }

  public async generate(prompt: string, reference: string) {
    const input = {
      prompt,
      resolution: "2K",
      image_input: [reference],
      aspect_ratio: "1:1",
      output_format: "png",
      safety_filter_level: "block_only_high",
    }

    console.log("Input to Replicate:", input);
    const prediction: any = await this.replicate.run(this.modelId, {
      input
    });
    console.log("Replicate prediction:", prediction);

    return prediction.url();
  }
}
