import { CatalogueResults } from '@/components/catalogue/results';
import type { SearchParams } from '@/lib/catalogue/contracts';
import { pageMetadata } from '@/lib/catalogue/metadata';
export const metadata=pageMetadata('Equipment hire','Browse plant, tools, cleaning and access equipment. Filter by dates, category and hire price.','/equipment');
export default async function EquipmentPage({searchParams}:{searchParams:Promise<SearchParams>}){return <CatalogueResults params={await searchParams}/>;}
