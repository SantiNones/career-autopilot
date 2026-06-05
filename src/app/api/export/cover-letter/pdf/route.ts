import { NextResponse } from "next/server";
import { generatePdfFromText } from "@/server/export/pdfExport";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { content?: string; filename?: string };
    if (!body.content?.trim()) {
      return NextResponse.json({ error: "content is required" }, { status: 400 });
    }
    const buf = await generatePdfFromText(body.content);
    const filename = body.filename ?? "Cover_Letter.pdf";
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("[export/cover-letter/pdf]", err);
    return NextResponse.json({ error: "PDF export failed" }, { status: 500 });
  }
}
