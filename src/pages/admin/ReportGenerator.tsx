import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType
} from 'docx';
import { saveAs } from 'file-saver';

const BLUE = '1B3A6B';
const GREEN = '16A34A';
const WHITE = 'FFFFFF';
const GRAY = 'F1F5F9';

const TEAM_MEMBERS = [
  {
    name: 'Alfred Benchinaud',
    github: 'isteahbalfred',
    role: 'Tech Lead / Backend Senior',
    branch: 'main',
    responsibilities: [
      'Architecture API REST complète (Express + TypeScript)',
      'Authentification JWT (register, login, refresh, logout)',
      'Configuration Docker et environnement de développement',
      'Déploiement production (Vercel + Render + Neon)',
      'Gestion des modules pharmacies, médicaments, stock',
      'Module admin et tableau de bord administrateur',
      'Module cliniques complet',
      'Tests unitaires (13 tests Jest — 100% passés)',
      'CI/CD GitHub Actions',
      'Documentation technique complète (README)',
    ],
    commits: 32,
  },
  {
    name: 'Membre 2',
    github: '',
    role: 'Développeur Pharmacies & Stock',
    branch: 'feature/pharmacy-stock-improvements',
    responsibilities: [
      'Amélioration dashboard pharmacien',
      'Gestion des stocks avec graphiques Recharts',
      'Alertes de stock avancées',
    ],
    commits: 0,
  },
  {
    name: 'Membre 3',
    github: '',
    role: 'Développeur Cliniques & Carte',
    branch: 'feature/clinics-map-improvements',
    responsibilities: [
      'Carte interactive Leaflet (pharmacies + cliniques)',
      'Page détail clinique',
      'Filtres avancés sur la carte',
    ],
    commits: 0,
  },
  {
    name: 'Membre 4',
    github: '',
    role: 'Développeur Recherche & Médicaments',
    branch: 'feature/search-medications-improvements',
    responsibilities: [
      'Page recherche médicaments professionnelle',
      'Filtres par catégorie et tri',
      'Intégration API médicaments',
    ],
    commits: 0,
  },
  {
    name: 'Membre 5',
    github: '',
    role: 'Développeur Auth & UI/UX',
    branch: 'feature/auth-ui-improvements',
    responsibilities: [
      'Page Login design premium',
      'Page Register avec choix de rôle',
      'Amélioration composants UI',
    ],
    commits: 0,
  },
];

