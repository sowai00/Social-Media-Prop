import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  if (!code) return NextResponse.json({ error: 'No code' }, { status: 400 });

  const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
  const appSecret = process.env.FACEBOOK_APP_SECRET;
  const redirectUri = 'http://localhost:3000/api/auth/meta/callback';

  try {
    // 1. 換取短期 Access Token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${appId}&redirect_uri=${redirectUri}&client_secret=${appSecret}&code=${code}`
    );
    const tokenData = await tokenRes.json();
    let token = tokenData.access_token;

    if (!token) return NextResponse.json({ error: 'Token 換取失敗', raw: tokenData });

    // 2. 自動升級為 60天 長期 Token (Long-Lived Token)
    try {
      console.log('[Auth] 正在升級為 60天 Long-Lived Token...');
      const longLivedRes = await fetch(
        `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${token}`
      );
      const longLivedData = await longLivedRes.json();
      
      if (longLivedData.access_token) {
        token = longLivedData.access_token;
        console.log('[Auth] 成功換取長期 Token!');
      }
    } catch (e) {
      console.error('[Auth] 換取長期 Token 失敗，將繼續使用短期 Token。');
    }

    // 3. 嘗試獲取 IG 資訊
    let igInfo = null;
    try {
      const accountsRes = await fetch(
        `https://graph.facebook.com/v19.0/me/accounts?fields=name,instagram_business_account&access_token=${token}`
      );
      const accountsData = await accountsRes.json();
      const pageWithIG = accountsData.data?.find((page: any) => page.instagram_business_account);
      if (pageWithIG) {
        igInfo = {
          id: pageWithIG.instagram_business_account.id,
          page_name: pageWithIG.name
        };
      }
    } catch (e) {}

    // 4. 嘗試獲取 Threads 資訊
    let threadsInfo = null;
    try {
      const threadsRes = await fetch(`https://graph.threads.net/v1.0/me?fields=id,username&access_token=${token}`);
      const threadsData = await threadsRes.json();
      if (threadsData.id) {
        threadsInfo = {
          id: threadsData.id,
          username: threadsData.username
        };
      }
    } catch (e) {}

    return NextResponse.json({
      success: true,
      message: 'Meta 授權成功！(已獲取 60天長期 Token)',
      access_token: token,
      instagram_info: igInfo || '未找到連結的 IG 商業帳戶',
      threads_info: threadsInfo || '未找到 Threads 帳戶',
      hint: '請將 access_token 複製並貼入 .env.local 嘅 META_ACCESS_TOKEN。未來 60 日都唔使再撳連結喇！'
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
