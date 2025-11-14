#!/usr/bin/env node

/**
 * OG Image 验证脚本
 * 使用方法: node verify-og.js [url]
 * 默认 URL: http://localhost:4321
 */

const url = process.argv[2] || 'http://localhost:4321';

async function verifyOGImage() {
  try {
    console.log(`\n🔍 正在验证 OG Image 设置...\n`);
    console.log(`📍 URL: ${url}\n`);

    // 1. 获取 HTML
    const response = await fetch(url);
    const html = await response.text();

    // 2. 提取 meta 标签
    const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
    const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
    const ogDescMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i);
    const ogWidthMatch = html.match(/<meta\s+property=["']og:image:width["']\s+content=["']([^"']+)["']/i);
    const ogHeightMatch = html.match(/<meta\s+property=["']og:image:height["']\s+content=["']([^"']+)["']/i);
    const twitterImageMatch = html.match(/<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i);
    const twitterCardMatch = html.match(/<meta\s+name=["']twitter:card["']\s+content=["']([^"']+)["']/i);

    // 3. 验证结果
    console.log('📋 Meta 标签检查:');
    console.log('─'.repeat(50));
    
    if (ogImageMatch) {
      const imageUrl = ogImageMatch[1];
      console.log(`✅ og:image: ${imageUrl}`);
      
      // 构建完整的图片 URL
      const baseUrl = new URL(url).origin;
      const fullImageUrl = imageUrl.startsWith('http') 
        ? imageUrl 
        : `${baseUrl}${imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`}`;
      
      // 检查图片是否可访问
      try {
        const imgResponse = await fetch(fullImageUrl);
        if (imgResponse.ok) {
          const contentType = imgResponse.headers.get('content-type');
          const contentLength = imgResponse.headers.get('content-length');
          console.log(`   ✅ 图片可访问: ${fullImageUrl}`);
          console.log(`   📦 Content-Type: ${contentType}`);
          if (contentLength) {
            const sizeKB = (parseInt(contentLength) / 1024).toFixed(2);
            console.log(`   📏 文件大小: ${sizeKB} KB`);
          }
        } else {
          console.log(`   ❌ 图片无法访问 (HTTP ${imgResponse.status})`);
        }
      } catch (error) {
        console.log(`   ⚠️  无法验证图片访问: ${error.message}`);
      }
    } else {
      console.log('❌ og:image: 未找到');
    }

    if (ogTitleMatch) {
      console.log(`✅ og:title: ${ogTitleMatch[1]}`);
    } else {
      console.log('❌ og:title: 未找到');
    }

    if (ogDescMatch) {
      console.log(`✅ og:description: ${ogDescMatch[1]}`);
    } else {
      console.log('❌ og:description: 未找到');
    }

    if (ogWidthMatch && ogHeightMatch) {
      console.log(`✅ og:image:width: ${ogWidthMatch[1]}`);
      console.log(`✅ og:image:height: ${ogHeightMatch[1]}`);
      
      // 验证推荐尺寸
      const width = parseInt(ogWidthMatch[1]);
      const height = parseInt(ogHeightMatch[1]);
      if (width === 1200 && height === 630) {
        console.log('   ✅ 尺寸符合推荐标准 (1200x630)');
      } else {
        console.log(`   ⚠️  推荐尺寸: 1200x630，当前: ${width}x${height}`);
      }
    } else {
      console.log('⚠️  og:image:width/height: 未找到');
    }

    if (twitterCardMatch) {
      console.log(`✅ twitter:card: ${twitterCardMatch[1]}`);
    } else {
      console.log('⚠️  twitter:card: 未找到');
    }

    if (twitterImageMatch) {
      console.log(`✅ twitter:image: ${twitterImageMatch[1]}`);
    } else {
      console.log('⚠️  twitter:image: 未找到');
    }

    console.log('\n' + '─'.repeat(50));
    console.log('\n💡 提示:');
    console.log('   • 在浏览器中打开页面，右键查看源代码');
    console.log('   • 使用浏览器开发者工具检查 <head> 中的 meta 标签');
    console.log('   • 部署后可使用以下工具验证:');
    console.log('     - Facebook: https://developers.facebook.com/tools/debug/');
    console.log('     - Twitter: https://cards-dev.twitter.com/validator');
    console.log('     - LinkedIn: https://www.linkedin.com/post-inspector/');
    console.log('');

  } catch (error) {
    console.error('❌ 验证失败:', error.message);
    console.error('\n请确保开发服务器正在运行: yarn dev');
    process.exit(1);
  }
}

verifyOGImage();

