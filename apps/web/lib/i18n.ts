export const LOCALES=['en','fa-AF','ps','ar'] as const;
export type Locale=typeof LOCALES[number];
export const isLocale=(x:string):x is Locale=>(LOCALES as readonly string[]).includes(x);
export const isRtl=(locale:Locale)=>locale!=='en';
const dictionary={
 en:{title:'Plan and approve content in one place',subtitle:'Independent social management for Facebook, Instagram and X.',early:'Controlled pilot',login:'Sign in to your workspace',dashboard:'Workspace dashboard',privacy:'Privacy-first approvals',pilot:'Only Meta and X are active in the pilot.',actions:'Review drafts with your team'},
 'fa-AF':{title:'برنامه‌ریزی و تایید محتوا در یک مکان',subtitle:'مدیریت مستقل رسانه‌های اجتماعی برای فیسبوک، انستاگرام و ایکس.',early:'مرحله آزمایشی',login:'ورود به محیط کاری',dashboard:'داشبورد محیط کاری',privacy:'تایید محتوا با رعایت حریم خصوصی',pilot:'در این مرحله فقط متا و ایکس فعال هستند.',actions:'پیش‌نویس‌ها را با تیم خود بررسی کنید'},
 ps:{title:'د محتوا پلان جوړول او تایید په یوه ځای کې',subtitle:'د فېسبوک، انسټاګرام او اېکس لپاره خپلواک ټولنیز مدیریت.',early:'ازمایښتي پړاو',login:'خپل کاري ځای ته ننوتل',dashboard:'د کاري ځای ډشبورډ',privacy:'د محرمیت په پام کې نیولو سره تایید',pilot:'اوس یوازې مېټا او اېکس د ازمایښت برخه دي.',actions:'مسودې له خپل ټیم سره وڅېړئ'},
 ar:{title:'تخطيط المحتوى والموافقة عليه في مكان واحد',subtitle:'إدارة مستقلة لفيسبوك وإنستغرام وإكس.',early:'مرحلة تجريبية',login:'تسجيل الدخول إلى مساحة العمل',dashboard:'لوحة مساحة العمل',privacy:'موافقات تحترم الخصوصية',pilot:'ميتا وإكس فقط ضمن المرحلة التجريبية.',actions:'راجع المسودات مع فريقك'},
} as const;
export function dictionaryFor(locale:Locale){return dictionary[locale];}
