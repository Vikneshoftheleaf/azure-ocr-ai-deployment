import OpenAI from "openai";
import { getDb } from "@/lib/db";

function getClient() {
  const endpoint =
    process.env.AZURE_FOUNDRY_PROJECT_ENDPOINT;

  const apiKey =
    process.env.AZURE_FOUNDRY_API_KEY;

  if (!endpoint || !apiKey) {
    throw new Error(
      "Azure Foundry environment variables are missing"
    );
  }

  return new OpenAI({
    baseURL: `${endpoint}/openai/v1`,
    apiKey,
  });
}

export async function POST(request, { params }) {
  try {
    const { id } = await params;

    const db = await getDb();

    const result = await db
      .request()
      .input("id", id)
      .query(`
        SELECT id, filename, ocr_text
        FROM documents
        WHERE id = @id
      `);

    if (result.recordset.length === 0) {
      return Response.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    const document = result.recordset[0];
    const client = getClient();

    const response = await client.responses.create({
      model: process.env.AZURE_FOUNDRY_MODEL,
      instructions:
        "You are a document summarization assistant. Summarize the provided document clearly and accurately. Use concise headings and bullet points. Do not invent information.",
      input: document.ocr_text,
    });

    const summary = response.output_text;

    await db
      .request()
      .input("id", id)
      .input("summary", summary)
      .query(`
        UPDATE documents
        SET summary = @summary
        WHERE id = @id
      `);

    return Response.json({
      success: true,
      summary,
    });
  } catch (error) {
    console.error("SUMMARY ERROR:", error);

    return Response.json(
      {
        error: "Failed to generate summary",
        details: error.message,
      },
      { status: 500 }
    );
  }
}