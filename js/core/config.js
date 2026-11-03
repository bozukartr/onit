/**
 * onit — core/config.js
 * Oyun sabitleri: ızgara, süreler, ekipler, kanatlar, olaylar, yoğun saatler.
 */
import { hex, mixc } from './utils.js';

export const GW=11, GH=15;
export const DAY_LEN=112;            // 07:00 → 23:00 gerçek saniye (1x)
export const SPEED=3.1;              // tile / sn
export const LANE=.085;              // ekip şeritleri arası
export const FAIL_AT=2.5;
export const DWELL=.34;
export const FONT='"Avenir Next",Avenir,"Segoe UI",system-ui,-apple-system,Roboto,Helvetica,Arial,sans-serif';
export const DAY_NAMES=['Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi','Pazar'];
export const DAY_ABBR=['PZT','SAL','ÇAR','PER','CUM','CMT','PAZ'];
export const dayName=d=>DAY_NAMES[(d-1)%7].toLocaleUpperCase('tr-TR');

export const TEAMS={
  H:{name:'Temizlik',long:'Kat Hizmetleri',what:'havlu, temizlik',color:'#2F7DD1',shape:'circle',service:2.6,lane:-2,note:523.25},
  K:{name:'Servis',long:'Oda Servisi',what:'yemek, içecek',color:'#E4513F',shape:'square',service:2.2,lane:-1,note:659.25},
  T:{name:'Teknik',long:'Teknik Servis',what:'arıza, klima, ampul',color:'#E89B13',shape:'triangle',service:3.3,lane:0,note:783.99},
  B:{name:'Bagaj',long:'Bellboy',what:'bagaj, taşıma',color:'#2E9E5E',shape:'diamond',service:2.0,lane:1,note:880},
  G:{name:'Güvenlik',long:'Güvenlik',what:'gürültü şikayeti',color:'#8656B8',shape:'pentagon',service:2.5,lane:2,note:587.33},
  J:{name:'Joker',long:'Çok Yönlü Eleman',what:'her tür talep',color:'#DB5A96',shape:'star',service:2.6,lane:.5,note:1046.5}
};
for(const k in TEAMS){TEAMS[k].rgb=hex(TEAMS[k].color);TEAMS[k].dark=mixc(TEAMS[k].rgb,[25,22,30],.32);}
export const ORDER=['H','K','T','B','G','J'];
export const REQ=['H','K','T','B','G'];
export const UNLOCK={H:1,K:1,T:2,B:3,G:5};
export const START_STAFF={H:2,K:1,T:1,B:1,G:1};
export const WINGS={1:['Batı Kanadı','6 oda'],2:['Doğu Kanadı','+6 oda · havuz'],3:['Orta Koridor','+6 oda'],4:['Orta Koridor Odaları','+6 oda · ilk VIP oda'],5:['Teras Koridoru','+6 oda'],6:['Çatı Süitleri','+7 oda · kral dairesi']};
export const EVENTS=[
  {name:'Konferans Grubu',desc:'bagaj talepleri artıyor',mult:{B:1.9},need:'B'},
  {name:'Düğün Yemeği',desc:'oda servisi çok yoğun',mult:{K:1.8},need:'K'},
  {name:'Fırtına',desc:'arızalar çoğalıyor',mult:{T:1.9},need:'T'},
  {name:'Futbol Takımı',desc:'gece gürültüsü ve dağınıklık',mult:{G:1.8,H:1.3},need:'G'},
  {name:'Şehirde Festival',desc:'tam doluluk, sabır az',rate:1.15,pat:.9,need:'H'},
  {name:'Sakin Bir Gün',desc:'biraz nefes al',rate:.82,need:'H'}
];
export const RUSH=[
  {h:8.1,k:'B',t:'Check-out saati',d:'bagaj talepleri artıyor'},
  {h:12.4,k:'K',t:'Öğle servisi',d:'oda servisi yoğunlaşıyor'},
  {h:15.3,k:'B',t:'Check-in saati',d:'yeni misafirler geliyor'},
  {h:19.3,k:'K',t:'Akşam yemeği',d:'oda servisi yoğunlaşıyor'},
  {h:21.3,k:'G',t:'Gece',d:'gürültü şikayetleri artar'}
];
