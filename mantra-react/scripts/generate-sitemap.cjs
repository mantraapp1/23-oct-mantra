const fs = require('fs');
const path = require('path');

// Load environment variables from .env if present (mostly for local development)
try {
  const envPath = path.resolve(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split(/\r?\n/).forEach(line => {
      // Skip comments and empty lines
      if (line.trim().startsWith('#') || !line.includes('=')) return;
      const parts = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (parts) {
        const key = parts[1];
        let val = parts[2] || '';
        // Remove quotes if present
        if (val.length > 0 && val.charAt(0) === '"' && val.charAt(val.length - 1) === '"') {
          val = val.substring(1, val.length - 1);
        }
        process.env[key] = val;
      }
    });
  }
} catch (err) {
  console.warn('Warning: Could not parse .env file:', err.message);
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://hiposzbsobvhkgylmeyy.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SITE_URL = process.env.VITE_SITE_URL || 'https://mantranovels.com';

const staticPages = [
  { path: '', changefreq: 'daily', priority: '1.0' },
  { path: '/ranking', changefreq: 'daily', priority: '0.8' },
  { path: '/search', changefreq: 'weekly', priority: '0.6' },
  { path: '/faq', changefreq: 'monthly', priority: '0.5' },
  { path: '/contact', changefreq: 'monthly', priority: '0.5' },
  { path: '/terms', changefreq: 'monthly', priority: '0.3' },
  { path: '/privacy', changefreq: 'monthly', priority: '0.3' },
  { path: '/cookies', changefreq: 'monthly', priority: '0.3' },
  { path: '/content-policy', changefreq: 'monthly', priority: '0.3' },
  { path: '/dmca', changefreq: 'monthly', priority: '0.3' },
  { path: '/creator-monetization', changefreq: 'monthly', priority: '0.4' },
  { path: '/refund-policy', changefreq: 'monthly', priority: '0.3' },
  { path: '/moderation-policy', changefreq: 'monthly', priority: '0.3' },
  { path: '/child-safety', changefreq: 'monthly', priority: '0.3' },
  { path: '/grievance-redressal', changefreq: 'monthly', priority: '0.3' },
  { path: '/acceptable-use', changefreq: 'monthly', priority: '0.3' },
];

async function generateSitemap() {
  console.log('Generating sitemap.xml...');
  console.log(`Site URL: ${SITE_URL}`);
  console.log(`Supabase URL: ${SUPABASE_URL}`);

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  // 1. Add static pages
  staticPages.forEach(page => {
    xml += '  <url>\n';
    xml += `    <loc>${SITE_URL}${page.path}</loc>\n`;
    xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
    xml += `    <priority>${page.priority}</priority>\n`;
    xml += '  </url>\n';
  });

  // 2. Add dynamic novels and chapters from Supabase (if keys are available)
  if (SUPABASE_ANON_KEY) {
    try {
      // Fetch Novels
      console.log('Fetching novels for sitemap...');
      const novelsResponse = await fetch(`${SUPABASE_URL}/rest/v1/novels?select=id,updated_at`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (!novelsResponse.ok) {
        throw new Error(`Failed to fetch novels: ${novelsResponse.statusText}`);
      }

      const novels = await novelsResponse.json();
      console.log(`Found ${novels.length} novels.`);

      novels.forEach(novel => {
        const lastMod = novel.updated_at ? new Date(novel.updated_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        xml += '  <url>\n';
        xml += `    <loc>${SITE_URL}/novel/${novel.id}</loc>\n`;
        xml += `    <lastmod>${lastMod}</lastmod>\n`;
        xml += '    <changefreq>daily</changefreq>\n';
        xml += '    <priority>0.8</priority>\n';
        xml += '  </url>\n';
      });

      // Fetch Chapters
      console.log('Fetching chapters for sitemap...');
      const chaptersResponse = await fetch(`${SUPABASE_URL}/rest/v1/chapters?select=id,novel_id,published_at`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (chaptersResponse.ok) {
        const chapters = await chaptersResponse.json();
        console.log(`Found ${chapters.length} chapters.`);

        chapters.forEach(chapter => {
          const lastMod = chapter.published_at ? new Date(chapter.published_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
          xml += '  <url>\n';
          xml += `    <loc>${SITE_URL}/novel/${chapter.novel_id}/chapter/${chapter.id}</loc>\n`;
          xml += `    <lastmod>${lastMod}</lastmod>\n`;
          xml += '    <changefreq>monthly</changefreq>\n';
          xml += '    <priority>0.5</priority>\n';
          xml += '  </url>\n';
        });
      } else {
        console.warn('Warning: Could not fetch chapters for sitemap, skipping.');
      }

    } catch (err) {
      console.error('Error fetching dynamic sitemap data from Supabase:', err.message);
      console.log('Proceeding with static sitemap elements only.');
    }
  } else {
    console.warn('VITE_SUPABASE_ANON_KEY is not defined in environment or .env. Generating static sitemap only.');
  }

  xml += '</urlset>\n';

  const outputPath = path.resolve(__dirname, '../public/sitemap.xml');
  fs.writeFileSync(outputPath, xml, 'utf8');
  console.log(`Successfully generated sitemap.xml at: ${outputPath}`);
}

generateSitemap().catch(err => {
  console.error('Error generating sitemap:', err);
  process.exit(1);
});
