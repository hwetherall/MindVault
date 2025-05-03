import React from 'react';

interface BenchmarkComparisonRendererProps {
  content: string;
}

interface SectionData {
  go1: string[];
  competitor: string[];
}

type Sections = Record<string, SectionData>;

const BenchmarkComparisonRenderer: React.FC<BenchmarkComparisonRendererProps> = ({ content }) => {
  if (!content) return null;
  
  // Check if this content includes benchmark comparison
  if (!content.includes('## Benchmark Comparison')) return null;
  
  // Extract the benchmark comparison section
  const benchmarkMatch = content.match(/## Benchmark Comparison\n([\s\S]*?)(?=\n##|$)/);
  if (!benchmarkMatch || !benchmarkMatch[1]) return null;
  
  const benchmarkContent = benchmarkMatch[1].trim();
  
  // Process the text to convert markdown to styled content
  const processText = (text: string) => {
    // Replace **bold** with styled spans
    let processedText = text.replace(/\*\*(.*?)\*\*/g, '<span class="font-bold text-purple-800">$1</span>');
    
    // Replace __underline__ with styled spans
    processedText = processedText.replace(/__(.*?)__/g, '<span class="underline decoration-purple-500 decoration-2">$1</span>');
    
    // Replace *italic* with styled spans
    processedText = processedText.replace(/\*(.*?)\*/g, '<span class="italic text-purple-700">$1</span>');
    
    // Replace `code` with styled spans
    processedText = processedText.replace(/`(.*?)`/g, '<span class="bg-gray-100 text-purple-800 px-1 py-0.5 rounded font-mono text-sm">$1</span>');
    
    // Create links
    processedText = processedText.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-blue-600 underline hover:text-blue-800" target="_blank">$1</a>');
    
    return processedText;
  };
  
  // More robust parsing of sections
  // Extract all heading names from the content
  const headings = benchmarkContent.match(/### ([^\n]+)/g)?.map(h => h.replace('### ', '')) || [];
  
  // Find Go1 and competitor name (typically Stop2)
  const competitors: string[] = [];
  const go1Regex = /Go1:/;
  const competitorRegex = /([^G][^o][^1][^:]+):/;
  
  if (benchmarkContent.match(go1Regex)) {
    competitors.push('Go1');
  }
  
  const competitorMatch = benchmarkContent.match(competitorRegex);
  if (competitorMatch && competitorMatch[1]) {
    competitors.push(competitorMatch[1].trim());
  } else {
    competitors.push('Stop2'); // Fallback to Stop2 if no competitor name found
  }
  
  // Function to extract metrics for a specific section and company
  const extractMetrics = (section: string, company: string): string[] => {
    const sectionRegex = new RegExp(`### ${section}\\s*[\\s\\S]*?\\*\\*${company}:\\*\\*\\s*([\\s\\S]*?)(?=\\*\\*|###|$)`, 'i');
    const match = benchmarkContent.match(sectionRegex);
    
    if (match && match[1]) {
      const metrics = match[1].trim().split('\n').map(line => {
        if (line.trim().startsWith('-')) {
          return line.trim().substring(1).trim();
        }
        return line.trim();
      }).filter(line => line.length > 0);
      
      return metrics;
    }
    
    // Alternative parsing if structured format wasn't followed
    // Look for bullet points with company name
    const companyBulletRegex = new RegExp(`${company}[^\\n]*?([^:]*?):\\s*([^\\n]*)`, 'g');
    const matchesArray = Array.from(benchmarkContent.matchAll(companyBulletRegex));
    
    if (matchesArray.length > 0) {
      return matchesArray.map(m => `${m[1].trim()}: ${m[2].trim()}`);
    }
    
    return ['No data available'];
  };
  
  // Extract data for each section and company
  const sections: Sections = {};
  headings.forEach(heading => {
    sections[heading] = {
      go1: extractMetrics(heading, 'Go1'),
      competitor: extractMetrics(heading, competitors[1] || 'Stop2')
    };
  });
  
  // If no structured sections found, try to extract bullet points directly
  const fallbackParsing = (): Sections => {
    const go1Points: string[] = [];
    const competitorPoints: string[] = [];
    
    // Extract bullet points following Go1:
    const go1Section = benchmarkContent.match(/Go1:\s*([\s\S]*?)(?=\s*Stop2:|$)/i);
    if (go1Section && go1Section[1]) {
      go1Points.push(...go1Section[1].split('\n')
        .filter(line => line.trim().startsWith('-') || line.trim().startsWith('•'))
        .map(line => line.replace(/^[-•]\s*/, '').trim()));
    }
    
    // Extract bullet points following Stop2:
    const competitorSection = benchmarkContent.match(/Stop2:\s*([\s\S]*?)(?=\s*Go1:|$)/i);
    if (competitorSection && competitorSection[1]) {
      competitorPoints.push(...competitorSection[1].split('\n')
        .filter(line => line.trim().startsWith('-') || line.trim().startsWith('•'))
        .map(line => line.replace(/^[-•]\s*/, '').trim()));
    }
    
    return {
      Financial: {
        go1: go1Points,
        competitor: competitorPoints
      }
    };
  };
  
  // If no sections were found or they're empty, fall back to direct extraction
  if (Object.keys(sections).length === 0 || 
      Object.values(sections).every(section => 
        section.go1.length === 0 && section.competitor.length === 0)) {
    Object.assign(sections, fallbackParsing());
  }
  
  // Extract conclusion
  const conclusionMatch = benchmarkContent.match(/(?:### Overall Comparison(?:\s*Conclusion)?|Conclusion)([^#]*?)(?=###|$)/i);
  const conclusion = conclusionMatch ? conclusionMatch[1].trim() : null;
  
  return (
    <div className="mt-6 mb-8 border-2 border-blue-200 rounded-lg overflow-hidden bg-gradient-to-r from-blue-50/30 to-purple-50/30">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
        <h2 className="text-xl font-semibold text-white">Benchmark Comparison</h2>
      </div>
      
      <div className="p-6 space-y-6">
        {Object.entries(sections).map(([sectionName, sectionData], idx) => (
          <div key={idx} className="bg-white rounded-lg shadow-sm border border-blue-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-100 to-blue-50 px-4 py-2">
              <h3 className="font-medium text-blue-800">{sectionName}</h3>
            </div>
            
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Go1 column */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center mb-2">
                    <span className="bg-blue-600 w-3 h-3 rounded-full mr-2"></span>
                    <h4 className="font-semibold text-blue-800">Go1</h4>
                  </div>
                  <div className="space-y-1">
                    {sectionData.go1.map((metric, i) => (
                      <div key={i} className="flex items-start">
                        <span className="text-blue-500 mt-1 mr-2">•</span>
                        <div 
                          className="flex-1 text-sm text-blue-900" 
                          dangerouslySetInnerHTML={{ __html: processText(metric) }}
                        />
                      </div>
                    ))}
                    {sectionData.go1.length === 0 && (
                      <p className="text-sm text-gray-500 italic">No data available</p>
                    )}
                  </div>
                </div>
                
                {/* Competitor column */}
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="flex items-center mb-2">
                    <span className="bg-purple-600 w-3 h-3 rounded-full mr-2"></span>
                    <h4 className="font-semibold text-purple-800">
                      {competitors[1] || 'Stop2'}
                    </h4>
                  </div>
                  <div className="space-y-1">
                    {sectionData.competitor.map((metric, i) => (
                      <div key={i} className="flex items-start">
                        <span className="text-purple-500 mt-1 mr-2">•</span>
                        <div 
                          className="flex-1 text-sm text-purple-900" 
                          dangerouslySetInnerHTML={{ __html: processText(metric) }}
                        />
                      </div>
                    ))}
                    {sectionData.competitor.length === 0 && (
                      <p className="text-sm text-gray-500 italic">No data available</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {/* Conclusion section */}
        {conclusion && (
          <div className="bg-gradient-to-r from-blue-100 to-purple-100 p-4 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">Overall Comparison</h3>
            <div className="prose prose-sm">
              {conclusion.split('\n').filter(line => line.trim()).map((line, idx) => (
                <p 
                  key={idx} 
                  className="text-sm text-gray-800 mb-2" 
                  dangerouslySetInnerHTML={{ __html: processText(line) }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BenchmarkComparisonRenderer; 