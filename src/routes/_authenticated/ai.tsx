import { Button, Input, Textarea, Card, CardContent, CardHeader, CardTitle, Label, Badge, Tabs, TabsList, TabsTrigger, TabsContent } from "@/ds";
import { useState, useRef, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import ReactMarkdown from "react-markdown";
import { Sparkles, Upload, Loader2, X, MessageSquare, Stethoscope, Send, Trash2, Plus, Package, AlertTriangle, ShieldCheck, Leaf, Printer } from "lucide-react";
import { toast } from "sonner";
import { diagnosePlant } from "@/lib/ai-diagnose.functions";
import { askAgriAI, listConversations, getConversation, deleteConversation } from "@/lib/ai-chat.functions";

export const Route = createFileRoute("/_authenticated/ai")({
  component: AiPage,
});

function AiPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Sparkles className="h-7 w-7 text-primary" />
          مساعد Haytam AGRI الذكي
        </h1>
        <p className="text-sm text-muted-foreground">
          تشخيص الأمراض والآفات + محادثة زراعية متكاملة مربوطة بقاعدة المعرفة والمخزون
        </p>
      </div>
      <Tabs defaultValue="diagnose">
        <TabsList>
          <TabsTrigger value="diagnose"><Stethoscope className="h-4 w-4 me-2" />تشخيص</TabsTrigger>
          <TabsTrigger value="chat"><MessageSquare className="h-4 w-4 me-2" />محادثة</TabsTrigger>
        </TabsList>
        <TabsContent value="diagnose" className="mt-4"><DiagnoseTab /></TabsContent>
        <TabsContent value="chat" className="mt-4"><ChatTab /></TabsContent>
      </Tabs>
    </div>
  );
}

type DiagnosisResult = Awaited<ReturnType<typeof diagnosePlant>>;

