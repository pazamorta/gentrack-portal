import React, { useState, useRef, useEffect } from "react";
import { ArrowUp, Mic, Square, Loader2, Volume2 } from "lucide-react";
import { GoogleGenAI, Modality } from "@google/genai";

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

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);

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
    You are Oxygen AI, the intelligent assistant for the Oxygen energy platform.
    
    Website Context:
    - Mission: Sustainable Energy for Every Scale. Power operations with smarter energy, optimize in real-time.
    - Features: Ironclad Protection (encryption), Effortless Connections (cloud-native), Ready to Grow (scalable tools).
    - Pricing: Starter (Free, 3 users), Pro ($49/mo, 10 users), Enterprise ($149/mo, Unlimited).
    - Stats: 99.99% Reliability, 1M+ Users, 24/7 Support.
    - Security: Full-spectrum encryption, SOC2 compliance standards.
    
    Your goal is to help users optimize their energy operations and answer questions about the platform concisely.
    Keep answers under 50 words unless asked for more detail.
  `;

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    // Check if API key is configured
    if (!ai) {
      setResponse("Error: API key not configured. Please set GEMINI_API_KEY in your .env.local file.");
      return;
    }

    setIsLoading(true);
    setResponse(null);
    const userPrompt = inputValue;
    setInputValue("");

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

      // 2. Generate Audio Response (TTS)
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

  return (
    <div className="w-full max-w-2xl mx-auto animate-fade-in-up delay-200 font-sans">
      <div className="flex flex-col gap-6 p-4 rounded-3xl">
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
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={
                isRecording
                  ? "Listening..."
                  : "Ask anything about your energy operations..."
              }
              className="flex-1 bg-transparent border-none outline-none px-6 text-gray-800 placeholder-gray-500 text-lg h-12"
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
                onClick={handleSend}
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

        {/* Response Area */}
        {response && (
          <div className="bg-surface/80 backdrop-blur-md border border-white/10 rounded-2xl p-6 text-left animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2 mb-2 text-[#69F0C9] text-sm font-bold uppercase tracking-wider">
              Oxygen AI
              {isPlaying && <Volume2 size={14} className="animate-pulse" />}
            </div>
            <p className="text-gray-200 text-lg leading-relaxed">{response}</p>
          </div>
        )}
      </div>
    </div>
  );
};
