import { notFound } from 'next/navigation';
import { getCategories } from '@/lib/catalogue/server';
import { CatalogueResults } from '@/components/catalogue/results';
import { pageMetadata } from '@/lib/catalogue/metadata';
import type { SearchParams } from '@/lib/catalogue/contracts';
type Props={params:Promise<{slug:string}>;searchParams:Promise<SearchParams>};
export async function generateMetadata({params}:Props){const {slug}=await params;const category=(await getCategories()).find(c=>c.slug===slug);return category?pageMetadata(`${category.name} hire`,category.description,`/category/${slug}`):{title:'Category not found'};}
export default async function CategoryPage({params,searchParams}:Props){const {slug}=await params;const c=(await getCategories()).find(c=>c.slug===slug);if(!c)notFound();return <CatalogueResults params={await searchParams} category={slug} title={c.name} description={c.description==='Demo category'?'Explore the equipment for your next project. All hire managed by one professional team.':c.description}/>;}
