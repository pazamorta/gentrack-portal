import React, { useState, useRef, useEffect } from "react";
import { ArrowUp, Mic, Square, Loader2, Volume2 } from "lucide-react";
import { GoogleGenAI, Modality } from "@google/genai";
import ReactMarkdown from 'react-markdown';

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
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showQuickQuestions, setShowQuickQuestions] = useState(false);
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Get API key from environment
  // Vite injects process.env.API_KEY from GEMINI_API_KEY env variable
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  
  // Validate API key
  if (!apiKey || apiKey === 'undefined' || apiKey.trim() === '') {
    console.error('GEMINI_API_KEY is not set. Please create a .env.local file with GEMINI_API_KEY=your_api_key');
  }

  // Initialize GenAI
  // Ideally this should be outside or memoized, but for this snippet it's okay.
  const ai = apiKey && apiKey !== 'undefined' ? new GoogleGenAI({ apiKey }) : null;

  const SITE_CONTEXT = `
    You are Oxygen AI, the intelligent assistant for the Oxygen energy platform (powered by Gentrack).
    
    Website Context (from this portal):
    - Mission: Sustainable Energy for Every Scale. Power operations with smarter energy, optimize in real-time.
    - Features: Resilient Operations (enterprise-grade security), Unified Utility Core (electricity, gas, water), Future-Proof Scale (API-first tools).
    - Platform: Cloud-native, composable architecture with integration layer, utilities best-practice library.
    - Solutions: Transform core utility operations, reduce cost-to-serve, accelerate innovation.
    - Insights: Business and data applications, dashboards and analytics, actionable insights.
    - Energy Domains: Water (real-time monitoring, leakage insights), Electricity (AI-driven optimization), Gas (end-to-end tracking).
    
    IMPORTANT: For questions about topics NOT covered on this portal (such as detailed product specifications, implementation guides, technical documentation, company history, or enterprise features), you should reference and use information from the official Engie website at https://www.engie.co.uk/. When referencing engie.co.uk, mention that users can find more detailed information there.
    
    Your goal is to help users optimize their energy operations and answer questions about the platform concisely.
    Keep answers under 50 words unless asked for more detail.
  `;

  const quickQuestions = [
    "How can I optimize my utility operations?",
    "What energy domains do you support?",
    "How does the platform integrate with existing systems?",
    "What insights can I get from my energy data?"
  ];

  const handleQuickQuestion = (question: string) => {
    setInputValue(question);
    setShowQuickQuestions(false);
    setFollowUpQuestions([]);
    // Auto-submit the question
    setTimeout(() => {
      handleSend(question);
    }, 100);
  };

  const generateFollowUpQuestions = async (originalQuestion: string, answer: string) => {
    if (!ai) return;

    try {
      const prompt = `Based on this question and answer about energy operations, generate exactly 4 short, succinct follow-up questions (max 6-8 words each). Make them concise, specific, and actionable.

Original Question: "${originalQuestion}"
Answer: "${answer}"

Return only the 4 questions, one per line, without numbering or bullets. Keep each question brief and to the point.`;

      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
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

  const handleSend = async (customQuestion?: string) => {
    const questionToSend = customQuestion || inputValue;
    if (!questionToSend.trim()) return;

    // Check if API key is configured
    if (!ai) {
      setResponse("Error: API key not configured. Please set GEMINI_API_KEY in your .env.local file.");
      return;
    }

    setIsLoading(true);
    setResponse(null);
    setFollowUpQuestions([]);
    const userPrompt = questionToSend;
    if (!customQuestion) {
      setInputValue("");
    }
    setShowQuickQuestions(false);

    try {
      // 1. Generate Text Response
      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        config: {
          systemInstruction: SITE_CONTEXT,
        },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      });

      const textResponse = result.text || "I couldn't generate a response.";
      setResponse(textResponse);
      setIsLoading(false);

      // 2. Generate Follow-up Questions
      await generateFollowUpQuestions(userPrompt, textResponse);

      // 3. Generate Audio Response (TTS)
      await speakResponse(textResponse);
    } catch (error) {
      console.error("Error generating content:", error);
      setResponse("Sorry, I encountered an error processing your request.");
      setIsLoading(false);
    }
  };

  const speakResponse = async (text: string) => {
    // Check if API key is configured
    if (!ai) {
      console.warn('API key not configured, skipping TTS');
      return;
    }

    try {
      setIsPlaying(true);
      const ttsResult = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: "Kore" },
            },
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
          // Check if API key is configured
          if (!ai) {
            setResponse("Error: API key not configured. Please set GEMINI_API_KEY in your .env.local file.");
            setIsRecording(false);
            return;
          }

          setIsLoading(true);
          const audioBlob = new Blob(audioChunksRef.current, {
            type: "audio/webm",
          }); // Chrome/Firefox usually use webm
          const base64Audio = await blobToBase64(audioBlob);

          try {
            // Send audio to Gemini
            const result = await ai.models.generateContent({
              model: "gemini-2.5-flash",
              config: {
                systemInstruction: SITE_CONTEXT,
              },
              contents: [
                {
                  role: "user",
                  parts: [
                    {
                      inlineData: {
                        mimeType: "audio/webm", // Adjust based on browser recording format if needed
                        data: base64Audio,
                      },
                    },
                    { text: "Please listen to this audio and respond." },
                  ],
                },
              ],
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

        {/* Response Area */}
        {response && (
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
