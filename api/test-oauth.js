export default async function handler(req, res) {
  // Endpoint de test pour vérifier que l'OAuth fonctionne
  const { family_id } = req.query;

  console.log('Test OAuth endpoint called with family_id:', family_id);

  if (!family_id) {
    return res.status(400).json({ error: 'Family ID manquant' });
  }

  // Simuler une réponse OAuth réussie
  return res.json({
    success: true,
    message: 'Test OAuth endpoint fonctionne',
    family_id: family_id,
    timestamp: new Date().toISOString(),
  });
}
