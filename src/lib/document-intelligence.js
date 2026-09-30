import DocumentIntelligence, {
  getLongRunningPoller,
  isUnexpected,
} from "@azure-rest/ai-document-intelligence";
import { AzureKeyCredential } from "@azure/core-auth";

let client;

function getClient() {
  if (client) return client;

  const endpoint = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT;
  const key = process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY;

  if (!endpoint || !key) {
    throw new Error("Azure Document Intelligence environment variables are missing");
  }

  client = DocumentIntelligence(endpoint, new AzureKeyCredential(key));
  return client;
}

export async function analyzeDocument(buffer, contentType) {
  const azureClient = getClient();

  const initialResponse = await azureClient
    .path("/documentModels/{modelId}:analyze", "prebuilt-read")
    .post({ contentType, body: buffer });

  if (isUnexpected(initialResponse)) {
    throw new Error(
      `Azure OCR request failed: ${initialResponse.status} ${JSON.stringify(
        initialResponse.body?.error ?? initialResponse.body
      )}`
    );
  }

  const poller = getLongRunningPoller(azureClient, initialResponse);
  const result = await poller.pollUntilDone();

  // Return the full body so your route's `result.analyzeResult?.content` works
  return result.body;
}