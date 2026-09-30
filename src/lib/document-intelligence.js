import DocumentIntelligence from "@azure-rest/ai-document-intelligence";
import { AzureKeyCredential } from "@azure/core-auth";

let client;

function getClient() {
  if (client) return client;

  const endpoint =
    process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT;
  const key =
    process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY;

  if (!endpoint || !key) {
    throw new Error(
      "Azure Document Intelligence environment variables are missing"
    );
  }

  client = DocumentIntelligence(
    endpoint,
    new AzureKeyCredential(key)
  );

  return client;
}

export async function analyzeDocument(buffer, contentType) {
  const azureClient = getClient();

  const response = await azureClient
    .path("/documentModels/{modelId}:analyze", "prebuilt-read")
    .post({
      contentType,
      body: buffer,
    });

  if (response.status !== "202") {
    throw new Error(
      `Azure OCR request failed: ${response.status}`
    );
  }

  const operationLocation =
    response.headers["operation-location"];

  if (!operationLocation) {
    throw new Error("Missing operation location");
  }

  for (let i = 0; i < 60; i++) {
    await new Promise((resolve) =>
      setTimeout(resolve, 1000)
    );

    const pollResponse = await azureClient
      .pathUnchecked(operationLocation)
      .get();

    if (pollResponse.status === 200) {
      return pollResponse.body.analyzeResult?.content || "";
    }

    if (pollResponse.status !== 202) {
      throw new Error(
        `Azure OCR polling failed: ${pollResponse.status}`
      );
    }
  }

  throw new Error("Azure OCR timed out");
}