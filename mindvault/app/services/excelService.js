import { read } from 'xlsx';
import _ from 'lodash';

/**
 * Cache for processed Excel data
 */
const dataCache = new Map();

/**
 * Formats numbers into K, M, B, T notation
 */
const formatNumber = (num) => {
    if (typeof num !== 'number' || isNaN(num)) return '';
    
    const sign = num < 0 ? '-' : '';
    const absNum = Math.abs(num);
    
    if (absNum >= 1e12) return sign + (absNum / 1e12).toFixed(1) + 'T';
    if (absNum >= 1e9) return sign + (absNum / 1e9).toFixed(1) + 'B';
    if (absNum >= 1e6) return sign + (absNum / 1e6).toFixed(1) + 'M';
    if (absNum >= 1e3) return sign + (absNum / 1e3).toFixed(1) + 'K';
    
    return sign + absNum.toFixed(2);
};

/**
 * Detects the type of financial statement based on headers and content
 */
const detectSheetType = (headers) => {
    const incomeStatementHeaders = ['revenue', 'sales', 'income', 'expenses', 'profit', 'margin'];
    const balanceSheetHeaders = ['assets', 'liabilities', 'equity', 'current', 'fixed'];
    const cashFlowHeaders = ['cash', 'operating', 'investing', 'financing', 'flow'];

    const lowerHeaders = headers.map(h => String(h).toLowerCase());

    if (incomeStatementHeaders.some(h => lowerHeaders.some(lh => lh.includes(h)))) {
        return 'INCOME_STATEMENT';
    }
    if (balanceSheetHeaders.some(h => lowerHeaders.some(lh => lh.includes(h)))) {
        return 'BALANCE_SHEET';
    }
    if (cashFlowHeaders.some(h => lowerHeaders.some(lh => lh.includes(h)))) {
        return 'CASH_FLOW';
    }
    return 'UNKNOWN';
};

/**
 * Find a column index by partial header name match
 */
const findColumnIndex = (headers, pattern) => {
    const lowerPattern = pattern.toLowerCase();
    return headers.findIndex(header => 
        String(header).toLowerCase().includes(lowerPattern)
    );
};

/**
 * Safely get a numeric value from a row
 */
const getNumericValue = (row, index) => {
    if (index === -1 || index >= row.length) return null;
    const value = row[index];
    
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        // Remove any currency symbols and commas, then parse
        const cleanedValue = value.replace(/[$,\s]/g, '');
        const parsedValue = parseFloat(cleanedValue);
        return isNaN(parsedValue) ? null : parsedValue;
    }
    return null;
};

/**
 * Extracts time series data from a sheet
 */
const extractTimeSeries = (data, headers) => {
    const timeSeriesData = {};
    
    // Find potential date columns
    const dateColumns = headers.map((header, index) => {
        // Check if column contains dates or year/period references
        const isDate = data.some(row => {
            const val = row[index];
            return val instanceof Date || 
                  (typeof val === 'string' && /^(q[1-4]|[12][0-9]{3})$/i.test(val)) ||
                  (typeof val === 'number' && val >= 1900 && val <= 2100);
        });
        return isDate ? index : -1;
    }).filter(index => index !== -1);

    if (dateColumns.length === 0) {
        // If no date columns found, try to use row indices as time series
        headers.forEach((header, i) => {
            if (typeof header === 'string' && header.trim() !== '') {
                const values = data.map((row, rowIndex) => ({
                    date: `Row ${rowIndex + 1}`,
                    value: getNumericValue(row, i)
                })).filter(item => item.value !== null);
                
                if (values.length > 0) {
                    timeSeriesData[header] = values;
                }
            }
        });
    } else {
        // Use found date columns
        dateColumns.forEach(dateCol => {
            headers.forEach((header, i) => {
                if (i !== dateCol && typeof header === 'string' && header.trim() !== '') {
                    const values = data.map(row => {
                        let dateValue = row[dateCol];
                        // Format the date appropriately
                        if (dateValue instanceof Date) {
                            dateValue = dateValue.toISOString().split('T')[0];
                        } else if (typeof dateValue === 'number' || typeof dateValue === 'string') {
                            dateValue = String(dateValue);
                        }
                        
                        return {
                            date: dateValue,
                            value: getNumericValue(row, i)
                        };
                    }).filter(item => item.date && item.value !== null);
                    
                    if (values.length > 0) {
                        timeSeriesData[header] = values;
                    }
                }
            });
        });
    }

    return timeSeriesData;
};

