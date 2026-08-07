import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  try {
    const payload = await req.json()
    const record = payload.record || payload

    if (!record?.content || record?.embedding) {
      return new Response(JSON.stringify({ message: "Skip: No content or already embedded" }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      })
    }

    const geminiApiKey = Deno.env.get("GEMINI_API_KEY")
    if (!geminiApiKey) {
      throw new Error("GEMINI_API_KEY가 설정되지 않았습니다.")
    }

    // 1. Google Gemini Embedding API 호출 (공식 모델명: gemini-embedding-2)
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: {
            parts: [{ text: record.content }]
          }
        }),
      }
    )

    const geminiData = await geminiResponse.json()

    if (!geminiResponse.ok) {
      throw new Error(`Gemini API Error: ${JSON.stringify(geminiData)}`)
    }

    // 임베딩 결과 추출
    const embedding = geminiData.embedding.values

    // 2. Supabase DB 업데이트
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    const { error: updateError } = await supabase
      .from("chunks")
      .update({ embedding })
      .eq("id", record.id)

    if (updateError) {
      throw new Error(`DB Update Error: ${updateError.message}`)
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })

  } catch (err: any) {
    console.error("❌ Error:", err.message)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})