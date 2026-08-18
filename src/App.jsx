import React, { useState, useEffect, useMemo } from "react";
import {
  Heart,
  RefreshCw,
  HelpCircle,
  Film,
  Settings as SettingsIcon,
  Plus,
  Minus,
  Trash2,
  Star,
  X,
  Check,
} from "lucide-react";
import { getShared, setShared, deleteShared, subscribeShared, getLocal, setLocal } from "./lib/storage";

/* ---------------------------------------------------------
   Data
--------------------------------------------------------- */

const TAGS = [
  { key: "repas", label: "Repas", emoji: "🍽️", color: "#D9A441" },
  { key: "sortie", label: "Sortie", emoji: "🎉", color: "#C43A64" },
  { key: "cocooning", label: "Cocooning", emoji: "🛋️", color: "#6B4C6E" },
  { key: "exterieur", label: "Extérieur", emoji: "🌳", color: "#7C8F6D" },
];
const TAG_MAP = Object.fromEntries(TAGS.map((t) => [t.key, t]));

const DEFAULT_WHEEL_ITEMS = [
  { id: "w1", text: "Soirée jeux de société avec un plateau de fromages", tag: "cocooning" },
  { id: "w2", text: "Pique-nique au coucher du soleil", tag: "exterieur" },
  { id: "w3", text: "Cours de cuisine à deux, nouvelle recette jamais tentée", tag: "repas" },
  { id: "w4", text: "Marathon de la série qu'on n'a jamais fini", tag: "cocooning" },
  { id: "w5", text: "Rando avec pause pique-nique", tag: "exterieur" },
  { id: "w6", text: "Escape game entre nous", tag: "sortie" },
  { id: "w7", text: "Ciné maison, pop-corn et plaid", tag: "cocooning" },
  { id: "w8", text: "Balade à vélo suivie d'une glace", tag: "exterieur" },
  { id: "w9", text: "Fondue savoyarde à la maison", tag: "repas" },
  { id: "w10", text: "Karaoké maison, playlist improbable", tag: "cocooning" },
  { id: "w11", text: "Visite d'une expo ou d'un musée", tag: "sortie" },
  { id: "w12", text: "Bar à jeux ou bar à cocktails", tag: "sortie" },
  { id: "w13", text: "Session photos improvisée en ville", tag: "sortie" },
  { id: "w14", text: "Brunch dominical dans un nouvel endroit", tag: "repas" },
  { id: "w15", text: "Spa maison : masques, bougies, playlist chill", tag: "cocooning" },
  { id: "w16", text: "Petit marché, puis on cuisine ce qu'on trouve", tag: "repas" },
];

const DEFAULT_STATS = [
  { id: "s1", name: "Fous rires mémorables", count: 0 },
  { id: "s2", name: "Nouveaux restos testés", count: 0 },
];

const QUESTIONS = [
  "Qui est le plus susceptible d'oublier où sont les clés ?",
  "Qui est le plus susceptible de finir le paquet de gâteaux en cachette ?",
  "Qui est le plus susceptible de danser dans la cuisine en cuisinant ?",
  "Qui est le plus susceptible de pleurer devant un film qui n'est même pas triste ?",
  "Qui est le plus susceptible de gagner à un jeu et de le rappeler pendant une semaine ?",
  "Qui est le plus susceptible de s'endormir avant la fin du film ?",
  "Qui est le plus susceptible de mettre 20 minutes de plus à se préparer ?",
  "Qui est le plus susceptible d'acheter un truc inutile juste parce que c'était en promo ?",
  "Qui est le plus susceptible de chanter faux à fond dans la voiture ?",
  "Qui est le plus susceptible de râler après avoir perdu à un jeu ?",
  "Qui est le plus susceptible de proposer un plan improvisé à la dernière minute ?",
  "Qui est le plus susceptible de prendre 100 photos pour n'en garder qu'une ?",
  "Qui est le plus susceptible de finir les restes de l'autre sans demander ?",
  "Qui est le plus susceptible d'être en retard à un rendez-vous ?",
  "Qui est le plus susceptible de se souvenir de l'anniversaire de tout le monde ?",
  "Qui est le plus susceptible de râler contre la météo ?",
  "Qui est le plus susceptible de vouloir refaire la déco de l'appart ?",
  "Qui est le plus susceptible de dire 'un dernier épisode' et d'en regarder trois ?",
  "Qui est le plus susceptible de vouloir une revanche immédiate après une défaite ?",
  "Qui est le plus susceptible d'envoyer un mème au pire moment possible ?",
  "Qui est le plus susceptible d'oublier la liste de courses chez soi ?",
  "Qui est le plus susceptible de proposer une soirée pyjama improvisée ?",
  "Qui est le plus susceptible d'être le plus stressé avant un entretien ?",
  "Qui est le plus susceptible de vouloir tester un resto sans lire un seul avis ?",
  "Qui est le plus susceptible de garder rancune pour un truc totalement anodin ?",
  "Qui est le plus susceptible de faire la même blague nulle en boucle ?",
  "Qui est le plus susceptible de réclamer un câlin en plein milieu d'une tâche ?",
  "Qui est le plus susceptible de planifier les vacances six mois à l'avance ?",
  "Qui est le plus susceptible de changer d'avis sur le film au dernier moment ?",
  "Qui est le plus susceptible de vider le paquet de chips en 'juste une poignée' ?",
];

/* ---------------------------------------------------------
   Helpers
--------------------------------------------------------- */

const uid = () => Math.random().toString(36).slice(2, 9);
const todayKey = () => new Date().toISOString().slice(0, 10);

function seedIndex(dateStr, len) {
  let sum = 0;
  for (let i = 0; i < dateStr.length; i++) sum += dateStr.charCodeAt(i);
  return sum % len;
}

function breakdown(startStr) {
  const start = new Date(startStr + "T00:00:00");
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const totalDays = Math.floor((end - start) / 86400000);
  let y = end.getFullYear() - start.getFullYear();
  let m = end.getMonth() - start.getMonth();
  let d = end.getDate() - start.getDate();
  if (d < 0) {
    const prevMonthLastDay = new Date(end.getFullYear(), end.getMonth(), 0).getDate();
    d += prevMonthLastDay;
    m -= 1;
  }
  if (m < 0) {
    y -= 1;
    m += 12;
  }
  return { totalDays, y, m, d };
}

