import { analyzeDocument } from "@/lib/document-intelligence";
import { getDb } from "@/lib/db";
const contentTypesByExtension = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".bmp": "image/bmp",
  ".tif": "image/tiff",
  ".tiff": "image/tiff",
  ".heic": "image/heif",
  ".heif": "image/heif",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".pptx":
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".html": "text/html",
  ".htm": "text/html",
};

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return Response.json({ error: "No file uploaded" }, { status: 400 });
    }

    const extension = file.name.match(/\.[^.]+$/)?.[0].toLowerCase();
    const contentType = contentTypesByExtension[extension];

    if (!contentType) {
      return Response.json(
        {
          error:
            "Unsupported file type. Upload a PDF, image, Office document, or HTML file.",
        },
        { status: 415 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const result = await analyzeDocument(buffer, contentType);

    const text = result.analyzeResult?.content || "";
    const db = await getDb();

    const insertResult = await db
      .request()
      .input("filename", file.name)
      .input("content_type", file.type)
      .input("ocr_text", text).query(`
    INSERT INTO documents
      (filename, content_type, ocr_text)
    OUTPUT INSERTED.id AS id
    VALUES
      (@filename, @content_type, @ocr_text)
  `);

    if (!text.trim()) {
      return Response.json(
        { error: "No readable text was found in the document." },
        { status: 422 },
      );
    }

    return Response.json({
      id: insertResult.recordset[0].id,
      filename: file.name,
      text,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        error: "Document analysis failed",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
