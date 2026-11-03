/**
 * onit — render/palette.js
 * Gündüz / gün batımı / gece paletleri ve canlı karışım (pal).
 */
import { hex } from '../core/utils.js';

const P_DAY ={bg:'#F3EEE4',dot:'#CDBFAA',lane:'#E6DDCC',lobby:'#DCCEB8',room:'#FFFFFF',lip:'#E4D9C6',rs:'#D7CBB7',ink:'#26282E',muted:'#8F887C',chip:'#FFFFFF',tree:'#93C48C',tree2:'#6FA56E',pool:'#9ED7E7',shadow:'#A8977E'};
const P_DUSK={bg:'#F4DCC6',dot:'#D6B898',lane:'#ECD2B8',lobby:'#E2C4A6',room:'#FFF6EC',lip:'#EBD0B5',rs:'#DCBE9E',ink:'#2B2530',muted:'#9A7F67',chip:'#FFF7EF',tree:'#A2B97F',tree2:'#829F68',pool:'#A6C5DC',shadow:'#B08A6C'};
const P_NIGHT={bg:'#1B1E27',dot:'#313644',lane:'#2A2F3B',lobby:'#343A49',room:'#2F3442',lip:'#242833',rs:'#434A5D',ink:'#ECE8E1',muted:'#9095A3',chip:'#2A2E39',tree:'#2E4838',tree2:'#24382D',pool:'#294560',shadow:'#08090D'};
export const PD={},PK={},PN={};
for(const k in P_DAY){PD[k]=hex(P_DAY[k]);PK[k]=hex(P_DUSK[k]);PN[k]=hex(P_NIGHT[k]);}
export const WARM=hex('#F7C46B'), RED=hex('#E04B3A'), ORANGE=hex('#EC9236'), GOLD=hex('#D4A63A'), WHITE=[255,255,255];
export const pal={t:0,dusk:0,night:0,light:0};
export const GUEST_COLS=['#E9A178','#7FB3D5','#C39BD3','#E8C15A','#82C9A5','#F0928F'].map(hex);

/* ışık sprite'ı (gece pencere parıltısı) */
export const glowSprite=(()=>{const c=document.createElement('canvas');c.width=c.height=96;const x=c.getContext('2d');const gr=x.createRadialGradient(48,48,0,48,48,48);gr.addColorStop(0,'rgba(255,196,110,.85)');gr.addColorStop(.35,'rgba(255,170,90,.35)');gr.addColorStop(1,'rgba(255,150,80,0)');x.fillStyle=gr;x.fillRect(0,0,96,96);return c;})();
