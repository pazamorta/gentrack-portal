import React, { useState } from 'react';
import { Button } from './Button';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { InvoiceUploader } from './InvoiceUploader';
import { salesforceService, ParsedInvoiceData } from '../services/salesforce';

type Step = 1 | 2 | 3;

export const B2BForm: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [formData, setFormData] = useState({
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
  });
  const [invoiceData, setInvoiceData] = useState<ParsedInvoiceData | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
        return !!(formData.companyName && formData.companyNumber && formData.contactName && formData.email && formData.phone && formData.jobTitle);
      case 2:
        return !!(formData.industry && formData.companySize);
      case 3:
        return !!formData.useCase;
      default:
        return false;
    }
  };

  const handleInvoiceParsed = (data: ParsedInvoiceData) => {
    setInvoiceData(data);
    setFormData(prev => ({
      ...prev,
      companyName: data.companyName || prev.companyName,
      companyNumber: data.companyNumber || prev.companyNumber,
      // We could also map other fields if available in the invoice
    }));
  };

  const handleNext = () => {
    if (validateStep(currentStep) && currentStep < 3) {
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
    if (validateStep(3)) {
      console.log('Form submitted:', formData);

      if (invoiceData) {
        console.log('Creating Salesforce records...');
        // Merge latest form data into invoice data (in case user edited name)
        const finalInvoiceData = {
          ...invoiceData,
          companyName: formData.companyName,
          companyNumber: formData.companyNumber,
        };

        const response = await salesforceService.createRecordsFromInvoice(finalInvoiceData);
        if (response.success) {
          console.log(response.message);
          alert('Success! Your request has been submitted and Salesforce records have been created.');
        }
      } else {
        alert('Thank you! Your request has been submitted successfully.');
      }
    }
  };

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

              <InvoiceUploader onDataParsed={handleInvoiceParsed} />

              <div className="space-y-6">
                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-300 mb-2">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    id="companyName"
                    name="companyName"
                    required
                    value={formData.companyName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition-colors"
                    placeholder="Enter company name"
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
              </div>
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
                      <option value="under-50k">Under $50,000</option>
                      <option value="50k-100k">$50,000 - $100,000</option>
                      <option value="100k-250k">$100,000 - $250,000</option>
                      <option value="250k-500k">$250,000 - $500,000</option>
                      <option value="500k+">$500,000+</option>
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
                onClick={handleNext}
                disabled={!validateStep(currentStep)}
                className={`flex items-center gap-2 px-8 py-3 rounded-full font-medium transition-all ${validateStep(currentStep)
                  ? 'bg-white text-black hover:bg-gray-200'
                  : 'bg-white/10 text-gray-500 cursor-not-allowed'
                  }`}
              >
                Next
                <ChevronRight size={20} />
              </button>
            ) : (
              <Button
                type="submit"
                variant="primary"
                className="min-w-[200px]"
                disabled={!validateStep(3)}
              >
                Submit Request
              </Button>
            )}
          </div>
        </form>
      </div>
    </section>
  );
};
