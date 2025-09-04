import { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabase/client';
import { externalDataApi } from '../../utils/external-data-api';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

interface SimpleExternalDataSourcesProps {
  familyId: string;
  userId: string;
}

interface TelegramConfig {
  sourceName: string;
  chatId: string;
}

interface SlackConfig {
  sourceName: string;
  channelId: string;
}

interface ExternalDataSource {
  id: string;
  name: string;
  source_type: string;
  config: {
    chat_id?: string;
    channel_id?: string;
  };
  is_active: boolean;
  created_at: string;
}

export function SimpleExternalDataSources({
  familyId,
  userId,
}: SimpleExternalDataSourcesProps) {
  const [userRole, setUserRole] = useState<'admin' | 'member'>('member');
  const [isLoading, setIsLoading] = useState(true);
  const [showConfigForm, setShowConfigForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(
    null
  );
  const [testMessage, setTestMessage] = useState('');

  // Form state
  const [config, setConfig] = useState<TelegramConfig & SlackConfig>({
    sourceName: '',
    chatId: '',
    channelId: '',
  });

  const [currentSourceType, setCurrentSourceType] = useState<
    'telegram' | 'slack'
  >('telegram');

  // Sources existantes
  const [existingSources, setExistingSources] = useState<ExternalDataSource[]>(
    []
  );
  const [isLoadingSources, setIsLoadingSources] = useState(true);

  useEffect(() => {
    async function fetchUserRole() {
      try {
        const { data, error } = await supabase
          .from('family_members')
          .select('role')
          .eq('family_id', familyId)
          .eq('user_id', userId)
          .single();

        if (error) {
          console.error('Error fetching user role:', error);
          setUserRole('member');
        } else {
          setUserRole(data?.role || 'member');
        }
      } catch (error) {
        console.error('Unexpected error:', error);
        setUserRole('member');
      } finally {
        setIsLoading(false);
      }
    }

    if (familyId && userId) {
      fetchUserRole();
    }
  }, [familyId, userId]);

  // Charger les sources existantes
  useEffect(() => {
    async function fetchExistingSources() {
      if (!familyId) return;

      try {
        setIsLoadingSources(true);
        const { data, error } = await supabase
          .from('external_data_sources')
          .select('*')
          .eq('family_id', familyId)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching sources:', error);
        } else {
          setExistingSources(data || []);
        }
      } catch (error) {
        console.error('Unexpected error fetching sources:', error);
      } finally {
        setIsLoadingSources(false);
      }
    }

    fetchExistingSources();
  }, [familyId]);

  const handleInputChange = (field: string, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const testConnection = async () => {
    if (currentSourceType === 'telegram') {
      if (!config.chatId) {
        setTestMessage('Please enter the chat ID first');
        setTestResult('error');
        return;
      }

      setIsTesting(true);
      setTestResult(null);
      setTestMessage('');

      try {
        // Test the chat ID format (should be a number, can be negative for groups)
        const chatId = parseInt(config.chatId);
        if (isNaN(chatId)) {
          throw new Error('Chat ID must be a valid number');
        }

        setTestResult('success');
        setTestMessage(
          `✅ Chat ID "${chatId}" is valid and ready to be configured.`
        );
      } catch (error) {
        console.error('Chat ID validation failed:', error);
        setTestResult('error');
        setTestMessage(`❌ Validation failed: ${error.message}`);
      } finally {
        setIsTesting(false);
      }
    } else if (currentSourceType === 'slack') {
      if (!config.channelId) {
        setTestMessage('Please enter the channel ID first');
        setTestResult('error');
        return;
      }

      setIsTesting(true);
      setTestResult(null);
      setTestMessage('');

      try {
        // Test the channel ID format (should start with C for channels)
        if (!config.channelId.startsWith('C')) {
          throw new Error('Channel ID must start with "C" (e.g., C1234567890)');
        }

        // Test real connection via API
        const result = await externalDataApi.testSlackConnection(config.channelId);
        
        if (result.success) {
          setTestResult('success');
          setTestMessage(
            `✅ Channel ID "${config.channelId}" is valid and accessible.`
          );
        } else {
          setTestResult('error');
          setTestMessage(`❌ Connection failed: ${result.error}`);
        }
      } catch (error) {
        console.error('Channel ID validation failed:', error);
        setTestResult('error');
        setTestMessage(`❌ Validation failed: ${error.message}`);
      } finally {
        setIsTesting(false);
      }
    }
  };

  const saveSource = async () => {
    if (currentSourceType === 'telegram') {
      if (!config.sourceName || !config.chatId) {
        setTestMessage('Please fill in source name and chat ID');
        setTestResult('error');
        return;
      }
    } else if (currentSourceType === 'slack') {
      if (!config.sourceName || !config.channelId) {
        setTestMessage('Please fill in source name and channel ID');
        setTestResult('error');
        return;
      }
    }

    setIsSaving(true);

    try {
      // Save to external_data_sources table
      const insertData = {
        family_id: familyId,
        source_type: currentSourceType,
        name: config.sourceName,
        config:
          currentSourceType === 'telegram'
            ? { chat_id: config.chatId }
            : { channel_id: config.channelId },
        is_active: true,
        created_by: userId,
      };

      const { data, error } = await supabase
        .from('external_data_sources')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setTestResult('success');
      setTestMessage(
        `✅ ${currentSourceType.charAt(0).toUpperCase() + currentSourceType.slice(1)} source "${config.sourceName}" configured successfully!`
      );

      // Recharger les sources
      const { data: updatedSources, error: fetchError } = await supabase
        .from('external_data_sources')
        .select('*')
        .eq('family_id', familyId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (!fetchError) {
        setExistingSources(updatedSources || []);
      }

      // Reset form after successful save
      setTimeout(() => {
        setShowConfigForm(false);
        setConfig({ sourceName: '', chatId: '', channelId: '' });
        setTestResult(null);
        setTestMessage('');
      }, 2000);
    } catch (error) {
      console.error(`Error saving ${currentSourceType} source:`, error);
      setTestMessage(`❌ Failed to save: ${error.message}`);
      setTestResult('error');
    } finally {
      setIsSaving(false);
    }
  };

  const editSource = (source: ExternalDataSource) => {
    setCurrentSourceType(source.source_type as 'telegram' | 'slack');
    setConfig({
      sourceName: source.name,
      chatId: source.config.chat_id || '',
      channelId: source.config.channel_id || '',
    });
    setShowConfigForm(true);
  };

  const deleteSource = async (sourceId: string) => {
    if (!confirm('Are you sure you want to delete this source?')) return;

    try {
      const { error } = await supabase
        .from('external_data_sources')
        .update({ is_active: false })
        .eq('id', sourceId);

      if (error) {
        throw error;
      }

      // Recharger les sources
      const { data: updatedSources, error: fetchError } = await supabase
        .from('external_data_sources')
        .select('*')
        .eq('family_id', familyId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (!fetchError) {
        setExistingSources(updatedSources || []);
      }
    } catch (error) {
      console.error('Error deleting source:', error);
      alert('Failed to delete source');
    }
  };

  if (isLoading) {
    return (
      <div className="text-center p-4 text-muted-foreground">Loading...</div>
    );
  }

  // Trouver les sources existantes par type
  const telegramSource = existingSources.find(
    s => s.source_type === 'telegram'
  );
  const slackSource = existingSources.find(s => s.source_type === 'slack');
  const whatsappSource = existingSources.find(
    s => s.source_type === 'whatsapp'
  );
  const gmailSource = existingSources.find(s => s.source_type === 'email');

  return (
    <div className="space-y-4">
      {/* Sources existantes */}
      <div className="border rounded-lg p-4 bg-gray-50">
        <div className="space-y-3">
          {/* Sources configurées */}
          {existingSources.map(source => (
            <div
              key={source.id}
              className="flex items-center justify-between p-3 bg-white rounded border"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    source.source_type === 'telegram'
                      ? 'bg-blue-100'
                      : source.source_type === 'slack'
                        ? 'bg-purple-100'
                        : 'bg-gray-100'
                  }`}
                >
                  {source.source_type === 'telegram' ? (
                    <img
                      src="/icons/connectors/telegram-logo-svgrepo-com.svg"
                      alt="Telegram"
                      className="w-4 h-4"
                    />
                  ) : source.source_type === 'slack' ? (
                    <img
                      src="/icons/connectors/slack-new-logo-logo-svgrepo-com.svg"
                      alt="Slack"
                      className="w-4 h-4"
                    />
                  ) : source.source_type === 'whatsapp' ? (
                    <img
                      src="/icons/connectors/whatsapp-icon-logo-svgrepo-com.svg"
                      alt="WhatsApp"
                      className="w-4 h-4"
                    />
                  ) : source.source_type === 'email' ? (
                    <img
                      src="/icons/connectors/gmail-icon-logo-svgrepo-com.svg"
                      alt="Gmail"
                      className="w-4 h-4"
                    />
                  ) : (
                    <svg
                      className="w-4 h-4 text-gray-600"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                  )}
                </div>
                <div>
                  <div className="font-medium">{source.name}</div>
                  <div className="text-sm text-gray-500 capitalize">
                    {source.source_type}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="default"
                  className="bg-green-100 text-green-800"
                >
                  Active
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => editSource(source)}
                >
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteSource(source.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}

          {/* Telegram - Non configuré */}
          {userRole === 'admin' && !telegramSource && (
            <div className="flex items-center justify-between p-3 bg-white rounded border">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-100">
                  <img
                    src="/icons/connectors/telegram-logo-svgrepo-com.svg"
                    alt="Telegram"
                    className="w-4 h-4"
                  />
                </div>
                <div>
                  <div className="font-medium">Telegram</div>
                  <div className="text-sm text-gray-500">Telegram</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCurrentSourceType('telegram');
                    setShowConfigForm(true);
                  }}
                >
                  Add source
                </Button>
              </div>
            </div>
          )}

          {/* Slack - Non configuré */}
          {userRole === 'admin' && !slackSource && (
            <div className="flex items-center justify-between p-3 bg-white rounded border">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-purple-100">
                  <img
                    src="/icons/connectors/slack-new-logo-logo-svgrepo-com.svg"
                    alt="Slack"
                    className="w-4 h-4"
                  />
                </div>
                <div>
                  <div className="font-medium">Slack</div>
                  <div className="text-sm text-gray-500">Slack</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Rediriger vers l'OAuth Slack avec l'ID de la famille
                    const oauthUrl = `https://slack.com/oauth/v2/authorize?client_id=486639851300.9450150412581&scope=files:read,channels:read,users:read,chat:write&redirect_uri=${encodeURIComponent(`https://memento-ruddy.vercel.app/api/slack-oauth`)}&state=${familyId}`;
                    window.open(oauthUrl, '_blank');
                  }}
                >
                  Connecter à Slack
                </Button>
              </div>
            </div>
          )}

          {/* WhatsApp - Coming Soon */}
          {userRole === 'admin' && (
            <div className="flex items-center justify-between p-3 bg-white rounded border opacity-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green-100">
                  <img
                    src="/icons/connectors/whatsapp-icon-logo-svgrepo-com.svg"
                    alt="WhatsApp"
                    className="w-4 h-4"
                  />
                </div>
                <div>
                  <div className="font-medium">WhatsApp</div>
                  <div className="text-sm text-gray-500">WhatsApp</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  Coming Soon
                </Badge>
              </div>
            </div>
          )}

          {/* Gmail - Coming Soon */}
          {userRole === 'admin' && (
            <div className="flex items-center justify-between p-3 bg-white rounded border opacity-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-red-100">
                  <img
                    src="/icons/connectors/gmail-icon-logo-svgrepo-com.svg"
                    alt="Gmail"
                    className="w-4 h-4"
                  />
                </div>
                <div>
                  <div className="font-medium">Gmail</div>
                  <div className="text-sm text-gray-500">Gmail</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  Coming Soon
                </Badge>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Configuration Form */}
      {showConfigForm && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <h3 className="text-lg font-semibold mb-4">
            {currentSourceType === 'telegram'
              ? telegramSource
                ? 'Edit Telegram Source'
                : 'Configure Telegram Source'
              : slackSource
                ? 'Edit Slack Source'
                : 'Configure Slack Source'}
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Source Name
              </label>
              <input
                type="text"
                placeholder="Ex: Family Telegram Bot"
                className="w-full p-2 border rounded"
                value={config.sourceName}
                onChange={e => handleInputChange('sourceName', e.target.value)}
              />
            </div>

            {currentSourceType === 'telegram' ? (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Chat ID
                </label>
                <input
                  type="text"
                  placeholder="Ex: -1001234567890"
                  className="w-full p-2 border rounded"
                  value={config.chatId}
                  onChange={e => handleInputChange('chatId', e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  The bot token is configured centrally and securely.
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Channel ID
                </label>
                <input
                  type="text"
                  placeholder="Ex: C1234567890"
                  className="w-full p-2 border rounded"
                  value={config.channelId}
                  onChange={e => handleInputChange('channelId', e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  The bot token is configured centrally and securely.
                </p>
              </div>
            )}

            {/* Test Result Message */}
            {testMessage && (
              <div
                className={`p-3 rounded text-sm ${
                  testResult === 'success'
                    ? 'bg-green-100 text-green-800 border border-green-200'
                    : 'bg-red-100 text-red-800 border border-red-200'
                }`}
              >
                {testMessage}
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                className="bg-blue-500 hover:bg-blue-600"
                onClick={testConnection}
                disabled={isTesting || isSaving}
              >
                {isTesting ? 'Testing...' : 'Test Connection'}
              </Button>
              <Button
                className="bg-green-500 hover:bg-green-600"
                onClick={saveSource}
                disabled={isSaving || isTesting}
              >
                {isSaving
                  ? 'Saving...'
                  : (
                        currentSourceType === 'telegram'
                          ? telegramSource
                          : slackSource
                      )
                    ? 'Update'
                    : 'Save'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowConfigForm(false);
                  setConfig({ sourceName: '', chatId: '', channelId: '' });
                  setTestResult(null);
                  setTestMessage('');
                }}
                disabled={isSaving || isTesting}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
