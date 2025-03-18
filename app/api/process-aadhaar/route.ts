import { NextRequest, NextResponse } from "next/server";
import * as mindee from "mindee";
import { writeFile } from "fs/promises";
import path from "path";
import os from "os";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const tempFilePath = path.join(
      os.tmpdir(),
      `mindee-upload-${Date.now()}-${file.name}`,
    );
    await writeFile(tempFilePath, buffer);

    const mindeeClient = new mindee.Client({
      apiKey: process.env.MINDEE_API_KEY || "",
    });

    const inputSource = mindeeClient.docFromPath(tempFilePath);

    const customEndpoint = mindeeClient.createEndpoint(
      "aadhaar_card",
      "KingBing",
      "1",
    );

    const apiResponse = await mindeeClient.enqueueAndParse(
      mindee.product.GeneratedV1,
      inputSource,
      { endpoint: customEndpoint },
    );

    const fields = apiResponse.document?.inference.prediction.fields;
    if (!fields) {
      throw new Error("No fields found in document");
    }
    const jsonObject = Object.fromEntries(
      Array.from(fields.entries()).map(([key, obj]) => [key, obj.value]),
    );
    return NextResponse.json({
      success: true,
      data: jsonObject,
    });
  } catch (error) {
    console.error("Error processing document:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process document",
      },
      { status: 500 },
    );
  }
}
