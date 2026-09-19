'use client';
import { useRef } from 'react';
import { EquipmentImage } from './equipment-image';
export function EquipmentGallery({images,title}:{images:{src:string;alt:string}[];title:string}){
 const track=useRef<HTMLDivElement>(null);const pictures=images.length?images:[{src:'/images/equipment-placeholder.svg',alt:`Photograph coming soon for ${title}`}];
 return <div className="gallery"><div className="gallery-track" ref={track} tabIndex={0} aria-label={`${title} gallery. Swipe or use the image buttons.`}>{pictures.map((im,i)=><div className="gallery-slide" key={im.src}><EquipmentImage {...im} priority={i===0} sizes="(max-width: 900px) 100vw, 65vw"/></div>)}</div>{pictures.length>1&&<div className="gallery-thumbnails">{pictures.map((im,i)=><button type="button" key={im.src} aria-label={`Show image ${i+1}`} onClick={()=>track.current?.scrollTo({left:track.current.clientWidth*i,behavior:'instant'})}><EquipmentImage {...im} sizes="80px"/></button>)}</div>}</div>;
}
