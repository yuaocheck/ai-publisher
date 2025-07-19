// AI Publisher - Webhooks 处理器

export async function handleWebhooks(request, env, ctx) {
  const url = new URL(request.url);
  const { pathname } = url;

  // GitHub Webhooks
  if (pathname.startsWith('/webhooks/github')) {
    return handleGitHubWebhook(request, env);
  }

  // 社交平台 Webhooks
  if (pathname.startsWith('/webhooks/social/')) {
    const platform = pathname.split('/').pop();
    return handleSocialWebhook(request, env, platform);
  }

  return new Response('Webhook endpoint not found', { status: 404 });
}

// 处理 GitHub Webhook
async function handleGitHubWebhook(request, env) {
  try {
    const signature = request.headers.get('X-Hub-Signature-256');
    const event = request.headers.get('X-GitHub-Event');
    const body = await request.text();

    // 验证 webhook 签名
    if (!verifyGitHubSignature(body, signature, env.GITHUB_WEBHOOK_SECRET)) {
      return new Response('Invalid signature', { status: 401 });
    }

    const payload = JSON.parse(body);

    switch (event) {
      case 'push':
        return handleGitHubPush(payload, env);
      case 'pull_request':
        return handleGitHubPullRequest(payload, env);
      case 'release':
        return handleGitHubRelease(payload, env);
      default:
        console.log(`Unhandled GitHub event: ${event}`);
        return new Response('Event received', { status: 200 });
    }

  } catch (error) {
    console.error('GitHub webhook error:', error);
    return new Response('Webhook processing failed', { status: 500 });
  }
}

// 处理 GitHub Push 事件
async function handleGitHubPush(payload, env) {
  const { ref, commits, repository } = payload;
  
  // 只处理主分支的推送
  if (ref === 'refs/heads/main' || ref === 'refs/heads/master') {
    console.log(`New push to ${repository.name}:`, {
      commits: commits.length,
      lastCommit: commits[commits.length - 1]?.message
    });

    // 触发自动部署
    if (env.AUTO_DEPLOY === 'true') {
      await triggerDeployment(repository, env);
    }
  }

  return new Response('Push event processed', { status: 200 });
}

// 处理 GitHub Pull Request 事件
async function handleGitHubPullRequest(payload, env) {
  const { action, pull_request } = payload;
  
  console.log(`Pull request ${action}:`, {
    number: pull_request.number,
    title: pull_request.title,
    author: pull_request.user.login
  });

  return new Response('Pull request event processed', { status: 200 });
}

// 处理 GitHub Release 事件
async function handleGitHubRelease(payload, env) {
  const { action, release } = payload;
  
  if (action === 'published') {
    console.log(`New release published:`, {
      tag: release.tag_name,
      name: release.name,
      prerelease: release.prerelease
    });

    // 发送发布通知
    await sendReleaseNotification(release, env);
  }

  return new Response('Release event processed', { status: 200 });
}

// 处理社交平台 Webhook
async function handleSocialWebhook(request, env, platform) {
  try {
    const body = await request.text();
    const payload = JSON.parse(body);

    switch (platform) {
      case 'twitter':
        return handleTwitterWebhook(payload, env);
      case 'facebook':
        return handleFacebookWebhook(payload, env);
      case 'instagram':
        return handleInstagramWebhook(payload, env);
      default:
        console.log(`Unhandled social webhook: ${platform}`);
        return new Response('Webhook received', { status: 200 });
    }

  } catch (error) {
    console.error(`${platform} webhook error:`, error);
    return new Response('Webhook processing failed', { status: 500 });
  }
}

// 处理 Twitter Webhook
async function handleTwitterWebhook(payload, env) {
  // 处理 Twitter 事件（如提及、回复等）
  console.log('Twitter webhook received:', payload);
  return new Response('Twitter webhook processed', { status: 200 });
}

// 处理 Facebook Webhook
async function handleFacebookWebhook(payload, env) {
  // 处理 Facebook 事件
  console.log('Facebook webhook received:', payload);
  return new Response('Facebook webhook processed', { status: 200 });
}

// 处理 Instagram Webhook
async function handleInstagramWebhook(payload, env) {
  // 处理 Instagram 事件
  console.log('Instagram webhook received:', payload);
  return new Response('Instagram webhook processed', { status: 200 });
}

// 辅助函数
function verifyGitHubSignature(body, signature, secret) {
  if (!signature || !secret) {
    return false;
  }

  const expectedSignature = 'sha256=' + 
    Array.from(new Uint8Array(
      crypto.subtle.digest('SHA-256', 
        new TextEncoder().encode(secret + body)
      )
    ))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return signature === expectedSignature;
}

async function triggerDeployment(repository, env) {
  console.log(`Triggering deployment for ${repository.name}...`);
  
  // 这里可以触发 Cloudflare Workers 的重新部署
  // 或者调用其他 CI/CD 服务
  
  try {
    // 示例：调用 Cloudflare API 触发部署
    if (env.CLOUDFLARE_API_TOKEN && env.CLOUDFLARE_ACCOUNT_ID) {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/workers/scripts/${env.WORKER_NAME}/deployments`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: `Auto-deploy from ${repository.name}`
          })
        }
      );

      if (response.ok) {
        console.log('Deployment triggered successfully');
      } else {
        console.error('Failed to trigger deployment:', await response.text());
      }
    }
  } catch (error) {
    console.error('Deployment trigger error:', error);
  }
}

async function sendReleaseNotification(release, env) {
  console.log(`Sending release notification for ${release.tag_name}...`);
  
  // 这里可以发送通知到各种渠道
  // 例如：Slack、Discord、邮件等
  
  const notification = {
    title: `🚀 New Release: ${release.name}`,
    message: `Version ${release.tag_name} has been released!`,
    url: release.html_url,
    timestamp: new Date().toISOString()
  };

  // 示例：发送到 Slack
  if (env.SLACK_WEBHOOK_URL) {
    try {
      await fetch(env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: notification.title,
          attachments: [{
            color: 'good',
            fields: [{
              title: 'Release Notes',
              value: release.body || 'No release notes provided',
              short: false
            }],
            actions: [{
              type: 'button',
              text: 'View Release',
              url: notification.url
            }]
          }]
        })
      });
    } catch (error) {
      console.error('Failed to send Slack notification:', error);
    }
  }
}
