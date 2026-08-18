# Quietly Written — Design Direction

## Reference reading

The supplied composition points toward a tall, asymmetric editorial layout: a quiet top navigation, oversized typographic identity, a strong image-and-text split, and carefully measured whitespace. The supplied color reference establishes a dusty mauve, muted blush, pale cream, and warm-gold atmosphere. The reference site confirms the value of restrained navigation, editorial section pacing, and contextual “discover” actions, but this project remains an original writing publication.

## Three possible directions

### Theme Name: Paper House
Very brief intro: A warm literary journal with tactile paper textures, asymmetrical columns, and a calm cream / mauve palette. It feels intimate, handmade, and quietly premium.
Probability: 0.06

### Theme Name: Violet Index
Very brief intro: A sharper archive-led publication with lavender fields, dark plum rules, and high-contrast type. It feels more contemporary and catalog-like.
Probability: 0.04

### Theme Name: Afterlight Notes
Very brief intro: A soft, cinematic reading room built around dusk colors, quiet photography, and long-form rhythm. It feels reflective, atmospheric, and slow.
Probability: 0.08

## Chosen approach: Paper House

### Design Movement
Contemporary editorial minimalism rooted in independent print journals and Swiss-influenced asymmetrical composition, softened by tactile paper and dusk-toned color.

### Core Principles
1. Typography leads; imagery supports the writing rather than competing with it.
2. Asymmetry creates intimacy: offset columns, editorial rules, and deliberate empty space replace generic centered cards.
3. Every color has a role: mauve carries atmosphere, cream carries readability, plum carries authority, and gold marks moments of attention.
4. The interface should feel collected over time, not assembled from a template.

### Color Philosophy
The page uses warm cream as the reading canvas, dusty mauve as the emotional field, deep plum as the ink, and a restrained honey-gold as a rare signal color. Pink is used in broad surfaces and image atmosphere rather than as a decorative accent on every control.

### Layout Paradigm
A narrow reading spine runs through the page while oversized display type and offset media break the axis. Desktop uses a 12-column editorial grid with intentional negative space; mobile collapses into a one-column reading sequence with left-aligned typography and generous breathing room.

### Signature Elements
- Fine plum rules with tiny index labels, echoing a printed journal.
- Oversized stacked wordmark blocks with occasional colored underlines.
- Small “field notes” metadata rows that behave like captions rather than UI badges.

### Interaction Philosophy
Interactions are quiet and tactile: links reveal an underline, image blocks shift a few pixels on hover, and menus open as calm paper-like panels. Buttons feel like invitations to continue reading, not loud conversion moments.

### Animation
Use 180–260ms ease-out transitions for hover and menu states. Stagger hero text and image reveals by 50ms on first load. Use only transform and opacity for motion, and respect reduced-motion preferences.

### Typography System
Display: Cormorant Garamond, semibold / medium italic for titles and pull quotes. Sans: DM Sans, regular / medium for navigation, metadata, and supporting copy. Titles use tight line-height and slight negative tracking; body copy uses a generous 1.65 line-height and a readable 62–70 character measure.

### Brand Essence
Quietly Written is an intimate online journal for people who notice the feeling between sentences; it is personal, editorial, and deliberately unhurried.
Personality: observant, tender, discerning.

### Brand Voice
Headlines are specific, sensory, and unforced. CTAs sound like editorial directions rather than product commands.
Example lines: “Read what stayed with me.” / “A small archive of unfinished thoughts.”

### Wordmark & Logo
The wordmark is stacked in two lines with an offset baseline, echoing the shape of a folded page. The symbol is a single plum line forming an open page corner; it is used as the favicon and a small header mark.

### Signature Brand Color
Dusty mauve: `#B48D9D`.

## Implementation reminder

All page and style files should reinforce Paper House: cream reading surfaces, dusty mauve atmosphere, deep plum ink, fine rules, editorial asymmetry, and no generic SaaS card grid.
