/* Story & crisis events.
   type   : 'story'  -> fires deterministically the first year its cond() is true
            'random' -> rolls in the random-event pool (crises / boons)
   once   : fire only once ever (default true for story, false for random)
   cond(s): eligibility test against game state `s`
   weight : relative odds inside the random pool
   choices: [{ text, log, logClass, effects:{res deltas}, flags:{...} }]
            or a choice with apply(s) that returns { log, logClass } for dynamic outcomes

   State shape: s.res.{food,coin,materials,population,happiness,knowledge},
                s.year, s.eraIndex, s.buildings[id]=count, s.tech[id]=true, s.flags[...]
*/
(function () {
  const has = (s, id) => (s.buildings[id] || 0) > 0;

  window.GAME_EVENTS = [
    /* ===================== ERA STORY BEATS ===================== */
    {
      id:'founding', type:'story', once:true, cond:(s)=> s.year >= 1,
      title:'A Place to Begin', icon:'🌅',
      body:'You stand on a green hill where a stream meets the forest road. A few families have followed you here, carts loaded with all they own. "Where do we build first?" they ask.\n\nThis is your realm now. Make it endure.',
      choices:[
        { text:'Break ground at dawn.', log:'The realm is founded. The first cottages go up.', logClass:'log-story',
          effects:{ happiness:4 } }
      ]
    },
    {
      id:'era_renaissance', type:'story', once:true, cond:(s)=> s.eraIndex >= 1,
      title:'A New Age Dawns', icon:'🎨',
      body:'Word of your prosperous town spreads. Artists, bankers and scholars arrive at your gates. The Renaissance has come to your realm — a time of trade, learning and beauty.',
      choices:[
        { text:'Welcome the new age.', log:'The Renaissance begins. New ideas take root.', logClass:'log-story',
          effects:{ knowledge:15, happiness:5 } }
      ]
    },
    {
      id:'era_industrial', type:'story', once:true, cond:(s)=> s.eraIndex >= 2,
      title:'The Age of Steam', icon:'🏭',
      body:'The first steam engine roars to life. Chimneys rise where orchards once stood. Fortunes will be made — and the air grows thick with smoke. The Industrial Age has arrived.',
      choices:[
        { text:'Embrace progress.', log:'The Industrial Age begins. The city thunders to life.', logClass:'log-story',
          effects:{ coin:30, happiness:-4 } }
      ]
    },
    {
      id:'era_modern', type:'story', once:true, cond:(s)=> s.eraIndex >= 3,
      title:'The Modern Era', icon:'🌆',
      body:'Glass towers catch the morning sun. Computers hum, trains glide underground, and clean energy powers it all. From a hilltop hamlet you have built a metropolis that spans the horizon.\n\nThe story is far from over — but take a moment. Look how far your realm has come.',
      choices:[
        { text:'This is only the beginning.', log:'★ The Modern Era begins. Your metropolis is the envy of the world.', logClass:'log-story',
          effects:{ knowledge:40, coin:60, happiness:8 }, flags:{ reachedModern:true } }
      ]
    },

    /* ===================== EARLY STORY (branching) ===================== */
    {
      id:'the_wanderer', type:'story', once:true, cond:(s)=> s.year >= 3 && s.res.population >= 6,
      title:'The Wanderer', icon:'🧳',
      body:'A ragged stranger arrives at dusk, asking for shelter. They claim to be a skilled builder fallen on hard times. Some of your people are wary of outsiders.',
      choices:[
        { text:'Welcome them in.', log:'The wanderer joins the realm and proves their worth.', logClass:'log-good',
          effects:{ population:3, materials:10 }, flags:{ welcoming:true } },
        { text:'Send them on their way.', log:'You turn the stranger away. Some grumble at the cold welcome.', logClass:'log-bad',
          effects:{ happiness:-4 } }
      ]
    },
    {
      id:'bandit_raid', type:'random', weight:14, once:false,
      cond:(s)=> s.eraIndex <= 1 && s.res.population >= 8,
      title:'Raiders at the Gate', icon:'⚔️',
      body:'Bandits emerge from the treeline, eyeing your stores. They demand tribute — or they will take it by force.',
      choices:[
        { text:'Pay them off.', log:'You pay the raiders to leave. The treasury is lighter.', logClass:'log-bad',
          effects:{ coin:-20 } },
        { text:'Stand and fight.',
          apply:(s)=>{
            if (has(s,'watchtower')) { s.res.materials += 8; s.res.happiness += 6;
              return { log:'Your watchtower turns the raiders back! The people cheer.', logClass:'log-good' }; }
            s.res.population = Math.max(0, s.res.population - 3); s.res.happiness -= 3;
            return { log:'You fight, but without defenses the cost is steep.', logClass:'log-bad' };
          } }
      ]
    },
    {
      id:'good_harvest', type:'random', weight:12, once:false,
      cond:(s)=> has(s,'farm'),
      title:'A Bountiful Harvest', icon:'🌾',
      body:'Warm rains and long sun give you the finest harvest in memory. The granaries overflow.',
      choices:[
        { text:'Celebrate the bounty!', log:'A bountiful harvest fills the stores.', logClass:'log-good',
          effects:{ food:40, happiness:4 } },
        { text:'Sell the surplus.', log:'You sell the surplus grain for a tidy profit.', logClass:'log-good',
          effects:{ food:15, coin:20 } }
      ]
    },
    {
      id:'plague', type:'random', weight:9, once:false,
      cond:(s)=> s.eraIndex <= 2 && s.res.population >= 20 && !has(s,'hospital'),
      title:'A Sickness Spreads', icon:'🤒',
      body:'A fever moves through the crowded streets. The healers are overwhelmed and frightened families look to you.',
      choices:[
        { text:'Quarantine the sick (costly).', log:'Quarantine slows the plague. It is expensive but lives are saved.', logClass:'log-bad',
          effects:{ coin:-25, population:-3, happiness:-2 } },
        { text:'Let it run its course.', log:'The plague runs its course. Many are lost.', logClass:'log-bad',
          effects:{ population:-12, happiness:-8 } }
      ]
    },
    {
      id:'great_fire', type:'random', weight:8, once:false,
      cond:(s)=> s.res.population >= 15,
      title:'Fire!', icon:'🔥',
      body:'A blaze breaks out in the workshops and leaps from roof to roof. The bucket lines form in the dark.',
      choices:[
        { text:'Rally everyone to fight it.', log:'The fire is beaten back, though stores are scorched.', logClass:'log-bad',
          effects:{ materials:-20, happiness:-2 } },
        { text:'Save the granary first.', log:'You save the food but lose buildings to the flames.', logClass:'log-bad',
          effects:{ materials:-30, coin:-10 } }
      ]
    },
    {
      id:'merchant_caravan', type:'random', weight:13, once:false,
      cond:(s)=> has(s,'market') || s.eraIndex >= 1,
      title:'A Merchant Caravan', icon:'🐫',
      body:'A wealthy caravan rolls into town, eager to trade. Their goods are fine and their prices fair.',
      choices:[
        { text:'Sell materials for coin.', log:'You trade timber and stone for good coin.', logClass:'log-good',
          effects:{ materials:-15, coin:30 } },
        { text:'Buy materials with coin.', log:'You stock up on materials from the caravan.', logClass:'log-good',
          effects:{ coin:-20, materials:30 } },
        { text:'Trade for rare manuscripts.', log:'You buy rare manuscripts — a boon for your scholars.', logClass:'log-good',
          effects:{ coin:-15, knowledge:18 } }
      ]
    },
    {
      id:'festival', type:'random', weight:11, once:false,
      cond:(s)=> s.res.population >= 12,
      title:'A Time for Celebration', icon:'🎉',
      body:'The people ask for a festival — music, food and dancing in the square. It will cost coin, but spirits are low.',
      choices:[
        { text:'Throw a grand festival.', log:'A grand festival lifts every heart.', logClass:'log-good',
          effects:{ coin:-20, food:-10, happiness:12 } },
        { text:'A modest gathering.', log:'A modest gathering brings a little cheer.', logClass:'log-good',
          effects:{ coin:-5, happiness:5 } },
        { text:'Not this year.', log:'You cancel the festival. The mood sours.', logClass:'log-bad',
          effects:{ happiness:-4 } }
      ]
    },

    /* ===================== RENAISSANCE+ ===================== */
    {
      id:'rival_city', type:'story', once:true, cond:(s)=> s.eraIndex >= 1 && s.res.population >= 30,
      title:'The Rival City', icon:'🏰',
      body:'Across the river, a rival city has grown rich. Their envoy proposes an alliance of trade — but alliances bind as well as bless.',
      choices:[
        { text:'Forge the alliance.', log:'You ally with the rival city. Trade flourishes.', logClass:'log-good',
          effects:{ coin:25, knowledge:10 }, flags:{ allied:true } },
        { text:'Remain independent.', log:'You decline the alliance and chart your own course.', logClass:'log-story',
          effects:{ happiness:3 }, flags:{ independent:true } }
      ]
    },
    {
      id:'master_scholar', type:'random', weight:10, once:false,
      cond:(s)=> s.eraIndex >= 1 && (has(s,'university') || has(s,'scholars_hall')),
      title:'A Visiting Genius', icon:'🔭',
      body:'A renowned scholar seeks a patron for their research. Their work could change everything — if you can fund it.',
      choices:[
        { text:'Fund the research.', log:'You fund the scholar. A breakthrough follows.', logClass:'log-good',
          effects:{ coin:-25, knowledge:35 } },
        { text:'Politely decline.', log:'You decline to fund the scholar, who moves on.', logClass:'log-neutral',
          effects:{} }
      ]
    },

    /* ===================== INDUSTRIAL+ ===================== */
    {
      id:'labor_unrest', type:'random', weight:12, once:false,
      cond:(s)=> s.eraIndex >= 2 && (has(s,'factory') || has(s,'textile_mill')),
      title:'The Workers Organize', icon:'✊',
      body:'Factory workers down their tools, demanding shorter days and safer floors. The owners want them back to work — now.',
      choices:[
        { text:'Grant reforms.', log:'You grant labor reforms. Costly, but the people remember.', logClass:'log-good',
          effects:{ coin:-30, happiness:12 }, flags:{ proLabor:true } },
        { text:'Side with the owners.', log:'You break the strike. Production holds, but resentment festers.', logClass:'log-bad',
          effects:{ coin:15, happiness:-12 } }
      ]
    },
    {
      id:'pollution', type:'random', weight:10, once:false,
      cond:(s)=> s.eraIndex >= 2 && ((s.buildings.factory||0) + (s.buildings.steel_mill||0)) >= 2 && !has(s,'park'),
      title:'Choking Skies', icon:'🌫️',
      body:'Soot blackens the laundry and the river runs grey. Citizens cough in the streets and demand you act.',
      choices:[
        { text:'Fund clean-up efforts.', log:'You fund a clean-up. The skies clear a little.', logClass:'log-good',
          effects:{ coin:-25, happiness:6 } },
        { text:'Ignore the complaints.', log:'You ignore the smog. Discontent grows.', logClass:'log-bad',
          effects:{ happiness:-9 } }
      ]
    },
    {
      id:'recession', type:'random', weight:8, once:false,
      cond:(s)=> s.eraIndex >= 2 && s.res.coin >= 40,
      title:'The Markets Crash', icon:'📉',
      body:'A financial panic sweeps the region. Banks falter and trade dries up overnight.',
      choices:[
        { text:'Bail out the banks.', log:'You bail out the banks. The treasury bleeds but order holds.', logClass:'log-bad',
          effects:{ coin:-40, happiness:-2 } },
        { text:'Let the market correct.', log:'You let the market fall. A painful but shorter slump.', logClass:'log-bad',
          effects:{ coin:-20, happiness:-8 } }
      ]
    },

    /* ===================== MODERN+ ===================== */
    {
      id:'tech_boom', type:'random', weight:11, once:false,
      cond:(s)=> s.eraIndex >= 3 && has(s,'tech_park'),
      title:'A Tech Boom', icon:'🚀',
      body:'A startup born in your tech parks goes global overnight. Investment pours in and talent floods the city.',
      choices:[
        { text:'Ride the wave.', log:'The tech boom showers the city with wealth and ideas.', logClass:'log-good',
          effects:{ coin:60, knowledge:30, population:6 } },
        { text:'Tax it for public good.', log:'You tax the boom to fund services. The people approve.', logClass:'log-good',
          effects:{ coin:40, happiness:10 } }
      ]
    },
    {
      id:'climate_pledge', type:'story', once:true,
      cond:(s)=> s.eraIndex >= 3 && ((s.buildings.factory||0)+(s.buildings.steel_mill||0)) >= 1,
      title:'A Choice for the Future', icon:'🌍',
      body:'The world watches as your metropolis decides its path: double down on heavy industry, or pivot to a green, sustainable future.',
      choices:[
        { text:'Pledge to go green.', log:'You pledge a green future. Mood soars; industry slows.', logClass:'log-good',
          effects:{ happiness:14, coin:-30 }, flags:{ greenPledge:true } },
        { text:'Prioritize industry.', log:'You double down on industry. Coffers swell; the air does not.', logClass:'log-bad',
          effects:{ coin:50, happiness:-10 }, flags:{ industryFirst:true } }
      ]
    },
    {
      id:'election', type:'random', weight:9, once:false,
      cond:(s)=> s.eraIndex >= 3 && s.res.population >= 200,
      title:'Election Season', icon:'🗳️',
      body:'The citizens head to the polls. Your leadership is on the ballot, and promises are flying.',
      choices:[
        { text:'Promise tax cuts.', log:'Tax cuts win votes — but thin the treasury.', logClass:'log-neutral',
          effects:{ coin:-25, happiness:8 } },
        { text:'Promise new services.', log:'You promise new public services. The people rejoice.', logClass:'log-good',
          effects:{ coin:-15, happiness:6, knowledge:10 } }
      ]
    },

    /* ===================== ANY-ERA BOONS ===================== */
    {
      id:'newcomers', type:'random', weight:10, once:false,
      cond:(s)=> s.res.happiness >= 60 && s.stats && s.stats.housingFree >= 5,
      title:'Word Spreads', icon:'🚶',
      body:'Tales of your thriving, happy realm reach distant villages. Families arrive hoping to make a home here.',
      choices:[
        { text:'Open the gates.', log:'New families settle in your realm.', logClass:'log-good',
          effects:{ population:5, happiness:2 } }
      ]
    },
    {
      id:'inventor', type:'random', weight:8, once:false,
      cond:(s)=> s.res.knowledge >= 10,
      title:'A Curious Inventor', icon:'⚙️',
      body:'A tinkerer in the market square unveils a clever contraption. With a little backing, who knows what they might discover?',
      choices:[
        { text:'Back the inventor.', log:'You back the inventor. Their tinkering pays off.', logClass:'log-good',
          effects:{ coin:-10, knowledge:20 } },
        { text:'Wish them luck.', log:'You wish the inventor well and keep your coin.', logClass:'log-neutral',
          effects:{} }
      ]
    }
  ];
})();
