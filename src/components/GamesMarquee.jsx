import { Marquee } from '@/components/ui/marquee';
import { GameImage } from '@/components/GameImage';

const MIN_ITEMS = 14;

/** Jaquettes des jeux joués qui défilent en continu. */
export function GamesMarquee({ stats }) {
  const seen = new Set();
  const games = [...stats.topGames, ...stats.library.topGames].filter((game) => {
    if (seen.has(game.appid)) return false;
    seen.add(game.appid);
    return true;
  });
  if (games.length < 3) return null;
  // Assez de jaquettes pour couvrir un écran de 1920 px, sinon un trou apparaît pendant le défilement.
  const track = Array.from({ length: Math.ceil(MIN_ITEMS / games.length) }, () => games).flat();

  return (
    <section className="py-8 sm:py-10" aria-label="Jeux joués">
      <Marquee duration={Math.max(20, track.length * 4)} gap="0.75rem">
        {track.map((game, index) => (
          <GameImage
            key={`${game.appid}-${index}`}
            appid={game.appid}
            kind="capsule"
            alt={game.name}
            className="aspect-[2/3] w-24 rounded-lg border shadow-lg transition-transform duration-300 hover:scale-105 sm:w-32 lg:w-36"
          />
        ))}
      </Marquee>
    </section>
  );
}
