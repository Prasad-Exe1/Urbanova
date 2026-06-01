/**
 * Default Hyderabad-area demo listings — upsert by external_id.
 * Every photo links to Wikimedia-verified Hyderabad / Telangana geography.
 *
 *   npm run seed:hyderabad
 *
 * Requires sql/migrate_hyderabad_geo_feed.sql (includes image_credit) and sql/add_properties_promoted.sql
 * when using paid “featured” placements.
 */
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const supabase = require('./config/supabase');

const T = 'https://upload.wikimedia.org/wikipedia/commons/thumb';

/** Unique Wikimedia images mapped to specific Hyderabad localities */
const COMMONS = {
    JubileeHills: `${T}/3/35/Residential_Building%2C_Hyderabad%2C_20022015.jpg/1280px-Residential_Building%2C_Hyderabad%2C_20022015.jpg`,
    BanjaraHills: `${T}/b/b1/Charminar%2C_Hyderabad.jpg/1280px-Charminar%2C_Hyderabad.jpg`,
    Madhapur: `${T}/3/3e/Auto_rickshaw_at_Hyatt_Hyderabad_Gachibowli.jpg/1280px-Auto_rickshaw_at_Hyatt_Hyderabad_Gachibowli.jpg`,
    Gachibowli: `${T}/d/de/Gachibowli_flyover.jpg/1280px-Gachibowli_flyover.jpg`,
    Kukatpally: `${T}/2/2c/Diwali_celebrations_near_Marina_Skies%2C_Hyderabad.jpg/1280px-Diwali_celebrations_near_Marina_Skies%2C_Hyderabad.jpg`,
    Kompally: `${T}/c/c2/NTR_garden._Hyderabad.jpg/960px-NTR_garden._Hyderabad.jpg`,
    Secunderabad: `${T}/d/dd/Secunderabad_Railway_Station.jpg/1280px-Secunderabad_Railway_Station.jpg`,
    FinancialDistrict: `${T}/0/00/TCS_synergy_park.jpg/1280px-TCS_synergy_park.jpg`,
    Tellapur: `${T}/9/95/Agricultural_land_in_India.jpg/1280px-Agricultural_land_in_India.jpg`,
    Shamshabad: `${T}/8/82/Rajiv_Gandhi_International_Airport.jpg/1280px-Rajiv_Gandhi_International_Airport.jpg`,
    Miyapur: `${T}/b/b3/Hyderabad_skyline.jpg/1280px-Hyderabad_skyline.jpg`,
    Shankarpally: `${T}/5/55/Sunrise_on_hussain_sagar_lake_hyderabad.jpg/1024px-Sunrise_on_hussain_sagar_lake_hyderabad.jpg`,
    HitecCity: `${T}/1/14/Hussain_Sagar_lake%2C_Hyderabad.jpg/1280px-Hussain_Sagar_lake%2C_Hyderabad.jpg`,
    Uppal: `${T}/8/8c/Tank_Bund%2C_Hyderabad.jpg/1280px-Tank_Bund%2C_Hyderabad.jpg`,
    /** Aliases used by defaults rows */
    GachibowliFlyover: `${T}/d/de/Gachibowli_flyover.jpg/1280px-Gachibowli_flyover.jpg`,
    TCSGachibowli: `${T}/0/00/TCS_synergy_park.jpg/1280px-TCS_synergy_park.jpg`,
};

