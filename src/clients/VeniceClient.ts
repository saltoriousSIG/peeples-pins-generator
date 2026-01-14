import axios from "axios";
import { JsonSchema } from "../utils.js";

export type Messages = Array<{
  role: 'system' | 'user' | 'image';
  content: string | Array<{
    type: 'text' | 'image_url';
    text?: string;
    image_url?: {
      url: string;
    };
  }>;
}>;


export type ResponseFormat = JsonSchema | undefined;

export class VeniceClient {
  private apiKey: string = process.env.VENICE_API_KEY || '';
  private baseUrl: string = "https://api.venice.ai/api/v1/";
  public modelId: string = "grok-41-fast";
  private static instance: VeniceClient;

  constructor(modelId?: string) {
    this.modelId = modelId || this.modelId;
  }

  public static getInstance(modelId: string): VeniceClient {
    if (!VeniceClient.instance) {
      VeniceClient.instance = new VeniceClient(modelId);
    }
    return VeniceClient.instance;
  }

  public async makeTextGeneration(
    messages: Messages, 
    temperature: number,
    responseFormat?: ResponseFormat,
  ) {
    const input: Record<string, unknown> = {
      messages,
      temperature,
      model: this.modelId,
      max_tokens: 5000,
      venice_parameters: {
        include_venice_system_prompt: false
      }
    };

    if (responseFormat) {
      input.response_format = responseFormat;
    }

    console.log(input, "input to venice");

    try {
      console.log(this.baseUrl + "chat/completions");
      const { data } = await axios.post(this.baseUrl + "chat/completions", input, {
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
        }
      });
      console.log(data.choices[0], "venice response data");
      return {
        result: data.choices[0].message.content,
      };
    } catch (e) {
      throw new Error(`Venice API request failed: ${e}`);
    }
  }
}
