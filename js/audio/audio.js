/**
 * onit — audio/audio.js
 * WebAudio ile sentezlenen ses efektleri (dosya yok).
 */
import { TEAMS } from '../core/config.js';
import { g } from '../game/state.js';
import { KEYS, store } from '../core/storage.js';

export const AU={c:null,m:null,on:store.get(KEYS.sound,true),
  init(){if(this.c){if(this.c.state==='suspended')this.c.resume();return;}try{const C=window.AudioContext||window.webkitAudioContext;this.c=new C();this.m=this.c.createGain();this.m.gain.value=.55;this.m.connect(this.c.destination);}catch(e){this.c=null;}},
  t(f,d=.18,type='sine',v=.07,dl=0,sl=0){
    const c=this.c;if(!c||!this.on||(g&&g.mode==='menu'))return;
    const t=c.currentTime+dl,o=c.createOscillator(),gn=c.createGain();
    o.type=type;o.frequency.setValueAtTime(f,t);if(sl)o.frequency.exponentialRampToValueAtTime(f*sl,t+d);
    gn.gain.setValueAtTime(0,t);gn.gain.linearRampToValueAtTime(v,t+.012);gn.gain.exponentialRampToValueAtTime(.0001,t+d);
    o.connect(gn);gn.connect(this.m);o.start(t);o.stop(t+d+.05);
  },
  done(k){const n=TEAMS[k].note;this.t(n,.3,'sine',.07);this.t(n*1.5,.34,'sine',.045,.07);},
  serve(k){this.t(TEAMS[k].note*.5,.1,'triangle',.035);},
  go(k){const n=TEAMS[k].note;this.t(n,.09,'triangle',.045);this.t(n*1.26,.1,'triangle',.032,.055);},
  pick(k){this.t(TEAMS[k].note*.75,.06,'sine',.04);},
  tick(n,back){this.t(back?470:560+n*120,.05,'sine',.04);},
  fail(){this.t(330,.42,'triangle',.08,0,.55);this.t(247,.5,'sine',.05,.06,.6);},
  no(){this.t(190,.12,'square',.022);},
  spawn(){this.t(1568,.05,'sine',.011);},
  vip(){this.t(1318.5,.12,'sine',.03);this.t(1975.5,.18,'sine',.025,.08);},
  coin(){this.t(2093,.05,'sine',.018);},
  combo(n){const b=659.25*Math.pow(2,Math.min(n,9)/12*2);this.t(b,.16,'triangle',.04,.12);this.t(b*1.5,.2,'sine',.03,.18);},
  rush(){this.t(784,.12,'sine',.03);this.t(988,.16,'sine',.025,.1);},
  click(){this.t(880,.04,'sine',.03);},
  pickUp(){[659.25,880,1174.66].forEach((f,i)=>this.t(f,.22,'sine',.05,i*.06));},
  perfect(){[783.99,987.77,1174.66,1567.98].forEach((f,i)=>this.t(f,.3,'sine',.045,i*.08));},
  day(){[523.25,659.25,783.99,1046.5].forEach((f,i)=>this.t(f,.95,'sine',.04,i*.09));},
  over(){[392,330,262].forEach((f,i)=>this.t(f,.75,'triangle',.05,i*.2));}
};
