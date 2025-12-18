import React, { useState, useRef, useEffect } from "react";
import { ArrowUp, Mic, Square, Loader2, Volume2, Paperclip, FileText, X, Minimize2 } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { salesforceService, ParsedInvoiceData } from '../services/salesforce';
import { aiService } from '../services/ai';

// --- Types ---

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// --- Audio Helper Functions ---

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        const base64 = reader.result.split(",")[1];
        resolve(base64);
      } else {
        reject(new Error("Failed to convert blob to base64"));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function decodeAudioData(
  base64: string,
  ctx: AudioContext
): Promise<AudioBuffer> {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return ctx.decodeAudioData(bytes.buffer);
}

// --- Component ---

export const ChatInterface: React.FC = () => {
  // Chat mode state
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showQuickQuestions, setShowQuickQuestions] = useState(false);
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
  const [suggestUpload, setSuggestUpload] = useState(false);
  const [quoteDetails, setQuoteDetails] = useState<{ consumption: number; price: number } | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const chatMessagesRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatMessagesRef.current && isFullScreen) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatHistory, isFullScreen]);

  // Close quick questions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowQuickQuestions(false);
      }
    };

    if (showQuickQuestions) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showQuickQuestions]);



  const SITE_CONTEXT = `
    You are Oxygen AI, the intelligent energy specialist for Oxygen Commercial Energy.
    
    Website Context (from this portal):
    - Mission: Powering Business with Smart Energy. Secure, sustainable, and cost-effective supply for enterprises.
    - Features: 100% Renewable Electricity, Green Gas, Flexible Purchasing Contracts, Multi-Site Billing.
    - Services: Corporate PPAs, Energy Trading, Carbon Reporting, Bill Analytics.
    - Value Prop: We help businesses reduce energy costs and meet sustainability targets with smarter supply contracts.
    
    IMPORTANT: You are a "B2B Energy Consultant". 
    - Always emphasize cost savings, sustainability (green energy), and ease of switching.
    - If a user asks about rates, ask them to upload an invoice for a bespoke quote.
    - Your goal is to convert visitors into customers by highlighting our competitive £80/MWh benchmark rate and green credentials.
    
    Keep answers under 50 words unless asked for more detail. Professional, helpful, and commercially focused.
  `;

  const quickQuestions = [
    "Upload your latest invoice",
    "What are your current electricity rates?",
    "Can you consolidate my multi-site bill?",
    "Do you offer 100% renewable energy?",
    "How do I switch my gas supply?"
  ];

  const handleQuickQuestion = (question: string) => {
    setShowQuickQuestions(false);
    setFollowUpQuestions([]);
    
    // Check if the question is "Upload your latest invoice"
    if (question.toLowerCase().includes('upload') && question.toLowerCase().includes('invoice')) {
      // Trigger file upload dialog
      fileInputRef.current?.click();
      return;
    }
    
    // Auto-submit the question
    setTimeout(() => {
      handleSend(question);
      setInputValue(""); // Clear input after sending
    }, 100);
  };

  const generateFollowUpQuestions = async (originalQuestion: string, answer: string) => {
    try {
      const prompt = `Based on this question and answer about energy operations, generate exactly 4 short, succinct follow-up questions (max 6-8 words each). Make them concise, specific, and actionable.

Original Question: "${originalQuestion}"
Answer: "${answer}"

Return only the 4 questions, one per line, without numbering or bullets. Keep each question brief and to the point.`;

      const result = await aiService.generateContent({
        model: "gemini-2.5-flash",
        prompt: prompt
      });

      const questionsText = result.text || "";
      const questions = questionsText
        .split('\n')
        .map(q => q.trim())
        .filter(q => q.length > 0 && !q.match(/^\d+[\.\)]/))
        .map(q => {
          // Remove question marks and trim further
          q = q.replace(/^\?+\s*/, '').trim();
          // Ensure it's not too long (max 60 chars)
          if (q.length > 60) {
            q = q.substring(0, 57) + '...';
          }
          return q;
        })
        .slice(0, 4);

      if (questions.length > 0) {
        setFollowUpQuestions(questions);
      } else {
        // Fallback questions if generation fails
        setFollowUpQuestions([
          "Tell me more",
          "Integration options?",
          "Implementation steps?",
          "Benefits for my org?"
        ]);
      }
    } catch (error) {
      console.error("Error generating follow-up questions:", error);
      // Fallback questions on error
      setFollowUpQuestions([
        "Tell me more",
        "Integration options?",
        "Implementation steps?",
        "Benefits for my org?"
      ]);
    }
  };

  const processInvoiceForQuote = async (file: File) => {
    
    // Add user message about uploading invoice
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: `Uploaded invoice: ${file.name}`,
      timestamp: new Date()
    };
    setChatHistory(prev => [...prev, userMessage]);
    
    // Switch to full-screen mode
    setIsFullScreen(true);
    
    setIsLoading(true);
    setResponse("Analyzing invoice and creating Salesforce records...");

    try {
        // Convert file to base64
        const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve((reader.result as string).split(',')[1]);
            reader.onerror = error => reject(error);
        });

        const prompt = `
        Analyze this invoice image and extract the following data in strict JSON format:
        {
          "companyName": "string (The CUSTOMER name, usually under 'Customer Details' or 'Bill To'. Do NOT use the supplier logo/name at the top)",
          "companyNumber": "string (if found, otherwise empty)",
          "accountNumber": "string",
          "invoiceNumber": "string",
          "invoiceDate": "YYYY-MM-DD",
          "totalAmount": number,
          "totalAmount": number,
          "totalConsumption": number (total energy consumption for THIS BILL PERIOD in MWh),
          "annualConsumption": number (Yearly Total or YTD consumption in MWh. Search for 'Yearly Total', 'Annual Consumption', or 'YTD'),
          "contactFirstName": "string (contact person first name if found)",
          "contactLastName": "string (contact person last name if found)",
          "contactEmail": "string (contact email if found)",
          "contactPhone": "string (contact phone if found)",
          "sites": [
            {
              "name": "string",
              "address": "string",
              "meterPoints": [
                { "mpan": "string", "meterNumber": "string" }
              ]
            }
          ]
        }
        }
        }
        IMPORTANT: 
        1. **COMPANY NAME EXTRACTION IS CRITICAL**:
           - Look for a box labeled "Customer Details" or "Account Details".
           - The Company Name is the FIRST line inside that box.
           - Example: If "Customer Details" contains "CX Team", then "CX Team" is the company name.
           - **NEGATIVE CONSTRAINT**: Do NOT look at the footer or small print. "Megs Manufacturing Ltd" is likely the billing agent or footer text - IGNORE IT unless it is in the "Customer Details" box.
           - **NEGATIVE CONSTRAINT**: Do NOT use the Energy Supplier name (e.g. Good Energy, British Gas).
        
        2. For "totalConsumption", extract the total energy consumption for THIS BILL PERIOD in MWh.
        3. For "annualConsumption", extract the Yearly Total or YTD consumption in MWh. Search for 'Yearly Total', 'Annual Consumption', or 'YTD'.
        ensure valid JSON.
      `;

      const result = await aiService.generateContent({
        model: "gemini-2.5-flash",
        prompt: prompt,
        image: {
            mimeType: file.type,
            data: base64
        }
      });

      const text = result.text || "";
      const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const data: ParsedInvoiceData = JSON.parse(jsonStr);

      // Add missing file data for upload
      data.fileContent = base64;
      data.fileName = file.name;

       // Use annual consumption if available, else annualized monthly
       const annualConsumption = data.annualConsumption || (data.totalConsumption ? data.totalConsumption * 12 : 0);
       
       // Calculate current rate from the bill: Total Amount / Total Consumption
       const currentRate = (data.totalAmount && data.totalConsumption) ? (data.totalAmount / data.totalConsumption) : 0;
       
       // Our rate is £80/MWh
       const ourRate = 80;
       
       // Calculate costs and savings based on ANNUAL consumption
       const estimatedCostWithUs = annualConsumption * ourRate;
       const estimatedCurrentCost = annualConsumption * currentRate;
       const savings = estimatedCurrentCost - estimatedCostWithUs;
       
       const consumptionDisplay = annualConsumption > 0 ? annualConsumption : (data.totalConsumption || 0);

       setQuoteDetails({ consumption: consumptionDisplay, price: estimatedCostWithUs });

       // Save to Salesforce
       const salesforceResult = await salesforceService.createRecordsFromInvoice(data);
       const records = salesforceResult.records;
       const instanceUrl = records?.instanceUrl || 'https://gentrack-4-dev-ed.develop.lightning.force.com';

       const responseMsg = `Detailed Analysis for **${data.companyName}**:\n\n` +
        `Based on your annual consumption of **${consumptionDisplay.toLocaleString()} MWh**, your estimated cost with our specific rate is **£${estimatedCostWithUs.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}** (at £80/MWh).\n\n` +
        `📉 **Potential Savings:**\n` +
        `Compared to your current rate of ~£${currentRate.toFixed(0)}/MWh, you could save approximately **£${savings.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} per year** by switching!\n\n` +
        `Would you like me to generate a formal PDF quote and email it to you?\n\n` +
        `---\n` +
        `**Salesforce Records Created:**\n` +
        (records?.accountId ? `- [View Account](${instanceUrl}/lightning/r/Account/${records.accountId}/view)\n` : '') +
        (records?.contactId ? `- [View Contact](${instanceUrl}/lightning/r/Contact/${records.contactId}/view)\n` : '') +
        (records?.opportunityId ? `- [View Opportunity](${instanceUrl}/lightning/r/Opportunity/${records.opportunityId}/view)\n` : '') +
        (records?.contentDocumentId ? `- [View Bill File](${instanceUrl}/lightning/r/ContentDocument/${records.contentDocumentId}/view)\n` : '');
      
      // Add assistant message to chat history
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseMsg,
        timestamp: new Date()
      };
      setChatHistory(prev => [...prev, assistantMessage]);
      
      setResponse(responseMsg);
      setIsLoading(false);
      await speakResponse(`I've analyzed your invoice and created the Salesforce records. Your estimated annual price is £${estimatedCostWithUs.toLocaleString()}.`);

    } catch (error) {
        console.error("Error processing invoice:", error);
        const errorMsg = `**❌ Error Processing Invoice**\n\n${error instanceof Error ? error.message : 'Unknown error occurred'}\n\nPlease ensure:\n• The invoice is a clear image or PDF\n• Your Salesforce credentials are configured correctly\n• You have the necessary permissions in Salesforce`;
        
        // Add error message to chat history
        const errorAssistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: errorMsg,
          timestamp: new Date()
        };
        setChatHistory(prev => [...prev, errorAssistantMessage]);
        
        setResponse(errorMsg);
    } finally {
        setIsLoading(false);
        setSuggestUpload(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        processInvoiceForQuote(e.target.files[0]);
    }
  };

  const handleSend = async (customQuestion?: string) => {
    const questionToSend = customQuestion || inputValue;
    if (!questionToSend.trim()) return;

    // Clear input immediately
    setInputValue("");

    // Check for quote intent
    if (questionToSend.toLowerCase().includes('quote') || questionToSend.toLowerCase().includes('price')) {
        setResponse("I can help with that. Please upload your energy invoice, and I'll calculate a quote for you.");
        setSuggestUpload(true);
        setShowQuickQuestions(false);
        return;
    }

    // Add user message to chat history
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: questionToSend,
      timestamp: new Date()
    };
    
    setChatHistory(prev => [...prev, userMessage]);
    
    // Always trigger full-screen mode when sending a message
    // (whether it's the first message or continuing after minimize)
    setIsFullScreen(true);

    setIsLoading(true);
    setResponse(null);
    setFollowUpQuestions([]);
    const userPrompt = questionToSend;
    setShowQuickQuestions(false);

    try {
      // 1. Generate Text Response
      const result = await aiService.generateContent({
        model: "gemini-2.5-flash",
        systemInstruction: SITE_CONTEXT,
        prompt: userPrompt
      });

      const textResponse = result.text || "I couldn't generate a response.";
      
      // Add assistant message to chat history
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: textResponse,
        timestamp: new Date()
      };
      
      setChatHistory(prev => [...prev, assistantMessage]);
      setResponse(textResponse);
      setIsLoading(false);

      // 2. Generate Follow-up Questions
      await generateFollowUpQuestions(userPrompt, textResponse);

      // 3. Generate Audio Response (TTS)
      await speakResponse(textResponse);
    } catch (error) {
      console.error("Error generating content:", error);
      const errorMessage = "Sorry, I encountered an error processing your request.";
      
      const errorAssistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorMessage,
        timestamp: new Date()
      };
      
      setChatHistory(prev => [...prev, errorAssistantMessage]);
      setResponse(errorMessage);
      setIsLoading(false);
    }
  };

  const speakResponse = async (text: string) => {
    try {
      setIsPlaying(true);
      const ttsResult = await aiService.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        prompt: text,
        responseModalities: ['AUDIO'],
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: "Kore" },
            },
        },
      });

      const audioData =
        ttsResult.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

      if (audioData) {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext ||
            (window as any).webkitAudioContext)();
        }

        // Resume context if suspended (browser autoplay policy)
        if (audioContextRef.current.state === "suspended") {
          await audioContextRef.current.resume();
        }

        const audioBuffer = await decodeAudioData(
          audioData,
          audioContextRef.current
        );
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);
        source.onended = () => setIsPlaying(false);
        source.start(0);
      } else {
        setIsPlaying(false);
      }
    } catch (error) {
      console.error("TTS Error:", error);
      setIsPlaying(false);
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
      }
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorderRef.current.onstop = async () => {
          setIsLoading(true);
          const audioBlob = new Blob(audioChunksRef.current, {
            type: "audio/webm",
          }); // Chrome/Firefox usually use webm
          const base64Audio = await blobToBase64(audioBlob);

          try {
            // Send audio to Gemini
            const result = await aiService.generateContent({
                model: "gemini-2.5-flash",
                systemInstruction: SITE_CONTEXT,
                media: {
                    mimeType: "audio/webm",
                    data: base64Audio
                },
                prompt: "Please listen to this audio and respond."
            });

            const textResponse = result.text || "I didn't catch that.";
            setResponse(textResponse);
            setIsLoading(false);

            // Speak it back
            await speakResponse(textResponse);
          } catch (error) {
            console.error("Audio processing error:", error);
            setResponse("Error processing audio.");
            setIsLoading(false);
          }

          // Stop tracks
          stream.getTracks().forEach((track) => track.stop());
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Microphone access denied:", err);
        alert("Microphone access is required for voice interaction.");
      }
    }
  };

  // Hide quick questions when response appears
  useEffect(() => {
    if (response) {
      setShowQuickQuestions(false);
    }
  }, [response]);

  // Full-screen chat mode
  if (isFullScreen) {
    return (
      <div className="fixed inset-0 z-40 bg-gradient-to-br from-[#0A0F1E] via-[#0D1425] to-[#0A0F1E] animate-in fade-in duration-500">
        {/* Floating Minimize Button */}
        <button
          onClick={() => setIsFullScreen(false)}
          className="fixed top-20 right-6 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 transition-all text-gray-300 hover:text-white shadow-lg"
          title="Minimize chat"
        >
          <Minimize2 size={20} />
        </button>

        {/* Chat Messages */}
        <div 
          ref={chatMessagesRef}
          className={`absolute top-24 left-0 right-0 overflow-y-auto px-4 py-6 ${
            followUpQuestions.length > 0 ? 'bottom-56' : 'bottom-32'
          }`}
          style={{ scrollBehavior: 'smooth' }}
        >
          <div className="max-w-4xl mx-auto space-y-6">
            {chatHistory.map((message, index) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className={`max-w-[80%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                  {/* Message Bubble */}
                  <div
                    className={`rounded-2xl p-5 ${
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-[#00E599] to-[#00CC88] text-black'
                        : 'bg-surface/80 backdrop-blur-md border border-white/10 text-gray-200'
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-2 text-[#69F0C9] text-xs font-bold uppercase tracking-wider">
                        Oxygen AI
                        {isPlaying && index === chatHistory.length - 1 && (
                          <Volume2 size={12} className="animate-pulse" />
                        )}
                      </div>
                    )}
                    <div className={`text-base leading-relaxed text-left ${message.role === 'user' ? 'font-medium' : ''}`}>
                      {message.role === 'assistant' ? (
                        <ReactMarkdown
                          components={{
                            strong: ({node, ...props}) => <span className="font-bold text-white" {...props} />,
                            p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                            ul: ({node, ...props}) => <ul className="list-disc list-inside mb-2" {...props} />,
                            li: ({node, ...props}) => <li className="mb-1" {...props} />,
                            a: ({node, ...props}) => <a className="text-[#00E599] hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      ) : (
                        message.content
                      )}
                    </div>
                  </div>
                  {/* Timestamp */}
                  <div className={`text-xs text-gray-500 mt-1 px-2 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2">
                <div className="max-w-[80%]">
                  <div className="bg-surface/80 backdrop-blur-md border border-white/10 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-2 text-[#69F0C9] text-xs font-bold uppercase tracking-wider">
                      Oxygen AI
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Loader2 size={16} className="animate-spin" />
                      <span className="text-sm">Thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Follow-up Questions */}
        {followUpQuestions.length > 0 && !isLoading && (
          <div className="absolute bottom-24 left-0 right-0 px-4 pb-4 bg-gradient-to-t from-[#0A0F1E] via-[#0A0F1E] to-transparent pt-6">
            <div className="max-w-4xl mx-auto">
              <p className="text-sm text-gray-400 mb-3 px-2">Related questions:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {followUpQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickQuestion(question)}
                    className="bg-surface/50 border border-white/10 rounded-xl p-4 text-left hover:bg-surface/70 hover:border-white/20 transition-all duration-300 text-gray-200 hover:text-white group"
                  >
                    <p className="text-sm font-display font-medium group-hover:translate-x-1 transition-transform">
                      {question}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/20 backdrop-blur-md border-t border-white/10 p-4">
          <div className="max-w-4xl mx-auto">
            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*,application/pdf"
              className="hidden"
            />
            
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#9F55FF] to-[#5588FF] rounded-full opacity-30 group-hover:opacity-60 transition duration-500 blur"></div>
              <div className="relative bg-white rounded-full flex items-center p-2 pr-2 shadow-xl">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSend();
                    }
                  }}
                  placeholder={
                    isRecording
                      ? "Listening..."
                      : "Ask a follow-up question..."
                  }
                  className="flex-1 bg-transparent border-none outline-none px-6 text-gray-800 placeholder-gray-500 text-lg h-12 font-display"
                  disabled={isLoading || isRecording}
                />

                <div className="flex items-center gap-2">
                  {/* Upload Button */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={`p-3 rounded-full transition-all duration-300 flex items-center justify-center ${
                      suggestUpload 
                        ? "bg-[#00E599] text-black animate-bounce shadow-lg" 
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                    title="Upload Invoice"
                  >
                    <Paperclip size={20} />
                  </button>
                  
                  {/* Voice Button */}
                  <button
                    onClick={toggleRecording}
                    className={`p-3 rounded-full transition-all duration-300 flex items-center justify-center ${
                      isRecording
                        ? "bg-red-500 text-white animate-pulse shadow-red-500/50 shadow-lg"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                    title="Voice Input"
                  >
                    {isRecording ? (
                      <Square size={20} fill="currentColor" />
                    ) : (
                      <Mic size={20} />
                    )}
                  </button>

                  {/* Send Button */}
                  <button
                    onClick={() => handleSend()}
                    disabled={isLoading || (!inputValue && !isRecording)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                      inputValue
                        ? "bg-[#00E599] text-black hover:bg-[#00CC88] shadow-lg shadow-[#00E599]/30 transform hover:scale-105"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {isLoading ? (
                      <Loader2 size={24} className="animate-spin" />
                    ) : (
                      <ArrowUp size={24} strokeWidth={2.5} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Compact mode (initial view)
  return (
    <div className="w-full mx-auto animate-fade-in-up delay-200 font-sans" ref={containerRef}>
      <div className="flex flex-col gap-6 p-4 rounded-3xl max-w-2xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-white/90">
            What would you like to optimize today?
          </h2>
        </div>

        {/* Chat Input Box */}
        <div className="relative group">
            {/* Hidden File Input */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*,application/pdf"
                className="hidden"
            />
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#9F55FF] to-[#5588FF] rounded-full opacity-30 group-hover:opacity-60 transition duration-500 blur"></div>
          <div className="relative bg-white rounded-full flex items-center p-2 pr-2 shadow-xl">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                if (e.target.value.trim()) {
                  setShowQuickQuestions(false);
                } else {
                  setShowQuickQuestions(true);
                }
              }}
              onFocus={() => {
                if (!inputValue.trim() && !response) {
                  setShowQuickQuestions(true);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSend();
                } else if (e.key === "Escape") {
                  setShowQuickQuestions(false);
                }
              }}
              placeholder={
                isRecording
                  ? "Listening..."
                  : "Ask anything about your energy operations..."
              }
              className="flex-1 bg-transparent border-none outline-none px-6 text-gray-800 placeholder-gray-500 text-lg h-12 font-display"
              disabled={isLoading || isRecording}
            />

            <div className="flex items-center gap-2">
              {/* Upload Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`p-3 rounded-full transition-all duration-300 flex items-center justify-center ${
                    suggestUpload 
                    ? "bg-[#00E599] text-black animate-bounce shadow-lg" 
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
                title="Upload Invoice"
              >
                <Paperclip size={20} />
              </button>
              {/* Voice Button */}
              <button
                onClick={toggleRecording}
                className={`p-3 rounded-full transition-all duration-300 flex items-center justify-center ${
                  isRecording
                    ? "bg-red-500 text-white animate-pulse shadow-red-500/50 shadow-lg"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
                title="Voice Input"
              >
                {isRecording ? (
                  <Square size={20} fill="currentColor" />
                ) : (
                  <Mic size={20} />
                )}
              </button>

              {/* Send Button */}
              <button
                onClick={() => handleSend()}
                disabled={isLoading || (!inputValue && !isRecording)}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                  inputValue
                    ? "bg-[#00E599] text-black hover:bg-[#00CC88] shadow-lg shadow-[#00E599]/30 transform hover:scale-105"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                {isLoading ? (
                  <Loader2 size={24} className="animate-spin" />
                ) : (
                  <ArrowUp size={24} strokeWidth={2.5} />
                )}
              </button>
            </div>
          </div>

          {/* Quick Questions - Auto-complete dropdown style */}
          {showQuickQuestions && !isLoading && !response && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
              <div className="py-2">
                {quickQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickQuestion(question)}
                    className="w-full px-6 py-3 text-left hover:bg-gray-50 transition-colors duration-150 flex items-center gap-3 group"
                  >
                    <span className="text-gray-400 text-sm group-hover:text-gray-600">⌘</span>
                    <p className="text-gray-700 text-sm font-display font-medium flex-1 group-hover:text-gray-900">
                      {question}
                    </p>
                    <span className="text-xs text-gray-400 group-hover:text-gray-600">Enter</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Response Area - Only shown in compact mode if no full screen yet */}
        {response && !isFullScreen && (
          <div className="space-y-4">
            <div className="bg-surface/80 backdrop-blur-md border border-white/10 rounded-2xl p-6 text-left animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-2 mb-2 text-[#69F0C9] text-sm font-bold uppercase tracking-wider">
                Oxygen AI
                {isPlaying && <Volume2 size={14} className="animate-pulse" />}
              </div>
              <div className="text-gray-200 text-lg leading-relaxed markdown-content">
                <ReactMarkdown
                  components={{
                    strong: ({node, ...props}) => <span className="font-bold text-white" {...props} />,
                    p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc list-inside mb-2" {...props} />,
                    li: ({node, ...props}) => <li className="mb-1" {...props} />,
                    a: ({node, ...props}) => <a className="text-[#00E599] hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
                  }}
                >
                  {response}
                </ReactMarkdown>
              </div>
            </div>

            {/* Follow-up Questions */}
            {followUpQuestions.length > 0 && (
              <div className="animate-in fade-in slide-in-from-bottom-2">
                <p className="text-sm text-gray-400 mb-3 px-2">Related questions:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {followUpQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickQuestion(question)}
                      className="bg-surface/50 border border-white/10 rounded-xl p-4 text-left hover:bg-surface/70 hover:border-white/20 transition-all duration-300 text-gray-200 hover:text-white group"
                    >
                      <p className="text-sm font-display font-medium group-hover:translate-x-1 transition-transform">
                        {question}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
