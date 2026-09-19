import type { Metadata } from 'next';
import { brandName } from '@/lib/config/public';
export function pageMetadata(title:string,description:string,path:string):Metadata {
 return {title,description,alternates:{canonical:path},openGraph:{title:`${title} | ${brandName}`,description,url:path,type:'website',locale:'en_GB'},robots:{index:process.env.NEXT_PUBLIC_INDEX_SITE==='true',follow:true}};
}