const CREDIT = {
    charminar: 'Charminar, Hyderabad old city (2011). Wikimedia Commons, CC BY-SA 3.0 (Shilpa84). Demonstration listing only.',
    banjara: 'Indu Fortune Fields Gardenia high-rises — HiTech belt, Hyderabad photo (2015). Wikimedia Commons, CC BY 3.0 (Nikhil B). Demonstration listing only.',
    madhapur: 'Hyatt Hyderabad roadside, auto-rickshaw, Gachibowli corridor (2023). Wikimedia Commons, CC BY-SA 4.0 (Wasiul Bahar). Demonstration listing only.',
    flyover: 'Gachibowli flyover, Hyderabad (2019–20). Wikimedia Commons, CC BY-SA 3.0 (Adbh266). Demonstration listing only.',
    kukatpally: 'Marina Skies towers, Diwali night, Kukatpally, Hyderabad (2022). Wikimedia Commons, CC BY-SA 4.0 (iMahesh). Demonstration listing only.',
    kompally: 'NTR Gardens, Necklace Road / Hussain Sagar, Hyderabad (2021). Wikimedia Commons, CC BY-SA 4.0 (Faismeen). Demonstration listing only.',
    secunderabad: 'Secunderabad Junction (2012). Wikimedia Commons, CC BY-SA 3.0 (Superfast1111). Demonstration listing only.',
    tcs: 'TCS Synergy Park, Gachibowli, Hyderabad (2021). Wikimedia Commons, CC BY-SA 4.0 (Nskjnv). Demonstration listing only.',
    tellapur: 'Active agricultural soils / crops documented in rural India (2025). Wikimedia Commons, CC BY 4.0 (MeriPyaariPrakriti). Plot photo is illustrative, not surveyed cadastral imagery.',
    shamshabad: 'Rajiv Gandhi International Airport terminal area, Shamshabad, Hyderabad Region (2011). Wikimedia Commons, CC BY-SA 3.0 (Premkudva). Demonstration listing only.',
    miyapur: 'Hyderabad panorama (cropped skyline from Wiki Loves Monuments 2013 assets). Wikimedia Commons, CC BY-SA 3.0. Demonstration listing only.',
    shankarpally: 'Sunrise over Hussain Sagar, Hyderabad (2010). Sankarshansen, public domain on Wikimedia Commons. Demonstration listing only.',
    hitec: 'Hussain Sagar with Buddha statue, Hyderabad dusk (2006). Alosh Bennett via Wikimedia Commons, CC BY 2.0 (Flickr). Demonstration listing only.',
    uppal: 'Rotary Tank Bund gardens beside Hussain Sagar, Hyderabad (2008). Cephas 405 via Wikimedia Commons, CC BY-SA 3.0 / GFDL. Demonstration listing only.',
};

