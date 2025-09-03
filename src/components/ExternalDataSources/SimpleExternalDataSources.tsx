import { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabase/client';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

interface SimpleExternalDataSourcesProps {
  familyId: string;
  userId: string;
}

interface TelegramConfig {
  sourceName: string;
  botToken: string;
  chatId: string;
}

interface ExternalDataSource {
  id: string;
  name: string;
  source_type: string;
  config: {
    bot_token?: string;
    chat_id?: string;
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
  const [config, setConfig] = useState<TelegramConfig>({
    sourceName: '',
    botToken: '',
    chatId: '',
  });

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

  const handleInputChange = (field: keyof TelegramConfig, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const testTelegramConnection = async () => {
    if (!config.botToken || !config.chatId) {
      setTestMessage('Please fill in Bot Token and Chat ID first');
      setTestResult('error');
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    setTestMessage('');

    try {
      // Test the bot token by getting bot info
      const botInfoResponse = await fetch(
        `https://api.telegram.org/bot${config.botToken}/getMe`
      );

      if (!botInfoResponse.ok) {
        throw new Error('Invalid bot token');
      }

      const botInfo = await botInfoResponse.json();

      if (!botInfo.ok) {
        throw new Error(botInfo.description || 'Bot token validation failed');
      }

      // Test sending a message to the chat
      const messageResponse = await fetch(
        `https://api.telegram.org/bot${config.botToken}/sendMessage`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: config.chatId,
            text: '🔗 Connection test successful! This bot is now connected to your family album.',
            parse_mode: 'HTML',
          }),
        }
      );

      if (!messageResponse.ok) {
        const errorData = await messageResponse.json();
        throw new Error(errorData.description || 'Failed to send test message');
      }

      setTestResult('success');
      setTestMessage(
        `✅ Connection successful! Bot "${botInfo.result.username}" is ready.`
      );
    } catch (error) {
      console.error('Telegram connection test failed:', error);
      setTestResult('error');
      setTestMessage(`❌ Connection failed: ${error.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const saveTelegramSource = async () => {
    if (!config.sourceName || !config.botToken || !config.chatId) {
      setTestMessage('Please fill in all fields');
      setTestResult('error');
      return;
    }

    setIsSaving(true);

    try {
      // Save to external_data_sources table
      const { data, error } = await supabase
        .from('external_data_sources')
        .insert({
          family_id: familyId,
          source_type: 'telegram',
          name: config.sourceName,
          config: {
            bot_token: config.botToken,
            chat_id: config.chatId,
          },
          is_active: true,
          created_by: userId,
        });

      if (error) {
        throw error;
      }

      setTestMessage('✅ Telegram source saved successfully!');
      setTestResult('success');

      // Recharger les sources existantes
      const { data: newSources, error: fetchError } = await supabase
        .from('external_data_sources')
        .select('*')
        .eq('family_id', familyId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (!fetchError) {
        setExistingSources(newSources || []);
      }

      // Reset form after successful save
      setTimeout(() => {
        setShowConfigForm(false);
        setConfig({ sourceName: '', botToken: '', chatId: '' });
        setTestResult(null);
        setTestMessage('');
      }, 2000);
    } catch (error) {
      console.error('Error saving Telegram source:', error);
      setTestMessage(`❌ Failed to save: ${error.message}`);
      setTestResult('error');
    } finally {
      setIsSaving(false);
    }
  };

  const editSource = (source: ExternalDataSource) => {
    setConfig({
      sourceName: source.name,
      botToken: source.config.bot_token || '',
      chatId: source.config.chat_id || '',
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
  const whatsappSource = existingSources.find(
    s => s.source_type === 'whatsapp'
  );
  const gmailSource = existingSources.find(s => s.source_type === 'email');

  return (
    <div className="space-y-4">
      {/* Content */}
      <div className="text-center p-6">
        {userRole === 'admin' && (
          <div className="flex flex-wrap justify-center gap-4">
            {/* Telegram - Active avec vraie icône */}
            <Button
              variant="outline"
              className="flex flex-col items-center gap-2 p-4 h-auto min-w-[120px] hover:bg-blue-50 hover:border-blue-300"
              onClick={() => setShowConfigForm(true)}
            >
              <svg
                className="h-10 w-10 text-blue-600"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z" />
              </svg>
              <span className="text-sm font-medium">Telegram</span>
              {telegramSource && (
                <Badge
                  variant="default"
                  className="text-xs bg-green-100 text-green-800"
                >
                  Configured
                </Badge>
              )}
            </Button>

            {/* WhatsApp - Coming Soon avec vraie icône */}
            <div className="flex flex-col items-center gap-2 p-4 h-auto min-w-[120px] opacity-50 cursor-not-allowed">
              <svg
                className="h-8 w-8 text-green-600"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
              </svg>
              <span className="text-sm font-medium">WhatsApp</span>
              <Badge variant="secondary" className="text-xs">
                Coming Soon
              </Badge>
            </div>

            {/* Gmail - Coming Soon avec vraie icône */}
            <div className="flex flex-col items-center gap-2 p-4 h-auto min-w-[120px] opacity-50 cursor-not-allowed">
              <svg
                className="h-8 w-8 text-red-600"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.364V5.457c0-.904.732-1.636 1.636-1.636h3.819v9.273L12 7.27l6.545 4.91V3.82h3.819A1.636 1.636 0 0 1 24 5.457z" />
              </svg>
              <span className="text-sm font-medium">Gmail</span>
              <Badge variant="secondary" className="text-xs">
                Coming Soon
              </Badge>
            </div>
          </div>
        )}
      </div>

      {/* Sources existantes */}
      {existingSources.length > 0 && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <h4 className="text-md font-semibold mb-3">Configured Sources</h4>
          <div className="space-y-3">
            {existingSources.map(source => (
              <div
                key={source.id}
                className="flex items-center justify-between p-3 bg-white rounded border"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-blue-600"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z" />
                    </svg>
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
          </div>
        </div>
      )}

      {/* Configuration Form */}
      {showConfigForm && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <h3 className="text-lg font-semibold mb-4">
            {telegramSource
              ? 'Edit Telegram Source'
              : 'Configure Telegram Source'}
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

            <div>
              <label className="block text-sm font-medium mb-2">
                Bot Token
              </label>
              <input
                type="password"
                placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                className="w-full p-2 border rounded"
                value={config.botToken}
                onChange={e => handleInputChange('botToken', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Chat ID</label>
              <input
                type="text"
                placeholder="Ex: -1001234567890"
                className="w-full p-2 border rounded"
                value={config.chatId}
                onChange={e => handleInputChange('chatId', e.target.value)}
              />
            </div>

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
                onClick={testTelegramConnection}
                disabled={isTesting || isSaving}
              >
                {isTesting ? 'Testing...' : 'Test Connection'}
              </Button>
              <Button
                className="bg-green-500 hover:bg-green-600"
                onClick={saveTelegramSource}
                disabled={isSaving || isTesting}
              >
                {isSaving ? 'Saving...' : telegramSource ? 'Update' : 'Save'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowConfigForm(false);
                  setConfig({ sourceName: '', botToken: '', chatId: '' });
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
