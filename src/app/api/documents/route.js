import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const db = await getDb();

    const result = await db.request().query(`
      SELECT
        id,
        filename,
        content_type,
        LEFT(ocr_text, 520) AS ocr_preview,
        created_at
      FROM documents
      ORDER BY created_at DESC
    `);

    return Response.json({
      documents: result.recordset,
    });
  } catch (error) {
    console.error("DATABASE ERROR:", error);

    return Response.json(
      {
        error: "Failed to fetch documents",
      },
      { status: 500 }
    );
  }
}