function formatDateFr(dateStr) {
  try {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch (e) {
    return dateStr;
  }
}

/* ---------------------------------------------------------
   Styles
--------------------------------------------------------- */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Space+Grotesk:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap');

:root{
  --paper:#F6EDE4;
  --card:#FFFBF6;
  --ink:#2B2438;
  --ink-soft:#786C86;
  --berry:#C43A64;
  --berry-deep:#8C1F3D;
  --rose:#E8748F;
  --mustard:#D9A441;
  --sage:#7C8F6D;
  --plum:#6B4C6E;
  --line:#D8C6B4;
}

*{ box-sizing:border-box; }
html, body, #root{ height:100%; }
body{ margin:0; background:var(--paper); }

.cc-root{
  font-family:'Space Grotesk', sans-serif;
  background:var(--paper);
  color:var(--ink);
  min-height:100vh;
  position:relative;
  isolation:isolate;
}
.cc-root::before{
  content:'';
  position:fixed;
  inset:0;
  background-image:
    radial-gradient(680px 560px at 6% -6%, rgba(232,116,143,0.28), transparent 62%),
    radial-gradient(640px 560px at 100% 4%, rgba(196,58,100,0.22), transparent 60%),
    radial-gradient(700px 620px at -6% 50%, rgba(140,31,61,0.19), transparent 62%),
    radial-gradient(680px 620px at 106% 62%, rgba(217,164,65,0.1), transparent 60%),
    radial-gradient(740px 660px at -2% 100%, rgba(232,116,143,0.24), transparent 62%),
    radial-gradient(720px 640px at 104% 100%, rgba(140,31,61,0.24), transparent 60%);
  pointer-events:none;
  z-index:0;
}
.cc-root::after{
  content:'';
  position:fixed;
  inset:0;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'%3E%3C/feTurbulence%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'%3E%3C/rect%3E%3C/svg%3E");
  opacity:0.05;
  mix-blend-mode:multiply;
  pointer-events:none;
  z-index:0;
}
.cc-root :focus-visible{ outline:2px solid var(--berry); outline-offset:2px; }

.cc-shell{
  max-width:460px;
  margin:0 auto;
  min-height:100vh;
  display:flex;
  flex-direction:column;
  padding:18px 16px 90px;
  position:relative;
  z-index:1;
}

.cc-header{
  display:flex;
  align-items:center;
  justify-content:space-between;
  margin-bottom:18px;
}
.cc-wordmark{
  font-family:'Fraunces', serif;
  font-weight:600;
  font-size:22px;
  letter-spacing:-0.01em;
  background:linear-gradient(100deg, var(--rose) 0%, var(--berry) 50%, var(--berry-deep) 100%);
  -webkit-background-clip:text;
  background-clip:text;
  -webkit-text-fill-color:transparent;
  color:var(--ink);
}
.cc-role{
  font-family:'Space Mono', monospace;
  font-size:11px;
  color:var(--ink-soft);
  margin-top:2px;
}
.cc-gear{
  background:var(--card);
  border:1px solid var(--line);
  border-radius:12px;
  padding:9px;
  cursor:pointer;
  color:var(--ink);
  display:flex;
  box-shadow:0 3px 10px rgba(43,36,56,0.08);
  transition:transform .18s ease, background .18s ease, box-shadow .18s ease;
}
.cc-gear:hover{ background:var(--paper); transform:rotate(24deg); box-shadow:0 5px 14px rgba(43,36,56,0.14); }
.cc-gear:active{ transform:rotate(24deg) scale(0.92); }

.ticket{
  background:linear-gradient(180deg, var(--card) 0%, #FFF7ED 100%);
  border:1px solid var(--line);
  border-radius:16px;
  padding:20px;
  position:relative;
  box-shadow:0 2px 4px rgba(43,36,56,0.05), 0 14px 30px -12px rgba(196,58,100,0.28);
  overflow:hidden;
}
.ticket::before{
  content:'';
  position:absolute;
  top:0; left:18px; right:18px;
  height:4px;
  border-radius:0 0 6px 6px;
  background:linear-gradient(90deg, var(--rose), var(--berry), var(--berry-deep));
}

.stub-row{
  display:flex;
  background:var(--card);
  border:1px solid var(--line);
  border-radius:14px;
  overflow:visible;
  position:relative;
  margin-bottom:10px;
  box-shadow:0 6px 16px -8px rgba(43,36,56,0.18);
  transition:transform .15s ease, box-shadow .15s ease;
}
.stub-row:hover{ transform:translateY(-1px); box-shadow:0 10px 20px -10px rgba(43,36,56,0.24); }
.stub-main{ flex:1; padding:12px 14px; min-width:0; }
.stub-side{
  width:78px;
  flex-shrink:0;
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  gap:6px;
  padding:10px 6px;
  position:relative;
  border-left:2px dashed var(--line);
}
.stub-side::before, .stub-side::after{
  content:'';
  position:absolute;
  width:16px;
  height:16px;
  background:var(--paper);
  border-radius:50%;
  left:-9px;
}
.stub-side::before{ top:-9px; }
.stub-side::after{ bottom:-9px; }

.tag-chip{
  display:inline-flex;
  align-items:center;
  gap:5px;
  border-radius:999px;
  padding:6px 11px;
  font-size:12.5px;
  font-weight:600;
  border:1.5px solid var(--line);
  background:var(--card);
  color:var(--ink-soft);
  cursor:pointer;
  transition:transform .15s ease, box-shadow .15s ease, background .15s ease;
}
.tag-chip.active{
  color:#fff;
  border-color:transparent;
  box-shadow:0 4px 12px -3px rgba(43,36,56,0.35);
}
.tag-chip:active{ transform:scale(0.96); }
@media (hover:hover){
  .tag-chip:hover{ transform:translateY(-1px); }
}

.btn{
  font-family:'Space Grotesk', sans-serif;
  font-weight:600;
  border-radius:12px;
  padding:11px 16px;
  border:none;
  cursor:pointer;
  font-size:14px;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  gap:7px;
  transition:transform .12s ease, opacity .12s ease, box-shadow .18s ease;
}
.btn:active{ transform:scale(0.97); }
.btn:disabled{ opacity:.45; cursor:not-allowed; }
.btn-primary{ background:var(--ink); color:var(--paper); box-shadow:0 6px 16px -6px rgba(43,36,56,0.55); }
.btn-berry{ background:linear-gradient(135deg, var(--berry), var(--berry-deep)); color:#fff; box-shadow:0 6px 18px -6px rgba(196,58,100,0.65); animation:btnGlow 2.6s ease-in-out infinite; }
.btn-ghost{ background:transparent; color:var(--ink); border:1.5px solid var(--line); }
.btn-danger{ background:#B94A3D; color:#fff; box-shadow:0 6px 16px -6px rgba(185,74,61,0.55); }
.btn-block{ width:100%; }
.btn-sm{ padding:7px 10px; font-size:12.5px; border-radius:10px; }
.btn:disabled{ animation:none; }
@keyframes btnGlow{
  0%, 100%{ box-shadow:0 6px 18px -6px rgba(196,58,100,0.65); }
  50%{ box-shadow:0 6px 22px -4px rgba(196,58,100,0.9); }
}
@media (hover:hover){
  .btn:not(:disabled):hover{ transform:translateY(-1px); }
}
.icon-btn{
  background:var(--paper);
  border:1px solid var(--line);
  border-radius:9px;
  width:32px; height:32px;
  display:flex; align-items:center; justify-content:center;
  cursor:pointer;
  color:var(--ink);
  transition:transform .15s ease, background .15s ease;
}
.icon-btn:active{ transform:scale(0.92); }
@media (hover:hover){
  .icon-btn:hover{ background:var(--card); transform:translateY(-1px); }
}

.field{
  width:100%;
  background:var(--paper);
  border:1.5px solid var(--line);
  border-radius:11px;
  padding:11px 13px;
  font-family:'Space Grotesk', sans-serif;
  font-size:14px;
  color:var(--ink);
  box-shadow:inset 0 1px 3px rgba(43,36,56,0.06);
  transition:border-color .15s ease, box-shadow .15s ease;
}
.field:focus{ border-color:var(--berry); outline:none; box-shadow:inset 0 1px 3px rgba(43,36,56,0.06), 0 0 0 3px rgba(196,58,100,0.15); }
label.cc-label{
  font-size:12px;
  font-weight:600;
  color:var(--ink-soft);
  margin-bottom:5px;
  display:block;
  text-transform:uppercase;
  letter-spacing:.04em;
}

.section-title{
  font-family:'Fraunces', serif;
  font-weight:600;
  font-size:19px;
  margin:0 0 12px;
  display:flex;
  align-items:center;
  gap:8px;
}
.section-title::before{
  content:'';
  width:9px; height:9px;
  border-radius:50%;
  background:linear-gradient(135deg, var(--rose), var(--berry));
  flex-shrink:0;
}
.dashed-divider{
  border:none;
  border-top:2px dashed var(--line);
  margin:16px 0;
  position:relative;
}
.dashed-divider::after{
  content:'';
  position:absolute;
  top:-4px; left:50%;
  transform:translateX(-50%);
  width:8px; height:8px;
  border-radius:50%;
  background:var(--berry);
  box-shadow:0 0 0 4px var(--paper);
}

.wheel-wrap{
  display:flex;
  flex-direction:column;
  align-items:center;
  padding:14px 0 6px;
}
.wheel-pointer{
  width:0; height:0;
  border-left:11px solid transparent;
  border-right:11px solid transparent;
  border-top:18px solid var(--ink);
  margin-bottom:-4px;
  z-index:2;
  filter:drop-shadow(0 3px 4px rgba(43,36,56,0.3));
}
.wheel-disc{
  width:240px; height:240px;
  border-radius:50%;
  border:6px solid var(--card);
  box-shadow:0 0 0 2px var(--line), 0 14px 28px rgba(43,36,56,0.18);
  transition:transform 3.2s cubic-bezier(0.15, 0.75, 0.15, 1), box-shadow .3s ease;
  position:relative;
}
.wheel-disc.spinning{
  box-shadow:0 0 0 2px var(--line), 0 0 0 10px rgba(196,58,100,0.12), 0 16px 34px rgba(43,36,56,0.24);
}
.wheel-hub{
  position:absolute; top:50%; left:50%;
  width:46px; height:46px;
  transform:translate(-50%,-50%);
  background:var(--card);
  border-radius:50%;
  border:3px solid var(--ink);
  display:flex; align-items:center; justify-content:center;
  font-size:19px;
  box-shadow:0 3px 8px rgba(43,36,56,0.2);
}

.result-ticket{
  margin-top:18px;
  animation:pop .4s cubic-bezier(0.2, 0.9, 0.3, 1.3);
}
@keyframes pop{
  from{ opacity:0; transform:translateY(10px) scale(0.94); }
  to{ opacity:1; transform:translateY(0) scale(1); }
}

.legend-row{
  display:flex;
  align-items:center;
  gap:8px;
  padding:9px 8px;
  border-bottom:1px dashed var(--line);
  font-size:13.5px;
  border-radius:8px;
  transition:background .15s ease;
}
@media (hover:hover){
  .legend-row:hover{ background:rgba(255,255,255,0.5); }
}
.legend-dot{ width:9px; height:9px; border-radius:50%; flex-shrink:0; box-shadow:0 0 0 3px rgba(255,255,255,0.5); }

.star-row{ display:flex; gap:3px; }

.stat-tile{
  background:linear-gradient(160deg, var(--card) 0%, #FFF4E6 100%);
  border:1px solid var(--line);
  border-radius:14px;
  padding:14px;
  display:flex;
  flex-direction:column;
  gap:8px;
  box-shadow:0 10px 22px -14px rgba(43,36,56,0.4);
  transition:transform .15s ease, box-shadow .15s ease;
}
@media (hover:hover){
  .stat-tile:hover{ transform:translateY(-2px); box-shadow:0 14px 26px -14px rgba(43,36,56,0.5); }
}
.stat-count{
  font-family:'Space Mono', monospace;
  font-size:28px;
  font-weight:700;
  background:linear-gradient(100deg, var(--rose), var(--berry-deep));
  -webkit-background-clip:text;
  background-clip:text;
  -webkit-text-fill-color:transparent;
}

.bottom-nav{
  position:fixed;
  bottom:14px; left:50%;
  transform:translateX(-50%);
  width:calc(100% - 32px);
  max-width:428px;
  background:linear-gradient(160deg, #352C44, var(--ink));
  border-radius:18px;
  display:flex;
  padding:6px;
  gap:4px;
  box-shadow:0 10px 30px rgba(43,36,56,0.35);
  z-index:20;
}
.nav-btn{
  flex:1;
  display:flex;
  flex-direction:column;
  align-items:center;
  gap:3px;
  padding:9px 4px 7px;
  border-radius:13px;
  background:transparent;
  border:none;
  color:#C9BFD4;
  cursor:pointer;
  font-family:'Space Grotesk', sans-serif;
  font-size:10.5px;
  font-weight:600;
  transition:background .18s ease, color .18s ease;
}
.nav-btn svg{ transition:transform .18s ease; }
.nav-btn.active{ background:linear-gradient(135deg, var(--berry), var(--berry-deep)); color:#fff; box-shadow:0 4px 14px -3px rgba(196,58,100,0.7); }
.nav-btn.active svg{ transform:scale(1.12); }
.nav-btn:active svg{ transform:scale(0.9); }

.modal-overlay{
  position:fixed; inset:0;
  background:rgba(43,36,56,0.55);
  backdrop-filter:blur(2px);
  display:flex; align-items:flex-end;
  justify-content:center;
  z-index:50;
  padding:0;
  animation:overlayIn .2s ease;
}
@keyframes overlayIn{
  from{ opacity:0; }
  to{ opacity:1; }
}
.modal-card{
  background:linear-gradient(180deg, var(--paper), #F2E4D4);
  width:100%;
  max-width:460px;
  border-radius:22px 22px 0 0;
  padding:26px 20px 26px;
  max-height:88vh;
  overflow-y:auto;
  position:relative;
  box-shadow:0 -12px 40px rgba(43,36,56,0.25);
  animation:sheetUp .32s cubic-bezier(0.16, 0.84, 0.44, 1);
}
.modal-card::before{
  content:'';
  position:absolute;
  top:10px; left:50%;
  transform:translateX(-50%);
  width:40px; height:4px;
  border-radius:999px;
  background:var(--line);
}
@keyframes sheetUp{
  from{ opacity:0; transform:translateY(24px); }
  to{ opacity:1; transform:translateY(0); }
}
.modal-title{
  font-family:'Fraunces', serif;
  font-weight:600;
  font-size:20px;
  margin:0 0 4px;
}
.modal-sub{
  font-size:13px;
  color:var(--ink-soft);
  margin:0 0 18px;
}

.empty-note{
  text-align:center;
  padding:26px 14px;
  color:var(--ink-soft);
  font-size:13.5px;
  border:1.5px dashed var(--line);
  border-radius:14px;
  background:rgba(255,255,255,0.35);
}

.empty-state{
  text-align:center;
  padding:30px 18px;
  border:1.5px dashed var(--line);
  border-radius:16px;
  background:rgba(255,255,255,0.35);
}
.empty-state-icon{
  width:46px; height:46px;
  border-radius:50%;
  margin:0 auto 12px;
  display:flex; align-items:center; justify-content:center;
  background:linear-gradient(135deg, var(--rose), var(--berry));
  color:#fff;
  box-shadow:0 8px 18px -8px rgba(196,58,100,0.55);
}
.empty-state-title{
  font-weight:600;
  font-size:14px;
  color:var(--ink);
  margin-bottom:4px;
}
.empty-state-sub{
  font-size:12.5px;
  color:var(--ink-soft);
  max-width:260px;
  margin:0 auto;
}

.tab-panel{ animation:tabIn .3s cubic-bezier(0.16, 0.84, 0.44, 1); }
@keyframes tabIn{
  from{ opacity:0; transform:translateY(8px); }
  to{ opacity:1; transform:translateY(0); }
}

::-webkit-scrollbar{ width:8px; height:8px; }
::-webkit-scrollbar-thumb{ background:var(--line); border-radius:999px; }
::-webkit-scrollbar-thumb:hover{ background:var(--ink-soft); }

.confetti-layer{
  position:fixed;
  inset:0;
  pointer-events:none;
  z-index:80;
  overflow:hidden;
}
.confetti-piece{
  position:absolute;
  top:-14px;
  border-radius:2px;
  opacity:0;
  animation:confettiFall var(--dur, 1.8s) cubic-bezier(0.15, 0.6, 0.4, 1) forwards;
  animation-delay:var(--delay, 0s);
}
@keyframes confettiFall{
  0%{ opacity:0; transform:translate(0, 0) rotate(0deg); }
  8%{ opacity:1; }
  100%{ opacity:0; transform:translate(var(--drift, 0px), 100vh) rotate(var(--rot, 360deg)); }
}

.onboarding-icon{
  width:56px; height:56px;
  border-radius:50%;
  background:linear-gradient(135deg, var(--rose), var(--berry));
  display:flex; align-items:center; justify-content:center;
  margin:0 auto 14px;
  color:#fff;
  animation:heartbeat 1.8s ease-in-out infinite;
  box-shadow:0 8px 20px -8px rgba(196,58,100,0.6);
}
@keyframes heartbeat{
  0%, 100%{ transform:scale(1); }
  15%{ transform:scale(1.12); }
  30%{ transform:scale(1); }
  45%{ transform:scale(1.08); }
  60%{ transform:scale(1); }
}
.stagger-in{
  animation:fadeUp .45s cubic-bezier(0.16, 0.84, 0.44, 1) both;
  animation-delay:var(--stagger-delay, 0s);
}
@keyframes fadeUp{
  from{ opacity:0; transform:translateY(10px); }
  to{ opacity:1; transform:translateY(0); }
}

@media (prefers-reduced-motion: reduce){
  .wheel-disc{ transition:none; }
  .result-ticket{ animation:none; }
  .btn-berry{ animation:none; }
  .tab-panel{ animation:none; }
  .modal-card{ animation:none; }
  .modal-overlay{ animation:none; }
  .confetti-layer{ display:none; }
  .onboarding-icon{ animation:none; }
  .stagger-in{ animation:none; }
}
`;

/* ---------------------------------------------------------
   Small shared bits
--------------------------------------------------------- */

function LoadingScreen() {
  return (
    <div className="cc-root" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div style={{ textAlign: "center", color: "var(--ink-soft)", fontFamily: "'Space Grotesk', sans-serif" }}>
        <div style={{ fontSize: 26, marginBottom: 8 }}>💌</div>
        Ouverture du carnet…
      </div>
    </div>
  );
}

function Confetti({ burstId }) {
  const pieces = useMemo(() => {
    if (!burstId) return [];
    const colors = ["var(--berry)", "var(--rose)", "var(--mustard)", "var(--sage)", "var(--plum)"];
    return Array.from({ length: 28 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.25,
      duration: 1.5 + Math.random() * 0.9,
      drift: (Math.random() - 0.5) * 140,
      rot: 360 + Math.random() * 360,
      color: colors[i % colors.length],
      wide: i % 3 === 0,
    }));
  }, [burstId]);

  if (!burstId) return null;

  return (
    <div className="confetti-layer" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            background: p.color,
            width: p.wide ? 10 : 7,
            height: p.wide ? 7 : 13,
            "--delay": `${p.delay}s`,
            "--dur": `${p.duration}s`,
            "--drift": `${p.drift}px`,
            "--rot": `${p.rot}deg`,
          }}
        />
      ))}
    </div>
  );
}

function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div className="empty-state">
      {Icon && (
        <div className="empty-state-icon">
          <Icon size={20} />
        </div>
      )}
      <div className="empty-state-title">{title}</div>
      {subtitle && <div className="empty-state-sub">{subtitle}</div>}
    </div>
  );
}

function Stars({ value, onChange, size = 16 }) {
  return (
    <div className="star-row">
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          onClick={() => onChange && onChange(n)}
          style={{ cursor: onChange ? "pointer" : "default", display: "flex" }}
        >
          <Star size={size} fill={n <= value ? "#D9A441" : "none"} color={n <= value ? "#D9A441" : "#C9B8A8"} />
        </span>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------
   Nous tab (home)
--------------------------------------------------------- */

function NousTab({ settings, stats, onChangeStats }) {
  const [newStatName, setNewStatName] = useState("");
  const { totalDays, y, m, d } = breakdown(settings.startDate);
  const isFuture = totalDays < 0;

  function addStat() {
    if (!newStatName.trim()) return;
    onChangeStats([...stats, { id: uid(), name: newStatName.trim(), count: 0 }]);
    setNewStatName("");
  }
  function inc(id, delta) {
    onChangeStats(stats.map((s) => (s.id === id ? { ...s, count: Math.max(0, s.count + delta) } : s)));
  }
  function removeStat(id) {
    onChangeStats(stats.filter((s) => s.id !== id));
  }

  return (
    <div>
      <div className="ticket" style={{ textAlign: "center" }}>
        <div style={{ fontSize: 11, letterSpacing: ".08em", color: "var(--ink-soft)", textTransform: "uppercase", fontFamily: "'Space Mono', monospace" }}>
          Carte d'embarquement
        </div>
        <div className="cc-wordmark" style={{ fontSize: 26, margin: "8px 0 2px" }}>
          {settings.nameA} <Heart size={18} style={{ display: "inline", verticalAlign: -2 }} color="#C43A64" fill="#C43A64" /> {settings.nameB}
        </div>
        <div style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>Embarqués ensemble le {formatDateFr(settings.startDate)}</div>

        <hr className="dashed-divider" />

        {isFuture ? (
          <div style={{ fontSize: 15 }}>Le compte à rebours démarre bientôt ✨</div>
        ) : (
          <>
            <div className="stat-count" style={{ fontSize: 44 }}>{totalDays}</div>
            <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>jours ensemble</div>
            <div style={{ fontSize: 12.5, marginTop: 6, color: "var(--ink-soft)" }}>
              soit {y} an{y !== 1 ? "s" : ""}, {m} mois et {d} jour{d !== 1 ? "s" : ""}
            </div>
          </>
        )}
      </div>

      <div className="section-title" style={{ marginTop: 22 }}>Nos petites stats</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {stats.map((s) => (
          <div className="stat-tile" key={s.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.25 }}>{s.name}</div>
              <button className="icon-btn" style={{ width: 24, height: 24, flexShrink: 0 }} onClick={() => removeStat(s.id)} aria-label="Supprimer la stat">
                <Trash2 size={12} />
              </button>
            </div>
            <div className="stat-count">{s.count}</div>
            <div style={{ display: "flex", gap: 6 }}>
              <button className="icon-btn" onClick={() => inc(s.id, -1)} aria-label="Moins"><Minus size={14} /></button>
              <button className="icon-btn" onClick={() => inc(s.id, 1)} aria-label="Plus"><Plus size={14} /></button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input
          className="field"
          placeholder="Nouvelle stat (ex : pizzas mangées)"
          value={newStatName}
          onChange={(e) => setNewStatName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addStat()}
        />
        <button className="btn btn-primary" onClick={addStat} aria-label="Ajouter la stat">
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   Wheel tab
--------------------------------------------------------- */

function WheelTab({ items, onChangeItems }) {
  const [activeTags, setActiveTags] = useState(TAGS.map((t) => t.key));
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [pending, setPending] = useState(null);
  const [result, setResult] = useState(null);
  const [editing, setEditing] = useState(false);
  const [newText, setNewText] = useState("");
  const [newTag, setNewTag] = useState(TAGS[0].key);

  const filtered = items.filter((it) => activeTags.includes(it.tag));
  const n = filtered.length;
  const segAngle = n > 0 ? 360 / n : 0;

  const gradient = useMemo(() => {
    if (n === 0) return "var(--line)";
    const stops = filtered.map((it, i) => {
      const c = TAG_MAP[it.tag]?.color || "var(--line)";
      const start = (i * segAngle).toFixed(3);
      const end = ((i + 1) * segAngle).toFixed(3);
      return `${c} ${start}deg ${end}deg`;
    });
    return `conic-gradient(${stops.join(",")})`;
  }, [filtered, segAngle, n]);

  function toggleTag(key) {
    setActiveTags((prev) => {
      if (prev.includes(key)) {
        if (prev.length === 1) return prev;
        return prev.filter((k) => k !== key);
      }
      return [...prev, key];
    });
  }

  function spin() {
    if (n === 0 || spinning) return;
    setResult(null);
    const idx = Math.floor(Math.random() * n);
    const target = (360 - (idx * segAngle + segAngle / 2) + 360) % 360;
    const currentMod = ((rotation % 360) + 360) % 360;
    let delta = target - currentMod;
    if (delta <= 0) delta += 360;
    const extraSpins = 5 * 360;
    setPending(filtered[idx]);
    setSpinning(true);
    setRotation((r) => r + extraSpins + delta);
  }

  function handleTransitionEnd(e) {
    if (!spinning || e.propertyName !== "transform") return;
    setSpinning(false);
    setResult(pending);
  }

  function addItem() {
    if (!newText.trim()) return;
    onChangeItems([...items, { id: uid(), text: newText.trim(), tag: newTag }]);
    setNewText("");
  }
  function removeItem(id) {
    onChangeItems(items.filter((i) => i.id !== id));
  }

  return (
    <div>
      <div className="section-title">La roue des dates</div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 6 }}>
        {TAGS.map((t) => {
          const active = activeTags.includes(t.key);
          return (
            <button key={t.key} className={`tag-chip ${active ? "active" : ""}`} style={active ? { background: t.color } : {}} onClick={() => toggleTag(t.key)}>
              <span>{t.emoji}</span>{t.label}
            </button>
          );
        })}
      </div>

      <div className="wheel-wrap">
        <div className="wheel-pointer" />
        <div className={`wheel-disc ${spinning ? "spinning" : ""}`} style={{ background: gradient, transform: `rotate(${rotation}deg)` }} onTransitionEnd={handleTransitionEnd}>
          <div className="wheel-hub">🎡</div>
        </div>

        <button className="btn btn-berry" style={{ marginTop: 20 }} onClick={spin} disabled={n === 0 || spinning}>
          <RefreshCw size={16} /> {spinning ? "Ça tourne…" : "Faire tourner"}
        </button>

        {n === 0 && (
          <EmptyState
            icon={RefreshCw}
            title="La roue est vide"
            subtitle="Active au moins une catégorie pour la faire tourner."
          />
        )}

        {result && !spinning && (
          <div className="ticket result-ticket" style={{ marginTop: 4, textAlign: "center", width: "100%" }}>
            <div style={{ fontSize: 11, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: ".06em" }}>
              {TAG_MAP[result.tag]?.emoji} {TAG_MAP[result.tag]?.label}
            </div>
            <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 18, marginTop: 6 }}>{result.text}</div>
          </div>
        )}
      </div>

      <hr className="dashed-divider" />

      <button className="btn btn-ghost btn-block" onClick={() => setEditing((e) => !e)}>
        {editing ? "Fermer la liste" : "Gérer les idées"}
      </button>

      {editing && (
        <div style={{ marginTop: 14 }}>
          {items.map((it) => (
            <div className="legend-row" key={it.id}>
              <span className="legend-dot" style={{ background: TAG_MAP[it.tag]?.color }} />
              <span style={{ flex: 1 }}>{it.text}</span>
              <button className="icon-btn" onClick={() => removeItem(it.id)} aria-label="Supprimer l'idée">
                <Trash2 size={13} />
              </button>
            </div>
          ))}

          <div style={{ marginTop: 12 }}>
            <label className="cc-label">Nouvelle idée</label>
            <input className="field" value={newText} onChange={(e) => setNewText(e.target.value)} placeholder="Ex : Soirée crêpes maison" />
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 9, marginBottom: 9 }}>
              {TAGS.map((t) => (
                <button key={t.key} className={`tag-chip ${newTag === t.key ? "active" : ""}`} style={newTag === t.key ? { background: t.color } : {}} onClick={() => setNewTag(t.key)}>
                  {t.emoji} {t.label}
                </button>
              ))}
            </div>
            <button className="btn btn-primary btn-block" onClick={addItem}>
              <Plus size={15} /> Ajouter à la roue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------
   Questions tab
--------------------------------------------------------- */

function QuestionsTab({ qLog, onUpdateLog, whoami, settings }) {
  const key = todayKey();
  const idx = seedIndex(key, QUESTIONS.length);
  const question = QUESTIONS[idx];
  const entry = qLog[key] || { qIndex: idx, picks: { A: null, B: null } };
  const partnerRole = whoami === "A" ? "B" : "A";
  const bothAnswered = entry.picks.A && entry.picks.B;
  const agree = bothAnswered && entry.picks.A === entry.picks.B;
  const nameFor = (role) => (role === "A" ? settings.nameA : settings.nameB);

  const [burstId, setBurstId] = useState(0);
  const [celebratedKey, setCelebratedKey] = useState(null);

  useEffect(() => {
    if (agree && celebratedKey !== key) {
      setCelebratedKey(key);
      setBurstId((n) => n + 1);
    }
  }, [agree, key, celebratedKey]);

  function choose(role) {
    const newEntry = { ...entry, picks: { ...entry.picks, [whoami]: role } };
    onUpdateLog({ ...qLog, [key]: newEntry });
  }

  const historyKeys = Object.keys(qLog)
    .filter((k) => k !== key && qLog[k].picks.A && qLog[k].picks.B)
    .sort()
    .reverse()
    .slice(0, 6);

  return (
    <div>
      <Confetti key={burstId} burstId={burstId} />
      <div className="section-title">Question du jour</div>

      <div className="ticket">
        <div style={{ fontSize: 11, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: ".06em", fontFamily: "'Space Mono', monospace" }}>
          {formatDateFr(key)}
        </div>
        <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 19, margin: "10px 0 16px", lineHeight: 1.35 }}>{question}</div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="btn btn-block"
            style={{ background: entry.picks[whoami] === "A" ? "var(--berry)" : "var(--paper)", color: entry.picks[whoami] === "A" ? "#fff" : "var(--ink)", border: "1.5px solid var(--line)" }}
            onClick={() => choose("A")}
          >
            {settings.nameA}
          </button>
          <button
            className="btn btn-block"
            style={{ background: entry.picks[whoami] === "B" ? "var(--berry)" : "var(--paper)", color: entry.picks[whoami] === "B" ? "#fff" : "var(--ink)", border: "1.5px solid var(--line)" }}
            onClick={() => choose("B")}
          >
            {settings.nameB}
          </button>
        </div>

        {!entry.picks[whoami] && <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 10 }}>Ta réponse n'est pas encore enregistrée.</div>}

        {bothAnswered && (
          <>
            <hr className="dashed-divider" />
            {entry.picks.A === entry.picks.B ? (
              <div style={{ textAlign: "center", fontWeight: 600 }}>Vous êtes d'accord : {nameFor(entry.picks.A)} ! 🎉</div>
            ) : (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Débat ! 👀</div>
                <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>
                  {settings.nameA} dit {nameFor(entry.picks.A)}, {settings.nameB} dit {nameFor(entry.picks.B)}.
                </div>
              </div>
            )}
          </>
        )}
        {!bothAnswered && entry.picks[whoami] && (
          <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 10, textAlign: "center" }}>
            En attente de la réponse de {nameFor(partnerRole)}…
          </div>
        )}
      </div>

      {historyKeys.length > 0 && (
        <>
          <div className="section-title" style={{ marginTop: 22, fontSize: 16 }}>Petit historique</div>
          {historyKeys.map((k) => {
            const e = qLog[k];
            return (
              <div className="legend-row" key={k} style={{ flexDirection: "column", alignItems: "flex-start", gap: 3, padding: "10px 4px" }}>
                <div style={{ fontSize: 11, color: "var(--ink-soft)", fontFamily: "'Space Mono', monospace" }}>{formatDateFr(k)}</div>
                <div style={{ fontSize: 13 }}>{QUESTIONS[e.qIndex]}</div>
                <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                  {e.picks.A === e.picks.B ? `D'accord : ${nameFor(e.picks.A)}` : `${settings.nameA} → ${nameFor(e.picks.A)} · ${settings.nameB} → ${nameFor(e.picks.B)}`}
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

/* ---------------------------------------------------------
   Watchlist tab
--------------------------------------------------------- */

function WatchlistTab({ items, onChange }) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("Film");
  const [highlighted, setHighlighted] = useState(null);
  const [drawing, setDrawing] = useState(false);
  const [showWatched, setShowWatched] = useState(false);

  const toWatch = items.filter((i) => i.status === "a_voir");
  const watched = items.filter((i) => i.status === "vu");

  function addItem() {
    if (!title.trim()) return;
    onChange([...items, { id: uid(), title: title.trim(), type, status: "a_voir", rating: 0 }]);
    setTitle("");
  }
  function markWatched(id) {
    onChange(items.map((i) => (i.id === id ? { ...i, status: "vu", rating: i.rating || 3 } : i)));
  }
  function setRating(id, r) {
    onChange(items.map((i) => (i.id === id ? { ...i, rating: r } : i)));
  }
  function removeItem(id) {
    onChange(items.filter((i) => i.id !== id));
  }
  function draw() {
    if (toWatch.length === 0 || drawing) return;
    setDrawing(true);
    let count = 0;
    const iv = setInterval(() => {
      const r = toWatch[Math.floor(Math.random() * toWatch.length)];
      setHighlighted(r.id);
      count++;
      if (count > 14) {
        clearInterval(iv);
        setDrawing(false);
      }
    }, 110);
  }

  return (
    <div>
      <div className="section-title">Films & séries</div>

      <div className="ticket" style={{ marginBottom: 16 }}>
        <label className="cc-label">Titre</label>
        <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addItem()} placeholder="Ex : Le voyage de Chihiro" />
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          {["Film", "Série"].map((t) => (
            <button key={t} className={`tag-chip ${type === t ? "active" : ""}`} style={type === t ? { background: "var(--plum)" } : {}} onClick={() => setType(t)}>
              {t === "Film" ? "🎬" : "📺"} {t}
            </button>
          ))}
        </div>
        <button className="btn btn-primary btn-block" style={{ marginTop: 12 }} onClick={addItem}>
          <Plus size={15} /> Ajouter à la liste
        </button>
      </div>

      <button className="btn btn-berry btn-block" onClick={draw} disabled={toWatch.length === 0}>
        <RefreshCw size={16} /> {drawing ? "Tirage en cours…" : "On sait pas quoi choisir → tirer au sort"}
      </button>

      <div style={{ marginTop: 16 }}>
        {toWatch.length === 0 && (
          <EmptyState
            icon={Film}
            title="Rien à voir pour l'instant"
            subtitle="Ajoute un titre pour commencer la liste."
          />
        )}
        {toWatch.map((it) => (
          <div className="stub-row" key={it.id} style={{ borderColor: highlighted === it.id ? "var(--berry)" : "var(--line)", boxShadow: highlighted === it.id ? "0 0 0 2px var(--berry)" : "none" }}>
            <div className="stub-main">
              <div style={{ fontWeight: 600, fontSize: 14 }}>{it.title}</div>
              <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>{it.type === "Film" ? "🎬 Film" : "📺 Série"}</div>
            </div>
            <div className="stub-side">
              <button className="icon-btn" onClick={() => markWatched(it.id)} aria-label="Marquer comme vu"><Check size={14} /></button>
              <button className="icon-btn" onClick={() => removeItem(it.id)} aria-label="Supprimer"><Trash2 size={12} /></button>
            </div>
          </div>
        ))}
      </div>

      {watched.length > 0 && (
        <>
          <button className="btn btn-ghost btn-block" style={{ marginTop: 10 }} onClick={() => setShowWatched((s) => !s)}>
            {showWatched ? "Masquer" : "Voir"} les déjà-vus ({watched.length})
          </button>
          {showWatched && (
            <div style={{ marginTop: 10 }}>
              {watched.map((it) => (
                <div className="stub-row" key={it.id}>
                  <div className="stub-main">
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{it.title}</div>
                    <div style={{ marginTop: 4 }}>
                      <Stars value={it.rating} onChange={(r) => setRating(it.id, r)} size={14} />
                    </div>
                  </div>
                  <div className="stub-side">
                    <button className="icon-btn" onClick={() => removeItem(it.id)} aria-label="Supprimer"><Trash2 size={12} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ---------------------------------------------------------
   Settings / onboarding modals
--------------------------------------------------------- */

function OnboardingModal({ onSave }) {
  const [nameA, setNameA] = useState("");
  const [nameB, setNameB] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="onboarding-icon stagger-in" style={{ "--stagger-delay": "0s" }}>
          <Heart size={24} fill="#fff" />
        </div>
        <div className="modal-title stagger-in" style={{ "--stagger-delay": "0.06s", textAlign: "center" }}>
          Bienvenue dans votre carnet 💌
        </div>
        <div className="modal-sub stagger-in" style={{ "--stagger-delay": "0.1s", textAlign: "center" }}>
          Quelques infos pour tout personnaliser.
        </div>

        <div className="stagger-in" style={{ "--stagger-delay": "0.16s" }}>
          <label className="cc-label">Premier prénom</label>
          <input className="field" value={nameA} onChange={(e) => setNameA(e.target.value)} style={{ marginBottom: 12 }} />
        </div>

        <div className="stagger-in" style={{ "--stagger-delay": "0.22s" }}>
          <label className="cc-label">Deuxième prénom</label>
          <input className="field" value={nameB} onChange={(e) => setNameB(e.target.value)} style={{ marginBottom: 12 }} />
        </div>

        <div className="stagger-in" style={{ "--stagger-delay": "0.28s" }}>
          <label className="cc-label">Ensemble depuis le</label>
          <input type="date" className="field" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ marginBottom: 18 }} />
        </div>

        <button
          className="btn btn-primary btn-block stagger-in"
          style={{ "--stagger-delay": "0.34s" }}
          disabled={!nameA.trim() || !nameB.trim() || !startDate}
          onClick={() => onSave({ nameA: nameA.trim(), nameB: nameB.trim(), startDate })}
        >
          C'est parti !
        </button>
      </div>
    </div>
  );
}

const PROPOSAL_STEPS = {
  ask1: { text: "Veux-tu devenir officiellement ma petite amie ?", back: "pick" },
  ask2: { text: "Es-tu sûre ?", back: "ask1" },
  ask3: { text: "T'es vraiment sûre de faire ça ?", back: "ask2" },
  ask4: { text: "Non mais attends, tu sais dans quoi tu t'embarques là ? (y'aura aucun retour en arrière possible)", back: "ask3" },
};
const PROPOSAL_NEXT = { ask1: "ask2", ask2: "ask3", ask3: "ask4" };

function RolePickerModal({ settings, onPick }) {
  const [step, setStep] = useState("pick");
  const [pendingRole, setPendingRole] = useState(null);

  function handleChoose(role, name) {
    if (name.trim().toLowerCase() === "julia") {
      setPendingRole(role);
      setStep("ask1");
    } else {
      onPick(role);
    }
  }

  function handleNo() {
    const back = PROPOSAL_STEPS[step].back;
    setStep(back);
    if (back === "pick") setPendingRole(null);
  }

  function handleYes() {
    if (step === "ask4") {
      onPick(pendingRole, { celebrate: true });
      return;
    }
    setStep(PROPOSAL_NEXT[step]);
  }

  if (step === "pick") {
    return (
      <div className="modal-overlay" style={{ alignItems: "center" }}>
        <div className="modal-card" style={{ borderRadius: 22 }}>
          <div className="modal-title">Et toi, tu es qui ?</div>
          <div className="modal-sub">Cet appareil s'en souviendra pour le petit jeu de questions.</div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-primary btn-block" onClick={() => handleChoose("A", settings.nameA)}>{settings.nameA}</button>
            <button className="btn btn-primary btn-block" onClick={() => handleChoose("B", settings.nameB)}>{settings.nameB}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" style={{ alignItems: "center" }}>
      <div className="modal-card" style={{ textAlign: "center", borderRadius: 22 }}>
        <div className="onboarding-icon">
          <Heart size={24} fill="#fff" />
        </div>
        <div className="modal-title" style={{ textAlign: "center" }}>{PROPOSAL_STEPS[step].text}</div>
        <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
          <button className="btn btn-berry btn-block" onClick={handleYes}>Oui</button>
          <button className="btn btn-ghost btn-block" onClick={handleNo}>Non</button>
        </div>
      </div>
    </div>
  );
}

function SettingsModal({ settings, whoami, onClose, onSaveSettings, onChangeRole, onReset }) {
  const [nameA, setNameA] = useState(settings.nameA);
  const [nameB, setNameB] = useState(settings.nameB);
  const [startDate, setStartDate] = useState(settings.startDate);
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <div className="modal-title">Réglages</div>
          <button className="icon-btn" onClick={onClose} aria-label="Fermer"><X size={16} /></button>
        </div>

        <label className="cc-label">Premier prénom</label>
        <input className="field" value={nameA} onChange={(e) => setNameA(e.target.value)} style={{ marginBottom: 12 }} />
        <label className="cc-label">Deuxième prénom</label>
        <input className="field" value={nameB} onChange={(e) => setNameB(e.target.value)} style={{ marginBottom: 12 }} />
        <label className="cc-label">Ensemble depuis le</label>
        <input type="date" className="field" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ marginBottom: 14 }} />
        <button className="btn btn-primary btn-block" onClick={() => onSaveSettings({ nameA: nameA.trim() || settings.nameA, nameB: nameB.trim() || settings.nameB, startDate })}>
          Enregistrer
        </button>

        <hr className="dashed-divider" />

        <label className="cc-label">Cet appareil, c'est</label>
        <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
          <button className={`tag-chip ${whoami === "A" ? "active" : ""}`} style={whoami === "A" ? { background: "var(--berry)" } : {}} onClick={() => onChangeRole("A")}>{settings.nameA}</button>
          <button className={`tag-chip ${whoami === "B" ? "active" : ""}`} style={whoami === "B" ? { background: "var(--berry)" } : {}} onClick={() => onChangeRole("B")}>{settings.nameB}</button>
        </div>

        <hr className="dashed-divider" />

        <div style={{ fontSize: 11.5, color: "var(--ink-soft)", marginBottom: 12, fontStyle: "italic" }}>
          Les idées, la watchlist et les stats sont stockées sur Supabase et visibles par quiconque a le lien de l'app.
        </div>

        {!confirmReset ? (
          <button className="btn btn-ghost btn-block" onClick={() => setConfirmReset(true)}>Réinitialiser toutes les données</button>
        ) : (
          <div>
            <div style={{ fontSize: 12.5, marginBottom: 8 }}>Tout sera supprimé, y compris pour l'autre appareil. Confirmer ?</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-ghost btn-block btn-sm" onClick={() => setConfirmReset(false)}>Annuler</button>
              <button className="btn btn-danger btn-block btn-sm" onClick={onReset}>Oui, tout supprimer</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   Main App
--------------------------------------------------------- */

export default function App() {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);
  const [whoami, setWhoami] = useState(null);
  const [wheelItems, setWheelItems] = useState(DEFAULT_WHEEL_ITEMS);
  const [watchlist, setWatchlist] = useState([]);
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [qLog, setQLog] = useState({});
  const [tab, setTab] = useState("nous");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [welcomeBurst, setWelcomeBurst] = useState(0);

  useEffect(() => {
    (async () => {
      const [s, wi, wl, st, ql] = await Promise.all([
        getShared("settings", null),
        getShared("wheel-items", null),
        getShared("watchlist", null),
        getShared("custom-stats", null),
        getShared("questions-log", null),
      ]);
      setSettings(s);
      setWhoami(getLocal("whoami", null));
      setWheelItems(wi || DEFAULT_WHEEL_ITEMS);
      setWatchlist(wl || []);
      setStats(st || DEFAULT_STATS);
      setQLog(ql || {});
      setLoading(false);
    })();
  }, []);

  // Live sync: reflect changes made from the partner's device
  useEffect(() => {
    const unsubscribe = subscribeShared((payload) => {
      const row = payload.new;
      if (!row) return;
      switch (row.key) {
        case "settings":
          setSettings(row.value);
          break;
        case "wheel-items":
          setWheelItems(row.value);
          break;
        case "watchlist":
          setWatchlist(row.value);
          break;
        case "custom-stats":
          setStats(row.value);
          break;
        case "questions-log":
          setQLog(row.value);
          break;
        default:
          break;
      }
    });
    return unsubscribe;
  }, []);

  const persistWheel = (items) => { setWheelItems(items); setShared("wheel-items", items); };
  const persistWatchlist = (items) => { setWatchlist(items); setShared("watchlist", items); };
  const persistStats = (items) => { setStats(items); setShared("custom-stats", items); };
  const persistQLog = (log) => { setQLog(log); setShared("questions-log", log); };
  const persistSettings = (s) => { setSettings(s); setShared("settings", s); setSettingsOpen(false); };
  const persistWhoami = (role) => { setWhoami(role); setLocal("whoami", role); };

  function handleOnboardingSave(s) {
    persistSettings(s);
    setWelcomeBurst((n) => n + 1);
  }

  function handleRolePick(role, opts) {
    persistWhoami(role);
    if (opts && opts.celebrate) setWelcomeBurst((n) => n + 1);
  }

  async function resetAll() {
    await Promise.all([
      deleteShared("settings"),
      deleteShared("wheel-items"),
      deleteShared("watchlist"),
      deleteShared("custom-stats"),
      deleteShared("questions-log"),
    ]);
    localStorage.removeItem("whoami");
    setSettings(null);
    setWhoami(null);
    setWheelItems(DEFAULT_WHEEL_ITEMS);
    setWatchlist([]);
    setStats(DEFAULT_STATS);
    setQLog({});
    setSettingsOpen(false);
  }

  if (loading) return <LoadingScreen />;

  const NAV = [
    { key: "nous", label: "Nous", icon: Heart },
    { key: "roue", label: "Roue", icon: RefreshCw },
    { key: "question", label: "Question", icon: HelpCircle },
    { key: "films", label: "Films", icon: Film },
  ];

  return (
    <div className="cc-root">
      <style>{CSS}</style>
      <Confetti key={welcomeBurst} burstId={welcomeBurst} />

      {!settings && <OnboardingModal onSave={handleOnboardingSave} />}
      {settings && !whoami && <RolePickerModal settings={settings} onPick={handleRolePick} />}

      {settings && whoami && (
        <div className="cc-shell">
          <div className="cc-header">
            <div>
              <div className="cc-wordmark">{settings.nameA} & {settings.nameB}</div>
              <div className="cc-role">Tu es {whoami === "A" ? settings.nameA : settings.nameB}</div>
            </div>
            <button className="cc-gear" onClick={() => setSettingsOpen(true)} aria-label="Réglages">
              <SettingsIcon size={18} />
            </button>
          </div>

          <div className="tab-panel" key={tab}>
            {tab === "nous" && <NousTab settings={settings} stats={stats} onChangeStats={persistStats} />}
            {tab === "roue" && <WheelTab items={wheelItems} onChangeItems={persistWheel} />}
            {tab === "question" && <QuestionsTab qLog={qLog} onUpdateLog={persistQLog} whoami={whoami} settings={settings} />}
            {tab === "films" && <WatchlistTab items={watchlist} onChange={persistWatchlist} />}
          </div>

          <div className="bottom-nav">
            {NAV.map((n) => {
              const Icon = n.icon;
              return (
                <button key={n.key} className={`nav-btn ${tab === n.key ? "active" : ""}`} onClick={() => setTab(n.key)}>
                  <Icon size={18} />
                  {n.label}
                </button>
              );
            })}
          </div>

          {settingsOpen && (
            <SettingsModal settings={settings} whoami={whoami} onClose={() => setSettingsOpen(false)} onSaveSettings={persistSettings} onChangeRole={persistWhoami} onReset={resetAll} />
          )}
        </div>
      )}
    </div>
  );
}
