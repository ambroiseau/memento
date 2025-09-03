import React from 'react';
import { Bot, MessageCircle, Mail, Settings } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { ExternalDataSourcesManager } from '../ExternalDataSources/ExternalDataSourcesManager';

interface ExternalDataSourcesTabProps {
  familyId: string;
  userRole: 'admin' | 'member';
}

export function ExternalDataSourcesTab({
  familyId,
  userRole,
}: ExternalDataSourcesTabProps) {
  return (
    <div className="space-y-6">
      {/* En-tête avec informations */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Sources de données externes</h3>
          <p className="text-sm text-muted-foreground">
            Configurez des sources pour récupérer automatiquement des médias dans votre album familial
          </p>
        </div>

        {/* Types de sources supportées */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-2 border-blue-200 bg-blue-50/50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-base">Telegram</CardTitle>
                <Badge variant="secondary" className="text-xs">Disponible</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground">
                Récupérez automatiquement les médias de vos conversations Telegram familiales
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-gray-200 bg-gray-50/50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-gray-600" />
                <CardTitle className="text-base">WhatsApp</CardTitle>
                <Badge variant="outline" className="text-xs">Bientôt</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground">
                Intégration WhatsApp Business API (disponible prochainement)
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-gray-200 bg-gray-50/50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-gray-600" />
                <CardTitle className="text-base">Email</CardTitle>
                <Badge variant="outline" className="text-xs">Bientôt</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground">
                Récupération automatique depuis vos emails familiaux
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Guide rapide */}
        <Card className="border-2 border-green-200 bg-green-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-green-800">
              🚀 Guide de démarrage rapide
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-sm text-green-700 space-y-2">
              <p><strong>1.</strong> Créez un bot Telegram avec @BotFather</p>
              <p><strong>2.</strong> Ajoutez-le à votre conversation familiale</p>
              <p><strong>3.</strong> Configurez la source dans Memento</p>
              <p><strong>4.</strong> Les médias arrivent automatiquement !</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 border-green-300 text-green-700 hover:bg-green-100"
              onClick={() => window.open('/docs/TELEGRAM_INTEGRATION_GUIDE.md', '_blank')}
            >
              <Settings className="h-4 w-4 mr-2" />
              Guide complet
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Gestionnaire des sources */}
      <ExternalDataSourcesManager
        familyId={familyId}
        userRole={userRole}
      />

      {/* Informations supplémentaires */}
      <Card className="border-2 border-orange-200 bg-orange-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-orange-800">
            ℹ️ Informations importantes
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-sm text-orange-700 space-y-2">
            <p>
              <strong>• Sécurité :</strong> Seuls les administrateurs de la famille peuvent configurer les sources
            </p>
            <p>
              <strong>• Confidentialité :</strong> Chaque famille ne voit que ses propres sources et médias
            </p>
            <p>
              <strong>• Stockage :</strong> Les médias sont stockés de manière sécurisée dans votre espace familial
            </p>
            <p>
              <strong>• Support :</strong> En cas de problème, consultez la documentation ou contactez le support
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
