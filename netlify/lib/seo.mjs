const STOP = new Set("a au aux avec ce ces dans de des du elle en et eux il je la le les leur lui ma mais me mes moi mon ne nos notre nous on ou par pas pour qu que qui sa se ses son sur ta te tes toi ton tu un une vos votre vous the of to and for in on with by from as at is are was were be this that it its your you we our plus tres tout tous aussi comme entre apres avant sous chez dont donc car".split(" "));
export const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

const decode = (s) => s.replace(/&nbsp;/g," ").replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&#(\d+);/g,(_,n)=>String.fromCharCode(+n)).replace(/&#x([0-9a-f]+);/gi,(_,n)=>String.fromCharCode(parseInt(n,16)));
export const pick = (html, re, i=1) => { const m = html.match(re); return m ? decode(m[i]).trim() : ""; };
export const strip = (html) => decode(html.replace(/<script[\s\S]*?<\/script>/gi," ").replace(/<style[\s\S]*?<\/style>/gi," ").replace(/<noscript[\s\S]*?<\/noscript>/gi," ").replace(/<!--[\s\S]*?-->/g," ").replace(/<[^>]+>/g," ").replace(/\s+/g," ")).trim();
export const all = (html, re) => { const out=[]; const r=new RegExp(re.source, re.flags.includes("g")?re.flags:re.flags+"g"); let m; while((m=r.exec(html))) out.push(decode(m[1]).trim()); return out.filter(Boolean); };
export const attr = (tag, name) => { const m=tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`,"i")); return m?decode(m[1]):""; };
export const norm = (k) => k.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^\p{L}\p{N}\s-]/gu," ").replace(/\s+/g," ").trim();
export const tokens = (text) => norm(text).split(" ").filter((w)=>w.length>2 && !STOP.has(w));
function countPhrase(hay, phrase){ if(!phrase) return 0; const h=` ${norm(hay)} `; const p=` ${norm(phrase)} `; let n=0,i=0; while((i=h.indexOf(p,i))!==-1){ n++; i+=p.length-1;} return n; }

export function extractKeywords(title,h1,headings,body){
  const freq=new Map();
  for(const w of [...tokens(title),...tokens(h1),...headings.flatMap(tokens)]) freq.set(w,(freq.get(w)||0)+2);
  for(const w of tokens(body).slice(0,400)) freq.set(w,(freq.get(w)||0)+1);
  const singles=[...freq.entries()].sort((a,b)=>b[1]-a[1]).map(([w])=>w).slice(0,8);
  const bigrams=new Map(); const seq=[...tokens(title+" "+h1),...tokens(headings.join(" "))];
  for(let i=0;i<seq.length-1;i++){ const g=`${seq[i]} ${seq[i+1]}`; bigrams.set(g,(bigrams.get(g)||0)+1); }
  const pairs=[...bigrams.entries()].sort((a,b)=>b[1]-a[1]).map(([w])=>w).slice(0,4);
  const seen=new Set(); return [...pairs,...singles].filter((k)=>{ if(seen.has(k)) return false; seen.add(k); return true; }).slice(0,6);
}

export function scoreKeyword(kw,ctx){
  const hits={ title:countPhrase(ctx.title,kw)>0, h1:countPhrase(ctx.h1,kw)>0, meta:countPhrase(ctx.meta,kw)>0, url:countPhrase(ctx.url,kw)>0, first:countPhrase(ctx.first,kw)>0, alts:countPhrase(ctx.alts,kw)>0 };
  const occ=countPhrase(ctx.body,kw); const words=Math.max(tokens(ctx.body).length,1); const density=(occ*kw.split(" ").length)/words;
  let score=8;
  if(hits.title) score+=28; if(hits.h1) score+=22; if(hits.meta) score+=14; if(hits.url) score+=10; if(hits.first) score+=10; if(hits.alts) score+=6;
  if(occ>=2 && occ<=12) score+=8; else if(occ===1) score+=4;
  if(density>0.035) score-=12; if(ctx.body.length<250) score-=8;
  score=Math.max(4,Math.min(100,Math.round(score)));
  let label="Faible"; if(score>=75) label="Solide"; else if(score>=50) label="Moyen";
  let tip="Place le mot-cle dans le titre de page et le H1, puis dans la premiere phrase.";
  if(hits.title && hits.h1 && !hits.meta) tip="Ajoute le mot-cle naturellement dans la meta description (150 caracteres).";
  else if(hits.title && hits.h1) tip="Renforce le corps : 1 sous-titre H2 + 2 phrases utiles autour de l'intention.";
  else if(!hits.title) tip=`Reecris le titre : commence par « ${kw} » puis la promesse.`;
  return { keyword:kw, score, label, hits, occ, density:Number((density*100).toFixed(2)), tip };
}

export function siteChecks(url,html,title,meta,h1,images,alts,canonical,robots,viewport,lang,words){
  const https=url.startsWith("https:"); const titleLen=title.length; const metaLen=meta.length; const imgN=images.length; const altN=alts.filter(Boolean).length; const h1n=(html.match(/<h1\b/gi)||[]).length;
  const checks=[
    { id:"https", ok:https, label:"Connexion securisee", detail:https?"HTTPS actif":"Le site n'est pas en HTTPS" },
    { id:"title", ok:titleLen>=15 && titleLen<=65, label:"Titre de page", detail:title?`${titleLen} caracteres`:"Titre manquant" },
    { id:"meta", ok:metaLen>=70 && metaLen<=170, label:"Meta description", detail:meta?`${metaLen} caracteres`:"Description manquante" },
    { id:"h1", ok:h1n===1 && h1.length>2, label:"Titre principal", detail:h1n===0?"Aucun H1":h1n>1?`${h1n} H1 (un seul recommande)`:"H1 unique" },
    { id:"viewport", ok:Boolean(viewport), label:"Mobile", detail:viewport?"Balise viewport presente":"Pas de viewport — mauvais sur telephone" },
    { id:"alts", ok:imgN===0 || altN/imgN>=0.7, label:"Images decrites", detail:imgN?`${altN}/${imgN} images avec texte alternatif`:"Pas d'image detectee" },
    { id:"canonical", ok:Boolean(canonical), label:"URL canonique", detail:canonical||"Balise canonical absente" },
    { id:"lang", ok:Boolean(lang), label:"Langue declaree", detail:lang||"Attribut lang manquant" },
    { id:"index", ok:!/noindex/i.test(robots), label:"Indexation", detail:/noindex/i.test(robots)?"noindex detecte — Google ignore la page":"Page indexable" },
    { id:"content", ok:words>=300, label:"Volume de texte", detail:`${words} mots` },
  ];
  return { score:Math.round(checks.filter(c=>c.ok).length/checks.length*100), checks, words, titleLen, metaLen, imgN, altN };
}

export function tipsFrom(checks, keywords, title){
  const map={
    title: title?"Raccourcis ou allonge le titre pour viser 50-60 caracteres, mot-cle en tete.":"Ecris un titre unique de 50-60 caracteres qui dit ce que la page resout.",
    meta:"Redige une meta description de 140-160 caracteres avec un verbe d'action.",
    h1:"Garde un seul H1, aligne sur l'intention de recherche.",
    alts:"Decris chaque image importante en une courte phrase utile.",
    content:"Ajoute 300+ mots utiles : reponse directe, exemples, sous-titres H2.",
    https:"Active HTTPS.",
    viewport:"Ajoute la balise viewport mobile.",
    canonical:"Ajoute une balise canonical vers l'URL definitive.",
    lang:"Ajoute lang=fr sur la balise html.",
    index:"Retire noindex si tu veux que la page apparaisse dans Google.",
  };
  const tips=checks.checks.filter(c=>!c.ok).slice(0,3).map(f=>({ priority:"Critique", text:map[f.id]||f.detail }));
  for(const k of (keywords||[]).filter(k=>k.score<60).slice(0,2)) tips.push({ priority:"Important", text:`« ${k.keyword} » : ${k.tip}` });
  if(!tips.length) tips.push({ priority:"Cosmetique", text:"Base saine. Passe aux H2 thematiques et aux liens internes." });
  return tips.slice(0,4);
}

export function verdict(score){
  if(score>=80) return { tone:"good", line:"La page est deja lisible par Google. Les gains sont dans le detail." };
  if(score>=60) return { tone:"ok", line:"Socle correct, mais quelques trous empechent de performer vraiment." };
  if(score>=40) return { tone:"mid", line:"Google comprend mal la page. Quelques corrections simples changent la donne." };
  return { tone:"low", line:"La page part avec un handicap. On repare d'abord le socle, pas les fioritures." };
}

export async function peekVisibility(host, keyword){
  const ctrl=new AbortController(); const t=setTimeout(()=>ctrl.abort(),6500);
  try{
    const res=await fetch("https://html.duckduckgo.com/html/?q="+encodeURIComponent(`${keyword} site:${host}`),{ headers:{ "user-agent":UA, accept:"text/html" }, signal:ctrl.signal });
    if(!res.ok) return { status:"unknown" };
    const html=await res.text();
    const has=/class="result/i.test(html) && html.toLowerCase().includes(host.replace(/^www\./,"").toLowerCase());
    return { status: has?"visible":"absent" };
  }catch{ return { status:"unknown" }; }
  finally{ clearTimeout(t); }
}