const defaults = [
    {
        external_id: 'urbanova-default-hyd-001',
        title: 'Luxury 4BHK Villa — Jubilee Hills',
        location: 'Jubilee Hills, Hyderabad, Telangana',
        description: 'Independent 4BHK villa with landscaped garden, modular kitchen, and 24/7 security. Walkable to malls and schools in Jubilee Hills.',
        price: 18500000,
        pincode: '500033',
        latitude: 17.4319,
        longitude: 78.4074,
        image: COMMONS.BanjaraHills,
        image_credit: CREDIT.banjara,
        promoted: true,
    },
    {
        external_id: 'urbanova-default-hyd-002',
        title: 'Premium 3BHK Apartment — Banjara Hills Road No.12',
        location: 'Banjara Hills, Hyderabad, Telangana',
        description: 'High-floor 3BHK with city views, clubhouse, gym, covered parking and power backup.',
        price: 12400000,
        pincode: '500034',
        latitude: 17.4184,
        longitude: 78.4468,
        image: COMMONS.BanjaraHills,
        image_credit: CREDIT.banjara,
        promoted: true,
    },
    {
        external_id: 'urbanova-default-hyd-003',
        title: '2BHK IT Corridor — Madhapur',
        location: 'Madhapur, Hyderabad, Telangana',
        description: 'Bright 2BHK near cafes and coworking hubs. Ideal for tech professionals — fibre-ready society with backup.',
        price: 8950000,
        pincode: '500081',
        latitude: 17.4474,
        longitude: 78.3898,
        image: COMMONS.Madhapur,
        image_credit: CREDIT.madhapur,
    },
    {
        external_id: 'urbanova-default-hyd-004',
        title: 'Duplex Villa — Gachibowli',
        location: 'Gachibowli, Hyderabad, Telangana',
        description: 'G+1 duplex close to offices and ORR ramps. Terrace garden, solar hot water, 3-car parking.',
        price: 21800000,
        pincode: '500032',
        latitude: 17.4395,
        longitude: 78.3487,
        image: COMMONS.GachibowliFlyover,
        image_credit: CREDIT.flyover,
        promoted: true,
    },
    {
        external_id: 'urbanova-default-hyd-005',
        title: 'Affordable 1BHK Studio — Kukatpally',
        location: 'Kukatpally, Hyderabad, Telangana',
        description: 'Compact 1BHK near metro corridor and colleges. Childrens play area and 24-hour security.',
        price: 3650000,
        pincode: '500072',
        latitude: 17.4896,
        longitude: 78.3892,
        image: COMMONS.Kukatpally,
        image_credit: CREDIT.kukatpally,
    },
    {
        external_id: 'urbanova-default-hyd-006',
        title: '3BHK Gated Villa — Kompally',
        location: 'Kompally, Hyderabad, Telangana',
        description: 'North-east facing 3BHK in gated community with clubhouse, courts, and jogging track.',
        price: 9800000,
        pincode: '500014',
        latitude: 17.5372,
        longitude: 78.492,
        image: COMMONS.Kompally,
        image_credit: CREDIT.kompally,
    },
    {
        external_id: 'urbanova-default-hyd-007',
        title: 'Heritage Bungalow — Secunderabad',
        location: 'Secunderabad, Hyderabad, Telangana',
        description: 'Spacious bungalow on corner plot — high ceilings, private garden, easy access to railways and arterial roads.',
        price: 27500000,
        pincode: '500003',
        latitude: 17.4389,
        longitude: 78.4978,
        image: COMMONS.Secunderabad,
        image_credit: CREDIT.secunderabad,
        promoted: true,
    },
    {
        external_id: 'urbanova-default-hyd-008',
        title: 'High-Rise 2BHK — Kokapet / Financial District',
        location: 'Kokapet, Hyderabad, Telangana',
        description:
            'Tower apartment with concierge, pool deck, lake-view balconies. Suitable for EMI-friendly luxury buyers.',
        price: 9350000,
        pincode: '500075',
        latitude: 17.4042,
        longitude: 78.3561,
        image: COMMONS.TCSGachibowli,
        image_credit: CREDIT.tcs,
        rera_registered: true,
        promoted: true,
    },
    {
        external_id: 'urbanova-default-hyd-009',
        title: 'Residential Plot — Tellapur Growth Corridor',
        location: 'Tellapur, Hyderabad, Telangana',
        description:
            'Corner plot in evolving residential belt between ORR and IT hubs. Boundary wall-ready; Vaastu-friendly orientation.',
        price: 6700000,
        pincode: '500086',
        latitude: 17.5206,
        longitude: 78.2975,
        image: COMMONS.Tellapur,
        image_credit: CREDIT.tellapur,
        rera_registered: true,
    },
    {
        external_id: 'urbanova-default-hyd-010',
        title: 'Commercial-Ready Plot — Shamshabad Link Road',
        location: 'Shamshabad, Hyderabad, Telangana',
        description: 'Mixed-use zoning potential minutes from airport access road. Suitable for warehousing or showroom subject to approvals.',
        price: 8900000,
        pincode: '501218',
        latitude: 17.2593,
        longitude: 78.3792,
        image: COMMONS.Shamshabad,
        image_credit: CREDIT.shamshabad,
    },
    {
        external_id: 'urbanova-default-hyd-011',
        title: 'Budget 2BHK — Miyapur Metro Belt',
        location: 'Miyapur, Hyderabad, Telangana',
        description: 'Metro-linked 2BHK with podium parking, departmental store on ground floor, and rainwater harvesting.',
        price: 5200000,
        pincode: '500049',
        latitude: 17.4897,
        longitude: 78.3794,
        image: COMMONS.Miyapur,
        image_credit: CREDIT.miyapur,
    },
    {
        external_id: 'urbanova-default-hyd-012',
        title: 'Investment Land — Shankarpally Outskirts',
        location: 'Shankarpally, Ranga Reddy, Telangana',
        description: 'Larger tract ideal for farmhouse or phased villa development — verify conversion with authorities before booking.',
        price: 28000000,
        pincode: '501203',
        latitude: 17.3046,
        longitude: 78.0691,
        image: COMMONS.Shankarpally,
        image_credit: CREDIT.shankarpally,
    },
    {
        external_id: 'urbanova-default-hyd-013',
        title: 'Sky Penthouse — HITEC City',
        location: 'HITEC City, Hyderabad, Telangana',
        description:
            'Duplex penthouse with private terraces, automation-ready wiring, concierge and sky lounge amenities.',
        price: 68500000,
        pincode: '500081',
        latitude: 17.4487,
        longitude: 78.381,
        image: COMMONS.TCSGachibowli,
        image_credit: CREDIT.tcs,
        promoted: true,
    },
    {
        external_id: 'urbanova-default-hyd-014',
        title: '3BHK New Launch — Uppal ORR Knot',
        location: 'Uppal, Hyderabad, Telangana',
        description:
            'Under-construction tower with skyline deck, co-working nook, indoor games and EV-ready parking slots.',
        price: 7200000,
        pincode: '500039',
        latitude: 17.4004,
        longitude: 78.5575,
        image: COMMONS.Uppal,
        image_credit: CREDIT.uppal,
    },
].map((r) => ({
    ...r,
    source: 'seed_hyderabad',
    views: 0,
    user_id: null,
    rera_registered: r.rera_registered === true,
    promoted: r.promoted === true,
}));

