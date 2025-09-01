#!/usr/bin/env node

// 🧪 Test du Double Upload - Diagnostic
// Ce script teste le système de double upload pour identifier le problème

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { SecureImageUploadService } from '../src/utils/secure-image-upload.ts';

// Charger les variables d'environnement
config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testDoubleUpload() {
  console.log('🧪 Test du Double Upload - Diagnostic');
  console.log('=====================================\n');

  try {
    // 1. Test de connexion aux buckets
    console.log('1. 🔍 Test de connexion aux buckets...');
    
    const bucketsToTest = ['post-images-original', 'post-images-display'];
    
    for (const bucketName of bucketsToTest) {
      try {
        const { data: files, error } = await supabase.storage
          .from(bucketName)
          .list('', { limit: 5 });
        
        if (error) {
          console.log(`   ❌ ${bucketName}: ${error.message}`);
        } else {
          console.log(`   ✅ ${bucketName}: ${files?.length || 0} fichiers`);
        }
      } catch (error) {
        console.log(`   ❌ Exception ${bucketName}: ${error.message}`);
      }
    }

    // 2. Test d'upload simple dans chaque bucket
    console.log('\n2. 📤 Test d\'upload simple dans chaque bucket...');
    
    const testContent = 'Test content for bucket access';
    const testFileName = `test-${Date.now()}.txt`;
    
    for (const bucketName of bucketsToTest) {
      try {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(`test/${testFileName}`, testContent, {
            contentType: 'text/plain',
            upsert: false
          });

        if (uploadError) {
          console.log(`   ❌ Upload ${bucketName}: ${uploadError.message}`);
        } else {
          console.log(`   ✅ Upload ${bucketName}: ${uploadData.path}`);
          
          // Nettoyer
          await supabase.storage
            .from(bucketName)
            .remove([`test/${testFileName}`]);
          console.log(`   🧹 Fichier de test supprimé de ${bucketName}`);
        }
      } catch (error) {
        console.log(`   ❌ Exception upload ${bucketName}: ${error.message}`);
      }
    }

    // 3. Test du service SecureImageUploadService
    console.log('\n3. 🔒 Test du service SecureImageUploadService...');
    
    try {
      // Créer une image de test simple
      const canvas = new (require('canvas').Canvas)(100, 100);
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ff6b6b';
      ctx.fillRect(0, 0, 100, 100);
      ctx.fillStyle = '#ffffff';
      ctx.font = '20px Arial';
      ctx.fillText('TEST', 25, 55);
      
      const imageBuffer = canvas.toBuffer('image/png');
      const testImage = new File([imageBuffer], 'test-image.png', { type: 'image/png' });
      
      console.log('   ✅ Image de test créée: 100x100px PNG');
      
      // Test du double upload
      const service = SecureImageUploadService.getInstance();
      const result = await service.uploadWithCompression(
        testImage,
        'test-user-id',
        'test-family-id'
      );
      
      console.log('   ✅ Double upload réussi !');
      console.log(`      Image ID: ${result.imageId}`);
      console.log(`      Original URL: ${result.originalUrl}`);
      console.log(`      Display URL: ${result.displayUrl}`);
      console.log(`      Compression: ${result.compressionRatio}`);
      
      // Vérifier que les fichiers existent
      console.log('\n4. 🔍 Vérification des fichiers uploadés...');
      
      for (const bucketName of bucketsToTest) {
        try {
          const { data: files, error } = await supabase.storage
            .from(bucketName)
            .list('test-family-id/test-user-id', { limit: 10 });
          
          if (error) {
            console.log(`   ❌ Liste ${bucketName}: ${error.message}`);
          } else {
            console.log(`   ✅ ${bucketName}: ${files?.length || 0} fichiers`);
            if (files && files.length > 0) {
              files.forEach(file => {
                console.log(`     - ${file.name} (${file.metadata?.size || 'Taille inconnue'} bytes)`);
              });
            }
          }
        } catch (error) {
          console.log(`   ❌ Exception liste ${bucketName}: ${error.message}`);
        }
      }
      
      // Nettoyer les fichiers de test
      console.log('\n5. 🧹 Nettoyage des fichiers de test...');
      
      try {
        await service.deleteImages([result.imageId], 'test-user-id', 'test-family-id');
        console.log('   ✅ Fichiers de test supprimés');
      } catch (error) {
        console.log('   ❌ Erreur lors du nettoyage:', error.message);
      }
      
    } catch (error) {
      console.log('   ❌ Test du service échoué:', error.message);
      
      // Test manuel des méthodes individuelles
      console.log('\n   🔍 Test des méthodes individuelles...');
      
      try {
        const service = SecureImageUploadService.getInstance();
        
        // Test de validation
        const testFile = new File(['test'], 'test.txt', { type: 'text/plain' });
        const validation = await service.validateFileSecurity(testFile);
        console.log(`      Validation: ${validation.isValid ? '✅' : '❌'}`);
        if (!validation.isValid) {
          console.log(`      Erreurs: ${validation.errors.join(', ')}`);
        }
        
      } catch (validationError) {
        console.log(`      ❌ Validation échouée: ${validationError.message}`);
      }
    }

    // 6. Analyse finale
    console.log('\n📊 Analyse Finale');
    console.log('==================');
    
    console.log('🎯 Test du double upload terminé !');
    console.log('💡 Vérifiez les logs ci-dessus pour identifier le problème');
    
  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

// Exécuter le test
testDoubleUpload().catch(console.error);
