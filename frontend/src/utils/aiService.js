import { DEFAULT_AI_RESPONSE } from './constants';

export const fetchAIAnalysis = async (selectedAsset, setAiAnalysis, setIsLoadingAI, setApiError) => {
  if (!selectedAsset) return;
  setIsLoadingAI(true);
  setApiError(null);
  setAiAnalysis(DEFAULT_AI_RESPONSE);

  const assetName = selectedAsset.name || selectedAsset.symbol;
  const systemPrompt = `You are a world-class financial risk analyst and trading desk advisor. Provide a concise analysis focused on trading venue suggestions, a summary of recent market-moving news, and a quantitative risk assessment (e.g., volatility outlook) for the asset provided. Respond in three distinct paragraphs labeled 'Trading Venue:', 'Market News:', and 'Risk Assessment:'. DO NOT include any introductory or concluding remarks outside of the three paragraphs.`;
  const userQuery = `Analyze the market outlook for ${assetName}.`;

  // NOTE: put your API key in apiKey or switch to your preferred provider
  const apiKey = ""; // <-- ADD YOUR KEY
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{ parts: [{ text: userQuery }] }],
    tools: [{ "google_search": {} }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
  };

  let maxRetries = 3;
  let delay = 1000;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const result = await response.json();
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

      if (text) {
        const sections = text.split(/\n\n/);
        let parsedAnalysis = { ...DEFAULT_AI_RESPONSE };
        sections.forEach(section => {
          if (section.startsWith('Trading Venue:')) parsedAnalysis.tradingVenue = section.replace('Trading Venue:', '').trim();
          else if (section.startsWith('Market News:')) parsedAnalysis.marketNews = section.replace('Market News:', '').trim();
          else if (section.startsWith('Risk Assessment:')) parsedAnalysis.riskAssessment = section.replace('Risk Assessment:', '').trim();
        });
        setAiAnalysis(parsedAnalysis);
        break;
      } else {
        throw new Error("Invalid response structure from Gemini API.");
      }
    } catch (error) {
      console.error(`Attempt ${i + 1} failed.`, error);
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
      } else {
        setApiError(`Failed to fetch AI analysis after ${maxRetries} attempts.`);
      }
    }
  }

  setIsLoadingAI(false);
};
