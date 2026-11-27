// Survey content. Option format: [label, photoId|null, detail?]
// photoId "01".."49" = original survey photos; "N01".. = new photos to source (see PHOTO-SHOT-LIST.md).
// A missing photo file shows a "photo coming" tile, so new photos can be dropped into /photos later.

window.VOTERS = ["Athena", "Lynnie", "Beth"];

window.CHAPTERS = [
  { id: "look", title: "The name & the look", blurb: "What we call it, how it reads and what everyone wears." },
  { id: "decor", title: "Welcome & décor", blurb: "Arrival, the photo station and the luncheon room." },
  { id: "course", title: "On the course", blurb: "Carts, tee signs, contests and games." },
  { id: "food", title: "Food & drink", blurb: "Breakfast, the Honey Hole, the luncheon and dessert." },
  { id: "gifts", title: "Gifts, awards & keepsakes", blurb: "What the ladies take home and how we crown the winners." },
  { id: "plan", title: "Planning decisions", blurb: "Operational choices from the committee checklist. Final details need club approval." }
];

window.CATEGORIES = [
  // ---------- The name & the look ----------
  { id: "name", ch: "look", kind: "photo", title: "Event name", blurb: "Which name should go on the invitations?", opts: [
    ["The Queen Bee Invitational", "N01", "A Royal Affair on the Fairway"],
    ["The Buzz on the Greens", "N02", "Nine Holes of Un-BEE-lievable Fun"],
    ["Queens of the Green", "N03", "Play Like a Queen. Swing Like a Bee."],
    ["Birdies, Bees & Bubbly", "N04", "Life Is Sweet on the Fairway"]
  ]},
  { id: "slogans", ch: "look", kind: "text", hero: "N05", title: "Tagline & slogans", blurb: "Pick the lines you'd like to see on the flyers, signs and program.", opts: [
    ["Bee-lieve in Birdies!"], ["A Royal Affair on the Fairway"], ["The Sweetest Round in Town"],
    ["The Buzz Is All About Golf"], ["Par-Tee at the Hive"], ["All the Queen's Ladies"],
    ["Swing Like a Queen, Sting Like a Bee"], ["A Little Honey, A Lot of Golf"],
    ["Good Friends, Great Golf & Sweet Memories"], ["Because every lady deserves to be Queen Bee for a day!"],
    ["Long May We Reign on the Green!"]
  ]},
  { id: "aesthetic", ch: "look", kind: "photo", title: "Overall aesthetic", blurb: "The overall feel of the day.", opts: [
    ["Elegant garden party", "01"], ["Playful bumblebee", "02"], ["Royal black and gold", "03"]
  ]},
  { id: "palette", ch: "look", kind: "swatch", title: "Color palette", blurb: "The colors for print, décor and signage.", opts: [
    ["Royal: black, ivory and antique gold", ["#1d1c18", "#faf6ea", "#b58a2e"]],
    ["Honey garden: honey yellow, ivory, sage and gold", ["#e5a823", "#faf6ea", "#8fa284", "#b58a2e"]],
    ["Full palette: honey yellow, black, ivory, antique gold and sage", ["#e5a823", "#1d1c18", "#faf6ea", "#b58a2e", "#8fa284"]],
    ["Classic bee: yellow, black and white", ["#f3c12b", "#141414", "#ffffff"]]
  ]},
  { id: "attire", ch: "look", kind: "photo", title: "Golf attire & accessories", blurb: "Ideas to suggest to players. Nobody should need a new outfit.", opts: [
    ["Classic yellow and black", "04"], ["Bee antenna headbands", "05"], ["Black and gold striped golf polo", "06"],
    ["Elegant bee jewelry", "07"], ["Miniature crowns", "N06"], ["Yellow visors", "N07"],
    ["Yellow silk scarves and black-and-yellow ribbons", "N08"]
  ]},
  { id: "dresscode", ch: "look", kind: "text", hero: "38", title: "Dress-code wording", blurb: "How the invitation should describe the dress code.", opts: [
    ["Wear your royal colors: black, gold, yellow or white. Crowns and bee accessories encouraged!"],
    ["Wear your finest black, yellow, white or gold golf attire."],
    ["Keep it simple: one bee accessory is all you need."]
  ]},
  { id: "regaccessory", ch: "look", kind: "photo", title: "Bee accessory at registration", blurb: "A small accessory for every lady at check-in, so everyone can join in.", opts: [
    ["Clip-on bee", "N09"], ["Gold bee pin", "39"], ["Antenna headband", "05"]
  ]},

  // ---------- Welcome & décor ----------
  { id: "arrival", ch: "decor", kind: "photo", title: "Arrival: Welcome to the Hive", blurb: "What guests see first at the clubhouse.", opts: [
    ["Welcome sign with sunflowers, greenery and gold bees", "N10", "Welcome to the Hive, Where Every Lady Is a Queen!"],
    ["The Buzz Desk registration table", "N11", "Name tags, club ID, golf assignments, programs, accessories"],
    ["The Morning Buzz coffee and pastry station", "N12"],
    ["The Royal Portrait Station", "12", "Gold honeycombs, flowers, crowns and props"]
  ]},
  { id: "entrance", ch: "decor", kind: "photo", title: "Entrance & photo station", blurb: "The backdrop for photos.", opts: [
    ["Floral honeycomb backdrop", "12"], ["Queen Bee throne", "13"], ["Balloon arch", "14"]
  ]},
  { id: "props", ch: "decor", kind: "photo", title: "Photo booth props", blurb: "What's in the prop basket.", opts: [
    ["Crowns and tiaras", "34"], ["Antenna headbands", "05"], ["Oversized gold bees and striped sunglasses", "N13"],
    ["Handheld word signs", "N14"], ["Gold frame: Long May We Reign on the Green!", "N15"]
  ]},
  { id: "propwords", ch: "decor", kind: "text", hero: "N14", title: "Photo prop sign wording", blurb: "Pick the sayings for the handheld signs.", opts: [
    ["Queen of the Greens"], ["Born to Bee Queen"], ["Talk Birdie to Me"], ["The Bee's Knees"],
    ["Sweet but I Sting"], ["Royal-Tee"], ["Queen Bee Energy"], ["What's the Buzz?"],
    ["Honey, I Got a Birdie!"], ["Just Wingin' It"]
  ]},
  { id: "centerpieces", ch: "decor", kind: "photo", title: "Centerpieces", blurb: "The luncheon table centerpiece.", opts: [
    ["Sunflowers and honey jars", "08"], ["Roses and hydrangeas", "09"], ["Honeycomb vessels", "10"],
    ["Honey jar favors as the centerpiece", "29", "Doubles as a take-home gift"]
  ]},
  { id: "takehome", ch: "decor", kind: "photo", title: "Centerpieces the ladies take home", blurb: "Like Denim & Diamonds: centerpieces that double as gifts.", opts: [
    ["The Honey Pot", "N16", "Flowering plants in honeycomb-pattern pots"],
    ["Sweet as Honey", "29", "Artisan honey jars with gold bee charms and dippers"],
    ["Let It Bee", "33", "Packaged beeswax candles"],
    ["The Royal Garden", "N17", "Petite floral arrangements clustered as one centerpiece"],
    ["Centerpieces stay with the club", null]
  ]},
  { id: "tables", ch: "decor", kind: "photo", title: "Table settings", blurb: "Linens, runners and napkins.", opts: [
    ["Black-and-white stripes", "01"], ["Ivory and gold", "03"], ["Honey yellow", "11"]
  ]},
  { id: "roomdecor", ch: "decor", kind: "photo", title: "Room décor details", blurb: "Concentrate décor where it shows most, to keep costs down.", opts: [
    ["Hanging honeycomb paper balls", "N18"], ["Gold hexagon table numbers", "49"], ["Gold bee napkin rings", "N19"],
    ["Awards table: black linen, gold crowns, prizes on display", "N20"], ["Yellow or black ribbons on chairs", "N21"]
  ]},
  { id: "teamnames", ch: "decor", kind: "text", hero: "48", title: "Table & team names", blurb: "Pick the names we'd use for tables and foursomes.", opts: [
    ["The Queen Bees"], ["The Honey Bunnies"], ["The Birdie Bees"], ["The Bumble Babes"], ["The Golden Girls"],
    ["The Royal Stingers"], ["The Fairway Honeys"], ["The Putt-Putt Pollinators"], ["The Bee-utiful Birdies"],
    ["The Honeycombs"], ["The Sweet Swingers"], ["The Buzzing Birdies"], ["The Par-Tee Bees"], ["The Hive Society"],
    ["The Honey Potters"], ["The Bee Knees"], ["The Royal Hive"], ["The Killer Bees"], ["The Honey Honeys"],
    ["Let each foursome choose its own name"]
  ]},

  // ---------- On the course ----------
  { id: "carts", ch: "course", kind: "photo", title: "Golf carts: Buzz Buggies", blurb: "All decorations removable and clear of the driver's view.", opts: [
    ["Yellow tulle bows", "15"], ["Bumblebee carts", "16"], ["Royal team signs", "17"],
    ["Royalty on the Move sign", "N22"], ["Bag of honey treats for each cart", "N23"]
  ]},
  { id: "coursedecor", ch: "course", kind: "photo", title: "Course decorations", blurb: "Décor on the tees and around the course.", opts: [
    ["Honeycomb tee signs", "48"], ["Bumblebee cart", "16"], ["Queen Bee hanging sign", "17"]
  ]},
  { id: "holes", ch: "course", kind: "text", hero: "N24", title: "Hole themes", blurb: "Hexagonal tee sign on each hole. Hole numbers will be matched to the real course layout.", opts: [
    ["Hole 1 · Welcome to the Hive", null, "Let the royal round begin!"],
    ["Hole 2 · Make a Bee-Line", null, "Straightest drive competition"],
    ["Hole 3 · The Honey Trap", null, "Don't get stuck in the sand!"],
    ["Hole 4 · The Flower Patch", null, "Decorated tee box and photo opportunity"],
    ["Hole 5 · The Queen's Target", null, "Closest to the pin"],
    ["Hole 6 · The Honey Hole", null, "Refreshment station"],
    ["Hole 7 · The Stinger", null, "Longest drive competition"],
    ["Hole 8 · The Busy Bee", null, "Fewest putts on the hole"],
    ["Hole 9 · The Royal Finish", null, "Finish strong, Your Majesty!"]
  ]},
  { id: "signs", ch: "course", kind: "text", hero: "N25", title: "Fun course signs", blurb: "Extra signs to keep play light.", opts: [
    ["To Bee or Not to Bee? Just Putt!"], ["Keep Calm and Buzz On"], ["Sweet Swings Only"],
    ["Bee Kind, Rewind: Repair Your Divots"], ["Don't Worry, Bee Happy"], ["Nobody Likes a Bogey Bee"],
    ["May the Course Bee With You"]
  ]},
  { id: "competitions", ch: "course", kind: "photo", title: "Golf competitions", blurb: "Run alongside the official scoring.", opts: [
    ["Straightest drive (The Bee-Line)", "43"], ["Closest to the pin (The Queen's Target)", "44"],
    ["Longest drive (The Royal Stinger)", "45"], ["Most pars (The Busy Bee)", "46"], ["Fewest putts (The Putting Queen)", "N27"],
    ["Closest to the fairway center (Sweet Spot)", "N26"]
  ]},
  { id: "activities", ch: "course", kind: "photo", title: "Games & entertainment", blurb: "Fun extras around the day.", opts: [
    ["Best dressed Queen Bee", "38"], ["Best decorated cart", "16"], ["Golden Bee Hunt", "39"],
    ["Guess the Honey Pot", "40"], ["Royal Coronation", "41"], ["Honeybee trivia (What's the Buzz?)", "42"],
    ["The Royal Bee: golden bee under one place card", "N28"], ["Best Dressed Hive (team)", "N29"]
  ]},

  // ---------- Food & drink ----------
  { id: "breakfast", ch: "food", kind: "photo", title: "Breakfast: The Morning Buzz", blurb: "Light breakfast as guests arrive.", opts: [
    ["The Morning Buzz coffee station", "N12"], ["The Queen's Tea with honey sticks", "N30"],
    ["Honey Buns (mini croissants)", "N31"], ["Honeycomb Parfaits (yogurt, granola, honey)", "N32"],
    ["The Flower Patch (fresh fruit cups)", "N33"], ["Buzz Bites (mini blueberry muffins)", "N34"]
  ]},
  { id: "honeyhole", ch: "food", kind: "photo", title: "On-course refreshments: The Honey Hole", blurb: "Snacks and drinks at the refreshment hole.", opts: [
    ["Honey-lavender lemonade", "28"], ["Chilled lemon and mint water", "N35"],
    ["Honey-roasted snack mix (plus a nut-free option)", "N36"], ["Honey sticks and wrapped snacks", "N37"],
    ["Mini lemon cookies", "N38"], ["Fresh fruit cups", "N33"]
  ]},
  { id: "luncheon", ch: "food", kind: "photo", title: "Luncheon: A Feast Fit for a Queen", blurb: "Pick the dishes you'd like on the menu.", opts: [
    ["Honey-glazed chicken skewers", "18"], ["Honey-Dijon salmon", "19"], ["Queen's Garden Salad (goat cheese, pears, honey vinaigrette)", "20"],
    ["Honey-glazed cornbread with whipped honey butter", "21"], ["Roasted vegetable and quinoa garden bowl (vegetarian)", "N39"],
    ["Honey-glazed carrots", "N40"], ["Lemon-herb roasted baby potatoes", "N41"]
  ]},
  { id: "desserts", ch: "food", kind: "photo", title: "Desserts: The Sweet Spot", blurb: "The dessert display.", opts: [
    ["Bee cookies", "22"], ["Mini honey cakes", "23"], ["Lemon tartlets", "24"], ["Queen Bee cake", "25"],
    ["Yellow macarons", "N42"], ["Honeycomb chocolates", "N43"], ["Vanilla cupcakes with gold bees", "N44"]
  ]},
  { id: "drinks", ch: "food", kind: "photo", title: "Signature drinks", blurb: "Cocktails and a mocktail for the reception.", opts: [
    ["The Bee's Knees", "26", "Gin, lemon and honey syrup in a coupe"],
    ["The Queen's Bubbly (The Queen's Fizz)", "27", "Prosecco, lemon, a touch of honey syrup and elderflower"],
    ["The Sweet Bee (Honey, I'm Driving)", "28", "Sparkling honey-lavender lemonade, no alcohol"]
  ]},

  // ---------- Gifts, awards & keepsakes ----------
  { id: "gifts", ch: "gifts", kind: "photo", title: "Attendee gifts", blurb: "Pick the items you'd like in the gift.", opts: [
    ["Florida honey gift set", "29", "$4–7"], ["Gold bee ball marker", "30", "$5–12"], ["Bee-print scarf", "31", "$8–18"],
    ["Crystal bee brooch", "07", "$4–10"], ["Custom golf towel", "32", "$10–18"], ["Beeswax candle", "33", "$6–12"],
    ["Bee magnetic visor clip", "N45", "$5–10"], ["Honey-scented hand cream", "N46", "$5–10"]
  ]},
  { id: "giftpackage", ch: "gifts", kind: "photo", title: "Gift packaging", blurb: "How the gift is presented.", opts: [
    ["Ivory box: Florida honey, wooden dipper and gold bee ball marker, tied with black-and-gold ribbon", "N47"],
    ["Gift goes in the welcome bag at check-in", null],
    ["Gift handed out at the farewell", null]
  ]},
  { id: "giftbudget", ch: "gifts", kind: "text", title: "Gift budget per guest", blurb: "Estimates only, not vendor quotes.", opts: [
    ["$12–15"], ["$15–20"], ["Over $20"]
  ]},
  { id: "gifttag", ch: "gifts", kind: "text", title: "Gift tag wording", blurb: "", opts: [
    ["Life is sweeter with good friends and great golf."], ["Thank you for buzzing by Eastpointe!"],
    ["Because every lady deserves to be Queen Bee for a day!"]
  ]},
  { id: "prizes", ch: "gifts", kind: "photo", title: "Awards & prizes", blurb: "What the winners receive.", opts: [
    ["Royal crowns", "34"], ["Golden bee trophies", "35", "Custom trophy topped with a brass bee"], ["Honey gift baskets", "36"], ["Golf shop gift certificates", "37"]
  ]},
  { id: "awards", ch: "gifts", kind: "text", hero: "41", title: "Award categories: The Royal Coronation", blurb: "Which awards should we present?", opts: [
    ["The Queen Bees", null, "First-place team"], ["The Royal Court", null, "Second-place team"],
    ["The Golden Hive", null, "Third-place team"], ["The Royal Stinger", null, "Longest drive"],
    ["The Queen's Target", null, "Closest to the pin"], ["The Bee-Line", null, "Straightest drive"],
    ["The Busy Bee", null, "Most pars, if the format supports it"], ["The Putting Queen", null, "Fewest putts, if tracked"],
    ["The Best Dressed Queen", null, "Best individual outfit"], ["The Best Dressed Hive", null, "Best coordinated team"],
    ["The Best Buzz Buggy", null, "Best decorated cart"], ["The Lucky Honey", null, "Random drawing"],
    ["The Honey Pot", null, "Closest candy-count guess"]
  ]},
  { id: "trophy", ch: "gifts", kind: "photo", title: "Traveling trophy", blurb: "A keepsake if Queen Bee returns in future years.", opts: [
    ["The Golden Queen Bee", "N48", "Gold bee with a mini crown on a black or wooden base, engraved Eastpointe 9-Hole Ladies Invitational"],
    ["No traveling trophy this year", null]
  ]},
  { id: "printed", ch: "gifts", kind: "photo", title: "Printed materials", blurb: "All printed pieces share one look.", opts: [
    ["Souvenir program booklet (The Official Buzz)", "47"], ["Honeycomb tee signs", "48"], ["Bee-themed table names", "49"],
    ["Name badges: Member of the Royal Hive", "N50"], ["Menu cards: A Taste of Honey", "N51"],
    ["Award certificates: The Royal Honors", "N52"]
  ]},
  { id: "playlist", ch: "gifts", kind: "text", hero: "N49", title: "Music & playlist", blurb: "Light background music at registration and lunch.", opts: [
    ["Dancing Queen · ABBA", null, "Entrance music for the Coronation"], ["Honey, Honey · ABBA"], ["Sugar, Sugar · The Archies"],
    ["I Can't Help Myself (Sugar Pie, Honey Bunch) · Four Tops"], ["Queen of Hearts · Juice Newton"],
    ["Sweet Caroline · Neil Diamond"], ["How Sweet It Is (To Be Loved by You) · James Taylor"],
    ["Build Me Up Buttercup · The Foundations"], ["Here Comes the Sun · The Beatles"],
    ["You're My Best Friend · Queen"], ["A Taste of Honey · Herb Alpert & the Tijuana Brass"],
    ["I'm Every Woman · Chaka Khan"], ["Respect · Aretha Franklin"], ["Walking on Sunshine · Katrina and the Waves"],
    ["Honey Bee · Gloria Gaynor"]
  ]},

  // ---------- Planning decisions (spreadsheet) ----------
  { id: "theme", ch: "plan", kind: "text", title: "Theme", blurb: "Theme ideas listed in the committee checklist.", opts: [
    ["Queen Bee"], ["Nautical"], ["Luck of the Irish"], ["Camp Eastpointe"]
  ]},
  { id: "budget", ch: "plan", kind: "text", title: "Budget, entry fee & capacity", blurb: "Price to be set with Derek; Derek and Joe give the player target.", opts: [
    ["Prioritize an affordable entry fee"], ["Include guest gifts and prizes in the entry fee"],
    ["Include breakfast and luncheon in the entry fee"], ["Equal places per visiting club"],
    ["Allocate places based on interest and available capacity"]
  ]},
  { id: "format", ch: "plan", kind: "text", title: "Schedule & golf format", blurb: "Confirmed with the golf shop before it's final.", opts: [
    ["Morning shotgun followed by luncheon and awards"], ["Breakfast before golf"], ["Awards during luncheon"],
    ["Scramble"], ["Two best balls"], ["Flights by handicap, if appropriate"]
  ]},
  { id: "invites", ch: "plan", kind: "text", title: "Invitations & registration", blurb: "", opts: [
    ["Internal flyer and external flyer"], ["ForeTees / club app listing"], ["Invitations with RSVP deadline"],
    ["Waitlist and cancellation process"], ["Collect handicap and dietary information"], ["Send arrival and dress-code instructions"]
  ]},
  { id: "welcomeops", ch: "plan", kind: "text", title: "Guest welcome & event operations", blurb: "", opts: [
    ["Parking and bag-drop directions"], ["Welcome table and name tags"], ["Greeters and contest helpers"],
    ["Welcome bags at check-in"], ["Weather delay and cancellation plan"]
  ]},
  { id: "followup", ch: "plan", kind: "text", title: "Post-event follow-up", blurb: "", opts: [
    ["Thank visiting players, volunteers and staff"], ["Share results and photographs"], ["Reconcile costs and document improvements"]
  ]}
];

// Part 2: creative segments to volunteer for (the open checklist tasks are added after these).
window.SEGMENTS = [
  "Theme & creative direction", "Attire & accessories", "Floral centerpieces", "Table settings & linens",
  "Entrance & welcome display", "Photo booth & props", "Golf cart decorations", "Course decorations & tee signs",
  "Breakfast & refreshments", "Luncheon menu", "Desserts & signature drinks", "Attendee gifts", "Awards & prizes",
  "Games & entertainment", "Golf competitions", "Internal flyer", "External flyer", "Invitations & communications",
  "Program booklet", "Registration & name badges", "Budget & purchasing", "Event-day setup",
  "Photography & follow-up", "Music & playlist"
];

window.ROLES = ["Lead", "Co-plan", "Assist", "Pass"];

// All original photos are now in place (15, 21, 35 and 40 replaced in round 3).
window.PENDING_ORIGINALS = [];
