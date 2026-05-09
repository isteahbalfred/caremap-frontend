import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';

interface CommitData {
  author: string;
  total: number;
  commits: { message: string; date: string; sha: string }[];
}

interface ReportData {
  generatedAt: string;
  project: string;
  team: CommitData[];
  stats: {
    totalCommits: number;
    totalFiles: number;
    backendCommits: number;
    frontendCommits: number;
  };
}

const GITHUB_OWNER = 'isteahbalfred';
const REPOS = [
  { name: 'caremap-backend', label: 'Backend' },
  { name: 'caremap-frontend', label: 'Frontend' },
];

export default function ReportGenerator() {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [error, setError] = useState('');

  const fetchCommits = async (repo: string) => {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${repo}/commits?per_page=100`
    );
    if (!res.ok) throw new Error(`Erreur GitHub: ${res.status}`);
    return res.json();
  };

  const generateReport = async () => {
    setLoading(true);
    setError('');
    try {
      const authorMap: Record<string, CommitData> = {};
      let backendCommits = 0;
      let frontendCommits = 0;

      for (const repo of REPOS) {
        const commits = await fetchCommits(repo.name);

        if (repo.name === 'caremap-backend') backendCommits = commits.length;
        if (repo.name === 'caremap-frontend') frontendCommits = commits.length;

        for (const commit of commits) {
          const author = commit.commit.author.name || 'Unknown';
          const message = commit.commit.message.split('\n')[0];
          const date = new Date(commit.commit.author.date).toLocaleDateString('fr-FR');

          if (!authorMap[author]) {
            authorMap[author] = { author, total: 0, commits: [] };
          }
          authorMap[author].total++;
          authorMap[author].commits.push({
            message: `[${repo.label}] ${message}`,
            date,
            sha: commit.sha.slice(0, 7),
          });
        }
      }

      const team = Object.values(authorMap).sort((a, b) => b.total - a.total);
      const totalCommits = team.reduce((sum, m) => sum + m.total, 0);

      setReportData({
        generatedAt: new Date().toLocaleDateString('fr-FR', {
          year: 'numeric', month: 'long', day: 'numeric',
          hour: '2-digit', minute: '2-digit',
        }),
        project: 'CareMap — Plateforme Médicale Haïti',
        team,
        stats: {
          totalCommits,
          totalFiles: 0,
          backendCommits,
          frontendCommits,
        },
      });
    } catch (err: any) {
      setError('Erreur lors de la récupération des données GitHub. Vérifiez la connexion.');
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    if (!reportData) return;

    const lines: string[] = [];
    lines.push('RAPPORT DE STAGE UNIVERSITAIRE');
    lines.push('================================');
    lines.push('');
    lines.push(`Projet     : ${reportData.project}`);
    lines.push(`Généré le  : ${reportData.generatedAt}`);
    lines.push(`Institution: ISTEAH`);
    lines.push('');
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    lines.push('1. RÉSUMÉ EXÉCUTIF');
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    lines.push('');
    lines.push('CareMap est une plateforme web médicale innovante développée pour');
    lines.push('répondre aux défis du système de santé haïtien. La plateforme permet');
    lines.push('aux citoyens de localiser des médicaments disponibles dans les pharmacies,');
    lines.push('de comparer les prix et de trouver les cliniques proches.');
    lines.push('');
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    lines.push('2. STATISTIQUES DE DÉVELOPPEMENT');
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    lines.push('');
    lines.push(`Total commits       : ${reportData.stats.totalCommits}`);
    lines.push(`Commits Backend     : ${reportData.stats.backendCommits}`);
    lines.push(`Commits Frontend    : ${reportData.stats.frontendCommits}`);
    lines.push(`Membres actifs      : ${reportData.team.length}`);
    lines.push('');
    lines.push('Stack technique:');
    lines.push('  Backend  : Node.js 20 + Express.js + TypeScript + Prisma + PostgreSQL');
    lines.push('  Frontend : React 18 + Vite + TypeScript + Tailwind CSS + Redux');
    lines.push('  Auth     : JWT (Access Token 15min + Refresh Token 7j)');
    lines.push('  Déploiement: Vercel (Frontend) + Render (Backend) + Neon (DB)');
    lines.push('');
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    lines.push('3. CONTRIBUTIONS PAR MEMBRE');
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    lines.push('');

    for (const member of reportData.team) {
      lines.push(`┌─────────────────────────────────────────────`);
      lines.push(`│ Développeur : ${member.author}`);
      lines.push(`│ Commits     : ${member.total}`);
      lines.push(`│ Pourcentage : ${((member.total / reportData.stats.totalCommits) * 100).toFixed(1)}%`);
      lines.push(`└─────────────────────────────────────────────`);
      lines.push('');
      lines.push('  Historique des contributions:');
      member.commits.slice(0, 20).forEach(c => {
        lines.push(`  • [${c.date}] (${c.sha}) ${c.message}`);
      });
      if (member.commits.length > 20) {
        lines.push(`  ... et ${member.commits.length - 20} autres commits`);
      }
      lines.push('');
    }

    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    lines.push('4. FONCTIONNALITÉS LIVRÉES (MVP V1.0)');
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    lines.push('');
    lines.push('BACKEND (API REST):');
    lines.push('  ✓ Authentification JWT (register, login, refresh, logout)');
    lines.push('  ✓ Gestion des pharmacies (CRUD + validation admin)');
    lines.push('  ✓ Recherche de médicaments (filtres, prix, disponibilité)');
    lines.push('  ✓ Gestion des stocks avec alertes automatiques');
    lines.push('  ✓ Module cliniques (CRUD)');
    lines.push('  ✓ Dashboard administrateur (stats, validation, users)');
    lines.push('  ✓ 13 tests unitaires (Jest)');
    lines.push('');
    lines.push('FRONTEND (React SPA):');
    lines.push('  ✓ Page accueil avec hero section');
    lines.push('  ✓ Recherche médicaments avec prix et stocks');
    lines.push('  ✓ Carte interactive (Leaflet) avec pharmacies et cliniques');
    lines.push('  ✓ Page cliniques avec recherche');
    lines.push('  ✓ Authentification (Login/Register)');
    lines.push('  ✓ Dashboard pharmacien avec gestion stock');
    lines.push('  ✓ Dashboard admin (stats, validations, users)');
    lines.push('');
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    lines.push('5. URLS EN PRODUCTION');
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    lines.push('');
    lines.push('  Frontend : https://caremap-frontend.vercel.app');
    lines.push('  Backend  : https://caremap-backend.onrender.com');
    lines.push('  API      : https://caremap-backend.onrender.com/api/v1');
    lines.push('  GitHub   : https://github.com/isteahbalfred');
    lines.push('');
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    lines.push('6. MÉTHODOLOGIE');
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    lines.push('');
    lines.push('  Méthode    : Agile/Scrum adapté (sprints de 2 semaines)');
    lines.push('  Sprints    : 4 sprints complétés');
    lines.push('  Outils     : GitHub Projects, Discord, VS Code');
    lines.push('  Versionning: Git Flow (main, develop, feature/*)');
    lines.push('');
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    lines.push('                  FIN DU RAPPORT');
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const content = lines.join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Rapport_Stage_CareMap_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="card mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          📄 Générateur de Rapport de Stage
        </h2>
        <p className="text-gray-500 mb-6">
          Compile automatiquement les contributions de chaque membre depuis GitHub
          et génère un rapport de stage complet.
        </p>

        <div className="flex gap-3">
          <Button onClick={generateReport} loading={loading}>
            {loading ? 'Analyse en cours...' : '🔍 Analyser les contributions GitHub'}
          </Button>
          {reportData && (
            <Button variant="secondary" onClick={downloadReport}>
              ⬇️ Télécharger le rapport (.txt)
            </Button>
          )}
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}
      </div>

      {loading && (
        <div className="card flex items-center gap-4">
          <Spinner />
          <div>
            <p className="font-medium text-gray-700">Analyse en cours...</p>
            <p className="text-sm text-gray-500">
              Récupération des commits depuis GitHub
            </p>
          </div>
        </div>
      )}

      {reportData && !loading && (
        <>
          {/* Stats globales */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total commits', value: reportData.stats.totalCommits, icon: '📊' },
              { label: 'Membres actifs', value: reportData.team.length, icon: '👥' },
              { label: 'Backend commits', value: reportData.stats.backendCommits, icon: '⚙️' },
              { label: 'Frontend commits', value: reportData.stats.frontendCommits, icon: '🎨' },
            ].map(s => (
              <div key={s.label} className="card text-center">
                <div className="text-2xl mb-1">{s.icon}</div>
                <div className="text-2xl font-bold text-primary-600">{s.value}</div>
                <div className="text-xs text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Contributions par membre */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-800">
              👥 Contributions par développeur
            </h3>
            {reportData.team.map(member => (
              <div key={member.author} className="card">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-gray-800">{member.author}</h4>
                    <p className="text-sm text-gray-500">
                      {member.total} commits —{' '}
                      {((member.total / reportData.stats.totalCommits) * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary-600">
                      {member.total}
                    </div>
                    <div className="text-xs text-gray-400">contributions</div>
                  </div>
                </div>

                {/* Barre de progression */}
                <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
                  <div
                    className="bg-primary-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${(member.total / reportData.stats.totalCommits) * 100}%`
                    }}
                  />
                </div>

                {/* Derniers commits */}
                <div className="space-y-1">
                  {member.commits.slice(0, 5).map((c, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-gray-400 font-mono text-xs mt-0.5">
                        {c.sha}
                      </span>
                      <span className="text-gray-600 flex-1">{c.message}</span>
                      <span className="text-gray-400 text-xs whitespace-nowrap">
                        {c.date}
                      </span>
                    </div>
                  ))}
                  {member.commits.length > 5 && (
                    <p className="text-xs text-gray-400 mt-1">
                      + {member.commits.length - 5} autres commits dans le rapport
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="card mt-6 bg-green-50 border-green-200">
            <p className="text-green-700 font-medium">
              ✅ Rapport prêt — {reportData.generatedAt}
            </p>
            <p className="text-green-600 text-sm mt-1">
              Clique sur "Télécharger le rapport" pour obtenir le fichier complet
              avec toutes les contributions détaillées.
            </p>
          </div>
        </>
      )}
    </div>
  );
}