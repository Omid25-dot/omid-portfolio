'use client';
export default function CatalogueError({reset}:{reset:()=>void}){return <div className="container empty-state"><h1>We can’t load the fleet right now.</h1><p>Please try again in a moment. Your hire has not been booked or charged.</p><button className="button" onClick={reset}>Try again</button></div>;}
