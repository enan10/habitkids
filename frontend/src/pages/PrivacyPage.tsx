export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm p-8 space-y-6 text-gray-700 text-sm leading-relaxed">

        <div className="text-center">
          <div className="text-5xl mb-3">⭐</div>
          <h1 className="text-2xl font-black text-gray-900">HabitKids</h1>
          <p className="text-gray-400 font-semibold mt-1">Politique de confidentialité</p>
          <p className="text-xs text-gray-400 mt-1">Dernière mise à jour : août 2026</p>
        </div>

        <hr className="border-gray-100" />

        <section>
          <h2 className="text-base font-black text-gray-900 mb-2">1. Responsable du traitement</h2>
          <p>
            L'application <strong>HabitKids</strong> est développée et exploitée par <strong>QREFA ADNANE</strong>.
            Pour toute question relative à la confidentialité, vous pouvez nous contacter à l'adresse suivante :
            <br />
            <a href="mailto:chaymaa.rawi@gmail.com" className="text-kids-orange font-semibold">chaymaa.rawi@gmail.com</a>
          </p>
        </section>

        <section>
          <h2 className="text-base font-black text-gray-900 mb-2">2. Données collectées</h2>
          <p className="mb-2">Nous collectons uniquement les données nécessaires au fonctionnement de l'application :</p>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li><strong>Compte parent :</strong> adresse e-mail, nom, mot de passe (chiffré)</li>
            <li><strong>Profil enfant :</strong> prénom, âge, classe, photo (optionnelle)</li>
            <li><strong>Habitudes et récompenses :</strong> titres, fréquences, points</li>
            <li><strong>Progression :</strong> historique des habitudes complétées, points accumulés</li>
            <li><strong>Identifiant publicitaire :</strong> utilisé par Google AdMob pour afficher des publicités</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-black text-gray-900 mb-2">3. Finalité du traitement</h2>
          <p className="mb-2">Vos données sont utilisées exclusivement pour :</p>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li>Permettre le suivi des habitudes de vos enfants</li>
            <li>Afficher les statistiques et badges de progression</li>
            <li>Envoyer des rappels de notifications push (avec votre accord)</li>
            <li>Afficher des publicités via Google AdMob pour financer l'application</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-black text-gray-900 mb-2">4. Publicités (Google AdMob)</h2>
          <p>
            HabitKids utilise <strong>Google AdMob</strong> pour afficher des publicités.
            AdMob peut collecter et utiliser l'identifiant publicitaire de votre appareil
            pour diffuser des annonces personnalisées. Ces publicités sont affichées
            uniquement dans l'espace parent, pas dans l'espace enfant.
          </p>
          <p className="mt-2">
            Pour en savoir plus sur la politique de confidentialité de Google AdMob :
            <br />
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer"
              className="text-kids-orange font-semibold">policies.google.com/privacy</a>
          </p>
        </section>

        <section>
          <h2 className="text-base font-black text-gray-900 mb-2">5. Notifications push</h2>
          <p>
            Avec votre consentement, l'application peut envoyer des notifications push
            via <strong>Firebase Cloud Messaging (FCM)</strong> de Google pour rappeler
            à vos enfants de compléter leurs habitudes. Vous pouvez désactiver ces
            notifications à tout moment dans les paramètres de l'application ou de votre appareil.
          </p>
        </section>

        <section>
          <h2 className="text-base font-black text-gray-900 mb-2">6. Protection des données des enfants</h2>
          <p>
            HabitKids est conçu pour être utilisé par les <strong>parents</strong> pour
            suivre les habitudes de leurs enfants. Nous ne collectons pas directement
            de données auprès des enfants et nous ne commercialisons pas les données
            des enfants. Les informations saisies sur les enfants (prénom, âge, photo)
            sont stockées de manière sécurisée et ne sont jamais partagées avec des tiers.
          </p>
        </section>

        <section>
          <h2 className="text-base font-black text-gray-900 mb-2">7. Partage des données</h2>
          <p>
            Nous ne vendons, ne louons et ne partageons <strong>jamais</strong> vos données
            personnelles avec des tiers à des fins commerciales. Les données sont uniquement
            transmises à nos prestataires techniques (hébergement Fly.io, base de données PostgreSQL)
            dans le cadre strict du fonctionnement de l'application.
          </p>
        </section>

        <section>
          <h2 className="text-base font-black text-gray-900 mb-2">8. Sécurité</h2>
          <p>
            Vos données sont stockées sur des serveurs sécurisés. Les mots de passe sont
            chiffrés avec bcrypt. Les communications entre l'application et nos serveurs
            sont chiffrées via HTTPS. Un code PIN parental optionnel permet de protéger
            l'accès à l'espace parent.
          </p>
        </section>

        <section>
          <h2 className="text-base font-black text-gray-900 mb-2">9. Durée de conservation</h2>
          <p>
            Vos données sont conservées tant que votre compte est actif. Si vous supprimez
            votre compte, toutes vos données (profils enfants, habitudes, historique) sont
            supprimées définitivement dans un délai de 30 jours.
          </p>
        </section>

        <section>
          <h2 className="text-base font-black text-gray-900 mb-2">10. Vos droits</h2>
          <p className="mb-2">Conformément à la réglementation en vigueur, vous disposez des droits suivants :</p>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li>Droit d'accès à vos données</li>
            <li>Droit de rectification</li>
            <li>Droit à l'effacement (droit à l'oubli)</li>
            <li>Droit à la portabilité des données</li>
            <li>Droit d'opposition au traitement</li>
          </ul>
          <p className="mt-2">
            Pour exercer ces droits, contactez-nous à :
            <a href="mailto:chaymaa.rawi@gmail.com" className="text-kids-orange font-semibold ml-1">chaymaa.rawi@gmail.com</a>
          </p>
        </section>

        <section>
          <h2 className="text-base font-black text-gray-900 mb-2">11. Modifications</h2>
          <p>
            Nous nous réservons le droit de modifier cette politique de confidentialité
            à tout moment. Toute modification sera notifiée via l'application. L'utilisation
            continue de l'application après modification vaut acceptation de la nouvelle politique.
          </p>
        </section>

        <hr className="border-gray-100" />

        <div className="text-center text-xs text-gray-400">
          <p>© 2026 HabitKids · Tous droits réservés</p>
          <p className="mt-1">Contact : <a href="mailto:chaymaa.rawi@gmail.com" className="text-kids-orange">chaymaa.rawi@gmail.com</a></p>
        </div>

      </div>
    </div>
  )
}
