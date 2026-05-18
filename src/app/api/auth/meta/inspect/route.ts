import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const token = process.env.META_ACCESS_TOKEN;
    if (!token) return NextResponse.json({ error: 'Token 未設定' }, { status: 400 });

    // 1. 檢查 Token 真正擁有的權限 (Permissions)
    const debugRes = await fetch(`https://graph.facebook.com/debug_token?input_token=${token}&access_token=${token}`);
    const debugData = await debugRes.json();
    
    // 2. 獲取 Page 列表
    const accountsRes = await fetch(`https://graph.facebook.com/v19.0/me/accounts?fields=name,instagram_business_account,tasks&access_token=${token}`);
    const accountsData = await accountsRes.json();

    // 3. 獲取 Threads 資訊
    let threadsData = null;
    try {
      const threadsRes = await fetch(`https://graph.threads.net/v1.0/me?fields=id,username&access_token=${token}`);
      threadsData = await threadsRes.json();
    } catch (e) {}

    return NextResponse.json({
      success: true,
      permissions: debugData.data?.scopes || [], // 睇吓有冇 instagram_basic
      pages_found: accountsData.data || [],
      fb_page_id: accountsData.data?.[0]?.id || '未找到',
      threads_id: threadsData?.id || '未找到',
      raw_debug: debugData.data
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