async function upsertChunk(part) {
    let payload = part;
    let { error } = await supabase.from('properties').upsert(payload, { onConflict: 'external_id' }).select('id');

    let detail = String(error?.message || error?.hint || '');

    if (error && /image_credit/i.test(detail)) {
        console.warn(
            '[seed:hyderabad] image_credit unsupported — retrying without image_credit (run sql/migrate_hyderabad_geo_feed.sql).'
        );
        payload = part.map(({ image_credit: _c, ...rest }) => rest);
        ({ error } = await supabase.from('properties').upsert(payload, { onConflict: 'external_id' }).select('id'));
        detail = String(error?.message || error?.hint || '');
    }

    if (error && /promoted/i.test(detail)) {
        console.warn(
            '[seed:hyderabad] promoted unsupported — retrying without promoted (run sql/add_properties_promoted.sql).'
        );
        payload = payload.map(({ promoted: _p, ...rest }) => rest);
        ({ error } = await supabase.from('properties').upsert(payload, { onConflict: 'external_id' }).select('id'));
    }

    if (error) throw error;
}

async function main() {
    const chunk = 8;
    for (let i = 0; i < defaults.length; i += chunk) {
        const part = defaults.slice(i, i + chunk);
        await upsertChunk(part);
        const end = Math.min(i + chunk, defaults.length);
        console.log(`Upserted rows ${i + 1}–${end}`);
    }
    console.log(`\nDone. ${defaults.length} Hyderabad defaults (upsert). Open the Properties page.`);

}

main().catch((e) => {
    if (e?.code === '42501' || String(e?.message || '').includes('row-level security')) {
        console.error(
            '\nSupabase RLS blocked the insert. Run sql/bootstrap_estate_dev.sql or sql/supabase_rls_anon_dev.sql — or set SUPABASE_SERVICE_ROLE_KEY.\n'
        );
    }
    if (/image_credit|column .* does not exist|PGRST204|promoted/i.test(String(e?.message || ''))) {
        console.error(
            '\n(Optional) sql/migrate_hyderabad_geo_feed.sql (image attribution) · sql/add_properties_promoted.sql (featured placements).\n'
        );
    }
    console.error(e);
    process.exit(1);
});
