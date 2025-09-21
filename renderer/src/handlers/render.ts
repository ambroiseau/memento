import { createClient } from '@supabase/supabase-js';
import { FastifyReply, FastifyRequest } from 'fastify';
import { PDFDocument, rgb, StandardFonts, pushGraphicsState, popGraphicsState, moveTo, lineTo, closePath, clip, endPath } from 'pdf-lib';
import { readFile } from 'fs/promises';
import { config } from '../config.js';
import { RenderRequest, RenderResponse } from '../types.js';

const supabase = createClient(config.supabase.url, config.supabase.serviceKey);

export async function renderHandler(
  request: FastifyRequest<{ Body: RenderRequest }>,
  reply: FastifyReply
): Promise<RenderResponse> {
  const { family_id, start, end, requested_by } = request.body;
  let job: any = null; // Declare job variable at function scope

  try {
    // 1. Insert render job with status 'running'
    const { data: jobData, error: jobError } = await supabase
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

    job = jobData; // Assign to the function-scoped variable

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
    // Extract date part from timestamps for the RPC function
    const startDate = new Date(start).toISOString().split('T')[0];
    const endDate = new Date(end).toISOString().split('T')[0];

    const { data: posts, error: postsError } = await supabase.rpc(
      'get_family_posts_with_images',
      {
        p_family_id: family_id,
        p_start_date: startDate,
        p_end_date: endDate,
      }
    );

    if (postsError) {
      console.error('Error fetching posts:', postsError);
      await updateJobStatus(job.id, 'failed', 'Failed to fetch posts');
      return reply.status(500).send({
        ok: false,
        error: 'Failed to fetch posts',
      });
    }

    if (!posts || posts.length === 0) {
      await updateJobStatus(
        job.id,
        'failed',
        'No posts found for the specified period'
      );
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
              console.log('Processing image:', image.storage_path);

              // Check if image is base64
              if (
                image.storage_path &&
                image.storage_path.startsWith('data:image')
              ) {
                console.log('Found base64 image, using directly');
                return {
                  id: image.id,
                  url: image.storage_path, // Use base64 data directly
                  alt_text: image.alt_text || '',
                };
              }

              // Try to generate signed URL for storage path
              // ✅ PDF : Utilise les images ORIGINALES (haute qualité)
              let { data: signedUrl, error: urlError } = await supabase.storage
                .from('post-images-original')
                .createSignedUrl(image.storage_path, 3600); // 1 hour expiry

              // Fallback vers display si original non disponible
              if (urlError) {
                console.log(
                  'Image not found in post-images-original, trying post-images-display...'
                );
                const fallbackResult = await supabase.storage
                  .from('post-images-display')
                  .createSignedUrl(image.storage_path, 3600);

                if (fallbackResult.error) {
                  console.error(
                    'Error creating signed URL from both buckets:',
                    urlError
                  );
                  return {
                    id: image.id,
                    url: null, // Will be handled in generatePDF
                    alt_text: image.alt_text || '',
                  };
                }

                signedUrl = fallbackResult.data;
                urlError = null;
              }

              if (urlError) {
                console.error('Error creating signed URL:', urlError);
                return {
                  id: image.id,
                  url: null, // Will be handled in generatePDF
                  alt_text: image.alt_text || '',
                };
              }

              const finalUrl = signedUrl?.signedUrl;
              console.log('Generated signed URL:', finalUrl);

              return {
                id: image.id,
                url: finalUrl,
                alt_text: image.alt_text || '',
              };
            })
          );
          return { ...post, images: imagesWithUrls };
        }
        return { ...post, images: [] };
      })
    );

    // 5. Generate PDF using pdf-lib
    console.log('Generating PDF with pdf-lib...');
    const { buffer: pdfBuffer, pageCount } = await generatePDF(
      postsWithSignedUrls,
      family,
      start,
      end
    );
    console.log('PDF generated successfully, size:', pdfBuffer.length, 'bytes');

    // 7. Upload PDF to Supabase Storage
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${family_id}/${start}_${end}_${timestamp}.pdf`;
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

    // 9. Update job status to succeeded
    await updateJobStatus(job.id, 'succeeded', undefined, pdfUrl, pageCount);

    return reply.send({
      ok: true,
      pdf_url: pdfUrl,
      page_count: pageCount,
    });
  } catch (error) {
    console.error('Error in render handler:', error);

    // Update job status to failed if we have a job ID
    if (job?.id) {
      try {
        await updateJobStatus(
          job.id,
          'failed',
          error instanceof Error ? error.message : 'Unknown error'
        );
      } catch (updateError) {
        console.error('Failed to update job status:', updateError);
      }
    }

    return reply.status(500).send({
      ok: false,
      error: 'Internal server error',
    });
  }
}

async function generatePDF(
  posts: any[],
  family: any,
  start: string,
  end: string
): Promise<{ buffer: Buffer; pageCount: number }> {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();

  // Embed fonts (try custom logo font for cover title if provided)
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  let logoFont = boldFont;
  let captionFont = font;
  const candidates: string[] = [];
  if (process.env.MEMENTO_LOGO_FONT_PATH) candidates.push(process.env.MEMENTO_LOGO_FONT_PATH);
  if (process.env.LOGO_FONT_PATH) candidates.push(process.env.LOGO_FONT_PATH!);
  // Fallback to repo font path when running from renderer/
  candidates.push('../assets/fonts/Caprasimo-Regular.ttf');
  // Try to register fontkit if available for custom TTF/OTF embedding
  try {
    // @ts-ignore - dynamic import
    const fk = await import('@pdf-lib/fontkit');
    // @ts-ignore
    pdfDoc.registerFontkit(fk.default || fk);
  } catch (e) {
    console.warn('Optional @pdf-lib/fontkit not found; custom font embedding may fail.');
  }
  for (const p of candidates) {
    try {
      const bytes = await readFile(p);
      logoFont = await pdfDoc.embedFont(bytes);
      console.log(`✅ Loaded custom logo font from: ${p}`);
      break;
    } catch (e) {
      console.warn(`⚠️ Could not load logo font from ${p}`, e);
    }
  }

  // Try load caption font (Playwrite) if present
  const captionCandidates: string[] = [];
  if (process.env.MEMENTO_CAPTION_FONT_PATH) captionCandidates.push(process.env.MEMENTO_CAPTION_FONT_PATH);
  // repo default path
  captionCandidates.push('../assets/fonts/PlaywriteITTrad-VariableFont_wght.ttf');
  for (const p of captionCandidates) {
    try {
      const bytes = await readFile(p);
      captionFont = await pdfDoc.embedFont(bytes);
      console.log(`✅ Loaded caption font from: ${p}`);
      break;
    } catch (e) {
      console.warn(`⚠️ Could not load caption font from ${p}`, e);
    }
  }

  // A5 page size (420 x 595 points)
  const pageWidth = 420;
  const pageHeight = 595;
  const margin = 50;
  const contentWidth = pageWidth - margin * 2;
  const contentHeight = pageHeight - margin * 2;

  // Add cover page
  const coverPage = pdfDoc.addPage([pageWidth, pageHeight]);
  // Title: month + year (from start date), uppercase, logo typography if available
  const startDate = new Date(start);
  const monthYear = startDate
    .toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    .toUpperCase();
  const coverTitleSize = 30;
  const coverSubtitleSize = 18;
  const titleWidth = logoFont.widthOfTextAtSize(monthYear, coverTitleSize);
  const familyName = family.name || '';
  const subtitleWidth = font.widthOfTextAtSize(familyName, coverSubtitleSize);

  coverPage.drawText(monthYear, {
    x: (pageWidth - titleWidth) / 2,
    y: pageHeight - 220,
    size: coverTitleSize,
    font: logoFont,
    color: rgb(0, 0, 0),
  });

  coverPage.drawText(familyName, {
    x: (pageWidth - subtitleWidth) / 2,
    y: pageHeight - 260,
    size: coverSubtitleSize,
    font: font,
    color: rgb(0.4, 0.4, 0.4),
  });

  // Add pages for each post
  for (const post of posts) {
    /* Legacy mixed layout disabled in favor of rules-driven pages */
    if (false) {
    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    // Post date
    const postDate = new Date(post.created_at).toLocaleDateString('fr-FR');
    page.drawText(postDate, {
      x: margin,
      y: pageHeight - margin - 20,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    // Post content
    if (post.content_text) {
      const lines = wrapText(post.content_text, font, 12, contentWidth);
      let yOffset = pageHeight - margin - 50;

      for (const line of lines) {
        if (yOffset < margin + 100) break; // Leave space for images
        page.drawText(line, {
          x: margin,
          y: yOffset,
          size: 12,
          font: font,
          color: rgb(0, 0, 0),
        });
        yOffset -= 16;
      }
    }

    // Add images if any
    if (post.images && post.images.length > 0) {
      let currentPage = page;
      let imageY = pageHeight - margin - 150;
      let imageX = margin;
      let imagesPerPage = 0;
      const maxImagesPerPage = 4; // Increased from 2 to 4
      const isSingleImage = post.images.length === 1;

      for (const image of post.images) {
        // Create new page if we've reached the limit
        if (imagesPerPage >= maxImagesPerPage) {
          currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
          imageY = pageHeight - margin - 150;
          imageX = margin;
          imagesPerPage = 0;
        }
        try {
          // Check if we have a valid URL
          if (!image.url) {
            console.log('No URL for image, using placeholder');
            throw new Error('No image URL available');
          }

          console.log(
            'Processing image URL:',
            image.url.substring(0, 50) + '...'
          );

          let imageBuffer;

          // Handle base64 images
          if (image.url.startsWith('data:image')) {
            console.log('Processing base64 image');
            const base64Data = image.url.split(',')[1];
            imageBuffer = Buffer.from(base64Data, 'base64');
          } else {
            // Handle regular URLs
            console.log('Fetching image from URL');
            const imageResponse = await fetch(image.url);
            if (!imageResponse.ok) {
              throw new Error(
                `Failed to fetch image: ${imageResponse.statusText}`
              );
            }
            imageBuffer = await imageResponse.arrayBuffer();
          }
          let embeddedImage;

          // Try to embed as PNG first, then JPEG
          try {
            embeddedImage = await pdfDoc.embedPng(imageBuffer);
          } catch (pngError) {
            try {
              embeddedImage = await pdfDoc.embedJpg(imageBuffer);
            } catch (jpgError) {
              console.error(
                'Failed to embed image as PNG or JPEG:',
                pngError,
                jpgError
              );
              // Fallback to placeholder
              throw new Error('Unsupported image format');
            }
          }

          // Calculate image dimensions - if only one image, use full width
          const maxWidth = isSingleImage ? pageWidth - 2 * margin : 150;
          const maxHeight = isSingleImage ? pageHeight - 2 * margin - 200 : 100; // Leave space for text
          const imgWidth = embeddedImage.width;
          const imgHeight = embeddedImage.height;

          // Calculate scaling to fit within bounds while maintaining aspect ratio
          const scaleX = maxWidth / imgWidth;
          const scaleY = maxHeight / imgHeight;
          const scale = Math.min(scaleX, scaleY);

          const scaledWidth = imgWidth * scale;
          const scaledHeight = imgHeight * scale;

          // Center the image in the allocated space
          const offsetX = isSingleImage
            ? (pageWidth - scaledWidth) / 2
            : imageX + (150 - scaledWidth) / 2;
          const offsetY = isSingleImage
            ? (pageHeight - scaledHeight) / 2
            : imageY - maxHeight + (maxHeight - scaledHeight) / 2;

          currentPage.drawImage(embeddedImage, {
            x: offsetX,
            y: offsetY,
            width: scaledWidth,
            height: scaledHeight,
          });

          // Add alt text below image
          if (image.alt_text) {
            const altTextX = isSingleImage
              ? (pageWidth - font.widthOfTextAtSize(image.alt_text, 8)) / 2
              : imageX;
            const altTextY = isSingleImage
              ? margin + 20
              : imageY - maxHeight - 15;
            currentPage.drawText(image.alt_text, {
              x: altTextX,
              y: altTextY,
              size: 8,
              font: font,
              color: rgb(0.5, 0.5, 0.5),
            });
          }

          imageX += 160;
          if (imageX > pageWidth - margin - 150) {
            imageX = margin;
            imageY -= 120;
          }
          imagesPerPage++;
        } catch (error) {
          console.error('Error adding image:', error);

          // Fallback to placeholder rectangle
          const fallbackWidth = isSingleImage ? pageWidth - 2 * margin : 150;
          const fallbackHeight = isSingleImage
            ? pageHeight - 2 * margin - 200
            : 100;
          const fallbackX = isSingleImage ? margin : imageX;
          const fallbackY = isSingleImage ? margin + 200 : imageY - 100;

          currentPage.drawRectangle({
            x: fallbackX,
            y: fallbackY,
            width: fallbackWidth,
            height: fallbackHeight,
            borderColor: rgb(0.8, 0.8, 0.8),
            borderWidth: 1,
            color: rgb(0.95, 0.95, 0.95),
          });

          const fallbackText = `[Image: ${image.alt_text || 'Photo'}]`;
          const fallbackTextX = isSingleImage
            ? (pageWidth - font.widthOfTextAtSize(fallbackText, 8)) / 2
            : fallbackX + 5;
          const fallbackTextY = isSingleImage ? margin + 20 : fallbackY + 5;

          currentPage.drawText(fallbackText, {
            x: fallbackTextX,
            y: fallbackTextY,
            size: 8,
            font: font,
            color: rgb(0.5, 0.5, 0.5),
          });

          imageX += 160;
          if (imageX > pageWidth - margin - 150) {
            imageX = margin;
            imageY -= 120;
          }
          imagesPerPage++;
        }
      }
    }
    }
  }

  /* New image-only pages per rules (1–4 photos per page) */
  for (const post of posts) {
    if (!post.images || post.images.length === 0) continue;

    // Embed images first
    const embedded: Array<{ img: any | null; width: number; height: number; alt?: string }> = [];
    for (const image of post.images) {
      try {
        if (!image.url) throw new Error('No image URL available');
        let buf: ArrayBuffer | Buffer;
        if (typeof image.url === 'string' && image.url.startsWith('data:image')) {
          const base64Data = image.url.split(',')[1];
          buf = Buffer.from(base64Data, 'base64');
        } else {
          const res = await fetch(image.url);
          if (!res.ok) throw new Error(`Failed to fetch image: ${res.statusText}`);
          buf = await res.arrayBuffer();
        }
        let img: any;
        try { img = await pdfDoc.embedPng(buf); } catch { img = await pdfDoc.embedJpg(buf); }
        embedded.push({ img, width: img.width, height: img.height, alt: image.alt_text });
      } catch (e) {
        console.error('Failed to embed image, adding placeholder slot:', e);
        embedded.push({ img: null, width: 1000, height: 1000, alt: image.alt_text });
      }
    }

    for (let i = 0; i < embedded.length; i += 4) {
      const group = embedded.slice(i, i + 4);
      const page = pdfDoc.addPage([pageWidth, pageHeight]);
      const author = getAuthorName(post);
      const dateText = new Date(post.created_at).toLocaleDateString('fr-FR', {
        day: '2-digit', month: 'long'
      });
      const rawCaption =
        typeof post.content_text === 'string' && post.content_text.trim().length > 0
          ? post.content_text.trim()
          : (typeof post.content === 'string' && post.content.trim().length > 0
              ? post.content.trim()
              : undefined);
      let captionMain: string | undefined = undefined;
      if (rawCaption) {
        captionMain = rawCaption;
      } else {
        // Fallback: try image alts; else no main line
        const alts = (post.images || [])
          .map((im: any) => (typeof im.alt_text === 'string' ? im.alt_text.trim() : ''))
          .filter((s: string) => s.length > 0);
        if (alts.length > 0) captionMain = alts.join(' • ');
      }
      const captionMeta = `${author} — ${dateText}`;
      drawImageGroupByRules(page, group, pageWidth, pageHeight, captionMain, font, captionMeta);
    }
  }

  // Add footer page
  const footerPage = pdfDoc.addPage([pageWidth, pageHeight]);
  const footerText = 'Généré par Memento';
  const footerWidth = font.widthOfTextAtSize(footerText, 12);

  footerPage.drawText(footerText, {
    x: (pageWidth - footerWidth) / 2,
    y: margin,
    size: 12,
    font: font,
    color: rgb(0.5, 0.5, 0.5),
  });

  // Serialize the PDF to bytes
  const pdfBytes = await pdfDoc.save();
  return { buffer: Buffer.from(pdfBytes), pageCount: pdfDoc.getPageCount() };
}

// Helper function to wrap text
function wrapText(
  text: string,
  font: any,
  fontSize: number,
  maxWidth: number
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = font.widthOfTextAtSize(testLine, fontSize);

    if (testWidth <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        lines.push(word);
      }
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

// -------- Image layout engine (1–4 per page) --------

// Global layout constants (points)
const PAGE_PADDING = 16; // outer margin around image content
const GUTTER = 8; // spacing between images
const CAPTION_SPACE = 64; // reserved space previously used; captions now overlay bottom margin without shifting images

function isPortrait(w: number, h: number) {
  return h > w;
}

function fitRect(
  imgW: number,
  imgH: number,
  frameX: number,
  frameY: number,
  frameW: number,
  frameH: number
) {
  const scale = Math.min(frameW / imgW, frameH / imgH);
  const drawW = imgW * scale;
  const drawH = imgH * scale;
  const x = frameX + (frameW - drawW) / 2;
  const y = frameY + (frameH - drawH) / 2;
  return { x, y, width: drawW, height: drawH };
}

// Like CSS object-fit: cover (center-crop)
function coverRect(
  imgW: number,
  imgH: number,
  frameX: number,
  frameY: number,
  frameW: number,
  frameH: number
) {
  const scale = Math.max(frameW / imgW, frameH / imgH);
  const drawW = imgW * scale;
  const drawH = imgH * scale;
  const x = frameX + (frameW - drawW) / 2;
  const y = frameY + (frameH - drawH) / 2;
  return { x, y, width: drawW, height: drawH };
}

function drawPlaceholder(
  page: any,
  x: number,
  y: number,
  w: number,
  h: number,
  _alt?: string
) {
  page.drawRectangle({ x, y, width: w, height: h, borderColor: rgb(0.85, 0.85, 0.85), borderWidth: 1, color: rgb(0.96, 0.96, 0.96) });
}

function drawImageCoverClipped(
  page: any,
  img: any,
  frameX: number,
  frameY: number,
  frameW: number,
  frameH: number,
  imgW: number,
  imgH: number
) {
  // Compute cover placement
  const box = coverRect(imgW, imgH, frameX, frameY, frameW, frameH);
  // Define clipping rect = frame
  page.pushOperators(
    pushGraphicsState(),
    moveTo(frameX, frameY),
    lineTo(frameX, frameY + frameH),
    lineTo(frameX + frameW, frameY + frameH),
    lineTo(frameX + frameW, frameY),
    closePath(),
    clip(),
    endPath()
  );
  page.drawImage(img, { x: box.x, y: box.y, width: box.width, height: box.height });
  page.pushOperators(popGraphicsState());
}

function drawImageGroupByRules(
  page: any,
  group: Array<{ img: any | null; width: number; height: number; alt?: string }>,
  pageW: number,
  pageH: number,
  caption?: string,
  fontRef?: any,
  captionMeta?: string
) {
  const n = group.length;
  if (n === 0) return;
  const hasCaption = !!(caption && caption.trim());
  const hasMeta = !!(captionMeta && captionMeta.trim());
  let minFrameY: number | null = null;
  let leftMostX: number | null = null;

  // 1 photo: apply orientation-based paddings and crop to fill
  if (n === 1) {
    const g = group[0];
    const portrait = isPortrait(g.width, g.height);
    // Paddings in points (corrected)
    // Landscape: 50 left/right, 172 top/bottom
    // Portrait: 64 left/right, 100 top/bottom
    const padX = portrait ? 64 : 50;
    const padY = portrait ? 100 : 172;
    const f = { x: padX, y: padY, w: pageW - 2 * padX, h: pageH - 2 * padY };
    if (g.img) {
      drawImageCoverClipped(page, g.img, f.x, f.y, f.w, f.h, g.width, g.height);
    } else {
      drawPlaceholder(page, f.x, f.y, f.w, f.h, g.alt);
    }
    minFrameY = f.y;
    leftMostX = f.x;
    if (fontRef && (hasCaption || hasMeta)) {
      let topY = Math.max(8, minFrameY - 10);
      if (hasCaption) topY = drawCaptionLeftAt(page, caption!.trim(), fontRef, pageW, leftMostX!, topY, rgb(0, 0, 0));
      if (hasMeta) drawCaptionLeftAt(page, captionMeta!.trim(), fontRef, pageW, leftMostX!, topY, rgb(0.6, 0.6, 0.6));
    }
    return;
  }

  // 2 photos
  if (n === 2) {
    const [a, b] = group;
    const aPortrait = isPortrait(a.width, a.height);
    const bPortrait = isPortrait(b.width, b.height);
    // Mixed or both landscape -> vertical stack; both portrait -> side-by-side
    const verticalStack = (aPortrait && !bPortrait) || (!aPortrait && bPortrait) || (!aPortrait && !bPortrait);
    // Use inner content area with padding and gutter
    // Compute paddings per case
    const bothLandscape = !aPortrait && !bPortrait;
    const bothPortrait = aPortrait && bPortrait;
    const padX = bothPortrait ? 40 : 64; // side-by-side (portrait) -> 40, stacked/mixed -> 64
    const padY = bothPortrait ? 172 : 100; // side-by-side (portrait) -> 172, stacked/mixed/landscape -> 100
    const innerX = padX;
    const innerY = padY;
    const innerW = pageW - 2 * padX;
    const innerH = pageH - 2 * padY;
    if (verticalStack) {
      const cellH = (innerH - GUTTER) / 2;
      const frames = [
        { x: innerX, y: innerY + cellH + GUTTER, w: innerW, h: cellH },
        { x: innerX, y: innerY, w: innerW, h: cellH },
      ];
      [a, b].forEach((g, i) => {
        const f = frames[i];
        if (g.img) {
          drawImageCoverClipped(page, g.img, f.x, f.y, f.w, f.h, g.width, g.height);
        } else {
          drawPlaceholder(page, f.x, f.y, f.w, f.h, g.alt);
        }
      });
      minFrameY = frames[1].y;
      leftMostX = frames[1].x;
    } else {
      const cellW = (innerW - GUTTER) / 2;
      const frames = [
        { x: innerX, y: innerY, w: cellW, h: innerH },
        { x: innerX + cellW + GUTTER, y: innerY, w: cellW, h: innerH },
      ];
      [a, b].forEach((g, i) => {
        const f = frames[i];
        if (g.img) {
          drawImageCoverClipped(page, g.img, f.x, f.y, f.w, f.h, g.width, g.height);
        } else {
          drawPlaceholder(page, f.x, f.y, f.w, f.h, g.alt);
        }
      });
      minFrameY = frames[0].y;
      leftMostX = frames[0].x;
    }
    if (fontRef && minFrameY !== null && leftMostX !== null && (hasCaption || hasMeta)) {
      let topY = Math.max(8, minFrameY - 10);
      if (hasCaption) topY = drawCaptionLeftAt(page, caption!.trim(), fontRef, pageW, leftMostX, topY, rgb(0, 0, 0));
      if (hasMeta) drawCaptionLeftAt(page, captionMeta!.trim(), fontRef, pageW, leftMostX, topY, rgb(0.6, 0.6, 0.6));
    }
    return;
  }

  // 3 photos: left tall image spanning full height, two stacked on right inside a centered square container
  if (n === 3) {
    // Choose a portrait as the tall one if available, else the first
    let leftIndex = group.findIndex((g) => isPortrait(g.width, g.height));
    if (leftIndex === -1) leftIndex = 0;
    const left = group[leftIndex];
    const others = group.filter((_, i) => i !== leftIndex);

    // Outer content area with side padding = 40px
    const padX = 40;
    const innerX = padX;
    const innerY = PAGE_PADDING;
    const innerW = pageW - 2 * padX;
    const innerH = pageH - 2 * PAGE_PADDING;

    // Square container centered within inner content
    const S = Math.min(innerW, innerH);
    const cx = innerX + (innerW - S) / 2;
    const cy = innerY + (innerH - S) / 2;

    // Internal layout within the square container with gutters
    const colW = (S - GUTTER) / 2; // right squares will be colW x colW
    const leftF = { x: cx, y: cy, w: colW, h: S };
    const rightX = cx + colW + GUTTER;
    const topF = { x: rightX, y: cy + colW + GUTTER, w: colW, h: colW };
    const botF = { x: rightX, y: cy, w: colW, h: colW };

    if (left.img) {
      drawImageCoverClipped(page, left.img, leftF.x, leftF.y, leftF.w, leftF.h, left.width, left.height);
    } else {
      drawPlaceholder(page, leftF.x, leftF.y, leftF.w, leftF.h, left.alt);
    }

    [others[0], others[1]].forEach((g, i) => {
      const f = i === 0 ? topF : botF;
      if (!g) return;
      if (g.img) {
        drawImageCoverClipped(page, g.img, f.x, f.y, f.w, f.h, g.width, g.height);
      } else {
        drawPlaceholder(page, f.x, f.y, f.w, f.h, g.alt);
      }
    });
    minFrameY = Math.min(leftF.y, botF.y);
    leftMostX = leftF.x;
    if (fontRef && minFrameY !== null && leftMostX !== null && (hasCaption || hasMeta)) {
      let topY = Math.max(8, minFrameY - 10);
      if (hasCaption) topY = drawCaptionLeftAt(page, caption!.trim(), fontRef, pageW, leftMostX, topY, rgb(0, 0, 0));
      if (hasMeta) drawCaptionLeftAt(page, captionMeta!.trim(), fontRef, pageW, leftMostX, topY, rgb(0.6, 0.6, 0.6));
    }
    return;
  }

  // 4 photos: 2x2 square grid, letterbox to preserve ratios
  if (n === 4) {
    // Work in inner content area with side padding = 40px and gutter
    const padX = 40;
    const innerX = padX;
    const innerY = PAGE_PADDING;
    const innerW = pageW - 2 * padX;
    const innerH = pageH - 2 * PAGE_PADDING;
    const s = Math.min((innerW - GUTTER) / 2, (innerH - GUTTER) / 2); // square size
    const gridW = 2 * s + GUTTER;
    const gridH = 2 * s + GUTTER;
    const ox = innerX + (innerW - gridW) / 2;
    const oy = innerY + (innerH - gridH) / 2;
    const frames = [
      { x: ox + 0 * (s + GUTTER), y: oy + 1 * (s + GUTTER), w: s, h: s },
      { x: ox + 1 * (s + GUTTER), y: oy + 1 * (s + GUTTER), w: s, h: s },
      { x: ox + 0 * (s + GUTTER), y: oy + 0 * (s + GUTTER), w: s, h: s },
      { x: ox + 1 * (s + GUTTER), y: oy + 0 * (s + GUTTER), w: s, h: s },
    ];
    group.forEach((g, i) => {
      const f = frames[i];
      if (g.img) {
        // Center-crop into squares using clipping
        drawImageCoverClipped(page, g.img, f.x, f.y, f.w, f.h, g.width, g.height);
      } else {
        drawPlaceholder(page, f.x, f.y, f.w, f.h, g.alt);
      }
    });
    const bottomRowY = Math.min(frames[2].y, frames[3].y);
    minFrameY = bottomRowY;
    leftMostX = frames[2].x;
    if (fontRef && minFrameY !== null && leftMostX !== null && (hasCaption || hasMeta)) {
      let topY = Math.max(8, minFrameY - 10);
      if (hasCaption) topY = drawCaptionLeftAt(page, caption!.trim(), fontRef, pageW, leftMostX, topY, rgb(0, 0, 0));
      if (hasMeta) drawCaptionLeftAt(page, captionMeta!.trim(), fontRef, pageW, leftMostX, topY, rgb(0.6, 0.6, 0.6));
    }
    return;
  }
}

function drawCaptionLeftAt(page: any, text: string, font: any, pageW: number, leftX: number, topY: number, color: any) {
  const fontSize = 9;
  const lineHeight = 12;
  const maxWidth = pageW - leftX - 40; // from left edge of leftmost photo to right margin
  const lines = wrapText(text, font, fontSize, maxWidth);
  let y = topY; // start near the image, then go downward (reading order)
  lines.forEach((line) => {
    page.drawText(line, { x: leftX, y, size: fontSize, font, color });
    y -= lineHeight;
  });
  return y;
}

function estimateCaptionHeight(text: string, font: any, pageW: number, leftX: number) {
  const fontSize = 9;
  const maxWidth = pageW - leftX - 40;
  const lines = wrapText(text, font, fontSize, maxWidth);
  const lineHeight = 12;
  return lines.length * lineHeight;
}

function getAuthorName(post: any): string {
  const candidates = [
    post?.author?.name,
    post?.profiles?.name,
    post?.profile?.name,
    post?.author_name,
    post?.user_name,
    post?.username,
    post?.created_by_name,
  ];
  for (const v of candidates) {
    if (typeof v === 'string' && v.trim().length > 0) return v.trim();
  }
  return 'Auteur inconnu';
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
  if (error) updateData.error_message = error;

  const { error: updateError } = await supabase
    .from('render_jobs')
    .update(updateData)
    .eq('id', jobId);

  if (updateError) {
    console.error('Failed to update job status:', updateError);
    throw updateError;
  }
}
