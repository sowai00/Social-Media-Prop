import { NextRequest, NextResponse } from 'next/server';

const apiKey = (process.env.GOOGLE_AI_STUDIO_API_KEY || '').trim();

export async function POST(req: NextRequest) {
  try {
    const { image, customPrompt, language, personaName } = await req.json();
    const imageData = image?.split(',')[1];
    const mimeType = image?.split(';')[0].split(':')[1] || 'image/jpeg';

    if (!apiKey) {
      return NextResponse.json({ content: `[離線模式] API Key 未設定。\n\n呢個係測試文案。如果想用 AI 生成，請喺 .env.local 填寫 GOOGLE_AI_STUDIO_API_KEY。 #SocialProp` });
    }

    const configs = [
      { version: 'v1beta', model: 'models/gemini-1.5-flash' },
      { version: 'v1', model: 'models/gemini-1.5-flash' }
    ];

    let lastError = '';

    for (const config of configs) {
      try {
        const url = `https://generativelanguage.googleapis.com/${config.version}/${config.model}:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: `${customPrompt}\n語言：${language || '廣東話'}` },
                { inline_data: { mime_type: mimeType, data: imageData } }
              ]
            }]
          }),
          signal: AbortSignal.timeout(15000)
        });

        const textResponse = await response.text();
        let data;
        try {
          data = JSON.parse(textResponse);
        } catch (e) {
          throw new Error(`Google 伺服器過載回傳 HTML`);
        }

        if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
          return NextResponse.json({ content: data.candidates[0].content.parts[0].text });
        }
        lastError = data.error?.message || '未知錯誤';
      } catch (e: any) {
        lastError = e.message;
      }
    }

    // 當 AI 徹底失敗時，提供一個高質素的本地後備文案，確保用戶可以繼續測試發佈流程
    const mockCaption = `呢張相真係好靚呀！✨\n\n(注意: 因為 Google AI 伺服器暫時過載，呢個係系統自動產生嘅後備文案。你可以直接用呢段字嚟測試 Threads 同 IG 嘅發佈功能！)\n\n#${personaName?.replace(/\s+/g, '') || 'SocialProp'} #測試發文`;
    
    return NextResponse.json({ content: mockCaption });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
