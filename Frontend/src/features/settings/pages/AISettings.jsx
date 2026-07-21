import React, { useState, useEffect } from 'react';
import { aiService } from '../../../services/aiService';
import { Box } from '../../../components/ui/Box';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Sparkles, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';

const PROVIDERS = [
  { value: 'gemini', label: 'Google Gemini' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic Claude' },
  { value: 'azure', label: 'Azure OpenAI' },
  { value: 'ollama', label: 'Ollama (Local)' },
];

const DEFAULT_MODEL_OPTIONS = {
  gemini: ['gemini-3.5-flash', 'gemini-3-pro-preview', 'gemini-2.5-pro', 'gemini-2.0-flash'],
  openai: ['gpt-4.5-turbo', 'gpt-4o', 'gpt-4-turbo'],
  anthropic: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
  azure: [],
  ollama: ['llama3.1', 'mistral', 'phi3.5', 'gemma2', 'qwen2']
};

const AISettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [availableModels, setAvailableModels] = useState([]);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [formData, setFormData] = useState({
    provider_type: 'gemini',
    model_name: 'gemini-1.5-flash',
    api_key: '',
    base_url: ''
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const data = await aiService.getConfig();
      if (data && data.provider_type) {
        setFormData({
          provider_type: data.provider_type,
          model_name: data.model_name || '',
          api_key: data.api_key || '', // Note: The backend usually shouldn't return the full API key for security, but we map it if present.
          base_url: data.base_url || ''
        });
        setAvailableModels(DEFAULT_MODEL_OPTIONS[data.provider_type] || []);
      }
    } catch (err) {
      // If 404, it means no config exists yet, which is fine.
      if (err.response?.status !== 404) {
        console.error("Failed to load AI config", err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'provider_type') {
      const defaultModels = DEFAULT_MODEL_OPTIONS[value] || [];
      const defaultModel = defaultModels.length > 0 ? defaultModels[0] : '';
      setFormData(prev => ({ ...prev, provider_type: value, model_name: defaultModel }));
      setAvailableModels(defaultModels);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFetchModels = async () => {
    if (!formData.api_key && formData.provider_type !== 'ollama') {
      setMessage({ text: 'Please enter an API key first to fetch models.', type: 'error' });
      return;
    }
    
    try {
      setFetchingModels(true);
      setMessage({ text: '', type: '' });
      const data = await aiService.getModels(formData.provider_type, formData.api_key, formData.base_url);
      
      if (data && data.models && data.models.length > 0) {
        setAvailableModels(data.models);
        setMessage({ text: `Successfully fetched ${data.models.length} models.`, type: 'success' });
        // Optionally update the selected model to the first one fetched
        if (!data.models.includes(formData.model_name)) {
          setFormData(prev => ({ ...prev, model_name: data.models[0] }));
        }
      } else {
        setMessage({ text: 'No models returned from provider.', type: 'error' });
      }
    } catch (err) {
      const errorText = err.response?.data?.error || err.message || 'Unknown error occurred.';
      setMessage({ text: `Failed to fetch models: ${errorText}`, type: 'error' });
    } finally {
      setFetchingModels(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage({ text: '', type: '' });
      await aiService.setConfig(formData);
      setMessage({ text: 'AI Configuration saved successfully!', type: 'success' });
    } catch (err) {
      setMessage({ text: 'Failed to save configuration. Please try again.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading settings...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-teal-500" />
          AI Integrations
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Configure the generative AI provider used for EventStream's root cause analysis, predictive maintenance, and executive reports.
        </p>
      </div>

      <Box className="p-0">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {message.text && (
            <div className={`p-4 rounded-md flex items-center gap-3 ${
              message.type === 'success' ? 'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300'
            }`}>
              {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
              {message.text}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Select
              label="Provider Type"
              name="provider_type"
              value={formData.provider_type}
              onChange={handleChange}
              options={PROVIDERS}
              required
            />
            <div className="space-y-2 flex flex-col justify-end">
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <Select
                    label="Model Name"
                    name="model_name"
                    value={formData.model_name}
                    onChange={handleChange}
                    options={availableModels.map(m => ({ label: m, value: m }))}
                    required
                  />
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleFetchModels}
                  loading={fetchingModels}
                  className="whitespace-nowrap h-11 px-5 rounded-xl border border-border-main text-text-main hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${fetchingModels ? 'animate-spin' : ''}`} />
                  Fetch Models
                </Button>
              </div>
              <p className="text-xs text-text-muted pt-1">
                Models available for your tier. Click 'Fetch Models' to update.
              </p>
            </div>
          </div>

          <Input
            label="API Key"
            name="api_key"
            type="password"
            value={formData.api_key}
            onChange={handleChange}
            placeholder={formData.provider_type === 'ollama' ? "(Optional) Ollama API Key" : "Enter your API Key"}
            required={formData.provider_type !== 'ollama'}
            helperText="Your API key is securely encrypted at rest."
          />

          {(formData.provider_type === 'azure' || formData.provider_type === 'ollama') && (
            <Input
              label="Base URL / Endpoint"
              name="base_url"
              type="text"
              value={formData.base_url}
              onChange={handleChange}
              placeholder={formData.provider_type === 'ollama' ? "http://localhost:11434" : "https://YOUR_RESOURCE_NAME.openai.azure.com/"}
              required
              helperText={`Endpoint URL for ${formData.provider_type === 'ollama' ? 'Ollama' : 'Azure OpenAI'}`}
            />
          )}

          <div className="pt-4 flex justify-end">
            <Button type="submit" variant="primary" loading={saving}>
              Save Configuration
            </Button>
          </div>
        </form>
      </Box>
      
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800/50">
        <h3 className="font-semibold text-blue-900 dark:text-blue-300 flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Where is this used?
        </h3>
        <ul className="mt-2 text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc pl-5">
          <li><strong>Root Cause Analysis:</strong> Automatically diagnose anomalies on the Alerts page.</li>
          <li><strong>Predictive Maintenance:</strong> Predict when devices will need service on the Devices page.</li>
          <li><strong>Executive Summaries:</strong> Generate daily operational reports from the Dashboard.</li>
          <li><strong>Assistant Chatbot:</strong> Power the floating interactive agent on your screen.</li>
        </ul>
      </div>
    </div>
  );
};

export default AISettings;
