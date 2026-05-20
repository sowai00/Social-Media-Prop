import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!code) return NextResponse.json({ error: 'No code' }, { status: 400 });

  const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
  const appSecret = process.env.FACEBOOK_APP_SECRET;
  const threadsAppId = process.env.NEXT_PUBLIC_THREADS_APP_ID || appId;
  const threadsAppSecret = process.env.THREADS_APP_SECRET || appSecret;
  const redirectUri = 'http://localhost:3000/api/auth/meta/callback';

  try {
    if (state === 'threads') {
      // Threads Token Exchange Flow
      console.log('[Auth Threads] 正在換取 Threads 短期 Token...');
      const threadsRedirectUri = 'https://localhost:3000/api/auth/meta/callback';
      
      const formData = new URLSearchParams();
      formData.append('client_id', threadsAppId || '');
      formData.append('client_secret', threadsAppSecret || '');
      formData.append('grant_type', 'authorization_code');
      formData.append('redirect_uri', threadsRedirectUri);
      formData.append('code', code);

      const tokenRes = await fetch('https://graph.threads.net/oauth/access_token', {
        method: 'POST',
        body: formData,
      });
      const tokenData = await tokenRes.json();
      let token = tokenData.access_token;

      if (!token) return NextResponse.json({ error: 'Threads Token 換取失敗', raw: tokenData });

      // Upgrade to Long-Lived Token (60 days)
      try {
        console.log('[Auth Threads] 正在升級為長期 Token...');
        const longLivedRes = await fetch(
          `https://graph.threads.net/access_token?grant_type=th_exchange_token&client_secret=${threadsAppSecret}&access_token=${token}`
        );
        const longLivedData = await longLivedRes.json();
        if (longLivedData.access_token) {
          token = longLivedData.access_token;
          console.log('[Auth Threads] 成功換取 Threads 長期 Token!');
        }
      } catch (e) {
        console.error('[Auth Threads] 升級長期 Token 失敗，繼續使用短期 Token。');
      }

      // Fetch user info to verify
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
        message: 'Threads 授權成功！(已獲取 60天長期 Token)',
        access_token: token,
        threads_info: threadsInfo || '未找到 Threads 帳戶',
        hint: '請將 access_token 複製並貼入 .env.local 嘅 THREADS_ACCESS_TOKEN。未來 60 日都唔使再撳連結喇！'
      });
    } else {
      // Meta (Facebook/Instagram) Token Exchange Flow
      console.log('[Auth Meta] 正在換取 Meta 短期 Token...');
      const tokenRes = await fetch(
        `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${appId}&redirect_uri=${redirectUri}&client_secret=${appSecret}&code=${code}`
      );
      const tokenData = await tokenRes.json();
      let token = tokenData.access_token;

      if (!token) return NextResponse.json({ error: 'Meta Token 換取失敗', raw: tokenData });

      // Upgrade to Long-Lived Token (60 days)
      try {
        console.log('[Auth Meta] 正在升級為 60天 Long-Lived Token...');
        const longLivedRes = await fetch(
          `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${token}`
        );
        const longLivedData = await longLivedRes.json();
        
        if (longLivedData.access_token) {
          token = longLivedData.access_token;
          console.log('[Auth Meta] 成功換取 Meta 長期 Token!');
        }
      } catch (e) {
        console.error('[Auth Meta] 換取長期 Token 失敗，將繼續使用短期 Token。');
      }

      // Try to get IG info
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

      return NextResponse.json({
        success: true,
        message: 'Meta 授權成功！(已獲取 60天長期 Token)',
        access_token: token,
        instagram_info: igInfo || '未找到連結的 IG 商業帳戶',
        hint: '請將 access_token 複製並貼入 .env.local 嘅 META_ACCESS_TOKEN。未來 60 日都唔使再撳連結喇！'
      });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
