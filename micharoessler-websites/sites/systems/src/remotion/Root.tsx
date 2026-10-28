// Remotion CLI entry (render stills/MP4 at build-prep time; the site itself only uses the Player).
import '@fontsource-variable/inter/opsz.css';
import '@fontsource-variable/geist-mono';
import { Composition, continueRender, delayRender } from 'remotion';
import { EditFilm } from './EditFilm';
import { DURATION, FPS, TALL, WIDE, type FilmProps } from './theme';

const fontsReady = delayRender('fonts');
document.fonts.ready.then(() => continueRender(fontsReady));

export const RemotionRoot = () => (
	<>
		<Composition id="EditFilm" component={EditFilm} durationInFrames={DURATION} fps={FPS} {...WIDE} defaultProps={{ lang: 'de' } as FilmProps} />
		<Composition id="EditFilmTall" component={EditFilm} durationInFrames={DURATION} fps={FPS} {...TALL} defaultProps={{ lang: 'de' } as FilmProps} />
	</>
);
