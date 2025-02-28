import { prepareAIContext } from './excelService';

/**
 * Enriches the context with financial terminology and common patterns
 */
const enrichFinancialContext = (context) => {
    const enriched = {
        ...context,
        terminology: {
            ARR: 'Annual Recurring Revenue',
            MRR: 'Monthly Recurring Revenue',
            CAC: 'Customer Acquisition Cost',
            LTV: 'Lifetime Value',
            EBITDA: 'Earnings Before Interest, Taxes, Depreciation, and Amortization',
            ROI: 'Return on Investment',
            ROE: 'Return on Equity',
            ROA: 'Return on Assets',
            GP: 'Gross Profit',
            NP: 'Net Profit',
            COGS: 'Cost of Goods Sold',
            CAPEX: 'Capital Expenditure',
            OPEX: 'Operating Expense',
            FCF: 'Free Cash Flow',
            'D&A': 'Depreciation and Amortization'
        },
        patterns: {
            growth: {
                description: 'Year-over-year or month-over-month growth patterns',
                metrics: ['revenue growth', 'user growth', 'margin growth']
            },
            profitability: {
                description: 'Indicators of company profitability',
                metrics: ['gross margin', 'operating margin', 'net margin']
            },
            efficiency: {
                description: 'Business efficiency metrics',
                metrics: ['CAC payback period', 'LTV/CAC ratio', 'burn rate']
            },
            liquidity: {
                description: 'Ability to meet short-term obligations',
                metrics: ['current ratio', 'quick ratio', 'cash ratio']
            },
            solvency: {
                description: 'Long-term financial stability',
                metrics: ['debt-to-equity', 'interest coverage', 'debt ratio']
            }
        }
    };

    return enriched;
};

/**
 * Detects the most common column names for various financial metrics
 */
const detectCommonColumns = (sheets) => {
    const columnPatterns = {
        revenue: ['revenue', 'sales', 'income', 'turnover'],
        expenses: ['expense', 'cost', 'expenditure', 'spending'],
        profit: ['profit', 'earnings', 'income', 'ebitda', 'ebit'],
        assets: ['asset', 'property', 'equipment'],
        liabilities: ['liability', 'debt', 'loan', 'payable'],
        equity: ['equity', 'capital', 'shareholder', 'retained'],
        cash: ['cash', 'money', 'fund', 'liquidity']
    };

    const columnsFound = {};
    
    sheets.forEach(sheet => {
        const headers = sheet.headers.map(h => String(h).toLowerCase());
        
        Object.entries(columnPatterns).forEach(([metricType, patterns]) => {
            if (!columnsFound[metricType]) {
                columnsFound[metricType] = [];
            }
            
            headers.forEach((header, index) => {
                if (patterns.some(pattern => header.includes(pattern))) {
                    columnsFound[metricType].push({
                        sheet: sheet.name,
                        header: sheet.headers[index],
                        index
                    });
                }
            });
        });
    });
    
    return columnsFound;
};

/**
 * Analyzes financial trends in the data
 */
const analyzeTrends = (timeSeries) => {
    const trends = [];

    // Process each sheet's time series
    Object.entries(timeSeries).forEach(([sheetName, metrics]) => {
        // Process each metric in the sheet
        Object.entries(metrics).forEach(([metric, data]) => {
            if (data.length < 2) return;
    
            // Sort by date if possible
            const sortedData = [...data].sort((a, b) => {
                // Try to parse dates or use direct comparison
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);
                
                if (!isNaN(dateA) && !isNaN(dateB)) {
                    return dateA - dateB;
                }
                return 0; // Keep original order if can't parse dates
            });
            
            const values = sortedData.map(item => item.value);
            
            // Get latest values
            const latestValue = values[values.length - 1];
            const previousValue = values[values.length - 2];
    
            // Calculate period-over-period change
            if (latestValue && previousValue && previousValue !== 0) {
                const growthRate = ((latestValue - previousValue) / Math.abs(previousValue)) * 100;
                const trend = growthRate > 0 ? 'increasing' : (growthRate < 0 ? 'decreasing' : 'stable');
                const significance = Math.abs(growthRate) > 10 ? 'significant' : 
                                   (Math.abs(growthRate) > 5 ? 'moderate' : 'minor');
                
                trends.push({
                    sheet: sheetName,
                    metric,
                    latestValue,
                    previousValue,
                    growthRate,
                    trend,
                    significance
                });
            }
            
            // Calculate longer-term trend if we have enough data points
            if (values.length >= 4) {
                // Calculate average growth rate over all periods
                let totalGrowth = 0;
                for (let i = 1; i < values.length; i++) {
                    if (values[i-1] !== 0) {
                        totalGrowth += ((values[i] - values[i-1]) / Math.abs(values[i-1])) * 100;
                    }
                }
                
                const avgGrowthRate = totalGrowth / (values.length - 1);
                const longTermTrend = avgGrowthRate > 1 ? 'upward' : (avgGrowthRate < -1 ? 'downward' : 'stable');
                
                trends.push({
                    sheet: sheetName,
                    metric,
                    type: 'long-term',
                    avgGrowthRate,
                    trend: longTermTrend,
                    dataPoints: values.length
                });
            }
        });
    });

    return trends;
};

