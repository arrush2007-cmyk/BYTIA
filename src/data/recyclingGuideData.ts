export interface RecyclingStep {
  stepNumber: number;
  title: string;
  instruction: string;
}

export interface RecyclingFaq {
  question: string;
  answer: string;
}

export interface RecyclingGuideCategory {
  id: string;
  title: string;
  shortLabel: string;
  resinOrCode: string;
  introduction: string;
  examples: string[];
  recyclableMaterials: string[];
  nonRecyclableMaterials: string[];
  preparationInstructions: string[];
  steps: RecyclingStep[];
  safetyPrecautions: string[];
  disposalMethods: string[];
  faqs: RecyclingFaq[];
}

export const RECYCLING_GUIDE_CATEGORIES: RecyclingGuideCategory[] = [
  {
    id: 'plastic',
    title: 'Plastic Recycling',
    shortLabel: 'Plastic',
    resinOrCode: 'Resin codes #1 (PET), #2 (HDPE), #5 (PP)',
    introduction:
      'Rigid plastic bottles, jugs, and food tubs are widely recovered when emptied and free of food residue. Thin plastic films and multi-layer snack pouches require separate store drop-offs or cannot enter curbside sorting.',
    examples: ['Water & beverage bottles', 'Milk & detergent jugs', 'Yogurt & butter tubs', 'Shampoo bottles'],
    recyclableMaterials: [
      '#1 PET clear drink bottles and clamshell food containers (check local rules)',
      '#2 HDPE milk jugs, laundry detergent bottles, and rigid soap containers',
      '#5 PP yogurt cups, medicine bottles (empty), and clean takeout tubs',
    ],
    nonRecyclableMaterials: [
      'Plastic bags, stretch wrap, and bubble wrap (jam sorting rollers—use grocery store film drop-off if available)',
      'Foam polystyrene (#6) cups, meat trays, and packing peanuts',
      'Flexible chip bags, toothpaste tubes, and multi-layer squeeze pouches',
    ],
    preparationInstructions: [
      'Empty all liquids or food completely before placing in recycling.',
      'Lightly rinse sticky jars or tubs with cold water and let them drain dry.',
      'Check local guidance on caps: most modern programs accept plastic caps screwed back onto empty bottles.',
    ],
    steps: [
      { stepNumber: 1, title: 'Empty completely', instruction: 'Pour out remaining liquid or scrape out food residue.' },
      { stepNumber: 2, title: 'Rinse & drain', instruction: 'Give a quick rinse so residue does not contaminate paper in the same bin.' },
      { stepNumber: 3, title: 'Separate films & triggers', instruction: 'Remove spray nozzles or plastic sleeves if required locally, and keep plastic bags out of curbside bins.' },
      { stepNumber: 4, title: 'Place loose in bin', instruction: 'Never bag recyclables inside tied plastic trash bags; keep items loose.' },
      { stepNumber: 5, title: 'Authorized recovery', instruction: 'Material is baled at a Materials Recovery Facility (MRF) and sent to a certified reprocessor.' },
    ],
    safetyPrecautions: [
      'Do not recycle containers that held motor oil, pesticides, or corrosive automotive chemicals in household bins.',
      'Keep sharp broken rigid plastics wrapped in cardboard for regular waste if unaccepted.',
    ],
    disposalMethods: [
      'Curbside single-stream or source-separated plastic bin',
      'Retail plastic film & bag collection bins for clean #2/#4 film',
      'Municipal household hazardous waste drop-off for chemical jugs',
    ],
    faqs: [
      {
        question: 'Should I crush plastic bottles before recycling?',
        answer:
          'Check your local facility: optical sorters at some modern facilities identify uncrushed 3D bottles more accurately, though flattening with the cap off saves space in manual collection programs.',
      },
      {
        question: 'Why are plastic bags banned from curbside recycling bins?',
        answer:
          'Thin plastic film wraps around spinning mechanical sorting gears, forcing facilities to halt operations for manual clearing.',
      },
    ],
  },
  {
    id: 'paper',
    title: 'Paper & Cardboard Recycling',
    shortLabel: 'Paper & Cardboard',
    resinOrCode: 'OCC Corrugated, Mixed Paper, Kraft',
    introduction:
      'Clean, dry paper and corrugated cardboard fibers can typically be pulped and remanufactured 5 to 7 times. Moisture, cooking grease, and plastic laminations break fiber bonds and degrade batches.',
    examples: ['Shipping boxes', 'Cereal & pasta cartons', 'Office paper & mail', 'Newspapers & magazines'],
    recyclableMaterials: [
      'Flattened corrugated cardboard shipping boxes (tape may remain in small amounts)',
      'Clean paperboard boxes (cereal, shoe, and tissue boxes)',
      'Office paper, notebooks (remove metal spirals if thick), envelopes, and newspapers',
    ],
    nonRecyclableMaterials: [
      'Grease-soaked pizza box bottoms or food-stained paper plates',
      'Thermal receipts (often coated with BPA/BPS) and wax-coated milk cartons unless locally accepted',
      'Shredded confetti paper (too short to sort unless bagged in paper per local rule) and foil wrapping paper',
    ],
    preparationInstructions: [
      'Break down and flatten every cardboard box to save bin and truck volume.',
      'Remove packing foam, air pillows, and large plastic windows.',
      'Keep paper dry—wet or moldy cardboard should be composted or discarded.',
    ],
    steps: [
      { stepNumber: 1, title: 'Inspect for grease', instruction: 'Tear off any oily pizza box sections for composting and keep only clean cardboard.' },
      { stepNumber: 2, title: 'Remove inserts', instruction: 'Take out foam blocks, bubble wrap, and plastic liners.' },
      { stepNumber: 3, title: 'Flatten boxes', instruction: 'Cut tape seams and fold boxes completely flat.' },
      { stepNumber: 4, title: 'Keep dry', instruction: 'Place in covered paper or dry recycling collection.' },
      { stepNumber: 5, title: 'Pulping recovery', instruction: 'Fibers are hydrapulped, screened, and pressed into recycled paperboard.' },
    ],
    safetyPrecautions: [
      'Shred sensitive financial documents before recycling if using open community drop-offs.',
      'Watch for heavy box staples when breaking down industrial cartons.',
    ],
    disposalMethods: [
      'Municipal paper/cardboard bin or curbside recycling',
      'Local cardboard compaction drop-off stations',
      'Shredded unbleached cardboard can serve as brown carbon material in compost',
    ],
    faqs: [
      {
        question: 'Do I need to remove every strip of packing tape?',
        answer:
          'Standard clear shipping tape is screened out during the pulping process, though removing large plastic straps and labels improves fiber yield.',
      },
    ],
  },
  {
    id: 'glass',
    title: 'Glass Recycling',
    shortLabel: 'Glass',
    resinOrCode: 'Container Glass (Clear, Green, Amber)',
    introduction:
      'Bottle and jar glass is infinitely recyclable without loss of purity when separated from ceramics, mirrors, and heat-resistant cookware, which melt at different temperatures and ruin batches.',
    examples: ['Pasta & jam jars', 'Beverage bottles', 'Olive oil bottles', 'Cosmetic glass jars'],
    recyclableMaterials: [
      'Clear, green, and amber food and beverage bottles and jars',
      'Clean glass condiment and sauce jars (labels can remain)',
    ],
    nonRecyclableMaterials: [
      'Pyrex, borosilicate lab glass, and ovenware (higher melting point)',
      'Window panes, mirrors, drinking glasses, and ceramic mugs',
      'Incandescent or fluorescent light bulbs (contain filaments or mercury)',
    ],
    preparationInstructions: [
      'Empty and rinse jars thoroughly to prevent pests and odor.',
      'Remove metal lids and recycle metal caps separately (or per local guideline).',
      'Keep glass bottles unbroken when placing in collection bins to protect sorting workers.',
    ],
    steps: [
      { stepNumber: 1, title: 'Empty & rinse', instruction: 'Rinse jars until no food residue remains.' },
      { stepNumber: 2, title: 'Separate lids', instruction: 'Remove metal screw lids or corks before recycling.' },
      { stepNumber: 3, title: 'Check glass type', instruction: 'Confirm it is food/beverage container glass, not window or cookware glass.' },
      { stepNumber: 4, title: 'Place gently', instruction: 'Set unbroken containers into dedicated glass or curbside bins.' },
      { stepNumber: 5, title: 'Cullet remelting', instruction: 'Glass is crushed into cullet, color-sorted, and melted into new containers.' },
    ],
    safetyPrecautions: [
      'Never place broken shards loose in recycling bins—wrap broken glass tightly in newspaper or cardboard and dispose safely in residual waste.',
      'Handle chipped jar rims with gloves.',
    ],
    disposalMethods: [
      'Dedicated color-sorted glass bottle banks (highest recovery quality)',
      'Curbside mixed recycling where accepted by local municipality',
    ],
    faqs: [
      {
        question: 'Why cannot drinking glasses or ceramic mugs go in glass recycling?',
        answer:
          'Tableware and ceramics have different chemical compositions and melting temperatures, causing defects or structural weaknesses in recycled bottles.',
      },
    ],
  },
  {
    id: 'metal',
    title: 'Metal Recycling',
    shortLabel: 'Metal',
    resinOrCode: 'Aluminum & Ferrous Tin/Steel',
    introduction:
      'Aluminum and steel cans retain high structural value across unlimited recycling loops and require up to 95% less energy to reprocess than virgin ore extraction.',
    examples: ['Soda & sparkling water cans', 'Soup & bean tin cans', 'Clean aluminum foil trays', 'Empty metal jar lids'],
    recyclableMaterials: [
      'Aluminum beverage cans',
      'Steel and tin food cans (rinsed)',
      'Clean aluminum pie tins and balled clean aluminum foil (fist-sized ball)',
    ],
    nonRecyclableMaterials: [
      'Pressurized or partially full aerosol spray cans and propane cylinders',
      'Paint cans with wet latex or oil-based paint inside',
      'Small loose scrap metal (nails, hangers, wires—these tangle sorting belts)',
    ],
    preparationInstructions: [
      'Rinse food cans so sauce does not attract pests or soil paper.',
      'Tuck sharp tin lids inside the can and pinch slightly, or follow local rules.',
      'Gather clean aluminum foil into a ball at least 5 cm (2 inches) wide so optical/eddy sorters catch it.',
    ],
    steps: [
      { stepNumber: 1, title: 'Empty & rinse', instruction: 'Rinse soup, pet food, and beverage cans cleanly.' },
      { stepNumber: 2, title: 'Safe lid handling', instruction: 'Drop detached sharp lids inside the can or recycle loose if flat and safe.' },
      { stepNumber: 3, title: 'Verify aerosol emptiness', instruction: 'Only recycle aerosol cans if 100% empty and accepted locally.' },
      { stepNumber: 4, title: 'Place in recycling', instruction: 'Add to curbside metal stream or municipal scrap drop-off.' },
      { stepNumber: 5, title: 'Magnetic & eddy sorting', instruction: 'Magnets pull steel and eddy currents separate aluminum for smelting.' },
    ],
    safetyPrecautions: [
      'Watch out for razor-sharp edges on opened tin cans.',
      'Never puncture pressurized canisters, propane tanks, or spray cans.',
    ],
    disposalMethods: [
      'Curbside metal & container recycling',
      'Scrap metal yards for appliances, copper pipes, and iron hardware',
      'Household hazardous waste sites for pressurized canisters',
    ],
    faqs: [
      {
        question: 'Should I leave the pull-tab on aluminum cans?',
        answer: 'Yes—leaving tabs attached ensures small pieces are not lost through sorting screens.',
      },
    ],
  },
  {
    id: 'ewaste',
    title: 'Electronic Waste (E-Waste)',
    shortLabel: 'E-Waste',
    resinOrCode: 'WEEE / Certified E-Stewards',
    introduction:
      'Electronics contain valuable recoverable metals (copper, gold, cobalt) alongside hazardous substances such as lead, mercury, and lithium cells. They must never be placed in household trash or curbside bins.',
    examples: ['Phones & tablets', 'Laptops & monitors', 'Chargers & cables', 'Small kitchen appliances'],
    recyclableMaterials: [
      'Smartphones, computers, printers, keyboards, and monitors',
      'Power cords, adapters, circuit boards, and audio gear',
      'Small household electronics accepted at certified e-waste drop-offs',
    ],
    nonRecyclableMaterials: [
      'Curbside mixing—electronics must NEVER enter standard home recycling bins',
      'Broken CRT TV glass or leaking batteries handled without protective containment',
    ],
    preparationInstructions: [
      'Back up personal photos and files, then perform a factory reset / wipe storage drives.',
      'Remove detachable AA/AAA or removable lithium battery packs if instructed by the drop-off facility.',
      'Bundle power cables neatly with the device or in a separate bag.',
    ],
    steps: [
      { stepNumber: 1, title: 'Check repair or donation', instruction: 'If the device still works, donate or resell before recycling.' },
      { stepNumber: 2, title: 'Wipe personal data', instruction: 'Sign out of accounts and factory-reset phones, tablets, and laptops.' },
      { stepNumber: 3, title: 'Inspect battery state', instruction: 'Check for swelling or damage; never crush or puncture internal batteries.' },
      { stepNumber: 4, title: 'Store dry & upright', instruction: 'Keep electronics out of curbside bins and store safely until drop-off.' },
      { stepNumber: 5, title: 'Certified e-waste drop-off', instruction: 'Deliver to municipal e-waste events, manufacturer take-back, or R2/e-Stewards recyclers.' },
    ],
    safetyPrecautions: [
      'Swollen lithium-ion batteries pose a severe fire hazard; store in a cool, non-flammable container away from combustibles and contact local hazardous waste services immediately.',
      'Never smash screens or incinerate circuit boards.',
    ],
    disposalMethods: [
      'Certified municipal e-waste collection centers',
      'Retail electronics take-back counters',
      'Manufacturer mail-back recycling programs',
    ],
    faqs: [
      {
        question: 'Why cannot old chargers and phones go in regular recycling?',
        answer:
          'Cables tangle sorting machinery, and embedded lithium batteries routinely spark fires inside collection trucks and recycling facilities.',
      },
    ],
  },
  {
    id: 'textiles',
    title: 'Textile & Clothing Recycling',
    shortLabel: 'Textiles',
    resinOrCode: 'Apparel Reuse & Fiber Recovery',
    introduction:
      'Wearable clothing belongs in donations or community exchanges first. Torn, stained, or mismatched single textiles can often enter dry textile-recycling bins to become insulation, cleaning rags, or recycled yarn.',
    examples: ['Shirts, jeans & coats', 'Clean bedsheets & towels', 'Matched wearable shoes', 'Torn dry cotton scraps'],
    recyclableMaterials: [
      'Clean, dry wearable clothing (prioritize donation or exchange)',
      'Clean, dry worn-out cotton, denim, or wool garments accepted by textile-recovery bins',
    ],
    nonRecyclableMaterials: [
      'Wet, moldy, or oil/solvent-soaked rags (biohazard or spontaneous combustion risk)',
      'Curbside recycling bins—clothing wraps tightly around facility machinery',
    ],
    preparationInstructions: [
      'Wash and thoroughly dry all garments and linens before donating or recycling.',
      'Empty all pockets carefully.',
      'Separate wearable items (for donation) from damaged textiles (labeled for fiber recycling if accepted).',
    ],
    steps: [
      { stepNumber: 1, title: 'Sort by condition', instruction: 'Separate clean, wearable clothing from torn or heavily worn fabrics.' },
      { stepNumber: 2, title: 'Wash & dry completely', instruction: 'Damp textiles develop mold that ruins entire collection batches.' },
      { stepNumber: 3, title: 'Donate or exchange wearable items', instruction: 'Use community exchanges or local shelters for usable clothes.' },
      { stepNumber: 4, title: 'Bag dry scraps', instruction: 'Place damaged dry textiles in a sealed bag if using a textile drop-off.' },
      { stepNumber: 5, title: 'Fiber recovery', instruction: 'Textiles are graded for reuse, industrial wiping cloths, or shredded into insulation.' },
    ],
    safetyPrecautions: [
      'Never donate or recycle rags soaked in paint thinner, linseed oil, or automotive fluids—they can self-ignite.',
    ],
    disposalMethods: [
      'Community Exchange or local charity clothing drives (first priority)',
      'Authorized dry textile recycling drop-off boxes',
      'Brand garment take-back programs',
    ],
    faqs: [
      {
        question: 'Can torn socks or stained t-shirts be donated to textile bins?',
        answer:
          'Only if the specific operator accepts damaged textiles for fiber recycling and the items are clean and completely dry. Never donate wet or moldy fabric.',
      },
    ],
  },
  {
    id: 'compost',
    title: 'Food Waste & Composting',
    shortLabel: 'Food & Compost',
    resinOrCode: 'Organics & Aerobic Composting',
    introduction:
      'When buried in airless landfills, food scraps generate methane, a potent greenhouse gas. Home composting or municipal organics collection turns peels, coffee grounds, and yard trimmings back into nutrient-rich soil.',
    examples: ['Fruit & vegetable peels', 'Coffee grounds & paper filters', 'Crushed eggshells', 'Dry leaves & yard trimmings'],
    recyclableMaterials: [
      'Fruit and vegetable scraps, stale bread, grains, and coffee grounds',
      'Yard trimmings, shredded uncoated cardboard, and dry autumn leaves ("browns")',
    ],
    nonRecyclableMaterials: [
      'Plastic produce stickers, twist ties, and synthetic tea bags',
      'Home compost bins should avoid meat, dairy, oils, and pet waste (commercial municipal facilities may accept meat/dairy—verify locally)',
    ],
    preparationInstructions: [
      'Peel off plastic PLU stickers from fruit skins before composting.',
      'Balance wet food scraps ("greens") with 2–3x volume of dry leaves or shredded brown paper ("browns").',
      'Chop large stalks or rinds into smaller pieces to speed decomposition.',
    ],
    steps: [
      { stepNumber: 1, title: 'Remove non-organics', instruction: 'Strip rubber bands, stickers, and synthetic tea bag staples.' },
      { stepNumber: 2, title: 'Collect greens', instruction: 'Store vegetable scraps and coffee grounds in a vented countertop caddy.' },
      { stepNumber: 3, title: 'Layer with browns', instruction: 'Mix scraps with dry leaves, sawdust, or shredded unbleached cardboard.' },
      { stepNumber: 4, title: 'Aerate & moisturize', instruction: 'Turn the pile periodically so air reaches microbes and moisture stays like a wrung sponge.' },
      { stepNumber: 5, title: 'Harvest compost', instruction: 'Use finished dark, earthy compost for garden beds or houseplants.' },
    ],
    safetyPrecautions: [
      'Wash hands after turning compost piles and avoid inhaling dust from dry moldy piles.',
      'Keep home compost bins covered to deter rodents.',
    ],
    disposalMethods: [
      'Backyard compost bin or wormery (vermicomposting)',
      'Municipal curbside green/organics cart',
      'Community garden compost drop-off',
    ],
    faqs: [
      {
        question: 'Are "compostable" plastic cups accepted everywhere?',
        answer:
          'No. Most bioplastics (PLA) require high-temperature commercial composting facilities and will not break down in a backyard bin.',
      },
    ],
  },
  {
    id: 'battery',
    title: 'Battery Disposal & Recovery',
    shortLabel: 'Batteries',
    resinOrCode: 'Li-ion, NiMH, Alkaline, Lead-Acid',
    introduction:
      'Batteries contain reactive metals and electrolytes that cause collection-truck fires and groundwater contamination when discarded improperly. Always tape terminals and deliver batteries to dedicated drop-off points.',
    examples: ['AA / AAA alkaline cells', 'Lithium-ion laptop & tool packs', 'Button-cell watch batteries', 'Rechargeable power banks'],
    recyclableMaterials: [
      'Lithium-ion (Li-ion), Nickel-Metal Hydride (NiMH), and Nickel-Cadmium (NiCd) cells at certified drop-offs',
      'Button cells and vehicle lead-acid batteries via authorized automotive/retail take-back',
      'Single-use alkaline batteries where municipal battery recovery operates',
    ],
    nonRecyclableMaterials: [
      'NEVER place any battery inside curbside single-stream recycling bins',
      'Damaged, bulging, or punctured lithium cells must not be mailed or tossed in standard collection boxes',
    ],
    preparationInstructions: [
      'Cover exposed metal terminals (or both ends of 9V, button, and lithium batteries) with clear packing or electrical tape to prevent short-circuit fires.',
      'Place each damaged or swollen battery individually inside a non-conductive container (sand or kitty litter bucket) and take to a hazardous waste center.',
    ],
    steps: [
      { stepNumber: 1, title: 'Identify chemistry', instruction: 'Check label for Li-ion, NiMH, Alkaline, or Button-cell chemistry.' },
      { stepNumber: 2, title: 'Inspect for damage', instruction: 'Check for leaks, corrosion, swelling, or heat.' },
      { stepNumber: 3, title: 'Tape terminals', instruction: 'Apply non-conductive clear tape over contacts so cells cannot spark together.' },
      { stepNumber: 4, title: 'Store safely', instruction: 'Keep in a cool, dry plastic or cardboard box away from metal objects.' },
      { stepNumber: 5, title: 'Certified battery drop-off', instruction: 'Deliver to municipal household hazardous waste (HHW) or authorized battery kiosks.' },
    ],
    safetyPrecautions: [
      'CRITICAL: Keep button batteries completely out of reach of children and pets—swallowing causes severe internal burns.',
      'Never crush, heat, or submerge lithium batteries in water.',
      'Handle leaking alkaline batteries with nitrile gloves.',
    ],
    disposalMethods: [
      'Municipal Household Hazardous Waste (HHW) facility',
      'Authorized hardware & electronics store battery drop-off boxes (for undamaged, taped cells)',
      'Auto parts stores for lead-acid car batteries',
    ],
    faqs: [
      {
        question: 'Why do I need to tape battery terminals before recycling?',
        answer:
          'When loose batteries touch each other or metal keys inside a collection bin, residual charge can short-circuit and ignite a fire.',
      },
    ],
  },
];

