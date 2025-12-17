import React, { useState, useRef } from 'react';
import { Upload, Loader2, CheckCircle, AlertCircle, FileText, Check } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { ParsedInvoiceData } from '../services/salesforce';

interface InvoiceUploaderProps {
    onDataParsed: (data: ParsedInvoiceData) => void;
    gdprConsent: boolean;
    onGdprChange?: (checked: boolean) => void;
    onGdprError?: () => void;
}

export const InvoiceUploader: React.FC<InvoiceUploaderProps> = ({ onDataParsed, gdprConsent, onGdprChange, onGdprError }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;

    const processFile = async (file: File) => {
        if (!gdprConsent) {
            setError("Please accept the GDPR and Privacy Policy before uploading.");
            onGdprError?.();
            return;
        }

        if (!apiKey) {
            setError("Gemini API Key is missing.");
            return;
        }

        setIsProcessing(true);
        setError(null);
        setSuccess(false);

        try {
            const ai = new GoogleGenAI({ apiKey });

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
          "companyName": "string",
          "companyNumber": "string (if found, otherwise empty)",
          "accountNumber": "string",
          "invoiceNumber": "string",
          "invoiceDate": "YYYY-MM-DD",
          "totalAmount": number,
          "totalConsumption": number (total energy consumption in MWh, convert if necessary),
          "contactFirstName": "string (contact person first name if found)",
          "contactLastName": "string (contact person last name if found)",
          "contactEmail": "string (contact email if found)",
          "contactPhone": "string (contact phone if found)",
          "sites": [
            {
              "name": "string (site name or address alias)",
              "address": "string",
              "meterPoints": [
                {
                  "mpan": "string (MPAN or Meter Point Administration Number)",
                  "meterNumber": "string"
                }
              ]
            }
          ]
        }
        
        If you find multiple sites or meters, list them all. If specific fields are missing, use null or empty string.
        Ensure the output is valid JSON only, no markdown formatting.
      `;

            const result = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: [
                    {
                        role: "user",
                        parts: [
                            {
                                inlineData: {
                                    mimeType: file.type,
                                    data: base64
                                }
                            },
                            { text: prompt }
                        ]
                    }
                ]
            });

            const text = result.text || "";
            // Clean up markdown code blocks if present
            const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();

            const data: ParsedInvoiceData = JSON.parse(jsonStr);
            
            // Attach file content for upload
            data.fileContent = base64;
            data.fileName = file.name;

            console.log("Parsed Invoice Data:", data);
            onDataParsed(data);
            setSuccess(true);

        } catch (err) {
            console.error("Error processing invoice:", err);
            setError("Failed to process the invoice. Please try again or enter details manually.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files.length > 0 && (files[0].type.startsWith('image/') || files[0].type === 'application/pdf')) {
            processFile(files[0]);
        } else {
            setError("Please upload a valid image or PDF.");
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            processFile(e.target.files[0]);
        }
    };

    return (
        <div className="w-full mb-8">
            <div
                className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-300 ${isDragging
                        ? 'border-[#00E599] bg-[#00E599]/5'
                        : success
                            ? 'border-[#00E599]/50 bg-[#00E599]/5'
                            : 'border-white/10 hover:border-white/20 bg-white/5'
                    }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*,application/pdf"
                    className="hidden"
                />

                <div className="flex flex-col items-center justify-center text-center">
                    {/* GDPR Notice inside Uploader */}
                    {!gdprConsent && !success && (
                        <div className="mb-6 p-3 bg-white/5 rounded-lg border border-white/10 max-w-md">
                            <label className="flex items-start gap-3 cursor-pointer group text-left">
                                <div className="relative flex items-center mt-1">
                                    <input 
                                        type="checkbox"
                                        checked={gdprConsent}
                                        onChange={(e) => onGdprChange?.(e.target.checked)}
                                        className="peer sr-only"
                                    />
                                    <div className="w-4 h-4 border-2 border-white/30 rounded bg-transparent peer-checked:bg-[#00E599] peer-checked:border-[#00E599] transition-all"></div>
                                    <Check size={10} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-black opacity-0 peer-checked:opacity-100 transition-opacity" />
                                </div>
                                <span className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">
                                    I agree to the <a href="#" className="underline text-white hover:text-[#00E599]" onClick={(e) => e.stopPropagation()}>Privacy Policy</a> and consent to the processing of my personal data.
                                </span>
                            </label>
                        </div>
                    )}

                    {isProcessing ? (
                        <>
                            <Loader2 className="w-10 h-10 text-[#00E599] animate-spin mb-4" />
                            <p className="text-white font-medium">Analyzing Invoice...</p>
                            <p className="text-sm text-gray-400 mt-2">Extracting account and meter details</p>
                        </>
                    ) : success ? (
                        <>
                            <CheckCircle className="w-10 h-10 text-[#00E599] mb-4" />
                            <p className="text-white font-medium">Invoice Processed Successfully</p>
                            <p className="text-sm text-gray-400 mt-2">We've pre-filled the form with the extracted details.</p>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="mt-4 text-sm text-[#00E599] hover:underline"
                            >
                                Upload a different file
                            </button>
                        </>
                    ) : (
                        <>
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                <Upload className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-white mb-2">
                                Upload your latest invoice
                            </h3>
                            <p className="text-gray-400 text-sm max-w-sm mb-6">
                                Drag and drop or click to upload. We'll extract your company details, sites, and meter points automatically.
                            </p>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="px-6 py-2.5 bg-white text-black rounded-full font-medium hover:bg-gray-100 transition-colors"
                            >
                                Select File
                            </button>
                        </>
                    )}

                    {error && (
                        <div className="mt-4 flex items-center gap-2 text-red-400 bg-red-400/10 px-4 py-2 rounded-lg">
                            <AlertCircle size={16} />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
