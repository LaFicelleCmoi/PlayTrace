import { LegalPage } from '@/components/LegalPage';
import { CONTACT, LEGAL_UPDATED_AT } from '@/lib/legal';
import { Link } from '@/lib/router';

const SECTIONS = [
  {
    id: 'editeur',
    title: 'Éditeur',
    content: (
      <p>
        PlayTrace est un projet étudiant, gratuit et non commercial, édité à titre personnel par <strong>{CONTACT.name}</strong>
        (directeur de la publication), étudiant à EPITECH Marseille.
        <br />
        Contact : Discord <strong>{CONTACT.discord}</strong>.
      </p>
    ),
  },
  {
    id: 'hebergement',
    title: 'Hébergement',
    content: (
      <ul>
        <li>
          <strong>Site et serveur</strong> : Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis ·{' '}
          <a href="https://vercel.com" target="_blank" rel="noreferrer noopener">vercel.com</a>. Exécution en région Paris.
        </li>
        <li>
          <strong>Base de données</strong> : Supabase ·{' '}
          <a href="https://supabase.com" target="_blank" rel="noreferrer noopener">supabase.com</a>. Données hébergées à Paris
          (eu-west-3).
        </li>
      </ul>
    ),
  },
  {
    id: 'propriete',
    title: 'Propriété intellectuelle',
    content: (
      <>
        <p>
          Steam et le logo Steam sont des marques de Valve Corporation. Les noms, jaquettes et visuels des jeux appartiennent à leurs
          éditeurs respectifs et sont affichés via les services publics de Steam, à titre d’illustration.
        </p>
        <p>
          PlayTrace est un projet indépendant : il n’est <strong>ni affilié à Valve, ni approuvé ou sponsorisé</strong> par Valve.
        </p>
        <p>Le code, le design et les textes de PlayTrace sont la propriété de leur auteur.</p>
      </>
    ),
  },
  {
    id: 'donnees',
    title: 'Données personnelles',
    content: (
      <p>
        Le traitement de tes données est décrit dans la <Link to="/confidentialite">politique de confidentialité</Link>. Tu peux
        exporter ou supprimer tes données à tout moment depuis <Link to="/compte">Mon compte</Link>.
      </p>
    ),
  },
  {
    id: 'responsabilite',
    title: 'Responsabilité',
    content: (
      <p>
        Les statistiques sont calculées à partir des informations fournies par Steam et peuvent être incomplètes (profil privé, panne de
        l’API, jeux hors Steam). Le service est fourni gratuitement, sans garantie de disponibilité.
      </p>
    ),
  },
];

export function Legal() {
  return (
    <LegalPage
      eyebrow="Informations"
      title="Mentions légales"
      intro="Qui édite PlayTrace, où il est hébergé, et à qui appartient quoi."
      updatedAt={LEGAL_UPDATED_AT}
      sections={SECTIONS}
    />
  );
}
