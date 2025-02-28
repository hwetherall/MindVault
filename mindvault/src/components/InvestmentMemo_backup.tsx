import React, { useState } from 'react';
import { chatService } from '../services/chatService';
import { ChevronDown, ChevronUp, Edit2, Save, RefreshCw, FileDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import jsPDF from 'jspdf';

// Utility function to format numbers to 2 decimal places maximum
const formatNumbersInText = (text: string): string => {
  if (!text) return '';

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
const splitAnswerContent = (content: string) => {
  if (!content) return { tldr: '', details: '' };
  
  const parts = content.split('DETAILS:');
  
  if (parts.length === 1) {
    // Clean up asterisks in content if no DETAILS section
    let cleanContent = parts[0].trim();
    cleanContent = cleanContent.replace('TL;DR:', '').trim();
    
    // Remove markdown bold/italic formatting
    cleanContent = cleanContent.replace(/\*\*(.*?)\*\*/g, '$1'); // Bold
    cleanContent = cleanContent.replace(/\*(.*?)\*/g, '$1');     // Italic
    cleanContent = cleanContent.replace(/\*+/g, '');             // Any remaining asterisks
    
    return { tldr: cleanContent, details: '' };
  }
  
  // Clean up TL;DR part
  let tldr = parts[0].replace('TL;DR:', '').trim();
  
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
}

interface Answer {
    content: string;
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

export const InvestmentMemo: React.FC<InvestmentMemoProps> = ({ files, onComplete }) => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [answers, setAnswers] = useState<Record<string, Answer>>({});
    const [error, setError] = useState<string | null>(null);
    const [expandedAnswers, setExpandedAnswers] = useState<Record<string, boolean>>({});
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editedAnswer, setEditedAnswer] = useState<string>('');

    const toggleAnswer = (id: string) => {
        setExpandedAnswers(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const handleEdit = (id: string) => {
        setEditingId(id);
        setEditedAnswer(answers[id]?.content || '');
    };

    const handleSave = (id: string) => {
        if (editedAnswer.trim()) {
            setAnswers(prev => ({
                ...prev,
                [id]: {
                    content: editedAnswer,
                    isEdited: true
                }
            }));
        }
        setEditingId(null);
        setEditedAnswer('');
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
                const prompt = `
                    Based on ALL the available documents, please answer this question:
                    ${question}
                    
                    IMPORTANT: You MUST use BOTH document types in your analysis:
                    ${docPriority.primary === 'pdf' ? 
                        '- PRIMARY SOURCE: The PDF pitch deck is your main source for this question.\n- SECONDARY SOURCE: Also check the Excel financial data for any supporting information.' : 
                        docPriority.primary === 'excel' ? 
                            '- PRIMARY SOURCE: The Excel financial data is your main source for this question.\n- SECONDARY SOURCE: Also check the PDF pitch deck for any supporting information.' :
                            '- Both document types are equally important for this question.'}
                    
                    For this specific question about "${question}", you MUST:
                    1. First thoroughly examine the ${docPriority.primary === 'pdf' ? 'PDF pitch deck' : 
                                                    docPriority.primary === 'excel' ? 'Excel financial data' : 
                                                    'PDF pitch deck AND Excel financial data'}
                    2. Then examine the ${docPriority.secondary} document for supporting details
                    3. Integrate information from both sources into your answer
                    4. NEVER claim information is missing if you've only checked one document type
                    
                    Detailed instructions:
                    ${instructions}
                    
                    DOCUMENT USAGE REQUIREMENTS:
                    1. For management team information: The PDF pitch deck will contain this information
                    2. For financial metrics: The Excel data will contain this information
                    3. You must check BOTH document types before concluding information is unavailable
                    4. In your answer, specify what information came from which document type
                    
                    Format your response to be clear and readable, focusing only on answering this specific question using ALL available documents.
                `;

                try {
                    const response = await chatService.sendMessage(prompt, files);
                    
                    if (!response) {
                        throw new Error('No response received from chat service');
                    }

                    newAnswers[id] = {
                        content: response,
                        isEdited: false
                    };
                    
                    // Update answers after each question is processed
                    setAnswers(prev => ({
                        ...prev,
                        [id]: newAnswers[id]
                    }));
                    
                } catch (questionError) {
                    console.error(`Error on question ${id}:`, questionError);
                    newAnswers[id] = { 
                        content: `Error analyzing this question: ${questionError.message || 'Please try again.'}`,
                        isEdited: false 
                    };
                    
                    // Update answers even when there's an error
                    setAnswers(prev => ({
                        ...prev,
                        [id]: newAnswers[id]
                    }));
                }
            }

            // Check if all questions have been answered
            const allAnswered = INVESTMENT_MEMO_QUESTIONS.every(
                ({ id }) => newAnswers[id] && newAnswers[id].content.trim().length > 0
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
                    content: 'Regenerating...',
                    isEdited: false
                }
            }));

            // Define document priority for this question
            const questionDocumentMapping: Record<string, {primary: string, secondary: string}> = {
                'arr': { primary: 'excel', secondary: 'pdf' },
                'burn-rate': { primary: 'excel', secondary: 'pdf' },
                'runway': { primary: 'excel', secondary: 'pdf' },
                'problem': { primary: 'pdf', secondary: 'excel' },
                'team': { primary: 'pdf', secondary: 'excel' }
            };
            
            const docPriority = questionDocumentMapping[id] || { primary: 'both', secondary: 'both' };

            const prompt = `
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
                
                Detailed instructions:
                ${questionObj.instructions}
                
                DOCUMENT USAGE REQUIREMENTS:
                1. For management team information: The PDF pitch deck will contain this information
                2. For financial metrics: The Excel data will contain this information
                3. You must check BOTH document types before concluding information is unavailable
                4. In your answer, specify what information came from which document type
                
                Format your response to be clear and readable, focusing only on answering this specific question using ALL available documents.
            `;

            const response = await chatService.sendMessage(prompt, files);
            
            if (!response) {
                throw new Error('No response received from chat service');
            }

            setAnswers(prev => ({
                ...prev,
                [id]: {
                    content: response,
                    isEdited: false
                }
            }));

        } catch (error) {
            console.error(`Error regenerating answer ${id}:`, error);
            setAnswers(prev => ({
                ...prev,
                [id]: { 
                    content: `Error regenerating this answer: ${error.message || 'Please try again.'}`,
                    isEdited: false
                }
            }));
        }
    };

    const exportToPDF = () => {
        // Check if we have any answers
        const hasAnswers = Object.keys(answers).length > 0;
        if (!hasAnswers) {
            alert('Please generate the Investment Memo first before exporting to PDF.');
            return;
        }

        try {
            const doc = new jsPDF();
            
            // Title
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text('Investment Memo', 105, 20, { align: 'center' });
            doc.setFont('helvetica', 'normal');
            
            let yPosition = 40;
            const pageWidth = doc.internal.pageSize.width - 40; // 20mm margins on each side
            
            // Add each question and answer
            doc.setFontSize(12);
            
            INVESTMENT_MEMO_QUESTIONS.forEach(({ id, question }, index) => {
                if (answers[id]) {
                    // Check if we need to add a new page
                    if (yPosition > 250) {
                        doc.addPage();
                        yPosition = 20;
                    }
                    
                    // Add question
                    doc.setFont('helvetica', 'bold');
                    doc.text(question, 20, yPosition);
                    yPosition += 10;
                    
                    // Add answer
                    doc.setFont('helvetica', 'normal');
                    const lines = doc.splitTextToSize(answers[id].content, pageWidth);
                    doc.text(lines, 20, yPosition);
                    yPosition += lines.length * 7 + 20; // Add space after answer
                }
            });
            
            // Save the PDF
            doc.save('investment-memo.pdf');
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to export PDF. Please try again.');
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-[#1A1F2E] border-b-2 border-[#E20074] pb-2">
                    Investment Memo
                </h2>
                <div className="flex gap-2">
                    <button
                        onClick={analyzeDocuments}
                        disabled={isAnalyzing}
                        className={`flex items-center gap-1 px-4 py-1.5 rounded text-white font-medium transition-colors ${
                            isAnalyzing ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#1A1F2E] hover:bg-[#323A4F]'
                        }`}
                    >
                        {isAnalyzing ? 'Analyzing...' : 'Generate Investment Memo'}
                    </button>
                    <button 
                        onClick={exportToPDF}
                        className="flex items-center gap-1 px-3 py-1.5 text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                        title="Export to PDF"
                    >
                        <FileDown size={16} />
                        Export PDF
                    </button>
                </div>
            </div>
            
            <div className="mb-6 text-gray-600">
                This analysis will evaluate key financial metrics, business model, and team composition to determine investment potential.
            </div>
            
            {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                    {error}
                </div>
            )}
            
            <div className="space-y-4 flex-1 overflow-y-auto">
                {INVESTMENT_MEMO_QUESTIONS.map(({ id, question, description }) => (
                    <div key={id} className="border rounded-lg overflow-hidden">
                        <div 
                            className="flex justify-between items-center p-3 bg-gray-50 cursor-pointer"
                            onClick={() => toggleAnswer(id)}
                        >
                            <div>
                                <h3 className="font-medium text-[#1A1F2E]">{question}</h3>
                                <p className="text-sm text-gray-500">{description}</p>
                            </div>
                            <button className="text-gray-400 hover:text-[#1A1F2E]">
                                {expandedAnswers[id] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </button>
                        </div>
                        
                        {expandedAnswers[id] && (
                            <div className="p-4 bg-white border-t">
                                {editingId === id ? (
                                    <div className="space-y-3">
                                        <textarea 
                                            className="w-full h-48 p-3 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            value={editedAnswer}
                                            onChange={(e) => setEditedAnswer(e.target.value)}
                                        />
                                        <div className="flex justify-end">
                                            <button 
                                                className="flex items-center gap-1 px-3 py-1.5 bg-[#1A1F2E] text-white rounded hover:bg-[#323A4F] transition-colors"
                                                onClick={() => handleSave(id)}
                                            >
                                                <Save size={16} />
                                                Save Changes
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="prose max-w-none mb-3">
                                            {answers[id] ? (
                                                <ReactMarkdown
                                                    components={{
                                                        p: ({node, ...props}) => <p className="text-gray-700 mb-2" {...props} />,
                                                        h1: ({node, ...props}) => <h1 className="text-[#1A1F2E] text-xl font-bold mb-3" {...props} />,
                                                        h2: ({node, ...props}) => <h2 className="text-[#1A1F2E] text-lg font-bold mb-2" {...props} />,
                                                        h3: ({node, ...props}) => <h3 className="text-[#1A1F2E] text-base font-bold mb-2" {...props} />,
                                                        ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-3" {...props} />,
                                                        ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-3" {...props} />,
                                                        li: ({node, ...props}) => <li className="mb-1" {...props} />
                                                    }}
                                                >
                                                    {formatNumbersInText(splitAnswerContent(answers[id].content).tldr)}
                                                </ReactMarkdown>
                                            ) : (
                                                <div className="text-gray-400 italic">
                                                    Click "Generate Investment Memo" to analyze documents
                                                </div>
                                            )}
                                        </div>
                                        
                                        {splitAnswerContent(answers[id].content).details && (
                                            <div className="mt-4 pt-4 border-t border-gray-200">
                                                <h4 className="text-sm font-semibold text-gray-600 mb-2">Detailed Analysis:</h4>
                                                <ReactMarkdown
                                                    components={{
                                                        p: ({node, ...props}) => <p className="text-gray-700 mb-2" {...props} />,
                                                        h1: ({node, ...props}) => <h1 className="text-[#1A1F2E] text-xl font-bold mb-3" {...props} />,
                                                        h2: ({node, ...props}) => <h2 className="text-[#1A1F2E] text-lg font-bold mb-2" {...props} />,
                                                        h3: ({node, ...props}) => <h3 className="text-[#1A1F2E] text-base font-bold mb-2" {...props} />,
                                                        ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-3" {...props} />,
                                                        ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-3" {...props} />,
                                                        li: ({node, ...props}) => <li className="mb-1" {...props} />
                                                    }}
                                                >
                                                    {formatNumbersInText(splitAnswerContent(answers[id].content).details)}
                                                </ReactMarkdown>
                                            </div>
                                        )}
                                        
                                        {answers[id] && (
                                            <div className="flex justify-end gap-2 mt-2">
                                                <button 
                                                    className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                                                    onClick={() => regenerateAnswer(id)}
                                                    title="Regenerate answer"
                                                >
                                                    <RefreshCw size={14} />
                                                    Regenerate
                                                </button>
                                                <button 
                                                    className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                                                    onClick={() => handleEdit(id)}
                                                    title="Edit answer manually"
                                                >
                                                    <Edit2 size={14} />
                                                    Edit
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}; 