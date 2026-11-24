import React, { useState, useRef, useEffect } from 'react';
import { AVAILABLE_GRADES, SchoolConfig } from '../types';
import { storageService } from '../services/storageService';
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
  Send,
  Eye,
  EyeOff,
  Mic,
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
  totalDurationSeconds: number;
  scenes: VideoScene[];
}

interface GeneratedVideoItem {
  id: string;
  title: string;
  subtitle: string;
  grade: string;
  subject: string;
  durationSeconds: number;
  aspectRatio: AspectRatioOption;
  themeId: ThemeOptionId;
  blob: Blob;
  videoUrl: string;
  mimeType: string;
  fileExt: string;
  sizeBytes: number;
  createdAt: string;
  hasVoiceover: boolean;
  published?: boolean;
  plan: VideoPlan;
}

type AspectRatioOption = '16:9' | '9:16' | '1:1';
type ThemeOptionId = 'emerald' | 'cosmic' | 'royal_gold' | 'violet';
type VoiceChoiceId = 'Charon' | 'Kore' | 'Puck' | 'none';

interface ThemePalette {
  id: ThemeOptionId;
  label: string;
  bgStart: string;
  bgMid: string;
  bgEnd: string;
  accent: string;
  accentSoft: string;
  cardBg: string;
  bulletBg: string;
  textPrimary: string;
  textSecondary: string;
}

const THEMES: Record<ThemeOptionId, ThemePalette> = {
  emerald: {
    id: 'emerald',
    label: 'الزمرد المدرسي',
    bgStart: '#022c22',
    bgMid: '#064e3b',
    bgEnd: '#0b1324',
    accent: '#34d399',
    accentSoft: 'rgba(52, 211, 153, 0.16)',
    cardBg: 'rgba(6, 62, 48, 0.62)',
    bulletBg: 'rgba(255, 255, 255, 0.07)',
    textPrimary: '#ffffff',
    textSecondary: '#d1fae5',
  },
  cosmic: {
    id: 'cosmic',
    label: 'الأزرق الليلي',
    bgStart: '#0f172a',
    bgMid: '#1e3a8a',
    bgEnd: '#070b14',
    accent: '#38bdf8',
    accentSoft: 'rgba(56, 189, 248, 0.16)',
    cardBg: 'rgba(23, 37, 84, 0.60)',
    bulletBg: 'rgba(255, 255, 255, 0.07)',
    textPrimary: '#ffffff',
    textSecondary: '#e0f2fe',
  },
  royal_gold: {
    id: 'royal_gold',
    label: 'الذهبي الملكي',
    bgStart: '#18181b',
    bgMid: '#27272a',
    bgEnd: '#09090b',
    accent: '#fbbf24',
    accentSoft: 'rgba(251, 191, 36, 0.16)',
    cardBg: 'rgba(39, 39, 42, 0.72)',
    bulletBg: 'rgba(255, 255, 255, 0.07)',
    textPrimary: '#ffffff',
    textSecondary: '#fef3c7',
  },
  violet: {
    id: 'violet',
    label: 'البنفسجي الإبداعي',
    bgStart: '#1e1b4b',
    bgMid: '#4c1d95',
    bgEnd: '#0f0a24',
    accent: '#c084fc',
    accentSoft: 'rgba(192, 132, 252, 0.16)',
    cardBg: 'rgba(59, 23, 114, 0.58)',
    bulletBg: 'rgba(255, 255, 255, 0.07)',
    textPrimary: '#ffffff',
    textSecondary: '#f3e8ff',
  },
};

const QUICK_PRESETS = [
  {
    label: 'تحولات الطاقة (العلوم)',
    topic: 'شرح منظم عن الطاقة وتحولاتها وأهم أشكالها في حياتنا اليومية لطلاب ثاني متوسط',
    subject: 'العلوم',
    grade: 'ثاني متوسط',
  },
  {
    label: 'نظرية فيثاغورس (الرياضيات)',
    topic: 'شرح مبسط ومنظم لنظرية فيثاغورس في المثلث القائم الزاوية مع مثال تطبيقي',
    subject: 'الرياضيات',
    grade: 'ثاني متوسط',
  },
  {
    label: 'الفاعل ونائب الفاعل (لغتي)',
    topic: 'شرح قواعد الفاعل ونائب الفاعل وعلامات رفعهما بأسلوب سهل للطلاب',
    subject: 'لغتي الخالدة',
    grade: 'ثاني متوسط',
  },
  {
    label: 'رسالة تحفيزية للاختبارات',
    topic: 'فيديو تشجيعي وتنظيمي لطلاب المدرسة للاستعداد للاختبارات وتنظيم وقت المذاكرة',
    subject: 'توجيه وإرشاد',
    grade: 'عام لجميع الصفوف',
  },
];

const DURATION_PRESETS = [20, 30, 45, 60];

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

  const pulse = 1 + Math.sin(timeSec * 3.0) * 0.055;
  const grad = ctx.createRadialGradient(0, 0, size * 0.1, 0, 0, size * 1.15 * pulse);
  grad.addColorStop(0, `${accent}36`);
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
      ctx.rotate(timeSec * 0.75 + (i * Math.PI) / 3);
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.ellipse(0, 0, size * 0.74, size * 0.27, 0, 0, Math.PI * 2);
      ctx.stroke();

      const angle = timeSec * 2.2 + i * 2.1;
      const ex = Math.cos(angle) * size * 0.74;
      const ey = Math.sin(angle) * size * 0.27;
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(ex, ey, size * 0.075, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.13, 0, Math.PI * 2);
    ctx.fill();
  } else if (motif === 'geometry') {
    ctx.save();
    ctx.rotate(timeSec * 0.4);
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      const px = Math.cos(a) * size * 0.65;
      const py = Math.sin(a) * size * 0.65;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();

    ctx.rotate(-timeSec * 0.85);
    ctx.globalAlpha = 0.65;
    ctx.beginPath();
    const s = size * 0.42;
    ctx.rect(-s, -s, s * 2, s * 2);
    ctx.stroke();
    ctx.restore();
  } else if (motif === 'book') {
    const floatY = Math.sin(timeSec * 2.2) * size * 0.05;
    ctx.translate(0, floatY);
    ctx.globalAlpha = 0.92;
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.28);
    ctx.quadraticCurveTo(-size * 0.38, -size * 0.42, -size * 0.68, -size * 0.23);
    ctx.lineTo(-size * 0.68, size * 0.33);
    ctx.quadraticCurveTo(-size * 0.36, size * 0.17, 0, size * 0.33);
    ctx.closePath();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, -size * 0.28);
    ctx.quadraticCurveTo(size * 0.38, -size * 0.42, size * 0.68, -size * 0.23);
    ctx.lineTo(size * 0.68, size * 0.33);
    ctx.quadraticCurveTo(size * 0.36, size * 0.17, 0, size * 0.33);
    ctx.closePath();
    ctx.stroke();

    ctx.globalAlpha = 0.55;
    for (let l = -1; l <= 1; l++) {
      ctx.beginPath();
      ctx.moveTo(-size * 0.48, l * size * 0.11);
      ctx.lineTo(-size * 0.15, l * size * 0.11);
      ctx.moveTo(size * 0.15, l * size * 0.11);
      ctx.lineTo(size * 0.48, l * size * 0.11);
      ctx.stroke();
    }
  } else if (motif === 'rocket') {
    const lift = Math.sin(timeSec * 2.8) * size * 0.07;
    ctx.translate(0, lift);
    ctx.rotate(-Math.PI / 4);
    ctx.globalAlpha = 0.92;
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.5, size * 0.22, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(size * 0.13, 0, size * 0.095, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.78 + Math.sin(timeSec * 14) * 0.18;
    ctx.beginPath();
    ctx.moveTo(-size * 0.5, -size * 0.09);
    ctx.lineTo(-size * 0.82 - Math.sin(timeSec * 18) * size * 0.08, 0);
    ctx.lineTo(-size * 0.5, size * 0.09);
    ctx.closePath();
    ctx.fill();
  } else if (motif === 'award') {
    ctx.save();
    ctx.scale(pulse, pulse);
    ctx.globalAlpha = 0.92;
    ctx.beginPath();
    ctx.arc(0, -size * 0.1, size * 0.42, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? size * 0.24 : size * 0.1;
      const a = (i * Math.PI) / 5 - Math.PI / 2;
      const px = Math.cos(a) * r;
      const py = -size * 0.1 + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-size * 0.2, size * 0.28);
    ctx.lineTo(-size * 0.28, size * 0.65);
    ctx.lineTo(0, size * 0.49);
    ctx.lineTo(size * 0.28, size * 0.65);
    ctx.lineTo(size * 0.2, size * 0.28);
    ctx.stroke();
    ctx.restore();
  } else {
    for (let i = 0; i < 4; i++) {
      ctx.save();
      const angle = (i * Math.PI) / 2 + timeSec * 0.45;
      const dist = i === 0 ? 0 : size * 0.5;
      const sx = i === 0 ? 0 : Math.cos(angle) * dist;
      const sy = i === 0 ? 0 : Math.sin(angle) * dist;
      const sp =
        (i === 0 ? size * 0.42 : size * 0.17) *
        (0.86 + Math.sin(timeSec * 3.6 + i) * 0.14);
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

function getSceneTimingAtElapsed(
  scenes: VideoScene[],
  elapsedMs: number,
  totalMs: number
) {
  let acc = 0;
  for (let i = 0; i < scenes.length; i++) {
    const durMs = (scenes[i].durationSeconds || 5) * 1000;
    const end = i === scenes.length - 1 ? totalMs : acc + durMs;
    if (elapsedMs <= end || i === scenes.length - 1) {
      return {
        sceneIdx: i,
        scene: scenes[i],
        sceneStartMs: acc,
        sceneDurMs: Math.max(1000, end - acc),
        sceneLocalMs: Math.max(0, elapsedMs - acc),
      };
    }
    acc = end;
  }
  return {
    sceneIdx: 0,
    scene: scenes[0],
    sceneStartMs: 0,
    sceneDurMs: 5000,
    sceneLocalMs: 0,
  };
}

function formatSecClock(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${mm > 0 ? `${mm}:` : '00:'}${ss < 10 ? '0' + ss : ss}`;
}

function drawFrameToCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  elapsedMs: number,
  plan: VideoPlan,
  theme: ThemePalette
) {
  const totalSec = plan.totalDurationSeconds || 30;
  const totalMs = totalSec * 1000;
  const clampedMs = Math.max(0, Math.min(totalMs, elapsedMs));
  const timeSec = clampedMs / 1000;

  const { sceneIdx, scene, sceneDurMs, sceneLocalMs } = getSceneTimingAtElapsed(
    plan.scenes,
    clampedMs,
    totalMs
  );
  const sceneProgress = Math.max(0, Math.min(1, sceneLocalMs / sceneDurMs));

  const isPortrait = height > width;
  const isSquare = Math.abs(width - height) < 50;
  const scale = Math.min(width, height) / 720;

  const enterAlpha = Math.min(1, sceneLocalMs / 420);
  const exitAlpha =
    sceneIdx === plan.scenes.length - 1
      ? clampedMs > totalMs - 300
        ? Math.max(0.2, (totalMs - clampedMs) / 300)
        : 1
      : sceneLocalMs > sceneDurMs - 280
      ? Math.max(0, (sceneDurMs - sceneLocalMs) / 280)
      : 1;
  const contentAlpha = Math.min(enterAlpha, exitAlpha);
  const slideOffset = (1 - Math.min(1, sceneLocalMs / 450)) * 20 * scale;

  // 1. Rich background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, theme.bgStart);
  bgGrad.addColorStop(0.5, theme.bgMid);
  bgGrad.addColorStop(1, theme.bgEnd);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Subtle floating geometric light bokeh
  ctx.save();
  for (let i = 0; i < 12; i++) {
    const px = ((i * 199 + timeSec * (14 + (i % 4) * 5)) % (width + 120)) - 60;
    const py = ((i * 141 + Math.sin(timeSec * 0.8 + i) * 28) % (height + 80)) - 40;
    const radius = (16 + (i % 5) * 13) * scale;
    ctx.fillStyle = i % 2 === 0 ? theme.accentSoft : 'rgba(255,255,255,0.035)';
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // 3. Outer subtle glowing border
  ctx.save();
  ctx.strokeStyle = `${theme.accent}40`;
  ctx.lineWidth = 2 * scale;
  drawRoundedRect(
    ctx,
    18 * scale,
    18 * scale,
    width - 36 * scale,
    height - 36 * scale,
    22 * scale
  );
  ctx.stroke();
  ctx.restore();

  // 4. Clean Top Header Bar
  const padX = (isPortrait ? 38 : 48) * scale;
  const headerY = 36 * scale;
  ctx.save();
  ctx.direction = 'rtl';

  const brandLabel = `${plan.schoolName} • ${plan.platformTitle}`;
  ctx.font = `700 ${Math.round(17 * scale)}px "Cairo", "Tajawal", sans-serif`;
  const brandW = Math.min(width * 0.56, ctx.measureText(brandLabel).width + 34 * scale);
  ctx.fillStyle = 'rgba(255,255,255,0.09)';
  drawRoundedRect(ctx, width - padX - brandW, headerY, brandW, 38 * scale, 19 * scale);
  ctx.fill();
  ctx.strokeStyle = `${theme.accent}55`;
  ctx.lineWidth = 1.4 * scale;
  ctx.stroke();

  ctx.fillStyle = theme.textSecondary;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillText(brandLabel, width - padX - 16 * scale, headerY + 19 * scale, brandW - 28 * scale);

  // Timer pill on left
  const secCurrent = Math.min(totalSec, Math.floor(clampedMs / 1000));
  const timerLabel = `${formatSecClock(secCurrent)} / ${formatSecClock(totalSec)}`;
  ctx.font = `800 ${Math.round(16 * scale)}px "Cairo", monospace`;
  const timerW = 148 * scale;
  ctx.fillStyle = theme.accentSoft;
  drawRoundedRect(ctx, padX, headerY, timerW, 38 * scale, 19 * scale);
  ctx.fill();
  ctx.strokeStyle = theme.accent;
  ctx.lineWidth = 1.4 * scale;
  ctx.stroke();

  ctx.fillStyle = theme.textPrimary;
  ctx.textAlign = 'center';
  ctx.fillText(timerLabel, padX + timerW / 2, headerY + 19 * scale);
  ctx.restore();

  // 5. Neat Master Title & Subtitle Header
  ctx.save();
  ctx.direction = 'rtl';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = theme.textPrimary;
  ctx.font = `900 ${Math.round((isPortrait ? 27 : 26) * scale)}px "Cairo", "Tajawal", sans-serif`;
  ctx.fillText(plan.videoTitle, width / 2, headerY + 50 * scale, width - padX * 2);

  ctx.fillStyle = theme.accent;
  ctx.font = `700 ${Math.round(17 * scale)}px "Cairo", "Tajawal", sans-serif`;
  ctx.fillText(plan.subtitle, width / 2, headerY + 86 * scale, width - padX * 2);
  ctx.restore();

  // 6. Main Structured Scene Card
  ctx.save();
  ctx.globalAlpha = contentAlpha;
  const cardTop = headerY + 122 * scale + slideOffset;
  const bottomReserve = 82 * scale;
  const cardHeight = height - cardTop - bottomReserve;
  const cardWidth = width - padX * 2;

  ctx.fillStyle = theme.cardBg;
  drawRoundedRect(ctx, padX, cardTop, cardWidth, cardHeight, 26 * scale);
  ctx.fill();
  ctx.strokeStyle = `${theme.accent}70`;
  ctx.lineWidth = 2 * scale;
  ctx.stroke();

  // Reserve a neat Narration Caption Strip at the bottom of the card
  const captionBarH = (isPortrait ? 76 : 62) * scale;
  const innerCardHeight = cardHeight - captionBarH - 12 * scale;

  // Motif showcase zone
  const motifSize = (isPortrait ? 76 : isSquare ? 78 : 96) * scale;
  const motifCx = isPortrait ? width / 2 : padX + cardWidth * 0.16;
  const motifCy = isPortrait
    ? cardTop + innerCardHeight * 0.17
    : cardTop + innerCardHeight * 0.5;
  drawMotifGraphic(ctx, scene.visualMotif, motifCx, motifCy, motifSize, timeSec, theme.accent);

  // Content zone (RTL)
  ctx.direction = 'rtl';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';

  const contentPadRight = 30 * scale;
  const textRightEdge = width - padX - contentPadRight;
  const textMaxWidth = isPortrait
    ? cardWidth - contentPadRight * 2
    : cardWidth * 0.64;
  let cursorY = isPortrait
    ? cardTop + innerCardHeight * 0.33
    : cardTop + 26 * scale;

  // Scene Badge
  const badgeText = `${scene.highlightBadge}  •  المشهد ${sceneIdx + 1} من ${plan.scenes.length}`;
  ctx.font = `800 ${Math.round(15 * scale)}px "Cairo", sans-serif`;
  const badgeW = Math.min(textMaxWidth, ctx.measureText(badgeText).width + 28 * scale);
  ctx.fillStyle = theme.accent;
  drawRoundedRect(ctx, textRightEdge - badgeW, cursorY, badgeW, 30 * scale, 10 * scale);
  ctx.fill();

  ctx.fillStyle = '#090d16';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(badgeText, textRightEdge - badgeW / 2, cursorY + 15 * scale, badgeW - 14 * scale);

  cursorY += 42 * scale;

  // Scene Heading
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.fillStyle = theme.textPrimary;
  const headingSize = Math.round((isPortrait ? 26 : 27) * scale);
  ctx.font = `900 ${headingSize}px "Cairo", "Tajawal", sans-serif`;
  const headingLines = wrapTextLines(ctx, scene.heading, textMaxWidth).slice(0, 2);
  for (const line of headingLines) {
    ctx.fillText(line, textRightEdge, cursorY);
    cursorY += headingSize * 1.32;
  }

  cursorY += 12 * scale;

  // Organized Bullet Cards (each bullet inside a clean translucent strip)
  const bulletFontSize = Math.round((isPortrait ? 19 : 19) * scale);
  ctx.font = `700 ${bulletFontSize}px "Cairo", "Tajawal", sans-serif`;
  const maxBodyBottom = cardTop + innerCardHeight - 10 * scale;

  scene.bodyPoints.forEach((pt, pIdx) => {
    const appearStart = 0.06 + pIdx * 0.14;
    const ptAlpha = Math.max(0, Math.min(1, (sceneProgress - appearStart) / 0.14));
    const lines = wrapTextLines(ctx, pt, textMaxWidth - 58 * scale).slice(0, 2);
    const boxH = lines.length * (bulletFontSize * 1.38) + 16 * scale;

    if (cursorY + boxH > maxBodyBottom) return;

    ctx.save();
    ctx.globalAlpha = contentAlpha * ptAlpha;

    // Glass box row
    ctx.fillStyle = theme.bulletBg;
    drawRoundedRect(ctx, textRightEdge - textMaxWidth, cursorY, textMaxWidth, boxH, 12 * scale);
    ctx.fill();

    // Number circle on right
    const numCx = textRightEdge - 20 * scale;
    const numCy = cursorY + boxH / 2;
    ctx.fillStyle = theme.accent;
    ctx.beginPath();
    ctx.arc(numCx, numCy, 12 * scale, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#090d16';
    ctx.font = `900 ${Math.round(13 * scale)}px "Cairo", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(pIdx + 1), numCx, numCy);

    // Bullet text
    ctx.fillStyle = theme.textSecondary;
    ctx.font = `700 ${bulletFontSize}px "Cairo", "Tajawal", sans-serif`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    let lineY = cursorY + 8 * scale;
    for (const wLine of lines) {
      ctx.fillText(wLine, textRightEdge - 42 * scale, lineY);
      lineY += bulletFontSize * 1.38;
    }

    ctx.restore();
    cursorY += boxH + 10 * scale;
  });

  // Live Spoken Narration Strip at bottom of card
  const captionY = cardTop + cardHeight - captionBarH - 8 * scale;
  const captionPad = 18 * scale;
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  drawRoundedRect(
    ctx,
    padX + captionPad,
    captionY,
    cardWidth - captionPad * 2,
    captionBarH,
    14 * scale
  );
  ctx.fill();
  ctx.strokeStyle = `${theme.accent}44`;
  ctx.lineWidth = 1.2 * scale;
  ctx.stroke();

  ctx.direction = 'rtl';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  const captionSize = Math.round((isPortrait ? 16 : 16.5) * scale);
  ctx.font = `700 ${captionSize}px "Cairo", "Tajawal", sans-serif`;
  const capLines = wrapTextLines(
    ctx,
    scene.narrationText,
    cardWidth - captionPad * 2 - 32 * scale
  ).slice(0, 2);
  if (capLines.length === 1) {
    ctx.fillText(capLines[0], width / 2, captionY + captionBarH / 2);
  } else {
    ctx.fillText(capLines[0], width / 2, captionY + captionBarH * 0.34);
    ctx.fillText(capLines[1], width / 2, captionY + captionBarH * 0.68);
  }
  ctx.restore();

  ctx.restore();

  // 7. Bottom Segmented Timeline Progress Bar (RTL)
  const barY = height - 52 * scale;
  const barW = width - padX * 2;
  const count = plan.scenes.length;
  const segGap = 8 * scale;
  const segW = (barW - segGap * (count - 1)) / count;

  for (let s = 0; s < count; s++) {
    const sx = width - padX - (s + 1) * segW - s * segGap;
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    drawRoundedRect(ctx, sx, barY, segW, 9 * scale, 4.5 * scale);
    ctx.fill();

    let fillRatio = 0;
    if (s < sceneIdx) fillRatio = 1;
    else if (s === sceneIdx) fillRatio = sceneProgress;

    if (fillRatio > 0) {
      ctx.fillStyle = theme.accent;
      const fw = segW * fillRatio;
      drawRoundedRect(ctx, sx + (segW - fw), barY, fw, 9 * scale, 4.5 * scale);
      ctx.fill();
    }
  }

  // Footer note
  ctx.save();
  ctx.direction = 'rtl';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(255,255,255,0.68)';
  ctx.font = `600 ${Math.round(13.5 * scale)}px "Cairo", sans-serif`;
  ctx.fillText(
    `${plan.schoolName} • الشروحات التعليمية بالذكاء الاصطناعي المجاني`,
    width / 2,
    height - 24 * scale
  );
  ctx.restore();
}

