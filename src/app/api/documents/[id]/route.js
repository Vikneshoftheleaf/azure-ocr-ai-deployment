import { getDb } from "@/lib/db";

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const db = await getDb();

    const result = await db
      .request()
      .input("id", id)
      .query(`
        SELECT
          id,
          filename,
          content_type,
          ocr_text,
          summary,
          created_at
        FROM documents
        WHERE id = @id
      `);

    if (result.recordset.length === 0) {
      return Response.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    return Response.json({
      document: result.recordset[0],
    });
  } catch (error) {
    console.error("DOCUMENT ERROR:", error);

    return Response.json(
      { error: "Failed to fetch document" },
      { status: 500 }
    );
  }
}