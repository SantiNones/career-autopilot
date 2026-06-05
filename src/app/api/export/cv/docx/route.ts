import { NextResponse } from "next/server";
import { generateDocxFromText } from "@/server/export/docxExport";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { content?: string; filename?: string };
    if (!body.content?.trim()) {
      return NextResponse.json({ error: "content is required" }, { status: 400 });
    }
    const buf = await generateDocxFromText(body.content);
    const filename = body.filename ?? "CV.docx";
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("[export/cv/docx]", err);
    return NextResponse.json({ error: "DOCX export failed" }, { status: 500 });
  }
}