/**
 * Generates insights based on the financial data
 */
const generateInsights = (context) => {
    const insights = [];
    const { sheets, timeSeries, overallMetrics, metadata } = context;

    // Add general file information
    if (metadata) {
        insights.push(`Analyzed Excel file with ${metadata.sheetCount} sheets and size of ${(metadata.fileSize / 1024).toFixed(1)} KB`);
    }

    // Analyze each sheet
    sheets.forEach(sheet => {
        const { name, type, metrics } = sheet;
        
        switch (type) {
            case 'INCOME_STATEMENT':
                if (metrics.grossMargin) {
                    const healthStatus = metrics.grossMargin > 30 ? 'healthy' : 
                                        (metrics.grossMargin > 15 ? 'moderate' : 'concerning');
                    insights.push(`Gross margin on ${name} is ${metrics.grossMargin.toFixed(1)}%, which is ${healthStatus}`);
                }
                if (metrics.operatingMargin) {
                    insights.push(`Operating margin on ${name} is ${metrics.operatingMargin.toFixed(1)}%`);
                }
                break;

            case 'BALANCE_SHEET':
                if (metrics.currentRatio) {
                    const healthStatus = metrics.currentRatio > 1.5 ? 'healthy' : 
                                        (metrics.currentRatio > 1 ? 'adequate' : 'concerning');
                    insights.push(`Current ratio of ${metrics.currentRatio.toFixed(2)} on ${name} indicates ${healthStatus} liquidity`);
                }
                if (metrics.debtToEquity) {
                    const riskLevel = metrics.debtToEquity > 2 ? 'high' : 
                                    (metrics.debtToEquity > 1 ? 'moderate' : 'low');
                    insights.push(`Debt-to-equity ratio of ${metrics.debtToEquity.toFixed(2)} suggests ${riskLevel} leverage`);
                }
                break;

            case 'CASH_FLOW':
                if (metrics.burnRate && metrics.runway) {
                    insights.push(`Current burn rate is ${metrics.burnRate.toFixed(2)}M per month with ${metrics.runway.toFixed(1)} months of runway`);
                }
                if (metrics.freeCashFlow) {
                    const status = metrics.freeCashFlow > 0 ? 'positive' : 'negative';
                    insights.push(`Free cash flow is ${status} at ${metrics.freeCashFlow.toFixed(2)}M`);
                }
                break;
        }
    });

    // Analyze trends
    const trends = analyzeTrends(timeSeries);
    
    // Add significant trend insights
    trends.forEach(trend => {
        if (trend.type === 'long-term') {
            if (Math.abs(trend.avgGrowthRate) > 5) {
                insights.push(`${trend.metric} on ${trend.sheet} shows a ${trend.trend} trend averaging ${trend.avgGrowthRate.toFixed(1)}% over ${trend.dataPoints} periods`);
            }
        } else if (trend.significance === 'significant') {
            insights.push(`${trend.metric} on ${trend.sheet} shows a ${trend.trend} trend (${trend.growthRate.toFixed(1)}% change)`);
        }
    });

    // Find common columns across sheets
    const commonColumns = detectCommonColumns(sheets);
    if (Object.keys(commonColumns).length > 0) {
        // Add insights about key financial metrics found
        const keyMetrics = [];
        if (commonColumns.revenue && commonColumns.revenue.length > 0) {
            keyMetrics.push('revenue');
        }
        if (commonColumns.profit && commonColumns.profit.length > 0) {
            keyMetrics.push('profit/earnings');
        }
        if (commonColumns.cash && commonColumns.cash.length > 0) {
            keyMetrics.push('cash flow');
        }
        
        if (keyMetrics.length > 0) {
            insights.push(`Key financial metrics identified: ${keyMetrics.join(', ')}`);
        }
    }

    return insights;
};

/**
 * Main function to process questions about Excel data
 */
