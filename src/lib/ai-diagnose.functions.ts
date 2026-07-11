import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const Input = z.object({
  plant: z.string().optional(),
  description: z.string().min(3),
  imageDataUrl: z.string().optional(),
});

export const diagnosePlant = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => Input.parse(raw))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-3-flash-preview");

    const system = `أنت خبير زراعي في تشخيص أمراض النباتات والآفات. أجب باللغة العربية.
قدّم:
1) التشخيص المحتمل (مرض/آفة/نقص عناصر)
2) الأعراض الملاحظة
3) الأسباب المحتملة
4) العلاج الموصى به (كيميائي وعضوي وزراعي)
5) الوقاية
6) درجة الثقة (منخفضة/متوسطة/عالية)
استخدم markdown مع عناوين واضحة.`;

    const userText = `النبات: ${data.plant || "غير محدد"}\nالوصف: ${data.description}`;

    const content: Array<
      { type: "text"; text: string } | { type: "image"; image: string }
    > = [{ type: "text", text: userText }];
    if (data.imageDataUrl) content.push({ type: "image", image: data.imageDataUrl });

    const { text } = await generateText({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content },
      ],
    });

    return { diagnosis: text };
  });
