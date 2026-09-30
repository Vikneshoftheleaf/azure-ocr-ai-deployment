import DocumentIntelligence from "@azure-rest/ai-document-intelligence";
import { AzureKeyCredential } from "@azure/core-auth";

const endpoint = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT;
const key = process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY;

const client = DocumentIntelligence(
  endpoint,
  new AzureKeyCredential(key)
);

export async function analyzeDocument(buffer, contentType) {
  const initialResponse = await client
    .path("/documentModels/{modelId}:analyze", "prebuilt-read")
    .post({
      contentType,
      body: buffer,
    });

  if (initialResponse.status !== "202") {
    throw new Error(
      `Document Intelligence error: ${initialResponse.status}`
    );
  }

  const operationLocation =
    initialResponse.headers["operation-location"];

  while (true) {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const response = await client
      .pathUnchecked(operationLocation)
      .get();

    if (response.status !== "200") {
      throw new Error(
        `OCR operation failed: ${response.status}`
      );
    }

    if (response.body.status === "succeeded") {
      return response.body;
    }

    if (["failed", "canceled", "skipped"].includes(response.body.status)) {
      throw new Error(
        response.body.error?.message ||
          `OCR operation ${response.body.status}`
      );
    }
  }
}