export interface LocalGuidanceAdvice {
  regionLabel: string;
  curbsideNotes: string;
  dropOffGuidance: string;
  verificationSteps: string[];
}

/**
 * Provides honest, location-aware municipal guidance based on city or PIN/postal input
 * WITHOUT inventing fake recycling centre names or fake street addresses.
 */
export function getLocationAwareGuidance(locationInput: string): LocalGuidanceAdvice {
  const cleaned = locationInput.trim();
  if (!cleaned) {
    return {
      regionLabel: 'General Municipal Guidance',
      curbsideNotes:
        'Enter your city or postal/PIN code to see regional sorting conventions and official lookup steps.',
      dropOffGuidance:
        'Always verify accepted resin codes (#1, #2, #5), glass separation rules, and e-waste drop-off hours with your local sanitation authority.',
      verificationSteps: [
        'Search your city sanitation or municipal solid waste portal for accepted curbside materials.',
        'Use national certified directories (such as Earth911 in the US/Canada or your municipal PCB/ULB portal) for battery and e-waste drop-offs.',
      ],
    };
  }

  const isIndianPin = /^\d{6}$/.test(cleaned);
  const isUsZip = /^\d{5}(-\d{4})?$/.test(cleaned);
  const isUkPostcode = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i.test(cleaned);

  if (isIndianPin) {
    return {
      regionLabel: `India PIN Code ${cleaned}`,
      curbsideNotes:
        'Most Indian urban local bodies (ULBs) follow two-bin or three-bin source segregation: Green (Wet/Organic), Blue (Dry Recyclables), and Red/Black (Domestic Hazardous & Sanitary).',
      dropOffGuidance:
        'For e-waste and batteries, use CPCB-authorized Producer Responsibility Organization (PRO) collection points or municipal Material Recovery Facilities (MRFs) rather than informal burning.',
      verificationSteps: [
        `Check your Municipal Corporation / Swachh Bharat ward schedule for PIN ${cleaned} dry-waste collection days.`,
        'Deliver e-waste and batteries only to CPCB/SPCB-authorized dismantlers or brand take-back centers.',
        'Do not mix sanitary or biomedical waste into the blue dry-waste stream.',
      ],
    };
  }

  if (isUsZip) {
    return {
      regionLabel: `US ZIP Code ${cleaned}`,
      curbsideNotes:
        'US curbside rules vary by county and MRF operator. Typically clean #1/#2 bottles, metal cans, flattened cardboard, and container glass (some counties exclude glass curbside) are accepted.',
      dropOffGuidance:
        'Thin plastic bags/films go to participating grocery store front-of-store bins; lithium batteries and electronics require county Household Hazardous Waste (HHW) or certified R2/e-Stewards drop-offs.',
      verificationSteps: [
        `Look up ZIP ${cleaned} on your city Public Works website or Earth911.com for verified facility addresses and hours.`,
        'Confirm whether glass bottles go in your curbside cart or require a municipal glass drop-off.',
        'Never bag curbside recyclables in plastic trash bags.',
      ],
    };
  }

  if (isUkPostcode) {
    return {
      regionLabel: `UK Postcode ${cleaned.toUpperCase()}`,
      curbsideNotes:
        'UK local councils specify exact bin colors for dry mixed recycling, food caddies, and glass. Check whether plastic pots, tubs, and trays are collected by your council.',
      dropOffGuidance:
        'Use your local Household Waste Recycling Centre (HWRC) for WEEE electronics, scrap metal, wood, and hazardous batteries.',
      verificationSteps: [
        `Enter postcode ${cleaned.toUpperCase()} on Recycle Now (recyclenow.com) or your local council website to confirm exact bin rules.`,
        'Supermarkets provide dedicated collection points for soft plastics and small batteries.',
      ],
    };
  }

  return {
    regionLabel: `Location: ${cleaned}`,
    curbsideNotes: `Sorting eligibility in ${cleaned} depends on your local municipal Materials Recovery Facility (MRF). Keep paper dry, rinse food containers, and keep plastic films and batteries out of curbside bins.`,
    dropOffGuidance: `For electronics, lithium batteries, paint, and bulk textiles in ${cleaned}, locate your official city sanitation or certified e-waste drop-off portal before transport.`,
    verificationSteps: [
      `Search "${cleaned} municipal recycling guide" or "${cleaned} household hazardous waste drop-off" on your city government website.`,
      'Confirm opening hours and ID/residency requirements before visiting a municipal drop-off center.',
    ],
  };
}