function DiagnoseTab() {
  const diagnose = useServerFn(diagnosePlant);
  const [plant, setPlant] = useState("");
  const [description, setDescription] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [result, setResult] = useState<DiagnosisResult | null>(null);

  const mut = useMutation({
    mutationFn: async () =>
      diagnose({
        data: {
          plant: plant || undefined,
          description,
          imageDataUrl: imageDataUrl || undefined,
          lang: "ar",
        },
      }),
    onSuccess: (res) => setResult(res),
    onError: (e: Error) =>
      toast.error(
        e.message?.includes("429") ? "تم تجاوز الحد المسموح، حاول لاحقاً"
        : e.message?.includes("402") ? "تم استنفاد رصيد الذكاء الاصطناعي"
        : "فشل التشخيص: " + e.message,
      ),
  });

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("الصورة كبيرة جداً (أقصى 5 ميغا)");
    const reader = new FileReader();
    reader.onload = () => setImageDataUrl(String(reader.result));
    reader.readAsDataURL(file);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>بيانات النبات</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>اسم النبات (اختياري)</Label>
            <Input placeholder="مثال: طماطم، زيتون..." value={plant} onChange={(e) => setPlant(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>وصف المشكلة *</Label>
            <Textarea rows={6} placeholder="اشرح الأعراض: لون الأوراق، وجود بقع، ذبول..."
              value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>صورة (اختياري)</Label>
            {imageDataUrl ? (
              <div className="relative inline-block">
                <img src={imageDataUrl} alt="preview" className="max-h-48 rounded-md border" />
                <Button size="icon" variant="destructive" className="absolute -top-2 -end-2 h-6 w-6" onClick={() => setImageDataUrl(null)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed p-6 text-sm text-muted-foreground hover:bg-accent">
                <Upload className="h-4 w-4" /> اختر صورة
                <input type="file" accept="image/*" hidden onChange={onFile} />
              </label>
            )}
          </div>
          <Button className="w-full" disabled={!description.trim() || mut.isPending} onClick={() => mut.mutate()}>
            {mut.isPending ? <><Loader2 className="me-2 h-4 w-4 animate-spin" />جاري التحليل...</> : <><Sparkles className="me-2 h-4 w-4" />تشخيص</>}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>النتيجة</span>
            <div className="flex items-center gap-2">
              {result && (
                <>
                  <Badge variant={result.confidence === "high" ? "default" : result.confidence === "medium" ? "secondary" : "outline"}>
                    ثقة: {result.confidence === "high" ? "عالية" : result.confidence === "medium" ? "متوسطة" : "منخفضة"}
                  </Badge>
                  <Button size="sm" variant="outline" onClick={() => printDiagnosis(result, { plant, description })}>
                    <Printer className="h-4 w-4 me-1" />PDF
                  </Button>
                </>
              )}
            </div>
          </CardTitle>

        </CardHeader>
        <CardContent>
          {mut.isPending ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="me-2 h-5 w-5 animate-spin" />يقوم الذكاء الاصطناعي بتحليل الحالة...
            </div>
          ) : result ? (
            <DiagnosisView result={result} />
          ) : (
            <p className="py-12 text-center text-sm text-muted-foreground">ستظهر نتيجة التشخيص هنا</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Section({ icon, title, items }: { icon: React.ReactNode; title: string; items: string[] }) {
  if (!items?.length) return null;
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 font-semibold">{icon}{title}</div>
      <ul className="ms-6 list-disc space-y-1 text-sm">
        {items.map((it, i) => <li key={i}>{it}</li>)}
      </ul>
    </div>
  );
}

function DiagnosisView({ result }: { result: DiagnosisResult }) {
  return (
    <div className="space-y-4">
      <div className="prose prose-sm max-w-none dark:prose-invert">
        <ReactMarkdown>{result.diagnosis}</ReactMarkdown>
      </div>

      {(result.knowledge_base?.diseases?.length ?? 0) + (result.knowledge_base?.pests?.length ?? 0) > 0 && (
        <div className="rounded-md border bg-muted/30 p-3">
          <div className="mb-2 text-xs font-semibold text-muted-foreground">مصادر قاعدة المعرفة المطابقة:</div>
          <div className="flex flex-wrap gap-1">
            {result.knowledge_base.diseases.map((d: any) => (
              <Badge key={d.id} variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />{d.name_ar}</Badge>
            ))}
            {result.knowledge_base.pests.map((p: any) => (
              <Badge key={p.id} variant="secondary" className="gap-1"><Leaf className="h-3 w-3" />{p.name_ar}</Badge>
            ))}
          </div>
        </div>
      )}

      <Section icon={<AlertTriangle className="h-4 w-4 text-orange-500" />} title="الأعراض" items={result.symptoms} />
      <Section icon={<AlertTriangle className="h-4 w-4 text-red-500" />} title="الأسباب" items={result.causes} />
      <Section icon={<ShieldCheck className="h-4 w-4 text-blue-500" />} title="علاج كيميائي" items={result.treatments_chemical} />
      <Section icon={<Leaf className="h-4 w-4 text-green-600" />} title="علاج عضوي" items={result.treatments_organic} />
      <Section icon={<ShieldCheck className="h-4 w-4 text-emerald-500" />} title="ممارسات زراعية" items={result.treatments_cultural} />
      <Section icon={<ShieldCheck className="h-4 w-4 text-indigo-500" />} title="الوقاية" items={result.prevention} />
      <Section icon={<Sparkles className="h-4 w-4 text-purple-500" />} title="بدائل" items={result.alternatives} />

      {result.suggested_products?.length > 0 && (
        <div className="rounded-md border border-primary/30 bg-primary/5 p-3">
          <div className="mb-2 flex items-center gap-2 font-semibold"><Package className="h-4 w-4" />منتجات متوفرة في مخزونك</div>
          <div className="space-y-2">
            {result.suggested_products.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between rounded border bg-background p-2 text-sm">
                <div>
                  <div className="font-medium">{p.name_ar}</div>
                  <div className="text-xs text-muted-foreground">SKU: {p.sku ?? "-"}</div>
                </div>
                <div className="text-end">
                  <Badge variant={p.stock_quantity > 0 ? "default" : "destructive"}>
                    مخزون: {p.stock_quantity ?? 0}
                  </Badge>
                  {p.sale_price && <div className="mt-1 text-xs">{p.sale_price} د.ج</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// -------- Chat Tab --------
function ChatTab() {
  const qc = useQueryClient();
  const listFn = useServerFn(listConversations);
  const getFn = useServerFn(getConversation);
  const askFn = useServerFn(askAgriAI);
  const delFn = useServerFn(deleteConversation);

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const conversations = useQuery({ queryKey: ["ai-convs"], queryFn: () => listFn({}) });
  const messages = useQuery({
    queryKey: ["ai-msgs", conversationId],
    queryFn: () => (conversationId ? getFn({ data: { id: conversationId } }) : Promise.resolve([])),
    enabled: !!conversationId,
  });

  const send = useMutation({
    mutationFn: async (message: string) =>
      askFn({ data: { conversation_id: conversationId, message, lang: "ar" } }),
    onSuccess: (res) => {
      if (!conversationId) setConversationId(res.conversation_id);
      qc.invalidateQueries({ queryKey: ["ai-msgs"] });
      qc.invalidateQueries({ queryKey: ["ai-convs"] });
    },
    onError: (e: Error) => toast.error("خطأ: " + e.message),
  });

  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => {
      setConversationId(null);
      qc.invalidateQueries({ queryKey: ["ai-convs"] });
    },
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.data, send.isPending]);

  const submit = () => {
    if (!input.trim() || send.isPending) return;
    const msg = input;
    setInput("");
    send.mutate(msg);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            المحادثات
            <Button size="sm" variant="ghost" onClick={() => setConversationId(null)}>
              <Plus className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {conversations.data?.length ? conversations.data.map((c: any) => (
            <div key={c.id} className={`flex items-center gap-1 rounded p-2 text-sm ${conversationId === c.id ? "bg-accent" : "hover:bg-accent/50"}`}>
              <button className="flex-1 truncate text-start" onClick={() => setConversationId(c.id)}>
                {c.title || "بدون عنوان"}
              </button>
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => del.mutate(c.id)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )) : <p className="text-xs text-muted-foreground">لا توجد محادثات بعد</p>}
        </CardContent>
      </Card>

      <Card className="flex h-[600px] flex-col">
        <CardContent ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
          {!conversationId && !messages.data?.length && (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-muted-foreground">
              <MessageSquare className="h-10 w-10" />
              <p className="text-sm">اسأل عن أي شيء زراعي: زراعة، أمراض، جرعات، مواسم، مبيدات...</p>
              <div className="flex flex-wrap justify-center gap-2">
                {QUICK_PROMPTS.map((q) => (
                  <Button key={q} size="sm" variant="outline" onClick={() => { setInput(q); }}>{q}</Button>
                ))}
              </div>
            </div>
          )}

          {messages.data?.map((m: any) => (
            <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                {m.role === "assistant" ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert"><ReactMarkdown>{m.content}</ReactMarkdown></div>
                ) : m.content}
              </div>
            </div>
          ))}
          {send.isPending && (
            <div className="flex justify-start">
              <div className="rounded-lg bg-muted px-3 py-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" /></div>
            </div>
          )}
        </CardContent>
        <div className="flex gap-2 border-t p-3">
          <Textarea
            rows={2} value={input} onChange={(e) => setInput(e.target.value)}
            placeholder="اكتب سؤالك الزراعي..."
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
          />
          <Button onClick={submit} disabled={!input.trim() || send.isPending}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}

const QUICK_PROMPTS = [
  "متى موسم زراعة الطماطم؟",
  "ما هي أفضل مبيدات المن على القمح؟",
  "جرعة سماد NPK للزيتون",
  "كيف أكافح الذبابة البيضاء عضوياً؟",
];

function esc(s: string) {
  return String(s ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] as string));
}

function printDiagnosis(r: DiagnosisResult, ctx: { plant: string; description: string }) {
  const list = (arr: string[]) => arr?.length ? `<ul>${arr.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : "<p><em>—</em></p>";
  const confLabel = r.confidence === "high" ? "عالية" : r.confidence === "medium" ? "متوسطة" : "منخفضة";
  const html = `<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>تقرير التشخيص - Haytam AGRI</title>
<style>
body{font-family:system-ui,'Segoe UI',Tahoma,Arial;padding:24px;color:#111;line-height:1.6}
h1{color:#166534;margin:0 0 4px}h2{color:#166534;margin-top:20px;border-bottom:1px solid #ddd;padding-bottom:4px}
.meta{color:#555;font-size:13px;margin-bottom:16px}.box{border:1px solid #ddd;border-radius:6px;padding:10px;margin:10px 0}
table{width:100%;border-collapse:collapse;margin-top:8px}th,td{border:1px solid #ddd;padding:6px;text-align:start;font-size:13px}
th{background:#f3f4f6}.badge{display:inline-block;padding:2px 8px;border-radius:10px;background:#dcfce7;color:#166534;font-size:12px}
@media print{button{display:none}}
</style></head><body>
<h1>🌱 تقرير التشخيص الزراعي</h1>
<div class="meta">Haytam AGRI &middot; ${new Date().toLocaleString("ar")} &middot; <span class="badge">ثقة: ${confLabel}</span></div>
<div class="box"><strong>النبات:</strong> ${esc(ctx.plant || "غير محدد")}<br><strong>الوصف:</strong> ${esc(ctx.description)}</div>
<h2>التشخيص</h2><div>${esc(r.diagnosis).replace(/\n/g, "<br>")}</div>
<h2>الأعراض</h2>${list(r.symptoms)}
<h2>الأسباب</h2>${list(r.causes)}
<h2>العلاج الكيميائي</h2>${list(r.treatments_chemical)}
<h2>العلاج العضوي</h2>${list(r.treatments_organic)}
<h2>الممارسات الزراعية</h2>${list(r.treatments_cultural)}
<h2>الوقاية</h2>${list(r.prevention)}
<h2>البدائل</h2>${list(r.alternatives)}
${r.suggested_products?.length ? `<h2>منتجات متوفرة</h2><table><tr><th>المنتج</th><th>SKU</th><th>المخزون</th><th>السعر</th></tr>${r.suggested_products.map((p: any) => `<tr><td>${esc(p.name_ar)}</td><td>${esc(p.sku ?? "-")}</td><td>${p.stock_quantity ?? 0}</td><td>${p.sale_price ?? "-"}</td></tr>`).join("")}</table>` : ""}
<script>window.onload=()=>{window.print()}</script>
</body></html>`;
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(html);
  w.document.close();
}

