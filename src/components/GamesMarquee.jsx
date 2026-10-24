import { Marquee } from '@/components/ui/marquee';
import { GameImage } from '@/components/GameImage';

/** Jaquettes des jeux joués qui défilent en continu. */
export function GamesMarquee({ stats }) {
  const seen = new Set();
  const games = [...stats.topGames, ...stats.library.topGames].filter((game) => {
    if (seen.has(game.appid)) return false;
    seen.add(game.appid);
    return true;
  });
  if (games.length < 3) return null;

  return (
    <section className="py-10" aria-label="Jeux joués">
      <Marquee duration={Math.max(20, games.length * 4)}>
        {games.map((game) => (
          <GameImage
            key={game.appid}
            appid={game.appid}
            kind="capsule"
            alt={game.name}
            className="aspect-[2/3] w-28 rounded-lg border shadow-lg transition-transform duration-300 hover:scale-105 sm:w-36"
          />
        ))}
      </Marquee>
    </section>
  );
}
