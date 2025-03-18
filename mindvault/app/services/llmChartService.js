/**
 * LLM-based chart generation service
 * Replaces keyword-based approach with AI-powered data extraction and chart generation
 */

// Helper function to call our secure API endpoint (reusing from answerService.js)
async function callLLM(messages, model = "llama-3.1-8b-instant", temperature = 0.7) {
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          model,
          temperature,
          max_completion_tokens: 32000
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API error: ${response.status} ${JSON.stringify(errorData)}`);
      }
  
      return await response.json();
    } catch (error) {
      console.error('Error calling AI API:', error);
      throw error;
    }
  }
  
  /**
   * Ensures chart titles are properly formatted with title case
   * (Reused from existing implementation)
   */
  const formatChartTitle = (title) => {
    if (!title) return '';
    
    // Words that should not be capitalized (unless they are the first word)
    const smallWords = ['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'if', 'in', 
                        'nor', 'of', 'on', 'or', 'per', 'the', 'to', 'vs', 'via'];
    
    return title
      .split(' ')
      .map((word, index) => {
        // Check if the word should be lowercase
        const lower = word.toLowerCase();
        
        // Always capitalize the first word, last word, and words not in the smallWords list
        if (index === 0 || index === title.split(' ').length - 1 || !smallWords.includes(lower)) {
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        }
        
        return lower;
      })
      .join(' ');
  };
  
  /**
   * Determines if a chart is appropriate for the given question and answer
   * @param {string} question - The user's question
   * @param {string} answer - The AI's answer to the question
   * @returns {Promise<boolean>} Whether a chart is appropriate
   */
  export const isChartAppropriate = async (question, answer) => {
    try {
      console.log("Chart appropriateness: Analyzing if chart is appropriate for question");
      console.log("Chart appropriateness: Question:", question.substring(0, 100) + "...");
      console.log("Chart appropriateness: Answer preview:", answer.substring(0, 100) + "...");
      
      // Create prompt to determine if a chart is appropriate
      const messages = [
        {
          role: "system",
          content: `You are a financial analysis expert who determines if data visualization would be helpful.
  Your task is to determine if the user's question and the corresponding answer warrant a chart or graph.
  
  Charts are appropriate when:
  1. The question asks specifically for a visualization or chart
  2. The answer contains numerical time-series data (e.g., ARR over months/quarters)
  3. The answer includes data that shows trends, comparisons, or distributions
  4. The question is about financial performance metrics that are typically visualized
  
  Charts are NOT appropriate when:
  1. The question is about qualitative information (e.g., team backgrounds, business strategy)
  2. The answer mainly contains text-based explanations without significant numerical data
  3. The question is seeking a single number or metric rather than a trend or pattern
  4. The data mentioned is too sparse (fewer than 3 data points)
  
  Respond with ONLY "Yes" or "No" based on your analysis.`
        },
        {
          role: "user",
          content: `Question: ${question}\n\nAnswer: ${answer}\n\nBased on this question and answer, would a chart be appropriate and helpful? Answer ONLY Yes or No.`
        }
      ];
      
      console.log("Chart appropriateness: Sending LLM request to determine if chart is needed");
      const response = await callLLM(messages, "llama-3.1-8b-instant", 0);
      
      // Extract the Yes/No response
      const responseText = response.choices[0].message.content.trim();
      console.log(`Chart appropriateness: LLM responded with "${responseText}"`);
      
      // Check if response contains "Yes"
      const result = responseText.toLowerCase().includes('yes');
      console.log(`Chart appropriateness: Final determination: ${result ? "Chart IS appropriate" : "Chart is NOT appropriate"}`);
      return result;
      
    } catch (error) {
      console.error("Error determining chart appropriateness:", error);
      return false; // Default to no chart on error
    }
  };
  
  /**
   * Identifies the appropriate metric and extracts data for charting
   * @param {string} question - The user's question
   * @param {string} answer - The AI's answer to the question
   * @param {string} fileContent - The content of the Excel file
   * @returns {Promise<Object|null>} Chart data object or null if no suitable data found
   */
  export const extractChartDataFromLLM = async (question, answer, fileContent) => {
    try {
      console.log("Chart extraction: Starting LLM-based data extraction");
      console.log(`Chart extraction: Question contains '${question.substring(0, 100)}...'`);
      console.log(`Chart extraction: Answer contains financial data related to ARR: ${answer.toLowerCase().includes('arr')}`);
      console.log(`Chart extraction: File content length: ${fileContent.length} characters`);
      
      // Sample of file content for debugging
      console.log(`Chart extraction: File content sample: ${fileContent.substring(0, 300)}...`);
      
      // First, determine if a chart is even appropriate
      const chartIsAppropriate = await isChartAppropriate(question, answer);
      
      if (!chartIsAppropriate) {
        console.log("Chart extraction: LLM determined a chart is not appropriate for this question");
        return null;
      }
      
      console.log("Chart extraction: LLM determined a chart IS appropriate - proceeding with data extraction");
      
      // Create prompt to identify the metric and extract data
      const messages = [
        {
          role: "system",
          content: `You are a financial data extraction expert. Your task is to analyze the provided Excel content, 
  identify relevant time-series data mentioned in the user's question or answer, and extract it for visualization.
  
  First, identify the most relevant metric (e.g., ARR, Revenue, Burn Rate) from the question and answer.
  Then, locate that metric in the Excel content and extract:
  1. The time periods/labels (e.g., months, quarters, years)
  2. The corresponding values for the metric
  3. The most appropriate chart type (line, bar, area)
  4. A suitable title for the chart
  
  Respond in JSON format exactly like this:
  {
    "metric": "identified metric name",
    "chartType": "line OR bar OR area",
    "title": "suggested chart title",
    "labels": ["label1", "label2", ...],
    "values": [value1, value2, ...],
    "yAxisLabel": "unit or description of values"
  }
  
  If you cannot find appropriate data for charting, respond with: { "metric": null }`
        },
        {
          role: "user",
          content: `Question: ${question}\n\nAnswer: ${answer}\n\nExcel Content:\n${fileContent.substring(0, 50000)}`
        }
      ];
      
      console.log("Chart extraction: Sending LLM request for data extraction");
      // Use a more capable model for data extraction (llama-3-70b-chat)
      const response = await callLLM(messages, "llama-3.1-70b-chat", 0);
      
      // Extract and parse the JSON response
      const responseText = response.choices[0].message.content.trim();
      console.log("Chart extraction: Raw LLM response:", responseText.substring(0, 500) + "...");
      
      // Find JSON content within the response (in case the LLM added explanatory text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        console.log("Chart extraction: No JSON found in LLM response");
        console.log(`Chart extraction: Raw response: "${responseText.substring(0, 200)}..."`);
        return null;
      }
      
      try {
        const extractedData = JSON.parse(jsonMatch[0]);
        console.log("Chart extraction: Successfully parsed JSON response", extractedData);
        
        // If the LLM couldn't find appropriate data
        if (!extractedData.metric) {
          console.log("Chart extraction: LLM couldn't identify appropriate chart data");
          return null;
        }
        
        // Validate the extracted data
        if (!extractedData.labels || !extractedData.values || 
            extractedData.labels.length < 3 || extractedData.values.length < 3) {
          console.log("Chart extraction: Insufficient data points for charting");
          console.log(`Chart extraction: Labels: ${JSON.stringify(extractedData.labels)}`);
          console.log(`Chart extraction: Values: ${JSON.stringify(extractedData.values)}`);
          return null;
        }
        
        // Convert to Recharts format
        const chartData = {
          type: extractedData.chartType || 'line',
          title: formatChartTitle(extractedData.title),
          data: {
            labels: extractedData.labels,
            datasets: [
              {
                label: extractedData.yAxisLabel || extractedData.metric,
                data: extractedData.values,
                borderColor: getColorForMetric(extractedData.metric),
                backgroundColor: getBackgroundColorForMetric(extractedData.metric)
              }
            ]
          }
        };
        
        console.log("Chart extraction: Created chart data", chartData);
        return chartData;
        
      } catch (error) {
        console.error("Chart extraction: Error parsing LLM JSON response:", error);
        console.log("Raw response:", responseText);
        return null;
      }
      
    } catch (error) {
      console.error("Chart extraction: Error in LLM data extraction:", error);
      return null;
    }
  };
  
  /**
   * Gets a color for a given metric (for consistent color usage)
   */
  function getColorForMetric(metric) {
    const metricLower = metric.toLowerCase();
    
    // Default colors for common metrics
    if (metricLower.includes('arr') || metricLower.includes('revenue')) {
      return '#4287f5'; // Blue
    } else if (metricLower.includes('burn') || metricLower.includes('expense')) {
      return '#FF5630'; // Red
    } else if (metricLower.includes('growth') || metricLower.includes('cagr')) {
      return '#36B37E'; // Green
    } else if (metricLower.includes('profit') || metricLower.includes('margin')) {
      return '#6554C0'; // Purple
    } else if (metricLower.includes('user') || metricLower.includes('customer')) {
      return '#FFAB00'; // Yellow
    } else {
      return '#4C9AFF'; // Default blue
    }
  }
  
  /**
   * Gets a background color for a given metric (with transparency)
   */
  function getBackgroundColorForMetric(metric) {
    const solidColor = getColorForMetric(metric);
    // Add 20% opacity to the solid color
    return solidColor + '33';
  }
  
  /**
   * Main function to generate chart data based on question, answer and file content
   * Uses LLM to determine if a chart is needed and extract the relevant data
   */
  export const generateChartFromLLM = async (question, answer, fileContent) => {
    try {
      console.log("Chart generation: Starting LLM-based chart generation");
      console.log(`Chart generation: Question: "${question.substring(0, 100)}..."`);
      console.log(`Chart generation: Answer length: ${answer.length} characters`);
      console.log(`Chart generation: File content length: ${fileContent?.length || 0} characters`);
      
      // Skip chart generation for short file content
      if (!fileContent || fileContent.length < 500) {
        console.log("Chart generation: File content too short for chart generation");
        return null;
      }
      
      // Skip if question or answer don't have financial terms
      const financialTerms = ['arr', 'revenue', 'burn', 'growth', 'financial', 'metric', 'kpi', 'chart', 'graph', 'trend'];
      const hasFinancialTerms = financialTerms.some(term => 
        question.toLowerCase().includes(term) || answer.toLowerCase().includes(term)
      );
      
      if (!hasFinancialTerms) {
        console.log("Chart generation: No financial terms detected, skipping chart generation");
        return null;
      }
      
      // Log which financial terms were found
      const foundTerms = financialTerms.filter(term => 
        question.toLowerCase().includes(term) || answer.toLowerCase().includes(term)
      );
      console.log(`Chart generation: Found financial terms: ${foundTerms.join(', ')}`);
      
      // Check if data contains key indicators of time series data
      const containsTimeSeriesIndicators = 
        fileContent.includes('Q1') || 
        fileContent.includes('Q2') || 
        fileContent.includes('Q3') || 
        fileContent.includes('Q4') ||
        fileContent.includes('FY20') ||
        fileContent.includes('FY21') ||
        fileContent.includes('Quarter') ||
        fileContent.includes('Jan-') ||
        fileContent.includes('Feb-') ||
        fileContent.includes('Mar-');
      
      console.log(`Chart generation: Contains time series indicators: ${containsTimeSeriesIndicators}`);
      
      if (!containsTimeSeriesIndicators) {
        console.log("Chart generation: No time series data indicators found, skipping chart generation");
        return null;
      }
      
      // Check if this is an ARR question
      const isArrQuestion = question.toLowerCase().includes('arr') || 
                           question.toLowerCase().includes('annual recurring revenue') ||
                           answer.toLowerCase().includes('arr') ||
                           answer.toLowerCase().includes('annual recurring revenue');
      
      console.log(`Chart generation: Is ARR question: ${isArrQuestion}`);
      
      // Try LLM-based extraction first
      const llmChartData = await extractChartDataFromLLM(question, answer, fileContent);
      
      if (llmChartData) {
        console.log("Chart generation: Successfully extracted chart data via LLM");
        return llmChartData;
      }
      
      // If LLM extraction failed and this is an ARR question, try the fallback method
      if (isArrQuestion) {
        console.log("Chart generation: LLM extraction failed, trying fallback ARR extraction");
        const fallbackData = extractARRDataFallback(fileContent);
        
        if (fallbackData) {
          console.log("Chart generation: Successfully extracted ARR data via fallback method");
          return fallbackData;
        }
      }
      
      console.log("Chart generation: All extraction methods failed, no chart will be displayed");
      return null;
      
    } catch (error) {
      console.error("Error generating chart:", error);
      return null;
    }
  };
  
  /**
   * Fallback extraction method specifically for ARR data
   * Used when LLM-based extraction fails
   */
  function extractARRDataFallback(fileContent) {
    try {
      console.log("Fallback extraction: Attempting to extract ARR data directly");
      
      // Look for Historical Metric section
      if (!fileContent.includes('Historical Metric') && !fileContent.includes('Historical Metrics')) {
        console.log("Fallback extraction: No Historical Metric sheet found");
        return null;
      }
      
      // Extract the Historical Metric sheet
      const sheets = fileContent.split(/---\s*Sheet:\s*([^-]+)\s*---/);
      let historicalMetricContent = '';
      
      // Find the Historical Metric sheet
      for (let i = 1; i < sheets.length; i += 2) {
        const sheetName = sheets[i].trim();
        const sheetContent = sheets[i + 1] || '';
        
        if (sheetName.toLowerCase().includes('historical metric')) {
          historicalMetricContent = sheetContent;
          console.log(`Fallback extraction: Found Historical Metric sheet, content length: ${historicalMetricContent.length}`);
          break;
        }
      }
      
      if (!historicalMetricContent) {
        console.log("Fallback extraction: Historical Metric sheet not found");
        return null;
      }
      
      // Look for ARR data in rows
      const lines = historicalMetricContent.split('\n');
      console.log(`Fallback extraction: Historical Metric sheet has ${lines.length} lines`);
      
      // Find the ARR or Annual Recurring Revenue row
      let arrRow = null;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].toLowerCase();
        if (line.includes('arr') || line.includes('annual recurring revenue')) {
          arrRow = i;
          console.log(`Fallback extraction: Found ARR row at line ${i}: ${lines[i]}`);
          break;
        }
      }
      
      if (arrRow === null) {
        console.log("Fallback extraction: No ARR row found in Historical Metric sheet");
        return null;
      }
      
      // Parse the ARR row data
      const arrLine = lines[arrRow];
      const cells = arrLine.split('\t');
      console.log(`Fallback extraction: ARR row has ${cells.length} cells`);
      
      if (cells.length < 5) {
        console.log("Fallback extraction: Not enough data points in ARR row");
        return null;
      }
      
      // Extract labels (quarters/dates) from the header row
      let headerRow = null;
      for (let i = 0; i < Math.min(arrRow, 10); i++) {
        if (lines[i].includes('Q1') || lines[i].includes('Q2') || lines[i].includes('Q3') || 
            lines[i].includes('Q4') || lines[i].includes('FY')) {
          headerRow = i;
          console.log(`Fallback extraction: Found header row at line ${i}: ${lines[i]}`);
          break;
        }
      }
      
      if (headerRow === null) {
        console.log("Fallback extraction: No header row with quarter information found");
        return null;
      }
      
      const headerCells = lines[headerRow].split('\t');
      console.log(`Fallback extraction: Header row has ${headerCells.length} cells`);
      
      // Extract the labels and values, skipping the first cell (which contains the metric name)
      const labels = [];
      const values = [];
      
      for (let i = 1; i < Math.min(headerCells.length, cells.length); i++) {
        if (headerCells[i] && cells[i]) {
          // Only include cells that have both a header and a value
          const headerText = headerCells[i].trim();
          const valueText = cells[i].trim();
          
          if (headerText && valueText && headerText !== '-' && valueText !== '-') {
            // Convert the value to a number (remove currency symbols, commas, etc.)
            const numericValue = parseFloat(valueText.replace(/[^0-9.-]+/g, ''));
            
            if (!isNaN(numericValue)) {
              labels.push(headerText);
              values.push(numericValue);
            }
          }
        }
      }
      
      console.log(`Fallback extraction: Extracted ${labels.length} data points`);
      console.log(`Fallback extraction: Labels: ${JSON.stringify(labels)}`);
      console.log(`Fallback extraction: Values: ${JSON.stringify(values)}`);
      
      if (labels.length < 3 || values.length < 3) {
        console.log("Fallback extraction: Not enough valid data points (need at least 3)");
        return null;
      }
      
      // Create the chart data object
      const chartData = {
        type: 'line',
        title: 'Annual Recurring Revenue (ARR) Over Time',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'ARR',
              data: values,
              borderColor: getColorForMetric('ARR'),
              backgroundColor: getBackgroundColorForMetric('ARR')
            }
          ]
        }
      };
      
      console.log("Fallback extraction: Successfully created chart data");
      return chartData;
      
    } catch (error) {
      console.error("Error in fallback ARR extraction:", error);
      return null;
    }
  }
