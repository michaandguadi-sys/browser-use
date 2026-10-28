// Site-wide media slots. Everything here is optional: the site renders only what is set.
// Paths are public URLs (put files in /public, e.g. '/media/showreel.mp4').

type L = { en: string; de: string };

export type Showreel = {
	video?: string; // mp4/webm path – plays inline in the hero block
	poster?: string; // optional still from src/assets/img (name without .jpg); defaults to the hero image
	youtube?: string; // alternatively a YouTube ID (click-to-load youtube-nocookie facade)
};

// No showreel yet: the hero badge reads "Selected films" and scrolls to the film strip.
export const showreel: Showreel | null = null;

// Ambient sound for the hero (nav "Sound on/off" toggle appears only when this is set).
export const audio: string | null = null;

// Real client/partner quotes only. The section appears automatically as soon as this has entries.
export type Testimonial = { quote: L; name: string; role: L; company?: string };
export const testimonials: Testimonial[] = [];
