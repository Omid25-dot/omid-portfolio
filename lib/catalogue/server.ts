import 'server-only';
import { cache } from 'react';
import { createClient } from '@supabase/supabase-js';
import { getPublicSupabaseConfig } from '@/lib/config/public';
import { catalogueSchema,equipmentSchema,categorySchema, type SearchFilters } from './contracts';
/** Anonymous key only: never fetch raw equipment or use service-role credentials here. */
export function publicCatalogueClient(){const config=getPublicSupabaseConfig();if(!config)throw new Error('Catalogue not configured');return createClient(config.url,config.key,{auth:{persistSession:false,autoRefreshToken:false}});}
export const getCategories=cache(async()=>{
 const {data,error}=await publicCatalogueClient().from('categories').select('slug,name,description').eq('active',true).order('display_order').limit(100);
 if(error)throw new Error('Categories unavailable');return categorySchema.array().parse(data);
});
export async function searchCatalogue(p:SearchFilters){
 const {data,error}=await publicCatalogueClient().rpc('catalogue_search',{p_query:p.q,p_category:p.category,p_postcode:p.postcode,p_start:p.start||null,p_end:p.end||null,p_min:Math.round(p.min*100),p_max:Math.round(p.max*100),p_delivery:p.delivery==='1',p_collection:p.collection==='1',p_available:p.available==='1',p_page:p.page});
 if(error)throw new Error('Catalogue search unavailable');return catalogueSchema.parse(data);
}
export const getEquipment=cache(async(slug:string)=>{
 if(!/^[a-z0-9-]{1,200}$/.test(slug))return null;
 const {data,error}=await publicCatalogueClient().rpc('catalogue_detail',{p_slug:slug});if(error)throw new Error('Equipment unavailable');return data?equipmentSchema.parse(data):null;
});
