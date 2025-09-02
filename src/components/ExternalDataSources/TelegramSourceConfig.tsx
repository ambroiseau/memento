import React, { useState, useEffect } from 'react';
import { Bot, MessageCircle, Settings, TestTube, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Alert, AlertDescription } from '../ui/alert';
import { externalDataApi } from '../../utils/external-data-api';
import type { ExternalDataSource, ExternalDataSourceConfig, TelegramBotSetupData } from '../../types/telegram-integration';

interface TelegramSourceConfigProps {
  familyId: string;
  existingSource?: ExternalDataSource;
  onSave: (source: ExternalDataSource) => void;
  onCancel: () => void;
  onDelete?: (sourceId: string) => void;
}

export function TelegramSourceConfig({
  familyId,
  existingSource,
  onSave,
  onCancel,
  onDelete,
}: TelegramSourceConfigProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState(existingSource?.name || '');
  const [botToken, setBotToken] = useState(existingSource?.config.bot_token || '');
  const [chatId, setChatId] = useState(existingSource?.config.chat_id || '');
  const [description, setDescription] = useState(existingSource?.config.description || '');

  // Chat selection state
  const [chatSelection, setChatSelection] = useState<'existing' | 'new'>('existing');
  const [chatTitle, setChatTitle] = useState(existingSource?.config.chat_title || '');

  // Validation state
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    botValid: boolean;
    chatAccessible: boolean;
    error?: string;
  } | null>(null);

  useEffect(() => {
    if (existingSource) {
      setName(existingSource.name);
      setBotToken(existingSource.config.bot_token || '');
      setChatId(existingSource.config.chat_id || '');
      setDescription(existingSource.config.description || '');
      setChatTitle(existingSource.config.chat_title || '');
    }
  }, [existingSource]);

  const validateForm = (): boolean => {
    if (!name.trim()) {
      setError('Le nom de la source est requis');
      return false;
    }
    if (!botToken.trim()) {
      setError('Le token du bot est requis');
      return false;
    }
    if (!chatId.trim()) {
      setError('L\'ID du chat est requis');
      return false;
    }
    return true;
  };

  const handleTestConnection = async () => {
    if (!botToken.trim() || !chatId.trim()) {
      setError('Veuillez remplir le token du bot et l\'ID du chat avant de tester');
      return;
    }

    setIsTesting(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await externalDataApi.testTelegramConnection(botToken, chatId);
      
      if (result.success) {
        setSuccess('✅ Connexion réussie ! Le bot peut accéder au chat.');
        setValidationResult({
          botValid: true,
          chatAccessible: true,
        });
      } else {
        setError(`❌ Échec de la connexion : ${result.error}`);
        setValidationResult({
          botValid: false,
          chatAccessible: false,
          error: result.error,
        });
      }
    } catch (error) {
      setError('Erreur lors du test de connexion');
      console.error('Test connection error:', error);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const config: ExternalDataSourceConfig = {
        description: description.trim() || undefined,
        bot_token: botToken.trim(),
        chat_id: chatId.trim(),
        chat_title: chatTitle.trim() || undefined,
      };

      if (existingSource) {
        // Update existing source
        const result = await externalDataApi.updateExternalDataSource(
          existingSource.id,
          {
            name: name.trim(),
            config,
          }
        );

        if (result.success && result.data) {
          setSuccess('Source mise à jour avec succès !');
          onSave(result.data);
        } else {
          setError(result.error || 'Erreur lors de la mise à jour');
        }
      } else {
        // Create new source
        const result = await externalDataApi.createExternalDataSource({
          family_id: familyId,
          type: 'telegram',
          name: name.trim(),
          config,
        });

        if (result.success && result.data) {
          setSuccess('Source créée avec succès !');
          onSave(result.data);
        } else {
          setError(result.error || 'Erreur lors de la création');
        }
      }
    } catch (error) {
      setError('Erreur inattendue');
      console.error('Save error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!existingSource || !onDelete) return;

    if (!confirm('Êtes-vous sûr de vouloir supprimer cette source ? Cette action est irréversible.')) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await externalDataApi.deleteExternalDataSource(existingSource.id);
      
      if (result.success) {
        onDelete(existingSource.id);
      } else {
        setError(result.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      setError('Erreur inattendue');
      console.error('Delete error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Bot className="h-6 w-6 text-blue-600" />
          <div>
            <CardTitle>
              {existingSource ? 'Modifier la source Telegram' : 'Nouvelle source Telegram'}
            </CardTitle>
            <CardDescription>
              Configurez une source Telegram pour récupérer automatiquement les médias
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Messages d'état */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Formulaire de configuration */}
        <div className="space-y-4">
          {/* Nom de la source */}
          <div className="space-y-2">
            <Label htmlFor="source-name">Nom de la source *</Label>
            <Input
              id="source-name"
              placeholder="ex: Conversation familiale"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="source-description">Description (optionnel)</Label>
            <Textarea
              id="source-description"
              placeholder="Description de cette source..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
              rows={2}
            />
          </div>

          {/* Token du bot */}
          <div className="space-y-2">
            <Label htmlFor="bot-token">Token du bot Telegram *</Label>
            <div className="flex gap-2">
              <Input
                id="bot-token"
                type="password"
                placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setBotToken('')}
                disabled={isLoading}
              >
                Effacer
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Obtenez ce token en créant un bot avec @BotFather sur Telegram
            </p>
          </div>

          {/* Sélection du chat */}
          <div className="space-y-2">
            <Label>Chat à surveiller</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="chat-selection"
                  value="existing"
                  checked={chatSelection === 'existing'}
                  onChange={(e) => setChatSelection(e.target.value as 'existing' | 'new')}
                  disabled={isLoading}
                />
                Chat existant
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="chat-selection"
                  value="new"
                  checked={chatSelection === 'new'}
                  onChange={(e) => setChatSelection(e.target.value as 'existing' | 'new')}
                  disabled={isLoading}
                />
                Nouveau chat
              </label>
            </div>
          </div>

          {/* ID du chat */}
          <div className="space-y-2">
            <Label htmlFor="chat-id">ID du chat *</Label>
            <Input
              id="chat-id"
              placeholder={chatSelection === 'existing' ? "ex: -1001234567890" : "ex: @username ou -1001234567890"}
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-sm text-muted-foreground">
              {chatSelection === 'existing' 
                ? 'ID numérique du chat (groupe, canal, etc.)'
                : 'Username ou ID du chat à créer'
              }
            </p>
          </div>

          {/* Titre du chat (pour nouveau chat) */}
          {chatSelection === 'new' && (
            <div className="space-y-2">
              <Label htmlFor="chat-title">Titre du chat (optionnel)</Label>
              <Input
                id="chat-title"
                placeholder="ex: Album familial Memento"
                value={chatTitle}
                onChange={(e) => setChatTitle(e.target.value)}
                disabled={isLoading}
              />
            </div>
          )}
        </div>

        <Separator />

        {/* Test de connexion */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Test de connexion</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTestConnection}
              disabled={isTesting || !botToken.trim() || !chatId.trim()}
            >
              <TestTube className="h-4 w-4 mr-2" />
              {isTesting ? 'Test en cours...' : 'Tester'}
            </Button>
          </div>

          {validationResult && (
            <div className="p-3 bg-muted rounded-md">
              <div className="flex items-center gap-2 text-sm">
                <span className={validationResult.botValid ? 'text-green-600' : 'text-red-600'}>
                  {validationResult.botValid ? '✅' : '❌'} Bot
                </span>
                <span className={validationResult.chatAccessible ? 'text-green-600' : 'text-red-600'}>
                  {validationResult.chatAccessible ? '✅' : '❌'} Chat
                </span>
                {validationResult.error && (
                  <span className="text-red-600 text-xs ml-2">
                    {validationResult.error}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          {existingSource && onDelete && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </Button>
          )}
          
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Annuler
          </Button>
          
          <Button
            type="button"
            onClick={handleSave}
            disabled={isLoading || !name.trim() || !botToken.trim() || !chatId.trim()}
          >
            <Settings className="h-4 w-4 mr-2" />
            {isLoading ? 'Enregistrement...' : existingSource ? 'Mettre à jour' : 'Créer'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
