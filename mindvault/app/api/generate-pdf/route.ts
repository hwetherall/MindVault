import { NextResponse } from 'next/server';
import { marked } from 'marked';
import { formatNumbersInText } from '../../utils/textFormatting';
import fs from 'fs/promises';
import path from 'path';
import { generatePDF } from '../../lib/puppeteer';
import * as d3 from 'd3';
import { JSDOM } from 'jsdom';

interface Question {
  id: string;
  question: string;
  description?: string;
  category?: string;
}

interface Answer {
  summary: string;
  details: string;
  isEdited: boolean;
  chartData?: {
    type: 'line' | 'bar' | 'area';
    title: string;
    data: {
      labels: string[];
      datasets: Array<{
        label: string;
        data: number[];
        borderColor?: string;
        backgroundColor?: string;
        pointBackgroundColor?: string;
        pointRadius?: number;
        tension?: number;
      }>;
    };
  };
}

interface ExportOptions {
  includeTableOfContents: boolean;
  includeAppendices: boolean;
  language: 'en' | 'ja';
  isDetailedView?: boolean;
}

// Configure marked to use synchronous mode
marked.setOptions({ async: false });

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// Simple chart rendering function using SVG
function renderChartAsSVG(chartData: Answer['chartData']) {
  if (!chartData) return '';
  
  try {
    // Chart dimensions
    const width = 600;
    const height = 300;
    const margin = { top: 30, right: 30, bottom: 50, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create a virtual DOM for server-side rendering
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    const document = dom.window.document;
    const body = document.querySelector('body');

    // Create SVG element
    const svg = d3.select(body)
      .append('svg')
      .attr('xmlns', 'http://www.w3.org/2000/svg')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('width', width)
      .attr('height', height);

    // Add title with proper ARR capitalization
    const formattedTitle = chartData.title.replace(/\b(arr)\b/gi, 'ARR');
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .style('font-family', 'Arial, sans-serif')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .text(formattedTitle);

    // Extract data from the chart
    const labels = chartData.data.labels;
    const dataset = chartData.data.datasets[0];
    const data = dataset.data;
    
    // Define scales
    const xScale = d3.scaleBand()
      .domain(labels)
      .range([0, innerWidth])
      .padding(0.1);
    
    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data) * 1.1 || 0]) // Add 10% padding at the top
      .range([innerHeight, 0]);
    
    // Create a group for the main chart content
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);
    
    // Add X axis
    g.append('g')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end')
      .style('font-family', 'Arial, sans-serif')
      .style('font-size', '12px');
    
    // Add Y axis
    g.append('g')
      .call(d3.axisLeft(yScale))
      .style('font-family', 'Arial, sans-serif')
      .style('font-size', '12px');
    
    // Colors
    const colors = {
      bar: dataset.backgroundColor || '#4C9AFF',
      line: dataset.borderColor || '#4C9AFF',
      area: dataset.backgroundColor || 'rgba(76, 154, 255, 0.2)'
    };
    
    // Render different chart types
    if (chartData.type === 'bar') {
      // Draw bars
      g.selectAll('.bar')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', (_, i) => xScale(labels[i]) || 0)
        .attr('y', d => yScale(d))
        .attr('width', xScale.bandwidth())
        .attr('height', d => innerHeight - yScale(d))
        .attr('fill', colors.bar);
    } else if (chartData.type === 'line' || chartData.type === 'area') {
      // Generate line points
      const points = labels.map((label, i) => ({
        x: xScale(label) || 0,
        y: yScale(data[i]),
        value: data[i]
      }));
      
      // Create line generator
      const lineGenerator = d3.line<{x: number, y: number}>()
        .x(d => d.x + xScale.bandwidth() / 2)
        .y(d => d.y)
        .curve(d3.curveMonotoneX);
      
      // Draw area if it's an area chart
      if (chartData.type === 'area') {
        const areaGenerator = d3.area<{x: number, y: number, value: number}>()
          .x(d => d.x + xScale.bandwidth() / 2)
          .y0(innerHeight)
          .y1(d => d.y)
          .curve(d3.curveMonotoneX);
        
        g.append('path')
          .datum(points)
          .attr('fill', colors.area)
          .attr('d', areaGenerator);
      }
      
      // Draw line
      g.append('path')
        .datum(points)
        .attr('fill', 'none')
        .attr('stroke', colors.line)
        .attr('stroke-width', 2)
        .attr('d', lineGenerator);
      
      // Draw points
      g.selectAll('.point')
        .data(points)
        .enter()
        .append('circle')
        .attr('class', 'point')
        .attr('cx', d => d.x + xScale.bandwidth() / 2)
        .attr('cy', d => d.y)
        .attr('r', 4)
        .attr('fill', dataset.pointBackgroundColor || colors.line);
    }
    
    // Add Y-axis label only
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -40)
      .attr('text-anchor', 'middle')
      .style('font-family', 'Arial, sans-serif')
      .style('font-size', '12px')
      .text(dataset.label);
    
    // Get the SVG content
    const svgContent = body?.innerHTML || '';
    
    // Return the SVG as a data URL
    return `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`;
  } catch (error) {
    console.error('Error rendering chart as SVG:', error);
    return '';
  }
}

