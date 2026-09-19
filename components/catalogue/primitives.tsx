import Link from 'next/link';
import type { ReactNode } from 'react';
import { money } from '@/lib/catalogue/contracts';
export function Container({children,className=''}:{children:ReactNode;className?:string}){return <div className={`container ${className}`}>{children}</div>;}
export function Section({children,className=''}:{children:ReactNode;className?:string}){return <section className={`section ${className}`}>{children}</section>;}
export function PriceDisplay({daily,weekly}:{daily:number;weekly?:number|null}){return <div><span className="price">{money(daily)}</span><span className="text-muted"> / day</span>{weekly!=null&&<p className="mt-1 text-sm text-muted">{money(weekly)} per full week</p>}</div>;}
export function AvailabilityBadge({available}:{available?:boolean}){return <span className={`availability ${available===false?'is-unavailable':''}`}><span aria-hidden="true">{available===false?'−':'•'}</span>{available===undefined?'Choose dates for availability':available?'Available for your dates':'Unavailable for these dates'}</span>;}
export function RatingDisplay(){return <span className="text-sm text-muted">New to our fleet</span>;}
export function EmptyState({title='No equipment matches those dates and filters.',description='Try different dates, broaden your postcode search or explore another category.'}:{title?:string;description?:string}){return <div className="empty-state"><span className="eyebrow">Let’s try another search</span><h2>{title}</h2><p>{description}</p><Link className="button button-secondary" href="/equipment">Reset filters</Link></div>;}
export function Skeleton(){return <div className="equipment-grid" aria-label="Loading equipment" aria-busy="true">{[1,2,3,4,5,6].map(i=><div key={i} className="skeleton-card"><div/><p/><p/></div>)}</div>;}
export function Arrow(){return <span aria-hidden="true">↗</span>;}
export function CategoryIcon({slug}:{slug:string}){
 const paths:Record<string,string>={'plant-machinery':'M3 17h13v4H3z M6 17V9h7v8 M13 10l4-6 5 2-3 10h-3 M6 12h4','power-tools':'M3 7h14v8H3z M8 15v7h5v-7 M17 9h5v4h-5','cleaning':'M7 8h10v12H7z M9 8V3h5l5 4 M5 21h14 M10 12h4','landscaping':'M12 21V8 M12 13C3 13 3 4 3 4s9 0 9 9 M12 16c9 0 9-9 9-9s-9 0-9 9','access-equipment':'M4 3v19 M20 3v19 M4 5h16 M4 12h16 M4 19h16 M4 5l16 14 M20 5L4 19','site-equipment':'M4 9h16v12H4z M7 9V5h10v4 M9 14h6 M12 12v6'};
 return <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[slug]||paths['site-equipment']}/></svg>;
}
