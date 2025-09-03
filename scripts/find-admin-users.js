#!/usr/bin/env node

// Script pour identifier les utilisateurs admin
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey =
  process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log("❌ Variables d'environnement manquantes");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function findAdminUsers() {
  try {
    console.log('🔍 Recherche des utilisateurs admin...\n');

    // 1. Vérifier la structure de la table family_members
    console.log('1️⃣ Structure de la table family_members...');
    const { data: familyMembers, error: familyError } = await supabase
      .from('family_members')
      .select('*')
      .limit(5);

    if (familyError) {
      console.log(
        '❌ Erreur récupération family_members:',
        familyError.message
      );
      return;
    }

    if (familyMembers && familyMembers.length > 0) {
      console.log(
        '📊 Structure family_members:',
        Object.keys(familyMembers[0])
      );
      console.log('📋 Exemple family_member:', familyMembers[0]);
    }

    // 2. Chercher les admins
    console.log('\n2️⃣ Recherche des utilisateurs admin...');

    // Essayer différentes colonnes possibles pour le rôle admin
    const possibleAdminColumns = [
      'role',
      'is_admin',
      'admin',
      'permissions',
      'access_level',
    ];

    for (const column of possibleAdminColumns) {
      try {
        const { data: admins, error: adminError } = await supabase
          .from('family_members')
          .select('*')
          .eq(column, 'admin')
          .limit(10);

        if (!adminError && admins && admins.length > 0) {
          console.log(
            `✅ Admins trouvés avec la colonne '${column}':`,
            admins.length
          );
          console.log(
            '👑 Admins:',
            admins.map(a => ({
              id: a.id,
              user_id: a.user_id,
              [column]: a[column],
            }))
          );
          break;
        }
      } catch (e) {
        // Colonne n'existe pas, continuer
      }
    }

    // 3. Vérifier s'il y a une colonne is_admin
    console.log('\n3️⃣ Vérification colonne is_admin...');
    const { data: allMembers, error: allError } = await supabase
      .from('family_members')
      .select('*')
      .limit(10);

    if (!allError && allMembers && allMembers.length > 0) {
      const sample = allMembers[0];
      console.log('📋 Colonnes disponibles:', Object.keys(sample));

      // Chercher des patterns admin
      const adminPatterns = ['admin', 'Admin', 'ADMIN', 'is_admin', 'role'];
      for (const pattern of adminPatterns) {
        const matchingColumns = Object.keys(sample).filter(col =>
          col.toLowerCase().includes(pattern.toLowerCase())
        );
        if (matchingColumns.length > 0) {
          console.log(`🔍 Colonnes contenant '${pattern}':`, matchingColumns);
        }
      }
    }

    // 4. Lister tous les utilisateurs pour inspection manuelle
    console.log('\n4️⃣ Tous les utilisateurs family_members...');
    const { data: allUsers, error: usersError } = await supabase
      .from('family_members')
      .select('*')
      .limit(20);

    if (!usersError && allUsers) {
      console.log('👥 Utilisateurs trouvés:', allUsers.length);
      allUsers.forEach((user, index) => {
        console.log(
          `   ${index + 1}. ID: ${user.id}, User ID: ${user.user_id}`
        );
        // Afficher les colonnes qui pourraient indiquer le rôle
        Object.entries(user).forEach(([key, value]) => {
          if (key !== 'id' && key !== 'user_id' && value !== null) {
            console.log(`       ${key}: ${value}`);
          }
        });
      });
    }

    console.log('\n✅ Recherche terminée !');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

findAdminUsers();
