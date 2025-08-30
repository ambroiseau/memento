import { Post, Family } from './types.js';

export function composeHTML(posts: Post[], family: Family, startDate: string, endDate: string): string {
  const coverPage = createCoverPage(family, startDate, endDate);
  const contentPages = posts.map(post => createPostPage(post)).join('');
  const footerPage = createFooterPage();
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${family.name} - Family Album</title>
    <style>
        @page {
            size: A5;
            margin: 0;
        }
        
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
        }
        
        .page {
            width: 148mm;
            height: 210mm;
            padding: 50mm;
            box-sizing: border-box;
            page-break-after: always;
            position: relative;
        }
        
        .cover {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
        }
        
        .cover h1 {
            font-size: 2.5em;
            margin: 0 0 0.5em 0;
            font-weight: 700;
        }
        
        .cover .subtitle {
            font-size: 1.2em;
            opacity: 0.9;
            margin-bottom: 2em;
        }
        
        .cover .period {
            font-size: 1em;
            opacity: 0.8;
        }
        
        .post-page {
            display: flex;
            flex-direction: column;
            gap: 1em;
        }
        
        .post-header {
            display: flex;
            align-items: center;
            gap: 1em;
            margin-bottom: 1em;
        }
        
        .author-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            object-fit: cover;
        }
        
        .author-info h3 {
            margin: 0;
            font-size: 1.1em;
            font-weight: 600;
        }
        
        .post-date {
            font-size: 0.9em;
            color: #666;
            margin: 0;
        }
        
        .post-content {
            font-size: 1em;
            line-height: 1.7;
            margin-bottom: 1em;
        }
        
        .post-images {
            display: grid;
            gap: 0.5em;
            margin-top: 1em;
        }
        
        .post-images.single {
            grid-template-columns: 1fr;
        }
        
        .post-images.multiple {
            grid-template-columns: 1fr 1fr;
        }
        
        .post-image {
            width: 100%;
            height: auto;
            border-radius: 8px;
            object-fit: cover;
        }
        
        .footer {
            text-align: center;
            color: #666;
            font-size: 0.9em;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            height: 100%;
        }
        
        .footer h2 {
            margin: 0 0 1em 0;
            font-size: 1.5em;
            color: #333;
        }
        
        .footer p {
            margin: 0.5em 0;
        }
        
        .memento-logo {
            font-size: 1.2em;
            font-weight: 700;
            color: #667eea;
            margin-top: 1em;
        }
    </style>
</head>
<body>
    ${coverPage}
    ${contentPages}
    ${footerPage}
</body>
</html>`;
}

function createCoverPage(family: Family, startDate: string, endDate: string): string {
  const start = new Date(startDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const end = new Date(endDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  
  return `
    <div class="page cover">
        <h1>${family.name}</h1>
        <div class="subtitle">Family Memories</div>
        <div class="period">${start} - ${end}</div>
    </div>
  `;
}

function createPostPage(post: Post): string {
  const date = new Date(post.created_at).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const imagesHTML = post.images.length > 0 
    ? createImagesHTML(post.images)
    : '';
  
  return `
    <div class="page post-page">
        <div class="post-header">
            <img src="${post.author.avatar || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNEN0Q5REIiLz4KPHN2ZyB4PSIxMCIgeT0iMTIiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDIwIDIwIiBmaWxsPSJub25lIj4KPHBhdGggZD0iTTEwIDEwQzEyLjc2MTQgMTAgMTUgMTIuMjM4NiAxNSAxNUg1QzUgMTIuMjM4NiA3LjIzODYgMTAgMTAgMTBaIiBmaWxsPSJ3aGl0ZSIvPgo8Y2lyY2xlIGN4PSIxMCIgY3k9IjYiIHI9IjMiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo8L3N2Zz4K'}" 
                 alt="${post.author.name}" 
                 class="author-avatar" />
            <div class="author-info">
                <h3>${post.author.name}</h3>
                <p class="post-date">${date}</p>
            </div>
        </div>
        <div class="post-content">${post.content}</div>
        ${imagesHTML}
    </div>
  `;
}

function createImagesHTML(images: Array<{ id: string; url: string; alt_text?: string }>): string {
  if (images.length === 0) return '';
  
  const gridClass = images.length === 1 ? 'single' : 'multiple';
  const imagesHTML = images.map(img => 
    `<img src="${img.url}" alt="${img.alt_text || 'Family photo'}" class="post-image" />`
  ).join('');
  
  return `<div class="post-images ${gridClass}">${imagesHTML}</div>`;
}

function createFooterPage(): string {
  return `
    <div class="page footer">
        <h2>Thank you for sharing</h2>
        <p>This album was generated with love</p>
        <p>to preserve your precious family memories</p>
        <div class="memento-logo">Memento</div>
    </div>
  `;
}
