import React, { useState, forwardRef, useImperativeHandle, useEffect } from 'react';
import { chatService } from '../services/chatService';
import { ChevronDown, ChevronUp, Edit2, Save, RefreshCw, FileDown, Eye, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { exportToPDF as generatePDFExport } from './features/investment-memo/utils/pdfExport';

// Utility function to format numbers to 2 decimal places maximum
const formatNumbersInText = (text: string | any): string => {
  if (!text) return '';
  
  // Ensure text is a string
  if (typeof text !== 'string') {
    text = String(text);
  }

  // Regular expression to find numbers with decimal points
  // This regex looks for numbers that have a decimal point followed by at least one digit
  let formattedText = text;

  // Format currency values with $ symbols (like $123.4567 to $123.46)
  formattedText = formattedText.replace(/\$\s*(\d+\.\d+)/g, (match, number) => {
    return `$${parseFloat(number).toFixed(2)}`;
  });
  
  // Format currency values with currency codes (like USD$123.4567 to USD$123.46)
  formattedText = formattedText.replace(/(AU|USD|EUR|GBP|CAD|AUD)\$\s*(\d+\.\d+)/g, (match, currency, number) => {
    return `${currency}$${parseFloat(number).toFixed(2)}`;
  });
  
  // Format percentages (like 12.3456% to 12.35%)
  formattedText = formattedText.replace(/(\d+\.\d+)%/g, (match, number) => {
    return `${parseFloat(number).toFixed(2)}%`;
  });
  
  // Format standalone numbers with 3 or more decimal places (like 123.4567 to 123.46)
  formattedText = formattedText.replace(/(\d+\.\d{3,})(?!\w)/g, (match) => {
    return parseFloat(match).toFixed(2);
  });

  return formattedText;
};

// Function to split answer content into TLDR and details sections and clean up asterisks
const splitAnswerContent = (content: string | any) => {
  // Ensure content is a string
  if (!content || typeof content !== 'string') {
    return { tldr: '', details: '' };
  }
  
   // Handle both "TL;DR:" and "Summary:" formats for backward compatibility
   let processedContent = content.replace(/TL;DR:/i, 'Summary:');
  
   // Split on "DETAILS:" - case insensitive
   const parts = processedContent.split(/DETAILS:/i);
  
  if (parts.length === 1) {
    // Clean up content if no DETAILS section is found
    let cleanContent = parts[0].trim();
    cleanContent = cleanContent.replace(/Summary:/i, '').trim();
    
    // Remove markdown bold/italic formatting
    cleanContent = cleanContent.replace(/\*\*(.*?)\*\*/g, '$1'); // Bold
    cleanContent = cleanContent.replace(/\*(.*?)\*/g, '$1');     // Italic
    cleanContent = cleanContent.replace(/\*+/g, '');             // Any remaining asterisks
    
    return { tldr: cleanContent, details: '' };
  }
  
  // Clean up Summary part
  let tldr = parts[0].replace(/Summary:/i, '').trim();
  
  // Remove markdown formatting
  tldr = tldr.replace(/\*\*(.*?)\*\*/g, '$1');  // Bold
  tldr = tldr.replace(/\*(.*?)\*/g, '$1');      // Italic
  tldr = tldr.replace(/\*+/g, '');              // Any remaining asterisks
  
  // Clean up details part
  let details = parts[1].trim();
  
  // Remove markdown formatting from details as well
  details = details.replace(/\*\*(.*?)\*\*/g, '$1');  // Bold
  details = details.replace(/\*(.*?)\*/g, '$1');      // Italic
  details = details.replace(/\*+/g, '');              // Any remaining asterisks
  
  return { tldr, details };
};

interface InvestmentMemoProps {
    files: any[];
    onComplete?: (passed: boolean) => void;
    onAnswerUpdate?: (id: string, summary: string, details: string) => void;
}

interface Answer {
    summary: string;
    details: string;
    isEdited: boolean;
}

// New questions with detailed instructions
const INVESTMENT_MEMO_QUESTIONS = [
    {
        id: 'arr',
        question: 'What is the current Annual Recurring Revenue (ARR) of the company?',
        description: 'Find the most recent ARR figure with currency.',
        instructions: `You are tasked with finding the company's current Annual Recurring Revenue (ARR). Remember: Any financial figure extracted must be accompanied by the currency as listed in the source. Follow these steps:\n\n1. **Search for ARR Data**: Look for any documents or spreadsheets that reference ARR or contain data related to recurring revenue. Common places to check include financial reports, KPI reports, or specific revenue breakdowns. Ensure these documents are NOT forecasted figures. Discard forecasts.\n\n2. **Check for Direct ARR Information**: If the document directly lists ARR, extract that number. ARR is often presented as a top-level metric in financial statements, quarterly reports, or revenue charts.\n\n3. **If ARR Is Not Explicitly Listed**: If the document does not provide ARR directly, look for the **Monthly Recurring Revenue (MRR)** or any similar figures. ARR can be calculated by multiplying MRR by 12 (i.e., ARR = MRR \u00d7 12). Ensure you verify that the MRR provided is related to recurring revenue (i.e., not one-time payments).\n\n4. **Look for the Most Recent Figures**: Always make sure that you are referencing the most recent data available. If there are multiple versions of the report or data spread across different periods, prioritize the most recent one. For example, if there are figures for previous quarters or fiscal years, extract the most up-to-date ARR value.\n\n5. **Verify Source**: If you find the ARR figure in a specific tab, such as \u201cARR Info\u201d ensure you extract it from the correct place. Double-check that the value you find is for the correct period (e.g., current fiscal year or quarter).\n\n6. **Provide the Current ARR**: Once the ARR is found or calculated, provide the exact value. If there are any specific currencies mentioned (e.g., AUD, USD), include that in the answer. For example, \"The current ARR is $100m AUD.\"\n\n### Tips:\n- If working with multiple sources or documents, make sure to cross-check the ARR data to ensure consistency.\n- Pay attention to the time frame mentioned in the document to ensure the ARR is current and relevant.\n- Keep the answer precise and in the correct format (i.e., the numerical value followed by the currency).`
    },
    {
        id: 'burn-rate',
        question: 'What is the current burn rate?',
        description: 'Calculate the rate at which the company is spending cash.',
        instructions: `You are tasked with finding the current burn rate for the company. Remember: Any financial figure extracted must be accompanied by the currency as listed in the source. Follow these steps:\n\n1. **Search for Burn Rate Data**: Look for any documents or spreadsheets that contain data related to the company\u2019s cash burn or expenditure. This could include financial statements, cash flow reports, or specific key metrics summaries. Ensure these documents are NOT forecasted figures. Discard forecasts.\n\nFor the selected documents:\n2. **Identify Burn Rate Figures**: Find the most recent figure for cash burn (i.e., the rate at which the company is spending its cash). This is typically provided as a monthly figure. Ensure there are not forecasted figures.\n\n3. **If Burn Rate Is Given Over Time**: If the burn rate is given over a time series (e.g., over multiple months), calculate both:\n   - The **most recent burn rate**.\n   - The **average burn rate** over the specified time period (e.g., last 3 months, last 6 months). Ensure you state how long the time period is if you\u2019re calculating an average.\n\n   The burn rate is usually given in terms of currency per month, but ensure you clarify the time frame (e.g., monthly, quarterly) if necessary.\n\n4. **Provide the Burn Rate**: Once you\u2019ve found or calculated the burn rate, provide the **current burn rate** as a number with the appropriate currency.\n\n5. **Verify Source**: Ensure you reference the correct section of the document where the burn rate data is found.\n\n### Tips:\n- Double-check that the burn rate corresponds to the most recent period (e.g., monthly) and ensure it\u2019s accurate.\n- If you are averaging over multiple periods, ensure you clearly state the time period used (e.g., \u201caverage monthly burn rate for the last 6 months\u201d).\n- Always include the currency for clarity.`
    },
    {
        id: 'runway',
        question: 'How many months of runway does the company have at the current expense level?',
        description: 'Calculate how long the company can operate with current funds.',
        instructions: `You are tasked with calculating the company's runway at the current expense level. Remember: Any financial figure extracted must be accompanied by the currency as listed in the source. Follow these steps:\n\n1. **Search for Cash on Hand and Burn Rate Data**: Look for any documents or spreadsheets that provide the most recent figures for both:\n   - **Cash on Hand**: The total amount of cash the company has available.\n   - **Burn Rate**: The company's monthly expenditure or cash burn.\nEnsure these documents are NOT forecasted figures. Discard forecasts.\n\n2. **Identify Latest Figures**: Find the most recent data for both cash on hand and burn rate. These numbers are often found in financial statements, cash flow reports, or specific key metric summaries. Ensure that these figures are current (e.g., for the most recent month or quarter). Ensure there are not forecasted figures.\n\n3. **Calculate Runway**: Use the following formula to calculate the runway:\n   \\[\n   \\text{Runway} = \\frac{\\text{Cash on Hand}}{\\text{Burn Rate}}\n   \\]\n   This will give the number of months the company can sustain its current expense level before running out of cash. If necessary, round the result to one decimal place.\n\n4. **Provide the Runway**: Once you have calculated the runway, provide the result in months.\n\n5. **Verify Source**: Ensure that the figures you use for cash on hand and burn rate come from the correct source, such as the relevant document and section (e.g., "Document X, Excel sheet: Key Metrics").\n\n### Tips:\n- Double-check that the figures for cash on hand and burn rate are the most up-to-date and relevant.\n- Ensure the runway calculation is correct and that the result is clear and easy to interpret.\n- If there is any indication of future changes in expenses or cash flow, make sure to note those in the answer, if applicable.`
    },
    {
        id: 'problem',
        question: 'What problem is this company trying to solve?',
        description: 'Identify the core customer problem the company addresses.',
        instructions: `Using ONLY information contained in the provided documents, follow the <steps> to answer the question: What problem is this company trying to solve?. Take time to understand the question and think step by step. Remember: Any product-related information extracted must be accompanied by the source as listed in the documents.\n\n<steps>\n1. **Search for Value Proposition and Consumer Needs Statements**: Look for documents that describe the company's value proposition or problems/needs customers face which they aim to address, including pitch decks, strategy decks, product sheets, marketing materials, press releases, or any other documents that provide insight into the company's mission and the issues its products are designed to solve.\n\nFor the selected documents:\n2. **Identify the Problem the Company is Trying to Solve**: Identify which problem the company is proposing to solve for its customers. Look for statements that outline how the products improve customer situations, solve pain points, or create value for users.\n\n3. **Cross-Check with Customer Testimonials/Case Studies**: If available, examine customer testimonials or case studies that mention how the products have helped solve real-world problems for users. This could provide concrete examples of the problems being addressed. \n\n4. **Consolidate Information**: If there are multiple problems the company is trying to address, consolidate the information, ensuring there is no conflicting or redundant statements. Prioritize the most recent and detailed sources.\n\n5. **Provide the Answer**: Once the problems the company proposes to address have been clearly identified, list the specific problem(s) the company is trying to solve. Keep your answer short and concise. Include any additional information gathered that helps clarify the company's approach or strategy.\n\n7. **Verify Source**: Ensure you reference the correct source for your information, especially if the problem-solving capabilities of the products are described in specific sections or pages of the documents.\n</steps>\n\nGenerate your answer 3 times and compare for consistency and accuracy. If discrepancies arise, refine your synthesis and provide a final answer with the most precise and consistent data.`
    },
    {
        id: 'team',
        question: 'Who are the key members of the management team and what are their backgrounds?',
        description: 'Identify key executives and their relevant experience.',
        instructions: `Using ONLY information contained in the provided documents, follow the <steps> to answer the question: Who are the key members of the management team and what are their backgrounds? Take time to understand the question and think step by step. Remember: Any personnel-related information extracted must be accompanied by the source as listed in the documents. \n\n<steps>\n1. **Search for Management Team Information**: Look for documents such as organizational charts, company leadership bios, annual reports, investor presentations, press releases, or sections discussing the management team. These documents may specifically mention the key members of the team and provide details about their roles and backgrounds.\n\nFor the selected documents:\n2. **Identify Key Management Team Members**: Focus on identifying individuals who are referred to as the company's **key management members**, such as the CEO, CFO, CTO, COO, and other senior executives. Look for titles and roles that suggest they are part of the executive team or key decision-makers.\n\n3. **Extract Background Information**: For each key member, extract their **professional background**, including previous roles, relevant experience, and education (if provided). Pay attention to any previous companies they have worked for or notable achievements that highlight their expertise in the industry. Remember: This information must come from the provided documents.\n\n4. **Cross-Check for Multiple Mentions**: If multiple documents provide information about the same individuals, consolidate the details and ensure consistency. If there are discrepancies, prioritize the most recent document.\n\n5. **Provide the Answer**: Once you have identified the key management team members and their backgrounds, provide the information in the following format:  \n   - **[Name]**: [Title], [Background Information], [Education (if available)]  \n   - Include additional relevant details about their expertise or unique qualifications.\n\n6. **Verify Source**: Ensure you reference the correct source for your information, especially if management details are found in specific sections or pages of the documents.\n</steps>\n\nGenerate your answer 3 times and compare for consistency and accuracy. If discrepancies arise, refine your synthesis and provide a final answer with the most precise and consistent data.`
    }
];

// Create a ref to expose methods to the parent component
const InvestmentMemo = forwardRef<{
    analyzeDocuments: () => Promise<void>;
    exportToPDF: () => void;
    getAnswers: () => Record<string, Answer>;
}, InvestmentMemoProps>(({ files, onComplete, onAnswerUpdate }, ref) => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [answers, setAnswers] = useState<Record<string, Answer>>({});
    const [error, setError] = useState<string | null>(null);
    const [expandedAnswers, setExpandedAnswers] = useState<Record<string, boolean>>(() => {
        const initialState = Object.fromEntries(INVESTMENT_MEMO_QUESTIONS.map(q => [q.id, false]));
        console.log('Initial expandedAnswers state:', initialState);
        return initialState;
    });
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editedAnswer, setEditedAnswer] = useState<string>('');
    
    // New state variables for prompt management
    const [showPromptModal, setShowPromptModal] = useState(false);
    const [currentPromptId, setCurrentPromptId] = useState<string | null>(null);
    const [editedPrompt, setEditedPrompt] = useState<string>('');
    const [customPrompts, setCustomPrompts] = useState<Record<string, string>>({});

    // Reset expandedAnswers whenever answers change
    useEffect(() => {
        // When new answers arrive, ensure details remain collapsed
        setExpandedAnswers(Object.fromEntries(INVESTMENT_MEMO_QUESTIONS.map(q => [q.id, false])));
    }, [answers]);

    const logo = '/templates/unnamed.jpg'
    // Export to PDF function
    const handleExportPDF = async () => {
        console.log('exportToPDF called from button click');
        try {
            // Transform answers to match the expected format
            const transformedAnswers = Object.fromEntries(
                Object.entries(answers).map(([id, answer]) => {
                    return [id, {
                        summary: answer.summary,
                        details: answer.details,
                        isEdited: answer.isEdited
                    }];
                })
            );

            await generatePDFExport(
                INVESTMENT_MEMO_QUESTIONS,
                transformedAnswers,
                undefined, // companyName is optional
                {
                    includeTableOfContents: true,
                    includeAppendices: true,
                    language: 'en'
                },
                logo
            );
        } catch (error) {
            console.error('Error generating PDF:', error);
            setError('Failed to generate PDF. Please try again.');
        }
    }; //

    // Expose methods to parent component via ref
    useImperativeHandle(ref, () => ({
        analyzeDocuments,
        exportToPDF: handleExportPDF,
        getAnswers: () => answers
    }));

    const toggleAnswer = (id: string) => {
        console.log(`Toggle answer for ${id}: current state = ${expandedAnswers[id] || false}`);
        setExpandedAnswers(prev => {
            const newState = {
                ...prev,
                [id]: !prev[id]
            };
            console.log(`New state for ${id} = ${newState[id]}`);
            return newState;
        });
    };

    const handleEdit = (id: string) => {
        setEditingId(id);
        setEditedAnswer(answers[id]?.summary || '');
    };

    const handleSave = (id: string) => {
        if (editedAnswer.trim()) {
            const updatedAnswer = {
                summary: editedAnswer,
                details: answers[id]?.details || '',
                isEdited: true
            };
            
            setAnswers(prev => ({
                ...prev,
                [id]: updatedAnswer
            }));

            // Reset details expansion state when saving
            setExpandedAnswers(prev => ({
                ...prev,
                [id]: false
            }));
            
            // Notify parent component of the update
            if (onAnswerUpdate) {
                console.log('Response type:', typeof editedAnswer, 'Response value:', editedAnswer);
                onAnswerUpdate(id, typeof editedAnswer === 'string' ? editedAnswer : String(editedAnswer), answers[id]?.details || '');
            }
        }
        setEditingId(null);
        setEditedAnswer('');
    };

    const getPromptForQuestion = (id: string): string => {
        // Return custom prompt if available, otherwise generate the default one
        if (customPrompts[id]) {
            return customPrompts[id];
        }
        
        const questionObj = INVESTMENT_MEMO_QUESTIONS.find(q => q.id === id);
        if (!questionObj) return '';
        
        const questionDocumentMapping: Record<string, {primary: string, secondary: string}> = {
            'arr': { primary: 'excel', secondary: 'pdf' },
            'burn-rate': { primary: 'excel', secondary: 'pdf' },
            'runway': { primary: 'excel', secondary: 'pdf' },
            'problem': { primary: 'pdf', secondary: 'excel' },
            'team': { primary: 'pdf', secondary: 'excel' }
        };
        
        const docPriority = questionDocumentMapping[id] || { primary: 'both', secondary: 'both' };

        return `
            Based on ALL the available documents, please answer this question:
            ${questionObj.question}
            
            IMPORTANT: You MUST use BOTH document types in your analysis:
            ${docPriority.primary === 'pdf' ? 
                '- PRIMARY SOURCE: The PDF pitch deck is your main source for this question.\n- SECONDARY SOURCE: Also check the Excel financial data for any supporting information.' : 
                docPriority.primary === 'excel' ? 
                    '- PRIMARY SOURCE: The Excel financial data is your main source for this question.\n- SECONDARY SOURCE: Also check the PDF pitch deck for any supporting information.' :
                    '- Both document types are equally important for this question.'}
            
            For this specific question about "${questionObj.question}", you MUST:
            1. First thoroughly examine the ${docPriority.primary === 'pdf' ? 'PDF pitch deck' : 
                                            docPriority.primary === 'excel' ? 'Excel financial data' : 
                                            'PDF pitch deck AND Excel financial data'}
            2. Then examine the ${docPriority.secondary} document for supporting details
            3. Integrate information from both sources into your answer
            4. NEVER claim information is missing if you've only checked one document type

            Your answer MUST be structured in the following format:

            Summary: 
            A concise 1-2 sentence summary that directly answers the question with key facts. This will always be shown to the user.

            DETAILS:
            A more comprehensive explanation with supporting information, calculations, and specific data points from the documents. Include source references where appropriate. This section will be hidden by default and only shown when the user clicks "Show Details".
            
            Detailed instructions:
            ${questionObj.instructions}
            
            DOCUMENT USAGE REQUIREMENTS:
            1. For management team information: The PDF pitch deck will contain this information
            2. For financial metrics: The Excel data will contain this information
            3. You must check BOTH document types before concluding information is unavailable
            4. In your answer, specify what information came from which document type
            
            Format your response to be clear and readable, focusing only on answering this specific question using ALL available documents.

            Ensure there's a clear separation between the Summary and DETAILS sections.
        `;
    };

    const handleViewPrompt = (id: string) => {
        const questionObj = INVESTMENT_MEMO_QUESTIONS.find(q => q.id === id);
        if (!questionObj) return;
        
        // If we have a custom prompt, use that, otherwise use the instructions from the question
        const promptText = customPrompts[id] || questionObj.instructions;
        
        setCurrentPromptId(id);
        setEditedPrompt(promptText);
        setShowPromptModal(true);
    };

    const handleSavePrompt = () => {
        if (currentPromptId && editedPrompt.trim()) {
            setCustomPrompts(prev => ({
                ...prev,
                [currentPromptId]: editedPrompt
            }));
            setShowPromptModal(false);
        }
    };

    const analyzeDocuments = async () => {
        if (!files || files.length === 0) {
            setError('Please add some documents to analyze first!');
            return;
        }

        // Separate documents by type
        const pdfFiles = files.filter(file => 
            file.type !== 'note' && file.name.toLowerCase().endsWith('.pdf')
        );
        
        const excelFiles = files.filter(file => 
            file.type !== 'note' && (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls'))
        );

        if (pdfFiles.length === 0 && excelFiles.length === 0) {
            setError('Please upload both a pitch deck (PDF) and financial data (Excel) for a complete analysis.');
            return;
        }

        if (pdfFiles.length === 0) {
            setError('Please upload a pitch deck (PDF) for qualitative analysis.');
            return;
        }

        if (excelFiles.length === 0) {
            setError('Please upload financial data (Excel) for quantitative analysis.');
            return;
        }

        setIsAnalyzing(true);
        setError(null);

        try {
            const newAnswers: Record<string, Answer> = {};

            // Define which document types are primary for each question type
            const questionDocumentMapping: Record<string, {primary: string, secondary: string}> = {
                'arr': { primary: 'excel', secondary: 'pdf' },
                'burn-rate': { primary: 'excel', secondary: 'pdf' },
                'runway': { primary: 'excel', secondary: 'pdf' },
                'problem': { primary: 'pdf', secondary: 'excel' },
                'team': { primary: 'pdf', secondary: 'excel' }
            };

            for (const { id, question, instructions } of INVESTMENT_MEMO_QUESTIONS) {
                console.log(`Analyzing question: ${id}`);
                
                // Get document priority for this question
                const docPriority = questionDocumentMapping[id] || { primary: 'both', secondary: 'both' };
                
                // Create an enhanced prompt with specific document type priorities
                let prompt;
                if (customPrompts[id]) {
                    prompt = customPrompts[id];
                } else {
                    prompt = getPromptForQuestion(id);
                }

                try {
                    const response = await chatService.sendMessage(prompt, files);
                    
                    if (!response) {
                        throw new Error('No response received from chat service');
                    }

                    // Ensure response is a string
                    let stringResponse = '';
                    
                    // Handle different response types
                    if (typeof response === 'string') {
                        stringResponse = response;
                    } else {
                        // Try to convert to string safely
                        try {
                            if (response && typeof response === 'object') {
                                // Check if it has a text property
                                const responseObj = response as any;
                                if (responseObj.text) {
                                    stringResponse = responseObj.text;
                                } else {
                                    stringResponse = JSON.stringify(response);
                                }
                            } else {
                                stringResponse = String(response);
                            }
                        } catch (e) {
                            console.error('Error converting response to string:', e);
                            stringResponse = 'Error processing response';
                        }
                    }

                    newAnswers[id] = {
                        summary: stringResponse,
                        details: '',
                        isEdited: false
                    };
                    
                    // Update answers after each question is processed
                    setAnswers(prev => ({
                        ...prev,
                        [id]: newAnswers[id]
                    }));
                    
                    // Notify parent component of the update
                    if (onAnswerUpdate) {
                        console.log('Response type:', typeof stringResponse, 'Response value:', stringResponse);
                        onAnswerUpdate(id, stringResponse, '');
                    }
                    
                } catch (questionError) {
                    console.error(`Error on question ${id}:`, questionError);
                    const errorMsg = `Error analyzing this question: ${questionError.message || 'Please try again.'}`;
                    
                    newAnswers[id] = { 
                        summary: errorMsg,
                        details: '',
                        isEdited: false 
                    };
                    
                    // Update answers even when there's an error
                    setAnswers(prev => ({
                        ...prev,
                        [id]: newAnswers[id]
                    }));
                    
                    // Notify parent component of the error
                    if (onAnswerUpdate) {
                        onAnswerUpdate(id, errorMsg, '');
                    }
                }
            }

            // Check if all questions have been answered
            const allAnswered = INVESTMENT_MEMO_QUESTIONS.every(
                ({ id }) => newAnswers[id] && 
                    typeof newAnswers[id].summary === 'string' && 
                    newAnswers[id].summary.trim().length > 0
            );
            
            if (allAnswered && onComplete) {
                onComplete(true);
            }

        } catch (error) {
            console.error('Error analyzing documents:', error);
            setError(`Error analyzing documents: ${error.message || 'Please try again.'}`);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const regenerateAnswer = async (id: string) => {
        if (!files || files.length === 0) {
            setError('Please add some documents to analyze first!');
            return;
        }

        // Check if both document types are available
        const pdfFiles = files.filter(file => 
            file.type !== 'note' && file.name.toLowerCase().endsWith('.pdf')
        );
        
        const excelFiles = files.filter(file => 
            file.type !== 'note' && (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls'))
        );

        if (pdfFiles.length === 0 || excelFiles.length === 0) {
            setError('Both pitch deck (PDF) and financial data (Excel) are required for a complete analysis.');
            return;
        }

        const questionObj = INVESTMENT_MEMO_QUESTIONS.find(q => q.id === id);
        if (!questionObj) return;

        try {
            // Mark as regenerating
            setAnswers(prev => ({
                ...prev,
                [id]: {
                    summary: 'Regenerating...',
                    details: '',
                    isEdited: false
                }
            }));

            // Use custom prompt if available, otherwise use the default prompt
            let prompt;
            if (customPrompts[id]) {
                prompt = customPrompts[id];
            } else {
                prompt = getPromptForQuestion(id);
            }
            
            const response = await chatService.sendMessage(prompt, files);
            
            if (!response) {
                throw new Error('No response received from chat service');
            }

            // Ensure response is a string
            let stringResponse = '';
            
            // Handle different response types
            if (typeof response === 'string') {
                stringResponse = response;
            } else {
                // Try to convert to string safely
                try {
                    if (response && typeof response === 'object') {
                        // Check if it has a text property
                        const responseObj = response as any;
                        if (responseObj.text) {
                            stringResponse = responseObj.text;
                        } else {
                            stringResponse = JSON.stringify(response);
                        }
                    } else {
                        stringResponse = String(response);
                    }
                } catch (e) {
                    console.error('Error converting response to string:', e);
                    stringResponse = 'Error processing response';
                }
            }

            setAnswers(prev => ({
                ...prev,
                [id]: {
                    summary: stringResponse,
                    details: '',
                    isEdited: false
                }
            }));

            // Reset details expansion state when regenerating
            setExpandedAnswers(prev => ({
                ...prev,
                [id]: false
            }));

            // Notify parent component of the update
            if (onAnswerUpdate) {
                onAnswerUpdate(id, stringResponse, '');
            }

        } catch (error) {
            console.error('Error regenerating answer:', error);
            setError(`Error regenerating answer: ${error.message || 'Please try again.'}`);
        }
    };

    return (
        <div className="p-4 space-y-6">
            {error && (
                <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
                    {error}
                </div>
            )}
            
            {isAnalyzing ? (
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-2 text-gray-700">Analyzing documents...</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.keys(answers).length === 0 ? (
                        <div className="text-center">
                            <button 
                                onClick={analyzeDocuments}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none"
                                disabled={isAnalyzing || !files || files.length === 0}
                            >
                                Analyze Documents
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="flex justify-end space-x-4 mb-4">
                                <button
                                    onClick={analyzeDocuments}
                                    className="flex items-center px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none"
                                    disabled={isAnalyzing}
                                >
                                    <RefreshCw size={16} className="mr-2" />
                                    Refresh Analysis
                                </button>
                                <button
                                    onClick={handleExportPDF}
                                    className="flex items-center px-4 py-2 text-sm bg-gray-800 text-white rounded hover:bg-gray-900 focus:outline-none"
                                >
                                    <FileDown size={16} className="mr-2" />
                                    Export to PDF
                                </button>
                            </div>
                            
                            <div className="space-y-8">
                                {INVESTMENT_MEMO_QUESTIONS.map(({ id, question, description }) => {
                                    const answer = answers[id];
                                    
                                    if (!answer) return null;
                                    
                                    const { tldr, details } = splitAnswerContent(answer.summary);
                                    const formattedAnswer = formatNumbersInText(tldr);
                                    const formattedDetails = formatNumbersInText(details);
                                    // Make sure details are explicitly collapsed by default
                                    const isExpanded = expandedAnswers[id] === true;
                                    
                                    console.log(`Question ${id}: isExpanded = ${isExpanded}`);
                                    
                                    return (
                                        <div key={id} className="p-4 bg-white rounded-lg shadow">
                                            <div className="mb-2 flex justify-between items-start">
                                                <h3 className="text-lg font-semibold text-gray-900">{question}</h3>
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => handleViewPrompt(id)}
                                                        className="text-blue-500 hover:text-blue-700 focus:outline-none"
                                                        title="View AI Prompt"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEdit(id)}
                                                        className="text-gray-500 hover:text-blue-500 focus:outline-none"
                                                        title="Edit answer"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => regenerateAnswer(id)}
                                                        className="text-gray-500 hover:text-blue-500 focus:outline-none"
                                                        title="Regenerate answer"
                                                    >
                                                        <RefreshCw size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            <p className="text-sm text-gray-500 mb-3">{description}</p>
                                            
                                            {editingId === id ? (
                                                <div className="space-y-3">
                                                    <textarea
                                                        value={editedAnswer}
                                                        onChange={(e) => setEditedAnswer(e.target.value)}
                                                        rows={8}
                                                        className="w-full p-2 border border-gray-300 rounded"
                                                    ></textarea>
                                                    <div className="flex justify-end">
                                                        <button
                                                            onClick={() => setEditingId(null)}
                                                            className="px-3 py-1 mr-2 text-sm text-gray-700 bg-gray-200 rounded"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            onClick={() => handleSave(id)}
                                                            className="flex items-center px-3 py-1 text-sm text-white bg-blue-600 rounded"
                                                        >
                                                            <Save size={14} className="mr-1" />
                                                            Save
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div>
                                                    {/* Summary Section - Always visible */}
                                                    <div className="prose max-w-none mt-2">
                                                    <div className="text-sm font-medium text-gray-500 mb-1">Summary</div>
                                                        {typeof formattedAnswer === 'string' ? (
                                                            <ReactMarkdown>{formattedAnswer}</ReactMarkdown>
                                                        ) : (
                                                            <ReactMarkdown>{String(formattedAnswer)}</ReactMarkdown>
                                                        )}
                                                    </div>
                                                    {/* Details Section - Only show button if details exist */}
                                                    {formattedDetails && (
                                                        <div className="mt-4">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.preventDefault();  // Prevent default behavior
                                                                    e.stopPropagation(); // Prevent triggering question collapse
                                                                    console.log(`Details button clicked for ${id}`);
                                                                    toggleAnswer(id);
                                                                }}
                                                                className="text-sm text-blue-600 hover:text-blue-800 bg-blue-50 py-1 px-3 rounded-md border border-blue-100 focus:outline-none"
                                                            >
                                                                
                                                            {isExpanded ? 'Hide Details' : 'Show Details'}
                                                            </button>
                                                            {/* Only render details content when expanded */}
                                                            {isExpanded && (
                                                                <div className="mt-3 pt-3 border-t border-gray-200">
                                                                <div className="text-sm font-medium text-gray-500 mb-2">Details</div>
                                                                <div className="prose max-w-none text-sm">
                                                                    {typeof formattedDetails === 'string' ? (
                                                                        <ReactMarkdown>{formattedDetails}</ReactMarkdown>
                                                                    ) : (
                                                                        <ReactMarkdown>{String(formattedDetails)}</ReactMarkdown>
                                                                    )}
                                                                </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            
                                            {answer.isEdited && (
                                                <div className="mt-2 text-xs text-gray-500 italic">
                                                    Edited manually
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Prompt Modal */}
            {showPromptModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-3/4 max-w-3xl max-h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h3 className="text-lg font-semibold">AI Prompt</h3>
                                {currentPromptId && (
                                    <p className="text-sm text-gray-600">
                                        {INVESTMENT_MEMO_QUESTIONS.find(q => q.id === currentPromptId)?.question || ''}
                                    </p>
                                )}
                            </div>
                            <button 
                                onClick={() => setShowPromptModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="mb-4 flex-grow overflow-auto">
                            {editingId === currentPromptId ? (
                                <textarea
                                    value={editedPrompt}
                                    onChange={(e) => setEditedPrompt(e.target.value)}
                                    className="w-full h-full min-h-[300px] p-3 border border-gray-300 rounded font-mono text-sm"
                                ></textarea>
                            ) : (
                                <div className="border border-gray-300 rounded p-3 h-full min-h-[300px] overflow-auto whitespace-pre-wrap font-mono text-sm">
                                    {editedPrompt}
                                </div>
                            )}
                        </div>
                        
                        <div className="flex justify-between space-x-3">
                            <button
                                onClick={() => setEditingId(currentPromptId === editingId ? null : currentPromptId)}
                                className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
                            >
                                {currentPromptId === editingId ? "Preview" : "Edit"}
                            </button>
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setShowPromptModal(false)}
                                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSavePrompt}
                                    className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

export default InvestmentMemo;