export const processExcelQuestion = async (cacheKey, question) => {
    try {
        console.log(`Processing Excel question: "${question}" for file: ${cacheKey}`);
        
        // Get the context for the Excel file
        const contextData = prepareAIContext(cacheKey, question);
        if (!contextData || !contextData.context) {
            throw new Error('Failed to prepare AI context for Excel question');
        }
        
        // Enrich the context with financial terminology and patterns
        const enrichedContext = enrichFinancialContext(contextData.context);
        
        // Generate insights from the data
        const insights = generateInsights(enrichedContext);
        
        // Find relevant trends
        const trends = analyzeTrends(enrichedContext.timeSeries);
        
        // Prepare the response
        const response = {
            question,
            answer: '', // This would be filled by your AI model
            context: enrichedContext,
            insights,
            supportingData: {
                relevantMetrics: {},
                charts: [],
                trends: trends.filter(t => t.significance === 'significant' || t.type === 'long-term')
            }
        };

        // Extract relevant metrics for the question
        const questionLower = question.toLowerCase();
        const keyMetrics = [];
        
        // Look for mentions of specific metrics
        const metricKeywords = {
            'revenue': ['revenue', 'sales', 'turnover', 'income'],
            'profit': ['profit', 'margin', 'earnings', 'ebitda', 'income'],
            'cash': ['cash', 'liquidity', 'runway', 'burn'],
            'debt': ['debt', 'liability', 'loan', 'leverage'],
            'growth': ['growth', 'increase', 'trend']
        };
        
        Object.entries(metricKeywords).forEach(([metricGroup, keywords]) => {
            if (keywords.some(keyword => questionLower.includes(keyword))) {
                keyMetrics.push(metricGroup);
            }
        });
        
        // Filter timeseries data related to the question
        Object.entries(enrichedContext.timeSeries).forEach(([sheetName, metrics]) => {
            response.supportingData.relevantMetrics[sheetName] = {};
            
            Object.entries(metrics).forEach(([metricName, values]) => {
                const metricNameLower = metricName.toLowerCase();
                
                // Check if this metric is relevant to the question
                if (keyMetrics.length === 0 || 
                    keyMetrics.some(key => metricKeywords[key].some(keyword => metricNameLower.includes(keyword)))) {
                    response.supportingData.relevantMetrics[sheetName][metricName] = values;
                    
                    // Add chart data
                    if (values.length >= 2) {
                        response.supportingData.charts.push({
                            title: `${metricName} (${sheetName})`,
                            labels: values.map(v => v.date),
                            data: values.map(v => v.value)
                        });
                    }
                }
            });
            
            // Remove empty sheet entries
            if (Object.keys(response.supportingData.relevantMetrics[sheetName]).length === 0) {
                delete response.supportingData.relevantMetrics[sheetName];
            }
        });

        console.log(`Generated response with ${insights.length} insights and ${response.supportingData.charts.length} charts`);
        return response;
    } catch (error) {
        console.error('Error processing Excel question:', error);
        throw new Error(`Failed to process question: ${error.message}`);
    }
};

/**
 * Generates prompts for common financial analysis questions
 */
export const getSuggestedQuestions = (context) => {
    const { sheets, metadata } = context;
    const questions = [];

    // Add general questions about the file
    questions.push(
        `What insights can you provide from this Excel file?`,
        `What are the key financial metrics in this data?`
    );

    // Add sheet-specific questions
    sheets.forEach(sheet => {
        switch (sheet.type) {
            case 'INCOME_STATEMENT':
                questions.push(
                    `What is the trend in revenue growth on ${sheet.name}?`,
                    `How has the profit margin evolved in ${sheet.name}?`,
                    `What are the main drivers of expenses in ${sheet.name}?`
                );
                break;

            case 'BALANCE_SHEET':
                questions.push(
                    `What is the current ratio on ${sheet.name} and is it healthy?`,
                    `How has the debt-to-equity ratio changed in ${sheet.name}?`,
                    `Is working capital sufficient based on ${sheet.name}?`
                );
                break;

            case 'CASH_FLOW':
                questions.push(
                    `What is the current burn rate shown in ${sheet.name}?`,
                    `How many months of runway are left according to ${sheet.name}?`,
                    `Is the cash flow from operations improving in ${sheet.name}?`
                );
                break;
                
            case 'UNKNOWN':
                // For unknown sheet types, suggest general questions based on sheet name
                const sheetNameLower = sheet.name.toLowerCase();
                if (sheetNameLower.includes('forecast') || sheetNameLower.includes('projection')) {
                    questions.push(`What are the key projections in ${sheet.name}?`);
                } else if (sheetNameLower.includes('budget')) {
                    questions.push(`How does the budget allocation look in ${sheet.name}?`);
                } else {
                    questions.push(`What are the key trends in ${sheet.name}?`);
                }
                break;
        }
    });

    // Remove duplicates and limit to 10 questions
    return [...new Set(questions)].slice(0, 10);
}; 