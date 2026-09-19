import { getCategories } from '@/lib/catalogue/server';
import { CategoryCard } from '@/components/catalogue/cards';
import { Container } from '@/components/catalogue/primitives';
import { pageMetadata } from '@/lib/catalogue/metadata';
export const metadata=pageMetadata('Equipment categories','Find plant, power tools, cleaning, landscaping, access and site equipment.','/categories');
export default async function Categories(){const categories=await getCategories();return <Container className="catalogue-page"><header className="page-heading"><span className="eyebrow">Find the right fit</span><h1>Every job starts here.</h1><p>Explore equipment by the work you need to do.</p></header><div className="category-grid category-grid-large">{categories.map((c,i)=><CategoryCard key={c.slug} category={c} index={i}/>)}</div></Container>;}