function playSoftBackgroundChimes(
  audioCtx: AudioContext,
  destination: MediaStreamAudioDestinationNode,
  scenes: VideoScene[],
  hasVoice: boolean
) {
  const masterGain = audioCtx.createGain();
  // Keep chimes subtle so teacher explanation voice is crisp & dominant
  masterGain.gain.value = hasVoice ? 0.022 : 0.055;
  masterGain.connect(destination);

  const chords = [
    [261.63, 329.63, 392.0],
    [293.66, 369.99, 440.0],
    [329.63, 392.0, 493.88],
    [293.66, 349.23, 440.0],
    [261.63, 329.63, 392.0, 523.25],
    [261.63, 329.63, 392.0, 523.25],
  ];

  const baseTime = audioCtx.currentTime;
  let offsetSec = 0;
  scenes.forEach((sc, idx) => {
    const dur = sc.durationSeconds || 5;
    const chord = chords[idx % chords.length];
    const startAt = baseTime + offsetSec;

    chord.forEach((freq, noteIdx) => {
      const osc = audioCtx.createOscillator();
      const noteGain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startAt + noteIdx * 0.07);

      noteGain.gain.setValueAtTime(0.0001, startAt + noteIdx * 0.07);
      noteGain.gain.exponentialRampToValueAtTime(0.32, startAt + noteIdx * 0.07 + 0.14);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, startAt + Math.max(1.5, dur - 0.25));

      osc.connect(noteGain);
      noteGain.connect(masterGain);

      osc.start(startAt + noteIdx * 0.07);
      osc.stop(startAt + dur);
    });

    offsetSec += dur;
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

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

interface AIVideoStudioProps {
  config: SchoolConfig;
  onUpdateConfig?: (newConfig: SchoolConfig) => void;
  onRefreshSummaries?: () => void;
}

export const AIVideoStudio: React.FC<AIVideoStudioProps> = ({
  config,
  onUpdateConfig,
  onRefreshSummaries,
}) => {
  const [topic, setTopic] = useState('');
  const [grade, setGrade] = useState<string>(config.defaultGrade || 'ثاني متوسط');
  const [subject, setSubject] = useState('العلوم');
  const [style, setStyle] = useState('تعليمي احترافي مرتب وواضح');
  const [durationSeconds, setDurationSeconds] = useState<number>(30);
  const [aspectRatio, setAspectRatio] = useState<AspectRatioOption>('16:9');
  const [themeId, setThemeId] = useState<ThemeOptionId>('emerald');
  const [voiceChoice, setVoiceChoice] = useState<VoiceChoiceId>('Charon');

  const [statusPhase, setStatusPhase] = useState<
    'idle' | 'generating_ai' | 'rendering_video' | 'ready' | 'error'
  >('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [renderProgress, setRenderProgress] = useState<number>(0);
  const [renderElapsedSec, setRenderElapsedSec] = useState<number>(0);
  const [renderTargetSec, setRenderTargetSec] = useState<number>(30);

  const [currentPlan, setCurrentPlan] = useState<VideoPlan | null>(null);
  const [currentFullAudio, setCurrentFullAudio] = useState<string | null>(null);
  const [currentSceneAudios, setCurrentSceneAudios] = useState<(string | null)[]>([]);
  const [editingScenes, setEditingScenes] = useState<boolean>(false);
  const [generatedVideos, setGeneratedVideos] = useState<GeneratedVideoItem[]>([]);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

  // Publish to "الشروحات" state
  const [isPublishingVideo, setIsPublishingVideo] = useState(false);
  const [publishImportant, setPublishImportant] = useState(false);
  const [publishRequiresInfo, setPublishRequiresInfo] = useState(false);

  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const isUnmountedRef = useRef<boolean>(false);

  const activeVideo =
    generatedVideos.find((v) => v.id === activeVideoId) || generatedVideos[0] || null;
  const isExplanationsVisible = config.isExplanationsEnabled !== false;

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

  const handleToggleExplanationsVisibility = async () => {
    const nextVal = !isExplanationsVisible;
    const updated: SchoolConfig = {
      ...config,
      isExplanationsEnabled: nextVal,
      isManagerConfigured: true,
      lastUpdatedTimestamp: Date.now(),
    };
    await storageService.saveConfig(updated);
    onUpdateConfig?.(updated);
    setSuccessBanner(
      nextVal
        ? 'تم إظهار خانة «الشروحات» وتعميمها على جميع جوالات الطلاب فوراً!'
        : 'تم إخفاء خانة «الشروحات» عن جميع جوالات الطلاب بنجاح!'
    );
    setTimeout(() => setSuccessBanner(null), 4000);
  };

  const renderPlanToVideo = async (
    planToRender: VideoPlan,
    audios: (string | null)[],
    fullAudioB64: string | null,
    chosenRatio: AspectRatioOption,
    chosenTheme: ThemeOptionId
  ) => {
    stopActiveRecording();
    const totalSec = planToRender.totalDurationSeconds || durationSeconds;
    const totalMs = totalSec * 1000;

    setStatusPhase('rendering_video');
    setRenderProgress(0);
    setRenderElapsedSec(0);
    setRenderTargetSec(totalSec);
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
    const hasVoiceTracks = Boolean(fullAudioB64) || (Array.isArray(audios) && audios.some(Boolean));

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
        playSoftBackgroundChimes(audioCtx, dest, planToRender.scenes, hasVoiceTracks);

        if (hasVoiceTracks) {
          const compressor = audioCtx.createDynamicsCompressor();
          const voiceGain = audioCtx.createGain();
          voiceGain.gain.value = 1.3;
          voiceGain.connect(compressor);
          compressor.connect(dest);

          const baseTime = audioCtx.currentTime;

          if (fullAudioB64) {
            try {
              const decodedBuffer = await audioCtx.decodeAudioData(
                base64ToArrayBuffer(fullAudioB64)
              );
              const source = audioCtx.createBufferSource();
              source.buffer = decodedBuffer;
              const safeTotalSlot = Math.max(4, totalSec - 0.8);
              if (decodedBuffer.duration > safeTotalSlot) {
                source.playbackRate.value = Math.min(1.3, decodedBuffer.duration / safeTotalSlot);
              }
              source.connect(voiceGain);
              source.start(baseTime + 0.35);
            } catch (e) {
              console.warn('Could not decode full narration audio:', e);
            }
          } else {
            let sceneOffsetSec = 0;
            await Promise.all(
              planToRender.scenes.map(async (scene, sIdx) => {
                const slotStart = sceneOffsetSec;
                const slotDur = scene.durationSeconds || 5;
                sceneOffsetSec += slotDur;

                const b64 = audios[sIdx];
                if (!b64 || !audioCtx) return;
                try {
                  const decodedBuffer = await audioCtx.decodeAudioData(
                    base64ToArrayBuffer(b64)
                  );
                  const source = audioCtx.createBufferSource();
                  source.buffer = decodedBuffer;
                  const safeSlot = Math.max(2, slotDur - 0.35);
                  if (decodedBuffer.duration > safeSlot) {
                    source.playbackRate.value = Math.min(1.35, decodedBuffer.duration / safeSlot);
                  }
                  source.connect(voiceGain);
                  source.start(baseTime + slotStart + 0.15);
                } catch (e) {
                  console.warn('Could not decode scene voice audio:', e);
                }
              })
            );
          }
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
            videoBitsPerSecond: 2_600_000,
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

    drawFrameToCanvas(ctx, dimensions.w, dimensions.h, 0, planToRender, theme);
    recorder.start(250);

    const startTime = performance.now();

    const step = (now: number) => {
      if (isUnmountedRef.current) return;
      const elapsed = now - startTime;
      const pct = Math.min(100, Math.round((elapsed / totalMs) * 100));
      setRenderProgress(pct);
      setRenderElapsedSec(Math.min(totalSec, Math.floor(elapsed / 1000)));

      drawFrameToCanvas(ctx, dimensions.w, dimensions.h, elapsed, planToRender, theme);

      if (elapsed < totalMs) {
        animFrameRef.current = requestAnimationFrame(step);
      } else {
        drawFrameToCanvas(ctx, dimensions.w, dimensions.h, totalMs, planToRender, theme);
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
      grade,
      subject,
      durationSeconds: totalSec,
      aspectRatio: chosenRatio,
      themeId: chosenTheme,
      blob,
      videoUrl: url,
      mimeType: blob.type || 'video/webm',
      fileExt: ext,
      sizeBytes: blob.size,
      hasVoiceover: hasVoiceTracks,
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
    setRenderElapsedSec(totalSec);
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
    setSuccessBanner(null);
    setRenderProgress(0);
    setRenderElapsedSec(0);
    setRenderTargetSec(durationSeconds);

    try {
      const response = await fetch('/api/ai/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          grade,
          subject,
          style,
          durationSeconds,
          voiceName: voiceChoice === 'none' ? 'Charon' : voiceChoice,
          includeVoiceover: voiceChoice !== 'none',
        }),
      });

      const data = await response.json();
      if (!response.ok || !data?.success || !data?.plan) {
        throw new Error(data?.error || 'تعذر الاتصال بخدمة الذكاء الاصطناعي.');
      }

      setCurrentPlan(data.plan);
      setCurrentFullAudio(data.fullAudio || null);
      setCurrentSceneAudios(data.sceneAudios || []);
      if (data.voiceoverWarning) {
        setWarningMessage(data.voiceoverWarning);
      }

      await renderPlanToVideo(
        data.plan,
        data.sceneAudios || [],
        data.fullAudio || null,
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
    await renderPlanToVideo(
      currentPlan,
      currentSceneAudios,
      currentFullAudio,
      aspectRatio,
      themeId
    );
  };

  const handlePublishToExplanations = async (vid: GeneratedVideoItem) => {
    setIsPublishingVideo(true);
    setErrorMessage(null);
    try {
      const dataUrl = await blobToDataUrl(vid.blob);
      const safeName = `${vid.title.replace(/[^\w\u0600-\u06FF-]+/g, '_')}_${vid.durationSeconds}s.${vid.fileExt}`;

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: safeName,
          fileType: vid.mimeType,
          fileData: dataUrl,
        }),
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok || !uploadData?.url) {
        throw new Error(uploadData?.error || 'تعذر رفع الفيديو إلى الخادم.');
      }

      const explanationText = vid.plan.scenes
        .map((sc, i) => `${i + 1}) ${sc.heading}:\n${sc.narrationText}`)
        .join('\n\n');

      await storageService.addSummary({
        title: vid.title,
        grade: vid.grade === 'عام لجميع الصفوف' ? (config.defaultGrade || 'ثاني متوسط') : vid.grade,
        subject: vid.subject,
        category: 'الشروحات',
        summaryText: explanationText,
        attachmentUrl: uploadData.url,
        attachmentType: 'video',
        attachmentName: safeName,
        isImportant: publishImportant,
        isExclusive: publishImportant,
        requiresStudentInfo: publishRequiresInfo,
      });

      // Ensure الشروحات tab is enabled if manager publishes a video
      if (config.isExplanationsEnabled === false) {
        const updated: SchoolConfig = {
          ...config,
          isExplanationsEnabled: true,
          isManagerConfigured: true,
          lastUpdatedTimestamp: Date.now(),
        };
        await storageService.saveConfig(updated);
        onUpdateConfig?.(updated);
      }

      setGeneratedVideos((prev) =>
        prev.map((item) => (item.id === vid.id ? { ...item, published: true } : item))
      );

      onRefreshSummaries?.();
      setSuccessBanner(
        `تم إضافة الفيديو إلى خانة «الشروحات» لمادة (${vid.subject}) وتعميمه على جميع جوالات الطلاب بنجاح!`
      );
    } catch (err: any) {
      setErrorMessage(err?.message || 'حدث خطأ أثناء نشر الفيديو في خانة الشروحات.');
    } finally {
      setIsPublishingVideo(false);
    }
  };

  const handleDownloadVideo = (item: GeneratedVideoItem) => {
    const a = document.createElement('a');
    a.href = item.videoUrl;
    const safeTitle = item.title.replace(/[^\w\u0600-\u06FF-]+/g, '_');
    a.download = `${safeTitle}_${item.durationSeconds}s.${item.fileExt}`;
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
      {/* Header Banner + Explanations Visibility Switch */}
      <div className="bg-gradient-to-l from-slate-900 via-emerald-950 to-slate-900 text-white p-6 rounded-2xl border border-emerald-700/50 shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[11px] font-black">
            <Sparkles className="w-3.5 h-3.5" />
            <span>خاص بصفحة المدير فقط • مجاني بالكامل</span>
          </div>
          <h2 className="text-xl font-black flex items-center gap-2">
            <Film className="w-6 h-6 text-emerald-400 shrink-0" />
            <span>استوديو الذكاء الاصطناعي لصناعة الفيديوهات التعليمية</span>
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
            اختر المدة التي تناسبك (من 15 إلى 60 ثانية)، وسيقوم الذكاء الاصطناعي بترتيب المشاهد وإضافة صوت يشرح الدرس بوضوح، مع إمكانية نشر الفيديو مباشرة في خانة <strong>«الشروحات»</strong> داخل المواد للطلاب.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-2.5 bg-white/10 border border-white/15 px-4 py-2.5 rounded-xl">
            <Clock className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <div className="text-[10px] text-slate-300 font-bold">المدة المختارة</div>
              <div className="text-sm font-black text-white">{durationSeconds} ثانية</div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleToggleExplanationsVisibility}
            className={`px-4 py-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 border transition cursor-pointer ${
              isExplanationsVisible
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 shadow-sm'
                : 'bg-rose-900/90 hover:bg-rose-800 text-rose-100 border-rose-500/60'
            }`}
            title="إظهار أو إخفاء خانة الشروحات عند الطلاب في جميع الجوالات"
          >
            {isExplanationsVisible ? (
              <>
                <Eye className="w-4 h-4" />
                <span>خانة الشروحات للطلاب: ظاهرة ✓</span>
              </>
            ) : (
              <>
                <EyeOff className="w-4 h-4" />
                <span>خانة الشروحات للطلاب: مخفية</span>
              </>
            )}
          </button>
        </div>
      </div>

      {successBanner && (
        <div className="p-3.5 bg-emerald-50 border-2 border-emerald-400 rounded-xl text-xs font-black text-emerald-900 flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{successBanner}</span>
        </div>
      )}

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
              <span>إعدادات الفيديو والشرح الصوتي</span>
            </h3>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              مرتب ومنظم + مجاني
            </span>
          </div>

          {/* Quick Presets */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-600">
              أفكار دروس جاهزة:
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
              موضوع الدرس أو فكرة الفيديو المطلوب شرحه
            </label>
            <textarea
              rows={3}
              required
              disabled={isBusy}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="مثال: اشرح لطلاب ثاني متوسط درس الطاقة وتحولاتها بأسلوب مرتب ومفهوم..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-emerald-600 leading-relaxed"
            />
          </div>

          {/* Flexible Duration Picker (Manager decides 15s-60s) */}
          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-700" />
                <span>مدة المقطع المطلوبة:</span>
              </label>
              <span className="text-xs font-black text-white bg-emerald-700 px-2.5 py-0.5 rounded-lg">
                {durationSeconds} ثانية
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {DURATION_PRESETS.map((sec) => (
                <button
                  key={sec}
                  type="button"
                  disabled={isBusy}
                  onClick={() => setDurationSeconds(sec)}
                  className={`py-1.5 rounded-lg text-xs font-extrabold border transition cursor-pointer ${
                    durationSeconds === sec
                      ? 'bg-emerald-700 text-white border-emerald-800 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50'
                  }`}
                >
                  {sec} ث
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 pt-1">
              <span className="text-[10px] font-bold text-slate-500">15ث</span>
              <input
                type="range"
                min={15}
                max={60}
                step={5}
                disabled={isBusy}
                value={durationSeconds}
                onChange={(e) => setDurationSeconds(Number(e.target.value))}
                className="flex-1 accent-emerald-700 cursor-pointer"
              />
              <span className="text-[10px] font-bold text-slate-500">60ث</span>
            </div>
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
                {AVAILABLE_GRADES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
                <option value="عام لجميع الصفوف">عام لجميع الصفوف</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                المادة الدراسية
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
              </select>
            </div>
          </div>

          {/* Voice Teacher Narration Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5 text-emerald-700" />
              <span>الصوت الشارح للفيديو</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={isBusy}
                onClick={() => setVoiceChoice('Charon')}
                className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition ${
                  voiceChoice === 'Charon'
                    ? 'bg-emerald-700 text-white border-emerald-800'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Volume2 className="w-3.5 h-3.5 shrink-0" />
                <span>صوت معلم واضح</span>
              </button>

              <button
                type="button"
                disabled={isBusy}
                onClick={() => setVoiceChoice('Kore')}
                className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition ${
                  voiceChoice === 'Kore'
                    ? 'bg-emerald-700 text-white border-emerald-800'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Volume2 className="w-3.5 h-3.5 shrink-0" />
                <span>صوت معلمة واضح</span>
              </button>

              <button
                type="button"
                disabled={isBusy}
                onClick={() => setVoiceChoice('Puck')}
                className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition ${
                  voiceChoice === 'Puck'
                    ? 'bg-emerald-700 text-white border-emerald-800'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Volume2 className="w-3.5 h-3.5 shrink-0" />
                <span>صوت شبابي مشوّق</span>
              </button>

              <button
                type="button"
                disabled={isBusy}
                onClick={() => setVoiceChoice('none')}
                className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition ${
                  voiceChoice === 'none'
                    ? 'bg-slate-800 text-white border-slate-900'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <VolumeX className="w-3.5 h-3.5 shrink-0" />
                <span>موسيقى هادئة فقط</span>
              </button>
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
              الألوان والتصميم
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
                <span>جاري إعداد المشاهد والشرح الصوتي...</span>
              </>
            ) : statusPhase === 'rendering_video' ? (
              <>
                <Video className="w-4 h-4 animate-pulse" />
                <span>
                  جاري تصوير الفيديو ({renderElapsedSec} / {renderTargetSec} ث)...
                </span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>إنشاء فيديو تعليمي مجاني ({durationSeconds} ثانية)</span>
              </>
            )}
          </button>
        </form>

        {/* Preview, Publish & Output Column */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <Play className="w-4 h-4 text-emerald-700" />
                <span>معاينة الفيديو وإضافته للشروحات</span>
              </h3>

              {statusPhase === 'rendering_video' && (
                <span className="text-xs font-black text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                  تقدم الإنتاج: {renderProgress}% ({renderElapsedSec}ث / {renderTargetSec}ث)
                </span>
              )}
              {statusPhase === 'ready' && activeVideo && (
                <span className="text-xs font-black text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    جاهز • {activeVideo.durationSeconds} ثانية{' '}
                    {activeVideo.hasVoiceover ? '• بشرح صوتي ✓' : ''}
                  </span>
                </span>
              )}
            </div>

            {/* Live Rendering Canvas */}
            <div
              className={`rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex flex-col items-center justify-center relative ${
                statusPhase === 'rendering_video' ? 'block' : 'hidden'
              }`}
            >
              <canvas
                ref={previewCanvasRef}
                className="w-full max-h-[430px] object-contain"
              />
              <div className="w-full bg-slate-900 p-3 space-y-1.5 border-t border-slate-800">
                <div className="flex items-center justify-between text-[11px] text-emerald-300 font-bold">
                  <span>جاري دمج الشرح الصوتي وتصوير المشاهد بانتظام...</span>
                  <span>
                    {renderElapsedSec} / {renderTargetSec} ثانية ({renderProgress}%)
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

            {/* Final Video Player + Publish to Explanations */}
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
                      {activeVideo.subtitle} • {activeVideo.durationSeconds} ثانية •{' '}
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
                        <span>{editingScenes ? 'إخفاء التعديل' : 'تعديل المشاهد'}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDownloadVideo(activeVideo)}
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>تنزيل الفيديو</span>
                    </button>
                  </div>
                </div>

                {/* Publish Directly to Student "الشروحات" Section */}
                <div className="p-4 rounded-2xl bg-emerald-50/90 border-2 border-emerald-400 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="font-black text-xs sm:text-sm text-emerald-950">
                        نشر الفيديو في خانة «الشروحات» للطلاب (تتعمم في كل الجوالات)
                      </h4>
                      <p className="text-[11px] text-emerald-800">
                        عند اختيار الطالب لمادة ({activeVideo.subject}) سيظهر له خيار <strong>الشروحات</strong> لمشاهدة هذا الفيديو وتنزيله.
                      </p>
                    </div>
                    {activeVideo.published && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-700 text-white text-[11px] font-black shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>منشور في الشروحات ✓</span>
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-800 font-bold">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={publishImportant}
                        onChange={(e) => setPublishImportant(e.target.checked)}
                        className="w-4 h-4 accent-emerald-700"
                      />
                      <span>حصري للطلاب المسجلين فقط</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={publishRequiresInfo}
                        onChange={(e) => setPublishRequiresInfo(e.target.checked)}
                        className="w-4 h-4 accent-emerald-700"
                      />
                      <span>يطلب كتابة اسم الطالب قبل التنزيل</span>
                    </label>
                  </div>

                  <button
                    type="button"
                    disabled={isPublishingVideo}
                    onClick={() => handlePublishToExplanations(activeVideo)}
                    className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white font-black text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isPublishingVideo ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>جاري الرفع والنشر لجميع الجوالات...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>
                          {activeVideo.published
                            ? 'إعادة النشر في خانة الشروحات'
                            : 'إضافة ونشر هذا الفيديو في خانة «الشروحات» الآن'}
                        </span>
                      </>
                    )}
                  </button>
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
                    ? 'جاري ترتيب المشاهد وكتابة وتجهيز الشرح الصوتي...'
                    : 'لم يتم إنتاج فيديو بعد'}
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  {statusPhase === 'generating_ai'
                    ? `سيبدأ التصوير التلقائي خلال لحظات لإخراج فيديو منظم مدته ${durationSeconds} ثانية.`
                    : 'اكتب فكرة الدرس وحدد المدة المطلوبة (20 ث أو 30 ث أو حتى 60 ث) ثم اضغط إنشاء.'}
                </p>
              </div>
            )}
          </div>

          {/* Optional Scene Editor */}
          {editingScenes && currentPlan && !isBusy && (
            <div className="bg-white p-5 rounded-2xl border-2 border-emerald-500 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="font-black text-xs sm:text-sm text-slate-900">
                  تعديل مشاهد الفيديو ({currentPlan.scenes.length} مشاهد)
                </h4>
                <button
                  type="button"
                  onClick={handleReRenderEditedPlan}
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>إعادة التصوير ({currentPlan.totalDurationSeconds} ث)</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentPlan.scenes.map((sc, idx) => (
                  <div
                    key={sc.sceneNumber}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2"
                  >
                    <div className="text-[11px] font-black text-emerald-800">
                      المشهد {idx + 1} ({sc.durationSeconds} ثوانٍ)
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
                الفيديوهات المصنوعة في هذه الجلسة ({generatedVideos.length})
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
                        {vid.durationSeconds} ث • {vid.aspectRatio} • {vid.createdAt}
                        {vid.published ? ' • منشور ✓' : ''}
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
