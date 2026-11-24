import React, { useState, useRef, useEffect } from 'react';
import { AVAILABLE_GRADES, SchoolConfig } from '../types';
import {
  Sparkles,
  Video,
  Download,
  Play,
  Volume2,
  VolumeX,
  Wand2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Edit3,
  RefreshCw,
  Film,
  Trash2,
  Monitor,
  Smartphone,
  Square,
} from 'lucide-react';

interface VideoScene {
  sceneNumber: number;
  durationSeconds: number;
  highlightBadge: string;
  heading: string;
  bodyPoints: string[];
  narrationText: string;
  visualMotif: 'sparkles' | 'geometry' | 'science' | 'book' | 'rocket' | 'award';
}

interface VideoPlan {
  videoTitle: string;
  subtitle: string;
  schoolName: string;
  platformTitle: string;
  scenes: VideoScene[];
}

interface GeneratedVideoItem {
  id: string;
  title: string;
  subtitle: string;
  aspectRatio: AspectRatioOption;
  themeId: ThemeOptionId;
  videoUrl: string;
  mimeType: string;
  fileExt: string;
  sizeBytes: number;
  createdAt: string;
  plan: VideoPlan;
}

type AspectRatioOption = '16:9' | '9:16' | '1:1';
type ThemeOptionId = 'emerald' | 'cosmic' | 'royal_gold' | 'violet';

interface ThemePalette {
  id: ThemeOptionId;
  label: string;
  bgStart: string;
  bgMid: string;
  bgEnd: string;
  accent: string;
  accentSoft: string;
  cardBg: string;
  textPrimary: string;
  textSecondary: string;
}

const THEMES: Record<ThemeOptionId, ThemePalette> = {
  emerald: {
    id: 'emerald',
    label: 'الزمرد المدرسي',
    bgStart: '#022c22',
    bgMid: '#064e3b',
    bgEnd: '#0f172a',
    accent: '#34d399',
    accentSoft: 'rgba(52, 211, 153, 0.16)',
    cardBg: 'rgba(6, 78, 59, 0.55)',
    textPrimary: '#ffffff',
    textSecondary: '#a7f3d0',
  },
  cosmic: {
    id: 'cosmic',
    label: 'الأزرق الليلي',
    bgStart: '#0f172a',
    bgMid: '#1e3a8a',
    bgEnd: '#090d16',
    accent: '#38bdf8',
    accentSoft: 'rgba(56, 189, 248, 0.16)',
    cardBg: 'rgba(30, 58, 138, 0.45)',
    textPrimary: '#ffffff',
    textSecondary: '#bae6fd',
  },
  royal_gold: {
    id: 'royal_gold',
    label: 'الذهبي الملكي',
    bgStart: '#18181b',
    bgMid: '#27272a',
    bgEnd: '#09090b',
    accent: '#fbbf24',
    accentSoft: 'rgba(251, 191, 36, 0.16)',
    cardBg: 'rgba(39, 39, 42, 0.65)',
    textPrimary: '#ffffff',
    textSecondary: '#fde68a',
  },
  violet: {
    id: 'violet',
    label: 'البنفسجي الإبداعي',
    bgStart: '#1e1b4b',
    bgMid: '#4c1d95',
    bgEnd: '#0f0a24',
    accent: '#c084fc',
    accentSoft: 'rgba(192, 132, 252, 0.16)',
    cardBg: 'rgba(76, 29, 149, 0.48)',
    textPrimary: '#ffffff',
    textSecondary: '#e9d5ff',
  },
};

const QUICK_PRESETS = [
  {
    label: 'تحولات الطاقة (العلوم)',
    topic: 'ملخص سريع عن الطاقة وتحولاتها وأشكالها الأساسية لطلاب ثاني متوسط',
    subject: 'العلوم',
    grade: 'ثاني متوسط',
  },
  {
    label: 'نظرية فيثاغورس (الرياضيات)',
    topic: 'شرح مبسط لنظرية فيثاغورس في المثلث القائم الزاوية مع مثال سريع',
    subject: 'الرياضيات',
    grade: 'ثاني متوسط',
  },
  {
    label: 'رسالة تحفيزية للطلاب',
    topic: 'فيديو تحفيزي قصير لطلاب المدرسة عن الاجتهاد والمذاكرة والتفوق الدراسي',
    subject: 'توجيه وإرشاد',
    grade: 'عام لجميع الصفوف',
  },
  {
    label: 'إعلان اختبار مهم',
    topic: 'تنبيه وتحفيز للطلاب لمراجعة الملخصات المعتمدة استعداداً للاختبارات',
    subject: 'إدارة المدرسة',
    grade: 'ثاني متوسط',
  },
];

const TOTAL_VIDEO_DURATION_MS = 20000;
const SCENE_DURATION_MS = 5000;

function getSupportedRecorderMime(): { mimeType: string; ext: string } {
  if (typeof MediaRecorder === 'undefined') {
    return { mimeType: 'video/webm', ext: 'webm' };
  }
  const candidates = [
    { mime: 'video/webm;codecs=vp9,opus', ext: 'webm' },
    { mime: 'video/webm;codecs=vp8,opus', ext: 'webm' },
    { mime: 'video/webm;codecs=vp9', ext: 'webm' },
    { mime: 'video/webm', ext: 'webm' },
    { mime: 'video/mp4', ext: 'mp4' },
  ];
  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported(c.mime)) {
      return { mimeType: c.mime, ext: c.ext };
    }
  }
  return { mimeType: '', ext: 'webm' };
}

function wrapTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : [''];
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawMotifGraphic(
  ctx: CanvasRenderingContext2D,
  motif: VideoScene['visualMotif'],
  cx: number,
  cy: number,
  size: number,
  timeSec: number,
  accent: string
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = accent;
  ctx.fillStyle = accent;

  // Soft outer halo
  const pulse = 1 + Math.sin(timeSec * 3.2) * 0.06;
  const grad = ctx.createRadialGradient(0, 0, size * 0.1, 0, 0, size * 1.15 * pulse);
  grad.addColorStop(0, `${accent}33`);
  grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, size * 1.15 * pulse, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = accent;
  ctx.lineWidth = Math.max(2.5, size * 0.045);

  if (motif === 'science') {
    for (let i = 0; i < 3; i++) {
      ctx.save();
      ctx.rotate(timeSec * 0.8 + (i * Math.PI) / 3);
      ctx.globalAlpha = 0.78;
      ctx.beginPath();
      ctx.ellipse(0, 0, size * 0.78, size * 0.28, 0, 0, Math.PI * 2);
      ctx.stroke();

      const angle = timeSec * 2.4 + i * 2.1;
      const ex = Math.cos(angle) * size * 0.78;
      const ey = Math.sin(angle) * size * 0.28;
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(ex, ey, size * 0.075, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.14, 0, Math.PI * 2);
    ctx.fill();
  } else if (motif === 'geometry') {
    ctx.save();
    ctx.rotate(timeSec * 0.45);
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      const px = Math.cos(a) * size * 0.68;
      const py = Math.sin(a) * size * 0.68;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();

    ctx.rotate(-timeSec * 0.9);
    ctx.globalAlpha = 0.65;
    ctx.beginPath();
    const s = size * 0.44;
    ctx.rect(-s, -s, s * 2, s * 2);
    ctx.stroke();
    ctx.restore();
  } else if (motif === 'book') {
    const floatY = Math.sin(timeSec * 2.5) * size * 0.06;
    ctx.translate(0, floatY);
    ctx.globalAlpha = 0.9;
    // Left page
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.3);
    ctx.quadraticCurveTo(-size * 0.4, -size * 0.45, -size * 0.72, -size * 0.25);
    ctx.lineTo(-size * 0.72, size * 0.35);
    ctx.quadraticCurveTo(-size * 0.38, size * 0.18, 0, size * 0.35);
    ctx.closePath();
    ctx.stroke();
    // Right page
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.3);
    ctx.quadraticCurveTo(size * 0.4, -size * 0.45, size * 0.72, -size * 0.25);
    ctx.lineTo(size * 0.72, size * 0.35);
    ctx.quadraticCurveTo(size * 0.38, size * 0.18, 0, size * 0.35);
    ctx.closePath();
    ctx.stroke();
    // Glowing lines
    ctx.globalAlpha = 0.55;
    for (let l = -1; l <= 1; l++) {
      ctx.beginPath();
      ctx.moveTo(-size * 0.52, l * size * 0.12);
      ctx.lineTo(-size * 0.16, l * size * 0.12);
      ctx.moveTo(size * 0.16, l * size * 0.12);
      ctx.lineTo(size * 0.52, l * size * 0.12);
      ctx.stroke();
    }
  } else if (motif === 'rocket') {
    const lift = Math.sin(timeSec * 3) * size * 0.08;
    ctx.translate(0, lift);
    ctx.rotate(-Math.PI / 4);
    ctx.globalAlpha = 0.92;
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.52, size * 0.24, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(size * 0.14, 0, size * 0.1, 0, Math.PI * 2);
    ctx.fill();
    // Flame
    ctx.globalAlpha = 0.75 + Math.sin(timeSec * 16) * 0.2;
    ctx.beginPath();
    ctx.moveTo(-size * 0.52, -size * 0.1);
    ctx.lineTo(-size * 0.85 - Math.sin(timeSec * 20) * size * 0.1, 0);
    ctx.lineTo(-size * 0.52, size * 0.1);
    ctx.closePath();
    ctx.fill();
  } else if (motif === 'award') {
    ctx.save();
    ctx.scale(pulse, pulse);
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(0, -size * 0.1, size * 0.45, 0, Math.PI * 2);
    ctx.stroke();
    // Star inside
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? size * 0.26 : size * 0.11;
      const a = (i * Math.PI) / 5 - Math.PI / 2;
      const px = Math.cos(a) * r;
      const py = -size * 0.1 + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    // Ribbons
    ctx.beginPath();
    ctx.moveTo(-size * 0.22, size * 0.3);
    ctx.lineTo(-size * 0.3, size * 0.7);
    ctx.lineTo(0, size * 0.52);
    ctx.lineTo(size * 0.3, size * 0.7);
    ctx.lineTo(size * 0.22, size * 0.3);
    ctx.stroke();
    ctx.restore();
  } else {
    // sparkles
    for (let i = 0; i < 4; i++) {
      ctx.save();
      const angle = (i * Math.PI) / 2 + timeSec * 0.5;
      const dist = i === 0 ? 0 : size * 0.52;
      const sx = i === 0 ? 0 : Math.cos(angle) * dist;
      const sy = i === 0 ? 0 : Math.sin(angle) * dist;
      const sp = (i === 0 ? size * 0.45 : size * 0.18) * (0.85 + Math.sin(timeSec * 4 + i) * 0.15);
      ctx.translate(sx, sy);
      ctx.beginPath();
      ctx.moveTo(0, -sp);
      ctx.quadraticCurveTo(0, 0, sp, 0);
      ctx.quadraticCurveTo(0, 0, 0, sp);
      ctx.quadraticCurveTo(0, 0, -sp, 0);
      ctx.quadraticCurveTo(0, 0, 0, -sp);
      ctx.fill();
      ctx.restore();
    }
  }

  ctx.restore();
}

function drawFrameToCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  elapsedMs: number,
  plan: VideoPlan,
  theme: ThemePalette
) {
  const clampedMs = Math.max(0, Math.min(TOTAL_VIDEO_DURATION_MS, elapsedMs));
  const timeSec = clampedMs / 1000;
  const sceneIdx = Math.min(3, Math.floor(clampedMs / SCENE_DURATION_MS));
  const sceneLocalMs = clampedMs - sceneIdx * SCENE_DURATION_MS;
  const sceneProgress = sceneLocalMs / SCENE_DURATION_MS;
  const scene = plan.scenes[sceneIdx] || plan.scenes[0];

  const isPortrait = height > width;
  const isSquare = Math.abs(width - height) < 50;
  const scale = Math.min(width, height) / 720;

  // Fade transition at start (0..450ms) and end (4650..5000ms)
  const enterAlpha = Math.min(1, sceneLocalMs / 450);
  const exitAlpha =
    sceneIdx === 3
      ? clampedMs > TOTAL_VIDEO_DURATION_MS - 350
        ? Math.max(0.15, (TOTAL_VIDEO_DURATION_MS - clampedMs) / 350)
        : 1
      : sceneLocalMs > SCENE_DURATION_MS - 320
      ? Math.max(0, (SCENE_DURATION_MS - sceneLocalMs) / 320)
      : 1;
  const contentAlpha = Math.min(enterAlpha, exitAlpha);
  const slideOffset = (1 - Math.min(1, sceneLocalMs / 500)) * 28 * scale;

  // 1. Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, theme.bgStart);
  bgGrad.addColorStop(0.5, theme.bgMid);
  bgGrad.addColorStop(1, theme.bgEnd);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Subtle animated grid / bokeh circles
  ctx.save();
  for (let i = 0; i < 14; i++) {
    const px = ((i * 197 + timeSec * (18 + (i % 4) * 7)) % (width + 120)) - 60;
    const py = ((i * 139 + Math.sin(timeSec * 0.9 + i) * 35) % (height + 80)) - 40;
    const radius = (18 + (i % 5) * 14) * scale;
    ctx.fillStyle = i % 2 === 0 ? theme.accentSoft : 'rgba(255,255,255,0.04)';
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // 3. Decorative top & side glowing frame lines
  ctx.save();
  ctx.strokeStyle = `${theme.accent}44`;
  ctx.lineWidth = 2 * scale;
  drawRoundedRect(ctx, 22 * scale, 22 * scale, width - 44 * scale, height - 44 * scale, 24 * scale);
  ctx.stroke();
  ctx.restore();

  // 4. Top header bar: School & Platform badge + Timer pill
  const padX = (isPortrait ? 44 : 56) * scale;
  const headerY = 44 * scale;
  ctx.save();
  ctx.direction = 'rtl';

  // Right-side School branding pill
  const brandLabel = `${plan.schoolName} • ${plan.platformTitle}`;
  ctx.font = `700 ${Math.round(18 * scale)}px "Cairo", "Tajawal", sans-serif`;
  const brandW = Math.min(width * 0.56, ctx.measureText(brandLabel).width + 38 * scale);
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  drawRoundedRect(ctx, width - padX - brandW, headerY, brandW, 42 * scale, 21 * scale);
  ctx.fill();
  ctx.strokeStyle = `${theme.accent}66`;
  ctx.lineWidth = 1.5 * scale;
  ctx.stroke();

  ctx.fillStyle = theme.textSecondary;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillText(brandLabel, width - padX - 18 * scale, headerY + 21 * scale, brandW - 30 * scale);

  // Left-side 20s badge + timer
  const secCurrent = Math.min(20, Math.floor(clampedMs / 1000));
  const timerLabel = `${secCurrent < 10 ? '0' + secCurrent : secCurrent} / 20 ث`;
  ctx.font = `800 ${Math.round(17 * scale)}px "Cairo", sans-serif`;
  const timerW = 122 * scale;
  ctx.fillStyle = theme.accentSoft;
  drawRoundedRect(ctx, padX, headerY, timerW, 42 * scale, 21 * scale);
  ctx.fill();
  ctx.strokeStyle = theme.accent;
  ctx.lineWidth = 1.5 * scale;
  ctx.stroke();

  ctx.fillStyle = theme.textPrimary;
  ctx.textAlign = 'center';
  ctx.fillText(timerLabel, padX + timerW / 2, headerY + 21 * scale);
  ctx.restore();

  // 5. Video Master Title & Subtitle
  ctx.save();
  ctx.direction = 'rtl';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = theme.textPrimary;
  ctx.font = `900 ${Math.round((isPortrait ? 30 : 28) * scale)}px "Cairo", "Tajawal", sans-serif`;
  ctx.fillText(plan.videoTitle, width / 2, headerY + 62 * scale, width - padX * 2);

  ctx.fillStyle = theme.accent;
  ctx.font = `700 ${Math.round(18 * scale)}px "Cairo", "Tajawal", sans-serif`;
  ctx.fillText(plan.subtitle, width / 2, headerY + 104 * scale, width - padX * 2);
  ctx.restore();

  // 6. Main Scene Card Area
  ctx.save();
  ctx.globalAlpha = contentAlpha;
  const cardTop = headerY + 148 * scale + slideOffset;
  const cardBottomReserve = 96 * scale;
  const cardHeight = height - cardTop - cardBottomReserve;
  const cardWidth = width - padX * 2;

  ctx.fillStyle = theme.cardBg;
  drawRoundedRect(ctx, padX, cardTop, cardWidth, cardHeight, 28 * scale);
  ctx.fill();
  ctx.strokeStyle = `${theme.accent}77`;
  ctx.lineWidth = 2 * scale;
  ctx.stroke();

  // Motif placement (left side on 16:9 / 1:1, top center on 9:16 portrait)
  const motifSize = (isPortrait ? 92 : isSquare ? 88 : 108) * scale;
  const motifCx = isPortrait ? width / 2 : padX + cardWidth * 0.18;
  const motifCy = isPortrait ? cardTop + cardHeight * 0.21 : cardTop + cardHeight * 0.5;
  drawMotifGraphic(ctx, scene.visualMotif, motifCx, motifCy, motifSize, timeSec, theme.accent);

  // Scene Badge + Heading + Bullet Points (RTL)
  ctx.direction = 'rtl';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';

  const textRightEdge = width - padX - 34 * scale;
  const textMaxWidth = isPortrait ? cardWidth - 68 * scale : cardWidth * 0.62;
  let cursorY = isPortrait ? cardTop + cardHeight * 0.4 : cardTop + 34 * scale;

  // Scene highlight badge
  const badgeText = `${scene.highlightBadge}  •  ${sceneIdx + 1} / 4`;
  ctx.font = `800 ${Math.round(17 * scale)}px "Cairo", sans-serif`;
  const badgeW = Math.min(textMaxWidth, ctx.measureText(badgeText).width + 32 * scale);
  ctx.fillStyle = theme.accent;
  drawRoundedRect(ctx, textRightEdge - badgeW, cursorY, badgeW, 34 * scale, 12 * scale);
  ctx.fill();

  ctx.fillStyle = '#090d16';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(badgeText, textRightEdge - badgeW / 2, cursorY + 17 * scale, badgeW - 16 * scale);

  cursorY += 54 * scale;

  // Scene heading
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.fillStyle = theme.textPrimary;
  const headingSize = Math.round((isPortrait ? 30 : 32) * scale);
  ctx.font = `900 ${headingSize}px "Cairo", "Tajawal", sans-serif`;
  const headingLines = wrapTextLines(ctx, scene.heading, textMaxWidth).slice(0, 2);
  for (const line of headingLines) {
    ctx.fillText(line, textRightEdge, cursorY);
    cursorY += headingSize * 1.38;
  }

  cursorY += 16 * scale;

  // Bullet points (staggered reveal smoothly within the 5s scene)
  const bulletSize = Math.round((isPortrait ? 22 : 23) * scale);
  ctx.font = `700 ${bulletSize}px "Cairo", "Tajawal", sans-serif`;

  scene.bodyPoints.forEach((pt, pIdx) => {
    const appearStart = 0.08 + pIdx * 0.16;
    const ptAlpha = Math.max(0, Math.min(1, (sceneProgress - appearStart) / 0.16));
    ctx.save();
    ctx.globalAlpha = contentAlpha * ptAlpha;

    // Accent dot on right
    ctx.fillStyle = theme.accent;
    ctx.beginPath();
    ctx.arc(textRightEdge - 8 * scale, cursorY + bulletSize * 0.62, 6 * scale, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = theme.textSecondary;
    const wrapped = wrapTextLines(ctx, pt, textMaxWidth - 32 * scale).slice(0, 2);
    for (const wLine of wrapped) {
      if (cursorY + bulletSize * 1.4 < cardTop + cardHeight - 16 * scale) {
        ctx.fillText(wLine, textRightEdge - 26 * scale, cursorY);
        cursorY += bulletSize * 1.42;
      }
    }
    cursorY += 10 * scale;
    ctx.restore();
  });

  ctx.restore();

  // 7. Bottom 20-second timeline & scene step indicators
  const barY = height - 62 * scale;
  const barW = width - padX * 2;
  const segGap = 10 * scale;
  const segW = (barW - segGap * 3) / 4;

  for (let s = 0; s < 4; s++) {
    // RTL progression: right to left so Arabic viewers read steps 1 -> 4 naturally
    const sx = width - padX - (s + 1) * segW - s * segGap;
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    drawRoundedRect(ctx, sx, barY, segW, 10 * scale, 5 * scale);
    ctx.fill();

    let fillRatio = 0;
    if (s < sceneIdx) fillRatio = 1;
    else if (s === sceneIdx) fillRatio = Math.max(0, Math.min(1, sceneProgress));

    if (fillRatio > 0) {
      ctx.fillStyle = theme.accent;
      const fw = segW * fillRatio;
      drawRoundedRect(ctx, sx + (segW - fw), barY, fw, 10 * scale, 5 * scale);
      ctx.fill();
    }
  }

  // Footer note
  ctx.save();
  ctx.direction = 'rtl';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(255,255,255,0.68)';
  ctx.font = `600 ${Math.round(14 * scale)}px "Cairo", sans-serif`;
  ctx.fillText(
    'تم الإنتاج بالذكاء الاصطناعي المجاني • لوحة مدير المنصة',
    width / 2,
    height - 32 * scale
  );
  ctx.restore();
}

function playPleasantAmbientNotes(
  audioCtx: AudioContext,
  destination: MediaStreamAudioDestinationNode
) {
  const masterGain = audioCtx.createGain();
  masterGain.gain.value = 0.055;
  masterGain.connect(destination);

  // Soft chime chords at 0s, 5s, 10s, 15s (every scene transition)
  const sceneChords = [
    [261.63, 329.63, 392.0], // C major
    [293.66, 369.99, 440.0], // D major
    [329.63, 392.0, 493.88], // E minor
    [261.63, 329.63, 392.0, 523.25], // C major octave resolve
  ];

  const baseTime = audioCtx.currentTime;
  sceneChords.forEach((chord, idx) => {
    const startAt = baseTime + idx * 5;
    chord.forEach((freq, noteIdx) => {
      const osc = audioCtx.createOscillator();
      const noteGain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startAt + noteIdx * 0.08);

      noteGain.gain.setValueAtTime(0.0001, startAt + noteIdx * 0.08);
      noteGain.gain.exponentialRampToValueAtTime(0.35, startAt + noteIdx * 0.08 + 0.12);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, startAt + 4.6);

      osc.connect(noteGain);
      noteGain.connect(masterGain);

      osc.start(startAt + noteIdx * 0.08);
      osc.stop(startAt + 4.7);
    });
  });
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

interface AIVideoStudioProps {
  config: SchoolConfig;
}

export const AIVideoStudio: React.FC<AIVideoStudioProps> = ({ config }) => {
  const [topic, setTopic] = useState('');
  const [grade, setGrade] = useState<string>(config.defaultGrade || 'ثاني متوسط');
  const [subject, setSubject] = useState('العلوم');
  const [style, setStyle] = useState('تعليمي احترافي مشوق');
  const [aspectRatio, setAspectRatio] = useState<AspectRatioOption>('16:9');
  const [themeId, setThemeId] = useState<ThemeOptionId>('emerald');
  const [includeVoiceover, setIncludeVoiceover] = useState<boolean>(true);

  const [statusPhase, setStatusPhase] = useState<
    'idle' | 'generating_ai' | 'rendering_video' | 'ready' | 'error'
  >('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [renderProgress, setRenderProgress] = useState<number>(0);
  const [renderElapsedSec, setRenderElapsedSec] = useState<number>(0);

  const [currentPlan, setCurrentPlan] = useState<VideoPlan | null>(null);
  const [currentSceneAudios, setCurrentSceneAudios] = useState<(string | null)[]>([
    null,
    null,
    null,
    null,
  ]);
  const [editingScenes, setEditingScenes] = useState<boolean>(false);
  const [generatedVideos, setGeneratedVideos] = useState<GeneratedVideoItem[]>([]);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const isUnmountedRef = useRef<boolean>(false);

  const activeVideo =
    generatedVideos.find((v) => v.id === activeVideoId) || generatedVideos[0] || null;

  const stopActiveRecording = () => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      try {
        recorderRef.current.stop();
      } catch (_) {}
    }
    recorderRef.current = null;
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => {});
    }
    audioCtxRef.current = null;
  };

  useEffect(() => {
    isUnmountedRef.current = false;
    return () => {
      isUnmountedRef.current = true;
      stopActiveRecording();
    };
  }, []);

  const renderPlanTo20SecVideo = async (
    planToRender: VideoPlan,
    audios: (string | null)[],
    chosenRatio: AspectRatioOption,
    chosenTheme: ThemeOptionId
  ) => {
    stopActiveRecording();
    setStatusPhase('rendering_video');
    setRenderProgress(0);
    setRenderElapsedSec(0);
    setErrorMessage(null);

    const dimensions =
      chosenRatio === '9:16'
        ? { w: 720, h: 1280 }
        : chosenRatio === '1:1'
        ? { w: 960, h: 960 }
        : { w: 1280, h: 720 };

    const canvas = previewCanvasRef.current || document.createElement('canvas');
    canvas.width = dimensions.w;
    canvas.height = dimensions.h;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setStatusPhase('error');
      setErrorMessage('متصفحك لا يدعم لوحة الرسم لإنتاج الفيديو.');
      return;
    }

    const theme = THEMES[chosenTheme];

    // Setup WebAudio mixing (ambient chords + optional Gemini voiceover clips)
    let combinedStream: MediaStream;
    let audioCtx: AudioContext | null = null;
    try {
      const videoStream = canvas.captureStream(30);
      const AudioContextCtor =
        window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextCtor) {
        audioCtx = new AudioContextCtor();
        audioCtxRef.current = audioCtx;
        if (audioCtx.state === 'suspended') {
          await audioCtx.resume();
        }
        const dest = audioCtx.createMediaStreamDestination();
        playPleasantAmbientNotes(audioCtx, dest);

        // Schedule per-scene Gemini TTS audio cleanly within each 5s slot
        if (Array.isArray(audios) && audios.some(Boolean)) {
          const voiceGain = audioCtx.createGain();
          voiceGain.gain.value = 1.0;
          voiceGain.connect(dest);

          const baseTime = audioCtx.currentTime;
          await Promise.all(
            audios.map(async (b64, sIdx) => {
              if (!b64 || !audioCtx) return;
              try {
                const decodedBuffer = await audioCtx.decodeAudioData(
                  base64ToArrayBuffer(b64)
                );
                const source = audioCtx.createBufferSource();
                source.buffer = decodedBuffer;
                // Slightly speed up if longer than 4.65s so it fits strictly inside its 5s scene
                if (decodedBuffer.duration > 4.65) {
                  source.playbackRate.value = Math.min(1.45, decodedBuffer.duration / 4.55);
                }
                source.connect(voiceGain);
                source.start(baseTime + sIdx * 5 + 0.15);
              } catch (e) {
                console.warn('Could not decode scene audio:', e);
              }
            })
          );
        }

        combinedStream = new MediaStream([
          ...videoStream.getVideoTracks(),
          ...dest.stream.getAudioTracks(),
        ]);
      } else {
        combinedStream = videoStream;
      }
    } catch (audioErr) {
      console.warn('Audio mixing fallback to video-only:', audioErr);
      combinedStream = canvas.captureStream(30);
    }

    const { mimeType, ext } = getSupportedRecorderMime();
    let recorder: MediaRecorder;
    try {
      recorder = mimeType
        ? new MediaRecorder(combinedStream, {
            mimeType,
            videoBitsPerSecond: 2_800_000,
          })
        : new MediaRecorder(combinedStream);
    } catch (recErr: any) {
      stopActiveRecording();
      setStatusPhase('error');
      setErrorMessage(
        'تعذر بدء تسجيل الفيديو في هذا المتصفح: ' + (recErr?.message || '')
      );
      return;
    }

    recorderRef.current = recorder;
    const chunks: BlobPart[] = [];

    recorder.ondataavailable = (ev) => {
      if (ev.data && ev.data.size > 0) {
        chunks.push(ev.data);
      }
    };

    const recordingPromise = new Promise<Blob>((resolve) => {
      recorder.onstop = () => {
        const finalType = mimeType || recorder.mimeType || 'video/webm';
        resolve(new Blob(chunks, { type: finalType }));
      };
    });

    // Paint initial frame and start MediaRecorder
    drawFrameToCanvas(ctx, dimensions.w, dimensions.h, 0, planToRender, theme);
    recorder.start(250);

    const startTime = performance.now();

    const step = (now: number) => {
      if (isUnmountedRef.current) return;
      const elapsed = now - startTime;
      const pct = Math.min(100, Math.round((elapsed / TOTAL_VIDEO_DURATION_MS) * 100));
      setRenderProgress(pct);
      setRenderElapsedSec(Math.min(20, Math.floor(elapsed / 1000)));

      drawFrameToCanvas(ctx, dimensions.w, dimensions.h, elapsed, planToRender, theme);

      if (elapsed < TOTAL_VIDEO_DURATION_MS) {
        animFrameRef.current = requestAnimationFrame(step);
      } else {
        // Draw final 20.0s frame
        drawFrameToCanvas(
          ctx,
          dimensions.w,
          dimensions.h,
          TOTAL_VIDEO_DURATION_MS,
          planToRender,
          theme
        );
        if (recorder.state !== 'inactive') {
          recorder.stop();
        }
      }
    };

    animFrameRef.current = requestAnimationFrame(step);

    const blob = await recordingPromise;
    if (isUnmountedRef.current) return;

    if (audioCtx && audioCtx.state !== 'closed') {
      audioCtx.close().catch(() => {});
    }
    audioCtxRef.current = null;
    recorderRef.current = null;
    animFrameRef.current = null;

    const url = URL.createObjectURL(blob);
    const newItem: GeneratedVideoItem = {
      id: `vid-${Date.now()}`,
      title: planToRender.videoTitle,
      subtitle: planToRender.subtitle,
      aspectRatio: chosenRatio,
      themeId: chosenTheme,
      videoUrl: url,
      mimeType: blob.type || 'video/webm',
      fileExt: ext,
      sizeBytes: blob.size,
      createdAt: new Date().toLocaleTimeString('ar-SA', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Riyadh',
      }),
      plan: planToRender,
    };

    setGeneratedVideos((prev) => [newItem, ...prev]);
    setActiveVideoId(newItem.id);
    setRenderProgress(100);
    setRenderElapsedSec(20);
    setStatusPhase('ready');
  };

  const handleGenerateVideo = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (topic.trim().length < 3) {
      setErrorMessage('يرجى كتابة فكرة أو موضوع الفيديو التعليمي أولاً.');
      return;
    }

    stopActiveRecording();
    setStatusPhase('generating_ai');
    setErrorMessage(null);
    setWarningMessage(null);
    setRenderProgress(0);
    setRenderElapsedSec(0);

    try {
      const response = await fetch('/api/ai/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          grade,
          subject,
          style,
          includeVoiceover,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data?.success || !data?.plan) {
        throw new Error(data?.error || 'تعذر الاتصال بخدمة الذكاء الاصطناعي.');
      }

      setCurrentPlan(data.plan);
      setCurrentSceneAudios(data.sceneAudios || [null, null, null, null]);
      if (data.voiceoverWarning) {
        setWarningMessage(data.voiceoverWarning);
      }

      await renderPlanTo20SecVideo(
        data.plan,
        data.sceneAudios || [null, null, null, null],
        aspectRatio,
        themeId
      );
    } catch (err: any) {
      setStatusPhase('error');
      setErrorMessage(err?.message || 'حدث خطأ أثناء صناعة الفيديو.');
    }
  };

  const handleReRenderEditedPlan = async () => {
    if (!currentPlan) return;
    setEditingScenes(false);
    await renderPlanTo20SecVideo(
      currentPlan,
      currentSceneAudios,
      aspectRatio,
      themeId
    );
  };

  const handleDownloadVideo = (item: GeneratedVideoItem) => {
    const a = document.createElement('a');
    a.href = item.videoUrl;
    const safeTitle = item.title.replace(/[^\w\u0600-\u06FF-]+/g, '_');
    a.download = `${safeTitle}_20s.${item.fileExt}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDeleteHistoryItem = (id: string) => {
    setGeneratedVideos((prev) => {
      const target = prev.find((v) => v.id === id);
      if (target) {
        try {
          URL.revokeObjectURL(target.videoUrl);
        } catch (_) {}
      }
      const next = prev.filter((v) => v.id !== id);
      if (activeVideoId === id) {
        setActiveVideoId(next[0]?.id || null);
      }
      return next;
    });
  };

  const isBusy = statusPhase === 'generating_ai' || statusPhase === 'rendering_video';

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-l from-slate-900 via-emerald-950 to-slate-900 text-white p-6 rounded-2xl border border-emerald-700/50 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[11px] font-black">
            <Sparkles className="w-3.5 h-3.5" />
            <span>خاص بصفحة المدير فقط • مجاني 100%</span>
          </div>
          <h2 className="text-xl font-black flex items-center gap-2">
            <Film className="w-6 h-6 text-emerald-400 shrink-0" />
            <span>استوديو الذكاء الاصطناعي لصناعة الفيديوهات (20 ثانية)</span>
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
            اكتب موضوع الدرس أو الإعلان المدرسي، وسيقوم الذكاء الاصطناعي بكتابة السيناريو وتصميم فيديو تعليمي متكامل ومجاني مدته 20 ثانية بالضبط جاهز للمشاهدة والتحميل الفوري.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white/10 border border-white/15 px-4 py-3 rounded-xl shrink-0">
          <Clock className="w-5 h-5 text-emerald-400" />
          <div>
            <div className="text-[10px] text-slate-300 font-bold">مدة الفيديو الثابتة</div>
            <div className="text-sm font-black text-white">20 ثانية (4 مشاهد × 5 ث)</div>
          </div>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Controls Column */}
        <form
          onSubmit={handleGenerateVideo}
          className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-emerald-700" />
              <span>إعدادات الفيديو الذكي</span>
            </h3>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              مجاني بدون تكلفة
            </span>
          </div>

          {/* Quick Presets */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-600">
              أفكار جاهزة بضغطة زر:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  disabled={isBusy}
                  onClick={() => {
                    setTopic(preset.topic);
                    setSubject(preset.subject);
                    setGrade(preset.grade);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200 text-[11px] font-bold text-slate-700 transition cursor-pointer disabled:opacity-50"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Topic Textarea */}
          <div>
            <label className="block text-xs font-extrabold text-slate-800 mb-1.5">
              فكرة أو موضوع الفيديو المطلوب
            </label>
            <textarea
              rows={3}
              required
              disabled={isBusy}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="مثال: اشرح لطلاب ثاني متوسط حالات المادة وتحولاتها بشكل مبسط وجذاب..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-emerald-600 leading-relaxed"
            />
          </div>

          {/* Grade & Subject */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                الصف الدراسي
              </label>
              <select
                disabled={isBusy}
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:border-emerald-600"
              >
                <option value="عام لجميع الصفوف">عام لجميع الصفوف</option>
                {AVAILABLE_GRADES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                المادة / القسم
              </label>
              <select
                disabled={isBusy}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:border-emerald-600"
              >
                <option value="العلوم">العلوم</option>
                <option value="الرياضيات">الرياضيات</option>
                <option value="لغتي الخالدة">لغتي الخالدة</option>
                <option value="الاجتماعيات">الاجتماعيات</option>
                <option value="الدراسات الإسلامية">الدراسات الإسلامية</option>
                <option value="اللغة الإنجليزية">اللغة الإنجليزية</option>
                <option value="المهارات الرقمية">المهارات الرقمية</option>
                <option value="توجيه وإرشاد">توجيه وإرشاد</option>
                <option value="إدارة المدرسة">إدارة المدرسة</option>
              </select>
            </div>
          </div>

          {/* Aspect Ratio */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              مقاس الفيديو
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                disabled={isBusy}
                onClick={() => setAspectRatio('16:9')}
                className={`p-2 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-1 cursor-pointer transition ${
                  aspectRatio === '16:9'
                    ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Monitor className="w-4 h-4" />
                <span>أفقي 16:9</span>
              </button>
              <button
                type="button"
                disabled={isBusy}
                onClick={() => setAspectRatio('9:16')}
                className={`p-2 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-1 cursor-pointer transition ${
                  aspectRatio === '9:16'
                    ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>جوال 9:16</span>
              </button>
              <button
                type="button"
                disabled={isBusy}
                onClick={() => setAspectRatio('1:1')}
                className={`p-2 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-1 cursor-pointer transition ${
                  aspectRatio === '1:1'
                    ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Square className="w-4 h-4" />
                <span>مربع 1:1</span>
              </button>
            </div>
          </div>

          {/* Color Theme */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              الألوان والهوية البصرية
            </label>
            <div className="grid grid-cols-2 gap-2">
              {Object.values(THEMES).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  disabled={isBusy}
                  onClick={() => setThemeId(t.id)}
                  className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition ${
                    themeId === t.id
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-600/30'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span
                    className="w-4 h-4 rounded-full border border-white shadow-xs shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${t.bgMid}, ${t.accent})`,
                    }}
                  />
                  <span className="truncate">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Style + Voiceover */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                أسلوب العرض
              </label>
              <select
                disabled={isBusy}
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-emerald-600"
              >
                <option value="تعليمي احترافي مشوق">تعليمي احترافي مشوق</option>
                <option value="مختصر ومركز للاختبارات">مختصر ومركز للاختبارات</option>
                <option value="تحفيزي وإعلاني للمدرسة">تحفيزي وإعلاني للمدرسة</option>
              </select>
            </div>

            <button
              type="button"
              disabled={isBusy}
              onClick={() => setIncludeVoiceover(!includeVoiceover)}
              className={`mt-4 sm:mt-5 px-3 py-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition ${
                includeVoiceover
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              {includeVoiceover ? (
                <>
                  <Volume2 className="w-4 h-4 text-emerald-700" />
                  <span>تعليق صوتي تلقائي: مفعّل</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4 text-slate-500" />
                  <span>موسيقى هادئة فقط</span>
                </>
              )}
            </button>
          </div>

          {/* Error / Warning */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {warningMessage && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] font-bold text-amber-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <span>{warningMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isBusy}
            className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white font-black text-xs sm:text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
          >
            {statusPhase === 'generating_ai' ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>جاري كتابة السيناريو والصوت بالذكاء الاصطناعي...</span>
              </>
            ) : statusPhase === 'rendering_video' ? (
              <>
                <Video className="w-4 h-4 animate-pulse" />
                <span>جاري تصوير وتجميع الفيديو ({renderElapsedSec} / 20 ث)...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>إنشاء فيديو مجاني (20 ثانية) الآن</span>
              </>
            )}
          </button>
        </form>

        {/* Preview & Output Column */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <Play className="w-4 h-4 text-emerald-700" />
                <span>معاينة وتنزيل الفيديو</span>
              </h3>

              {statusPhase === 'rendering_video' && (
                <span className="text-xs font-black text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                  تقدم الإنتاج: {renderProgress}% ({renderElapsedSec}ث / 20ث)
                </span>
              )}
              {statusPhase === 'ready' && activeVideo && (
                <span className="text-xs font-black text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>جاهز • المدة 20 ثانية</span>
                </span>
              )}
            </div>

            {/* Live Rendering Canvas (visible while recording) */}
            <div
              className={`rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex flex-col items-center justify-center relative ${
                statusPhase === 'rendering_video' ? 'block' : 'hidden'
              }`}
            >
              <canvas
                ref={previewCanvasRef}
                className="w-full max-h-[420px] object-contain"
              />
              <div className="w-full bg-slate-900 p-3 space-y-1.5 border-t border-slate-800">
                <div className="flex items-center justify-between text-[11px] text-emerald-300 font-bold">
                  <span>جاري إنتاج الفيديو بجودة عالية مع الصوت والمؤثرات...</span>
                  <span>
                    {renderElapsedSec} / 20 ثانية ({renderProgress}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-150"
                    style={{ width: `${renderProgress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Final Video Player */}
            {statusPhase !== 'rendering_video' && activeVideo && (
              <div className="space-y-4">
                <div className="rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
                  <video
                    key={activeVideo.id}
                    src={activeVideo.videoUrl}
                    controls
                    playsInline
                    className="w-full max-h-[430px] object-contain"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div>
                    <div className="font-black text-xs sm:text-sm text-slate-900">
                      {activeVideo.title}
                    </div>
                    <div className="text-[11px] text-slate-500 font-semibold mt-0.5">
                      {activeVideo.subtitle} • 20 ثانية • الحجم{' '}
                      {(activeVideo.sizeBytes / (1024 * 1024)).toFixed(2)} ميجابايت
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {currentPlan && (
                      <button
                        type="button"
                        onClick={() => setEditingScenes(!editingScenes)}
                        className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>{editingScenes ? 'إخفاء التعديل' : 'تعديل النصوص'}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDownloadVideo(activeVideo)}
                      className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>تنزيل الفيديو المجاني</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Empty Placeholder before first generation */}
            {statusPhase !== 'rendering_video' && !activeVideo && (
              <div className="py-14 px-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/70 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  {statusPhase === 'generating_ai' ? (
                    <RefreshCw className="w-7 h-7 animate-spin" />
                  ) : (
                    <Video className="w-7 h-7" />
                  )}
                </div>
                <h4 className="font-black text-sm text-slate-800">
                  {statusPhase === 'generating_ai'
                    ? 'جاري تجهيز مشاهد الفيديو والتعليق الصوتي بالذكاء الاصطناعي...'
                    : 'لم يتم إنتاج فيديو بعد'}
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  {statusPhase === 'generating_ai'
                    ? 'سيبدأ التصوير المباشر تلقائياً خلال لحظات لإخراج فيديو مدته 20 ثانية.'
                    : 'اكتب فكرة الفيديو أو اختر من الأفكار الجاهزة ثم اضغط على «إنشاء فيديو مجاني (20 ثانية) الآن».'}
                </p>
              </div>
            )}
          </div>

          {/* Optional Scene Text Editor */}
          {editingScenes && currentPlan && !isBusy && (
            <div className="bg-white p-5 rounded-2xl border-2 border-emerald-500 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="font-black text-xs sm:text-sm text-slate-900">
                  تعديل مشاهد الفيديو الأربعة (5 ثوانٍ لكل مشهد)
                </h4>
                <button
                  type="button"
                  onClick={handleReRenderEditedPlan}
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>إعادة إنتاج الفيديو (20 ث)</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentPlan.scenes.map((sc, idx) => (
                  <div
                    key={sc.sceneNumber}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2"
                  >
                    <div className="text-[11px] font-black text-emerald-800">
                      المشهد {idx + 1} (5 ثوانٍ)
                    </div>
                    <input
                      type="text"
                      value={sc.heading}
                      onChange={(e) => {
                        const next = [...currentPlan.scenes];
                        next[idx] = { ...next[idx], heading: e.target.value };
                        setCurrentPlan({ ...currentPlan, scenes: next });
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                    />
                    <textarea
                      rows={2}
                      value={sc.bodyPoints.join('\n')}
                      onChange={(e) => {
                        const next = [...currentPlan.scenes];
                        next[idx] = {
                          ...next[idx],
                          bodyPoints: e.target.value.split('\n').filter(Boolean).slice(0, 3),
                        };
                        setCurrentPlan({ ...currentPlan, scenes: next });
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px]"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Session Video History */}
          {generatedVideos.length > 0 && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <h4 className="font-black text-xs text-slate-800">
                الفيديوهات المنتجة في هذه الجلسة ({generatedVideos.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {generatedVideos.map((vid) => (
                  <div
                    key={vid.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-2 transition ${
                      activeVideo?.id === vid.id
                        ? 'bg-emerald-50 border-emerald-400'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveVideoId(vid.id)}
                      className="text-right flex-1 min-w-0 cursor-pointer"
                    >
                      <div className="font-bold text-xs text-slate-900 truncate">
                        {vid.title}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        20 ث • {vid.aspectRatio} • {vid.createdAt}
                      </div>
                    </button>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleDownloadVideo(vid)}
                        className="p-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer"
                        title="تحميل الفيديو"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteHistoryItem(vid.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                        title="حذف من القائمة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
