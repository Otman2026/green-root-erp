import { Button, Input, Textarea, Card, CardContent, CardHeader, CardTitle, Label } from "@/ds";
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import ReactMarkdown from "react-markdown";
import { Sparkles, Upload, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { diagnosePlant } from "@/lib/ai-diagnose.functions";

export const Route = createFileRoute("/_authenticated/ai")({
  component: AiDiagnosisPage,
});

function AiDiagnosisPage() {
  const diagnose = useServerFn(diagnosePlant);
  const [plant, setPlant] = useState("");
  const [description, setDescription] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [result, setResult] = useState<string>("");

  const mut = useMutation({
    mutationFn: async () => {
      const res = await diagnose({
        data: {
          plant: plant || undefined,
          description,
          imageDataUrl: imageDataUrl || undefined,
        },
      });
      return res.diagnosis;
    },
    onSuccess: (text) => setResult(text),
    onError: (e: Error) =>
      toast.error(e.message?.includes("429")
        ? "تم تجاوز الحد المسموح، حاول لاحقاً"
        : e.message?.includes("402")
        ? "تم استنفاد رصيد الذكاء الاصطناعي"
        : "فشل التشخيص: " + e.message),
  });

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("الصورة كبيرة جداً (أقصى 5 ميغا)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImageDataUrl(String(reader.result));
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Sparkles className="h-7 w-7 text-primary" />
          التشخيص بالذكاء الاصطناعي
        </h1>
        <p className="text-sm text-muted-foreground">
          صف مشكلة النبات أو ارفع صورة للحصول على تشخيص وعلاج مقترح
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>بيانات النبات</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>اسم النبات (اختياري)</Label>
              <Input
                placeholder="مثال: طماطم، زيتون..."
                value={plant}
                onChange={(e) => setPlant(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>وصف المشكلة *</Label>
              <Textarea
                rows={6}
                placeholder="اشرح الأعراض: لون الأوراق، وجود بقع، ذبول..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>صورة (اختياري)</Label>
              {imageDataUrl ? (
                <div className="relative inline-block">
                  <img src={imageDataUrl} alt="preview" className="max-h-48 rounded-md border" />
                  <Button
                    size="icon" variant="destructive"
                    className="absolute -top-2 -end-2 h-6 w-6"
                    onClick={() => setImageDataUrl(null)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed p-6 text-sm text-muted-foreground hover:bg-accent">
                  <Upload className="h-4 w-4" />
                  اختر صورة
                  <input type="file" accept="image/*" hidden onChange={onFile} />
                </label>
              )}
            </div>
            <Button
              className="w-full"
              disabled={!description.trim() || mut.isPending}
              onClick={() => mut.mutate()}
            >
              {mut.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />جاري التحليل...</>
              ) : (
                <><Sparkles className="mr-2 h-4 w-4" />تشخيص</>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>النتيجة</CardTitle>
          </CardHeader>
          <CardContent>
            {mut.isPending ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                يقوم الذكاء الاصطناعي بتحليل الحالة...
              </div>
            ) : result ? (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown>{result}</ReactMarkdown>
              </div>
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">
                ستظهر نتيجة التشخيص هنا
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
