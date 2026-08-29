import { GoogleGenerativeAI } from "@google/generative-ai";

const VALIDATION_PROMPT =
  "Analyze this image. Is it a valid official identity document like an Indonesian KTP, driving license, passport, or company certificate? Reply strictly with 'YES' or 'NO'.";

export async function validateOfficialDocumentImage(
  imageUrl?: string | null,
  mockedAiResponse?: string,
): Promise<boolean> {
  if (!imageUrl) {
    return false;
  }

  if (mockedAiResponse) {
    return mockedAiResponse.trim().toUpperCase().includes("YES");
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("Gemini KYC validation failed: GEMINI_API_KEY is missing.");
    return false;
  }

  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.error(
        `Gemini KYC validation failed: unable to fetch image URL ${imageUrl}:`,
        response.status,
      );
      return false;
    }

    const contentType =
      response.headers.get("content-type") || "image/jpeg";
    const imageBuffer = Buffer.from(await response.arrayBuffer());
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: contentType,
          data: imageBuffer.toString("base64"),
        },
      },
      { text: VALIDATION_PROMPT },
    ]);

    const verdict = result.response.text().trim().toUpperCase();
    return verdict.includes("YES");
  } catch (error) {
    console.error("Gemini KYC validation failed:", error);
    return false;
  }
}
