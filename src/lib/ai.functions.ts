import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const FixInput = z.object({
  text: z.string().min(1).max(20000),
  mode: z.enum(["fix", "formal", "shorten"]).default("fix"),
});

const INSTRUCTIONS: Record<string, string> = {
  fix: "Correct spelling, grammar, punctuation and spacing. Keep the author's meaning, language and tone. Keep line breaks and list structure.",
  formal:
    "Rewrite the text in clear, professional business English. Fix all grammar and spelling. Keep the meaning and the structure of paragraphs.",
  shorten:
    "Rewrite the text so it is shorter and clearer while keeping every important fact. Fix grammar and spelling.",
};

export const fixDocumentText = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => FixInput.parse(input))
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("AI is not configured.");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        input: [
          {
            role: "system",
            content: [
              {
                type: "input_text",
                text: `You are a document proofreader. ${INSTRUCTIONS[data.mode]} Reply with the corrected document text only — no commentary, no markdown fences.`,
              },
            ],
          },
          { role: "user", content: [{ type: "input_text", text: data.text }] },
        ],
        stream: true,
        reasoning: { effort: "low", summary: "auto" },
        include: ["reasoning.encrypted_content"],
      }),
    });

    if (!res.ok || !res.body) {
      const detail = await res.text().catch(() => "");
      if (res.status === 429) throw new Error("The AI is busy right now. Try again in a moment.");
      if (res.status === 402)
        throw new Error("AI credits are used up. Add credits to keep using auto-fix.");
      throw new Error(`AI request failed (${res.status}). ${detail.slice(0, 200)}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let out = "";

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const event = JSON.parse(payload) as {
            type?: string;
            delta?: string;
            response?: { output_text?: string };
          };
          if (event.type === "response.output_text.delta" && typeof event.delta === "string") {
            out += event.delta;
          } else if (event.type === "response.completed" && !out) {
            out = event.response?.output_text ?? "";
          }
        } catch {
          /* ignore partial frames */
        }
      }
    }

    const cleaned = out.trim();
    if (!cleaned) throw new Error("The AI could not rewrite this text. Try again.");
    return { text: cleaned };
  });

const PhotoInput = z.object({ image: z.string().startsWith("data:image/").max(8_000_000) });

/** Replace a portrait photo's background with plain white (passport/ID style). */
export const whitenPhotoBackground = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => PhotoInput.parse(input))
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("AI is not configured.");
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
        "Lovable-API-Key": key,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        modalities: ["image", "text"],
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Replace the background of this portrait with a plain, evenly lit pure white background (#FFFFFF) suitable for a passport photo. Keep the person's face, hair, clothing, skin tone and expression exactly the same. Do not crop, do not add anything.",
              },
              { type: "image_url", image_url: { url: data.image } },
            ],
          },
        ],
      }),
    });
    if (!res.ok) {
      if (res.status === 429) throw new Error("The AI is busy right now. Try again in a moment.");
      if (res.status === 402) throw new Error("AI credits are used up.");
      throw new Error(`AI request failed (${res.status}).`);
    }
    const json = (await res.json()) as any;
    const url: string | undefined = json?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!url) throw new Error("The AI did not return a photo.");
    return { image: url };
  });
