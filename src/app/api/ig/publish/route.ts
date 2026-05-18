import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export async function POST(req: NextRequest) {
  try {
    const { text, imageBase64 } = await req.json();
    const accessToken = process.env.META_ACCESS_TOKEN;
    const igId = process.env.INSTAGRAM_BUSINESS_ID;

    if (!accessToken || !igId) {
      return NextResponse.json({ error: '請先在 .env.local 設定 META_ACCESS_TOKEN 及 INSTAGRAM_BUSINESS_ID' }, { status: 400 });
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
       return NextResponse.json({ 
         success: true, 
         message: '已準備好 IG 發佈代碼！請先到 Vercel 建立 Blob 並將 BLOB_READ_WRITE_TOKEN 加入 .env.local'
       });
    }

    console.log(`[Instagram] 正在將圖片上傳至 Vercel Blob...`);
    const base64Data = imageBase64.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');
    
    // 1. 上傳至 Vercel Blob 獲取公開網址
    const blob = await put(`ig-post-${Date.now()}.jpg`, buffer, { 
      access: 'public',
      contentType: 'image/jpeg'
    });

    console.log(`[Instagram] 圖片已上傳，公開網址: ${blob.url}`);

    // 2. 建立 IG Media Container
    const containerRes = await fetch(`https://graph.facebook.com/v19.0/${igId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: blob.url,
        caption: text,
        access_token: accessToken
      })
    });
    const containerData = await containerRes.json();

    if (containerData.error) throw new Error(`建立 IG 貼文失敗: ${containerData.error.message}`);

    // 3. 發佈 IG Container
    console.log(`[Instagram] 正在正式發佈貼文 (${containerData.id})...`);
    const publishRes = await fetch(`https://graph.facebook.com/v19.0/${igId}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: containerData.id,
        access_token: accessToken
      })
    });
    const publishData = await publishRes.json();

    if (publishData.error) throw new Error(`發佈 IG 貼文失敗: ${publishData.error.message}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Instagram 貼文已成功發佈！🎉',
      post_id: publishData.id
    });

  } catch (error: any) {
    console.error('[IG Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
