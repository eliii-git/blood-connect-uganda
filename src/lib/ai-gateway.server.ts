import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export function createAppAiGatewayProvider(apiKey: string) {
  return createOpenAICompatible({
    name: "app-ai-gateway",
    baseURL: "https://ai.gateway.bloodnet.plus/v1",
    headers: { "X-App-API-Key": apiKey },
  });
}