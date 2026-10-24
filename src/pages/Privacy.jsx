import { LegalPage } from '@/components/LegalPage';
import { CONTACT, LEGAL_UPDATED_AT } from '@/lib/legal';
import { Link } from '@/lib/router';

const DATA = [
  ['Identité Steam publique', 'SteamID64, pseudo, URL de l’avatar', 'API Steam, à la connexion'],
  ['Sessions de jeu', 'Jeu, heure de début et de fin, durée', 'Sondage Steam, chaque minute'],
  ['Bibliothèque', 'Jeux possédés, temps de jeu total, date de dernière partie', 'API Steam (cache 1 h)'],
  ['Succès', 'Nombre de succès obtenus par jeu (et détail affiché à la demande)', 'API Steam (cache 6 h)'],
  ['Téléchargements', 'Jeux en cours de téléchargement, progression', 'Ton PC, uniquement si tu lances l’agent'],
  ['Réglages', 'Profil public, pause du suivi, date de dernière connexion', 'Toi'],
];

const SECTIONS = [
  {
    id: 'responsable',
    title: 'Qui est responsable',
    content: (
      <>
        <p>
          PlayTrace est un projet étudiant, gratuit et non commercial, édité par <strong>{CONTACT.name}</strong>, responsable du
          traitement de tes données. Le service n’est ni affilié à Valve ni approuvé par Valve.
        </p>
        <p>
          Pour toute question : voir la section <a href="#contact">Contact</a>.
        </p>
      </>
    ),
  },
  {
    id: 'donnees',
    title: 'Les données utilisées',
    content: (
      <>
        <p>PlayTrace ne collecte que ce qui sert à construire ton Wrapped :</p>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr><th>Catégorie</th><th>Détail</th><th>Source</th></tr>
            </thead>
            <tbody>
              {DATA.map(([category, detail, source]) => (
                <tr key={category}><td><strong>{category}</strong></td><td>{detail}</td><td>{source}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          <strong>Ce que PlayTrace ne collecte jamais :</strong> ton mot de passe Steam (la connexion se fait sur le site officiel de
          Steam), ton adresse e-mail, des données de paiement. Il n’y a <strong>ni publicité, ni mesure d’audience, ni traceur
          tiers</strong>.
        </p>
        <p>
          Ton adresse IP est utilisée <strong>en mémoire</strong> pour limiter les abus (nombre de requêtes par minute) : elle n’est pas
          enregistrée en base. L’hébergeur peut la conserver quelques jours dans ses journaux techniques.
        </p>
      </>
    ),
  },
  {
    id: 'finalites',
    title: 'Pourquoi et sur quelle base',
    content: (
      <ul>
        <li>
          <strong>Fournir le service</strong> (suivi des sessions, statistiques, fiches de jeux) : exécution du service que tu demandes
          en te connectant (article 6.1.b du RGPD).
        </li>
        <li>
          <strong>Sécurité</strong> (limitation des requêtes, prévention des abus, journaux d’erreurs) : intérêt légitime (article
          6.1.f).
        </li>
        <li>
          <strong>Profil public, notifications du navigateur, agent des téléchargements</strong> : ton consentement (article 6.1.a),
          que tu peux retirer à tout moment en un clic.
        </li>
      </ul>
    ),
  },
  {
    id: 'conservation',
    title: 'Combien de temps',
    content: (
      <ul>
        <li>Tes données sont conservées <strong>tant que ton compte existe</strong>.</li>
        <li>
          Un compte sans connexion depuis <strong>12 mois</strong> est <strong>supprimé automatiquement</strong>, avec toutes ses
          données.
        </li>
        <li>Les téléchargements sont effacés au plus tard 24 h après le dernier envoi de l’agent.</li>
        <li>Les jetons techniques de connexion (anti-rejeu) sont effacés en moins d’une heure.</li>
        <li>Si tu supprimes ton compte, tout est effacé <strong>immédiatement et définitivement</strong>.</li>
      </ul>
    ),
  },
  {
    id: 'destinataires',
    title: 'Qui y a accès',
    content: (
      <>
        <p>Tes données ne sont <strong>jamais vendues ni louées</strong>. Seuls ces prestataires techniques les traitent :</p>
        <ul>
          <li>
            <strong>Supabase</strong> : base de données, hébergée à <strong>Paris</strong> (région eu-west-3).
          </li>
          <li>
            <strong>Vercel Inc.</strong> (États-Unis) : hébergement du site et exécution du serveur, en région Paris. Les éventuels
            transferts hors de l’Union européenne sont encadrés par le Data Privacy Framework UE–États-Unis et les clauses contractuelles
            types de la Commission européenne.
          </li>
          <li>
            <strong>Valve (Steam)</strong> : source des données (API Web Steam). PlayTrace ne lui transmet aucune donnée.
          </li>
        </ul>
        <p>
          <strong>Profil public</strong> : désactivé par défaut. Si tu l’actives, toute personne ayant le lien voit tes heures, ton top 5,
          ton jeu de l’année, ta personnalité, tes badges et ton calendrier, mais <strong>jamais</strong> le détail ni les horaires de
          tes sessions, ta partie en cours ou tes téléchargements.
        </p>
      </>
    ),
  },
  {
    id: 'cookies',
    title: 'Cookies et stockage',
    content: (
      <>
        <p>
          PlayTrace n’utilise que des éléments <strong>strictement nécessaires</strong> au fonctionnement du service. Ils sont exemptés
          de consentement (recommandations de la CNIL), c’est pourquoi il n’y a pas de bandeau cookies :
        </p>
        <ul>
          <li><strong>pt_session</strong> : te garde connecté, 14 jours maximum.</li>
          <li><strong>pt_oidc_state</strong>, <strong>pt_oidc_next</strong> : sécurisent la connexion Steam, 10 minutes.</li>
          <li><strong>Stockage local</strong> : tes derniers duels, pour les retrouver (rien n’est envoyé au serveur).</li>
          <li><strong>Cache de l’application</strong> (service worker) : les fichiers du site, pour l’ouvrir hors ligne.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'droits',
    title: 'Tes droits',
    content: (
      <>
        <p>
          Tu peux exercer la plupart de tes droits <strong>toi-même, en un clic</strong>, depuis la page{' '}
          <Link to="/compte">Mon compte</Link> :
        </p>
        <ul>
          <li><strong>Accès et portabilité</strong> : « Exporter mes données » télécharge tout ce que PlayTrace sait de toi (JSON).</li>
          <li><strong>Effacement</strong> : « Supprimer mon compte » efface tout, immédiatement.</li>
          <li><strong>Opposition et limitation</strong> : « Mettre le suivi en pause » arrête tout sondage de ton compte.</li>
          <li><strong>Retrait du consentement</strong> : désactive le profil public ou les notifications quand tu veux.</li>
          <li><strong>Rectification</strong> : ton pseudo et ton avatar sont mis à jour automatiquement depuis Steam.</li>
        </ul>
        <p>
          Pour toute autre demande, contacte-moi (voir <a href="#contact">Contact</a>) : réponse sous un mois maximum. Tu peux aussi
          adresser une réclamation à la <a href="https://www.cnil.fr/fr/plaintes" target="_blank" rel="noreferrer noopener">CNIL</a>.
        </p>
      </>
    ),
  },
  {
    id: 'securite',
    title: 'Sécurité',
    content: (
      <>
        <ul>
          <li>Connexion uniquement via l’OpenID officiel de Steam, vérifiée côté serveur, protégée contre la falsification et le rejeu.</li>
          <li>
            Sessions signées, limitées à 14 jours et <strong>révocables</strong> (« Se déconnecter de tous les appareils ») ; suppression
            du compte soumise à une connexion récente.
          </li>
          <li>Chiffrement HTTPS partout, en-têtes de sécurité stricts (CSP, HSTS…), requêtes SQL paramétrées, accès base limité.</li>
          <li>Dépendances aux versions figées, sans scripts d’installation, surveillées automatiquement.</li>
        </ul>
        <p>
          <strong>Attention au phishing :</strong> PlayTrace ne te demandera <strong>jamais</strong> ton mot de passe. La connexion se
          fait toujours sur <strong>steamcommunity.com</strong> : vérifie l’adresse avant de te connecter.
        </p>
        <p>
          Tu as trouvé une faille ? Signale-la en privé (voir <a href="#contact">Contact</a>) avant toute publication. Merci !
        </p>
      </>
    ),
  },
  {
    id: 'mineurs',
    title: 'Mineurs',
    content: (
      <p>
        Steam est réservé aux personnes de 13 ans et plus. Si tu as moins de 15 ans, demande l’accord d’un parent avant d’activer le
        profil public ou les notifications, qui reposent sur ton consentement.
      </p>
    ),
  },
  {
    id: 'contact',
    title: 'Contact',
    content: (
      <>
        <p>
          Responsable : <strong>{CONTACT.name}</strong>
          <br />
          Discord : <strong>{CONTACT.discord}</strong>
        </p>
        <p>Précise que ta demande concerne PlayTrace et, si possible, ton pseudo Steam.</p>
      </>
    ),
  },
  {
    id: 'modifications',
    title: 'Modifications',
    content: (
      <p>
        Cette politique peut évoluer avec le service. La date de mise à jour figure en haut de page ; en cas de changement important, un
        message te préviendra dans l’application.
      </p>
    ),
  },
];

export function Privacy() {
  return (
    <LegalPage
      eyebrow="Vie privée"
      title="Politique de confidentialité"
      intro="Ce que PlayTrace fait de tes données, pourquoi, combien de temps, et comment tu en gardes le contrôle."
      updatedAt={LEGAL_UPDATED_AT}
      sections={SECTIONS}
    />
  );
}
