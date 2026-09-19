import Link from 'next/link';
import type { ReactNode } from 'react';
import { Container } from './primitives';
export function InfoPage({eyebrow,title,sections,children}:{eyebrow:string;title:string;sections:[string,string][];children?:ReactNode}){return <Container className="info-page"><header className="page-heading"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1></header><div className="info-sections">{sections.map(([heading,body],i)=><section key={heading}><span className="eyebrow">0{i+1}</span><h2>{heading}</h2><p>{body}</p></section>)}</div>{children}<Link className="button mt-8" href="/equipment">Explore the equipment ↗</Link></Container>;}
