#!/usr/bin/env node

// Script pour tester le token du bot Telegram
import dotenv from 'dotenv';

dotenv.config();

const botToken = process.env.TELEGRAM_BOT_TOKEN;

if (!botToken) {
  console.log('❌ TELEGRAM_BOT_TOKEN manquant dans .env');
  process.exit(1);
}

async function testTelegramBot() {
  try {
    console.log('🧪 Test du bot Telegram...\n');

    // 1. Test de base - getMe
    console.log('1️⃣ Test getMe...');
    const meResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/getMe`
    );
    const meData = await meResponse.json();

    if (meData.ok) {
      console.log('✅ Bot connecté:', meData.result);
      console.log(`   - ID: ${meData.result.id}`);
      console.log(`   - Nom: ${meData.result.first_name}`);
      console.log(`   - Username: @${meData.result.username}`);
      console.log(`   - Can join groups: ${meData.result.can_join_groups}`);
      console.log(
        `   - Can read all group messages: ${meData.result.can_read_all_group_messages}`
      );
    } else {
      console.log('❌ Erreur getMe:', meData.description);
      return;
    }

    // 2. Test des permissions
    console.log('\n2️⃣ Test des permissions...');
    const updatesResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/getUpdates?limit=1`
    );
    const updatesData = await updatesResponse.json();

    if (updatesData.ok) {
      console.log('✅ getUpdates fonctionne');
      console.log(`   - Updates disponibles: ${updatesData.result.length}`);

      if (updatesData.result.length > 0) {
        const update = updatesData.result[0];
        console.log('   - Dernier update:', {
          update_id: update.update_id,
          message_id: update.message?.message_id,
          chat_id: update.message?.chat?.id,
          chat_type: update.message?.chat?.type,
          has_photo: !!update.message?.photo,
          has_document: !!update.message?.document,
        });
      }
    } else {
      console.log('❌ Erreur getUpdates:', updatesData.description);
    }

    // 3. Test de téléchargement d'un fichier (si disponible)
    console.log('\n3️⃣ Test de téléchargement...');
    if (updatesData.ok && updatesData.result.length > 0) {
      const update = updatesData.result[0];

      if (update.message?.photo) {
        const photo = update.message.photo[update.message.photo.length - 1]; // Meilleure qualité
        console.log(`   - Photo trouvée: ${photo.file_id}`);

        // Test getFile
        const fileResponse = await fetch(
          `https://api.telegram.org/bot${botToken}/getFile?file_id=${photo.file_id}`
        );
        const fileData = await fileResponse.json();

        if (fileData.ok) {
          console.log('✅ getFile fonctionne');
          console.log(`   - File path: ${fileData.result.file_path}`);
          console.log(`   - File size: ${fileData.result.file_size} bytes`);

          // Test de téléchargement
          const downloadResponse = await fetch(
            `https://api.telegram.org/file/bot${botToken}/${fileData.result.file_path}`
          );
          if (downloadResponse.ok) {
            console.log('✅ Téléchargement réussi');
            console.log(
              `   - Content-Type: ${downloadResponse.headers.get('content-type')}`
            );
            console.log(
              `   - Content-Length: ${downloadResponse.headers.get('content-length')}`
            );
          } else {
            console.log(
              '❌ Erreur téléchargement:',
              downloadResponse.status,
              downloadResponse.statusText
            );
          }
        } else {
          console.log('❌ Erreur getFile:', fileData.description);
        }
      } else {
        console.log('ℹ️  Aucune photo dans le dernier update');
      }
    }

    console.log('\n✅ Test terminé !');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testTelegramBot();
