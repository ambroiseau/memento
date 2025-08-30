import { FastifyRequest, FastifyReply } from 'fastify';
import { createClient } from '@supabase/supabase-js';
import puppeteer from 'puppeteer';
import { config } from '../config.js';
import { composeHTML } from '../compose.js';
import { RenderRequest, RenderResponse, RenderJob, Post, Family } from '../types.js';

const supabase = createClient(config.supabase.url, config.supabase.serviceKey);

export async function renderHandler(
  request: FastifyRequest<{ Body: RenderRequest }>,
  reply: FastifyReply
): Promise<RenderResponse> {
  const { family_id, start, end, requested_by } = request.body;

  try {
    // 1. Insert render job with status 'running'
    const { data: job, error: jobError } = await supabase
      .from('render_jobs')
      .insert({
        family_id,
        period_start: start,
        period_end: end,
        status: 'running',
        requested_by,
        requested_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (jobError) {
      console.error('Error creating render job:', jobError);
      return reply.status(500).send({
        ok: false,
        error: 'Failed to create render job',
      });
    }

    // 2. Fetch family data
    const { data: family, error: familyError } = await supabase
      .from('families')
      .select('id, name, avatar')
      .eq('id', family_id)
      .single();

    if (familyError || !family) {
      await updateJobStatus(job.id, 'failed', 'Family not found');
      return reply.status(404).send({
        ok: false,
        error: 'Family not found',
      });
    }

    // 3. Fetch posts and images for the period
    const { data: posts, error: postsError } = await supabase
      .rpc('get_family_posts_with_images', {
        p_family_id: family_id,
        p_start_date: start,
        p_end_date: end,
      });

    if (postsError) {
      console.error('Error fetching posts:', postsError);
      await updateJobStatus(job.id, 'failed', 'Failed to fetch posts');
      return reply.status(500).send({
        ok: false,
        error: 'Failed to fetch posts',
      });
    }

    if (!posts || posts.length === 0) {
      await updateJobStatus(job.id, 'failed', 'No posts found for the specified period');
      return reply.status(400).send({
        ok: false,
        error: 'No posts found for the specified period',
      });
    }

    // 4. Generate signed URLs for images
    const postsWithSignedUrls = await Promise.all(
      posts.map(async (post: any) => {
        if (post.images && post.images.length > 0) {
          const imagesWithUrls = await Promise.all(
            post.images.map(async (image: any) => {
              const { data: signedUrl } = await supabase.storage
                .from('post-images')
                .createSignedUrl(image.storage_path, 3600); // 1 hour expiry

              return {
                id: image.id,
                url: signedUrl?.signedUrl || image.storage_path,
                alt_text: image.alt_text || '', // Handle missing alt_text
              };
            })
          );
          return { ...post, images: imagesWithUrls };
        }
        return { ...post, images: [] };
      })
    );

    // 5. Compose HTML
    const html = composeHTML(postsWithSignedUrls, family, start, end);

    // 6. Generate PDF using Puppeteer
    const pdfBuffer = await generatePDF(html);

    // 7. Upload PDF to Supabase Storage
    const fileName = `${family_id}/${start}_${end}.pdf`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(config.storage.bucket)
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      console.error('Error uploading PDF:', uploadError);
      await updateJobStatus(job.id, 'failed', 'Failed to upload PDF');
      return reply.status(500).send({
        ok: false,
        error: 'Failed to upload PDF',
      });
    }

    // 8. Get public URL for the PDF
    const { data: urlData } = supabase.storage
      .from(config.storage.bucket)
      .getPublicUrl(fileName);

    const pdfUrl = urlData.publicUrl;
    const pageCount = postsWithSignedUrls.length + 2; // +2 for cover and footer

    // 9. Update job status to succeeded
    await updateJobStatus(job.id, 'succeeded', undefined, pdfUrl, pageCount);

    return reply.send({
      ok: true,
      pdf_url: pdfUrl,
      page_count: pageCount,
    });

  } catch (error) {
    console.error('Error in render handler:', error);
    return reply.status(500).send({
      ok: false,
      error: 'Internal server error',
    });
  }
}

async function generatePDF(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdf = await page.pdf({
      format: 'A5',
      printBackground: true,
      margin: {
        top: '0',
        right: '0',
        bottom: '0',
        left: '0',
      },
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

async function updateJobStatus(
  jobId: string,
  status: 'succeeded' | 'failed',
  error?: string,
  pdfUrl?: string,
  pageCount?: number
) {
  const updateData: any = {
    status,
    finished_at: new Date().toISOString(),
  };

  if (pdfUrl) updateData.pdf_url = pdfUrl;
  if (pageCount) updateData.page_count = pageCount;

  await supabase
    .from('render_jobs')
    .update(updateData)
    .eq('id', jobId);
}
