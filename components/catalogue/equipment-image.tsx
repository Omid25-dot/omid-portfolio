'use client';
import Image from 'next/image';
import { useState } from 'react';
export function EquipmentImage({src,alt,priority=false,sizes='(max-width: 640px) 100vw, (max-width: 1000px) 50vw, 33vw'}:{src:string;alt:string;priority?:boolean;sizes?:string}){
 const [failed,setFailed]=useState(false);
 return <Image src={failed?'/images/equipment-placeholder.svg':src} alt={failed?'Equipment photograph coming soon':alt} fill sizes={sizes} preload={priority} onError={()=>setFailed(true)} className="object-cover"/>;
}
