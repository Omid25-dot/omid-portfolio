import Link from 'next/link';
import { getCategories,searchCatalogue } from '@/lib/catalogue/server';
import { scalarParams,searchSchema,filterUrl,type SearchParams } from '@/lib/catalogue/contracts';
import { Container,EmptyState } from './primitives';
import { EquipmentCard } from './cards';
import { SearchBar } from './search-bar';
export async function CatalogueResults({params,category,title='Equipment for every kind of job.',description='From the first hole to the final clean. Find the right equipment, check your dates and plan your hire.'}:{params:SearchParams;category?:string;title?:string;description?:string}){
 const parsed=searchSchema.safeParse({...scalarParams(params),...(category?{category}:{})});
 const filters=parsed.success?parsed.data:searchSchema.parse(category?{category}:{});const categories=await getCategories();
 const result=parsed.success?await searchCatalogue(filters):null;
 return <Container className="catalogue-page"><div className="breadcrumb"><Link href="/">Home</Link><span>/</span><span>{category?'Categories':'Equipment'}</span></div><header className="page-heading"><span className="eyebrow">The equipment you need. One team you trust.</span><h1>{title}</h1><p>{description}</p></header><SearchBar expanded filters={filters} categories={categories}/>{!parsed.success&&<p role="alert" className="form-message">{parsed.error.issues[0].message} <Link href="/equipment">Reset search</Link></p>}<div className="results-heading"><p>{result?.total??0} pieces of equipment{filters.start?' · Your dates selected':''}</p><Link href="/equipment" className="text-link">Reset filters</Link></div>{filters.postcode&&<p className="date-hint">Showing the service area for {filters.postcode}. Delivery eligibility and price still need confirmation.</p>}{result&&result.items.length>0?<><div className="equipment-grid">{result.items.map(item=><EquipmentCard key={item.id} item={item} filters={filters}/>)}</div><nav className="pagination" aria-label="Results pages">{filters.page>1&&<Link className="button button-secondary" href={filterUrl({...filters,page:filters.page-1})}>← Previous</Link>}<span>Page {filters.page} of {Math.ceil(result.total/result.page_size)}</span>{filters.page*result.page_size<result.total&&<Link className="button button-secondary" href={filterUrl({...filters,page:filters.page+1})}>Next →</Link>}</nav></>:<EmptyState/>}</Container>;
}
