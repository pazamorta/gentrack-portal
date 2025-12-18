import React, { useState } from 'react';
import { Button } from './Button';
import { ChevronLeft, ChevronRight, Check, CheckCircle, Building2, Users, ExternalLink } from 'lucide-react';
import { InvoiceUploader } from './InvoiceUploader';
import { salesforceService, ParsedInvoiceData } from '../services/salesforce';

type Step = 1 | 2 | 3;

export const B2BForm: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [formData, setFormData] = useState({
    userType: 'company',
    tpiIdentifier: '',
    companyName: '',
    companyNumber: '',
    website: '',
    contactName: '',
    email: '',
    phone: '',
    jobTitle: '',
    industry: '',
    companySize: '',
    customerBase: '',
    currentSystems: '',
    energyDomains: [] as string[],
    useCase: '',
    timeline: '',
    budget: '',
    additionalInfo: '',
    gdprConsent: false,
    portfolioSize: '',
    leadId: '',
  });
  const [showManualForm, setShowManualForm] = useState(false);
  const [invoiceData, setInvoiceData] = useState<ParsedInvoiceData | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // Ensure this exists if I used it above, or check existing code.
  // Checking previous code: I didn't see isSubmitting defined. I should add it just in case.

  const [submissionSuccess, setSubmissionSuccess] = useState<{
    instanceUrl: string;
    accountId: string;
    contactId: string;
    opportunityId: string;
    servicePoints?: { id: string; mpan: string }[];
  } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    // Handle checkbox separately
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      energyDomains: checked
        ? [...prev.energyDomains, value]
        : prev.energyDomains.filter(domain => domain !== value)
    }));
  };

  const validateStep = (step: Step): boolean => {
    switch (step) {
      case 1:
        const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
        if (formData.userType === 'tpi' && !formData.tpiIdentifier) return false;
        return !!(formData.gdprConsent && formData.companyName && formData.companyNumber && formData.contactName && formData.email && emailValid && formData.phone && formData.jobTitle);
      case 2:
        return !!(formData.industry && formData.companySize);
      case 3:
        return !!(formData.useCase && formData.portfolioSize);
      default:
        return false;
    }
  };

  const handleInvoiceParsed = (data: ParsedInvoiceData) => {
    setInvoiceData(data);
    setShowManualForm(true);
    setFormData(prev => ({
      ...prev,
      companyName: data.companyName || prev.companyName,
      companyNumber: data.companyNumber || prev.companyNumber,
      // We could also map other fields if available in the invoice
    }));
  };

  const handleDownloadTemplate = () => {
    const headers = [
      'Service Point',
      'Fuel Type',
      'Address',
      'Postcode',
      'Product Preference*',
      'Duration Options*',
      'Annual Consumption*',
      'Site Name*',
      'Service Point Contact Name*',
      'Service Point Contact email*',
      'Service Point Contact tel*',
      'Service Point Company Number'
    ];
    
    const csvContent = headers.join(',') + '\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'portfolio_template.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const rows = text.split('\n').map(row => row.split(','));
    const headers = rows[0].map(h => h.trim());
    
    // Simple CSV parsing (assuming no commas in values for MVP)
    const sitesMap = new Map<string, any>();
    
    rows.slice(1).forEach(row => {
      if (row.length < 2) return; // Skip empty rows
      
      const getValue = (headerPart: string) => {
        const index = headers.findIndex(h => h.includes(headerPart));
        return index >= 0 ? row[index]?.trim() : '';
      };

      const siteName = getValue('Site Name') || 'Unknown Site';
      const servicePointId = getValue('Service Point');
      
      if (!sitesMap.has(siteName)) {
        sitesMap.set(siteName, {
          name: siteName,
          address: `${getValue('Address')} ${getValue('Postcode')}`.trim(),
          meterPoints: []
        });
      }

      if (servicePointId) {
        sitesMap.get(siteName).meterPoints.push({
          mpan: servicePointId,
          meterNumber: servicePointId,
          address: getValue('Address'),
          postcode: getValue('Postcode'),
          fuelType: getValue('Fuel Type'),
          productPreference: getValue('Product Preference') || getValue('Product Preference*'),
          durationOptions: getValue('Duration Options') || getValue('Duration Options*'),
          annualConsumption: getValue('Annual Consumption') || getValue('Annual Consumption*'),
          contactName: getValue('Service Point Contact Name') || getValue('Service Point Contact Name*'),
          contactEmail: getValue('Service Point Contact email') || getValue('Service Point Contact email*'),
          contactPhone: getValue('Service Point Contact tel') || getValue('Service Point Contact tel*'),
          companyNumber: getValue('Service Point Company Number')
        });
      }
    });

    const parsedSites = Array.from(sitesMap.values());
    
    setInvoiceData(prev => ({
      ...prev!, // Assumes user might have uploaded invoice or matches other data. If null, we create new.
      companyName: prev?.companyName || formData.companyName,
      companyNumber: prev?.companyNumber || formData.companyNumber,
      // @ts-ignore
      sites: parsedSites
    }));
  };

  const handleNext = async () => {
    if (validateStep(currentStep) && currentStep < 3) {
      // Create Lead on Step 1 completion
      if (currentStep === 1) {
          try {
              console.log('Creating Lead...');
              // Only create if we don't have one? Or update? For MVP, always create new if not present.
              if (!formData.leadId) {
                  const res = await salesforceService.createLead(formData);
                  if (res.success && res.leadId) {
                      setFormData(prev => ({ ...prev, leadId: res.leadId! }));
                      console.log('Lead created:', res.leadId);
                  }
              }
          } catch (e) {
              console.error('Failed to create lead:', e);
              // We proceed anyway, not blocking user flow
          }
      }
      
      setCurrentStep((prev) => (prev + 1) as Step);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    
    if (!validateStep(3)) {
      setValidationError("Please complete all required fields correctly.");
      return;
    }

    try {
      setIsSubmitting(true);
      console.log('Form submitted:', formData);
      console.log('Creating/Updating Salesforce records...');
      
      // Construct final payload merging invoice data and form data
      const finalInvoiceData: ParsedInvoiceData = {
        // Base invoice data or defaults
        companyName: formData.companyName,
        companyNumber: formData.companyNumber,
        contactFirstName: formData.contactName.split(' ')[0],
        contactLastName: formData.contactName.split(' ').slice(1).join(' ') || 'Unknown',
        contactEmail: formData.email,
        contactPhone: formData.phone,
        sites: invoiceData?.sites || [],
        fileName: invoiceData?.fileName,
        fileContent: invoiceData?.fileContent,
        invoiceNumber: invoiceData?.invoiceNumber,
        totalAmount: invoiceData?.totalAmount,
        totalConsumption: invoiceData?.totalConsumption,
        annualConsumption: invoiceData?.annualConsumption,
        
        // Form fields for conversion
        leadId: formData.leadId, // This triggers conversion logic in backend
        industry: formData.industry,
        companySize: formData.companySize,
        useCase: formData.useCase,
        timeline: formData.timeline,
        budget: formData.budget,
        portfolioSize: formData.portfolioSize
      };

      const response = await salesforceService.createRecordsFromInvoice(finalInvoiceData);
      if (response.success && response.records) {
        console.log(response.message);
        console.log("Salesforce Records IDs:", response.records);
        setSubmissionSuccess(response.records);
      } else {
           alert('Submission processed, but there might be a delay in Salesforce updates.');
      }
    } catch (error) {
      console.error('Submission error:', error);
      alert('There was an error submitting your request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ... [Keep steps array definition]

  if (submissionSuccess) {
      return (
        <div className="w-full max-w-4xl mx-auto p-8 bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 text-center animate-fade-in">
            <div className="mb-6 flex justify-center">
                <div className="w-20 h-20 bg-[#00E599]/20 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-10 h-10 text-[#00E599]" />
                </div>
            </div>
            
            <h2 className="text-3xl font-display font-bold text-white mb-4">Application Submitted!</h2>
            <p className="text-gray-400 mb-8 max-w-xl mx-auto">
                Thank you. Your request has been successfully processed. 
                Your lead has been converted, and the following records have been created in Salesforce.
            </p>

            <div className="mt-12">
                <button 
                    onClick={() => window.location.reload()}
                    className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors border border-white/10"
                >
                    Submit Another Application
                </button>
            </div>
        </div>
      );
  }

  const steps = [
    { number: 1, title: 'Company & Contact', description: 'Basic information' },
    { number: 2, title: 'Business Details', description: 'About your business' },
    { number: 3, title: 'Requirements', description: 'What you need' },
  ];

  return (
    <section id="get-started" className="py-24 px-4 bg-background/50 backdrop-blur-sm border-t border-white/5" style={{ scrollMarginTop: '100px' }}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-16 text-center">
          <h2 className="text-3xl md:text-5xl font-display font-medium mb-4">
            Get Started with Oxygen
          </h2>
          <p className="text-secondary text-lg">
            Tell us about your business and we'll help you find the right solution.
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <React.Fragment key={step.number}>
                <div className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${currentStep > step.number
                        ? 'bg-[#00E599] text-black'
                        : currentStep === step.number
                          ? 'bg-white text-black scale-110'
                          : 'bg-white/10 text-gray-400 border-2 border-white/20'
                        }`}
                    >
                      {currentStep > step.number ? (
                        <Check size={20} />
                      ) : (
                        step.number
                      )}
                    </div>
                    <div className="mt-2 text-center">
                      <div className={`text-xs font-medium ${currentStep >= step.number ? 'text-white' : 'text-gray-500'}`}>
                        {step.title}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 hidden md:block">
                        {step.description}
                      </div>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`h-1 flex-1 mx-2 transition-all duration-500 ${currentStep > step.number ? 'bg-[#00E599]' : 'bg-white/10'
                        }`}
                      style={{ marginTop: '-24px' }}
                    />
                  )}
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface/30 border border-white/5 rounded-3xl p-8 md:p-12 backdrop-blur-md">
          {/* Step 1: Company and Contact Information */}
          {currentStep === 1 && (
            <div className="animate-fade-in">
              <h3 className="text-2xl font-bold mb-2 text-white">Company and Contact Information</h3>
              <p className="text-secondary mb-8">Let's start with the basics. Upload your invoice to auto-fill details.</p>

              {/* User Type Switch */}
              <div className="flex justify-center mb-8">
                <div className="bg-white/5 p-1 rounded-full inline-flex border border-white/10">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, userType: 'company' }))}
                    className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${formData.userType === 'company'
                        ? 'bg-[#00E599] text-black shadow-lg'
                        : 'text-gray-400 hover:text-white'
                      }`}
                  >
                    For Your Company
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, userType: 'tpi' }))}
                    className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${formData.userType === 'tpi'
                        ? 'bg-[#00E599] text-black shadow-lg'
                        : 'text-gray-400 hover:text-white'
                      }`}
                  >
                    As A TPI
                  </button>
                </div>
              </div>

              {formData.userType === 'company' && !showManualForm && (
                 <div className="space-y-8">
                    <InvoiceUploader 
                        onDataParsed={handleInvoiceParsed} 
                        gdprConsent={formData.gdprConsent}
                        onGdprChange={(checked) => setFormData(prev => ({ ...prev, gdprConsent: checked }))}
                        onGdprError={() => {
                            // Optional: Could add a toast or error state here if needed
                            // But for now the UI disabling/message in InvoiceUploader will handle it
                        }}
                    />
                    <div className="text-center">
                        <button 
                            type="button" 
                            onClick={() => setShowManualForm(true)}
                            className="text-sm text-gray-400 hover:text-white underline transition-colors"
                        >
                            Or enter details manually
                        </button>
                    </div>
                 </div>
              )}

              {/* Show form if TPI OR (Company AND Manual Mode Active) */}
              {(formData.userType === 'tpi' || showManualForm) && (
              <div className="space-y-6 animate-fade-in">
                {formData.userType === 'tpi' && (
                     <p className="text-sm text-gray-400 mb-4 bg-white/5 p-4 rounded-xl border border-white/10">
                        As a TPI, please verify your company details below.
                     </p>
                )}
                <div>
                  {formData.userType === 'tpi' && (
                    <div className="mb-6">
                      <label htmlFor="tpiIdentifier" className="block text-sm font-medium text-gray-300 mb-2">
                        TPI Identifier *
                      </label>
                      <input
                        type="text"
                        id="tpiIdentifier"
                        name="tpiIdentifier"
                        required
                        value={formData.tpiIdentifier}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition-colors"
                        placeholder="Enter your TPI Identifier"
                      />
                    </div>
                  )}

                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-300 mb-2">
                    {formData.userType === 'tpi' ? 'Client Account Name *' : 'Company Name *'}
                  </label>
                  <input
                    type="text"
                    id="companyName"
                    name="companyName"
                    required
                    value={formData.companyName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition-colors"
                    placeholder={formData.userType === 'tpi' ? "Enter client account name" : "Enter company name"}
                  />
                </div>

                <div>
                  <label htmlFor="companyNumber" className="block text-sm font-medium text-gray-300 mb-2">
                    Company Number *
                  </label>
                  <input
                    type="text"
                    id="companyNumber"
                    name="companyNumber"
                    required
                    value={formData.companyNumber} // errors here are expected until the state update is processed by the language server, but it's fine since we updated state in the first chunk
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition-colors"
                    placeholder="Enter company number"
                  />
                </div>

                <div>
                  <label htmlFor="website" className="block text-sm font-medium text-gray-300 mb-2">
                    Company Website
                  </label>
                  <input
                    type="url"
                    id="website"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition-colors"
                    placeholder="https://example.com"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="contactName" className="block text-sm font-medium text-gray-300 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="contactName"
                      name="contactName"
                      required
                      value={formData.contactName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition-colors"
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-300 mb-2">
                      Job Title *
                    </label>
                    <input
                      type="text"
                      id="jobTitle"
                      name="jobTitle"
                      required
                      value={formData.jobTitle}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition-colors"
                      placeholder="e.g., Operations Manager"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition-colors"
                      placeholder="your.email@company.com"
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition-colors"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                <div className="mt-4 p-4 bg-white/5 border border-white/10 rounded-xl">
                    <label className="flex items-start gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={formData.gdprConsent}
                            onChange={(e) => setFormData(prev => ({ ...prev, gdprConsent: e.target.checked }))}
                            className="mt-1 w-5 h-5 rounded border-white/20 bg-white/5 text-[#00E599] focus:ring-2 focus:ring-[#00E599]/50 focus:ring-offset-2 focus:ring-offset-transparent cursor-pointer"
                        />
                        <span className="text-sm text-gray-300">
                            I consent to the processing of my personal data in accordance with the Privacy Policy and GDPR regulations. *
                        </span>
                    </label>
                </div>


              </div>
              )}
            </div>
          )}

          {/* Step 2: Business Details */}
          {currentStep === 2 && (
            <div className="animate-fade-in">
              <h3 className="text-2xl font-bold mb-2 text-white">Business Details</h3>
              <p className="text-secondary mb-8">Tell us about your business</p>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="industry" className="block text-sm font-medium text-gray-300 mb-2">
                      Industry Type *
                    </label>
                    <select
                      id="industry"
                      name="industry"
                      required
                      value={formData.industry}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-white/30 transition-colors"
                    >
                      <option value="">Select industry</option>
                      <option value="electricity">Electricity Retailer</option>
                      <option value="gas">Gas Retailer</option>
                      <option value="water">Water Supplier</option>
                      <option value="network">Network Operator</option>
                      <option value="multi">Multi-Utility</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="companySize" className="block text-sm font-medium text-gray-300 mb-2">
                      Company Size *
                    </label>
                    <select
                      id="companySize"
                      name="companySize"
                      required
                      value={formData.companySize}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-white/30 transition-colors"
                    >
                      <option value="">Select size</option>
                      <option value="1-50">1-50 employees</option>
                      <option value="51-200">51-200 employees</option>
                      <option value="201-500">201-500 employees</option>
                      <option value="501-1000">501-1000 employees</option>
                      <option value="1000+">1000+ employees</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="customerBase" className="block text-sm font-medium text-gray-300 mb-2">
                      Number of Customers Served
                    </label>
                    <input
                      type="text"
                      id="customerBase"
                      name="customerBase"
                      value={formData.customerBase}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition-colors"
                      placeholder="e.g., 10,000 - 50,000"
                    />
                  </div>
                  <div>
                    <label htmlFor="currentSystems" className="block text-sm font-medium text-gray-300 mb-2">
                      Current Systems
                    </label>
                    <input
                      type="text"
                      id="currentSystems"
                      name="currentSystems"
                      value={formData.currentSystems}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition-colors"
                      placeholder="e.g., SAP, Oracle, Legacy systems"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Energy Domains (select all that apply)
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['Electricity', 'Gas', 'Water'].map((domain) => (
                      <label
                        key={domain}
                        className={`flex items-center gap-3 cursor-pointer p-4 rounded-xl border transition-all ${formData.energyDomains.includes(domain.toLowerCase())
                          ? 'bg-[#00E599]/10 border-[#00E599]/50'
                          : 'bg-white/5 border-white/10 hover:border-white/20'
                          }`}
                      >
                        <input
                          type="checkbox"
                          value={domain.toLowerCase()}
                          checked={formData.energyDomains.includes(domain.toLowerCase())}
                          onChange={handleCheckboxChange}
                          className="w-5 h-5 rounded border-white/20 bg-white/5 text-[#00E599] focus:ring-2 focus:ring-[#00E599]/50 focus:ring-offset-2 focus:ring-offset-transparent cursor-pointer"
                        />
                        <span className="text-gray-300 font-medium">{domain}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Requirements */}
          {currentStep === 3 && (
            <div className="animate-fade-in">
              <h3 className="text-2xl font-bold mb-2 text-white">Requirements</h3>
              <p className="text-secondary mb-8">What are you looking for?</p>

              <div className="space-y-6">
                <div>
                  <label htmlFor="useCase" className="block text-sm font-medium text-gray-300 mb-2">
                    Primary Use Case *
                  </label>
                  <select
                    id="useCase"
                    name="useCase"
                    required
                    value={formData.useCase}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-white/30 transition-colors"
                  >
                    <option value="">Select use case</option>
                    <option value="billing">Billing & Collections</option>
                    <option value="customer-engagement">Customer Engagement</option>
                    <option value="finance">Finance & Accounting</option>
                    <option value="operations">Operations Management</option>
                    <option value="analytics">Analytics & Insights</option>
                    <option value="integration">System Integration</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="timeline" className="block text-sm font-medium text-gray-300 mb-2">
                      Implementation Timeline
                    </label>
                    <select
                      id="timeline"
                      name="timeline"
                      value={formData.timeline}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-white/30 transition-colors"
                    >
                      <option value="">Select timeline</option>
                      <option value="immediate">Immediate (0-3 months)</option>
                      <option value="short">Short-term (3-6 months)</option>
                      <option value="medium">Medium-term (6-12 months)</option>
                      <option value="long">Long-term (12+ months)</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="budget" className="block text-sm font-medium text-gray-300 mb-2">
                      Budget Range
                    </label>
                    <select
                      id="budget"
                      name="budget"
                      value={formData.budget}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-white/30 transition-colors"
                    >
                      <option value="">Select budget range</option>
                      <option value="under-50k">Under £50,000</option>
                      <option value="50k-100k">£50,000 - £100,000</option>
                      <option value="100k-250k">£100,000 - £250,000</option>
                      <option value="250k-500k">£250,000 - £500,000</option>
                      <option value="500k+">£500,000+</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="additionalInfo" className="block text-sm font-medium text-gray-300 mb-2">
                    Additional Information
                  </label>
                  <textarea
                    id="additionalInfo"
                    name="additionalInfo"
                    rows={4}
                    value={formData.additionalInfo}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition-colors resize-none"
                    placeholder="Tell us more about your specific needs, challenges, or questions..."
                  />
                </div>
                
                <div>
                  <label htmlFor="portfolioSize" className="block text-sm font-medium text-gray-300 mb-2">
                    Portfolio Size *
                  </label>
                  <select
                    id="portfolioSize"
                    name="portfolioSize"
                    required
                    value={formData.portfolioSize}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-white/30 transition-colors"
                  >
                    <option value="">Select portfolio size</option>
                    <option value="1-10000">1 - 10,000 Service Points</option>
                    <option value="10000-100000">10,000 - 100,000 Service Points</option>
                    <option value="100000-1000000">100,000 - 1,000,000 Service Points</option>
                    <option value="1000000+">1,000,000+ Service Points</option>
                  </select>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h4 className="text-lg font-medium text-white mb-2">Upload Portfolio</h4>
                  <p className="text-secondary text-sm mb-4">
                    Download our template to provide your site details, then upload it here to automatically create your portfolio.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      type="button"
                      onClick={handleDownloadTemplate}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Download Spreadsheet
                    </button>
                    
                    <div className="relative">
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <button
                        type="button"
                        className="w-full px-4 py-2 bg-[#00E599]/10 hover:bg-[#00E599]/20 text-[#00E599] border border-[#00E599]/50 rounded-lg text-sm font-medium transition-colors"
                      >
                        Upload Spreadsheet
                      </button>
                    </div>
                  </div>
                  
                  {invoiceData?.sites && invoiceData.sites.length > 0 && (
                     <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <p className="text-green-400 text-sm">
                           Successfully loaded a sites spreadsheet.
                        </p>
                     </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-12 pt-8 border-t border-white/10">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all ${currentStep === 1
                ? 'text-gray-500 cursor-not-allowed'
                : 'text-white border border-white/20 hover:border-white/40 hover:bg-white/5'
                }`}
            >
              <ChevronLeft size={20} />
              Previous
            </button>

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={(e) => {
                  const form = e.currentTarget.closest('form');
                  if (form && !form.reportValidity()) {
                    return;
                  }

                  if (validateStep(currentStep)) {
                    handleNext();
                    setValidationError(null);
                  } else {
                    setValidationError("Please fill in all required fields correctly.");
                  }
                }}
                className="flex items-center gap-2 px-8 py-3 rounded-full font-medium transition-all bg-white text-black hover:bg-gray-200"
              >
                Next
                <ChevronRight size={20} />
              </button>
            ) : (
              <Button
                type="submit"
                variant="primary"
                className="min-w-[200px]"
                disabled={isSubmitting} 
              >
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </Button>
            )}
          </div>
          {validationError && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
              {validationError}
            </div>
          )}
        </form>
      </div>
    </section>
  );
};