/**
 * Calculates financial metrics
 */
const calculateFinancialMetrics = (data, sheetType, headers) => {
    const metrics = {};
    
    try {
        switch (sheetType) {
            case 'INCOME_STATEMENT':
                metrics.grossMargin = calculateGrossMargin(data, headers);
                metrics.operatingMargin = calculateOperatingMargin(data, headers);
                metrics.netMargin = calculateNetMargin(data, headers);
                break;
                
            case 'BALANCE_SHEET':
                metrics.currentRatio = calculateCurrentRatio(data, headers);
                metrics.debtToEquity = calculateDebtToEquity(data, headers);
                metrics.workingCapital = calculateWorkingCapital(data, headers);
                break;
                
            case 'CASH_FLOW':
                metrics.burnRate = calculateBurnRate(data, headers);
                metrics.runway = calculateRunway(data, headers);
                metrics.freeCashFlow = calculateFreeCashFlow(data, headers);
                break;
        }
    } catch (error) {
        console.error(`Error calculating metrics for ${sheetType}:`, error);
    }
    
    return metrics;
};

/**
 * Process workbook data
 */
const processWorkbookData = (workbook) => {
    const processedData = {
        sheets: {},
        metrics: {},
        timeSeries: {},
        insights: [],
        metadata: {
            sheetCount: workbook.SheetNames.length
        }
    };

    // Process each sheet
    for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const jsonData = read(sheet, { header: 1, defval: null });
        
        if (jsonData.length < 2) continue;
        
        const headers = jsonData[0].map(h => h || '');
        const data = jsonData.slice(1);
        
        processedData.sheets[sheetName] = {
            headers,
            data,
            metrics: calculateFinancialMetrics(data, detectSheetType(headers), headers),
            timeSeries: extractTimeSeries(data, headers)
        };
    }

    return processedData;
};

// Export the main function
export const processExcelFile = async (file) => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = read(arrayBuffer);
        return processWorkbookData(workbook);
    } catch (error) {
        console.error('Error processing Excel file:', error);
        throw error;
    }
};

/**
 * Generates visualization data for charts
 */
export const generateChartData = (cacheKey, sheetName, metric) => {
    const data = dataCache.get(cacheKey);
    if (!data || !data.timeSeries[sheetName]) {
        throw new Error('Data not found in cache');
    }
    
    const timeSeriesData = data.timeSeries[sheetName][metric];
    if (!timeSeriesData) {
        throw new Error('Metric not found in time series data');
    }
    
    return {
        labels: timeSeriesData.map(item => item.date),
        datasets: [{
            label: metric,
            data: timeSeriesData.map(item => item.value)
        }]
    };
};

/**
 * Prepares context for AI analysis
 */
export const prepareAIContext = (cacheKey, question) => {
    const data = dataCache.get(cacheKey);
    if (!data) {
        throw new Error('Data not found in cache');
    }
    
    // Create a more compact representation for the AI
    const compactData = {
        question,
        context: {
            sheets: Object.entries(data.sheets).map(([name, sheet]) => ({
                name,
                type: sheet.type,
                headers: sheet.headers,
                metrics: sheet.metrics,
                rowCount: sheet.data.length,
                summary: generateSheetSummary(sheet)
            })),
            timeSeries: {},
            overallMetrics: _.mapValues(data.sheets, 'metrics'),
            metadata: data.metadata
        }
    };
    
    // Only include key time series data (limit to most relevant)
    Object.entries(data.timeSeries).forEach(([sheetName, metrics]) => {
        compactData.context.timeSeries[sheetName] = {};
        
        // Get the top 5 most complete metrics (with most data points)
        const sortedMetrics = Object.entries(metrics)
            .sort((a, b) => b[1].length - a[1].length)
            .slice(0, 5);
            
        sortedMetrics.forEach(([metricName, values]) => {
            compactData.context.timeSeries[sheetName][metricName] = values;
        });
    });
    
    console.log(`AI context prepared for ${cacheKey} with ${Object.keys(compactData.context.sheets).length} sheets`);
    return compactData;
};

