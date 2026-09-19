import Link from 'next/link';
import { imageUrl,filterUrl,type Equipment,type Category,type SearchFilters } from '@/lib/catalogue/contracts';
import { EquipmentImage } from './equipment-image';
import { PriceDisplay,RatingDisplay,AvailabilityBadge,CategoryIcon,Arrow } from './primitives';
export function EquipmentCard({item,filters={}}:{item:Equipment;filters?:Partial<SearchFilters>}){
 const path=filterUrl({start:filters.start,end:filters.end,postcode:filters.postcode},`/equipment/${item.slug}`);
 return <article className="equipment-card"><Link href={path} className="equipment-card-link"><div className="equipment-card-image"><EquipmentImage src={imageUrl(item.images[0]?.path)} alt={item.images[0]?.alt||item.title}/>{item.is_demo&&<span className="demo-label">Demo fleet</span>}<span className="card-arrow"><Arrow/></span></div><div className="equipment-card-body"><div className="eyebrow">{item.category.name}</div><h3>{item.title}</h3><p className="equipment-location">{item.service_area}</p><div className="card-price"><PriceDisplay daily={item.daily_rate}/><RatingDisplay/></div><div className="card-foot"><AvailabilityBadge available={item.availability?.available}/><span>{item.delivery_eligible?'Delivery on request':'Collection available'}</span></div><span className="sr-only">View equipment</span></div></Link></article>;
}
export function CategoryCard({category,index}:{category:Category;index:number}){return <Link className="category-card" href={`/category/${category.slug}`}><div className="flex items-start justify-between"><CategoryIcon slug={category.slug}/><span className="category-number">0{index+1}</span></div><span>{category.name}</span><Arrow/></Link>;}
