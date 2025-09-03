import {
  Bot,
  Eye,
  EyeOff,
  Mail,
  MessageCircle,
  Plus,
  RefreshCw,
  Settings,
  Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type {
  ExternalDataSource,
  ExternalMedia,
} from '../../types/telegram-integration';
import { externalDataApi } from '../../utils/external-data-api';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { TelegramSourceConfig } from './TelegramSourceConfig';

interface ExternalDataSourcesManagerProps {
  familyId: string;
  userRole: 'admin' | 'member';
}

export function ExternalDataSourcesManager({
  familyId,
  userRole,
}: ExternalDataSourcesManagerProps) {
  const [sources, setSources] = useState<ExternalDataSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSource, setEditingSource] = useState<ExternalDataSource | null>(
    null
  );
  const [selectedSource, setSelectedSource] = useState<string | null>(null);

  // Media state
  const [sourceMedia, setSourceMedia] = useState<
    Record<string, ExternalMedia[]>
  >({});
  const [mediaLoading, setMediaLoading] = useState<Record<string, boolean>>({});

  const isAdmin = userRole === 'admin';

  // Debug: afficher les valeurs dans la console au montage
  useEffect(() => {
    console.log('🔍 ExternalDataSourcesManager Debug:', {
      userRole,
      userRoleType: typeof userRole,
      isAdmin,
      familyId,
      comparison: userRole === 'admin',
      strictComparison: userRole === 'admin',
    });
  }, [userRole, familyId]);

  // Charger les sources de données
  const loadSources = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result =
        await externalDataApi.getFamilyExternalDataSources(familyId);

      if (result.success) {
        setSources(result.data || []);
      } else {
        setError(result.error || 'Erreur lors du chargement des sources');
      }
    } catch (error) {
      setError('Erreur inattendue');
      console.error('Load sources error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les médias d'une source
  const loadSourceMedia = async (sourceId: string) => {
    if (sourceMedia[sourceId]) return; // Déjà chargé

    setMediaLoading(prev => ({ ...prev, [sourceId]: true }));

    try {
      const result = await externalDataApi.getExternalMedia(sourceId, 1, 10);

      if (result.success) {
        setSourceMedia(prev => ({
          ...prev,
          [sourceId]: result.data || [],
        }));
      }
    } catch (error) {
      console.error('Load media error:', error);
    } finally {
      setMediaLoading(prev => ({ ...prev, [sourceId]: false }));
    }
  };

  // Gérer la création/mise à jour d'une source
  const handleSaveSource = (source: ExternalDataSource) => {
    if (editingSource) {
      // Mise à jour
      setSources(prev => prev.map(s => (s.id === source.id ? source : s)));
      setEditingSource(null);
    } else {
      // Création
      setSources(prev => [source, ...prev]);
      setShowCreateForm(false);
    }

    // Recharger les sources pour avoir les données à jour
    loadSources();
  };

  // Gérer la suppression d'une source
  const handleDeleteSource = async (sourceId: string) => {
    try {
      const result = await externalDataApi.deleteExternalDataSource(sourceId);

      if (result.success) {
        setSources(prev => prev.filter(s => s.id !== sourceId));
        setSourceMedia(prev => {
          const newMedia = { ...prev };
          delete newMedia[sourceId];
          return newMedia;
        });
      } else {
        setError(result.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      setError('Erreur inattendue');
      console.error('Delete source error:', error);
    }
  };

  // Activer/désactiver une source
  const handleToggleSource = async (sourceId: string, isActive: boolean) => {
    try {
      const result = await externalDataApi.toggleExternalDataSource(
        sourceId,
        isActive
      );

      if (result.success && result.data) {
        setSources(prev =>
          prev.map(s => (s.id === sourceId ? { ...s, is_active: isActive } : s))
        );
      } else {
        setError(result.error || 'Erreur lors de la modification');
      }
    } catch (error) {
      setError('Erreur inattendue');
      console.error('Toggle source error:', error);
    }
  };

  // Charger les données au montage
  useEffect(() => {
    loadSources();
  }, [familyId]);

  // Charger les médias quand une source est sélectionnée
  useEffect(() => {
    if (selectedSource) {
      loadSourceMedia(selectedSource);
    }
  }, [selectedSource]);

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'telegram':
        return <Bot className="h-5 w-5" />;
      case 'whatsapp':
        return <MessageCircle className="h-5 w-5" />;
      case 'email':
        return <Mail className="h-5 w-5" />;
      default:
        return <Settings className="h-5 w-5" />;
    }
  };

  const getSourceTypeLabel = (type: string) => {
    switch (type) {
      case 'telegram':
        return 'Telegram';
      case 'whatsapp':
        return 'WhatsApp';
      case 'email':
        return 'Email';
      default:
        return type;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            Chargement des sources de données...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Sources de données externes</h2>
          <p className="text-muted-foreground">
            Configurez des sources pour récupérer automatiquement des médias
          </p>
        </div>

        {isAdmin && (
          <Button
            onClick={() => setShowCreateForm(true)}
            disabled={showCreateForm}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle source
          </Button>
        )}
      </div>

      {/* Messages d'erreur */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Formulaire de création */}
      {showCreateForm && (
        <TelegramSourceConfig
          familyId={familyId}
          onSave={handleSaveSource}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {/* Formulaire de modification */}
      {editingSource && (
        <TelegramSourceConfig
          familyId={familyId}
          existingSource={editingSource}
          onSave={handleSaveSource}
          onCancel={() => setEditingSource(null)}
          onDelete={handleDeleteSource}
        />
      )}

      {/* Liste des sources */}
      {sources.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Bot className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">
              Aucune source configurée
            </h3>
            <p className="text-muted-foreground mb-4">
              Configurez votre première source pour commencer à récupérer des
              médias automatiquement
            </p>
            {isAdmin && (
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Configurer une source
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sources.map(source => (
            <Card key={source.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getSourceIcon(source.type)}
                    <div>
                      <CardTitle className="text-lg">{source.name}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Badge variant="outline">
                          {getSourceTypeLabel(source.type)}
                        </Badge>
                        {source.config.description && (
                          <span className="text-sm text-muted-foreground">
                            {source.config.description}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={source.is_active ? 'default' : 'secondary'}>
                      {source.is_active ? 'Active' : 'Inactive'}
                    </Badge>

                    {isAdmin && (
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleToggleSource(source.id, !source.is_active)
                          }
                        >
                          {source.is_active ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingSource(source)}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteSource(source.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                {/* Informations de la source */}
                <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground mb-4">
                  <div>
                    <span className="font-medium">Créée le :</span>{' '}
                    {new Date(source.created_at).toLocaleDateString('fr-FR')}
                  </div>
                  {source.last_sync_at && (
                    <div>
                      <span className="font-medium">Dernière sync :</span>{' '}
                      {new Date(source.last_sync_at).toLocaleDateString(
                        'fr-FR'
                      )}
                    </div>
                  )}
                </div>

                {/* Médias récents */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Médias récents</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setSelectedSource(
                          selectedSource === source.id ? null : source.id
                        )
                      }
                    >
                      {selectedSource === source.id ? 'Masquer' : 'Afficher'}
                    </Button>
                  </div>

                  {selectedSource === source.id && (
                    <div className="border rounded-md p-3 bg-muted/50">
                      {mediaLoading[source.id] ? (
                        <div className="flex items-center justify-center py-4">
                          <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                          Chargement des médias...
                        </div>
                      ) : sourceMedia[source.id]?.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2">
                          {sourceMedia[source.id].slice(0, 6).map(media => (
                            <div key={media.id} className="text-xs">
                              <div className="font-medium">
                                {media.media_type}
                              </div>
                              <div className="text-muted-foreground truncate">
                                {media.caption || 'Sans description'}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-muted-foreground">
                          Aucun média récupéré pour le moment
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