export default function ReportGenerator() {
  const [members, setMembers] = useState(TEAM_MEMBERS.map(m => ({ ...m })));
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const updateMember = (idx: number, field: string, value: any) => {
    setMembers(prev => prev.map((m, i) => i === idx ? { ...m, [field]: value } : m));
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
    setGenerating(true);
    try {
      const totalCommits = members.reduce((s, m) => s + m.commits, 0);
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
          text: `Généré le ${new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })} | ISTEAH`,
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
          mkRow(['Équipe', `${members.length} développeurs`], [3000, 6026]),
          mkRow(['Stack Backend', 'Node.js 20 + Express.js + TypeScript + Prisma + PostgreSQL'], [3000, 6026]),
          mkRow(['Stack Frontend', 'React 18 + Vite + TypeScript + Tailwind CSS + Redux'], [3000, 6026]),
          mkRow(['Frontend URL', 'https://caremap-frontend.vercel.app'], [3000, 6026]),
          mkRow(['Backend URL', 'https://caremap-backend.onrender.com'], [3000, 6026]),
          mkRow(['GitHub', 'https://github.com/isteahbalfred (privé)'], [3000, 6026]),
        ],
      }));

      children.push(new Paragraph({ spacing: { before: 300, after: 0 }, children: [] }));

      // Section stats
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
          mkRow(['Total commits', String(totalCommits)], [4513, 4513]),
          mkRow(['Membres actifs', String(members.length)], [4513, 4513]),
          mkRow(['Sprints complétés', '4'], [4513, 4513]),
          mkRow(['Tests unitaires', '13 tests Jest — 100% passés'], [4513, 4513]),
          mkRow(['Endpoints API', '24 endpoints REST'], [4513, 4513]),
          mkRow(['Pages frontend', '8 pages complètes'], [4513, 4513]),
        ],
      }));

      children.push(new Paragraph({ spacing: { before: 200, after: 0 }, children: [] }));

      // Fonctionnalités
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
          'Page accueil professionnelle avec hero section',
          'Recherche médicaments avec prix et stocks en temps réel',
          'Carte interactive Leaflet (pharmacies + cliniques)',
          'Page cliniques avec recherche et filtres',
          'Authentification (Login/Register) design premium',
          'Dashboard pharmacien avec gestion de stock',
          'Dashboard admin (statistiques, validations, users)',
          'Générateur de rapport de stage automatique',
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

      children.push(new Paragraph({ spacing: { before: 200, after: 0 }, children: [] }));

      // Contributions
      children.push(new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 200, after: 120 },
        children: [new TextRun({ text: '3. CONTRIBUTIONS PAR MEMBRE', font: 'Arial', size: 26, bold: true, color: BLUE })]
      }));

      children.push(new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [2500, 2500, 1500, 2526],
        rows: [
          mkRow(['Développeur', 'Rôle', 'Commits', 'Branche'], [2500, 2500, 1500, 2526], true),
          ...members.map(m => mkRow([
            m.name,
            m.role,
            String(m.commits),
            m.branch,
          ], [2500, 2500, 1500, 2526]))
        ],
      }));

      children.push(new Paragraph({ spacing: { before: 200, after: 0 }, children: [] }));

      // Détail par membre
      for (const member of members) {
        children.push(new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 80 },
          children: [new TextRun({
            text: `${member.name} — ${member.role}`,
            font: 'Arial', size: 22, bold: true, color: GREEN,
          })]
        }));

        children.push(new Table({
          width: { size: 9026, type: WidthType.DXA },
          columnWidths: [2500, 6526],
          rows: [
            mkRow(['GitHub', member.github || 'Non renseigné'], [2500, 6526]),
            mkRow(['Branche', member.branch], [2500, 6526]),
            mkRow(['Commits', String(member.commits)], [2500, 6526]),
          ],
        }));

        children.push(new Paragraph({ spacing: { before: 80, after: 40 }, children: [] }));

        for (const resp of member.responsibilities) {
          children.push(new Paragraph({
            spacing: { before: 40, after: 40 },
            bullet: { level: 0 },
            children: [new TextRun({ text: resp, font: 'Arial', size: 20 })]
          }));
        }

        children.push(new Paragraph({ spacing: { before: 100, after: 0 }, children: [] }));
      }

      // Méthodologie
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
          mkRow(['Mode de travail', 'Entièrement à distance (Remote)'], [3000, 6026]),
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
          text: 'CareMap représente un projet de stage universitaire de qualité professionnelle. La plateforme répond concrètement aux défis du système de santé haïtien en connectant patients, pharmacies et cliniques. L\'équipe a livré un MVP complet, déployé en production, avec une architecture solide, des tests unitaires validés et une méthodologie Agile rigoureuse.',
          font: 'Arial', size: 20,
        })]
      }));

      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 400, after: 0 },
        children: [new TextRun({
          text: `— Rapport généré le ${new Date().toLocaleDateString('fr-FR')} — ISTEAH —`,
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
      setGenerated(true);
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la génération');
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
          Remplissez les informations de chaque membre puis générez le rapport Word officiel.
        </p>
        <div className="flex gap-3">
          <Button onClick={downloadWord} loading={generating}>
            📥 Générer le rapport Word (.docx)
          </Button>
        </div>
        {generated && (
          <div className="mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
            ✅ Rapport généré avec succès !
          </div>
        )}
      </div>

      {/* Formulaire membres */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-800">
          👥 Informations de l'équipe
        </h3>
        {members.map((member, idx) => (
          <div key={idx} className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                {idx + 1}
              </div>
              <h4 className="font-bold text-gray-800">{member.role}</h4>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs text-gray-500 font-medium">Nom complet</label>
                <input
                  type="text"
                  className="input mt-1"
                  value={member.name}
                  onChange={e => updateMember(idx, 'name', e.target.value)}
                  placeholder="Prénom Nom"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">GitHub username</label>
                <input
                  type="text"
                  className="input mt-1"
                  value={member.github}
                  onChange={e => updateMember(idx, 'github', e.target.value)}
                  placeholder="username"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Nombre de commits</label>
                <input
                  type="number"
                  className="input mt-1"
                  value={member.commits}
                  onChange={e => updateMember(idx, 'commits', parseInt(e.target.value) || 0)}
                  min="0"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Branche Git</label>
                <input
                  type="text"
                  className="input mt-1 bg-gray-50 text-gray-500"
                  value={member.branch}
                  readOnly
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}