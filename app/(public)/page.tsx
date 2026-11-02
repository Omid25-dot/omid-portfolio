import Link from 'next/link';
import { getCategories, searchCatalogue } from '@/lib/catalogue/server';
import { searchSchema, imageUrl } from '@/lib/catalogue/contracts';
import { Container, Section } from '@/components/catalogue/primitives';
import { EquipmentCard, CategoryCard } from '@/components/catalogue/cards';
import { SearchBar } from '@/components/catalogue/search-bar';
import { EquipmentImage } from '@/components/catalogue/equipment-image';
import { Icon } from '@/components/ui/icon';
import { pageMetadata } from '@/lib/catalogue/metadata';

export const metadata = pageMetadata('Hire equipment without the hassle', 'Tools, plant and machinery from one professional hire team. Browse equipment and check hire dates.', '/');

export default async function Home() {
  const [categoriesResult, fleetResult] = await Promise.allSettled([
    getCategories(), searchCatalogue(searchSchema.parse({})),
  ]);
  const categories = categoriesResult.status === 'fulfilled' ? categoriesResult.value : [];
  const fleet = fleetResult.status === 'fulfilled' ? fleetResult.value.items : [];
  const hero = fleet.find(item => item.slug === '1-5t-mini-excavator') || fleet[0];
  const region = process.env.NEXT_PUBLIC_SERVICE_REGION || 'Glasgow';

  return <>
    <section className="hero">
      <Container>
        <div className="hero-grid">
          <div className="hero-copy">
            <h1>Hire equipment<br />without the <span>hassle.</span></h1>
            <p className="hero-description">Tools, plant and machinery across {region}. Ready for your next job. Backed by one expert team.</p>
            <Link href="/equipment" className="button hero-browse">Find the right equipment <Icon name="arrow-right" /></Link>
            <div className="hero-reassurance"><span>Clear hire prices</span><span>Delivery or collection</span></div>
          </div>
          <div className="home-search-heading"><h2>What’s the next job?</h2><span>Find equipment. Check dates. Get a clear quote.</span></div>
          <SearchBar />
          <p className="demo-notice">Explore our development fleet. Equipment, illustrations and prices are demo examples; online checkout is not open. Booking requests are unpaid and subject to review.</p>
          <div className="hero-visual">
            <div className="hero-image"><EquipmentImage src={imageUrl(hero?.images[0]?.path)} alt={hero?.images[0]?.alt || 'Equipment illustration'} priority sizes="(max-width: 800px) 100vw, 50vw" /></div>
            {hero && <Link href={`/equipment/${hero.slug}`} className="hero-caption"><span><small>{hero.is_demo ? 'From our demo fleet' : 'Meet the fleet'}</small><strong>{hero.title}</strong></span><Icon name="arrow-up-right" /></Link>}
          </div>
        </div>
      </Container>
    </section>
    <Section className="categories-section"><Container>
      <div className="section-heading"><div><span className="eyebrow">Big jobs. Small jobs. Sorted.</span><h2>What are you working on?</h2></div><Link className="text-link" href="/categories">All categories <Icon name="arrow-up-right" /></Link></div>
      <div className="category-grid">{categories.map((category, index) => <CategoryCard key={category.slug} category={category} index={index} />)}</div>
      {!categories.length && <p className="notice">Categories are temporarily unavailable. Please try again shortly.</p>}
    </Container></Section>
    <Section className="fleet-section"><Container>
      <div className="section-heading"><div><span className="eyebrow">Ready for the job</span><h2>Find your next workmate.</h2></div><Link className="text-link" href="/equipment">Explore the fleet <Icon name="arrow-up-right" /></Link></div>
      <div className="equipment-grid">{fleet.slice(0, 6).map(item => <EquipmentCard key={item.id} item={item} />)}</div>
      {!fleet.length && <p className="notice">The fleet is temporarily unavailable. <Link href="/equipment">Try the catalogue again.</Link></p>}
    </Container></Section>
    <section className="service-section"><Container className="service-grid">
      <div className="service-intro"><span className="eyebrow">One team, start to finish</span><h2>Good equipment.<br />People you can turn to.</h2><p>From choosing equipment to collection, deal directly with your rental company.</p><Link className="text-link" href="/help">Here to help <Icon name="arrow-up-right" /></Link></div>
      <div className="service-points"><div><span>01</span><div><h3>Prepared for the job</h3><p>Hire requirements and inspection expectations, made clear before handover.</p></div></div><div><span>02</span><div><h3>Know where you stand</h3><p>Transparent quotes, clear deposits and ID requirements on selected equipment.</p></div></div><div><span>03</span><div><h3>One team behind every hire</h3><p>Support from the same rental company throughout your hire.</p></div></div></div>
    </Container></section>
    <Section><Container>
      <div className="section-heading"><div><span className="eyebrow">Less admin. More doing.</span><h2>A simpler way to hire.</h2></div><Link className="text-link" href="/how-it-works">How it works <Icon name="arrow-up-right" /></Link></div>
      <ol className="steps">{[['Find your equipment', 'Browse the right tools for your next job.'], ['Choose your dates', 'Check real availability and a clear hire quote.'], ['Request your hire', 'Sign in, review and send an unpaid booking request.'], ['Get to work', 'Plan collection or ask about delivery.']].map(([title, body], index) => <li key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{body}</p></li>)}</ol>
    </Container></Section>
  </>;
}
