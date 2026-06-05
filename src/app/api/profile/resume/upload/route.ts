import { NextResponse } from "next/server";

import { extractFromFile, UploadValidationError } from "@/server/resumeUploadParsing";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const { rawText, links } = await extractFromFile(buffer, file.type, file.name);

    return NextResponse.json({ rawText, links });
  } catch (e) {
    if (e instanceof UploadValidationError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    const message = e instanceof Error ? e.message : "Upload failed. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
