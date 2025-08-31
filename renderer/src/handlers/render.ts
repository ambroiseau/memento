import { createClient } from '@supabase/supabase-js';
import { FastifyReply, FastifyRequest } from 'fastify';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
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
              const { data: signedUrl, error: urlError } =
                await supabase.storage
                  .from('post-images')
                  .createSignedUrl(image.storage_path, 3600); // 1 hour expiry

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
    const pdfBuffer = await generatePDF(
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
): Promise<Buffer> {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();

  // Embed the standard font
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // A5 page size (420 x 595 points)
  const pageWidth = 420;
  const pageHeight = 595;
  const margin = 50;
  const contentWidth = pageWidth - margin * 2;
  const contentHeight = pageHeight - margin * 2;

  // Add cover page
  const coverPage = pdfDoc.addPage([pageWidth, pageHeight]);
  const coverText = `${family.name} - Album Photos`;

  // Format the date range nicely
  const startDate = new Date(start);
  const endDate = new Date(end);
  const startMonth = startDate.toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  });
  const endMonth = endDate.toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  });

  // If same month, show just one month
  const coverSubtext =
    startMonth === endMonth ? startMonth : `${startMonth} - ${endMonth}`;

  // Center the title
  const titleWidth = boldFont.widthOfTextAtSize(coverText, 24);
  const subtitleWidth = font.widthOfTextAtSize(coverSubtext, 16);

  coverPage.drawText(coverText, {
    x: (pageWidth - titleWidth) / 2,
    y: pageHeight - 200,
    size: 24,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  coverPage.drawText(coverSubtext, {
    x: (pageWidth - subtitleWidth) / 2,
    y: pageHeight - 240,
    size: 16,
    font: font,
    color: rgb(0.5, 0.5, 0.5),
  });

  // Add pages for each post
  for (const post of posts) {
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
  return Buffer.from(pdfBytes);
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
