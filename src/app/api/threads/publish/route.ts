import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export async function POST(req: NextRequest) {
  try {
    const { text, imageBase64 } = await req.json();
    const accessToken = process.env.THREADS_ACCESS_TOKEN;

    if (!accessToken) {
      return NextResponse.json({ error: '請先在 .env.local 設定 THREADS_ACCESS_TOKEN' }, { status: 400 });
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
       return NextResponse.json({ 
         success: true, 
         message: '已準備好 Threads 發佈代碼！請先到 Vercel 建立 Blob 並將 BLOB_READ_WRITE_TOKEN 加入 .env.local'
       });
    }

    console.log(`[Threads] 正在將圖片上傳至 Vercel Blob...`);
    const base64Data = imageBase64.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');
    
    // 1. 上傳至 Vercel Blob 獲取公開網址
    const blob = await put(`threads-post-${Date.now()}.jpg`, buffer, { 
      access: 'public',
      contentType: 'image/jpeg'
    });

    console.log(`[Threads] 圖片已上傳，公開網址: ${blob.url}`);

    // 2. 建立 Threads Media Container
    const containerRes = await fetch(`https://graph.threads.net/v1.0/me/threads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        media_type: 'IMAGE',
        image_url: blob.url,
        text: text,
        access_token: accessToken
      })
    });
    const containerData = await containerRes.json();

    if (containerData.error) throw new Error(`建立 Threads 貼文失敗: ${containerData.error.message}`);

    // 3. 發佈 Threads Container
    console.log(`[Threads] 正在正式發佈貼文 (${containerData.id})...`);
    const publishRes = await fetch(`https://graph.threads.net/v1.0/me/threads_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: containerData.id,
        access_token: accessToken
      })
    });
    const publishData = await publishRes.json();

    if (publishData.error) throw new Error(`發佈 Threads 貼文失敗: ${publishData.error.message}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Threads 貼文已成功發佈！🎉',
      post_id: publishData.id
    });

  } catch (error: any) {
    console.error('[Threads Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
