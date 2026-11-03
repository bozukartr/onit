/**
 * onit — game/tutorial.js
 * İlk gün eğitimi (adım adım ipuçları).
 */
import { LANE, TEAMS } from '../core/config.js';
import { KEYS, store } from '../core/storage.js';
import { spawnReq } from './requests.js';
import { g } from './state.js';
import { rq, tok } from '../render/shapes.js';
import { hint } from '../ui/hud.js';
import { at, center, interior } from '../world/map.js';
import { buildLeg } from '../world/route.js';

export function tutStep(dt){
  const T=g.tut;if(!T||g.mode!=='play')return;
  T.t+=dt;
  if(T.step===0&&T.t>1.6){
    const r=at(2,9);spawnReq('H',r);
    const b=at(4,11);g.guide=buildLeg(center(b),b.door,r.door,interior(r),TEAMS.H.lane*LANE);g.guideOn=true;g.guideFade=0;
    hint(`Oda 202'de ${rq('H')} talebi var. ${tok('H',18)} <b>Temizlik</b> personelini odaya <b>sürükle</b> — ya da personele dokun, sonra odaya dokun.`,60000);
    T.step=1;
  }else if(T.step===1&&!T.dispatched&&T.t>26&&g.spawnT>100){g.spawnT=2;
  }else if(T.step===1&&T.dispatched){
    T.step=2;T.t2=0;
  }else if(T.step===2){
    T.t2+=dt;
    if(T.t2>.25&&!T.s2){T.s2=true;spawnReq('H',at(1,9));
      hint(`Yolda giderken de durak eklenir: <b>yürüyen</b> ${tok('H',18)} personeli 201'e sürükle ya da ona dokunup 201'e dokun.`,14000);}
    if(T.s2&&(T.appended||T.t2>14||(T.t2>1&&at(1,9).requests.some(q=>q.assigned)))){
      if(T.appended)hint('Süper! Durak rotanın sonuna eklendi. Personelin üstündeki sayı, sırasındaki oda sayısıdır.',4500);
      T.step=3;T.t3=0;
    }
  }else if(T.step===3){
    T.t3+=dt;
    if(T.t3>4.5&&!T.s3){T.s3=true;spawnReq('K',at(1,11));spawnReq('H',at(3,11));spawnReq('H',at(2,11));
      hint(`${rq('K')} için ${tok('K',18)} <b>Oda Servisi</b>. İki ${rq('H')} için bırakmadan iki odanın üstünden geç: tek rota! Hızlı işler <b>seri</b> yapar.`,8000);
      g.spawnT=7;}
    if(T.s3&&g.served>=6){
      hint('İpucu: ⏸ ile durdurup sakin sakin plan yap. Rotayı iptal etmek için personeli kendi üssüne bırak.',7000);
      T.step=4;store.set(KEYS.tutorial,2);
    }
  }
}
