import { extractKeywords, scoreKeyword, siteChecks, tipsFrom, verdict, peekVisibility, pick, all, attr, strip, tokens, norm, UA } from '../lib/seo.mjs';

const cors=()=>({ "access-control-allow-origin":"*","access-control-allow-headers":"content-type","access-control-allow-methods":"POST,OPTIONS" });
const json=(statusCode,data)=>({ statusCode, headers:{ "content-type":"application/json; charset=utf-8", ...cors() }, body:JSON.stringify(data) });

export async function handler(event){
  if(event.httpMethod==="OPTIONS") return { statusCode:204, headers:cors() };
  if(event.httpMethod!=="POST") return json(405,{ error:"POST only" });
  let body; try{ body=JSON.parse(event.body||"{}"); }catch{ return json(400,{ error:"JSON invalide" }); }
  let raw=String(body.url||"").trim(); if(!raw) return json(400,{ error:"URL manquante" });
  if(!/^https?:\/\//i.test(raw)) raw="https://"+raw;
  let target; try{ target=new URL(raw); if(!["http:","https:"].includes(target.protocol)) throw new Error("bad"); }catch{ return json(400,{ error:"URL invalide" }); }
  const userKws=Array.isArray(body.keywords)?body.keywords:String(body.keywords||"").split(/[,;\n]+/).map(s=>s.trim()).filter(Boolean);
  const ctrl=new AbortController(); const timer=setTimeout(()=>ctrl.abort(),12000);
  let html="", status=0;
  try{
    const res=await fetch(target.href,{ headers:{ "user-agent":UA, accept:"text/html,application/xhtml+xml", "accept-language":"fr-FR,fr;q=0.9,en;q=0.8" }, redirect:"follow", signal:ctrl.signal });
    status=res.status; const ctype=res.headers.get("content-type")||""; html=await res.text();
    if(!/html|xml|text\//i.test(ctype) && !/<html/i.test(html)) return json(422,{ error:"Cette URL ne renvoie pas une page HTML." });
  }catch(e){ return json(502,{ error: e.name==="AbortError"?"Le site met trop de temps a repondre.":"Impossible de joindre cette URL." }); }
  finally{ clearTimeout(timer); }
  html=html.slice(0,900000);
  const title=pick(html,/<title[^>]*>([\s\S]*?)<\/title>/i);
  const meta=pick(html,/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)||pick(html,/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i);
  const h1=pick(html,/<h1\b[^>]*>([\s\S]*?)<\/h1>/i).replace(/<[^>]+>/g," ").replace(/\s+/g," ");
  const headings=all(html,/<h[2-3]\b[^>]*>([\s\S]*?)<\/h[2-3]>/i).map(h=>h.replace(/<[^>]+>/g," ").replace(/\s+/g," "));
  const canonical=pick(html,/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i)||pick(html,/<link[^>]+href=["']([^"']*)["'][^>]+rel=["']canonical["']/i);
  const robots=pick(html,/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)["']/i)||pick(html,/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']robots["']/i);
  const viewport=pick(html,/<meta[^>]+name=["']viewport["'][^>]+content=["']([^"']*)["']/i)||pick(html,/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']viewport["']/i);
  const lang=pick(html,/<html[^>]*lang=["']([^"']+)["']/i);
  const imageTags=html.match(/<img\b[^>]*>/gi)||[]; const alts=imageTags.map(t=>attr(t,"alt"));
  const bodyText=strip(html); const first=bodyText.slice(0,420); const words=tokens(bodyText).length;
  const discovered=extractKeywords(title,h1,headings,bodyText);
  const source=userKws.length?"user":"auto";
  const list=(userKws.length?userKws:discovered).slice(0,6).map(norm).filter(Boolean);
  const ctx={ title,h1,meta,url:target.href,first,body:bodyText,alts:alts.join(" ") };
  const keywords=list.map(kw=>scoreKeyword(kw,ctx));
  const vis=await Promise.all(keywords.slice(0,4).map(async k=>({ keyword:k.keyword, ...(await peekVisibility(target.hostname,k.keyword)) })));
  const visMap=Object.fromEntries(vis.map(v=>[v.keyword,v]));
  for(const k of keywords) if(visMap[k.keyword]) k.visibility=visMap[k.keyword];
  const checks=siteChecks(target.href,html,title,meta,h1,imageTags,alts,canonical,robots,viewport,lang,words);
  const kwAvg=keywords.length?Math.round(keywords.reduce((s,k)=>s+k.score,0)/keywords.length):checks.score;
  const overall=Math.round(checks.score*0.62+kwAvg*0.38);
  return json(200,{ url:target.href, host:target.hostname.replace(/^www\./,""), fetchedAt:new Date().toISOString(), httpStatus:status, title, meta, h1, source, overall, technical:checks.score, keywordScore:kwAvg, verdict:verdict(overall), keywords, checks:checks.checks, recos:tipsFrom(checks,keywords,title), stats:{ words:checks.words, images:checks.imgN, alts:checks.altN, titleLen:checks.titleLen, metaLen:checks.metaLen } });
}
