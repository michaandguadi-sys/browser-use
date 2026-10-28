import type { APIRoute } from 'astro';
import { worldDotsSvg } from '../lib/map';

export const GET: APIRoute = () => new Response(worldDotsSvg(), { headers: { 'Content-Type': 'image/svg+xml' } });