/**
 * Helper function to generate sheet-specific summaries
 */
const generateSheetSummary = (sheet) => {
    const summary = [];
    const { type, headers, data, metrics } = sheet;
    
    summary.push(`Type: ${type}`);
    summary.push(`Columns: ${headers.filter(h => h && h.trim() !== '').join(', ')}`);
    summary.push(`Rows: ${data.length}`);
    
    if (Object.keys(metrics).length > 0) {
        summary.push('Metrics:');
        Object.entries(metrics).forEach(([metric, value]) => {
            if (value !== null && value !== undefined && value !== 0) {
                summary.push(`${metric}: ${formatNumber(value)}`);
            }
        });
    }
    
    return summary.join('\n');
};

// Metric calculation helper functions with actual implementations
const calculateGrossMargin = (data, headers) => {
    const revenueIndex = findColumnIndex(headers, 'revenue');
    const costIndex = findColumnIndex(headers, 'cost of goods sold');
    
    if (revenueIndex === -1 || costIndex === -1) return null;
    
    // Use the most recent row with both values
    for (let i = data.length - 1; i >= 0; i--) {
        const revenue = getNumericValue(data[i], revenueIndex);
        const cost = getNumericValue(data[i], costIndex);
        
        if (revenue && cost && revenue !== 0) {
            return ((revenue - cost) / revenue) * 100;
        }
    }
    
    return null;
};

const calculateOperatingMargin = (data, headers) => {
    const revenueIndex = findColumnIndex(headers, 'revenue');
    const opIncomeIndex = findColumnIndex(headers, 'operating income');
    
    if (revenueIndex === -1 || opIncomeIndex === -1) {
        // Try alternative headers
        const ebitIndex = findColumnIndex(headers, 'ebit');
        if (revenueIndex === -1 || ebitIndex === -1) return null;
        
        // Use the most recent row with both values
        for (let i = data.length - 1; i >= 0; i--) {
            const revenue = getNumericValue(data[i], revenueIndex);
            const ebit = getNumericValue(data[i], ebitIndex);
            
            if (revenue && ebit && revenue !== 0) {
                return (ebit / revenue) * 100;
            }
        }
    } else {
        // Use the most recent row with both values
        for (let i = data.length - 1; i >= 0; i--) {
            const revenue = getNumericValue(data[i], revenueIndex);
            const opIncome = getNumericValue(data[i], opIncomeIndex);
            
            if (revenue && opIncome && revenue !== 0) {
                return (opIncome / revenue) * 100;
            }
        }
    }
    
    return null;
};

const calculateNetMargin = (data, headers) => {
    const revenueIndex = findColumnIndex(headers, 'revenue');
    const netIncomeIndex = findColumnIndex(headers, 'net income');
    
    if (revenueIndex === -1 || netIncomeIndex === -1) return null;
    
    // Use the most recent row with both values
    for (let i = data.length - 1; i >= 0; i--) {
        const revenue = getNumericValue(data[i], revenueIndex);
        const netIncome = getNumericValue(data[i], netIncomeIndex);
        
        if (revenue && netIncome && revenue !== 0) {
            return (netIncome / revenue) * 100;
        }
    }
    
    return null;
};

const calculateCurrentRatio = (data, headers) => {
    const currentAssetsIndex = findColumnIndex(headers, 'current assets');
    const currentLiabilitiesIndex = findColumnIndex(headers, 'current liabilities');
    
    if (currentAssetsIndex === -1 || currentLiabilitiesIndex === -1) return null;
    
    // Use the most recent row with both values
    for (let i = data.length - 1; i >= 0; i--) {
        const currentAssets = getNumericValue(data[i], currentAssetsIndex);
        const currentLiabilities = getNumericValue(data[i], currentLiabilitiesIndex);
        
        if (currentAssets && currentLiabilities && currentLiabilities !== 0) {
            return currentAssets / currentLiabilities;
        }
    }
    
    return null;
};