// Fallback chart rendering when SVG generation fails
function getChartFallback(chartData: Answer['chartData']) {
  if (!chartData) return '';
  
  const dataset = chartData.data.datasets[0];
  const data = dataset.data;
  const labels = chartData.data.labels;
  
  // Create a simple fallback with text representation
  return `
    <div style="width:100%; height:auto; margin:20px 0; padding:10px; border:1px solid #ddd; border-radius:8px; background-color:#f9f9f9; text-align:center;">
      <div style="padding:10px; font-weight:bold; font-size:14px; color:#333;">
        ${chartData.title || 'Financial Data Visualization'}
      </div>
      <div style="margin-top:10px; font-size:12px; text-align:left; padding:0 20px;">
        <strong>${dataset.label || 'Data'}</strong>
        <ul style="list-style-type:none; padding:0; display:flex; flex-wrap:wrap; justify-content:space-between;">
          ${labels.map((label, idx) => 
            `<li style="margin:5px 10px; padding:8px; background-color:#eee; border-radius:4px; width:calc(33% - 20px); box-sizing:border-box;">
              <span style="font-weight:bold;">${label}</span>: ${data[idx]}
            </li>`
          ).join('')}
        </ul>
      </div>
    </div>
  `;
}

export async function POST(request: Request) {
  try {
    const { 
      questions,
      answers,
      title,
      description,
      options,
      logo,
      template
    }: {
      questions: Question[];
      answers: Record<string, Answer>;
      title: string;
      description: string;
      options: ExportOptions;
      logo?: string;
      template: string;
    } = await request.json();

    // Read font files
    const fontFiles = {
      normal: await fs.readFile(path.join(process.cwd(), 'public', 'fonts', 'gotham', 'Gotham-Book.otf')),
      bold: await fs.readFile(path.join(process.cwd(), 'public', 'fonts', 'gotham', 'Gotham-Medium.otf'))
    };

    // Read default logo and validate base64
    const defaultLogoPath = path.join(process.cwd(), 'public', 'templates', 'unnamed.jpg');
    const defaultLogo = await fs.readFile(defaultLogoPath);
    const defaultLogoBase64 = `data:image/jpeg;base64,${defaultLogo.toString('base64')}`;

    // Validate custom logo if provided
    let validatedLogo = logo;
    if (logo) {
      // Check if it's a valid data URL with base64 encoding
      const isValidDataUrl = /^data:image\/(jpeg|jpg|png|gif|webp);base64,([A-Za-z0-9+/=]*)$/.test(logo);
      if (!isValidDataUrl) {
        console.warn('Custom logo is not a valid base64 data URL, falling back to default logo');
        validatedLogo = defaultLogoBase64;
      }
    } else {
      validatedLogo = defaultLogoBase64;
    }

    // Convert font files to base64
    const fontBase64 = {
      normal: fontFiles.normal.toString('base64'),
      bold: fontFiles.bold.toString('base64')
    };

    // Pre-process markdown content
    const processedAnswers = Object.fromEntries(
      await Promise.all(
        Object.entries(answers).map(async ([id, answer]) => [
          id,
          {
            ...answer,
            summaryHtml: await marked.parse(formatNumbersInText(answer.summary)),
            detailsHtml: await marked.parse(formatNumbersInText(answer.details)),
            chartSvg: answer.chartData ? renderChartAsSVG(answer.chartData) : ''
          }
        ])
      )
    );

    // Group questions by category for TOC
    const questionsByCategory: Record<string, Question[]> = {};
    questions.forEach(question => {
      const category = question.category || 'General';
      if (!questionsByCategory[category]) {
        questionsByCategory[category] = [];
      }
      questionsByCategory[category].push(question);
    });

    // Generate table of contents HTML
    let tableOfContentsHtml = '';
    if (options.includeTableOfContents) {
      tableOfContentsHtml = `
        <div id="tableOfContents" class="sectionBlock" style="display: block;">
          <h2>Table of Contents</h2>
          ${Object.entries(questionsByCategory).map(([category, categoryQuestions]) => `
            <div class="TableOfContents-category">
              <div class="category">${category}</div>
              <div class="category-questions">
                ${categoryQuestions.map(q => `<div class="question-item">${q.question}</div>`).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      `;
    } else {
      tableOfContentsHtml = '<div id="tableOfContents" class="sectionBlock" style="display: none;"></div>';
    }

    // Generate content HTML
    const contentHtml = `
      <div class="sectionBlock" id="content">
        <h2 id="key-questions">I. Key Questions</h2>
        ${questions.map(({ id, question, description }) => {
          const answer = processedAnswers[id];
          if (!answer?.summary) return '';
          
          return `
            <div class="question-section">
              <div class="question">${question}</div>
              ${description ? `<div class="description">${description}</div>` : ''}
              <h3>Summary</h3>
              <div class="answer">${answer.summaryHtml}</div>
              ${answer.details && options.isDetailedView ? `
                <h3>Details</h3>
                <div class="answer">${answer.detailsHtml}</div>
              ` : ''}
              ${answer.chartSvg ? `
                <div class="chart-container">
                  <img src="${answer.chartSvg}" alt="${answer.chartData?.title || 'Chart'}" style="width:100%; max-width:600px; height:auto;">
                </div>
              ` : answer.chartData ? getChartFallback(answer.chartData) : ''}
            </div>
          `;
        }).join('')}
      </div>
    `;

    // Generate appendices HTML
    let appendicesHtml = '';
    if (options.includeAppendices) {
      appendicesHtml = `
        <div class="sectionBlock" id="appendices" style="display: block;">
          <h2>Appendices</h2>
          <!-- Appendix content would go here -->
        </div>
      `;
    } else {
      appendicesHtml = '<div class="sectionBlock" id="appendices" style="display: none;"></div>';
    }

    // Current date for footer
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Simple CSS for embedded fonts
    const fontCss = `
      @font-face {
        font-family: 'Gotham';
        src: url('data:font/opentype;base64,${fontBase64.normal}') format('opentype');
        font-weight: normal;
        font-style: normal;
      }
      @font-face {
        font-family: 'Gotham';
        src: url('data:font/opentype;base64,${fontBase64.bold}') format('opentype');
        font-weight: bold;
        font-style: normal;
      }
    `;

    // Build the complete HTML document
    const completeHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          ${fontCss}
          
          body {
            font-family: 'Gotham', Arial, sans-serif;
            line-height: 1.4;
            color: #333;
            margin: 0;
            padding: 20px;
            font-size: 10pt;
          }

          .header {
            margin-bottom: 25px;
          }

          .logo-container {
            display: flex;
            justify-content: center;
            align-items: center;
            flex-direction: row;
            gap: 12px;
            background: linear-gradient(
              120deg,
              rgba(176, 224, 230, 0.3) 0%,
              rgb(234, 234, 234) 50%,
              rgba(255, 218, 224, 0.3) 100%
            );
            padding: 12px;
            margin: 0 0 28px 0;
            border-radius: 4px;
          }

          #logo {
            width: 60px;
            height: 60px;
            object-fit: contain;
          }

          .logo-container h1 {
            color: #1b2338;
            font-size: 22px;
            margin: 0;
            padding: 0;
          }

          .title-container {
            text-align: center;
            align-items: center;
            margin: 15px 0;
            padding-bottom: 12px;
            border-bottom: 1px solid #ddd;
          }

          #title {
            color: #1A1F2E;
            font-size: 22px;
            text-align: center;
            margin: 0;
          }

          #description {
            font-size: 12px;
            text-align: center;
            margin-top: 10px;
            margin-bottom: 0px;
          }

          h2 {
            font-size: 20px;
            font-weight: bold;
          }

          .sectionTitle {
            font-size: 16px;
            font-weight: bold;
            margin: 20px 0 12px 0;
          }

          .sectionBlock {
            margin: 20px 0;
            padding: 0 0 15px 0;
            border-bottom: 1px solid #ddd;
          }

          .category {
            font-size: 14px;
            font-weight: bold;
            margin: 12px 0 6px 0;
            color: #1A1F2E;
          }

          .category-questions {
            margin-left: 18px;
            margin-bottom: 8px;
          }

          .question-item {
            font-size: 12px;
            margin: 4px 0;
            color: #333;
          }

          .question-section {
            margin: 0 0 20px 0;
          }

          .question {
            color: #1A1F2E;
            font-weight: bold;
            font-size: 16px;
            margin: 0 0 6px 0;
          }

          .description {
            font-size: 12px;
            margin: 0 0 8px 30px;
            color: #6a6a6a;
            font-style: italic;
          }

          .answer {
            margin: 0 0 12px 12px;
            font-size: 12px;
            line-height: 1.5;
          }

          .answer p {
            margin: 0 0 8px 0;
          }

          .answer h1, .answer h2, .answer h3, .answer h4, .answer h5, .answer h6 {
            color: #1A1F2E;
            font-weight: bold;
            margin: 12px 0 6px 0;
            font-size: 14px;
          }

          .answer ul, .answer ol {
            margin: 6px 0;
            padding-left: 20px;
          }

          .answer li {
            margin-bottom: 3px;
          }

          .answer code {
            background-color: #f8f9fa;
            color: #333;
            padding: 2px 4px;
            border-radius: 3px;
            font-family: monospace;
            font-size: 11px;
          }

          .answer pre {
            background-color: #f8f9fa;
            color: #333;
            padding: 8px;
            border-radius: 4px;
            overflow-x: auto;
            margin: 8px 0;
            font-size: 11px;
          }

          .answer blockquote {
            border-left: 3px solid #1A1F2E;
            margin: 10px 0;
            padding-left: 10px;
            color: #666;
          }

          .answer table {
            width: 100%;
            border-collapse: collapse;
            margin: 8px 0;
            font-size: 11px;
          }

          .answer th, .answer td {
            border: 1px solid #ddd;
            padding: 5px;
            text-align: left;
          }

          .answer th {
            background-color: #f8f9fa;
            color: #1A1F2E;
            font-weight: bold;
          }

          .footer {
            margin-top: -8px;
            text-align: center;
            font-size: 10px;
            color: #666;
          }

          .chart-container {
            width: 100%;
            margin: 20px 0;
            padding: 10px;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo-container">
            <img src="${validatedLogo}" id="logo" alt="Company Logo">
            <h1>Go1</h1>
          </div>
        </div>

        <div class="title-container">
          <h1 id="title">${title}</h1>
          <p id="description">${description}</p>
        </div>
        
        ${tableOfContentsHtml}

        ${contentHtml}

        ${appendicesHtml}

        <div class="footer">
          <p>Generated on: <span id="generation-date">${currentDate}</span></p>
        </div>
      </body>
      </html>
    `;

    console.log('Generated static HTML for PDF, size:', completeHtml.length);

    // Generate PDF using serverless Puppeteer
    let pdfBuffer;
    try {
      pdfBuffer = await generatePDF(completeHtml);
    } catch (error) {
      console.error('Error in generatePDF:', error);
      throw new Error(`PDF generation failed: ${error.message}`);
    }

    if (!pdfBuffer) {
      throw new Error('PDF generation returned no buffer');
    }

    // Return the PDF
    const uint8Array = new Uint8Array(pdfBuffer);
    
    return new NextResponse(uint8Array, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(title.toLowerCase().replace(/\s+/g, '-'))}.pdf"`,
      },
    });

  } catch (error) {
    console.error('Error generating PDF:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause
    });
    
    // Return a more detailed error response
    return NextResponse.json({ 
      error: error.message || 'Failed to generate PDF',
      details: {
        errorType: error.name,
        errorCause: error.cause,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    }, { status: 500 });
  }
} 
