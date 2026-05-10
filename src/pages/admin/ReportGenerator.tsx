import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType
} from 'docx';
import { saveAs } from 'file-saver';

interface CommitData {
  author: string;
  total: number;
  commits: { message: string; date: string; sha: string }[];
}

interface ReportData {
  generatedAt: string;
  team: CommitData[];
  stats: {
    totalCommits: number;
    backendCommits: number;
    frontendCommits: number;
  };
}

const GITHUB_OWNER = 'isteahbalfred';
const REPOS = [
  { name: 'caremap-backend', label: 'Backend' },
  { name: 'caremap-frontend', label: 'Frontend' },
];

const BLUE = '1B3A6B';
const GREEN = '16A34A';
const WHITE = 'FFFFFF';
const GRAY = 'F1F5F9';

export default function ReportGenerator() {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);

  const fetchCommits = async (repo: string) => {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
    };
    const token = import.meta.env.VITE_GITHUB_TOKEN;
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${repo}/commits?per_page=100`,
      { headers }
    );
    if (!res.ok) throw new Error(`Erreur GitHub ${res.status}`);
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
      setReportData({
        generatedAt: new Date().toLocaleDateString('fr-FR', {
          year: 'numeric', month: 'long', day: 'numeric',
          hour: '2-digit', minute: '2-digit',
        }),
        team,
        stats: {
          totalCommits: team.reduce((s, m) => s + m.total, 0),
          backendCommits,
          frontendCommits,
        },
      });
    } catch {
      setError('Erreur lors de la récupération des données GitHub.');
    } finally {
      setLoading(false);
    }
  };

  const mkRow = (cells: string[], widths: number[], isHeader = false) =>
    new TableRow({
      tableHeader: isHeader,
      children: cells.map((c, i) => new TableCell({
        width: { size: widths[i], type: WidthType.DXA },
        shading: { fill: isHeader ? BLUE : (i === 0 ? GRAY : WHITE), type: ShadingType.CLEAR },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
          left: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
          right: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
        },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({
          children: [new TextRun({
            text: c, font: 'Arial', size: 20,
            bold: isHeader, color: isHeader ? WHITE : '333333',
          })]
        })]
      }))
    });

  const downloadWord = async () => {
    if (!reportData) return;
    setGenerating(true);
    try {
      const children: any[] = [];

      // Titre
      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 200 },
        children: [new TextRun({
          text: 'RAPPORT DE STAGE UNIVERSITAIRE',
          font: 'Arial', size: 40, bold: true, color: BLUE,
        })]
      }));

      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 100 },
        children: [new TextRun({
          text: 'CareMap — Plateforme Médicale Intelligente pour Haïti',
          font: 'Arial', size: 26, italics: true, color: '555555',
        })]
      }));

      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 400 },
        children: [new TextRun({
          text: `Généré le ${reportData.generatedAt} | ISTEAH`,
          font: 'Arial', size: 20, color: '888888',
        })]
      }));

      // Infos projet
      children.push(new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [3000, 6026],
        rows: [
          mkRow(['Projet', 'CareMap — Plateforme Médicale Haïti'], [3000, 6026]),
          mkRow(['Institution', 'ISTEAH'], [3000, 6026]),
          mkRow(['Type', 'Projet de stage universitaire'], [3000, 6026]),
          mkRow(['Stack Backend', 'Node.js 20 + Express.js + TypeScript + Prisma + PostgreSQL'], [3000, 6026]),
          mkRow(['Stack Frontend', 'React 18 + Vite + TypeScript + Tailwind CSS + Redux'], [3000, 6026]),
          mkRow(['Déploiement', 'Vercel (Frontend) + Render (Backend) + Neon (DB)'], [3000, 6026]),
          mkRow(['Frontend URL', 'https://caremap-frontend.vercel.app'], [3000, 6026]),
          mkRow(['Backend URL', 'https://caremap-backend.onrender.com'], [3000, 6026]),
          mkRow(['GitHub', 'https://github.com/isteahbalfred'], [3000, 6026]),
        ],
      }));

      children.push(new Paragraph({ spacing: { before: 300, after: 100 }, children: [] }));

      // Section 1: Stats
      children.push(new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 200, after: 120 },
        children: [new TextRun({ text: '1. STATISTIQUES DE DÉVELOPPEMENT', font: 'Arial', size: 26, bold: true, color: BLUE })]
      }));

      children.push(new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [4513, 4513],
        rows: [
          mkRow(['Métrique', 'Valeur'], [4513, 4513], true),
          mkRow(['Total commits', String(reportData.stats.totalCommits)], [4513, 4513]),
          mkRow(['Commits Backend', String(reportData.stats.backendCommits)], [4513, 4513]),
          mkRow(['Commits Frontend', String(reportData.stats.frontendCommits)], [4513, 4513]),
          mkRow(['Membres actifs', String(reportData.team.length)], [4513, 4513]),
          mkRow(['Sprints complétés', '4'], [4513, 4513]),
          mkRow(['Tests unitaires', '13 tests (Jest) — 100% passés'], [4513, 4513]),
        ],
      }));

      children.push(new Paragraph({ spacing: { before: 200, after: 100 }, children: [] }));

      // Section 2: Fonctionnalités
      children.push(new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 200, after: 120 },
        children: [new TextRun({ text: '2. FONCTIONNALITÉS LIVRÉES (MVP V1.0)', font: 'Arial', size: 26, bold: true, color: BLUE })]
      }));

      const features = [
        ['Backend — API REST', [
          'Authentification JWT (register, login, refresh, logout)',
          'Gestion des pharmacies (CRUD + validation admin)',
          'Recherche de médicaments (filtres, prix, disponibilité)',
          'Gestion des stocks avec alertes automatiques',
          'Module cliniques (CRUD)',
          'Dashboard administrateur (stats, validation, users)',
          '13 tests unitaires Jest — 100% passés',
        ]],
        ['Frontend — React SPA', [
          'Page accueil avec hero section et carte des features',
          'Recherche médicaments avec prix et stocks en temps réel',
          'Carte interactive Leaflet (pharmacies + cliniques)',
          'Page cliniques avec recherche et filtres',
          'Authentification (Login/Register) sécurisée',
          'Dashboard pharmacien avec gestion de stock complète',
          'Dashboard admin (statistiques, validations, gestion users)',
        ]],
      ];

      for (const [section, items] of features) {
        children.push(new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 160, after: 80 },
          children: [new TextRun({ text: section as string, font: 'Arial', size: 22, bold: true, color: GREEN })]
        }));
        for (const item of items as string[]) {
          children.push(new Paragraph({
            spacing: { before: 60, after: 60 },
            bullet: { level: 0 },
            children: [new TextRun({ text: item, font: 'Arial', size: 20 })]
          }));
        }
      }

      children.push(new Paragraph({ spacing: { before: 200, after: 100 }, children: [] }));

      // Section 3: Contributions
      children.push(new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 200, after: 120 },
        children: [new TextRun({ text: '3. CONTRIBUTIONS PAR MEMBRE', font: 'Arial', size: 26, bold: true, color: BLUE })]
      }));

      // Tableau résumé
      children.push(new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [3000, 1500, 1500, 3026],
        rows: [
          mkRow(['Développeur', 'Commits', 'Pourcentage', 'Rôle principal'], [3000, 1500, 1500, 3026], true),
          ...reportData.team.map(m => mkRow([
            m.author,
            String(m.total),
            `${((m.total / reportData.stats.totalCommits) * 100).toFixed(1)}%`,
            m.total > reportData.stats.totalCommits / 2 ? 'Tech Lead / Dev Principal' : 'Développeur',
          ], [3000, 1500, 1500, 3026]))
        ],
      }));

      children.push(new Paragraph({ spacing: { before: 200, after: 100 }, children: [] }));

      // Détail par membre
      for (const member of reportData.team) {
        children.push(new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 80 },
          children: [new TextRun({
            text: `${member.author} — ${member.total} commits (${((member.total / reportData.stats.totalCommits) * 100).toFixed(1)}%)`,
            font: 'Arial', size: 22, bold: true, color: GREEN,
          })]
        }));

        children.push(new Table({
          width: { size: 9026, type: WidthType.DXA },
          columnWidths: [1200, 1800, 6026],
          rows: [
            mkRow(['SHA', 'Date', 'Message'], [1200, 1800, 6026], true),
            ...member.commits.map(c => mkRow([c.sha, c.date, c.message], [1200, 1800, 6026]))
          ],
        }));

        children.push(new Paragraph({ spacing: { before: 100, after: 0 }, children: [] }));
      }

      // Section 4: Méthodologie
      children.push(new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 200, after: 120 },
        children: [new TextRun({ text: '4. MÉTHODOLOGIE AGILE', font: 'Arial', size: 26, bold: true, color: BLUE })]
      }));

      children.push(new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [3000, 6026],
        rows: [
          mkRow(['Méthode', 'Agile/Scrum adapté'], [3000, 6026]),
          mkRow(['Sprints', '4 sprints de 2 semaines'], [3000, 6026]),
          mkRow(['Outils', 'GitHub Projects, Discord, VS Code'], [3000, 6026]),
          mkRow(['Versionning', 'Git Flow (main, develop, feature/*)'], [3000, 6026]),
          mkRow(['CI/CD', 'GitHub Actions → Vercel + Render auto-deploy'], [3000, 6026]),
        ],
      }));

      // Conclusion
      children.push(new Paragraph({ spacing: { before: 300, after: 0 }, children: [] }));
      children.push(new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 200, after: 120 },
        children: [new TextRun({ text: '5. CONCLUSION', font: 'Arial', size: 26, bold: true, color: BLUE })]
      }));

      children.push(new Paragraph({
        spacing: { before: 80, after: 80 },
        children: [new TextRun({
          text: 'CareMap représente un projet de stage universitaire de qualité professionnelle. La plateforme répond concrètement aux défis du système de santé haïtien en connectant patients, pharmacies et cliniques via une interface numérique moderne. L\'équipe a livré un MVP complet, déployé en production, avec une architecture solide et des tests unitaires validés.',
          font: 'Arial', size: 20,
        })]
      }));

      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 400, after: 0 },
        children: [new TextRun({
          text: `— Rapport généré automatiquement le ${reportData.generatedAt} —`,
          font: 'Arial', size: 18, italics: true, color: '888888',
        })]
      }));

      const doc = new Document({
        sections: [{
          properties: {
            page: {
              size: { width: 11906, height: 16838 },
              margin: { top: 1440, right: 1260, bottom: 1440, left: 1260 },
            }
          },
          children,
        }]
      });

      const buffer = await Packer.toBlob(doc);
      saveAs(buffer, `Rapport_Stage_CareMap_${new Date().toISOString().split('T')[0]}.docx`);
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la génération du Word');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="card mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          📄 Générateur de Rapport de Stage
        </h2>
        <p className="text-gray-500 mb-6">
          Compile automatiquement les contributions depuis GitHub et génère un rapport Word professionnel.
        </p>
        <div className="flex gap-3 flex-wrap">
          <Button onClick={generateReport} loading={loading}>
            {loading ? 'Analyse...' : '🔍 Analyser GitHub'}
          </Button>
          {reportData && (
            <Button onClick={downloadWord} loading={generating} variant="secondary">
              {generating ? 'Génération...' : '📥 Télécharger Word (.docx)'}
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
          <p className="text-gray-600">Analyse des contributions GitHub en cours...</p>
        </div>
      )}

      {reportData && !loading && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total commits', value: reportData.stats.totalCommits, icon: '📊' },
              { label: 'Membres', value: reportData.team.length, icon: '👥' },
              { label: 'Backend', value: reportData.stats.backendCommits, icon: '⚙️' },
              { label: 'Frontend', value: reportData.stats.frontendCommits, icon: '🎨' },
            ].map(s => (
              <div key={s.label} className="card text-center">
                <div className="text-2xl mb-1">{s.icon}</div>
                <div className="text-2xl font-bold text-primary-600">{s.value}</div>
                <div className="text-xs text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>

          {reportData.team.map(member => (
            <div key={member.author} className="card mb-4">
              <div className="flex justify-between mb-2">
                <div>
                  <h4 className="font-bold text-gray-800">{member.author}</h4>
                  <p className="text-sm text-gray-500">
                    {member.total} commits — {((member.total / reportData.stats.totalCommits) * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="text-2xl font-bold text-primary-600">{member.total}</div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
                <div
                  className="bg-primary-500 h-2 rounded-full"
                  style={{ width: `${(member.total / reportData.stats.totalCommits) * 100}%` }}
                />
              </div>
              {member.commits.slice(0, 4).map((c, i) => (
                <div key={i} className="flex gap-2 text-sm py-1 border-b">
                  <span className="font-mono text-gray-400 text-xs">{c.sha}</span>
                  <span className="text-gray-600 flex-1">{c.message}</span>
                  <span className="text-gray-400 text-xs">{c.date}</span>
                </div>
              ))}
              {member.commits.length > 4 && (
                <p className="text-xs text-gray-400 mt-1">+ {member.commits.length - 4} autres dans le .docx</p>
              )}
            </div>
          ))}

          <div className="card bg-green-50 border-green-200">
            <p className="text-green-700 font-medium">✅ Rapport prêt — {reportData.generatedAt}</p>
            <p className="text-green-600 text-sm mt-1">Clique sur "Télécharger Word (.docx)" pour le fichier complet.</p>
          </div>
        </>
      )}
    </div>
  );
}