const calculateDebtToEquity = (data, headers) => {
    const totalDebtIndex = findColumnIndex(headers, 'total debt');
    const totalEquityIndex = findColumnIndex(headers, 'shareholders equity');
    
    if (totalDebtIndex === -1 || totalEquityIndex === -1) {
        // Try alternative headers
        const liabilitiesIndex = findColumnIndex(headers, 'total liabilities');
        const equityIndex = findColumnIndex(headers, 'total equity');
        
        if (liabilitiesIndex === -1 || equityIndex === -1) return null;
        
        // Use the most recent row with both values
        for (let i = data.length - 1; i >= 0; i--) {
            const liabilities = getNumericValue(data[i], liabilitiesIndex);
            const equity = getNumericValue(data[i], equityIndex);
            
            if (liabilities && equity && equity !== 0) {
                return liabilities / equity;
            }
        }
    } else {
        // Use the most recent row with both values
        for (let i = data.length - 1; i >= 0; i--) {
            const debt = getNumericValue(data[i], totalDebtIndex);
            const equity = getNumericValue(data[i], totalEquityIndex);
            
            if (debt && equity && equity !== 0) {
                return debt / equity;
            }
        }
    }
    
    return null;
};

const calculateWorkingCapital = (data, headers) => {
    const currentAssetsIndex = findColumnIndex(headers, 'current assets');
    const currentLiabilitiesIndex = findColumnIndex(headers, 'current liabilities');
    
    if (currentAssetsIndex === -1 || currentLiabilitiesIndex === -1) return null;
    
    // Use the most recent row with both values
    for (let i = data.length - 1; i >= 0; i--) {
        const currentAssets = getNumericValue(data[i], currentAssetsIndex);
        const currentLiabilities = getNumericValue(data[i], currentLiabilitiesIndex);
        
        if (currentAssets && currentLiabilities) {
            return currentAssets - currentLiabilities;
        }
    }
    
    return null;
};

const calculateBurnRate = (data, headers) => {
    const cashIndex = findColumnIndex(headers, 'cash');
    const cashFlowIndex = findColumnIndex(headers, 'operating cash flow');
    
    if (cashIndex === -1 || cashFlowIndex === -1) return null;
    
    // Calculate average monthly burn based on the most recent quarters/months
    const periods = Math.min(4, data.length);
    let totalBurn = 0;
    let validPeriods = 0;
    
    for (let i = data.length - 1; i >= Math.max(0, data.length - periods); i--) {
        const cashFlow = getNumericValue(data[i], cashFlowIndex);
        
        if (cashFlow && cashFlow < 0) {
            totalBurn += Math.abs(cashFlow);
            validPeriods++;
        }
    }
    
    return validPeriods > 0 ? totalBurn / validPeriods : null;
};

const calculateRunway = (data, headers) => {
    const cashIndex = findColumnIndex(headers, 'cash');
    const burnRate = calculateBurnRate(data, headers);
    
    if (cashIndex === -1 || !burnRate || burnRate === 0) return null;
    
    // Get the most recent cash value
    for (let i = data.length - 1; i >= 0; i--) {
        const cash = getNumericValue(data[i], cashIndex);
        
        if (cash) {
            return cash / burnRate;
        }
    }
    
    return null;
};

const calculateFreeCashFlow = (data, headers) => {
    const operatingCashFlowIndex = findColumnIndex(headers, 'operating cash flow');
    const capitalExpendituresIndex = findColumnIndex(headers, 'capital expenditures');
    
    if (operatingCashFlowIndex === -1 || capitalExpendituresIndex === -1) return null;
    
    // Use the most recent row with both values
    for (let i = data.length - 1; i >= 0; i--) {
        const operatingCashFlow = getNumericValue(data[i], operatingCashFlowIndex);
        const capitalExpenditures = getNumericValue(data[i], capitalExpendituresIndex);
        
        if (operatingCashFlow !== null && capitalExpenditures !== null) {
            return operatingCashFlow - Math.abs(capitalExpenditures);
        }
    }
    
    return null;
}; 