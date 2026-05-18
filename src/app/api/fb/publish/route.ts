import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { text, imageBase64 } = await req.json();
    const accessToken = process.env.META_ACCESS_TOKEN;
    const pageId = process.env.FACEBOOK_PAGE_ID; // 需要在 .env.local 加入這個

    if (!accessToken || !pageId) {
      return NextResponse.json({ error: '請先在 .env.local 設定 META_ACCESS_TOKEN 及 FACEBOOK_PAGE_ID' }, { status: 400 });
    }

    console.log(`[Facebook] 正在準備發佈至專頁 (${pageId})...`);

    // 0. 獲取 Page Access Token
    // 為了以「專頁身份」發文，必須使用專頁專屬的 Token，而非 User Token
    const accountsRes = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${accessToken}`);
    const accountsData = await accountsRes.json();
    const page = accountsData.data?.find((p: any) => p.id === pageId);
    
    if (!page || !page.access_token) {
      return NextResponse.json({ error: '無法獲取 Page Access Token。請確保你有管理該專頁的權限。', details: accountsData }, { status: 403 });
    }
    
    const pageAccessToken = page.access_token;

    // 1. 將 base64 轉換為 Blob
    const base64Data = imageBase64.split(',')[1];
    const mimeType = imageBase64.split(';')[0].split(':')[1] || 'image/jpeg';
    const buffer = Buffer.from(base64Data, 'base64');
    const blob = new Blob([buffer], { type: mimeType });

    // 2. 準備 FormData
    const formData = new FormData();
    formData.append('message', text);
    formData.append('source', blob, 'post.jpg');
    formData.append('access_token', pageAccessToken); // 使用 Page Token！

    // 3. 呼叫 Facebook API 發佈
    const res = await fetch(`https://graph.facebook.com/v19.0/${pageId}/photos`, {
      method: 'POST',
      body: formData
    });

    const data = await res.json();

    if (data.id) {
      return NextResponse.json({ 
        success: true, 
        message: 'Facebook 專頁發佈成功！',
        post_id: data.post_id || data.id
      });
    } else {
      return NextResponse.json({ error: 'Facebook 發佈失敗', details: data.error }, { status: 400 });
    }

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
