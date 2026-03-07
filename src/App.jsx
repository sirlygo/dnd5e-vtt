import { useState, useEffect, useCallback, useRef, useMemo, createContext, useContext } from "react";

/* ═══════════════════════════════════════════════════════════════════════
   D&D 5e VIRTUAL TABLETOP — COMPREHENSIVE SRD PLATFORM
   Full character creation, combat, spells, DM tools, battle map, dice
   ═══════════════════════════════════════════════════════════════════════ */

const ABILITIES = ["STR","DEX","CON","INT","WIS","CHA"];
const ABILITY_FULL = {STR:"Strength",DEX:"Dexterity",CON:"Constitution",INT:"Intelligence",WIS:"Wisdom",CHA:"Charisma"};
const STANDARD_ARRAY = [15,14,13,12,10,8];
const PB_COST = {8:0,9:1,10:2,11:3,12:4,13:5,14:7,15:9};

const SKILLS = [
  {name:"Acrobatics",ab:"DEX"},{name:"Animal Handling",ab:"WIS"},{name:"Arcana",ab:"INT"},
  {name:"Athletics",ab:"STR"},{name:"Deception",ab:"CHA"},{name:"History",ab:"INT"},
  {name:"Insight",ab:"WIS"},{name:"Intimidation",ab:"CHA"},{name:"Investigation",ab:"INT"},
  {name:"Medicine",ab:"WIS"},{name:"Nature",ab:"INT"},{name:"Perception",ab:"WIS"},
  {name:"Performance",ab:"CHA"},{name:"Persuasion",ab:"CHA"},{name:"Religion",ab:"INT"},
  {name:"Sleight of Hand",ab:"DEX"},{name:"Stealth",ab:"DEX"},{name:"Survival",ab:"WIS"}
];

const CONDITIONS = [
  {n:"Blinded",d:"Can't see. Auto-fail sight checks. Attacks have disadvantage. Attacks against have advantage.",i:"👁️‍🗨️"},
  {n:"Charmed",d:"Can't attack charmer. Charmer has advantage on social checks.",i:"💕"},
  {n:"Deafened",d:"Can't hear. Auto-fail hearing checks.",i:"🔇"},
  {n:"Frightened",d:"Disadvantage on checks/attacks while source in sight. Can't willingly move closer.",i:"😨"},
  {n:"Grappled",d:"Speed becomes 0. Ends if grappler incapacitated or moved out of reach.",i:"✊"},
  {n:"Incapacitated",d:"Can't take actions or reactions.",i:"💫"},
  {n:"Invisible",d:"Impossible to see without magic. Attacks have advantage. Attacks against have disadvantage.",i:"👻"},
  {n:"Paralyzed",d:"Incapacitated. Can't move or speak. Auto-fail STR/DEX saves. Melee hits are crits.",i:"⚡"},
  {n:"Petrified",d:"Turned to stone. Weight x10. Immune to poison/disease. Resistant to all damage.",i:"🗿"},
  {n:"Poisoned",d:"Disadvantage on attack rolls and ability checks.",i:"☠️"},
  {n:"Prone",d:"Disadvantage on attacks. Melee against has advantage. Ranged against has disadvantage.",i:"🔽"},
  {n:"Restrained",d:"Speed 0. Attacks have disadvantage. Attacks against have advantage. Disadvantage DEX saves.",i:"⛓️"},
  {n:"Stunned",d:"Incapacitated. Can't move. Auto-fail STR/DEX saves. Attacks against have advantage.",i:"💥"},
  {n:"Unconscious",d:"Incapacitated. Drop items. Fall prone. Auto-fail STR/DEX saves.",i:"💤"},
  {n:"Exhaustion",d:"Cumulative levels 1-6. Level 6 = death.",i:"😩"},
  {n:"Concentrating",d:"Must maintain. CON save on damage (DC 10 or half damage taken).",i:"🎯"}
];

const RACES = {
  Human:{sp:30,sz:"Medium",ab:{STR:1,DEX:1,CON:1,INT:1,WIS:1,CHA:1},tr:["Extra Language"],dv:0,desc:"Versatile and ambitious, the most adaptable of all races."},
  "Variant Human":{sp:30,sz:"Medium",ab:{},tr:["Feat at 1st Level","Extra Skill","Choose +1 to two abilities"],dv:0,desc:"Gain a feat and flexible ability scores."},
  "High Elf":{sp:30,sz:"Medium",ab:{DEX:2,INT:1},tr:["Darkvision 60ft","Keen Senses","Fey Ancestry","Trance","Cantrip","Extra Language"],dv:60,desc:"Masters of both sword and spell."},
  "Wood Elf":{sp:35,sz:"Medium",ab:{DEX:2,WIS:1},tr:["Darkvision 60ft","Keen Senses","Fey Ancestry","Trance","Fleet of Foot","Mask of the Wild"],dv:60,desc:"Swift and stealthy forest dwellers."},
  "Hill Dwarf":{sp:25,sz:"Medium",ab:{CON:2,WIS:1},tr:["Darkvision 60ft","Dwarven Resilience","Stonecunning","Dwarven Toughness (+1 HP/level)"],dv:60,desc:"Keen senses and remarkable resilience."},
  "Mountain Dwarf":{sp:25,sz:"Medium",ab:{CON:2,STR:2},tr:["Darkvision 60ft","Dwarven Resilience","Dwarven Armor Training"],dv:60,desc:"Strong and hardy, accustomed to rugged life."},
  "Lightfoot Halfling":{sp:25,sz:"Small",ab:{DEX:2,CHA:1},tr:["Lucky","Brave","Halfling Nimbleness","Naturally Stealthy"],dv:0,desc:"Can hide behind larger creatures."},
  "Stout Halfling":{sp:25,sz:"Small",ab:{DEX:2,CON:1},tr:["Lucky","Brave","Halfling Nimbleness","Stout Resilience"],dv:0,desc:"Hardier than most halflings, resistant to poison."},
  Dragonborn:{sp:30,sz:"Medium",ab:{STR:2,CHA:1},tr:["Draconic Ancestry","Breath Weapon","Damage Resistance"],dv:0,desc:"Born of dragons, walking proudly through the world."},
  "Rock Gnome":{sp:25,sz:"Small",ab:{INT:2,CON:1},tr:["Darkvision 60ft","Gnome Cunning","Artificer's Lore","Tinker"],dv:60,desc:"Natural inventors and illusionists."},
  "Half-Elf":{sp:30,sz:"Medium",ab:{CHA:2},tr:["Darkvision 60ft","Fey Ancestry","Skill Versatility","Choose +1 to two abilities"],dv:60,desc:"Combining the best of humans and elves."},
  "Half-Orc":{sp:30,sz:"Medium",ab:{STR:2,CON:1},tr:["Darkvision 60ft","Menacing","Relentless Endurance","Savage Attacks"],dv:60,desc:"Fierce warriors combining human versatility with orcish might."},
  Tiefling:{sp:30,sz:"Medium",ab:{CHA:2,INT:1},tr:["Darkvision 60ft","Hellish Resistance (fire)","Infernal Legacy"],dv:60,desc:"Bearing the mark of their infernal bloodline."}
};

const CLASSES = {
  Barbarian:{hd:12,pa:"STR",st:["STR","CON"],sk:["Animal Handling","Athletics","Intimidation","Nature","Perception","Survival"],ns:2,ap:"Light, Medium, Shields",wp:"Simple, Martial",sc:false,ft:{1:["Rage (2/day)","Unarmored Defense"]},desc:"A fierce warrior channeling primal rage."},
  Bard:{hd:8,pa:"CHA",st:["DEX","CHA"],sk:SKILLS.map(s=>s.name),ns:3,ap:"Light",wp:"Simple, Hand Crossbows, Longswords, Rapiers, Shortswords",sc:true,sa:"CHA",ck:2,skn:4,sl:{1:[2]},ft:{1:["Spellcasting","Bardic Inspiration (d6)"]},desc:"A master of song, speech, and magic."},
  Cleric:{hd:8,pa:"WIS",st:["WIS","CHA"],sk:["History","Insight","Medicine","Persuasion","Religion"],ns:2,ap:"Light, Medium, Shields",wp:"Simple",sc:true,sa:"WIS",ck:3,sl:{1:[2]},ft:{1:["Spellcasting","Divine Domain"]},desc:"A priestly champion wielding divine magic."},
  Druid:{hd:8,pa:"WIS",st:["INT","WIS"],sk:["Arcana","Animal Handling","Insight","Medicine","Nature","Perception","Religion","Survival"],ns:2,ap:"Light, Medium, Shields (nonmetal)",wp:"Clubs, Daggers, Darts, Javelins, Maces, Quarterstaffs, Scimitars, Sickles, Slings, Spears",sc:true,sa:"WIS",ck:2,sl:{1:[2]},ft:{1:["Druidic","Spellcasting"]},desc:"A priest of the Old Faith wielding nature's power."},
  Fighter:{hd:10,pa:"STR",st:["STR","CON"],sk:["Acrobatics","Animal Handling","Athletics","History","Insight","Intimidation","Perception","Survival"],ns:2,ap:"All armor, Shields",wp:"Simple, Martial",sc:false,ft:{1:["Fighting Style","Second Wind (1d10+level HP)"]},desc:"A master of martial combat."},
  Monk:{hd:8,pa:"DEX",st:["STR","DEX"],sk:["Acrobatics","Athletics","History","Insight","Religion","Stealth"],ns:2,ap:"None",wp:"Simple, Shortswords",sc:false,ft:{1:["Unarmored Defense (10+DEX+WIS)","Martial Arts (d4)"]},desc:"A master of martial arts harnessing body power."},
  Paladin:{hd:10,pa:"STR",st:["WIS","CHA"],sk:["Athletics","Insight","Intimidation","Medicine","Persuasion","Religion"],ns:2,ap:"All armor, Shields",wp:"Simple, Martial",sc:true,sa:"CHA",sl:{1:[0],2:[2]},ft:{1:["Divine Sense","Lay on Hands"]},desc:"A holy warrior bound to a sacred oath."},
  Ranger:{hd:10,pa:"DEX",st:["STR","DEX"],sk:["Animal Handling","Athletics","Insight","Investigation","Nature","Perception","Stealth","Survival"],ns:3,ap:"Light, Medium, Shields",wp:"Simple, Martial",sc:true,sa:"WIS",sl:{1:[0],2:[2]},ft:{1:["Favored Enemy","Natural Explorer"]},desc:"A warrior of the wilderness, hunter and tracker."},
  Rogue:{hd:8,pa:"DEX",st:["DEX","INT"],sk:["Acrobatics","Athletics","Deception","Insight","Intimidation","Investigation","Perception","Performance","Persuasion","Sleight of Hand","Stealth"],ns:4,ap:"Light",wp:"Simple, Hand Crossbows, Longswords, Rapiers, Shortswords",sc:false,ft:{1:["Expertise","Sneak Attack (1d6)","Thieves' Cant"]},desc:"A scoundrel using stealth and trickery."},
  Sorcerer:{hd:6,pa:"CHA",st:["CON","CHA"],sk:["Arcana","Deception","Insight","Intimidation","Persuasion","Religion"],ns:2,ap:"None",wp:"Daggers, Darts, Slings, Quarterstaffs, Light Crossbows",sc:true,sa:"CHA",ck:4,skn:2,sl:{1:[2]},ft:{1:["Spellcasting","Sorcerous Origin"]},desc:"A spellcaster with innate magical power."},
  Warlock:{hd:8,pa:"CHA",st:["WIS","CHA"],sk:["Arcana","Deception","History","Intimidation","Investigation","Nature","Religion"],ns:2,ap:"Light",wp:"Simple",sc:true,sa:"CHA",ck:2,skn:2,sl:{1:[1]},ft:{1:["Otherworldly Patron","Pact Magic"]},desc:"Magic gained through an extraplanar pact."},
  Wizard:{hd:6,pa:"INT",st:["INT","WIS"],sk:["Arcana","History","Insight","Investigation","Medicine","Religion"],ns:2,ap:"None",wp:"Daggers, Darts, Slings, Quarterstaffs, Light Crossbows",sc:true,sa:"INT",ck:3,skn:6,sl:{1:[2]},ft:{1:["Spellcasting","Arcane Recovery"]},desc:"A scholarly magic-user commanding arcane power."}
};

const BACKGROUNDS = {
  Acolyte:{sk:["Insight","Religion"],eq:"Holy symbol, prayer book, vestments, 15 gp",feat:"Shelter of the Faithful"},
  Criminal:{sk:["Deception","Stealth"],eq:"Crowbar, dark clothes with hood, 15 gp",feat:"Criminal Contact"},
  "Folk Hero":{sk:["Animal Handling","Survival"],eq:"Artisan's tools, shovel, common clothes, 10 gp",feat:"Rustic Hospitality"},
  Noble:{sk:["History","Persuasion"],eq:"Fine clothes, signet ring, scroll of pedigree, 25 gp",feat:"Position of Privilege"},
  Sage:{sk:["Arcana","History"],eq:"Bottle of ink, quill, small knife, common clothes, 10 gp",feat:"Researcher"},
  Soldier:{sk:["Athletics","Intimidation"],eq:"Insignia of rank, trophy, dice set, common clothes, 10 gp",feat:"Military Rank"},
  Charlatan:{sk:["Deception","Sleight of Hand"],eq:"Fine clothes, disguise kit, 15 gp",feat:"False Identity"},
  Entertainer:{sk:["Acrobatics","Performance"],eq:"Musical instrument, costume, 15 gp",feat:"By Popular Demand"},
  "Guild Artisan":{sk:["Insight","Persuasion"],eq:"Artisan's tools, letter, traveler's clothes, 15 gp",feat:"Guild Membership"},
  Hermit:{sk:["Medicine","Religion"],eq:"Scroll case, winter blanket, herbalism kit, 5 gp",feat:"Discovery"},
  Outlander:{sk:["Athletics","Survival"],eq:"Staff, hunting trap, traveler's clothes, 10 gp",feat:"Wanderer"},
  Urchin:{sk:["Sleight of Hand","Stealth"],eq:"Small knife, map, pet mouse, common clothes, 10 gp",feat:"City Secrets"}
};

const ALIGNMENTS = ["Lawful Good","Neutral Good","Chaotic Good","Lawful Neutral","True Neutral","Chaotic Neutral","Lawful Evil","Neutral Evil","Chaotic Evil"];

const SPELLS = [
  {n:"Fire Bolt",l:0,s:"Evocation",ct:"1 action",rng:"120 ft",dur:"Instantaneous",d:"Ranged spell attack: 1d10 fire damage. Scales at 5th/11th/17th.",cls:["Sorcerer","Wizard"],c:false},
  {n:"Mage Hand",l:0,s:"Conjuration",ct:"1 action",rng:"30 ft",dur:"1 minute",d:"Spectral hand manipulates objects up to 10 lbs.",cls:["Bard","Sorcerer","Warlock","Wizard"],c:false},
  {n:"Light",l:0,s:"Evocation",ct:"1 action",rng:"Touch",dur:"1 hour",d:"Object sheds bright light 20 ft, dim light 20 ft more.",cls:["Bard","Cleric","Sorcerer","Wizard"],c:false},
  {n:"Sacred Flame",l:0,s:"Evocation",ct:"1 action",rng:"60 ft",dur:"Instantaneous",d:"DEX save or 1d8 radiant. No cover benefit. Scales.",cls:["Cleric"],c:false},
  {n:"Eldritch Blast",l:0,s:"Evocation",ct:"1 action",rng:"120 ft",dur:"Instantaneous",d:"Ranged spell attack: 1d10 force. Extra beams at 5th/11th/17th.",cls:["Warlock"],c:false},
  {n:"Prestidigitation",l:0,s:"Transmutation",ct:"1 action",rng:"10 ft",dur:"Up to 1 hour",d:"Minor trick: sensory effect, light/snuff, clean/soil, warm/cool, mark, trinket.",cls:["Bard","Sorcerer","Warlock","Wizard"],c:false},
  {n:"Minor Illusion",l:0,s:"Illusion",ct:"1 action",rng:"30 ft",dur:"1 minute",d:"Sound or image up to 5-ft cube. Investigation check to see through.",cls:["Bard","Sorcerer","Warlock","Wizard"],c:false},
  {n:"Ray of Frost",l:0,s:"Evocation",ct:"1 action",rng:"60 ft",dur:"Instantaneous",d:"Ranged spell attack: 1d8 cold. Speed -10 ft until next turn.",cls:["Sorcerer","Wizard"],c:false},
  {n:"Guidance",l:0,s:"Divination",ct:"1 action",rng:"Touch",dur:"Conc, 1 min",d:"Target adds 1d4 to one ability check.",cls:["Cleric","Druid"],c:true},
  {n:"Thaumaturgy",l:0,s:"Transmutation",ct:"1 action",rng:"30 ft",dur:"Up to 1 min",d:"Minor divine wonder: booming voice, tremors, sounds, etc.",cls:["Cleric"],c:false},
  {n:"Vicious Mockery",l:0,s:"Enchantment",ct:"1 action",rng:"60 ft",dur:"Instantaneous",d:"WIS save or 1d4 psychic + disadvantage on next attack.",cls:["Bard"],c:false},
  {n:"Druidcraft",l:0,s:"Transmutation",ct:"1 action",rng:"30 ft",dur:"Instantaneous",d:"Create tiny nature effect: weather prediction, bloom, sensory.",cls:["Druid"],c:false},
  {n:"Magic Missile",l:1,s:"Evocation",ct:"1 action",rng:"120 ft",dur:"Instantaneous",d:"3 darts, 1d4+1 force each. Always hits. +1 dart per slot above 1st.",cls:["Sorcerer","Wizard"],c:false},
  {n:"Shield",l:1,s:"Abjuration",ct:"1 reaction",rng:"Self",dur:"1 round",d:"+5 AC until next turn, including triggering attack. Blocks Magic Missile.",cls:["Sorcerer","Wizard"],c:false},
  {n:"Cure Wounds",l:1,s:"Evocation",ct:"1 action",rng:"Touch",dur:"Instantaneous",d:"Heal 1d8 + spell mod. +1d8 per slot above 1st.",cls:["Bard","Cleric","Druid","Paladin","Ranger"],c:false},
  {n:"Healing Word",l:1,s:"Evocation",ct:"1 bonus action",rng:"60 ft",dur:"Instantaneous",d:"Heal 1d4 + spell mod. +1d4 per slot above 1st.",cls:["Bard","Cleric","Druid"],c:false},
  {n:"Guiding Bolt",l:1,s:"Evocation",ct:"1 action",rng:"120 ft",dur:"1 round",d:"Ranged spell attack: 4d6 radiant. Next attack against target has advantage.",cls:["Cleric"],c:false},
  {n:"Thunderwave",l:1,s:"Evocation",ct:"1 action",rng:"Self (15-ft cube)",dur:"Instantaneous",d:"CON save: 2d8 thunder (half on save). Pushed 10 ft.",cls:["Bard","Druid","Sorcerer","Wizard"],c:false},
  {n:"Detect Magic",l:1,s:"Divination",ct:"1 action",rng:"Self",dur:"Conc, 10 min",d:"Sense magic within 30 ft. Action to see aura and school.",cls:["Bard","Cleric","Druid","Paladin","Ranger","Sorcerer","Wizard"],c:true},
  {n:"Sleep",l:1,s:"Enchantment",ct:"1 action",rng:"90 ft",dur:"1 minute",d:"5d8 HP of creatures fall asleep, starting lowest HP. +2d8 per slot above 1st.",cls:["Bard","Sorcerer","Wizard"],c:false},
  {n:"Bless",l:1,s:"Enchantment",ct:"1 action",rng:"30 ft",dur:"Conc, 1 min",d:"Up to 3 creatures add 1d4 to attacks and saves.",cls:["Cleric","Paladin"],c:true},
  {n:"Burning Hands",l:1,s:"Evocation",ct:"1 action",rng:"Self (15-ft cone)",dur:"Instantaneous",d:"DEX save: 3d6 fire (half on save). +1d6 per slot above 1st.",cls:["Sorcerer","Wizard"],c:false},
  {n:"Charm Person",l:1,s:"Enchantment",ct:"1 action",rng:"30 ft",dur:"1 hour",d:"WIS save (advantage if fighting). Charmed: regards you as friendly.",cls:["Bard","Druid","Sorcerer","Warlock","Wizard"],c:false},
  {n:"Mage Armor",l:1,s:"Abjuration",ct:"1 action",rng:"Touch",dur:"8 hours",d:"Base AC becomes 13 + DEX. Must not wear armor.",cls:["Sorcerer","Wizard"],c:false},
  {n:"Hex",l:1,s:"Enchantment",ct:"1 bonus action",rng:"90 ft",dur:"Conc, 1 hr",d:"+1d6 necrotic on attacks. Choose ability: target has disadvantage on its checks.",cls:["Warlock"],c:true},
  {n:"Hunter's Mark",l:1,s:"Divination",ct:"1 bonus action",rng:"90 ft",dur:"Conc, 1 hr",d:"+1d6 weapon damage. Advantage on Perception/Survival to find it.",cls:["Ranger"],c:true},
  {n:"Entangle",l:1,s:"Conjuration",ct:"1 action",rng:"90 ft",dur:"Conc, 1 min",d:"20-ft square. STR save or restrained. Difficult terrain.",cls:["Druid"],c:true},
  {n:"Faerie Fire",l:1,s:"Evocation",ct:"1 action",rng:"60 ft",dur:"Conc, 1 min",d:"20-ft cube. DEX save or outlined. Attacks against have advantage. Can't be invisible.",cls:["Bard","Druid"],c:true},
  {n:"Fireball",l:3,s:"Evocation",ct:"1 action",rng:"150 ft",dur:"Instantaneous",d:"20-ft sphere. DEX save: 8d6 fire (half on save). +1d6 per slot above 3rd.",cls:["Sorcerer","Wizard"],c:false},
  {n:"Counterspell",l:3,s:"Abjuration",ct:"1 reaction",rng:"60 ft",dur:"Instantaneous",d:"Interrupt spellcasting. Auto if ≤3rd level. Higher: DC 10+spell level check.",cls:["Sorcerer","Warlock","Wizard"],c:false},
  {n:"Lightning Bolt",l:3,s:"Evocation",ct:"1 action",rng:"Self (100-ft line)",dur:"Instantaneous",d:"5-ft wide 100-ft line. DEX save: 8d6 lightning (half). +1d6 per slot above 3rd.",cls:["Sorcerer","Wizard"],c:false},
  {n:"Revivify",l:3,s:"Necromancy",ct:"1 action",rng:"Touch",dur:"Instantaneous",d:"Dead ≤1 min returns with 1 HP. 300 gp diamond consumed.",cls:["Cleric","Paladin"],c:false},
  {n:"Spirit Guardians",l:3,s:"Conjuration",ct:"1 action",rng:"Self (15-ft radius)",dur:"Conc, 10 min",d:"Spirits protect 15 ft. Enemies: half speed, WIS save or 3d8 radiant/necrotic.",cls:["Cleric"],c:true},
];

const MONSTERS = [
  {n:"Goblin",cr:"1/4",t:"Humanoid",ac:15,hp:7,sp:"30ft",s:8,d:14,co:10,i:10,w:8,ch:8,atk:[{n:"Scimitar",b:4,dm:"1d6+2 slash"},{n:"Shortbow",b:4,dm:"1d6+2 pierce",r:"80/320ft"}],tr:["Nimble Escape"],xp:50},
  {n:"Kobold",cr:"1/8",t:"Humanoid",ac:12,hp:5,sp:"30ft",s:7,d:15,co:9,i:8,w:7,ch:8,atk:[{n:"Dagger",b:4,dm:"1d4+2 pierce"},{n:"Sling",b:4,dm:"1d4+2 bludg",r:"30/120ft"}],tr:["Sunlight Sensitivity","Pack Tactics"],xp:25},
  {n:"Skeleton",cr:"1/4",t:"Undead",ac:13,hp:13,sp:"30ft",s:10,d:14,co:15,i:6,w:8,ch:5,atk:[{n:"Shortsword",b:4,dm:"1d6+2 pierce"},{n:"Shortbow",b:4,dm:"1d6+2 pierce",r:"80/320ft"}],tr:["Vulnerable: bludgeoning","Immune: poison"],xp:50},
  {n:"Zombie",cr:"1/4",t:"Undead",ac:8,hp:22,sp:"20ft",s:13,d:6,co:16,i:3,w:6,ch:5,atk:[{n:"Slam",b:3,dm:"1d6+1 bludg"}],tr:["Undead Fortitude"],xp:50},
  {n:"Wolf",cr:"1/4",t:"Beast",ac:13,hp:11,sp:"40ft",s:12,d:15,co:12,i:3,w:12,ch:6,atk:[{n:"Bite",b:4,dm:"2d4+2 pierce + DC 11 STR or prone"}],tr:["Pack Tactics","Keen Hearing/Smell"],xp:50},
  {n:"Orc",cr:"1/2",t:"Humanoid",ac:13,hp:15,sp:"30ft",s:16,d:12,co:16,i:7,w:11,ch:10,atk:[{n:"Greataxe",b:5,dm:"1d12+3 slash"},{n:"Javelin",b:5,dm:"1d6+3 pierce",r:"30/120ft"}],tr:["Aggressive"],xp:100},
  {n:"Bandit",cr:"1/8",t:"Humanoid",ac:12,hp:11,sp:"30ft",s:11,d:12,co:12,i:10,w:10,ch:10,atk:[{n:"Scimitar",b:3,dm:"1d6+1 slash"},{n:"Lt. Crossbow",b:3,dm:"1d8+1 pierce",r:"80/320ft"}],tr:[],xp:25},
  {n:"Giant Spider",cr:"1",t:"Beast",ac:14,hp:26,sp:"30ft/climb 30ft",s:14,d:16,co:12,i:2,w:11,ch:4,atk:[{n:"Bite",b:5,dm:"1d8+3 pierce + 2d8 poison (DC11 CON half)"},{n:"Web",b:5,dm:"Restrained (DC12 STR)",r:"30/60ft"}],tr:["Spider Climb","Web Sense","Web Walker"],xp:200},
  {n:"Ogre",cr:"2",t:"Giant",ac:11,hp:59,sp:"40ft",s:19,d:8,co:16,i:5,w:7,ch:7,atk:[{n:"Greatclub",b:6,dm:"2d8+4 bludg"},{n:"Javelin",b:6,dm:"2d6+4 pierce",r:"30/120ft"}],tr:[],xp:450},
  {n:"Owlbear",cr:"3",t:"Monstrosity",ac:13,hp:59,sp:"40ft",s:20,d:12,co:17,i:3,w:12,ch:7,atk:[{n:"Beak",b:7,dm:"1d10+5 pierce"},{n:"Claws",b:7,dm:"2d8+5 slash"}],tr:["Multiattack","Keen Sight/Smell"],xp:700},
  {n:"Troll",cr:"5",t:"Giant",ac:15,hp:84,sp:"30ft",s:18,d:13,co:20,i:7,w:9,ch:7,atk:[{n:"Bite",b:7,dm:"1d6+4 pierce"},{n:"Claw (x2)",b:7,dm:"2d6+4 slash"}],tr:["Multiattack","Regeneration 10HP (fire/acid stops)","Keen Smell"],xp:1800},
  {n:"Young Red Dragon",cr:"10",t:"Dragon",ac:18,hp:178,sp:"40ft/fly 80ft",s:23,d:10,co:21,i:14,w:11,ch:19,atk:[{n:"Bite",b:10,dm:"2d10+6 pierce + 1d6 fire"},{n:"Claw",b:10,dm:"2d6+6 slash"}],tr:["Multiattack","Fire Breath (DC17 DEX, 16d6 fire, recharge 5-6)","Immune: fire"],xp:5900},
  {n:"Adult Red Dragon",cr:"17",t:"Dragon",ac:19,hp:256,sp:"40ft/fly 80ft",s:27,d:10,co:25,i:16,w:13,ch:21,atk:[{n:"Bite",b:14,dm:"2d10+8+2d6 fire"},{n:"Claw",b:14,dm:"2d6+8 slash"},{n:"Tail",b:14,dm:"2d8+8 bludg"}],tr:["Multiattack","Frightful Presence (DC19)","Fire Breath (DC21, 18d6)","3 Legendary Actions"],xp:18000},
  {n:"Lich",cr:"21",t:"Undead",ac:17,hp:135,sp:"30ft",s:11,d:16,co:16,i:20,w:14,ch:16,atk:[{n:"Paralyzing Touch",b:12,dm:"3d6 cold + DC18 CON or paralyzed"}],tr:["Legendary Resistance (3/day)","Rejuvenation","18th-level Spellcaster","3 Legendary Actions","Turn Resistance"],xp:33000}
];

const ITEMS = [
  {n:"Longsword",t:"Weapon",c:"15 gp",w:3,dm:"1d8 slash (versatile 1d10)",p:"Versatile"},
  {n:"Shortsword",t:"Weapon",c:"10 gp",w:2,dm:"1d6 pierce",p:"Finesse, Light"},
  {n:"Greataxe",t:"Weapon",c:"30 gp",w:7,dm:"1d12 slash",p:"Heavy, Two-Handed"},
  {n:"Greatsword",t:"Weapon",c:"50 gp",w:6,dm:"2d6 slash",p:"Heavy, Two-Handed"},
  {n:"Rapier",t:"Weapon",c:"25 gp",w:2,dm:"1d8 pierce",p:"Finesse"},
  {n:"Dagger",t:"Weapon",c:"2 gp",w:1,dm:"1d4 pierce",p:"Finesse, Light, Thrown 20/60"},
  {n:"Longbow",t:"Weapon",c:"50 gp",w:2,dm:"1d8 pierce",p:"Ammo 150/600, Heavy, Two-Handed"},
  {n:"Light Crossbow",t:"Weapon",c:"25 gp",w:5,dm:"1d8 pierce",p:"Ammo 80/320, Loading, Two-Handed"},
  {n:"Quarterstaff",t:"Weapon",c:"2 sp",w:4,dm:"1d6 bludg (versatile 1d8)",p:"Versatile"},
  {n:"Chain Mail",t:"Armor",c:"75 gp",w:55,ac:16,p:"Heavy, Stealth Disadv, STR 13"},
  {n:"Leather Armor",t:"Armor",c:"10 gp",w:10,ac:"11+DEX",p:"Light"},
  {n:"Studded Leather",t:"Armor",c:"45 gp",w:13,ac:"12+DEX",p:"Light"},
  {n:"Scale Mail",t:"Armor",c:"50 gp",w:45,ac:"14+DEX(max 2)",p:"Medium, Stealth Disadv"},
  {n:"Half Plate",t:"Armor",c:"750 gp",w:40,ac:"15+DEX(max 2)",p:"Medium, Stealth Disadv"},
  {n:"Plate",t:"Armor",c:"1,500 gp",w:65,ac:18,p:"Heavy, Stealth Disadv, STR 15"},
  {n:"Shield",t:"Armor",c:"10 gp",w:6,ac:"+2"},
  {n:"Healing Potion",t:"Potion",c:"50 gp",w:0.5,d:"Heal 2d4+2 HP"},
  {n:"Bag of Holding",t:"Wondrous",c:"-",w:15,d:"Interior 500 lbs / 64 cu ft. Always weighs 15 lbs.",r:"Uncommon"},
  {n:"+1 Longsword",t:"Magic Weapon",c:"-",w:3,dm:"1d8+1 slash",d:"+1 to attack and damage.",r:"Uncommon"},
  {n:"Cloak of Protection",t:"Wondrous",c:"-",w:1,d:"+1 AC and saves. Requires attunement.",r:"Uncommon",att:true},
];

const CAMPAIGNS = [
  {n:"Lost Mine of Phandelver",lv:"1-5",d:"Classic starter adventure. Explore the Sword Coast, investigate a missing dwarven mine, face the Black Spider.",h:"You were hired by Gundren Rockseeker to escort a wagon of supplies to Phandalin. But Gundren and his bodyguard have gone missing...",
    scenes:[
      {t:"The Road to Phandalin",map:{t:"road",r:[{x:0,y:6,w:30,h:6}],c:[],f:[{x:3,y:8,t:"🐴",l:"Dead Horse"},{x:5,y:8,t:"🐴",l:"Dead Horse"},{x:4,y:6,t:"📦",l:"Looted Wagon"},{x:12,y:4,t:"🌲"},{x:13,y:3,t:"🌲"},{x:14,y:5,t:"🌲"},{x:11,y:3,t:"🌲"},{x:15,y:3,t:"🌲"},{x:16,y:4,t:"🌲"},{x:12,y:10,t:"🌲"},{x:14,y:11,t:"🌲"},{x:13,y:12,t:"🌲"},{x:11,y:11,t:"🌲"},{x:8,y:3,t:"🌲"},{x:9,y:4,t:"🌲"},{x:7,y:2,t:"🌲"},{x:18,y:4,t:"🌲"},{x:19,y:3,t:"🌲"},{x:20,y:5,t:"🌲"},{x:8,y:11,t:"🌲"},{x:9,y:12,t:"🌲"},{x:7,y:10,t:"🌲"},{x:18,y:11,t:"🌲"},{x:19,y:12,t:"🌲"},{x:20,y:10,t:"🌲"}],pc:{x:1,y:8},mn:{x:14,y:7},nm:"Triboar Trail"},narr:"You have been traveling south along the High Road from Neverwinter for about half a day when you come upon a pair of dead horses sprawled across the path. Black-feathered arrows pepper their sides. The saddlebags have been looted, and nearby lies an empty leather map case. A trail of broken twigs and disturbed leaves leads into the thick woods to the north.",
        choices:["Investigate the dead horses","Follow the trail into the woods","Continue past to Phandalin","Search the surrounding area"],
        encounter:{monsters:["Goblin","Goblin","Goblin","Goblin"],trigger:"trail"},
        notes:"Goblin Ambush. 4 goblins hide in the woods. DC 10 Perception to spot them before they attack."},
      {t:"Goblin Trail",map:{t:"cave",r:[{x:1,y:6,w:4,h:4},{x:8,y:4,w:6,h:6},{x:18,y:3,w:6,h:8},{x:20,y:12,w:4,h:4}],c:[[5,8,8,8],[14,7,18,7],[22,11,22,12]],f:[{x:2,y:10,t:"💧",l:"Stream"},{x:3,y:10,t:"💧"},{x:9,y:10,t:"💧"},{x:10,y:10,t:"💧"},{x:6,y:8,t:"⚠️",l:"Snare Trap"},{x:19,y:5,t:"🔥",l:"Campfire"},{x:21,y:13,t:"⛓️",l:"Sildar (prisoner)"}],pc:{x:1,y:8},mn:{x:10,y:6},nm:"Cragmaw Hideout Entrance"},narr:"The trail leads through dense, dark forest. After about 15 minutes of walking, you spot a small cave entrance partially hidden by a thicket. A shallow stream flows from the cave mouth. Goblin tracks are everywhere in the mud.",
        choices:["Enter the cave carefully","Set up an ambush outside","Scout around the cave","Send a scout ahead stealthily"],
        encounter:{monsters:["Goblin","Goblin","Goblin","Wolf","Wolf"],trigger:"cave"},
        notes:"Cragmaw Hideout. Traps: snare at entrance (DC 12 Perception), flood trap in stream passage."},
      {t:"Cragmaw Hideout",map:{t:"cave",r:[{x:1,y:1,w:5,h:5},{x:9,y:1,w:7,h:4},{x:1,y:8,w:6,h:5},{x:10,y:7,w:6,h:6},{x:19,y:2,w:5,h:5},{x:19,y:9,w:5,h:5}],c:[[6,3,9,3],[6,10,10,10],[16,4,19,4],[16,10,19,10]],f:[{x:3,y:2,t:"💧",l:"Pool"},{x:11,y:2,t:"📦",l:"Supplies"},{x:20,y:4,t:"👑",l:"Klarg (Bugbear)"},{x:2,y:10,t:"⛓️",l:"Sildar"},{x:21,y:11,t:"🔥",l:"Fire Pit"},{x:12,y:9,t:"🪨",l:"Stalagmite"},{x:14,y:8,t:"🪨"}],pc:{x:1,y:3},mn:{x:20,y:3},nm:"Cragmaw Hideout Interior"},narr:"Inside the cave, the stream runs along a low-ceilinged passage. You hear goblin voices echoing from deeper within. In a side chamber, you find Sildar Hallwinter — Gundren's bodyguard — bound and beaten but alive. He gasps: 'They took Gundren to Cragmaw Castle... a place called Wave Echo Cave... the Black Spider wants it...'",
        choices:["Free Sildar and press deeper","Free Sildar and retreat to Phandalin","Interrogate the goblins","Search for loot before moving on"],
        notes:"Sildar has 1 HP. Healing him earns his gratitude and info about Cragmaw Castle."},
      {t:"Arrival in Phandalin",map:{t:"town",r:[{x:1,y:1,w:6,h:4},{x:9,y:1,w:5,h:4},{x:16,y:1,w:6,h:4},{x:1,y:8,w:5,h:4},{x:8,y:7,w:7,h:5},{x:18,y:8,w:5,h:4},{x:3,y:14,w:5,h:3},{x:11,y:14,w:6,h:3},{x:20,y:14,w:3,h:3}],c:[[7,3,9,3],[14,3,16,3],[5,5,5,8],[15,9,18,9],[6,12,8,12],[15,12,18,12],[8,15,11,15],[17,15,20,15]],f:[{x:3,y:2,t:"🏠",l:"Stonehill Inn"},{x:11,y:2,t:"⛪",l:"Shrine of Luck"},{x:18,y:2,t:"🏪",l:"Lionshield Coster"},{x:3,y:9,t:"🏚️",l:"Sleeping Giant"},{x:11,y:9,t:"🏛️",l:"Townmaster Hall"},{x:19,y:9,t:"⛏️",l:"Miner Exchange"},{x:5,y:15,t:"🏚️",l:"Tresendar Manor"},{x:13,y:15,t:"🏠",l:"Edermath Orchard"},{x:21,y:15,t:"🛒",l:"Barthen Provisions"}],pc:{x:7,y:5},mn:{x:3,y:9},nm:"Town of Phandalin"},narr:"Phandalin is a frontier town of simple stone buildings and wooden storefronts. The townsfolk eye you warily — they've been terrorized by a gang of ruffians called the Redbrands, led by a mysterious figure called Glasstaff. Sister Garaele at the shrine, Linene at the Lionshield Coster, and Toblen at the Stonehill Inn all have problems that need solving.",
        choices:["Visit the Stonehill Inn for rumors","Confront the Redbrands at the Sleeping Giant","Speak with Sister Garaele","Explore the Tresendar Manor ruins"],
        notes:"Multiple quest hooks here. Let players explore freely. Redbrands patrol the town."},
      {t:"Tresendar Manor - Redbrand Hideout",map:{t:"dungeon",r:[{x:1,y:1,w:5,h:4},{x:8,y:1,w:5,h:4},{x:16,y:1,w:7,h:5},{x:1,y:7,w:6,h:5},{x:10,y:7,w:5,h:4},{x:18,y:8,w:5,h:5},{x:2,y:14,w:7,h:3},{x:12,y:13,w:5,h:4},{x:20,y:14,w:3,h:3}],c:[[6,3,8,3],[13,3,16,3],[5,5,5,7],[13,5,13,7],[15,9,18,9],[7,9,10,9],[7,12,7,14],[17,15,20,15]],f:[{x:2,y:2,t:"📦",l:"Storage"},{x:10,y:2,t:"⚗️",l:"Lab"},{x:18,y:3,t:"🧙",l:"Glasstaff Office"},{x:3,y:9,t:"⛓️",l:"Prison Cells"},{x:11,y:8,t:"⚔️",l:"Armory"},{x:20,y:10,t:"👁️",l:"Secret Room"},{x:4,y:15,t:"🪦",l:"Crypt"},{x:14,y:14,t:"🕳️",l:"Crevasse"},{x:21,y:15,t:"📜",l:"Maps"}],pc:{x:1,y:3},mn:{x:18,y:3},nm:"Redbrand Hideout"},narr:"Beneath the ruins of Tresendar Manor lies a hidden dungeon. The Redbrands use it as their base. A secret entrance leads into cellars where you hear rough laughter and the clink of dice. The air smells of stale ale and unwashed brigands.",
        choices:["Storm the front entrance","Use the secret tunnel","Try to bluff your way in","Scout and plan a strategy"],
        encounter:{monsters:["Bandit","Bandit","Bandit","Bandit"],trigger:"enter"},
        notes:"Glasstaff is Iarno Albrek, a wizard. He has Gundren's map to Wave Echo Cave."},
      {t:"Cragmaw Castle",map:{t:"castle",r:[{x:2,y:1,w:8,h:5},{x:13,y:1,w:9,h:5},{x:1,y:8,w:6,h:5},{x:9,y:7,w:6,h:6},{x:18,y:7,w:5,h:6},{x:4,y:15,w:7,h:3},{x:14,y:14,w:8,h:4}],c:[[10,3,13,3],[6,5,6,8],[15,5,15,7],[14,10,18,10],[7,13,9,13],[11,13,14,16]],f:[{x:5,y:3,t:"🚪",l:"Main Gate"},{x:15,y:3,t:"🏰",l:"Tower"},{x:20,y:3,t:"🏰",l:"Tower"},{x:3,y:10,t:"🛏️",l:"Barracks"},{x:11,y:9,t:"👑",l:"King Grol"},{x:19,y:9,t:"⛓️",l:"Gundren"},{x:7,y:16,t:"🍖",l:"Kitchen"},{x:17,y:16,t:"🏚️",l:"Collapsed Section"},{x:22,y:3,t:"🪨",l:"Rubble"}],pc:{x:5,y:5},mn:{x:11,y:9},nm:"Cragmaw Castle"},narr:"After days of travel through the wilderness, you reach Cragmaw Castle — a crumbling ruin occupied by a tribe of goblins and their bugbear king, King Grol. Gundren Rockseeker is held somewhere inside. The castle has multiple entry points: a collapsed wall to the south, a main gate, and arrow slits in the towers.",
        choices:["Assault the main gate","Sneak through the collapsed wall","Climb to the arrow slits","Try to negotiate with the goblins"],
        encounter:{monsters:["Goblin","Goblin","Goblin","Goblin","Orc","Orc"],trigger:"enter"},
        notes:"King Grol has Gundren and the map. Doppelganger disguised as a female drow is here."},
      {t:"Wave Echo Cave",map:{t:"cave",r:[{x:1,y:1,w:5,h:4},{x:8,y:1,w:7,h:5},{x:18,y:1,w:5,h:4},{x:1,y:7,w:4,h:5},{x:7,y:8,w:6,h:4},{x:16,y:7,w:7,h:6},{x:2,y:14,w:6,h:3},{x:10,y:13,w:5,h:4},{x:18,y:14,w:5,h:3}],c:[[6,3,8,3],[15,3,18,3],[4,5,4,7],[13,10,16,10],[5,12,7,12],[8,15,10,15],[15,15,18,15]],f:[{x:3,y:2,t:"💧",l:"Underground Pool"},{x:10,y:3,t:"⛏️",l:"Mine Shaft"},{x:20,y:2,t:"💀",l:"Skeleton"},{x:2,y:9,t:"💀"},{x:9,y:9,t:"🔥",l:"Forge of Spells"},{x:18,y:9,t:"🕸️",l:"Web-filled"},{x:4,y:15,t:"💎",l:"Ore Vein"},{x:12,y:14,t:"⚗️",l:"Old Workshop"},{x:20,y:15,t:"🌊",l:"Echo Chamber"}],pc:{x:1,y:3},mn:{x:18,y:9},nm:"Wave Echo Cave"},narr:"The entrance to Wave Echo Cave is a narrow tunnel that opens into vast natural caverns. The rhythmic boom of waves crashing against subterranean rocks echoes through the darkness. Ancient dwarven and gnomish mining equipment lies scattered about. Somewhere in these depths, the Black Spider seeks the legendary Forge of Spells.",
        choices:["Follow the main passage","Explore the northern tunnels","Head toward the booming sounds","Proceed stealthily and scout ahead"],
        encounter:{monsters:["Skeleton","Skeleton","Skeleton","Zombie","Zombie"],trigger:"explore"},
        notes:"Final dungeon. Multiple encounters. Black Spider (drow mage) is in the Temple of Dumathoin."},
      {t:"The Black Spider",map:{t:"dungeon",r:[{x:5,y:1,w:14,h:6},{x:1,y:9,w:7,h:5},{x:10,y:8,w:8,h:6},{x:20,y:9,w:3,h:5}],c:[[8,7,12,8],[7,11,10,11],[18,11,20,11]],f:[{x:10,y:3,t:"🔥",l:"Forge of Spells"},{x:12,y:3,t:"🔥"},{x:14,y:3,t:"⚗️",l:"Brazier"},{x:8,y:2,t:"🪨",l:"Pillar"},{x:16,y:2,t:"🪨",l:"Pillar"},{x:8,y:5,t:"🪨"},{x:16,y:5,t:"🪨"},{x:3,y:11,t:"💀",l:"Bones"},{x:5,y:10,t:"🕸️",l:"Webs"},{x:13,y:10,t:"🕷️",l:"Spider Nest"},{x:15,y:11,t:"🕷️"},{x:21,y:11,t:"📜",l:"Nezznar Papers"}],pc:{x:5,y:4},mn:{x:14,y:10},nm:"Temple of Dumathoin"},narr:"In the heart of the cave, you find the Temple of Dumathoin — and the Black Spider himself, a drow named Nezznar. He stands before the legendary Forge of Spells, a magical brazier of green flame. 'You are too late,' he hisses. 'The power of the Phandelver Pact will be mine!' His giant spider companions skitter forward from the shadows.",
        choices:["Attack immediately","Try to negotiate or deceive","Attempt to disable the Forge","Split up to flank"],
        encounter:{monsters:["Giant Spider","Giant Spider"],trigger:"always"},
        notes:"Nezznar: AC 15, HP 27, drow mage stat block. Victory completes the campaign!"}
    ]
  },
  {n:"Curse of Strahd",lv:"1-10",d:"Gothic horror in Barovia. Face vampire lord Strahd von Zarovich in his haunted castle.",h:"Mysterious mists surround you, pulling you into a dark land ruled by an ancient vampire...",
    scenes:[
      {t:"Death House",map:{t:"dungeon",r:[{x:1,y:1,w:6,h:4},{x:9,y:1,w:6,h:4},{x:17,y:1,w:6,h:4},{x:1,y:7,w:5,h:5},{x:8,y:7,w:7,h:6},{x:18,y:7,w:5,h:6},{x:3,y:14,w:8,h:3},{x:14,y:14,w:8,h:3}],c:[[7,3,9,3],[15,3,17,3],[5,5,5,7],[15,5,15,7],[6,10,8,10],[15,10,18,10],[8,13,8,14],[18,13,18,14]],f:[{x:3,y:2,t:"🚪",l:"Entrance"},{x:11,y:2,t:"🖼️",l:"Portrait Gallery"},{x:19,y:2,t:"🎹",l:"Music Room"},{x:3,y:9,t:"📚",l:"Library"},{x:11,y:10,t:"🪦",l:"Altar"},{x:20,y:9,t:"⛓️",l:"Dungeon"},{x:6,y:15,t:"💀",l:"Crypt"},{x:17,y:15,t:"👹",l:"Shambling Mound"}],pc:{x:3,y:2},mn:{x:11,y:10},nm:"Death House"},narr:"The mists part to reveal a village of dark, leaning buildings. Two small children stand in the street — Rose and Thorn Durst. 'Please,' Rose says, 'there's a monster in our basement. Our parents are trapped!' The Durst Manor looms behind them, its windows like hollow eyes.",
        choices:["Enter Durst Manor with the children","Investigate the village first","Refuse and look for another way","Check if the children are trustworthy"],
        notes:"Death House is a trap. The children are ghosts. The house is a mimic-like deathtrap dungeon."},
      {t:"Village of Barovia",map:{t:"town",r:[{x:2,y:1,w:5,h:4},{x:9,y:1,w:7,h:4},{x:19,y:1,w:4,h:4},{x:1,y:7,w:6,h:4},{x:10,y:7,w:5,h:5},{x:18,y:8,w:5,h:4},{x:3,y:13,w:6,h:4},{x:12,y:14,w:6,h:3},{x:20,y:13,w:3,h:4}],c:[[7,3,9,3],[16,3,19,3],[5,5,5,7],[15,9,18,9],[7,11,10,11],[9,13,12,14],[18,15,20,15]],f:[{x:4,y:2,t:"🏠",l:"Blood of the Vine"},{x:12,y:2,t:"🏚️",l:"Burgomaster Manor"},{x:20,y:2,t:"⛪",l:"Church"},{x:3,y:9,t:"🏠",l:"Mad Mary House"},{x:12,y:9,t:"🪦",l:"Cemetery"},{x:19,y:9,t:"🏚️",l:"Abandoned Shop"},{x:5,y:15,t:"🌫️",l:"Misty Gate"},{x:14,y:15,t:"🛒",l:"Market"},{x:21,y:15,t:"🏚️",l:"Ruin"}],pc:{x:7,y:3},mn:{x:12,y:2},nm:"Village of Barovia"},narr:"The village is a place of despair. A constant fog hangs over everything. You hear weeping from a townhouse — Mad Mary mourns her daughter Ireena's plight. At the Blood of the Vine tavern, Ismark the Lesser tells you his sister Ireena Kolyana has been bitten twice by the vampire Strahd. He begs you to escort her to safety in Vallaki.",
        choices:["Agree to help Ireena","Visit the Burgomaster's mansion","Go to the church to find the priest","Investigate the village for supplies"],
        notes:"Ireena Kolyana is the reincarnation of Tatyana, Strahd's obsession."},
      {t:"Castle Ravenloft - The Invitation",map:{t:"road",r:[{x:0,y:5,w:24,h:8}],c:[],f:[{x:2,y:8,t:"🌲"},{x:3,y:6,t:"🌲"},{x:4,y:10,t:"🌲"},{x:5,y:5,t:"🌲"},{x:6,y:11,t:"🌲"},{x:8,y:6,t:"🌲"},{x:9,y:11,t:"🌲"},{x:10,y:5,t:"🌲"},{x:14,y:6,t:"🌲"},{x:15,y:11,t:"🌲"},{x:16,y:5,t:"🌲"},{x:18,y:11,t:"🌲"},{x:19,y:6,t:"🌲"},{x:20,y:5,t:"🌲"},{x:21,y:10,t:"🌲"},{x:11,y:8,t:"🐺",l:"Wolf"},{x:12,y:9,t:"🐺"},{x:13,y:7,t:"🐺"},{x:14,y:9,t:"🐺"},{x:22,y:8,t:"🏰",l:"Castle Gate"}],pc:{x:2,y:8},mn:{x:12,y:8},nm:"Road to Castle Ravenloft"},narr:"A black carriage arrives unbidden. Inside is a letter sealed with a wax bat: 'I, Strahd von Zarovich, invite you to dine at my castle. Come. I insist.' The horses snort impatiently. In the distance, lightning illuminates the towering spires of Castle Ravenloft.",
        choices:["Accept and ride to the castle","Refuse and continue to Vallaki","Attempt to ambush the carriage","Send a decoy while the party flanks"],
        encounter:{monsters:["Wolf","Wolf","Wolf","Wolf"],trigger:"refuse"},
        notes:"Strahd is toying with the party. He cannot be defeated yet without the Sunsword and Holy Symbol."},
      {t:"Vallaki - Town of Festivals",map:{t:"town",r:[{x:1,y:1,w:7,h:4},{x:10,y:1,w:7,h:4},{x:19,y:1,w:4,h:4},{x:1,y:7,w:5,h:5},{x:8,y:7,w:7,h:5},{x:17,y:7,w:6,h:5},{x:2,y:14,w:6,h:3},{x:10,y:14,w:5,h:3},{x:18,y:14,w:5,h:3}],c:[[8,3,10,3],[17,3,19,3],[5,5,5,7],[15,9,17,9],[6,12,8,12],[13,12,15,12],[8,15,10,15],[15,15,18,15]],f:[{x:3,y:2,t:"🏠",l:"Blue Water Inn"},{x:13,y:2,t:"⛪",l:"St. Andral Church"},{x:20,y:2,t:"🏰",l:"Baron Estate"},{x:3,y:9,t:"🎪",l:"Festival Ground"},{x:11,y:9,t:"🏪",l:"Coffin Maker"},{x:19,y:9,t:"🏚️",l:"Wachterhaus"},{x:4,y:15,t:"🏕️",l:"Vistani Camp"},{x:12,y:15,t:"🛒",l:"Stockyard"},{x:20,y:15,t:"🚪",l:"Town Gate"}],pc:{x:20,y:15},mn:{x:13,y:2},nm:"Vallaki"},narr:"Vallaki is larger than Barovia, but no less oppressed. Baron Vallakovich rules with forced merriment — mandatory weekly festivals 'for the happiness of the people.' The innkeeper Urwin Martikov whispers of a resistance, the wereravens of the Keepers of the Feather. Dark secrets lurk behind every door.",
        choices:["Attend the Baron's festival","Contact the Keepers of the Feather","Visit the Vistani camp outside town","Investigate St. Andral's Church"],
        notes:"Multiple factions in play. Strahd's spies are everywhere."},
      {t:"The Amber Temple",map:{t:"dungeon",r:[{x:2,y:1,w:8,h:5},{x:13,y:1,w:9,h:5},{x:1,y:8,w:6,h:5},{x:9,y:8,w:6,h:5},{x:18,y:7,w:5,h:6},{x:3,y:15,w:7,h:3},{x:13,y:14,w:9,h:4}],c:[[10,3,13,3],[5,6,5,8],[14,6,14,8],[15,10,18,10],[7,13,9,13],[10,15,13,15]],f:[{x:5,y:3,t:"🟧",l:"Amber Sarcophagus"},{x:7,y:3,t:"🟧",l:"Amber Sarcophagus"},{x:16,y:3,t:"🟧",l:"Amber Sarcophagus"},{x:19,y:3,t:"🟧",l:"Amber Sarcophagus"},{x:3,y:10,t:"💀",l:"Undead Guards"},{x:11,y:10,t:"🔥",l:"Dark Flame"},{x:20,y:10,t:"📚",l:"Forbidden Library"},{x:6,y:16,t:"⚗️",l:"Ritual Chamber"},{x:17,y:16,t:"👁️",l:"Vestige Chamber"}],pc:{x:6,y:1},mn:{x:11,y:10},nm:"Amber Temple"},narr:"High in the mountains, the ancient Amber Temple holds dark vestiges — imprisoned evil entities that offer dark gifts in exchange for corruption. The temple is guarded by deadly traps and undead. Within its amber sarcophagi lie the secrets of Strahd's power... and perhaps the key to his destruction.",
        choices:["Explore cautiously room by room","Seek the secret of Strahd's pact","Accept a dark gift for power","Destroy the amber sarcophagi"],
        encounter:{monsters:["Skeleton","Skeleton","Skeleton","Skeleton","Skeleton","Skeleton"],trigger:"explore"},
        notes:"Dark gifts offer power at a terrible cost. Key location for endgame."},
      {t:"Castle Ravenloft - Final Confrontation",map:{t:"castle",r:[{x:3,y:1,w:10,h:5},{x:16,y:1,w:7,h:5},{x:1,y:8,w:7,h:5},{x:10,y:7,w:7,h:6},{x:20,y:8,w:3,h:5},{x:5,y:15,w:14,h:3}],c:[[8,6,10,7],[13,4,16,4],[7,13,10,13],[17,10,20,10],[12,13,12,15]],f:[{x:6,y:3,t:"🪨",l:"Pillar"},{x:10,y:3,t:"🪨",l:"Pillar"},{x:8,y:2,t:"👑",l:"Strahd Throne"},{x:18,y:3,t:"⚰️",l:"Coffin"},{x:20,y:3,t:"🩸",l:"Blood Pool"},{x:3,y:10,t:"🪟",l:"Stained Glass"},{x:13,y:10,t:"⚔️",l:"Armory"},{x:21,y:10,t:"🔑",l:"Treasury"},{x:10,y:16,t:"🔥",l:"Grand Fireplace"},{x:14,y:16,t:"🎹",l:"Pipe Organ"}],pc:{x:5,y:15},mn:{x:8,y:2},nm:"Castle Ravenloft Throne Room"},narr:"Armed with artifacts and knowledge, you return to Castle Ravenloft for the final battle. The castle is a maze of gothic horror — crypts, torture chambers, and Strahd's own throne room. Somewhere in these halls, the vampire lord waits, supremely confident in his domain.",
        choices:["Storm the main gates","Enter through the crypts below","Scale the walls to the tower","Use the secret passage from the catacombs"],
        encounter:{monsters:["Wolf","Wolf","Zombie","Zombie","Skeleton","Skeleton"],trigger:"enter"},
        notes:"Strahd: AC 16, HP 144. He fights tactically, retreating through walls. Use Sunsword + Holy Symbol."}
    ]
  },
  {n:"Storm King's Thunder",lv:"1-11",d:"Giants threaten civilization. Travel the Sword Coast to uncover why the ordning has shattered.",h:"Giants have emerged from their strongholds to threaten civilization as never before...",scenes:[
    {t:"Attack on Nightstone",map:{t:"town",r:[{x:2,y:1,w:5,h:4},{x:9,y:1,w:6,h:5},{x:18,y:1,w:5,h:4},{x:1,y:8,w:6,h:4},{x:9,y:8,w:5,h:4},{x:17,y:7,w:6,h:5},{x:3,y:14,w:7,h:3},{x:13,y:14,w:5,h:3}],c:[[7,3,9,3],[15,3,18,3],[5,5,5,8],[14,9,17,9],[7,12,9,12],[10,14,13,14]],f:[{x:4,y:2,t:"🏠",l:"Inn"},{x:12,y:3,t:"🏛️",l:"Temple"},{x:19,y:2,t:"🏚️",l:"Ruined House"},{x:3,y:9,t:"🪨",l:"Boulder"},{x:11,y:9,t:"🪨",l:"Boulder"},{x:19,y:9,t:"🏪",l:"Trading Post"},{x:6,y:15,t:"🕳️",l:"Empty Obelisk Pit"},{x:15,y:15,t:"🚪",l:"Gate"}],pc:{x:15,y:15},mn:{x:4,y:9},nm:"Nightstone Village"},narr:"You arrive at the settlement of Nightstone to find it under attack! Giant boulders have smashed through rooftops, and the town's namesake — a mysterious black obelisk — has been stolen. Goblins and worgs now loot the abandoned buildings. Villagers cower in nearby caves.",choices:["Drive out the goblins","Search for survivors","Investigate the stolen obelisk","Fortify the town's defenses"],encounter:{monsters:["Goblin","Goblin","Goblin","Goblin","Wolf","Wolf"],trigger:"goblins"},notes:"Cloud giants stole the Nightstone. Goblins arrived after."},
    {t:"The Ordning is Broken",map:{t:"road",r:[{x:0,y:5,w:24,h:8}],c:[],f:[{x:3,y:7,t:"🏔️",l:"Mountains"},{x:6,y:6,t:"🏔️"},{x:8,y:8,t:"🌲"},{x:10,y:6,t:"🌲"},{x:12,y:7,t:"🏰",l:"Giant Ruins"},{x:15,y:9,t:"🪨"},{x:18,y:6,t:"🌲"},{x:20,y:8,t:"🏔️"},{x:22,y:7,t:"⚡",l:"Storm"}],pc:{x:2,y:8},mn:{x:12,y:7},nm:"Sword Coast Road"},narr:"You learn that the ancient hierarchy of giants — the ordning — has been shattered by the god Annam. Now all giant-kind competes for supremacy, terrorizing the small folk. Hill giants raid farms. Frost giants plunder ships. Fire giants forge weapons of war. Stone giants emerge from their caves in confusion. Only by finding the Storm King's missing daughter can order be restored.",choices:["Seek out the hill giant stronghold","Investigate frost giant raids","Travel to the fire giant forge","Look for allies among civilized folk"],notes:"Players choose which giant threat to pursue. Multiple paths."},
    {t:"Eye of the All-Father",map:{t:"cave",r:[{x:2,y:1,w:8,h:6},{x:14,y:2,w:8,h:5},{x:1,y:9,w:6,h:5},{x:9,y:9,w:6,h:5},{x:18,y:9,w:5,h:6}],c:[[10,4,14,4],[5,7,5,9],[15,11,18,11],[7,12,9,12]],f:[{x:6,y:3,t:"👁️",l:"The Eye"},{x:8,y:4,t:"🪨",l:"Giant Throne"},{x:17,y:4,t:"❄️",l:"Ice Wall"},{x:3,y:11,t:"🪨",l:"Rune Stone"},{x:12,y:11,t:"🔥",l:"Sacred Fire"},{x:20,y:12,t:"💀",l:"Guardian"}],pc:{x:2,y:4},mn:{x:20,y:12},nm:"Temple of the All-Father"},narr:"The ancient oracle temple of Annam lies in the frozen Spine of the World mountains. Inside, a massive crystal ball called the Eye of the All-Father can reveal the location of Hekaton — the missing Storm King. But the temple is not unguarded, and the journey through the frozen wastes is perilous.",choices:["Brave the mountain pass","Seek a guide from the Uthgardt tribes","Fly if you have airship access","Tunnel through the Underdark"],encounter:{monsters:["Wolf","Wolf","Orc","Orc"],trigger:"mountain"},notes:"Key turning point. The oracle reveals Hekaton is imprisoned."},
    {t:"Maelstrom - Court of the Storm Giants",map:{t:"castle",r:[{x:3,y:1,w:10,h:5},{x:16,y:1,w:7,h:5},{x:1,y:8,w:7,h:5},{x:10,y:8,w:6,h:5},{x:19,y:8,w:4,h:5},{x:5,y:15,w:14,h:3}],c:[[8,6,12,8],[13,4,16,4],[7,13,10,13],[16,10,19,10],[12,13,12,15]],f:[{x:8,y:3,t:"👑",l:"Serissa Throne"},{x:18,y:3,t:"⚡",l:"Storm Orb"},{x:3,y:10,t:"🌊",l:"Tide Pool"},{x:13,y:10,t:"⚔️",l:"War Room"},{x:20,y:10,t:"📜",l:"Archives"},{x:10,y:16,t:"🚪",l:"Great Gate"}],pc:{x:10,y:16},mn:{x:8,y:3},nm:"Maelstrom Throne Hall"},narr:"Beneath the Trackless Sea lies Maelstrom, the undersea citadel of the storm giants. Princess Serissa rules in her father's absence, but her advisors plot treachery. You must navigate storm giant politics, prove your worth, and discover who kidnapped King Hekaton before civil war tears the ordning apart forever.",choices:["Present evidence to Serissa","Investigate the treacherous advisors","Challenge the conspirators directly","Seek Hekaton's prison location"],notes:"Political intrigue. Multiple NPCs with agendas. Final act begins here."}
  ]},
  {n:"Tomb of Annihilation",lv:"1-11",d:"Death curse plagues the world. Journey into the jungles of Chult.",h:"A death curse has befallen the land — those raised from the dead are wasting away...",scenes:[
    {t:"Port Nyanzaru",map:{t:"town",r:[{x:1,y:1,w:7,h:4},{x:10,y:1,w:7,h:4},{x:19,y:1,w:4,h:4},{x:1,y:7,w:5,h:5},{x:8,y:7,w:7,h:5},{x:18,y:7,w:5,h:5},{x:2,y:14,w:9,h:3},{x:14,y:14,w:8,h:3}],c:[[8,3,10,3],[17,3,19,3],[5,5,5,7],[15,9,18,9],[6,12,8,12],[11,14,14,14]],f:[{x:4,y:2,t:"🚢",l:"Harbor"},{x:13,y:2,t:"🏛️",l:"Merchant Prince"},{x:20,y:2,t:"🏪",l:"Market"},{x:3,y:9,t:"🦎",l:"Dino Pens"},{x:11,y:9,t:"🍺",l:"Thundering Lizard"},{x:20,y:9,t:"🛒",l:"Bazaar"},{x:6,y:15,t:"🌴",l:"Docks"},{x:17,y:15,t:"🚪",l:"Jungle Gate"}],pc:{x:4,y:2},mn:{x:17,y:15},nm:"Port Nyanzaru"},narr:"The port city of Nyanzaru is a vibrant, chaotic trading hub on the northern coast of Chult. Dinosaurs serve as beasts of burden, merchant princes compete for power, and explorers gather before plunging into the deadly jungle. Your mission: find the Soulmonger — an artifact causing a death curse that is killing everyone who has ever been raised from the dead.",choices:["Hire a jungle guide","Visit the merchant princes","Buy supplies at the market","Gather rumors at the taverns"],notes:"Players need a guide. Several available, each with different knowledge."},
    {t:"Into the Jungle",map:{t:"forest",r:[{x:0,y:0,w:24,h:18}],c:[],f:[{x:3,y:3,t:"🌴"},{x:5,y:5,t:"🌴"},{x:7,y:2,t:"🌴"},{x:9,y:7,t:"🌴"},{x:11,y:4,t:"🌴"},{x:13,y:8,t:"🌴"},{x:15,y:3,t:"🌴"},{x:17,y:6,t:"🌴"},{x:19,y:4,t:"🌴"},{x:21,y:7,t:"🌴"},{x:4,y:10,t:"🌴"},{x:8,y:12,t:"🌴"},{x:12,y:11,t:"🌴"},{x:16,y:13,t:"🌴"},{x:20,y:11,t:"🌴"},{x:6,y:14,t:"🌴"},{x:14,y:15,t:"🌴"},{x:10,y:9,t:"💧",l:"River"},{x:11,y:9,t:"💧"},{x:12,y:9,t:"💧"},{x:13,y:9,t:"💧"},{x:14,y:9,t:"💧"},{x:7,y:8,t:"🏚️",l:"Ruins"},{x:18,y:14,t:"⚠️",l:"Quicksand"}],pc:{x:2,y:9},mn:{x:7,y:8},nm:"Chult Jungle"},narr:"The jungle of Chult is one of the most dangerous places in all Faerûn. Undead rise from the ground. Dinosaurs crash through the canopy. Yuan-ti lurk in hidden temples. And the jungle itself seems to fight you — disease, insects, quicksand, and heat threaten your every step. Somewhere deep within lies Omu, the Forbidden City.",choices:["Follow the River Soshenstar south","Head west toward the Heart of Ubtao","Seek the ruins of Orolunga for guidance","Push directly south into the deep jungle"],encounter:{monsters:["Zombie","Zombie","Zombie","Zombie"],trigger:"jungle"},notes:"Hex crawl. Random encounters daily. Diseases: Shivering Sickness, Sight Rot, etc."},
    {t:"Omu, the Forbidden City",map:{t:"dungeon",r:[{x:1,y:1,w:4,h:3},{x:7,y:1,w:4,h:3},{x:13,y:1,w:4,h:3},{x:19,y:1,w:4,h:3},{x:1,y:6,w:4,h:3},{x:7,y:6,w:4,h:3},{x:13,y:6,w:4,h:3},{x:19,y:6,w:4,h:3},{x:8,y:11,w:8,h:5}],c:[[5,2,7,2],[11,2,13,2],[17,2,19,2],[5,7,7,7],[11,7,13,7],[17,7,19,7],[3,4,3,6],[9,4,9,6],[15,4,15,6],[21,4,21,6],[10,9,10,11],[14,9,14,11]],f:[{x:2,y:2,t:"🏛️",l:"Shrine 1"},{x:8,y:2,t:"🏛️",l:"Shrine 2"},{x:14,y:2,t:"🏛️",l:"Shrine 3"},{x:20,y:2,t:"🏛️",l:"Shrine 4"},{x:2,y:7,t:"🏛️",l:"Shrine 5"},{x:8,y:7,t:"🏛️",l:"Shrine 6"},{x:14,y:7,t:"🏛️",l:"Shrine 7"},{x:20,y:7,t:"🏛️",l:"Shrine 8"},{x:12,y:13,t:"🕳️",l:"Tomb Entrance"}],pc:{x:10,y:11},mn:{x:12,y:13},nm:"Omu - Forbidden City"},narr:"After weeks of jungle travel, you finally reach the sunken city of Omu, overgrown with vegetation and crawling with yuan-ti. Nine shrines dedicated to the Trickster Gods of Omu lie scattered across the ruins. Each holds a puzzle cube needed to enter the true tomb. The yuan-ti are also searching for the cubes.",choices:["Explore the shrines systematically","Spy on the yuan-ti camp","Search for the tomb entrance first","Ally with or deceive the yuan-ti"],notes:"9 puzzle cubes needed. Each shrine has traps and puzzles."},
    {t:"The Tomb of the Nine Gods",map:{t:"dungeon",r:[{x:2,y:1,w:9,h:4},{x:14,y:1,w:8,h:4},{x:1,y:7,w:6,h:5},{x:9,y:7,w:6,h:5},{x:18,y:7,w:5,h:5},{x:3,y:14,w:8,h:3},{x:14,y:14,w:8,h:3}],c:[[11,3,14,3],[6,5,6,7],[15,5,15,7],[7,9,9,9],[15,10,18,10],[8,12,8,14],[18,12,18,14]],f:[{x:6,y:2,t:"⚠️",l:"Trap"},{x:9,y:2,t:"⚠️",l:"Trap"},{x:17,y:2,t:"💀",l:"Skeleton"},{x:3,y:9,t:"🧩",l:"Puzzle Room"},{x:12,y:9,t:"⚗️",l:"Alchemy Lab"},{x:20,y:9,t:"🕳️",l:"Pit Trap"},{x:6,y:15,t:"💀",l:"Acererak"},{x:18,y:15,t:"💎",l:"Soulmonger"}],pc:{x:6,y:1},mn:{x:6,y:15},nm:"Tomb of the Nine Gods"},narr:"Beneath Omu lies the Tomb of the Nine Gods — a deathtrap dungeon created by the archlich Acererak. Five levels of fiendish traps, puzzles, and monsters guard the Soulmonger at its heart. The tomb is designed to kill — every step could be your last.",choices:["Proceed carefully, checking for traps","Rush through to reach the Soulmonger","Split up to cover more ground","Use divination to scout ahead"],encounter:{monsters:["Skeleton","Skeleton","Zombie","Zombie"],trigger:"enter"},notes:"The deadliest dungeon in 5e. Acererak waits at the bottom."}
  ]},
  {n:"Waterdeep: Dragon Heist",lv:"1-5",d:"Urban adventure. Race to find 500,000 gold dragons hidden beneath Waterdeep.",h:"Treasure lies beneath Waterdeep, and villains compete to claim it...",scenes:[
    {t:"A Friend in Need",map:{t:"town",r:[{x:2,y:2,w:10,h:8},{x:15,y:3,w:7,h:6}],c:[[12,6,15,6]],f:[{x:6,y:5,t:"🍺",l:"Bar"},{x:8,y:4,t:"🕳️",l:"The Well"},{x:4,y:7,t:"🪑",l:"Tables"},{x:10,y:7,t:"🪑"},{x:7,y:3,t:"🏠",l:"Yawning Portal"},{x:18,y:5,t:"🚪",l:"Back Room"},{x:17,y:7,t:"📦",l:"Storage"}],pc:{x:4,y:5},mn:{x:17,y:5},nm:"Yawning Portal Tavern"},narr:"You're enjoying drinks at the Yawning Portal tavern when a fight breaks out. A battered man named Volothamp Geddarm stumbles in and begs for help — his friend Floon Blagmaar has been kidnapped by the Zhentarim. 'I'll pay you ten dragons each!' he cries, as a troll climbs out of the famous well in the tavern's center.",choices:["Help Volo immediately","Deal with the troll first","Demand more payment","Ask for more details about Floon"],encounter:{monsters:["Bandit","Bandit","Bandit"],trigger:"search"},notes:"Intro session. Troll is handled by Durnan the innkeeper. Floon is in the Zhentarim warehouse."},
    {t:"Trollskull Manor",map:{t:"town",r:[{x:2,y:1,w:8,h:5},{x:13,y:1,w:9,h:5},{x:1,y:8,w:6,h:5},{x:9,y:8,w:6,h:5},{x:18,y:8,w:5,h:5}],c:[[10,3,13,3],[5,6,5,8],[15,10,18,10],[7,13,9,13]],f:[{x:5,y:3,t:"🏠",l:"Trollskull Manor"},{x:16,y:3,t:"🏪",l:"Shops"},{x:3,y:10,t:"🏠",l:"Neighbor"},{x:12,y:10,t:"💥",l:"Fireball Site"},{x:20,y:10,t:"🏠",l:"Book Shop"}],pc:{x:5,y:3},mn:{x:12,y:10},nm:"Trollskull Alley"},narr:"As reward for rescuing Floon, Volo gives you the deed to Trollskull Manor — a rundown tavern in the North Ward. It needs repairs, but it's yours. As you settle in, you notice your new neighborhood is full of interesting characters: a detective, a tiger-owning noble, and a mysterious bookshop owner. Then a fireball explodes in the street outside.",choices:["Investigate the fireball","Renovate the tavern first","Talk to the neighbors","Report to the City Watch"],notes:"The fireball is the inciting incident. A gnome was carrying the Stone of Golorr when assassinated."},
    {t:"The Stone of Golorr",map:{t:"town",r:[{x:1,y:2,w:5,h:4},{x:8,y:1,w:7,h:5},{x:18,y:2,w:5,h:4},{x:1,y:9,w:6,h:4},{x:10,y:9,w:5,h:4},{x:18,y:9,w:5,h:4},{x:4,y:15,w:8,h:2},{x:15,y:15,w:7,h:2}],c:[[6,4,8,4],[15,4,18,4],[5,6,5,9],[15,11,18,11],[7,13,10,13],[12,15,15,15]],f:[{x:3,y:4,t:"🏚️",l:"Zhent Hideout"},{x:11,y:3,t:"🏛️",l:"Courthouse"},{x:20,y:3,t:"🎭",l:"Theater"},{x:3,y:10,t:"🏪",l:"Fence"},{x:12,y:10,t:"🕵️",l:"Detective"},{x:20,y:10,t:"🏠",l:"Safe House"},{x:7,y:16,t:"🌉",l:"Bridge"},{x:18,y:16,t:"⚓",l:"Dock"}],pc:{x:11,y:3},mn:{x:3,y:4},nm:"Waterdeep Streets"},narr:"The investigation leads you through Waterdeep's criminal underworld. The Stone of Golorr — an artifact that knows the location of Lord Neverember's hidden vault of 500,000 gold dragons — is being hunted by multiple factions: the Zhentarim, the Xanathar Guild, the Cassalanters, and Jarlaxle Baenre's Bregan D'aerthe. You must find it first.",choices:["Follow the Zhentarim leads","Infiltrate the Xanathar Guild","Attend the Cassalanter gala","Seek out Jarlaxle's agents"],notes:"Faction-heavy chapter. Multiple villains depending on season chosen by DM."},
    {t:"The Vault of Dragons",map:{t:"dungeon",r:[{x:2,y:1,w:8,h:5},{x:14,y:1,w:8,h:5},{x:1,y:8,w:6,h:5},{x:9,y:8,w:6,h:5},{x:18,y:8,w:5,h:5},{x:5,y:15,w:14,h:3}],c:[[10,3,14,3],[5,6,5,8],[15,10,18,10],[7,13,9,13],[15,13,15,15]],f:[{x:5,y:3,t:"🚪",l:"Entry"},{x:17,y:3,t:"⚠️",l:"Ward"},{x:3,y:10,t:"🪨",l:"Pillar"},{x:12,y:10,t:"🔐",l:"Lock"},{x:20,y:10,t:"⚠️",l:"Trap"},{x:10,y:16,t:"💰",l:"500k Gold!"}],pc:{x:5,y:3},mn:{x:10,y:16},nm:"Vault of Dragons"},narr:"With the Stone of Golorr in hand, you've learned the vault's location deep beneath Waterdeep. But you're not the only ones who know. The main villain's forces are converging on the entrance. You must navigate ancient dwarven tunnels, bypass magical wards, and reach the gold before your enemies do.",choices:["Race to the vault entrance","Set a trap for the villains","Seek help from the City Watch","Find an alternate entrance"],encounter:{monsters:["Bandit","Bandit","Bandit","Bandit"],trigger:"vault"},notes:"Final dungeon. Half a million gold pieces. But taking it has political consequences."}
  ]},
  {n:"Descent into Avernus",lv:"1-13",d:"Descend into the Nine Hells to save Elturel.",h:"The holy city of Elturel has been dragged to the first layer of the Nine Hells...",scenes:[
    {t:"Baldur's Gate",map:{t:"town",r:[{x:1,y:1,w:7,h:4},{x:10,y:1,w:7,h:4},{x:19,y:1,w:4,h:4},{x:1,y:7,w:5,h:5},{x:8,y:7,w:7,h:5},{x:18,y:7,w:5,h:5},{x:3,y:14,w:8,h:3},{x:14,y:14,w:8,h:3}],c:[[8,3,10,3],[17,3,19,3],[5,5,5,7],[15,9,18,9],[6,12,8,12],[11,14,14,14]],f:[{x:4,y:2,t:"🏛️",l:"Parliament"},{x:13,y:2,t:"⛪",l:"Temple"},{x:20,y:2,t:"🏰",l:"Citadel"},{x:3,y:9,t:"🏚️",l:"Bathhouse"},{x:11,y:9,t:"🏪",l:"Market"},{x:20,y:9,t:"🍺",l:"Tavern"},{x:6,y:15,t:"🚪",l:"Gate"},{x:18,y:15,t:"⚓",l:"Harbor"}],pc:{x:18,y:15},mn:{x:3,y:9},nm:"Baldur's Gate"},narr:"The city of Baldur's Gate is in crisis. Refugees flood in from Elturel, which has vanished without a trace. The Flaming Fist mercenaries maintain brutal order while a cult called the Dead Three spreads murder through the streets. You've been recruited to investigate — and what you find points to something far worse than mortal villainy.",choices:["Investigate the Dead Three murders","Help the refugees","Seek audience with Duke Ravengard","Explore the city's underworld"],encounter:{monsters:["Bandit","Bandit","Bandit","Skeleton"],trigger:"dungeon"},notes:"Urban chapter. Dead Three dungeon under the bathhouse."},
    {t:"The Fall of Elturel",map:{t:"road",r:[{x:0,y:4,w:24,h:10}],c:[],f:[{x:5,y:8,t:"🔥",l:"Portal"},{x:7,y:7,t:"🔥"},{x:6,y:9,t:"🔥"},{x:12,y:7,t:"🏚️",l:"Ruins"},{x:15,y:9,t:"🏚️"},{x:19,y:8,t:"🏰",l:"Elturel (falling)"},{x:3,y:6,t:"🌫️"},{x:3,y:10,t:"🌫️"},{x:21,y:6,t:"🌫️"},{x:21,y:10,t:"🌫️"}],pc:{x:3,y:8},mn:{x:5,y:8},nm:"Gateway to Avernus"},narr:"You discover the terrible truth: Elturel didn't just vanish — it was dragged into Avernus, the first layer of the Nine Hells, by an infernal contract. Its people are trapped, tormented by devils. The only way to save them is to go to Hell yourself. A portal awaits.",choices:["Enter the portal to Avernus","Seek more information first","Gather allies for the journey","Pray for divine guidance"],notes:"Point of no return. Once in Avernus, the campaign tone shifts dramatically."},
    {t:"The Wastelands of Avernus",map:{t:"road",r:[{x:0,y:3,w:24,h:12}],c:[],f:[{x:3,y:8,t:"🔥"},{x:6,y:6,t:"🔥"},{x:8,y:10,t:"🩸",l:"Blood River"},{x:9,y:10,t:"🩸"},{x:10,y:10,t:"🩸"},{x:11,y:10,t:"🩸"},{x:14,y:7,t:"🏚️",l:"War Machine"},{x:18,y:8,t:"💀",l:"Bone Field"},{x:21,y:6,t:"🏰",l:"Fortress"},{x:5,y:5,t:"🪨"},{x:12,y:5,t:"🪨"},{x:16,y:12,t:"🪨"},{x:20,y:11,t:"🔥"}],pc:{x:2,y:8},mn:{x:14,y:7},nm:"Avernus Wasteland"},narr:"Avernus is a blasted hellscape of rust-red earth, rivers of blood, and eternal war between devils and demons. Infernal war machines roar across the plains. You can see Elturel in the distance, suspended by chains of infernal iron above the River Styx. To free it, you must find the contract that binds it — and that means dealing with archdevils.",choices:["Seek Mad Maggie for a war machine","Hunt for the Bleeding Citadel","Track down the devil Bel","Follow rumors of the Sword of Zariel"],encounter:{monsters:["Zombie","Zombie","Zombie","Skeleton","Skeleton"],trigger:"wasteland"},notes:"Sandbox in Hell. Infernal war machines are key. Multiple paths to the Sword."},
    {t:"Zariel's Redemption",map:{t:"castle",r:[{x:4,y:1,w:16,h:6},{x:2,y:9,w:8,h:6},{x:14,y:9,w:8,h:6},{x:8,y:15,w:8,h:3}],c:[[8,7,8,9],[16,7,16,9],[12,14,12,15]],f:[{x:12,y:3,t:"👑",l:"Zariel Throne"},{x:8,y:3,t:"🔥",l:"Hellfire"},{x:16,y:3,t:"🔥"},{x:6,y:4,t:"🪨",l:"Pillar"},{x:18,y:4,t:"🪨"},{x:5,y:12,t:"⚔️",l:"Armory"},{x:18,y:12,t:"⚔️",l:"Armory"},{x:12,y:16,t:"⚡",l:"Sword of Zariel"}],pc:{x:12,y:16},mn:{x:12,y:3},nm:"Zariel's Flying Fortress"},narr:"You've found the Sword of Zariel — a holy weapon containing the spark of the fallen angel's former goodness. Now you face the ultimate choice: confront Zariel, archdevil ruler of Avernus, in her flying fortress. You can try to redeem her with the sword, restoring her angelic nature — or destroy her. Either way, Elturel's fate hangs in the balance.",choices:["Storm Zariel's fortress","Attempt to negotiate with Zariel","Use the Sword to redeem her","Seek another way to break the contract"],notes:"Final confrontation. Zariel: AC 21, HP 580. Redemption is possible but difficult."}
  ]},
  {n:"Rime of the Frostmaiden",lv:"1-12",d:"Survive the eternal winter of Icewind Dale.",h:"Icewind Dale is trapped in perpetual winter by the Frostmaiden. The sun never rises...",scenes:[
    {t:"Ten-Towns",map:{t:"town",r:[{x:1,y:1,w:4,h:3},{x:7,y:1,w:4,h:3},{x:13,y:1,w:4,h:3},{x:19,y:1,w:4,h:3},{x:1,y:6,w:4,h:3},{x:7,y:6,w:4,h:3},{x:13,y:6,w:4,h:3},{x:19,y:6,w:4,h:3},{x:4,y:11,w:7,h:3},{x:14,y:11,w:7,h:3}],c:[[5,2,7,2],[11,2,13,2],[17,2,19,2],[5,7,7,7],[11,7,13,7],[17,7,19,7],[3,4,3,6],[9,4,9,6],[15,4,15,6],[21,4,21,6],[7,9,7,11],[17,9,17,11]],f:[{x:2,y:2,t:"🏠",l:"Bryn Shander"},{x:8,y:2,t:"🏠",l:"Targos"},{x:14,y:2,t:"🏠",l:"Bremen"},{x:20,y:2,t:"🏠",l:"Lonelywood"},{x:2,y:7,t:"🏠",l:"Easthaven"},{x:8,y:7,t:"🏠",l:"Caer-Dineval"},{x:14,y:7,t:"🏠",l:"Good Mead"},{x:20,y:7,t:"🏠",l:"Dougan Hole"},{x:7,y:12,t:"🏠",l:"Caer-Konig"},{x:17,y:12,t:"🏠",l:"Termalaine"}],pc:{x:2,y:2},mn:{x:14,y:7},nm:"Ten-Towns of Icewind Dale"},narr:"Icewind Dale is dying. Auril the Frostmaiden has cursed the land with perpetual night — the sun hasn't risen in over two years. The ten towns around the frozen lakes struggle to survive, making desperate sacrifices to appease the goddess. Warmth is scarce. Hope is scarcer. But you've come here for reasons of your own.",choices:["Help the town of Bryn Shander","Investigate sacrifices in Targos","Search for missing persons in Bremen","Seek work at the Northlook tavern"],notes:"Open-world start. Multiple quest hooks across ten towns. Cold weather survival rules."},
    {t:"The Chardalyn Menace",map:{t:"cave",r:[{x:2,y:1,w:7,h:5},{x:12,y:1,w:8,h:5},{x:1,y:8,w:6,h:5},{x:9,y:8,w:6,h:5},{x:18,y:8,w:5,h:5}],c:[[9,3,12,3],[5,6,5,8],[15,10,18,10],[7,13,9,13]],f:[{x:5,y:3,t:"💎",l:"Chardalyn"},{x:15,y:3,t:"⚒️",l:"Forge"},{x:3,y:10,t:"💎",l:"Crystal"},{x:12,y:10,t:"🔥",l:"Furnace"},{x:20,y:10,t:"⛓️",l:"Prison"}],pc:{x:2,y:3},mn:{x:15,y:3},nm:"Sunblight Fortress"},narr:"A sinister force stirs beneath the ice. Chardalyn — a magical crystal corrupted by demonic influence — has been found throughout Icewind Dale. Someone is collecting it, forging it into something terrible. Meanwhile, a duergar named Xardorok Sunblight plots in his fortress beneath the mountains, building a weapon that could destroy Ten-Towns entirely.",choices:["Investigate the chardalyn source","Infiltrate Sunblight's fortress","Warn Ten-Towns of the threat","Search for allies among the goliaths"],encounter:{monsters:["Goblin","Goblin","Goblin","Goblin","Kobold","Kobold"],trigger:"patrol"},notes:"Duergar are building a chardalyn dragon. Time pressure begins."},
    {t:"The Chardalyn Dragon",map:{t:"town",r:[{x:1,y:2,w:7,h:5},{x:10,y:1,w:6,h:5},{x:18,y:2,w:5,h:5},{x:2,y:10,w:8,h:5},{x:14,y:10,w:8,h:5}],c:[[8,4,10,4],[16,4,18,4],[5,7,5,10],[18,7,18,10],[10,12,14,12]],f:[{x:4,y:4,t:"🏚️",l:"Burning Town"},{x:12,y:3,t:"🔥",l:"Fire"},{x:20,y:4,t:"🏚️",l:"Rubble"},{x:6,y:12,t:"🏠",l:"Shelter"},{x:18,y:12,t:"🏠",l:"Last Stand"},{x:12,y:0,t:"🐉",l:"Dragon Above"}],pc:{x:6,y:12},mn:{x:12,y:3},nm:"Ten-Towns Under Attack"},narr:"Xardorok has unleashed his creation — a massive chardalyn dragon that soars over Ten-Towns, breathing its destructive force upon the settlements one by one. You must find a way to stop it before all ten towns are destroyed. Every hour counts as the dragon moves from town to town.",choices:["Chase the dragon directly","Rally town defenses","Assault Sunblight's fortress to find a weakness","Seek Auril's intervention"],encounter:{monsters:["Kobold","Kobold","Goblin","Goblin","Orc","Orc"],trigger:"always"},notes:"Timed event. Dragon hits towns in order. Players can't save them all."},
    {t:"The Caves of Hunger",map:{t:"cave",r:[{x:1,y:1,w:6,h:4},{x:10,y:1,w:7,h:4},{x:20,y:1,w:3,h:4},{x:1,y:7,w:5,h:5},{x:8,y:7,w:7,h:6},{x:18,y:7,w:5,h:5},{x:4,y:14,w:8,h:3},{x:15,y:14,w:7,h:3}],c:[[7,3,10,3],[17,3,20,3],[5,5,5,7],[15,10,18,10],[6,12,8,12],[12,14,15,14]],f:[{x:3,y:2,t:"❄️",l:"Ice Wall"},{x:13,y:2,t:"❄️"},{x:21,y:2,t:"❄️"},{x:3,y:9,t:"💀",l:"Frozen Dead"},{x:11,y:10,t:"🏛️",l:"Ythryn Entrance"},{x:20,y:9,t:"❄️",l:"Glacier"},{x:7,y:15,t:"🌬️",l:"Wind Tunnel"},{x:18,y:15,t:"👁️",l:"Auril's Domain"}],pc:{x:3,y:2},mn:{x:18,y:15},nm:"Caves of Hunger"},narr:"To end the eternal winter, you must confront Auril herself. The path leads through the Caves of Hunger — a frozen dungeon within the Reghed Glacier. Ancient secrets lie buried in the ice, including a crashed Netherese city called Ythryn. But first, you must survive the glacier's deadly guardians.",choices:["Navigate the ice caves carefully","Use fire magic to melt a path","Search for the entrance to Ythryn","Prepare for confrontation with Auril"],encounter:{monsters:["Skeleton","Skeleton","Zombie","Zombie","Wolf","Wolf"],trigger:"caves"},notes:"Penultimate dungeon. Leads to Ythryn and the final confrontation with Auril."}
  ]},
  {n:"Ghosts of Saltmarsh",lv:"1-12",d:"Nautical adventures around coastal Saltmarsh.",h:"The sleepy fishing town sits on the edge of something sinister...",scenes:[
    {t:"The Sinister Secret of Saltmarsh",map:{t:"dungeon",r:[{x:2,y:1,w:7,h:4},{x:12,y:1,w:8,h:5},{x:1,y:7,w:5,h:5},{x:8,y:7,w:7,h:5},{x:18,y:7,w:5,h:6}],c:[[9,3,12,3],[5,5,5,7],[15,9,18,9],[6,12,8,12]],f:[{x:5,y:2,t:"🏚️",l:"Haunted Room"},{x:15,y:3,t:"📦",l:"Smuggler Goods"},{x:3,y:9,t:"🕸️",l:"Webs"},{x:11,y:9,t:"🚪",l:"Secret Door"},{x:20,y:10,t:"⚓",l:"Sea Cave"}],pc:{x:5,y:2},mn:{x:15,y:3},nm:"Haunted House"},narr:"The coastal town of Saltmarsh has a haunted house on the cliff — or so everyone says. Strange lights have been seen in the windows at night. The town council wants you to investigate. Inside, you find it's not ghosts but something far more mundane and dangerous: smugglers using the 'haunted' reputation as cover.",choices:["Investigate the haunted house at night","Ask townspeople about the lights","Scout the cliffs from the sea","Go in through the front door"],encounter:{monsters:["Bandit","Bandit","Bandit","Bandit"],trigger:"enter"},notes:"Classic dungeon. Smugglers in the basement. Ship in the sea caves below."},
    {t:"Danger at Dunwater",map:{t:"cave",r:[{x:1,y:2,w:6,h:5},{x:9,y:1,w:7,h:6},{x:19,y:2,w:4,h:5},{x:2,y:9,w:5,h:5},{x:9,y:9,w:7,h:5},{x:19,y:9,w:4,h:5}],c:[[7,4,9,4],[16,4,19,4],[5,7,5,9],[16,11,19,11],[7,12,9,12]],f:[{x:3,y:4,t:"💧",l:"Marsh"},{x:12,y:3,t:"🦎",l:"Lizardfolk"},{x:20,y:4,t:"🐊",l:"Crocodile Pen"},{x:4,y:11,t:"⚔️",l:"Armory"},{x:12,y:11,t:"👑",l:"Chief"},{x:20,y:11,t:"📦",l:"Weapons"}],pc:{x:3,y:4},mn:{x:12,y:3},nm:"Lizardfolk Lair"},narr:"The smugglers' weapons were being sold to lizardfolk in the nearby marshes. The town council fears an attack and sends you to the lizardfolk lair. But things aren't what they seem — the lizardfolk are arming against a genuine threat: sahuagin sea devils massing for an assault on the entire coast.",choices:["Approach the lizardfolk peacefully","Sneak into their lair to spy","Demand answers with a show of force","Seek the sahuagin threat yourself"],notes:"Diplomacy adventure. Fighting the lizardfolk is possible but counterproductive."},
    {t:"Salvage Operation",map:{t:"cave",r:[{x:2,y:2,w:10,h:6},{x:15,y:3,w:7,h:5},{x:3,y:10,w:8,h:5},{x:14,y:10,w:8,h:5}],c:[[12,5,15,5],[8,8,8,10],[18,8,18,10]],f:[{x:6,y:4,t:"🚢",l:"Ship Wreck"},{x:9,y:5,t:"💧",l:"Flooded"},{x:18,y:5,t:"🏝️",l:"Island"},{x:6,y:12,t:"🕷️",l:"Spider Nest"},{x:18,y:12,t:"🌿",l:"Druid Grove"}],pc:{x:3,y:4},mn:{x:18,y:5},nm:"Emperor of the Waves"},narr:"A merchant named Aubreck hires you to retrieve cargo from the Emperor of the Waves — a ship that sank near a mysterious island. When you reach the wreck, you discover it's been claimed by giant insects and worse. The island itself seems to be alive with danger, and a terrifying druid lurks at its heart.",choices:["Dive to the wreck immediately","Explore the island first","Hire a boat to circle the island","Search for other survivors"],encounter:{monsters:["Giant Spider","Giant Spider","Giant Spider"],trigger:"wreck"},notes:"Ocean/island adventure. Ship exploration and survival."},
    {t:"The Final Enemy",map:{t:"cave",r:[{x:1,y:1,w:6,h:5},{x:9,y:1,w:7,h:5},{x:19,y:1,w:4,h:5},{x:1,y:8,w:5,h:5},{x:8,y:8,w:8,h:5},{x:19,y:8,w:4,h:5},{x:4,y:15,w:7,h:3},{x:14,y:15,w:8,h:3}],c:[[7,3,9,3],[16,3,19,3],[5,6,5,8],[16,10,19,10],[6,13,8,13],[11,15,14,15]],f:[{x:3,y:3,t:"💧",l:"Flooded"},{x:12,y:3,t:"🐟",l:"Sahuagin Guard"},{x:20,y:3,t:"⚔️",l:"Barracks"},{x:3,y:10,t:"🐟"},{x:12,y:10,t:"👑",l:"Baron"},{x:20,y:10,t:"📦",l:"War Plans"},{x:7,y:16,t:"🦈",l:"Shark Pens"},{x:18,y:16,t:"🏛️",l:"Temple"}],pc:{x:3,y:3},mn:{x:12,y:10},nm:"Sahuagin Fortress"},narr:"The sahuagin fortress lies beneath the waves. With your lizardfolk and merfolk allies, you must infiltrate the stronghold, gather intelligence on the sea devils' forces, and if possible, strike at their leaders before their invasion fleet launches. The underwater lair is vast, dark, and teeming with enemies.",choices:["Lead the allied assault","Infiltrate as a small strike team","Create a diversion at the front","Sabotage their war machines from within"],encounter:{monsters:["Orc","Orc","Orc","Orc","Orc"],trigger:"fortress"},notes:"Underwater dungeon. Water breathing required. Intelligence gathering mission."}
  ]},
  {n:"Tyranny of Dragons",lv:"1-15",d:"Stop the Cult of the Dragon from freeing Tiamat.",h:"The Cult of the Dragon leads an assault across the Sword Coast...",scenes:[
    {t:"Greenest in Flames",map:{t:"town",r:[{x:2,y:2,w:8,h:5},{x:13,y:1,w:8,h:5},{x:1,y:9,w:6,h:5},{x:9,y:9,w:6,h:5},{x:18,y:9,w:5,h:5}],c:[[10,4,13,4],[5,7,5,9],[15,6,15,9],[7,14,9,14],[15,11,18,11]],f:[{x:5,y:4,t:"🏰",l:"Keep"},{x:16,y:3,t:"🔥",l:"Burning Mill"},{x:3,y:11,t:"🔥",l:"Burning House"},{x:12,y:11,t:"⛪",l:"Temple (besieged)"},{x:20,y:11,t:"🏚️",l:"Ruins"},{x:8,y:3,t:"🔥"},{x:19,y:3,t:"🔥"}],pc:{x:5,y:4},mn:{x:12,y:11},nm:"Town of Greenest"},narr:"The town of Greenest burns. A blue dragon circles overhead while cultists and kobolds loot and pillage. Governor Nighthill watches from the keep as his town is destroyed. Somewhere in the chaos, a half-dragon champion named Langdedrosa Cyanwrath challenges the town's defenders to single combat.",choices:["Rush to defend the keep","Rescue villagers from burning buildings","Confront the raiders directly","Scout the enemy forces"],encounter:{monsters:["Kobold","Kobold","Kobold","Kobold","Goblin","Goblin"],trigger:"town"},notes:"Opening battle. Episodic encounters throughout the night."},
    {t:"The Hatchery",map:{t:"cave",r:[{x:1,y:1,w:6,h:5},{x:9,y:1,w:7,h:5},{x:19,y:1,w:4,h:5},{x:1,y:8,w:5,h:5},{x:8,y:8,w:8,h:5},{x:19,y:8,w:4,h:5},{x:4,y:15,w:7,h:3},{x:14,y:15,w:8,h:3}],c:[[7,3,9,3],[16,3,19,3],[5,6,5,8],[16,10,19,10],[6,13,8,13],[11,15,14,15]],f:[{x:3,y:3,t:"🥚",l:"Dragon Eggs"},{x:12,y:3,t:"🥚",l:"Eggs"},{x:20,y:3,t:"🥚"},{x:3,y:10,t:"⛺",l:"Cult Camp"},{x:12,y:10,t:"🔥",l:"Shrine"},{x:20,y:10,t:"📦",l:"Loot"},{x:7,y:16,t:"🐉",l:"Hatchlings"},{x:18,y:16,t:"👑",l:"Frulam"}],pc:{x:3,y:10},mn:{x:12,y:3},nm:"Dragon Hatchery"},narr:"Tracking the raiders to their camp, you discover a cave complex being used as a dragon hatchery. Dozens of dragon eggs sit in warm sand. The cultists are breeding an army of dragons for their queen — Tiamat herself. Frulam Mondath, a cult leader, oversees the operation.",choices:["Destroy the eggs","Infiltrate disguised as cultists","Capture Frulam for interrogation","Map the cave and report back"],encounter:{monsters:["Kobold","Kobold","Kobold","Kobold","Kobold","Kobold"],trigger:"cave"},notes:"Stealth or combat. Destroying eggs angers the cult significantly."},
    {t:"The Rise of Tiamat",map:{t:"castle",r:[{x:3,y:1,w:9,h:5},{x:15,y:1,w:7,h:5},{x:1,y:8,w:7,h:5},{x:10,y:8,w:6,h:5},{x:19,y:8,w:4,h:5}],c:[[12,3,15,3],[6,6,6,8],[16,6,16,8],[7,10,10,10],[16,10,19,10]],f:[{x:7,y:3,t:"🏛️",l:"Council Hall"},{x:18,y:3,t:"📚",l:"Library"},{x:4,y:10,t:"⚔️",l:"War Room"},{x:13,y:10,t:"🗺️",l:"Strategy Map"},{x:20,y:10,t:"🏰",l:"Keep"}],pc:{x:7,y:3},mn:{x:13,y:10},nm:"Council of Waterdeep"},narr:"The Cult of the Dragon's plan becomes clear: they are gathering five dragon masks, one for each of Tiamat's heads, to perform a ritual at the Well of Dragons that will summon the Dragon Queen from the Nine Hells. You must rally the factions of the Sword Coast — the Harpers, the Order of the Gauntlet, the Emerald Enclave, the Lords' Alliance, and even the Zhentarim — into a coalition against the cult.",choices:["Rally the Harpers","Seek the Order of the Gauntlet","Approach the Lords' Alliance","Infiltrate the cult's inner circle"],notes:"Political/faction chapter. Building a coalition against the cult."},
    {t:"The Well of Dragons",map:{t:"cave",r:[{x:3,y:1,w:18,h:7},{x:1,y:10,w:8,h:5},{x:11,y:10,w:6,h:5},{x:20,y:10,w:3,h:5}],c:[[6,8,6,10],[14,8,14,10],[21,8,21,10]],f:[{x:12,y:4,t:"🕳️",l:"The Well"},{x:10,y:3,t:"🔥",l:"Hellfire"},{x:14,y:3,t:"🔥"},{x:8,y:2,t:"🪨"},{x:16,y:2,t:"🪨"},{x:4,y:12,t:"⚔️",l:"Alliance Army"},{x:14,y:12,t:"🐉",l:"Portal (Tiamat)"},{x:21,y:12,t:"👑",l:"Severin"}],pc:{x:4,y:12},mn:{x:12,y:4},nm:"The Well of Dragons"},narr:"The final battle. The coalition forces assault the Well of Dragons while the cult attempts to complete the summoning ritual. Inside the caldera, cultists chant as reality tears open. Tiamat's five heads begin to emerge from the portal. You must stop the ritual, defeat Severin the cult leader, and if Tiamat has partially manifested — face the Dragon Queen herself.",choices:["Lead the charge into the caldera","Sabotage the ritual from within","Target the cult leaders","Focus on closing the portal"],encounter:{monsters:["Kobold","Kobold","Goblin","Goblin","Orc","Orc","Bandit","Bandit"],trigger:"always"},notes:"Epic finale. Tiamat: AC 25, HP 615, five heads. Coalition strength affects difficulty."}
  ]},
  {n:"Princes of the Apocalypse",lv:"1-15",d:"Four elemental cults threaten the Dessarin Valley. Stop them before they unleash devastation.",h:"Dark forces stir in the Dessarin Valley. Four cults devoted to elemental evil scheme to devastate the region...",scenes:[
    {t:"Red Larch",map:{t:"town",r:[{x:2,y:1,w:6,h:4},{x:10,y:1,w:7,h:4},{x:19,y:1,w:4,h:4},{x:1,y:7,w:5,h:4},{x:8,y:7,w:7,h:5},{x:18,y:7,w:5,h:4}],c:[[8,3,10,3],[17,3,19,3],[5,5,5,7],[15,9,18,9],[6,11,8,11]],f:[{x:4,y:2,t:"🏠",l:"Swinging Sword"},{x:13,y:2,t:"🏪",l:"General Store"},{x:20,y:2,t:"⛏️",l:"Quarry"},{x:3,y:8,t:"⛪",l:"Shrine"},{x:11,y:9,t:"🏛️",l:"Town Hall"},{x:20,y:8,t:"🏚️",l:"Waelvur Wagons"},{x:11,y:12,t:"🕳️",l:"Sinkhole"}],pc:{x:4,y:2},mn:{x:11,y:12},nm:"Red Larch"},narr:"The small town of Red Larch sits at a crossroads in the Dessarin Valley. Strange things have been happening: earthquakes, unusual weather, travelers gone missing. The elders seem nervous, hiding secrets. Beneath the town, ancient tunnels hold dark rituals and darker allegiances.",choices:["Investigate the missing travelers","Explore beneath Red Larch","Question the nervous elders","Patrol the surrounding roads"],encounter:{monsters:["Bandit","Bandit","Bandit"],trigger:"tunnels"},notes:"Starting town. Mystery leads to four elemental cults."},
    {t:"The Haunted Keeps",map:{t:"castle",r:[{x:2,y:1,w:4,h:4},{x:9,y:1,w:5,h:4},{x:17,y:1,w:5,h:4},{x:5,y:7,w:5,h:4},{x:14,y:7,w:5,h:4},{x:3,y:13,w:7,h:3},{x:14,y:13,w:8,h:3}],c:[[6,3,9,3],[14,3,17,3],[7,5,7,7],[16,5,16,7],[8,11,14,11],[8,13,8,13],[18,11,18,13]],f:[{x:3,y:2,t:"🌪️",l:"Feathergale Spire"},{x:11,y:2,t:"🌊",l:"Rivergard Keep"},{x:19,y:2,t:"🪨",l:"Sacred Stone"},{x:7,y:8,t:"🔥",l:"Scarlet Moon"},{x:16,y:8,t:"🕳️",l:"Passage Down"},{x:6,y:14,t:"⚔️",l:"Cultists"},{x:18,y:14,t:"⚔️",l:"Cultists"}],pc:{x:8,y:11},mn:{x:3,y:2},nm:"Sumber Hills Keeps"},narr:"Four ancient keeps in the Sumber Hills serve as surface outposts for the elemental cults: Feathergale Spire (air), Rivergard Keep (water), Sacred Stone Monastery (earth), and Scarlet Moon Hall (fire). Each cult guards a passage to deeper temples below. The cults compete with each other even as they threaten the region.",choices:["Infiltrate Feathergale Spire","Storm Rivergard Keep","Investigate Sacred Stone Monastery","Scout Scarlet Moon Hall"],encounter:{monsters:["Orc","Orc","Bandit","Bandit"],trigger:"keeps"},notes:"Four mini-dungeons. Can be done in any order."},
    {t:"The Fane of the Eye",map:{t:"dungeon",r:[{x:2,y:1,w:6,h:4},{x:11,y:1,w:6,h:4},{x:20,y:1,w:3,h:4},{x:1,y:7,w:5,h:5},{x:8,y:7,w:8,h:5},{x:19,y:7,w:4,h:5},{x:4,y:14,w:7,h:3},{x:14,y:14,w:8,h:3}],c:[[8,3,11,3],[17,3,20,3],[5,5,5,7],[16,9,19,9],[6,12,8,12],[11,14,14,14]],f:[{x:4,y:2,t:"🌪️",l:"Air Temple"},{x:13,y:2,t:"🌊",l:"Water Temple"},{x:21,y:2,t:"🪨",l:"Earth Temple"},{x:3,y:9,t:"🔥",l:"Fire Temple"},{x:12,y:9,t:"👁️",l:"The Fane"},{x:21,y:9,t:"⚗️",l:"Elder Eye"},{x:7,y:15,t:"🕳️",l:"Node Access"},{x:18,y:15,t:"🕳️",l:"Node Access"}],pc:{x:12,y:9},mn:{x:3,y:9},nm:"Fane of the Eye"},narr:"Deep beneath the Sumber Hills, the four elemental temples converge at the Fane of the Eye — an ancient drow temple now serving as the nexus of elemental evil. The cult prophets wield devastating elemental weapons. To end the threat, you must delve into the deepest nodes where the princes of elemental evil stir.",choices:["Assault the fire temple","Infiltrate the water temple","Brave the earth temple","Challenge the air temple"],encounter:{monsters:["Skeleton","Skeleton","Zombie","Zombie","Orc","Orc"],trigger:"fane"},notes:"Mega-dungeon. Four connected temples. Prophets must be defeated."}
  ]},
  {n:"Out of the Abyss",lv:"1-15",d:"Escape the Underdark while demon lords wreak havoc throughout the subterranean realm.",h:"Imprisoned by the drow in the depths of the Underdark, you must find a way to escape while demons overrun the tunnels...",scenes:[
    {t:"Prisoners of the Drow",map:{t:"cave",r:[{x:1,y:1,w:5,h:4},{x:8,y:1,w:6,h:4},{x:17,y:1,w:6,h:4},{x:1,y:7,w:4,h:5},{x:7,y:7,w:6,h:5},{x:16,y:7,w:7,h:5},{x:3,y:14,w:7,h:3},{x:13,y:14,w:8,h:3}],c:[[6,3,8,3],[14,3,17,3],[4,5,4,7],[13,9,16,9],[5,12,7,12],[10,14,13,14]],f:[{x:3,y:2,t:"⛓️",l:"Prison Pen"},{x:10,y:2,t:"⛓️",l:"Cells"},{x:19,y:2,t:"🕷️",l:"Spider Lair"},{x:2,y:9,t:"💧",l:"Waterfall"},{x:10,y:9,t:"🔥",l:"Guard Post"},{x:19,y:9,t:"🏠",l:"Elite Drow"},{x:6,y:15,t:"🕳️",l:"Escape Route"},{x:17,y:15,t:"⚔️",l:"Armory"}],pc:{x:3,y:2},mn:{x:10,y:9},nm:"Velkynvelve"},narr:"You awaken in chains in Velkynvelve, a drow outpost in the Underdark. Your captors are cruel and capricious. Fellow prisoners include a deep gnome, a kuo-toa, a myconid, and other unlikely allies. Escape seems impossible — but when demonic tremors shake the outpost, opportunity arises in the chaos.",choices:["Plan a stealthy escape","Incite a prison riot","Wait for the right moment","Try to steal the keys"],encounter:{monsters:["Kobold","Kobold","Goblin","Goblin"],trigger:"escape"},notes:"Opening. Players start with no equipment. 10 NPC prisoners to manage."},
    {t:"Into the Underdark",map:{t:"cave",r:[{x:0,y:0,w:24,h:18}],c:[],f:[{x:3,y:3,t:"🪨"},{x:6,y:5,t:"🍄",l:"Mushroom Grove"},{x:9,y:2,t:"🪨"},{x:12,y:6,t:"💧",l:"Dark Lake"},{x:13,y:6,t:"💧"},{x:14,y:6,t:"💧"},{x:15,y:7,t:"💧"},{x:8,y:10,t:"🏠",l:"Sloobludop"},{x:16,y:4,t:"🏰",l:"Gracklstugh"},{x:20,y:8,t:"🍄",l:"Neverlight Grove"},{x:4,y:14,t:"🪨"},{x:10,y:13,t:"🕸️",l:"Web Tunnel"},{x:17,y:14,t:"🔥",l:"Lava Flow"},{x:22,y:3,t:"🪨"},{x:3,y:8,t:"🪨"},{x:19,y:12,t:"🪨"}],pc:{x:3,y:3},mn:{x:8,y:10},nm:"Underdark Tunnels"},narr:"Free but deep underground, you must navigate the lightless tunnels of the Underdark toward the surface. The journey passes through Sloobludop (mad kuo-toa village), Gracklstugh (duergar city), Neverlight Grove (myconid haven corrupted by Zuggtmoy), and the Darklake. Demon lords stalk the darkness — Demogorgon, Orcus, Juiblex, and others have broken free.",choices:["Head toward Sloobludop","Seek Gracklstugh","Navigate the Darklake","Search for Neverlight Grove"],notes:"Hex-crawl survival in the Underdark. Random demon encounters."},
    {t:"The City of Spiders",map:{t:"dungeon",r:[{x:2,y:1,w:8,h:5},{x:14,y:1,w:8,h:5},{x:1,y:8,w:6,h:5},{x:9,y:8,w:6,h:5},{x:18,y:8,w:5,h:5},{x:5,y:15,w:14,h:3}],c:[[10,3,14,3],[5,6,5,8],[15,6,15,8],[7,10,9,10],[15,10,18,10],[10,13,10,15]],f:[{x:6,y:3,t:"🕸️",l:"House Baenre"},{x:18,y:3,t:"🕸️",l:"House Do Urden"},{x:3,y:10,t:"🏛️",l:"Bazaar"},{x:12,y:10,t:"🕷️",l:"Spider Temple"},{x:20,y:10,t:"⚔️",l:"Arena"},{x:10,y:16,t:"📚",l:"Sorcere"}],pc:{x:10,y:16},mn:{x:12,y:10},nm:"Menzoberranzan"},narr:"Reaching Menzoberranzan, the legendary drow city, is both dangerous and necessary. The drow are in chaos as demon lords threaten their domain. Unlikely alliances form as you seek the knowledge and allies needed to banish the demon lords back to the Abyss. The solution lies in a dark ritual that requires traveling to the very heart of madness.",choices:["Seek allies among the drow houses","Research the banishment ritual","Gather components for the ritual","Confront a demon lord directly"],encounter:{monsters:["Skeleton","Skeleton","Skeleton","Zombie","Zombie","Zombie"],trigger:"city"},notes:"Mid-campaign pivot. Players gain allies and a mission to banish demon lords."}
  ]},
  {n:"The Wild Beyond the Witchlight",lv:"1-8",d:"Journey into the Feywild to confront the Hourglass Coven.",h:"Something is wrong with the Witchlight Carnival...",scenes:[
    {t:"The Witchlight Carnival",map:{t:"town",r:[{x:2,y:2,w:5,h:4},{x:9,y:1,w:6,h:5},{x:18,y:2,w:5,h:4},{x:1,y:8,w:6,h:4},{x:9,y:8,w:6,h:4},{x:18,y:8,w:5,h:4},{x:5,y:14,w:14,h:3}],c:[[7,4,9,4],[15,4,18,4],[5,6,5,8],[15,10,18,10],[7,12,9,12],[12,14,12,14]],f:[{x:4,y:3,t:"🎪",l:"Big Top"},{x:12,y:3,t:"🎡",l:"Ferris Wheel"},{x:20,y:3,t:"🎭",l:"Mystery Mine"},{x:3,y:9,t:"🎯",l:"Games"},{x:12,y:9,t:"🔮",l:"Fortune Teller"},{x:20,y:9,t:"🍬",l:"Candy Stand"},{x:10,y:15,t:"🌀",l:"Feywild Portal"}],pc:{x:5,y:14},mn:{x:10,y:15},nm:"Witchlight Carnival"},narr:"The Witchlight Carnival appears only once every eight years, and tonight is the night. Colorful tents, magical performers, and wondrous attractions await. But something is wrong — a shadow lurks beneath the merriment. Lost things and stolen memories. The carnival is a gateway to the Feywild, and a ticket to reclaiming what was taken from you.",choices:["Explore the carnival attractions","Seek out the carnival owners","Investigate the mystery of lost things","Find the portal to the Feywild"],notes:"Unique: entire adventure can be completed without combat. Exploration and roleplay focused."},
    {t:"Hither",map:{t:"forest",r:[{x:0,y:0,w:24,h:18}],c:[],f:[{x:3,y:3,t:"💧",l:"Swamp"},{x:4,y:4,t:"💧"},{x:5,y:3,t:"💧"},{x:6,y:5,t:"💧"},{x:8,y:8,t:"🏚️",l:"Bavlorna Cottage"},{x:10,y:7,t:"💧"},{x:12,y:9,t:"💧"},{x:14,y:5,t:"🌿"},{x:16,y:8,t:"🌿"},{x:18,y:4,t:"🌿"},{x:20,y:7,t:"🌿"},{x:7,y:13,t:"🐸",l:"Bullywug"},{x:15,y:13,t:"🌳",l:"Ancient Tree"},{x:3,y:10,t:"🌿"},{x:19,y:12,t:"🌿"},{x:11,y:14,t:"💧"}],pc:{x:3,y:3},mn:{x:8,y:8},nm:"Hither - The Swamp"},narr:"Through the portal lies Prismeer — a Feywild domain split into three splinters by the Hourglass Coven. Hither is a foggy swampland ruled by Bavlorna Blightstraw, a hag who hoards things she's stolen. Talking animals, lost children, and whimsical dangers fill this waterlogged realm.",choices:["Seek Bavlorna's cottage","Help the lost children","Befriend the talking animals","Navigate the swamp stealthily"],notes:"First Feywild splinter. Bavlorna is a green hag. Can be defeated through trickery."},
    {t:"Thither",map:{t:"forest",r:[{x:0,y:0,w:24,h:18}],c:[],f:[{x:3,y:3,t:"🌲"},{x:5,y:5,t:"🌲"},{x:7,y:2,t:"🌲"},{x:9,y:7,t:"🌲"},{x:11,y:4,t:"🌲"},{x:13,y:8,t:"🌲"},{x:15,y:3,t:"🌲"},{x:17,y:6,t:"🌲"},{x:19,y:4,t:"🌲"},{x:21,y:7,t:"🌲"},{x:4,y:10,t:"🌲"},{x:8,y:12,t:"🌲"},{x:12,y:11,t:"🌲"},{x:16,y:13,t:"🌲"},{x:20,y:11,t:"🌲"},{x:12,y:2,t:"🏔️",l:"Granny Theater"},{x:6,y:8,t:"🤴",l:"Wayward Prince"},{x:18,y:14,t:"🌳",l:"Elder Tree"}],pc:{x:3,y:10},mn:{x:12,y:2},nm:"Thither - Ancient Forest"},narr:"The second splinter is Thither — an ancient forest where time moves strangely. Granny Nightshade rules from a mountaintop theater, putting on plays with kidnapped performers. The trees whisper warnings, and a wayward prince needs your help to remember who he is.",choices:["Find Granny Nightshade's theater","Help the wayward prince","Explore the whispering woods","Seek the Will of the Feywild"],notes:"Second hag. More fairy-tale logic than combat."},
    {t:"Yon and the Palace of Heart's Desire",map:{t:"castle",r:[{x:5,y:1,w:14,h:5},{x:2,y:8,w:8,h:5},{x:14,y:8,w:8,h:5},{x:7,y:15,w:10,h:3}],c:[[8,6,8,8],[16,6,16,8],[12,13,12,15]],f:[{x:12,y:3,t:"👑",l:"Throne"},{x:8,y:2,t:"❄️",l:"Ice"},{x:16,y:2,t:"❄️"},{x:5,y:10,t:"🎭",l:"Theater"},{x:18,y:10,t:"🔮",l:"Fate Loom"},{x:12,y:16,t:"💝",l:"Heart's Desire"}],pc:{x:12,y:16},mn:{x:12,y:3},nm:"Palace of Heart's Desire"},narr:"Yon is a frozen mountainous realm ruled by Endelyn Moongrave — a hag who sees the future and manipulates fate. At the pinnacle stands the Palace of Heart's Desire, where all stolen things are kept. To restore Prismeer and free its people, you must confront all three hags and break their hold on this domain.",choices:["Climb to the Palace directly","Sabotage Endelyn's theater of fate","Unite the Feywild creatures","Challenge the Hourglass Coven together"],encounter:{monsters:["Goblin","Goblin","Goblin","Wolf","Wolf"],trigger:"palace"},notes:"Final act. Three hags can be fought or outwitted. Palace has many puzzles."}
  ]},
  {n:"Keys from the Golden Vault",lv:"1-11",d:"Anthology of heist-themed adventures.",h:"A golden key arrives with an invitation to join the Golden Vault...",scenes:[
    {t:"The Murkmire Heist",map:{t:"town",r:[{x:2,y:2,w:8,h:5},{x:13,y:1,w:8,h:6},{x:1,y:9,w:6,h:5},{x:9,y:9,w:6,h:5},{x:18,y:9,w:5,h:5}],c:[[10,4,13,4],[5,7,5,9],[15,7,15,9],[7,14,9,14],[15,11,18,11]],f:[{x:5,y:4,t:"🎪",l:"Sideshow"},{x:16,y:3,t:"🔒",l:"Vault"},{x:3,y:11,t:"🏪",l:"Game Booth"},{x:12,y:11,t:"💎",l:"Cursed Gem"},{x:20,y:11,t:"🚪",l:"Back Exit"}],pc:{x:5,y:4},mn:{x:16,y:3},nm:"Murkmire Carnival"},narr:"Your first job from the Golden Vault: infiltrate a carnival sideshow run by a corrupt collector and steal back a cursed gemstone before it drives the townsfolk mad. The carnival is full of distractions, guards, and unexpected obstacles. You'll need a plan — and the flexibility to improvise when it falls apart.",choices:["Scout the carnival layout","Create a distraction","Go in disguise","Break in after hours"],encounter:{monsters:["Bandit","Bandit","Bandit"],trigger:"caught"},notes:"Level 1 heist. Teaches heist mechanics. Multiple approaches."},
    {t:"Prisoner 13",map:{t:"dungeon",r:[{x:1,y:1,w:6,h:4},{x:10,y:1,w:7,h:4},{x:20,y:1,w:3,h:4},{x:1,y:7,w:5,h:5},{x:8,y:7,w:8,h:5},{x:19,y:7,w:4,h:5},{x:3,y:14,w:8,h:3},{x:14,y:14,w:8,h:3}],c:[[7,3,10,3],[17,3,20,3],[5,5,5,7],[16,9,19,9],[6,12,8,12],[11,14,14,14]],f:[{x:3,y:2,t:"🚪",l:"Gate"},{x:13,y:2,t:"⛓️",l:"Cell Block A"},{x:21,y:2,t:"🏢",l:"Warden"},{x:3,y:9,t:"⛓️",l:"Cell Block B"},{x:12,y:9,t:"⛓️",l:"Prisoner 13"},{x:21,y:9,t:"👁️",l:"Guard Tower"},{x:7,y:15,t:"🍽️",l:"Mess Hall"},{x:18,y:15,t:"🏋️",l:"Yard"}],pc:{x:3,y:2},mn:{x:12,y:9},nm:"Revel's End Prison"},narr:"The Golden Vault needs you to infiltrate a prison — not to break someone out, but to retrieve a tattoo from a prisoner's back. The prisoner is a retired spy who encoded vital secrets in her body art. The prison is well-guarded, and the warden is both paranoid and corrupt.",choices:["Get arrested to go inside","Pose as inspectors","Bribe the guards","Tunnel in from below"],notes:"Level 4 heist. Social infiltration heavy."},
    {t:"Masterpiece Imbroglio",map:{t:"castle",r:[{x:2,y:1,w:10,h:5},{x:15,y:1,w:7,h:5},{x:1,y:8,w:7,h:5},{x:10,y:8,w:6,h:5},{x:19,y:8,w:4,h:5}],c:[[12,3,15,3],[6,6,6,8],[16,6,16,8],[7,10,10,10],[16,10,19,10]],f:[{x:6,y:3,t:"🎭",l:"Ballroom"},{x:17,y:3,t:"🖼️",l:"Gallery"},{x:4,y:10,t:"🍷",l:"Wine Cellar"},{x:13,y:10,t:"🔐",l:"Vault"},{x:20,y:10,t:"🚪",l:"Service Exit"}],pc:{x:6,y:3},mn:{x:13,y:10},nm:"Noble Mansion Gala"},narr:"A famous painting has been stolen from a museum and replaced with a forgery. The real painting is in the vault of a noble family's mansion during their annual gala. You must attend the party, locate the vault, steal back the painting, and escape without being noticed — all while navigating high-society intrigue.",choices:["Attend the gala as guests","Infiltrate as serving staff","Enter through the roof","Create a grand diversion"],notes:"Level 7 heist. Gala setting. Heavy social interaction."},
    {t:"Vidorant's Vault",map:{t:"dungeon",r:[{x:3,y:1,w:8,h:4},{x:14,y:1,w:8,h:4},{x:1,y:7,w:6,h:5},{x:9,y:7,w:6,h:5},{x:18,y:7,w:5,h:5},{x:5,y:14,w:14,h:3}],c:[[11,3,14,3],[5,5,5,7],[15,5,15,7],[7,10,9,10],[15,10,18,10],[10,12,10,14]],f:[{x:7,y:2,t:"⚠️",l:"Ward 1"},{x:18,y:2,t:"⚠️",l:"Ward 2"},{x:3,y:9,t:"🤖",l:"Golem Guard"},{x:12,y:9,t:"🧩",l:"Puzzle Lock"},{x:20,y:9,t:"⚠️",l:"Ward 3"},{x:12,y:15,t:"💎",l:"Vidorant's Secret"}],pc:{x:7,y:2},mn:{x:12,y:15},nm:"Vidorant's Vault"},narr:"The final heist: break into the most secure vault in the land, belonging to the corrupt archmage Vidorant. Magical wards, construct guardians, puzzle locks, and layers of defensive magic protect whatever dark secret the Golden Vault needs you to retrieve. This is the job that will define your legacy.",choices:["Disable the wards systematically","Overpower the guardians","Find Vidorant's secret bypass","Recruit a specialist for each obstacle"],encounter:{monsters:["Skeleton","Skeleton","Skeleton","Skeleton"],trigger:"vault"},notes:"Climactic heist. Highest security. Multiple puzzle layers."}
  ]},
  {n:"Phandelver and Below",lv:"1-12",d:"Expanded Lost Mine of Phandelver that descends into the Underdark and the Far Realm.",h:"What began as a simple escort job leads to the Underdark and threats from beyond reality...",scenes:[
    {t:"The Road to Phandalin",map:{t:"road",r:[{x:0,y:6,w:30,h:6}],c:[],f:[{x:3,y:8,t:"🐴",l:"Dead Horse"},{x:5,y:8,t:"🐴",l:"Dead Horse"},{x:4,y:6,t:"📦",l:"Looted Wagon"},{x:12,y:4,t:"🌲"},{x:13,y:3,t:"🌲"},{x:14,y:5,t:"🌲"},{x:11,y:3,t:"🌲"},{x:15,y:3,t:"🌲"},{x:16,y:4,t:"🌲"},{x:12,y:10,t:"🌲"},{x:14,y:11,t:"🌲"},{x:13,y:12,t:"🌲"},{x:11,y:11,t:"🌲"},{x:8,y:3,t:"🌲"},{x:9,y:4,t:"🌲"},{x:7,y:2,t:"🌲"},{x:18,y:4,t:"🌲"},{x:19,y:3,t:"🌲"},{x:20,y:5,t:"🌲"},{x:8,y:11,t:"🌲"},{x:9,y:12,t:"🌲"},{x:7,y:10,t:"🌲"},{x:18,y:11,t:"🌲"},{x:19,y:12,t:"🌲"},{x:20,y:10,t:"🌲"}],pc:{x:1,y:8},mn:{x:14,y:7},nm:"Triboar Trail"},narr:"The adventure begins familiarly — you're escorting a wagon to Phandalin when you discover dead horses and signs of an ambush. But this time, the goblin threat is just the beginning. Something far stranger lurks beneath the Sword Mountains, and the missing dwarf Gundren Rockseeker has stumbled onto something worse than a lost mine.",choices:["Investigate the ambush site","Follow the goblin trail","Rush to Phandalin for help","Search for Gundren's trail"],encounter:{monsters:["Goblin","Goblin","Goblin","Goblin"],trigger:"trail"},notes:"Familiar start from LMoP. New content diverges at Wave Echo Cave."},
    {t:"Wave Echo Cave Transformed",map:{t:"cave",r:[{x:1,y:1,w:6,h:4},{x:9,y:1,w:7,h:5},{x:19,y:1,w:4,h:4},{x:1,y:7,w:5,h:5},{x:8,y:7,w:8,h:6},{x:19,y:7,w:4,h:5},{x:3,y:14,w:7,h:3},{x:13,y:14,w:9,h:3}],c:[[7,3,9,3],[16,3,19,3],[5,5,5,7],[16,10,19,10],[6,12,8,12],[10,14,13,14]],f:[{x:3,y:2,t:"🔮",l:"Corrupted Forge"},{x:12,y:3,t:"👁️",l:"Far Realm Rift"},{x:20,y:2,t:"💀",l:"Mutated Undead"},{x:3,y:9,t:"🕸️",l:"Corrupted Web"},{x:12,y:10,t:"🧠",l:"Mind Flayer"},{x:20,y:9,t:"🟣",l:"Psionic Crystal"},{x:6,y:15,t:"⛏️",l:"Old Mine"},{x:17,y:15,t:"🌀",l:"Portal"}],pc:{x:3,y:2},mn:{x:12,y:10},nm:"Corrupted Wave Echo Cave"},narr:"Wave Echo Cave is different from what anyone expected. The Forge of Spells has been corrupted by Far Realm energy seeping through a crack in reality. Strange mutations affect the cave's creatures. Psionic whispers echo through the tunnels. The Black Spider sought power here, but what he found has driven him mad.",choices:["Investigate the Far Realm energy","Confront the corrupted Black Spider","Seal the reality crack","Explore the mutated depths"],encounter:{monsters:["Goblin","Goblin","Skeleton","Skeleton","Zombie"],trigger:"cave"},notes:"Transition point from classic LMoP to new Underdark content."},
    {t:"The Shattered Obelisk",map:{t:"dungeon",r:[{x:3,y:1,w:8,h:5},{x:14,y:1,w:8,h:5},{x:1,y:8,w:6,h:5},{x:9,y:8,w:6,h:5},{x:18,y:8,w:5,h:5},{x:5,y:15,w:14,h:3}],c:[[11,3,14,3],[5,6,5,8],[15,6,15,8],[7,10,9,10],[15,10,18,10],[10,13,10,15]],f:[{x:7,y:3,t:"🟣",l:"Obelisk Shard"},{x:18,y:3,t:"🟣",l:"Obelisk Shard"},{x:3,y:10,t:"🧠",l:"Mind Flayer"},{x:12,y:10,t:"🟣",l:"Main Obelisk"},{x:20,y:10,t:"👁️",l:"Elder Brain"},{x:12,y:16,t:"🌀",l:"Far Realm Gate"}],pc:{x:7,y:3},mn:{x:12,y:10},nm:"Shattered Obelisk Chamber"},narr:"Beneath Wave Echo Cave, you discover a shattered obelisk of alien origin — a Far Realm artifact that is slowly tearing open a permanent gateway. Mind flayer influence spreads through the Underdark. The obelisk's fragments must be found and destroyed, but each piece is guarded by aberrant horrors.",choices:["Descend to the obelisk","Search for fragment locations","Seek allies against the Far Realm","Research the obelisk's origin"],encounter:{monsters:["Goblin","Goblin","Goblin","Skeleton","Skeleton","Skeleton"],trigger:"obelisk"},notes:"New content. Far Realm horror themes. Mind flayer presence."}
  ]},
  {n:"Custom Campaign",lv:"Any",d:"Create your own world. Full DM control.",h:"Your adventure begins here...",scenes:[
    {t:"Session Start",map:{t:"dungeon",r:[{x:0,y:0,w:24,h:18}],c:[],f:[],pc:{x:4,y:9},mn:{x:20,y:9},nm:"Open Map"},narr:"The adventure begins. The Dungeon Master will set the scene and guide the story. Players, prepare your characters and await the DM's narration.",choices:["Ready for adventure"],notes:"DM writes their own scenes from here."}
  ]}
];

// ─── SESSION PLAY COMPONENT ──────────────────────────────────
function SessionPlay({camp, isDM, aiDM, chars, mons, setMons, syncAction, sceneData, setPage}) {
  const {addMsg, pn, sess} = useContext(AppCtx);
  const [dmNarration, setDmNarration] = useState("");
  const [customSceneTitle, setCustomSceneTitle] = useState("");
  const [customSceneNarr, setCustomSceneNarr] = useState("");
  const [customChoices, setCustomChoices] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [showEncounter, setShowEncounter] = useState(false);
  const journalRef = useRef(null);
  const initRef = useRef(false);

  const scenes = camp?.scenes || [];
  const {sceneIdx, journal, choiceMade, waitingForDM, playerActions} = sceneData;
  const scene = scenes[sceneIdx];
  const playerName = pn || sess?.name || "Player";

  // Helper to update synced scene data
  const updateScene = useCallback((updates) => {
    const newData = {...sceneData, ...updates};
    syncAction({type:'SCENE_UPDATE', payload: newData});
  }, [sceneData, syncAction]);

  useEffect(() => {
    if (journalRef.current) journalRef.current.scrollTop = journalRef.current.scrollHeight;
  }, [journal]);

  const postNarration = useCallback((text, title) => {
    if (!text.trim()) return;
    const entry = {type:"narration", title: title || "", text, ts: Date.now()};
    updateScene({journal: [...journal, entry]});
    addMsg("system", `📖 ${title ? title+": " : ""}${text.substring(0, 80)}...`);
    setDmNarration("");
  }, [journal, updateScene, addMsg]);

  const advanceScene = useCallback((idx) => {
    const nextIdx = idx !== undefined ? idx : sceneIdx + 1;
    if (nextIdx < scenes.length) {
      const s = scenes[nextIdx];
      const entry = {type:"scene", title: s.t, text: s.narr, ts: Date.now()};
      updateScene({
        sceneIdx: nextIdx,
        journal: [...journal, entry],
        choiceMade: false,
        waitingForDM: false,
        playerActions: []
      });
      addMsg("system", `📜 New Scene: ${s.t}`);
      setShowEncounter(false);
    } else {
      const entry = {type:"scene", title: "🏆 Campaign Complete!", text: "Congratulations, adventurers! Your deeds will be remembered in song and story for generations to come.", ts: Date.now()};
      updateScene({journal: [...journal, entry], choiceMade: true, waitingForDM: false});
      addMsg("system", "🏆 Campaign Complete! Well played, adventurers!");
    }
  }, [sceneIdx, scenes, journal, updateScene, addMsg]);

  const handleChoice = useCallback((choice) => {
    if (choiceMade) return;
    const action = {player: playerName, choice, ts: Date.now()};
    const entry = {type:"action", text: `${playerName} chose: "${choice}"`, ts: Date.now()};
    updateScene({
      journal: [...journal, entry],
      playerActions: [...playerActions, action],
      choiceMade: true,
      waitingForDM: true
    });
    addMsg("system", `🎭 ${playerName}: "${choice}"`);
  }, [journal, playerActions, playerName, choiceMade, updateScene, addMsg]);

  const triggerEncounter = useCallback(() => {
    if (!scene?.encounter) return;
    const monsToAdd = scene.encounter.monsters.map(mn => {
      const template = MONSTERS.find(m => m.n === mn);
      return template ? {...template, id: uid(), curHp: template.hp} : null;
    }).filter(Boolean);
    syncAction({type:'SET_MONSTERS', payload: monsToAdd});
    setShowEncounter(true);
    const entry = {type:"encounter", text:`Combat! ${monsToAdd.map(m=>m.n).join(", ")} appear!`, ts: Date.now()};
    updateScene({journal: [...journal, entry]});
    addMsg("system", `⚔️ ENCOUNTER: ${monsToAdd.map(m=>m.n).join(", ")}! Switch to Combat tab to fight!`);
    if (setPage) setTimeout(() => setPage("combat"), 500);
  }, [scene, journal, updateScene, addMsg, syncAction, setPage]);

  const addCustomScene = useCallback(() => {
    if (!customSceneNarr.trim()) return;
    const entry = {type:"scene", title: customSceneTitle || "New Scene", text: customSceneNarr, ts: Date.now()};
    updateScene({
      journal: [...journal, entry],
      playerActions: [],
      choiceMade: false,
      waitingForDM: false
    });
    addMsg("system", `📜 New Scene: ${customSceneTitle || "New Scene"}`);
    setCustomSceneTitle("");
    setCustomSceneNarr("");
    setCustomChoices("");
    setShowCustom(false);
  }, [customSceneTitle, customSceneNarr, customChoices, journal, updateScene, addMsg]);

  // Auto-load first scene once (host only to prevent duplicates)
  useEffect(() => {
    if (scenes.length > 0 && journal.length === 0 && !initRef.current && isDM) {
      initRef.current = true;
      const entry = {type:"scene", title: scenes[0].t, text: scenes[0].narr, ts: Date.now()};
      updateScene({journal: [entry]});
    }
  }, [scenes, journal, updateScene, isDM]);

  const sessionCSS = `
    .sess-journal{max-height:400px;overflow-y:auto;display:flex;flex-direction:column;gap:8px;padding:4px}
    .sess-entry{padding:12px 14px;border-radius:var(--rad);animation:fu .3s ease-out}
    .sess-narr{background:rgba(0,0,0,.25);border-left:3px solid var(--gold);color:var(--ink);font-size:.95rem;line-height:1.6;font-style:italic}
    .sess-scene{background:linear-gradient(135deg,rgba(201,168,76,.08),rgba(201,168,76,.02));border:1px solid rgba(201,168,76,.2);border-radius:var(--rad)}
    .sess-scene .scene-title{font-family:'Cinzel',serif;font-size:1.05rem;font-weight:700;color:var(--gold);margin-bottom:6px;display:flex;align-items:center;gap:8px}
    .sess-action{background:rgba(90,138,197,.06);border-left:3px solid var(--arc);font-size:.9rem}
    .sess-enc{background:rgba(139,26,26,.08);border-left:3px solid var(--redb);font-size:.9rem;font-weight:600;color:var(--redb)}
    .sess-dm{background:rgba(201,168,76,.06);border-left:3px solid var(--goldd);font-size:.9rem}
    .choice-grid{display:flex;flex-direction:column;gap:6px;margin-top:10px}
    .choice-btn{font-family:'Crimson Text',serif;font-size:.9rem;padding:10px 14px;background:rgba(0,0,0,.2);
      border:1px solid rgba(201,168,76,.2);border-radius:var(--rad);color:var(--ink);cursor:pointer;
      text-align:left;transition:all .2s}
    .choice-btn:hover{border-color:var(--gold);background:rgba(201,168,76,.08);padding-left:18px}
    .choice-btn .choice-num{font-family:'Cinzel',serif;font-weight:700;color:var(--gold);margin-right:8px}
    .dm-tools-bar{display:flex;gap:6px;flex-wrap:wrap;padding:10px;background:rgba(201,168,76,.04);border:1px solid rgba(201,168,76,.15);border-radius:var(--rad)}
    .scene-nav{display:flex;align-items:center;gap:8px;padding:8px 12px;background:rgba(0,0,0,.2);border-radius:var(--rad)}
    .scene-dot{width:10px;height:10px;border-radius:50%;border:1px solid var(--goldd);cursor:pointer;transition:all .2s}
    .scene-dot:hover{border-color:var(--gold);transform:scale(1.2)}
    .scene-dot.active{background:var(--gold);border-color:var(--goldb);box-shadow:0 0 8px rgba(201,168,76,.4)}
    .scene-dot.visited{background:var(--goldd)}
    .dm-note{background:rgba(201,168,76,.04);border:1px dashed rgba(201,168,76,.2);border-radius:var(--rad);padding:10px;font-size:.8rem;color:var(--inkd)}
  `;

  return <>
    <style>{sessionCSS}</style>
    <div className="pnl">
      <div className="ph">
        <div>
          <h2 style={{margin:0}}>{camp.n}</h2>
          <div className="td2 ts">{camp.lv} • Scene {sceneIdx + 1}/{scenes.length}
            {isDM && <button className="btn bs bg" style={{marginLeft:8,fontSize:".6rem"}} onClick={()=>syncAction({type:'SET_CAMPAIGN',payload:null})}>Change Campaign</button>}
          </div>
        </div>
        <div className="fr gs">
          {scene?.encounter && isDM && !showEncounter && (
            <button className="btn bs bd" onClick={triggerEncounter}>⚔️ Trigger Encounter</button>
          )}
          {showEncounter && <span className="bdg bdg-r">⚔️ In Combat!</span>}
        </div>
      </div>

      {/* Scene navigation dots */}
      {scenes.length > 1 && (
        <div className="scene-nav mb">
          <span className="tx td2">Scenes:</span>
          {scenes.map((s, i) => (
            <div key={i} className={`scene-dot ${i === sceneIdx ? 'active' : i < sceneIdx ? 'visited' : ''}`}
              onClick={() => isDM && advanceScene(i)} title={s.t}/>
          ))}
          {isDM && sceneIdx < scenes.length - 1 && (
            <button className="btn bs" onClick={() => advanceScene()}>Next Scene →</button>
          )}
        </div>
      )}

      {/* Journal / Story Feed */}
      <div className="sess-journal" ref={journalRef}>
        {journal.map((entry, i) => (
          <div key={i} className={`sess-entry ${entry.type === 'narration' ? 'sess-narr' : entry.type === 'scene' ? 'sess-scene' : entry.type === 'action' ? 'sess-action' : entry.type === 'encounter' ? 'sess-enc' : 'sess-dm'}`}>
            {entry.type === 'scene' && <div className="scene-title">📜 {entry.title}</div>}
            {entry.type === 'encounter' && <span>⚔️ </span>}
            {entry.type === 'action' && <span>🎭 </span>}
            {entry.text}
          </div>
        ))}
      </div>

      {/* Player Choices */}
      {scene?.choices && !choiceMade && (
        <div className="mm">
          <label>What do you do?</label>
          <div className="choice-grid">
            {scene.choices.map((choice, i) => (
              <button key={i} className="choice-btn" onClick={() => handleChoice(choice)}>
                <span className="choice-num">{i + 1}.</span>{choice}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* After choice — waiting state */}
      {choiceMade && waitingForDM && (
        <div className="mm">
          {isDM ? (
            <div className="pnl" style={{background:"rgba(201,168,76,.04)",borderColor:"rgba(201,168,76,.3)"}}>
              <div className="fb">
                <div>
                  <div className="ts tg" style={{fontFamily:"Cinzel",fontWeight:600}}>Party has decided</div>
                  <div className="tx td2 mt">Choose how to continue:</div>
                </div>
              </div>
              <div className="fr mm" style={{gap:8,flexWrap:"wrap"}}>
                {scene?.encounter && !showEncounter && (
                  <button className="btn bd" onClick={triggerEncounter}>⚔️ Trigger Combat</button>
                )}
                {sceneIdx < scenes.length - 1 ? (
                  <button className="btn bp" onClick={() => advanceScene()}>📜 Next Scene →</button>
                ) : (
                  <button className="btn bp" onClick={() => advanceScene()}>🏆 Complete Campaign</button>
                )}
                <button className="btn" onClick={() => updateScene({choiceMade:false,waitingForDM:false,playerActions:[]})}>
                  🔄 Let Party Re-choose
                </button>
              </div>
            </div>
          ) : (
            <div className="pnl tc" style={{background:"rgba(90,138,197,.04)",borderColor:"rgba(90,138,197,.2)",padding:20}}>
              <div className="ta" style={{fontSize:"1.1rem"}}>{aiDM ? "🤖" : "⏳"}</div>
              <div className="ts ta mt">{aiDM ? "The AI Dungeon Master is narrating..." : "Your choice has been recorded."}</div>
              <div className="tx td2">{aiDM ? "The story will advance automatically..." : "Waiting for the Dungeon Master to advance the story..."}</div>
            </div>
          )}
        </div>
      )}

      {/* DM Narration Tools */}
      {isDM && (
        <div className="mm fc" style={{gap:8}}>
          <div className="dm-tools-bar">
            <span className="tx tg" style={{fontFamily:"Cinzel",fontWeight:600}}>🎭 DM Controls</span>
            <button className="btn bs" onClick={() => setShowCustom(!showCustom)}>
              {showCustom ? "Cancel" : "+ Custom Scene"}
            </button>
            <button className="btn bs" onClick={() => {
              const roll = rd(20);
              const entry = {type:"dm", text: `🎲 DM rolled a secret d20: ${roll}`, ts: Date.now()};
              updateScene({journal: [...journal, entry]});
            }}>🎲 Secret Roll</button>
            <button className="btn bs" onClick={() => {
              const desc = ["A cold wind howls through the corridor.","Torchlight flickers and almost dies.","You hear distant footsteps echoing.","A faint magical glow pulses from ahead.","The ground trembles briefly.","An eerie silence falls.","The smell of something burning drifts toward you.","A raven caws from somewhere unseen."];
              const d = desc[Math.floor(Math.random() * desc.length)];
              postNarration(d, "Atmosphere");
            }}>🌙 Atmosphere</button>
          </div>

          {/* Quick narration */}
          <div className="fr">
            <textarea value={dmNarration} onChange={e => setDmNarration(e.target.value)}
              placeholder="Write narration text for the players to see..."
              style={{flex:1, minHeight:60, resize:"vertical", fontSize:".9rem"}}/>
            <button className="btn" onClick={() => postNarration(dmNarration)} disabled={!dmNarration.trim()}
              style={{alignSelf:"flex-end"}}>📖 Narrate</button>
          </div>

          {/* DM Notes */}
          {scene?.notes && (
            <div className="dm-note">
              <b>📋 DM Notes:</b> {scene.notes}
            </div>
          )}

          {/* Custom scene creator */}
          {showCustom && (
            <div className="pnl afu" style={{background:"rgba(0,0,0,.3)"}}>
              <h3 className="mb">Create Custom Scene</h3>
              <div className="fc" style={{gap:10}}>
                <div>
                  <label>Scene Title</label>
                  <input type="text" value={customSceneTitle} onChange={e => setCustomSceneTitle(e.target.value)} placeholder="e.g. The Dark Forest"/>
                </div>
                <div>
                  <label>Narration Text</label>
                  <textarea value={customSceneNarr} onChange={e => setCustomSceneNarr(e.target.value)}
                    placeholder="Describe the scene. What do the players see, hear, smell?"
                    style={{minHeight:100, resize:"vertical"}}/>
                </div>
                <div>
                  <label>Player Choices (one per line)</label>
                  <textarea value={customChoices} onChange={e => setCustomChoices(e.target.value)}
                    placeholder={"Explore the cave\nTalk to the stranger\nSet up camp\nInvestigate the noise"}
                    style={{minHeight:70, resize:"vertical"}}/>
                </div>
                <button className="btn bp" onClick={addCustomScene} disabled={!customSceneNarr.trim()}>📜 Post Scene</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Player actions log */}
      {playerActions.length > 0 && (
        <div className="mm">
          <label>Party Actions</label>
          <div className="fc" style={{gap:4,marginTop:6}}>
            {playerActions.map((a, i) => (
              <div key={i} className="ts" style={{padding:"3px 8px", background:"rgba(90,138,197,.05)", borderRadius:4}}>
                <b className="ta">{a.player}:</b> {a.choice}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  </>;
}

// ─── UTILS ──────────────────────────────────────────────────
const rd = s => Math.floor(Math.random()*s)+1;
const rdN = (n,s) => Array.from({length:n},()=>rd(s));
const r4d6 = () => { const r=rdN(4,6).sort((a,b)=>b-a); return {rolls:r,kept:r.slice(0,3),total:r.slice(0,3).reduce((a,b)=>a+b,0)}; };
const aMod = s => Math.floor((s-10)/2);
const ms = m => m>=0?`+${m}`:`${m}`;
const pb = l => Math.ceil(l/4)+1;
const uid = () => Math.random().toString(36).substr(2,9);

const AppCtx = createContext();

// ─── CSS ────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Cinzel+Decorative:wght@400;700;900&family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400&display=swap');
:root{--bg:#12100d;--bg2:#1a1610;--bg3:#221e18;--gold:#c9a84c;--goldb:#e8c84c;--goldd:#8a7234;--red:#8b1a1a;--redb:#c42b2b;--ink:#e8dcc8;--inkd:#9a8e7a;--inkf:#5a5248;--arc:#5a8ac5;--nat:#3a8a4a;--bdr:rgba(201,168,76,.25);--pnl:rgba(18,14,10,.96);--rad:5px}
*{margin:0;padding:0;box-sizing:border-box}
body,#root{font-family:'Crimson Text',Georgia,serif;background:var(--bg);color:var(--ink);min-height:100vh}
.abg{min-height:100vh;background:radial-gradient(ellipse at 20% 0%,rgba(201,168,76,.04),transparent 50%),radial-gradient(ellipse at 80% 100%,rgba(139,26,26,.03),transparent 50%),linear-gradient(180deg,#12100d,#0a0908)}
h1,h2,h3,h4{font-family:'Cinzel',serif;color:var(--gold);letter-spacing:.04em}
h1{font-size:1.8rem;font-weight:900}h2{font-size:1.3rem;font-weight:700}h3{font-size:1.05rem;font-weight:600}
.td{font-family:'Cinzel Decorative',serif;text-align:center;text-shadow:0 0 20px rgba(201,168,76,.3)}
.pnl{background:var(--pnl);border:1px solid var(--bdr);border-radius:var(--rad);padding:16px;backdrop-filter:blur(8px)}
.ph{display:flex;align-items:center;justify-content:space-between;padding-bottom:10px;margin-bottom:12px;border-bottom:1px solid var(--bdr)}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:14px}.g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
.g6{display:grid;grid-template-columns:repeat(6,1fr);gap:10px}
.fr{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.fc{display:flex;flex-direction:column;gap:6px}
.fb{display:flex;justify-content:space-between;align-items:center}
.gs{gap:4px}.gl{gap:16px}
.mt{margin-top:6px}.mm{margin-top:12px}.ml{margin-top:16px}.mb{margin-bottom:12px}
.tc{text-align:center}.ts{font-size:.82rem}.tx{font-size:.72rem}
.tg{color:var(--gold)}.td2{color:var(--inkd)}.tr{color:var(--redb)}.ta{color:var(--arc)}
.dv{height:1px;background:linear-gradient(90deg,transparent,var(--bdr),transparent);margin:14px 0}
.btn{font-family:'Cinzel',serif;font-size:.78rem;font-weight:600;padding:7px 16px;border:1px solid var(--goldd);background:linear-gradient(180deg,rgba(201,168,76,.12),rgba(201,168,76,.04));color:var(--gold);border-radius:var(--rad);cursor:pointer;transition:all .2s;letter-spacing:.04em;text-transform:uppercase;white-space:nowrap}
.btn:hover{background:linear-gradient(180deg,rgba(201,168,76,.22),rgba(201,168,76,.08));border-color:var(--gold);text-shadow:0 0 6px rgba(201,168,76,.2)}
.btn:active{transform:scale(.97)}
.bp{background:linear-gradient(180deg,var(--gold),var(--goldd));color:var(--bg);border-color:var(--gold)}
.bp:hover{background:linear-gradient(180deg,var(--goldb),var(--gold))}
.bd{border-color:var(--red);color:var(--redb);background:linear-gradient(180deg,rgba(139,26,26,.12),rgba(139,26,26,.04))}
.bd:hover{background:rgba(139,26,26,.2);border-color:var(--redb)}
.bs{padding:3px 10px;font-size:.7rem}.bl{padding:12px 28px;font-size:1rem}.bx{padding:15px 40px;font-size:1.15rem;letter-spacing:.08em}
.bi{padding:5px 8px;font-size:.9rem;min-width:32px;display:flex;align-items:center;justify-content:center}
.bg{border:none;background:none}.bg:hover{background:rgba(201,168,76,.06)}
.brl{background:linear-gradient(135deg,var(--red),#5b0b0b);border:2px solid var(--redb);color:#fff;font-size:1rem;padding:14px 28px;text-shadow:0 2px 4px rgba(0,0,0,.5);box-shadow:0 4px 16px rgba(139,26,26,.35)}
.brl:hover{background:linear-gradient(135deg,var(--redb),var(--red));box-shadow:0 6px 24px rgba(196,43,43,.45);transform:translateY(-1px)}
select,input[type="text"],input[type="number"],textarea{font-family:'Crimson Text',serif;font-size:.95rem;background:rgba(0,0,0,.3);border:1px solid var(--bdr);color:var(--ink);padding:7px 10px;border-radius:var(--rad);outline:none;transition:border-color .2s;width:100%}
select:focus,input:focus,textarea:focus{border-color:var(--gold);box-shadow:0 0 6px rgba(201,168,76,.12)}
select option{background:var(--bg)}
label{font-family:'Cinzel',serif;font-size:.7rem;font-weight:600;color:var(--goldd);text-transform:uppercase;letter-spacing:.06em}
.abx{background:rgba(0,0,0,.28);border:1px solid var(--bdr);border-radius:var(--rad);padding:10px 6px;text-align:center;cursor:pointer;transition:all .2s}
.abx:hover{border-color:var(--gold);background:rgba(201,168,76,.04)}
.abl{font-family:'Cinzel',serif;font-size:.65rem;font-weight:700;color:var(--gold);text-transform:uppercase;letter-spacing:.08em}
.abs{font-family:'Cinzel',serif;font-size:1.8rem;font-weight:900;color:var(--ink);line-height:1;margin:2px 0}
.abm{font-family:'Cinzel',serif;font-size:.95rem;font-weight:700;color:var(--goldb);background:rgba(0,0,0,.35);border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;margin:3px auto 0;border:1px solid var(--bdr)}
.dr{font-family:'Cinzel Decorative',serif;font-size:2.5rem;font-weight:900;text-align:center;color:var(--goldb);text-shadow:0 0 16px rgba(201,168,76,.35);line-height:1}
.d20{color:var(--goldb);animation:gl 1s ease-in-out infinite alternate}
.d1{color:var(--redb);animation:pr .5s 3}
@keyframes gl{from{text-shadow:0 0 16px rgba(201,168,76,.35)}to{text-shadow:0 0 32px rgba(232,200,76,.7),0 0 60px rgba(201,168,76,.2)}}
@keyframes pr{0%,100%{text-shadow:0 0 16px rgba(196,43,43,.35)}50%{text-shadow:0 0 32px rgba(196,43,43,.7)}}
@keyframes ri{0%{transform:scale(0) rotate(180deg);opacity:0}60%{transform:scale(1.15) rotate(-8deg);opacity:1}100%{transform:scale(1) rotate(0)}}
@keyframes fu{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes sx{0%,100%{transform:translateX(0)}25%{transform:translateX(-3px) rotate(-1deg)}75%{transform:translateX(3px) rotate(1deg)}}
.ari{animation:ri .4s cubic-bezier(.34,1.56,.64,1)}.afu{animation:fu .25s ease-out}.asx{animation:sx .25s}
.tabs{display:flex;gap:0;border-bottom:2px solid var(--bdr);overflow-x:auto;scrollbar-width:none}
.tabs::-webkit-scrollbar{display:none}
.tab{font-family:'Cinzel',serif;font-size:.72rem;font-weight:600;padding:8px 16px;border:none;background:none;color:var(--inkd);cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-2px;transition:all .2s;white-space:nowrap;text-transform:uppercase;letter-spacing:.04em}
.tab:hover{color:var(--ink);background:rgba(201,168,76,.04)}.tab.a{color:var(--gold);border-bottom-color:var(--gold)}
.bdg{display:inline-flex;align-items:center;gap:3px;font-family:'Cinzel',serif;font-size:.65rem;font-weight:600;padding:2px 8px;border-radius:16px;text-transform:uppercase;letter-spacing:.04em}
.bdg-g{background:rgba(201,168,76,.12);color:var(--gold);border:1px solid rgba(201,168,76,.25)}
.bdg-r{background:rgba(139,26,26,.12);color:var(--redb);border:1px solid rgba(139,26,26,.25)}
.bdg-a{background:rgba(90,138,197,.12);color:var(--arc);border:1px solid rgba(90,138,197,.25)}
.hpbg{width:100%;height:14px;background:rgba(0,0,0,.45);border-radius:7px;overflow:hidden;border:1px solid var(--bdr)}
.hpf{height:100%;border-radius:7px;transition:width .4s,background .4s}
.hpg{background:linear-gradient(90deg,#2a6a2a,#4a9a4a)}.hpy{background:linear-gradient(90deg,#8a7a2a,#baa44a)}.hpr{background:linear-gradient(90deg,#6a1a1a,#9a2a2a)}
.bgrd{display:grid;gap:1px;background:rgba(201,168,76,.08);border:1px solid var(--bdr);border-radius:var(--rad);overflow:auto;max-height:480px}
.gc{width:36px;height:36px;background:rgba(0,0,0,.28);display:flex;align-items:center;justify-content:center;font-size:1.1rem;cursor:pointer;transition:background .12s}
.gc:hover{background:rgba(201,168,76,.12)}.gc.occ{background:rgba(201,168,76,.04)}.gc.fog{background:rgba(0,0,0,.8)}.gc.hl{background:rgba(90,138,197,.15);box-shadow:inset 0 0 8px rgba(90,138,197,.2)}
.chbx{height:280px;overflow-y:auto;background:rgba(0,0,0,.28);border:1px solid var(--bdr);border-radius:var(--rad);padding:10px;display:flex;flex-direction:column;gap:4px}
.chm{font-size:.85rem;padding:3px 0;animation:fu .2s}.chm .chs{font-family:'Cinzel',serif;font-weight:600;font-size:.75rem;color:var(--gold)}
.chm.sys{color:var(--inkd);font-style:italic}.chm.rl{background:rgba(201,168,76,.04);padding:6px 10px;border-radius:var(--rad);border-left:2px solid var(--goldd)}
.ii{display:flex;align-items:center;gap:10px;padding:6px 10px;border:1px solid transparent;border-radius:var(--rad);transition:all .2s}
.ii.act{border-color:var(--gold);background:rgba(201,168,76,.06);box-shadow:0 0 10px rgba(201,168,76,.08)}
.io{font-family:'Cinzel',serif;font-size:1.1rem;font-weight:900;color:var(--gold);min-width:28px;text-align:center}
::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:rgba(0,0,0,.15)}::-webkit-scrollbar-thumb{background:var(--goldd);border-radius:3px}::-webkit-scrollbar-thumb:hover{background:var(--gold)}
.sc{background:rgba(0,0,0,.18);border:1px solid var(--bdr);border-radius:var(--rad);padding:10px;cursor:pointer;transition:all .2s}
.sc:hover{border-color:var(--arc);background:rgba(90,138,197,.04)}
.mc{background:rgba(0,0,0,.18);border:1px solid var(--bdr);border-radius:var(--rad);padding:14px;cursor:pointer;transition:all .2s}
.mc:hover{border-color:var(--redb);background:rgba(139,26,26,.04)}
.cc{background:rgba(0,0,0,.18);border:1px solid var(--bdr);border-radius:var(--rad);padding:16px;cursor:pointer;transition:all .3s}
.cc:hover{border-color:var(--gold);background:rgba(201,168,76,.04);transform:translateY(-1px);box-shadow:0 6px 20px rgba(0,0,0,.25)}
.cc.sel{border-color:var(--gold);background:rgba(201,168,76,.08);box-shadow:0 0 16px rgba(201,168,76,.1)}
.nav{background:var(--pnl);border-bottom:1px solid var(--bdr);padding:6px 14px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:50}
.nb{font-family:'Cinzel',serif;font-size:.68rem;font-weight:600;padding:5px 12px;background:none;border:1px solid transparent;color:var(--inkd);cursor:pointer;border-radius:var(--rad);transition:all .2s;text-transform:uppercase;letter-spacing:.03em;white-space:nowrap}
.nb:hover{color:var(--ink);background:rgba(201,168,76,.04)}.nb.a{color:var(--gold);border-color:var(--goldd);background:rgba(201,168,76,.06)}
.ck{display:flex;align-items:center;gap:6px;cursor:pointer;padding:3px 0}
.ck input[type="checkbox"]{width:14px;height:14px;accent-color:var(--gold)}
.dsb{width:18px;height:18px;border:2px solid var(--bdr);border-radius:50%;cursor:pointer;transition:all .2s}
.dsb.ok{background:var(--nat);border-color:#4a9a4a}.dsb.fl{background:var(--red);border-color:var(--redb)}
@media(max-width:900px){.g2,.g3{grid-template-columns:1fr}.g6{grid-template-columns:repeat(3,1fr)}h1{font-size:1.4rem}.bx{padding:12px 24px;font-size:.95rem}.pnl{padding:12px}.lay{grid-template-columns:1fr!important}.sb-desk{display:none!important}.nav{flex-wrap:wrap;gap:4px}}
.chat-toggle{display:none;position:fixed;bottom:16px;right:16px;z-index:100;width:50px;height:50px;border-radius:50%;background:linear-gradient(135deg,var(--gold),var(--goldd));border:none;color:var(--bg);font-size:1.4rem;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.4)}
.chat-mobile{display:none;position:fixed;bottom:76px;right:16px;width:320px;max-width:calc(100vw - 32px);height:400px;z-index:99;border-radius:var(--rad);overflow:hidden}
@media(max-width:900px){.chat-toggle{display:flex;align-items:center;justify-content:center}.chat-mobile.open{display:block}}
`;

// ═══════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════

function DiceRoller({onRoll}) {
  const [res, setRes] = useState([]);
  const [mod, setMod] = useState(0);
  const [adv, setAdv] = useState("normal");
  const [anim, setAnim] = useState(false);
  const {addMsg} = useContext(AppCtx);

  const roll = useCallback((sides,count=1,lbl="") => {
    setAnim(true);
    setTimeout(() => {
      let rolls = rdN(count,sides), extra=null, total;
      if(sides===20&&count===1&&adv!=="normal") {
        extra=rd(20);
        total = adv==="advantage" ? Math.max(rolls[0],extra)+mod : Math.min(rolls[0],extra)+mod;
      } else total = rolls.reduce((a,b)=>a+b,0)+mod;
      const r = {id:uid(),sides,count,rolls,extra,mod,adv,total,
        label:lbl||`${count}d${sides}${mod?(mod>0?`+${mod}`:mod):""}`,
        nat20:sides===20&&count===1&&(rolls[0]===20||(extra===20)),
        nat1:sides===20&&count===1&&rolls[0]===1&&(!extra||extra===1),ts:Date.now()};
      setRes(p=>[r,...p].slice(0,15));setAnim(false);onRoll?.(r);
      addMsg("roll",`rolled ${r.label} = ${r.total}${r.nat20?" ✨ NAT 20!":""}${r.nat1?" 💀 NAT 1!":""}`,{rolls:r.rolls,extra:r.extra});
    }, 280);
  }, [mod,adv,onRoll,addMsg]);

  return (
    <div className="pnl">
      <div className="ph"><h3>🎲 Dice Roller</h3>
        <select value={adv} onChange={e=>setAdv(e.target.value)} style={{width:"auto",fontSize:".8rem"}}>
          <option value="normal">Normal</option><option value="advantage">Advantage</option><option value="disadvantage">Disadvantage</option>
        </select>
      </div>
      <div className="fr" style={{justifyContent:"center",marginBottom:14}}>
        {[4,6,8,10,12,20,100].map(d=><button key={d} className="btn" onClick={()=>roll(d)} style={{minWidth:46}}>d{d}</button>)}
      </div>
      <div className="fr" style={{justifyContent:"center",marginBottom:14}}>
        <label style={{fontSize:".75rem"}}>Modifier:</label>
        <input type="number" value={mod} onChange={e=>setMod(parseInt(e.target.value)||0)} style={{width:55,textAlign:"center"}}/>
      </div>
      {res.length>0&&<div className="tc">
        <div className={`dr ${anim?"asx":"ari"} ${res[0]?.nat20?"d20":""} ${res[0]?.nat1?"d1":""}`}>{res[0]?.total}</div>
        <div className="td2 ts mt">{res[0]?.label} [{res[0]?.rolls?.join(",")}]{res[0]?.extra!=null?` + [${res[0].extra}] (${res[0].adv})`:""}{res[0]?.mod?` ${ms(res[0].mod)}`:""}</div>
        {res.length>1&&<div className="mm" style={{maxHeight:120,overflowY:"auto"}}>
          {res.slice(1,6).map(r=><div key={r.id} className="td2 tx" style={{padding:"1px 0"}}>{r.label}: <span className="tg">{r.total}</span> [{r.rolls.join(",")}]</div>)}
        </div>}
      </div>}
    </div>
  );
}

function StatGen({stats,setStats}) {
  const [method,setMethod]=useState("standard");
  const [rr,setRR]=useState(null);
  const [pbs,setPBS]=useState({STR:8,DEX:8,CON:8,INT:8,WIS:8,CHA:8});
  const [animR,setAnimR]=useState(false);
  const pbt=useMemo(()=>Object.values(pbs).reduce((s,v)=>s+(PB_COST[v]||0),0),[pbs]);

  const doRand=useCallback(()=>{
    setAnimR(true);
    setTimeout(()=>{
      const r=ABILITIES.map(ab=>({ab,...r4d6()}));setRR(r);
      const ns={};r.forEach(x=>ns[x.ab]=x.total);setStats(ns);setAnimR(false);
    },500);
  },[setStats]);

  const doPB=useCallback((ab,dir)=>{
    setPBS(p=>{const c=p[ab],n=c+dir;if(n<8||n>15)return p;const ns={...p,[ab]:n};
      if(Object.values(ns).reduce((s,v)=>s+(PB_COST[v]||0),0)>27)return p;
      setStats(s=>({...s,[ab]:n}));return ns;});
  },[setStats]);

  useEffect(()=>{
    if(method==="standard")setStats({STR:15,DEX:14,CON:13,INT:12,WIS:10,CHA:8});
    else if(method==="pointbuy"){setStats({STR:8,DEX:8,CON:8,INT:8,WIS:8,CHA:8});setPBS({STR:8,DEX:8,CON:8,INT:8,WIS:8,CHA:8});}
  },[method,setStats]);

  return <div>
    <div className="fr mb">{["standard","pointbuy","roll","manual"].map(m=>
      <button key={m} className={`btn bs ${method===m?"bp":""}`} onClick={()=>setMethod(m)}>
        {m==="standard"?"Standard Array":m==="pointbuy"?"Point Buy":m==="roll"?"4d6 Drop Lowest":"Manual"}
      </button>)}
    </div>
    {method==="roll"&&<div className="tc mb">
      <button className={`brl btn ${animR?"asx":""}`} onClick={doRand}>🎲 RANDOMIZE STATS</button>
      {rr&&<div className="g6 mm">{rr.map(r=><div key={r.ab} className="abx ari">
        <div className="abl">{r.ab}</div><div className="abs">{r.total}</div>
        <div className="tx td2">[{r.rolls.join(",")}]</div><div className="abm">{ms(aMod(r.total))}</div>
      </div>)}</div>}
    </div>}
    {method==="standard"&&<div className="g6">{ABILITIES.map(ab=>{
      const usedVals=Object.entries(stats).filter(([k,v])=>k!==ab&&STANDARD_ARRAY.includes(v)).map(([,v])=>v);
      return <div key={ab} className="abx"><div className="abl">{ab}</div>
        <select value={stats[ab]||""} onChange={e=>setStats(p=>({...p,[ab]:parseInt(e.target.value)}))}
          style={{textAlign:"center",fontSize:"1.1rem",fontWeight:700,background:"transparent",border:"none",color:"var(--ink)"}}>
          {STANDARD_ARRAY.map(v=><option key={v} value={v} disabled={usedVals.includes(v)&&stats[ab]!==v}>{v}{usedVals.includes(v)&&stats[ab]!==v?" (used)":""}</option>)}
        </select><div className="abm">{ms(aMod(stats[ab]||10))}</div></div>})}</div>}
    {method==="pointbuy"&&<div>
      <div className="fb mb"><span className="td2">Points:</span><span className={`bdg ${pbt>27?"bdg-r":"bdg-g"}`}>{pbt}/27</span></div>
      <div className="g6">{ABILITIES.map(ab=><div key={ab} className="abx"><div className="abl">{ab}</div>
        <div className="fr" style={{justifyContent:"center",gap:3}}>
          <button className="btn bs bi" onClick={()=>doPB(ab,-1)}>−</button>
          <div className="abs" style={{fontSize:"1.3rem"}}>{pbs[ab]}</div>
          <button className="btn bs bi" onClick={()=>doPB(ab,1)}>+</button>
        </div><div className="tx td2">Cost:{PB_COST[pbs[ab]]}</div><div className="abm">{ms(aMod(pbs[ab]))}</div>
      </div>)}</div></div>}
    {method==="manual"&&<div className="g6">{ABILITIES.map(ab=><div key={ab} className="abx"><div className="abl">{ab}</div>
      <input type="number" min="1" max="30" value={stats[ab]||10} onChange={e=>setStats(p=>({...p,[ab]:parseInt(e.target.value)||10}))}
        style={{textAlign:"center",fontSize:"1.3rem",fontWeight:700,width:"100%",background:"transparent"}}/>
      <div className="abm">{ms(aMod(stats[ab]||10))}</div></div>)}</div>}
  </div>;
}

function CharCreate({onDone}) {
  const [step,setSt]=useState(0);
  const [ch,setCh]=useState({name:"",race:"Human",cls:"Fighter",bg:"Soldier",align:"True Neutral",level:1,
    stats:{STR:15,DEX:14,CON:13,INT:12,WIS:10,CHA:8},skills:[],spells:[],equip:[],gold:0,
    hp:0,mhp:0,thp:0,ac:10,ds:{s:0,f:0},conds:[],id:uid()});
  const race=RACES[ch.race],cls=CLASSES[ch.cls],bg=BACKGROUNDS[ch.bg];
  const tStats=useMemo(()=>{const s={...ch.stats};if(race?.ab)Object.entries(race.ab).forEach(([k,v])=>{if(s[k]!=null)s[k]+=v;});return s;},[ch.stats,race]);
  const cHP=useCallback(()=>cls?(cls.hd+aMod(tStats.CON)):10,[cls,tStats]);
  const cAC=useCallback(()=>{const d=aMod(tStats.DEX);if(ch.cls==="Barbarian")return 10+d+aMod(tStats.CON);if(ch.cls==="Monk")return 10+d+aMod(tStats.WIS);return 10+d;},[ch.cls,tStats]);
  const fin=useCallback(()=>{const hp=cHP(),ac=cAC(),p=pb(1),init=aMod(tStats.DEX),pp=10+aMod(tStats.WIS)+(ch.skills.includes("Perception")?p:0);
    const bgEquip = bg?.eq ? bg.eq.split(", ").filter(Boolean) : [];
    onDone({...ch,stats:tStats,mhp:hp,hp,ac,init,pb:p,pp,st:cls?.st||[],feats:cls?.ft?.[1]||[],speed:race?.sp||30,dv:race?.dv||0,traits:race?.tr||[],equip:bgEquip,gold:parseInt(bg?.eq?.match(/(\d+)\s*gp/)?.[1])||0});
  },[ch,tStats,cHP,cAC,cls,race,onDone]);
  const steps=["Name & Race","Class","Background","Ability Scores","Skills & Spells","Review"];

  return <div style={{maxWidth:860,margin:"0 auto"}}>
    <h2 className="td mb">⚔️ Create Your Character</h2>
    <div className="tabs mb">{steps.map((s,i)=><button key={s} className={`tab ${step===i?"a":""}`} onClick={()=>setSt(i)}>{s}</button>)}</div>

    {step===0&&<div className="pnl afu"><div className="fc gl">
      <div><label>Character Name</label><input type="text" value={ch.name} onChange={e=>setCh(c=>({...c,name:e.target.value}))} placeholder="Enter character name..." style={{fontSize:"1.1rem"}}/></div>
      <div className="g2"><div><label>Race</label>
        <select value={ch.race} onChange={e=>setCh(c=>({...c,race:e.target.value}))}>{Object.keys(RACES).map(r=><option key={r}>{r}</option>)}</select>
        {race&&<div className="mt" style={{padding:10,background:"rgba(0,0,0,.18)",borderRadius:4}}>
          <div className="ts td2">{race.desc}</div>
          <div className="ts mt"><b>Speed:</b> {race.sp}ft | <b>Size:</b> {race.sz}{race.dv?` | Darkvision: ${race.dv}ft`:""}</div>
          <div className="ts"><b>Traits:</b> {race.tr.join(", ")}</div>
          <div className="ts"><b>Bonuses:</b> {Object.entries(race.ab).map(([k,v])=>`${k}+${v}`).join(", ")||"Flexible"}</div>
        </div>}
      </div><div><label>Alignment</label><select value={ch.align} onChange={e=>setCh(c=>({...c,align:e.target.value}))}>{ALIGNMENTS.map(a=><option key={a}>{a}</option>)}</select></div></div>
    </div></div>}

    {step===1&&<div className="pnl afu"><label>Class</label>
      <select value={ch.cls} onChange={e=>setCh(c=>({...c,cls:e.target.value}))}>{Object.keys(CLASSES).map(c=><option key={c}>{c}</option>)}</select>
      {cls&&<div className="mm" style={{padding:14,background:"rgba(0,0,0,.18)",borderRadius:4}}>
        <div className="ts td2">{cls.desc}</div>
        <div className="g2 mt" style={{fontSize:".85rem"}}>
          <div><b>Hit Die:</b> d{cls.hd}</div><div><b>Primary:</b> {cls.pa}</div>
          <div><b>Saves:</b> {cls.st.join(", ")}</div><div><b>Armor:</b> {cls.ap}</div>
          <div><b>Weapons:</b> {cls.wp}</div><div><b>Skills:</b> Choose {cls.ns}</div>
        </div>
        {cls.ft?.[1]&&<div className="mm"><b className="ts">Level 1:</b><div className="fr gs mt">{cls.ft[1].map(f=><span key={f} className="bdg bdg-g">{f}</span>)}</div></div>}
        {cls.sc&&<div className="mt bdg bdg-a">✨ Spellcaster — {cls.sa}</div>}
      </div>}
    </div>}

    {step===2&&<div className="pnl afu"><label>Background</label>
      <select value={ch.bg} onChange={e=>setCh(c=>({...c,bg:e.target.value}))}>{Object.keys(BACKGROUNDS).map(b=><option key={b}>{b}</option>)}</select>
      {bg&&<div className="mm" style={{padding:14,background:"rgba(0,0,0,.18)",borderRadius:4}}>
        <div><b>Skills:</b> {bg.sk.join(", ")}</div>
        <div><b>Equipment:</b> {bg.eq}</div>
        <div className="mt"><b>Feature:</b> <span className="tg">{bg.feat}</span></div>
      </div>}
    </div>}

    {step===3&&<div className="pnl afu"><h3 className="mb">Ability Scores</h3>
      <StatGen stats={ch.stats} setStats={s=>setCh(c=>({...c,stats:typeof s==="function"?s(c.stats):s}))}/>
    </div>}

    {step===4&&<div className="pnl afu"><div className="g2">
      <div><h3 className="mb">Skills (Choose {cls?.ns||2})</h3>
        <div className="fc" style={{maxHeight:380,overflowY:"auto"}}>
          {(cls?.sk||[]).map(sk=>{const bgSk=bg?.sk?.includes(sk);return <label key={sk} className="ck">
            <input type="checkbox" checked={ch.skills.includes(sk)||bgSk} disabled={bgSk}
              onChange={e=>{if(bgSk)return;setCh(c=>({...c,skills:e.target.checked?[...c.skills,sk].slice(0,cls?.ns||2):c.skills.filter(s=>s!==sk)}));}}/>
            <span>{sk}</span><span className="td2 tx">({SKILLS.find(s=>s.name===sk)?.ab})</span>
            {bgSk&&<span className="bdg bdg-g tx">BG</span>}
          </label>;})}
        </div>
      </div>
      {cls?.sc&&<div><h3 className="mb">Spells{cls.ck?` (${cls.ck} cantrips`:""}{cls.skn?`, ${cls.skn} 1st-level)`:cls.ck?")":""}</h3>
        <div className="fc" style={{maxHeight:380,overflowY:"auto"}}>
          {SPELLS.filter(sp=>sp.cls.includes(ch.cls)).map(sp=><label key={sp.n} className="ck">
            <input type="checkbox" checked={ch.spells.some(s=>s.n===sp.n)}
              onChange={e=>setCh(c=>({...c,spells:e.target.checked?[...c.spells,sp]:c.spells.filter(s=>s.n!==sp.n)}))}/>
            <span>{sp.n}</span><span className="bdg bdg-a tx">{sp.l===0?"Cantrip":`Lvl ${sp.l}`}</span>
          </label>)}
        </div>
      </div>}
    </div></div>}

    {step===5&&<div className="pnl afu">
      <h3 className="mb">Character Summary</h3>
      <div className="g2 gl">
        <div>
          <div style={{fontSize:"1.3rem",fontFamily:"Cinzel",fontWeight:700,color:"var(--gold)"}}>{ch.name||"Unnamed Hero"}</div>
          <div className="td2">{ch.race} {ch.cls} • Level {ch.level}</div>
          <div className="td2">{ch.bg} • {ch.align}</div>
          <div className="dv"/>
          <div className="g3 gs">
            <div className="tc"><label>HP</label><div style={{fontSize:"1.4rem",fontWeight:700}}>{cHP()}</div></div>
            <div className="tc"><label>AC</label><div style={{fontSize:"1.4rem",fontWeight:700}}>{cAC()}</div></div>
            <div className="tc"><label>Speed</label><div style={{fontSize:"1.4rem",fontWeight:700}}>{race?.sp||30}</div></div>
          </div>
          <div className="dv"/>
          <div className="ts"><b>Initiative:</b> {ms(aMod(tStats.DEX))}</div>
          <div className="ts"><b>Proficiency:</b> +{pb(1)}</div>
          <div className="ts"><b>Passive Perception:</b> {10+aMod(tStats.WIS)+(ch.skills.includes("Perception")?pb(1):0)}</div>
          <div className="ts"><b>Saves:</b> {cls?.st?.join(", ")}</div>
          {ch.skills.length>0&&<div className="ts"><b>Skills:</b> {ch.skills.join(", ")}</div>}
          {ch.spells.length>0&&<div className="ts"><b>Spells:</b> {ch.spells.map(s=>s.n).join(", ")}</div>}
        </div>
        <div>
          <div className="g6 gs">{ABILITIES.map(ab=><div key={ab} className="abx">
            <div className="abl">{ab}</div><div className="abs" style={{fontSize:"1.3rem"}}>{tStats[ab]}</div>
            <div className="abm" style={{width:28,height:28,fontSize:".8rem"}}>{ms(aMod(tStats[ab]))}</div>
          </div>)}</div>
          {race?.tr?.length>0&&<div className="mm"><label>Racial Traits</label><div className="fr gs mt">{race.tr.map(t=><span key={t} className="bdg bdg-g">{t}</span>)}</div></div>}
          {cls?.ft?.[1]&&<div className="mm"><label>Class Features</label><div className="fr gs mt">{cls.ft[1].map(f=><span key={f} className="bdg bdg-a">{f}</span>)}</div></div>}
        </div>
      </div>
      <div className="dv"/><div className="tc"><button className="btn bp bl" onClick={fin}>⚔️ Complete Character</button></div>
    </div>}

    <div className="fb ml">
      <button className="btn" onClick={()=>setSt(Math.max(0,step-1))} disabled={step===0}>← Back</button>
      <span className="td2 ts">Step {step+1}/{steps.length}</span>
      <button className="btn" onClick={()=>setSt(Math.min(steps.length-1,step+1))} disabled={step===steps.length-1}>Next →</button>
    </div>
  </div>;
}

function CharSheet({ch,onUp}) {
  const [tab,setTab]=useState("stats");
  const {addMsg,pn}=useContext(AppCtx);
  const cls=CLASSES[ch.cls];const p=pb(ch.level||1);

  const rollAb=(ab)=>{const m=aMod(ch.stats[ab]),r=rd(20);addMsg("roll",`${ABILITY_FULL[ab]} check: ${r} ${ms(m)} = ${r+m}${r===20?" ✨NAT 20!":""}${r===1?" 💀NAT 1!":""}`);}
  const rollSv=(ab)=>{const m=aMod(ch.stats[ab])+(ch.st?.includes(ab)?p:0),r=rd(20);addMsg("roll",`${ABILITY_FULL[ab]} save: ${r} ${ms(m)} = ${r+m}`);}
  const rollSk=(sk)=>{const ab=SKILLS.find(s=>s.name===sk)?.ab||"STR",m=aMod(ch.stats[ab])+(ch.skills?.includes(sk)?p:0),r=rd(20);addMsg("roll",`${sk}: ${r} ${ms(m)} = ${r+m}`);}
  const rollInit=()=>{const m=aMod(ch.stats.DEX),r=rd(20);addMsg("roll",`Initiative: ${r} ${ms(m)} = ${r+m}`);}
  const hpp=ch.mhp>0?Math.max(0,(ch.hp/ch.mhp)*100):100;
  const hpc=hpp>50?"hpg":hpp>25?"hpy":"hpr";

  return <div className="pnl">
    <div className="fb mb"><div>
      <h2 style={{marginBottom:0}}>{ch.name||"Unnamed"}</h2>
      <div className="td2 ts">{ch.race} {ch.cls} • Level {ch.level} • {ch.align}</div>
    </div><div className="fr gs">
      <button className="btn bs" onClick={()=>{
        const newLv=ch.level+1;if(newLv>20)return;
        const hitDie=CLASSES[ch.cls]?.hd||8;const hpGain=rd(hitDie)+aMod(ch.stats.CON);
        const newMaxHp=ch.mhp+Math.max(1,hpGain);
        onUp({...ch,level:newLv,mhp:newMaxHp,hp:newMaxHp,pb:pb(newLv)});
        addMsg("system",`🎉 ${ch.name} levels up to ${newLv}! +${Math.max(1,hpGain)} HP (now ${newMaxHp}). Proficiency: +${pb(newLv)}`);
      }}>⬆️ Level Up</button>
      <button className="btn bs" onClick={rollInit}>🎲 Initiative</button>
    </div></div>

    <div className="mb">
      <div className="fb ts" style={{marginBottom:3}}>
        <span>HP: {ch.hp}/{ch.mhp}{ch.thp>0?` (+${ch.thp})`:""}</span>
        <div className="fr gs">
          <button className="btn bs bd" onClick={()=>{const d=parseInt(prompt("Damage amount:"));if(!isNaN(d)&&d>0)onUp({...ch,hp:Math.max(0,ch.hp-d)});}}>−HP</button>
          <button className="btn bs" style={{borderColor:"var(--nat)",color:"#4a9a4a"}} onClick={()=>{const h=parseInt(prompt("Heal amount:"));if(!isNaN(h)&&h>0)onUp({...ch,hp:Math.min(ch.mhp,ch.hp+h)});}}>+HP</button>
        </div>
      </div>
      <div className="hpbg"><div className={`hpf ${hpc}`} style={{width:`${hpp}%`}}/></div>
    </div>

    <div className="g3 mb" style={{textAlign:"center"}}>
      <div className="abx" onClick={rollInit}><div className="abl">AC</div><div className="abs">{ch.ac}</div></div>
      <div className="abx"><div className="abl">Speed</div><div className="abs">{ch.speed||30}</div></div>
      <div className="abx"><div className="abl">Prof</div><div className="abs">+{p}</div></div>
    </div>

    <div className="tabs mb">{["stats","skills","spells","inventory","features"].map(t=>
      <button key={t} className={`tab ${tab===t?"a":""}`} onClick={()=>setTab(t)}>{t[0].toUpperCase()+t.slice(1)}</button>)}</div>

    {tab==="stats"&&<div className="afu">
      <div className="g6 mb">{ABILITIES.map(ab=><div key={ab} className="abx" onClick={()=>rollAb(ab)} title={`Roll ${ABILITY_FULL[ab]}`}>
        <div className="abl">{ab}</div><div className="abs">{ch.stats[ab]}</div><div className="abm">{ms(aMod(ch.stats[ab]))}</div>
      </div>)}</div>
      <h3 className="mb">Saving Throws</h3>
      <div className="g3 gs">{ABILITIES.map(ab=>{const prof=ch.st?.includes(ab),m=aMod(ch.stats[ab])+(prof?p:0);
        return <div key={ab} className="fr" style={{cursor:"pointer",padding:"3px 6px",borderRadius:4,background:prof?"rgba(201,168,76,.06)":"transparent"}} onClick={()=>rollSv(ab)}>
          <span style={{width:5,height:5,borderRadius:"50%",background:prof?"var(--gold)":"var(--inkf)"}}/><span className="ts">{ABILITY_FULL[ab]}</span>
          <span className="ts tg" style={{marginLeft:"auto"}}>{ms(m)}</span>
        </div>;})}</div>
      {ch.hp===0&&<div className="mm pnl" style={{borderColor:"var(--red)"}}>
        <h3 className="tr">💀 Death Saves</h3>
        <div className="fr mt"><span className="ts" style={{minWidth:70}}>Success:</span>{[0,1,2].map(i=><div key={`s${i}`} className={`dsb ${i<(ch.ds?.s||0)?"ok":""}`} onClick={()=>onUp({...ch,ds:{...ch.ds,s:Math.min(3,(ch.ds?.s||0)+1)}})}/>)}</div>
        <div className="fr mt"><span className="ts" style={{minWidth:70}}>Failure:</span>{[0,1,2].map(i=><div key={`f${i}`} className={`dsb ${i<(ch.ds?.f||0)?"fl":""}`} onClick={()=>onUp({...ch,ds:{...ch.ds,f:Math.min(3,(ch.ds?.f||0)+1)}})}/>)}</div>
        <button className="btn bs mt" onClick={()=>{const r=rd(20),s=ch.ds?.s||0,f=ch.ds?.f||0;
          if(r===20){addMsg("roll","Death Save: NAT 20! Regains 1 HP!");onUp({...ch,hp:1,ds:{s:0,f:0}});}
          else if(r===1){addMsg("roll","Death Save: NAT 1! Two failures!");onUp({...ch,ds:{s,f:Math.min(3,f+2)}});}
          else if(r>=10){addMsg("roll",`Death Save: ${r} — Success (${s+1}/3)`);onUp({...ch,ds:{s:Math.min(3,s+1),f}});}
          else{addMsg("roll",`Death Save: ${r} — Failure (${f+1}/3)`);onUp({...ch,ds:{s,f:Math.min(3,f+1)}});}
        }}>🎲 Roll Death Save</button>
      </div>}
    </div>}

    {tab==="skills"&&<div className="afu fc">{SKILLS.map(sk=>{const prof=ch.skills?.includes(sk.name),m=aMod(ch.stats[sk.ab])+(prof?p:0);
      return <div key={sk.name} className="fr" style={{cursor:"pointer",padding:"2px 6px",borderRadius:4}} onClick={()=>rollSk(sk.name)}>
        <span style={{width:5,height:5,borderRadius:"50%",background:prof?"var(--gold)":"var(--inkf)",flexShrink:0}}/><span className="ts" style={{flex:1}}>{sk.name}</span>
        <span className="tx td2">{sk.ab}</span><span className="ts tg" style={{minWidth:28,textAlign:"right"}}>{ms(m)}</span>
      </div>;})}
      <div className="mm ts td2">Passive Perception: <b className="tg">{ch.pp||10+aMod(ch.stats.WIS)}</b></div>
    </div>}

    {tab==="spells"&&<div className="afu">{ch.spells?.length>0||cls?.sc?<div className="fc">
      {cls?.sa&&<div className="fr mb"><span className="bdg bdg-a">Ability: {cls.sa}</span>
        <span className="bdg bdg-a">Save DC: {8+p+aMod(ch.stats[cls.sa])}</span>
        <span className="bdg bdg-a">Attack: {ms(p+aMod(ch.stats[cls.sa]))}</span></div>}
      {cls?.sl?.[1]&&cls.sl[1][0]>0&&<div className="fr mb gs"><label>Spell Slots (Lv1):</label>
        {Array.from({length:cls.sl[1][0]}).map((_,si)=><span key={si} className={`bdg ${si<(ch.usedSlots||0)?"bdg-r":"bdg-a"}`} style={{cursor:"pointer",width:28,textAlign:"center"}} 
          onClick={()=>onUp({...ch,usedSlots:si<(ch.usedSlots||0)?(ch.usedSlots||0)-1:(ch.usedSlots||0)+1})}>{si<(ch.usedSlots||0)?"✕":"○"}</span>)}
        <button className="btn bs" onClick={()=>onUp({...ch,usedSlots:0})}>Reset</button>
      </div>}
      {[0,1,2,3,4,5,6,7,8,9].map(lv=>{const sps=ch.spells.filter(s=>s.l===lv);if(!sps.length)return null;
        return <div key={lv} className="mb"><h3 style={{fontSize:".85rem"}}>{lv===0?"Cantrips":`Level ${lv}`}</h3>
          <div className="fc gs mt">{sps.map(sp=><SpellCard key={sp.n} sp={sp}/>)}</div></div>;})}
    </div>:<div className="tc td2" style={{padding:36}}>{cls?.sc?"No spells selected.":"Not a spellcaster."}</div>}</div>}

    {tab==="inventory"&&<div className="afu">
      <div className="fb mb"><h3>Equipment</h3><div className="fr gs">
        <span className="bdg bdg-g" style={{cursor:"pointer"}} onClick={()=>{const g=prompt("Set gold:",ch.gold||0);const gv=parseInt(g);if(!isNaN(gv)&&gv>=0)onUp({...ch,gold:gv});}}>💰 {ch.gold||0} gp</span>
        <button className="btn bs" onClick={()=>{const i=prompt("Add item:");if(i)onUp({...ch,equip:[...(ch.equip||[]),i]});}}>+ Add</button>
      </div></div>
      {(ch.equip||[]).length>0?<div className="fc">{ch.equip.map((it,i)=><div key={i} className="fb" style={{padding:"3px 0",borderBottom:"1px solid rgba(201,168,76,.08)"}}>
        <span className="ts">{typeof it === 'string' ? it : it.name || it}</span><button className="btn bs bg td2" onClick={()=>onUp({...ch,equip:ch.equip.filter((_,j)=>j!==i)})}>✕</button>
      </div>)}</div>:<div className="tc td2" style={{padding:36}}>Empty inventory.</div>}
    </div>}

    {tab==="features"&&<div className="afu fc gl">
      <div><h3>Rest</h3><div className="fr gs mt">
        <button className="btn" onClick={()=>{
          const hitDie=CLASSES[ch.cls]?.hd||8;const roll=rd(hitDie)+aMod(ch.stats.CON);const healed=Math.max(1,roll);
          const newHp=Math.min(ch.mhp,ch.hp+healed);onUp({...ch,hp:newHp});
          addMsg("roll",`${ch.name} takes a Short Rest: heals 1d${hitDie}${ms(aMod(ch.stats.CON))} = ${healed} HP (now ${newHp}/${ch.mhp})`);
        }}>☕ Short Rest (1 Hit Die)</button>
        <button className="btn bp" onClick={()=>{onUp({...ch,hp:ch.mhp,usedSlots:0,ds:{s:0,f:0}});
          addMsg("system",`${ch.name} takes a Long Rest: full HP restored, spell slots reset.`);
        }}>🛏️ Long Rest (Full Heal)</button>
      </div></div>
      <div className="dv"/>
      {ch.traits?.length>0&&<div><h3>Racial Traits</h3><div className="fr gs mt">{ch.traits.map(t=><span key={t} className="bdg bdg-g">{t}</span>)}</div></div>}
      {ch.feats?.length>0&&<div><h3>Class Features</h3><div className="fr gs mt">{ch.feats.map(f=><span key={f} className="bdg bdg-a">{f}</span>)}</div></div>}
      {ch.conds?.length>0&&<div><h3>Conditions</h3><div className="fr gs mt">{ch.conds.map(c=>{const cd=CONDITIONS.find(x=>x.n===c);
        return <span key={c} className="bdg bdg-r" style={{cursor:"pointer"}} title={cd?.d} onClick={()=>onUp({...ch,conds:ch.conds.filter(x=>x!==c)})}>{cd?.i} {c} ✕</span>;})}</div></div>}
      <div className="fr gs" style={{flexWrap:"wrap"}}>{CONDITIONS.map(cd=>
        <button key={cd.n} className="btn bs" style={{fontSize:".6rem",padding:"2px 6px"}} title={cd.d}
          onClick={()=>{if(!(ch.conds||[]).includes(cd.n))onUp({...ch,conds:[...(ch.conds||[]),cd.n]});}}>{cd.i} {cd.n}</button>
      )}</div>
    </div>}
  </div>;
}

function SpellCard({sp}) {
  const [open,setOpen]=useState(false);
  return <div className="sc" onClick={()=>setOpen(!open)}>
    <div className="fb"><b>{sp.n}</b><div className="fr gs"><span className="bdg bdg-a tx">{sp.l===0?"Cantrip":`Lvl ${sp.l}`}</span>{sp.c&&<span className="bdg bdg-r tx">C</span>}</div></div>
    {open&&<div className="mt afu"><div className="ts">{sp.d}</div>
      <div className="tx td2 mt"><b>Cast:</b> {sp.ct} | <b>Range:</b> {sp.rng} | <b>Dur:</b> {sp.dur}</div>
      <div className="tx td2"><b>School:</b> {sp.s} | <b>Classes:</b> {sp.cls.join(", ")}</div></div>}
  </div>;
}

function Combat({chars, mons, syncAction, isDM, combatState}) {
  const {addMsg, pn} = useContext(AppCtx);
  const [targetIdx, setTargetIdx] = useState(null);
  const [attackMode, setAttackMode] = useState(null); // {attackerIdx, atk} when picking target
  const playerName = pn || "Player";
  const {combatants=[], turn=0, round=1, live=false} = combatState || {};

  const updateCombat = useCallback((updates) => {
    syncAction({type:'COMBAT_UPDATE', payload: {...combatState, ...updates}});
  }, [combatState, syncAction]);

  const rollAll = useCallback(() => {
    const e = [];
    chars.forEach(c => {
      const init = rd(20) + aMod(c.stats?.DEX || 10);
      // Build weapon attacks from class
      const cls = CLASSES[c.cls];
      let attacks = [];
      if (c.equip?.length) {
        c.equip.forEach(it => {
          const item = ITEMS.find(x => x.n === it || x.n === it?.name);
          if (item?.dm) {
            const dmMatch = item.dm.match(/(\d+d\d+)([+-]\d+)?/);
            const isFinesse = item.p?.includes("Finesse");
            const sMod = isFinesse ? Math.max(aMod(c.stats.STR), aMod(c.stats.DEX)) : aMod(c.stats.STR);
            attacks.push({n: item.n, b: sMod + pb(c.level||1), dm: item.dm});
          }
        });
      }
      // Default weapons by class if no equipment attacks found
      if (!attacks.length) {
        const sMod = aMod(c.stats?.STR || 10);
        const dMod = aMod(c.stats?.DEX || 10);
        const p = pb(c.level||1);
        const clsWpn = {
          Barbarian:[{n:"Greataxe",b:sMod+p,dm:`1d12+${sMod} slashing`},{n:"Handaxe",b:sMod+p,dm:`1d6+${sMod} slashing`}],
          Fighter:[{n:"Longsword",b:sMod+p,dm:`1d8+${sMod} slashing`},{n:"Longbow",b:dMod+p,dm:`1d8+${dMod} piercing`}],
          Paladin:[{n:"Longsword",b:sMod+p,dm:`1d8+${sMod} slashing`}],
          Ranger:[{n:"Longbow",b:dMod+p,dm:`1d8+${dMod} piercing`},{n:"Shortsword",b:dMod+p,dm:`1d6+${dMod} piercing`}],
          Rogue:[{n:"Rapier",b:dMod+p,dm:`1d8+${dMod} piercing`},{n:"Shortbow",b:dMod+p,dm:`1d6+${dMod} piercing`}],
          Monk:[{n:"Unarmed Strike",b:dMod+p,dm:`1d4+${dMod} bludgeoning`},{n:"Quarterstaff",b:sMod+p,dm:`1d6+${sMod} bludgeoning`}],
          Bard:[{n:"Rapier",b:dMod+p,dm:`1d8+${dMod} piercing`}],
          Cleric:[{n:"Mace",b:sMod+p,dm:`1d6+${sMod} bludgeoning`}],
          Druid:[{n:"Quarterstaff",b:sMod+p,dm:`1d6+${sMod} bludgeoning`}],
          Warlock:[{n:"Dagger",b:dMod+p,dm:`1d4+${dMod} piercing`}],
          Sorcerer:[{n:"Dagger",b:dMod+p,dm:`1d4+${dMod} piercing`}],
          Wizard:[{n:"Quarterstaff",b:sMod+p,dm:`1d6+${sMod} bludgeoning`}],
        };
        attacks = clsWpn[c.cls] || [{n:"Unarmed Strike",b:sMod+p,dm:`1d4+${sMod} bludgeoning`}];
      }
      // Spellcasters get spell attack
      if (cls?.sc && c.spells?.length) {
        const spMod = aMod(c.stats?.[cls.sa] || 10) + pb(c.level||1);
        // Add actual spell attacks from known spells
        c.spells?.forEach(sp => {
          if (sp.d && sp.d.match(/\d+d\d+/) && (sp.ct === "1 action" || sp.ct === "1 bonus action")) {
            const dmMatch = sp.d.match(/(\d+d\d+)/);
            if (dmMatch) {
              const spDmg = dmMatch[1];
              const dmgType = sp.d.includes("fire") ? "fire" : sp.d.includes("cold") ? "cold" : sp.d.includes("radiant") ? "radiant" : sp.d.includes("necrotic") ? "necrotic" : sp.d.includes("force") ? "force" : sp.d.includes("lightning") ? "lightning" : sp.d.includes("thunder") ? "thunder" : sp.d.includes("psychic") ? "psychic" : sp.d.includes("poison") ? "poison" : "magical";
              attacks.push({n: sp.n, b: spMod, dm: `${spDmg} ${dmgType}`});
            }
          }
        });
        if (!attacks.some(a => a.b === spMod)) attacks.push({n:"Spell Attack", b: spMod, dm:`1d10 force`});
      }
      e.push({...c, init, isMon: false, actA: false, actB: false, actR: false, atk: attacks, moved: 0});
    });
    mons.forEach(m => e.push({
      n: m.n, ac: m.ac, hp: m.hp, curHp: m.curHp ?? m.hp, id: m.id || uid(),
      d: m.d, s: m.s, co: m.co, i: m.i, w: m.w, ch: m.ch,
      atk: m.atk || [], tr: m.tr, cr: m.cr, xp: m.xp, sp: m.sp,
      init: rd(20) + aMod(m.d || 10), isMon: true,
      actA: false, actB: false, actR: false, moved: 0
    }));
    e.sort((a, b) => b.init - a.init);
    updateCombat({combatants: e, turn: 0, round: 1, live: true});
    addMsg("system", `⚔️ COMBAT BEGINS! ${e.length} combatants.`);
    e.forEach(c => addMsg("roll", `${c.name||c.n}: Initiative ${c.init}`));
  }, [chars, mons, addMsg, updateCombat]);

  const nextTurn = useCallback(() => {
    if (!combatants.length) return;
    setAttackMode(null); setTargetIdx(null);
    const n = (turn + 1) % combatants.length;
    const newRound = n === 0 ? round + 1 : round;
    if (n === 0) addMsg("system", `📜 Round ${newRound}!`);
    const updated = combatants.map((c, idx) => idx === n ? {...c, actA: false, actB: false, actR: false, moved: 0} : c);
    updateCombat({combatants: updated, turn: n, round: newRound});
    addMsg("system", `➡️ ${updated[n]?.name || updated[n]?.n}'s turn`);
  }, [turn, combatants, round, addMsg, updateCombat]);

  const endCombat = useCallback(() => {
    // Give XP
    const deadMons = combatants.filter(c => c.isMon && (c.curHp ?? c.hp) <= 0);
    const totalXP = deadMons.reduce((s, m) => s + (m.xp || 0), 0);
    if (totalXP > 0) addMsg("system", `🏆 Victory! ${totalXP} XP earned from ${deadMons.length} defeated enemies.`);
    updateCombat({combatants: [], turn: 0, round: 1, live: false});
    addMsg("system", "🏁 Combat ended.");
  }, [combatants, addMsg, updateCombat]);

  const updateCombatant = useCallback((idx, changes) => {
    const updated = combatants.map((c, i) => i === idx ? {...c, ...changes} : c);
    updateCombat({combatants: updated});
  }, [combatants, updateCombat]);

  // ── ATTACK WITH TARGET ──
  const executeAttack = useCallback((attackerIdx, atkData, defenderIdx) => {
    const atk = combatants[attackerIdx];
    const def = combatants[defenderIdx];
    const aName = atk.name || atk.n;
    const dName = def.name || def.n;
    const defAC = def.ac || 10;
    const roll = rd(20);
    const total = roll + (atkData.b || 0);
    const isNat20 = roll === 20;
    const isNat1 = roll === 1;
    const hits = isNat20 || (!isNat1 && total >= defAC);

    let msg = `🗡️ ${aName} attacks ${dName} with ${atkData.n}: 🎲 ${roll}${atkData.b ? ` ${ms(atkData.b)}` : ""} = ${total} vs AC ${defAC}`;
    if (isNat20) msg += " — ✨ CRITICAL HIT!";
    else if (isNat1) msg += " — 💀 CRITICAL MISS!";
    else if (hits) msg += " — HIT!";
    else msg += " — MISS!";
    addMsg("roll", msg);

    // Build all changes in one pass
    let dmgDealt = 0;
    if (hits && atkData.dm && atkData.dm !== "See spell") {
      const dmgMatch = atkData.dm.match(/(\d+)d(\d+)([+-]\d+)?/);
      if (dmgMatch) {
        const [, cnt, sides, modS] = dmgMatch;
        const mod2 = parseInt(modS) || 0;
        let dmgRolls = rdN(parseInt(cnt), parseInt(sides));
        if (isNat20) dmgRolls = [...dmgRolls, ...rdN(parseInt(cnt), parseInt(sides))];
        dmgDealt = Math.max(1, dmgRolls.reduce((a, b) => a + b, 0) + mod2);
        const dmgType = atkData.dm.replace(/[\d\s+d-]+/, '').trim();
        addMsg("roll", `  💥 ${dmgDealt} damage [${dmgRolls.join(",")}${mod2 ? ms(mod2) : ""}] ${dmgType}${isNat20 ? " (CRIT)" : ""}`);
      }
    }

    // Apply ALL changes in one single update
    const updated = combatants.map((c, i) => {
      if (i === attackerIdx) return {...c, actA: true};
      if (i === defenderIdx && dmgDealt > 0) {
        const curHp = c.isMon ? (c.curHp ?? c.hp) : c.hp;
        const newHp = Math.max(0, curHp - dmgDealt);
        if (c.isMon) return {...c, curHp: newHp};
        else return {...c, hp: newHp};
      }
      return c;
    });
    updateCombat({combatants: updated});

    // Sync PC HP back to character sheet
    if (dmgDealt > 0 && !def.isMon && def.id) {
      const newHp = Math.max(0, (def.hp || 0) - dmgDealt);
      syncAction({type:'UPDATE_CHAR', payload: {...def, hp: newHp}});
    }

    if (dmgDealt > 0) {
      const curHp = def.isMon ? (def.curHp ?? def.hp) : def.hp;
      const newHp = Math.max(0, curHp - dmgDealt);
      if (newHp === 0) addMsg("system", `💀 ${dName} drops to 0 HP!`);
    }

    setAttackMode(null);
    setTargetIdx(null);
  }, [combatants, updateCombat, addMsg, syncAction]);

  const rollSave = useCallback((idx, ability) => {
    const c = combatants[idx];
    const abMap = {STR:'s',DEX:'d',CON:'co',INT:'i',WIS:'w',CHA:'ch'};
    const score = c.stats?.[ability] || c[abMap[ability]] || 10;
    const mod = aMod(score);
    const prof = (c.st || c.savingThrows || []).includes(ability) ? pb(c.level || 1) : 0;
    const roll = rd(20);
    const total = roll + mod + prof;
    addMsg("roll", `${c.name||c.n} ${ability} Save: 🎲 ${roll} ${ms(mod+prof)} = ${total}`);
  }, [combatants, addMsg]);

  const dealDamage = useCallback((idx, amount) => {
    if (!amount || amount <= 0) return;
    const c = combatants[idx];
    const cName = c.name || c.n;
    const curHp = c.isMon ? (c.curHp ?? c.hp) : c.hp;
    const newHp = Math.max(0, curHp - amount);
    const updated = combatants.map((x, i) => {
      if (i !== idx) return x;
      return c.isMon ? {...x, curHp: newHp} : {...x, hp: newHp};
    });
    updateCombat({combatants: updated});
    if (!c.isMon && c.id) syncAction({type:'UPDATE_CHAR', payload: {...c, hp: newHp}});
    addMsg("system", `💥 ${cName} takes ${amount} damage! (${newHp} HP)`);
    if (newHp === 0) addMsg("system", `💀 ${cName} drops to 0 HP!`);
  }, [combatants, updateCombat, addMsg, syncAction]);

  const healTarget = useCallback((idx, amount) => {
    if (!amount || amount <= 0) return;
    const c = combatants[idx];
    const cName = c.name || c.n;
    const maxHp = c.isMon ? c.hp : c.mhp;
    const curHp = c.isMon ? (c.curHp ?? c.hp) : c.hp;
    const newHp = Math.min(maxHp, curHp + amount);
    const updated = combatants.map((x, i) => {
      if (i !== idx) return x;
      return c.isMon ? {...x, curHp: newHp} : {...x, hp: newHp};
    });
    updateCombat({combatants: updated});
    if (!c.isMon && c.id) syncAction({type:'UPDATE_CHAR', payload: {...c, hp: newHp}});
    addMsg("system", `💚 ${cName} heals ${amount}! (${newHp} HP)`);
  }, [combatants, updateCombat, addMsg, syncAction]);

  const removeCombatant = useCallback((idx) => {
    const c = combatants[idx];
    const updated = combatants.filter((_, i) => i !== idx);
    const newTurn = idx < turn ? turn - 1 : (idx === turn && turn >= updated.length ? 0 : turn);
    updateCombat({combatants: updated, turn: newTurn});
    addMsg("system", `❌ ${c.name||c.n} removed.`);
  }, [combatants, turn, updateCombat, addMsg]);

  // Check if all monsters or all PCs dead
  const totalMons = combatants.filter(c => c.isMon).length;
  const totalPCs = combatants.filter(c => !c.isMon).length;
  const monsAlive = combatants.filter(c => c.isMon && (c.curHp ?? c.hp) > 0).length;
  const pcsAlive = combatants.filter(c => !c.isMon && c.hp > 0).length;
  const showVictory = totalMons > 0 && monsAlive === 0;
  const showDefeat = totalPCs > 0 && pcsAlive === 0;

  return <div className="pnl">
    <div className="ph"><h3>⚔️ Combat {live ? `(${totalPCs}v${totalMons})` : ""}</h3><div className="fr gs">
      {!live ? (
        <div className="fr gs">
          <button className="btn bp bs" onClick={rollAll} disabled={!mons.length}>
            🎲 Roll Initiative ({chars.length} PCs vs {mons.length} monsters)
          </button>
          {!chars.length && <span className="tx tr">⚠️ No characters! Create one in the Character tab first.</span>}
        </div>
      ) : (<>
        <span className="bdg bdg-r">Round {round}</span>
        <span className="bdg bdg-g">{pcsAlive} PCs / {monsAlive} Monsters</span>
        <button className="btn bs" onClick={nextTurn}>Next Turn →</button>
        <button className="btn bs bd" onClick={endCombat}>End</button>
        {isDM && <button className="btn bs" onClick={() => {
          // Add any chars/mons not already in combat
          let added = 0;
          const ids = new Set(combatants.map(c => c.id));
          const newCmbs = [...combatants];
          chars.forEach(c => {
            if (!ids.has(c.id)) {
              const cls2 = CLASSES[c.cls];
              const sMod2 = aMod(c.stats?.STR||10), dMod2 = aMod(c.stats?.DEX||10), p2 = pb(c.level||1);
              let atk2 = [];
              const clsW = {Barbarian:[{n:"Greataxe",b:sMod2+p2,dm:`1d12+${sMod2} slashing`}],Fighter:[{n:"Longsword",b:sMod2+p2,dm:`1d8+${sMod2} slashing`}],Rogue:[{n:"Rapier",b:dMod2+p2,dm:`1d8+${dMod2} piercing`}],Ranger:[{n:"Longbow",b:dMod2+p2,dm:`1d8+${dMod2} piercing`}],Bard:[{n:"Rapier",b:dMod2+p2,dm:`1d8+${dMod2} piercing`}],Cleric:[{n:"Mace",b:sMod2+p2,dm:`1d6+${sMod2} bludgeoning`}],Paladin:[{n:"Longsword",b:sMod2+p2,dm:`1d8+${sMod2} slashing`}],Monk:[{n:"Unarmed",b:dMod2+p2,dm:`1d4+${dMod2} bludgeoning`}],Druid:[{n:"Staff",b:sMod2+p2,dm:`1d6+${sMod2} bludgeoning`}],Warlock:[{n:"Eldritch Blast",b:aMod(c.stats?.CHA||10)+p2,dm:"1d10 force"}],Sorcerer:[{n:"Fire Bolt",b:aMod(c.stats?.CHA||10)+p2,dm:"1d10 fire"}],Wizard:[{n:"Fire Bolt",b:aMod(c.stats?.INT||10)+p2,dm:"1d10 fire"}]};
              atk2 = clsW[c.cls] || [{n:"Unarmed",b:sMod2+p2,dm:`1d4+${sMod2} bludgeoning`}];
              if(cls2?.sc&&c.spells?.length){c.spells.forEach(sp=>{if(sp.d?.match(/\d+d\d+/)&&(sp.ct==="1 action"||sp.ct==="1 bonus action")){const dm=sp.d.match(/(\d+d\d+)/);if(dm)atk2.push({n:sp.n,b:aMod(c.stats?.[cls2.sa]||10)+p2,dm:`${dm[1]} magical`});}});}
              const init2 = rd(20)+aMod(c.stats?.DEX||10);
              newCmbs.push({...c,init:init2,isMon:false,actA:false,actB:false,actR:false,atk:atk2,moved:0});
              added++;
              addMsg("roll",`${c.name} joins combat! Initiative: ${init2}`);
            }
          });
          mons.forEach(m => {
            if (!ids.has(m.id)) {
              const init2 = rd(20)+aMod(m.d||10);
              newCmbs.push({n:m.n,ac:m.ac,hp:m.hp,curHp:m.curHp??m.hp,id:m.id||uid(),d:m.d,s:m.s,co:m.co,i:m.i,w:m.w,ch:m.ch,atk:m.atk||[],tr:m.tr,cr:m.cr,xp:m.xp,sp:m.sp,init:init2,isMon:true,actA:false,actB:false,actR:false,moved:0});
              added++;
              addMsg("roll",`${m.n} joins combat! Initiative: ${init2}`);
            }
          });
          if (added > 0) {
            newCmbs.sort((a,b) => b.init - a.init);
            updateCombat({combatants: newCmbs});
            addMsg("system",`${added} combatant${added>1?"s":""} added!`);
          } else addMsg("system","All characters and monsters are already in combat.");
        }}>+ Add Missing</button>}
      </>)}
    </div></div>

    {/* Target selection banner */}
    {attackMode && <div style={{background:"rgba(139,26,26,.15)",border:"1px solid rgba(139,26,26,.3)",borderRadius:5,padding:"8px 12px",marginBottom:8,textAlign:"center"}}>
      <span className="ts tr">🎯 Select a target for <b>{attackMode.atk.n}</b></span>
      <button className="btn bs ml" style={{marginLeft:12}} onClick={()=>{setAttackMode(null);setTargetIdx(null);}}>Cancel</button>
    </div>}

    {live && combatants.length > 0 ? <>
      {(showVictory || showDefeat) && <div className="pnl mb tc" style={{background: showVictory ? "rgba(58,138,74,.1)" : "rgba(139,26,26,.1)", borderColor: showVictory ? "rgba(58,138,74,.3)" : "rgba(139,26,26,.3)"}}>
        <div style={{fontSize:"1.5rem"}}>{showVictory ? "🏆" : "💀"}</div>
        <h3>{showVictory ? "Victory!" : "Defeat..."}</h3>
        <button className="btn bp bs mm" onClick={endCombat}>{showVictory ? "Collect Rewards" : "End Combat"}</button>
      </div>}
      <div className="fc" style={{gap:2}}>
      {combatants.map((c, i) => {
        const act = i === turn;
        const hp = c.isMon ? (c.curHp ?? c.hp) : c.hp;
        const mx = c.isMon ? c.hp : c.mhp;
        const pct = mx > 0 ? Math.max(0, (hp / mx) * 100) : 0;
        const isDead = hp <= 0;
        const cName = c.name || c.n;
        const isTarget = attackMode && i !== attackMode.attackerIdx && !isDead;

        return <div key={c.id || i}
          className={`ii ${act ? "act" : ""}`}
          onClick={() => { if (attackMode && isTarget) executeAttack(attackMode.attackerIdx, attackMode.atk, i); }}
          style={{
            opacity: isDead ? 0.35 : 1,
            borderLeft: act ? "3px solid var(--gold)" : "3px solid transparent",
            paddingLeft: 8,
            cursor: isTarget ? "crosshair" : "default",
            background: isTarget ? "rgba(139,26,26,.08)" : "transparent",
            outline: isTarget ? "1px dashed var(--redb)" : "none"
          }}>
          <div className="io">{c.init}</div>
          <div style={{flex:1}}>
            <div className="fb">
              <span style={{fontFamily:"Cinzel",fontWeight:600,color:c.isMon?"var(--redb)":"var(--ink)",fontSize:".9rem"}}>
                {c.isMon?"👹":"🛡️"} {cName} {isDead?"💀":""}
                {isTarget && <span className="tr" style={{fontSize:".7rem"}}> ← Click to target</span>}
              </span>
              <span className="tx td2">AC {c.ac}</span>
            </div>
            <div className="hpbg" style={{height:8,marginTop:3}}>
              <div className={`hpf ${pct>50?"hpg":pct>25?"hpy":"hpr"}`} style={{width:`${pct}%`}}/>
            </div>
            <div className="tx td2">{hp}/{mx} HP
              {c.tr?.length > 0 && <span className="td2"> | {c.tr.slice(0,2).join(", ")}</span>}
              {c.isMon && isDM && c.atk?.length > 0 && !act && <span className="td2"> | {c.atk.map(a=>`${a.n}+${a.b}`).join(", ")}</span>}
            </div>

            {(act || (c.isMon && isDM)) && !isDead && !attackMode && <div className="mm" style={{padding:"6px 0"}}>
              <div className="fr gs" style={{marginBottom:6}}>
                <span className={`bdg ${c.actA?"bdg-g":"bdg-r"}`} style={{cursor:"pointer"}}
                  onClick={()=>updateCombatant(i,{actA:!c.actA})}>{c.actA?"✓":"○"} Action</span>
                <span className={`bdg ${c.actB?"bdg-g":"bdg-r"}`} style={{cursor:"pointer"}}
                  onClick={()=>updateCombatant(i,{actB:!c.actB})}>{c.actB?"✓":"○"} Bonus</span>
                <span className={`bdg ${c.actR?"bdg-g":"bdg-r"}`} style={{cursor:"pointer"}}
                  onClick={()=>updateCombatant(i,{actR:!c.actR})}>{c.actR?"✓":"○"} Reaction</span>
                <span className="bdg bdg-g tx">Move: {c.moved||0}/{c.speed||30}ft</span>
              </div>

              {/* ATTACKS — click to pick target */}
              {c.atk?.length > 0 && <div style={{marginBottom:6}}>
                <label style={{fontSize:".6rem"}}>Attacks (click then pick target):</label>
                <div className="fr gs mt">{c.atk.map((atk, ai) => (
                  <button key={ai} className="btn bs" style={{borderColor:"var(--redb)",color:"var(--redb)"}}
                    onClick={() => setAttackMode({attackerIdx: i, atk})}
                    title={`+${atk.b} to hit, ${atk.dm}${atk.r ? ` (${atk.r})` : ''}`}>
                    🗡️ {atk.n} <span className="tg">(+{atk.b}, {atk.dm})</span>
                  </button>
                ))}</div>
              </div>}

              <div className="fr gs">
                <button className="btn bs" onClick={()=>{const r=rd(20);addMsg("roll",`${cName} d20: ${r}${r===20?" ✨NAT 20!":""}${r===1?" 💀NAT 1!":""}`);}}>🎲 d20</button>
                <button className="btn bs" onClick={()=>rollSave(i,"STR")}>STR</button>
                <button className="btn bs" onClick={()=>rollSave(i,"DEX")}>DEX</button>
                <button className="btn bs" onClick={()=>rollSave(i,"CON")}>CON</button>
                <button className="btn bs" onClick={()=>rollSave(i,"INT")}>INT</button>
                <button className="btn bs" onClick={()=>rollSave(i,"WIS")}>WIS</button>
                <button className="btn bs" onClick={()=>rollSave(i,"CHA")}>CHA</button>
                <button className="btn bs" onClick={()=>{updateCombatant(i,{actA:true});addMsg("system",`${cName} takes the Dodge action — attacks against have disadvantage.`);}}>🛡️ Dodge</button>
                <button className="btn bs" onClick={()=>{addMsg("system",`${cName} dashes — movement doubled this turn.`);updateCombatant(i,{actA:true});}}>🏃 Dash</button>
              </div>
            </div>}
          </div>

          {!attackMode && <div className="fc gs" style={{alignItems:"center",minWidth:70}}>
            <div className="fr gs">
              <button className="btn bs bd" style={{padding:"2px 8px",fontSize:".7rem"}} onClick={(e)=>{e.stopPropagation();
                const d=prompt(`Damage to ${cName}:`);const dv=parseInt(d);if(!isNaN(dv)&&dv>0) dealDamage(i,dv);
              }}>−HP</button>
              <button className="btn bs" style={{padding:"2px 8px",fontSize:".7rem",borderColor:"var(--nat)",color:"#4a9a4a"}} onClick={(e)=>{e.stopPropagation();
                const h=prompt(`Heal ${cName}:`);const hv=parseInt(h);if(!isNaN(hv)&&hv>0) healTarget(i,hv);
              }}>+HP</button>
            </div>
            {isDM && <button className="btn bs bg tx" style={{padding:"1px 4px",fontSize:".55rem"}} onClick={(e)=>{e.stopPropagation();removeCombatant(i);}}>Remove</button>}
          </div>}
        </div>;
      })}
    </div></> : !live ? (
      <div style={{padding:24}}>
        <div className="tc td2 mb">
          {chars.length === 0 && mons.length === 0
            ? "Create characters on the Character tab and trigger an encounter from the Play tab."
            : <><span>{chars.length} PC{chars.length!==1?"s":""} and {mons.length} monster{mons.length!==1?"s":""} ready.</span>
              <br/><span className="tx">Click "Roll Initiative" above to start combat.</span></>}
        </div>
        {chars.length > 0 && <div className="mb"><label>Party</label>
          <div className="fc gs mt">{chars.map(c=>{const hpp=c.mhp>0?Math.max(0,(c.hp/c.mhp)*100):100;return <div key={c.id} className="fr ts" style={{padding:"4px 6px"}}>
            🛡️ <b>{c.name}</b> <span className="td2">{c.race} {c.cls} Lv{c.level} | AC {c.ac}</span>
            <div style={{flex:1,maxWidth:100}}><div className="hpbg" style={{height:6}}><div className={`hpf ${hpp>50?"hpg":hpp>25?"hpy":"hpr"}`} style={{width:`${hpp}%`}}/></div></div>
            <span className="tx">{c.hp}/{c.mhp}</span>
          </div>})}</div></div>}
        {mons.length > 0 && <div><label>Monsters</label>
          <div className="fc gs mt">{mons.map((m,i)=><div key={m.id||i} className="fr ts" style={{padding:"2px 6px"}}>👹 <b>{m.n}</b> <span className="td2">CR {m.cr} | AC {m.ac} | {m.hp} HP | {m.atk?.map(a=>`${a.n}+${a.b}`).join(", ")}</span></div>)}</div></div>}
      </div>
    ) : null}
  </div>;
}

function BattleMap({chars, mons, combatState, syncAction, camp, sceneData}) {
  const {addMsg} = useContext(AppCtx);
  const [fog, setFog] = useState(new Set());
  const [fogM, setFogM] = useState(false);
  const [sel, setSel] = useState(null);
  const [wallM, setWallM] = useState(false);
  const [customWalls, setCustomWalls] = useState(new Set());
  const cols = 24, rows = 18;

  // Get current scene map data
  const scenes = camp?.scenes || [];
  const sceneIdx = sceneData?.sceneIdx || 0;
  const scene = scenes[sceneIdx];
  const sceneMap = scene?.map;

  // Terrain colors by type
  const terrainStyles = {
    dungeon: {floor:"rgba(50,40,28,.65)",wall:"rgba(85,70,50,.92)",void:"rgba(8,6,4,.9)",grid:"rgba(201,168,76,.05)"},
    cave: {floor:"rgba(45,38,32,.6)",wall:"rgba(75,60,45,.88)",void:"rgba(10,8,5,.9)",grid:"rgba(140,120,80,.05)"},
    town: {floor:"rgba(55,50,35,.5)",wall:"rgba(90,75,55,.85)",void:"rgba(30,45,20,.4)",grid:"rgba(201,168,76,.06)"},
    road: {floor:"rgba(50,45,30,.45)",wall:"rgba(30,55,25,.7)",void:"rgba(25,40,18,.5)",grid:"rgba(201,168,76,.04)"},
    castle: {floor:"rgba(55,45,35,.6)",wall:"rgba(95,80,60,.92)",void:"rgba(8,6,4,.9)",grid:"rgba(201,168,76,.06)"},
    forest: {floor:"rgba(30,45,20,.5)",wall:"rgba(20,50,15,.8)",void:"rgba(15,30,10,.6)",grid:"rgba(100,160,80,.05)"},
  };

  // Build map tiles from scene data
  const mapTiles = useMemo(() => {
    const floor = new Set();
    const walls = new Set();
    const features = new Map(); // key -> {emoji, label}

    if (sceneMap) {
      // Add rooms
      (sceneMap.r || []).forEach(r => {
        for(let x=r.x; x<r.x+r.w; x++) for(let y=r.y; y<r.y+r.h; y++) floor.add(`${x}-${y}`);
      });
      // Add corridors
      (sceneMap.c || []).forEach(([x1,y1,x2,y2]) => {
        const sx=Math.min(x1,x2),ex=Math.max(x1,x2),sy=Math.min(y1,y2),ey=Math.max(y1,y2);
        for(let x=sx;x<=ex;x++) for(let y=sy;y<=ey;y++) floor.add(`${x}-${y}`);
      });
      // Add features
      (sceneMap.f || []).forEach(f => {
        features.set(`${f.x}-${f.y}`, {emoji: f.t, label: f.l || ""});
        floor.add(`${f.x}-${f.y}`); // features are walkable
      });
    } else {
      // Default: open grid
      for(let x=0;x<cols;x++) for(let y=0;y<rows;y++) floor.add(`${x}-${y}`);
    }
    return {floor, walls, features};
  }, [sceneMap, cols, rows]);

  // Tokens
  const [toks, setToks] = useState([]);
  useEffect(() => {
    setToks(prev => {
      const existing = new Map(prev.map(t => [t.id, t]));
      const t = [];
      const pcSpawn = sceneMap?.pc || {x:2,y:2};
      const mnSpawn = sceneMap?.mn || {x:18,y:2};
      chars.forEach((c, i) => {
        const old = existing.get(c.id);
        t.push(old ? {...old, name: c.name} : {id: c.id, name: c.name, em: "🛡️", col: pcSpawn.x+i, row: pcSpawn.y, isMon: false, color: ["#5a8ac5","#4a9a4a","#c9a84c","#c42b2b","#9a6abf","#c97a3c"][i%6]});
      });
      mons.forEach((m, i) => {
        const mid = m.id || `mon-${i}`;
        const old = existing.get(mid);
        t.push(old ? {...old, name: m.n} : {id: mid, name: m.n, em: "👹", col: mnSpawn.x, row: mnSpawn.y+i, isMon: true, color: "#c42b2b"});
      });
      return t;
    });
  }, [chars, mons, sceneMap]);

  const click = (c, r) => {
    const key = `${c}-${r}`;
    if (wallM) { setCustomWalls(p => { const n=new Set(p); n.has(key)?n.delete(key):n.add(key); return n; }); return; }
    if (fogM) { setFog(p => { const n=new Set(p); n.has(key)?n.delete(key):n.add(key); return n; }); return; }
    if (sel != null) {
      if (customWalls.has(key) || !mapTiles.floor.has(key)) { setSel(null); return; }
      const occupant = toks.find(t => t.col === c && t.row === r);
      if (occupant) { setSel(occupant.id); return; }
      const tok = toks.find(t => t.id === sel);
      if (tok) {
        const dist = (Math.abs(tok.col-c) + Math.abs(tok.row-r)) * 5;
        setToks(p => p.map(t => t.id === sel ? {...t, col: c, row: r} : t));
        addMsg("system", `🗺️ ${tok.name} moves ${dist}ft`);
      }
      setSel(null);
    }
  };
  const at = (c, r) => toks.find(t => t.col === c && t.row === r);

  const ts = terrainStyles[sceneMap?.t] || terrainStyles.dungeon;

  const mapCSS = `
    .map-cell{width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:.85rem;cursor:pointer;transition:all .1s;position:relative;border:none}
    .map-floor{background:${ts.floor}}
    .map-wall{background:${ts.wall};box-shadow:inset 0 0 4px rgba(0,0,0,.5)}
    .map-void{background:${ts.void}}
    .map-floor:hover{background:rgba(201,168,76,.15)}
    .map-sel{outline:2px solid #e8c84c;z-index:2}
    .map-fog{background:rgba(0,0,0,.95)!important}
    .map-cwall{background:rgba(100,80,55,.95)!important;box-shadow:inset 0 0 6px rgba(0,0,0,.6)!important}
    .map-token{font-size:.7rem;width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:grab;position:relative;z-index:3;border:2px solid;box-shadow:0 2px 6px rgba(0,0,0,.5)}
    .map-feat{font-size:.7rem;position:absolute;opacity:.7;pointer-events:none;z-index:1;text-shadow:0 1px 2px rgba(0,0,0,.8)}
    .map-grid-overlay{position:absolute;inset:0;border:1px solid ${ts.grid};pointer-events:none}
    .map-label{position:absolute;bottom:-1px;left:50%;transform:translateX(-50%);font-size:.35rem;font-family:Cinzel,serif;color:#c9a84c;white-space:nowrap;text-shadow:0 1px 3px rgba(0,0,0,.9);pointer-events:none;z-index:4;letter-spacing:.03em}
  `;

  return <div className="pnl">
    <style>{mapCSS}</style>
    <div className="ph"><h3>🗺️ {sceneMap?.nm || "Battle Map"}</h3><div className="fr gs">
      <button className={`btn bs ${fogM?"bp":""}`} onClick={()=>{setFogM(!fogM);setWallM(false);}}>🌫️ Fog{fogM?" ON":""}</button>
      <button className={`btn bs ${wallM?"bp":""}`} onClick={()=>{setWallM(!wallM);setFogM(false);}}>🧱 Walls{wallM?" ON":""}</button>
      {sel && <span className="bdg bdg-g">🎯 Click to move</span>}
      {sceneMap && <span className="bdg bdg-g tx">{sceneMap.t}</span>}
    </div></div>

    {/* Map name and scene info */}
    {sceneMap?.nm && <div className="ts td2 mb" style={{fontStyle:"italic"}}>{scene?.t} — {sceneMap.nm}</div>}

    <div style={{overflow:"auto",maxHeight:560,border:"1px solid var(--bdr)",borderRadius:5}}>
      <div style={{display:"grid",gridTemplateColumns:`repeat(${cols},28px)`,gridTemplateRows:`repeat(${rows},28px)`,gap:0,background:ts.void}}>
        {Array.from({length: rows * cols}).map((_, idx) => {
          const c = idx % cols, r = Math.floor(idx / cols);
          const key = `${c}-${r}`;
          const tok = at(c, r);
          const isFog = fog.has(key);
          const isCWall = customWalls.has(key);
          const isFloor = mapTiles.floor.has(key);
          const feat = mapTiles.features.get(key);
          const isSelected = tok && tok.id === sel;

          let cellClass = "map-cell";
          if (isFog) cellClass += " map-fog";
          else if (isCWall) cellClass += " map-cwall";
          else if (isFloor) cellClass += " map-floor";
          else cellClass += " map-void";
          if (isSelected) cellClass += " map-sel";

          return <div key={idx} className={cellClass}
            onClick={() => tok && !fogM && !wallM ? setSel(tok.id) : click(c, r)}
            title={`${c*5}ft, ${r*5}ft${tok ? ` — ${tok.name}` : ""}${feat?.label ? ` [${feat.label}]` : ""}${isCWall ? " [Wall]" : ""}`}>
            <div className="map-grid-overlay"/>
            {/* Feature emoji */}
            {!isFog && !tok && feat && <span className="map-feat">{feat.emoji}</span>}
            {/* Feature label */}
            {!isFog && feat?.label && !tok && <span className="map-label">{feat.label}</span>}
            {/* Token */}
            {!isFog && tok && (
              <div className="map-token" style={{background:tok.isMon?"rgba(139,26,26,.85)":"rgba(25,40,70,.85)", borderColor:tok.color||"#c9a84c"}}>
                {tok.em}
              </div>
            )}
          </div>;
        })}
      </div>
    </div>
    <div className="fr mt" style={{gap:12}}>
      <div className="tx td2">5ft/cell • Click token → click destination</div>
      {sceneMap && <div className="fr gs tx td2">
        {(sceneMap.f || []).filter(f=>f.l).slice(0,6).map((f,i) => <span key={i}>{f.t} {f.l}</span>)}
      </div>}
    </div>
  </div>;
}

function SpellRef() {
  const [q,setQ]=useState("");const [lf,setLF]=useState("all");const [cf,setCF]=useState("all");const [ex,setEx]=useState(null);
  const f=SPELLS.filter(s=>{if(q&&!s.n.toLowerCase().includes(q.toLowerCase()))return false;if(lf!=="all"&&s.l!==parseInt(lf))return false;if(cf!=="all"&&!s.cls.includes(cf))return false;return true;});
  return <div className="pnl"><div className="ph"><h3>📖 Spells</h3><span className="td2 ts">{f.length}</span></div>
    <div className="fr mb"><input type="text" placeholder="Search..." value={q} onChange={e=>setQ(e.target.value)} style={{flex:1}}/>
      <select value={lf} onChange={e=>setLF(e.target.value)} style={{width:100}}><option value="all">All Lvl</option><option value="0">Cantrips</option>
        {[1,2,3,4,5,6,7,8,9].map(l=><option key={l} value={l}>Lvl {l}</option>)}</select>
      <select value={cf} onChange={e=>setCF(e.target.value)} style={{width:100}}><option value="all">All Class</option>
        {Object.keys(CLASSES).filter(c=>CLASSES[c].sc).map(c=><option key={c}>{c}</option>)}</select></div>
    <div className="fc" style={{maxHeight:460,overflowY:"auto"}}>{f.map(sp=><SpellCard key={sp.n} sp={sp}/>)}</div>
  </div>;
}

function MonRef({onSpawn}) {
  const [q,setQ]=useState("");const [ex,setEx]=useState(null);
  const f=MONSTERS.filter(m=>!q||m.n.toLowerCase().includes(q.toLowerCase()));
  return <div className="pnl"><div className="ph"><h3>👹 Monsters</h3></div>
    <input type="text" placeholder="Search..." value={q} onChange={e=>setQ(e.target.value)} className="mb"/>
    <div className="fc" style={{maxHeight:460,overflowY:"auto"}}>{f.map(m=><div key={m.n} className="mc" onClick={()=>setEx(ex===m.n?null:m.n)}>
      <div className="fb"><b style={{color:"var(--redb)",fontFamily:"Cinzel"}}>{m.n}</b>
        <div className="fr gs"><span className="bdg bdg-r tx">CR {m.cr}</span><span className="tx td2">{m.t}</span></div></div>
      {ex===m.n&&<div className="mt afu">
        <div className="g6 gs mt" style={{fontSize:".75rem"}}>{[["STR",m.s],["DEX",m.d],["CON",m.co],["INT",m.i],["WIS",m.w],["CHA",m.ch]].map(([a,v])=>
          <div key={a} className="tc"><label>{a}</label><div>{v} ({ms(aMod(v))})</div></div>)}</div>
        <div className="ts mt"><b>AC:</b> {m.ac} | <b>HP:</b> {m.hp} | <b>Speed:</b> {m.sp}</div>
        {m.atk?.map((a,i)=><div key={i} className="ts mt" style={{padding:"3px 6px",background:"rgba(0,0,0,.15)",borderRadius:3}}>
          <b>{a.n}:</b> +{a.b}, {a.dm}{a.r?`, ${a.r}`:""}</div>)}
        {m.tr?.map((t,i)=><div key={i} className="tx td2 mt">• {t}</div>)}
        <div className="tx td2 mt">XP: {m.xp}</div>
        {onSpawn&&<button className="btn bs bd mt" onClick={e=>{e.stopPropagation();onSpawn({...m,id:uid(),curHp:m.hp});}}>👹 Spawn</button>}
      </div>}
    </div>)}</div>
  </div>;
}

function CampSel({onSel}) {
  const [sel,setSel]=useState(null);
  return <div style={{maxWidth:860,margin:"0 auto"}}><h2 className="td mb">📜 Select Campaign</h2>
    <div className="fc gs">{CAMPAIGNS.map(c=><div key={c.n} className={`cc ${sel===c.n?"sel":""}`} onClick={()=>setSel(sel===c.n?null:c.n)}>
      <div className="fb"><h3 style={{margin:0,fontSize:".95rem"}}>{c.n}</h3><span className="bdg bdg-g">{c.lv}</span></div>
      <div className="td2 ts mt">{c.d}</div>
      {sel===c.n&&<div className="afu mm" style={{padding:10,background:"rgba(0,0,0,.15)",borderRadius:4,borderLeft:"3px solid var(--gold)"}}>
        <div className="ts"><b>Hook:</b></div><div className="ts" style={{fontStyle:"italic"}}>{c.h}</div>
        <div className="ts mm td2">{c.scenes?`${c.scenes.length} scenes ready`:""}</div>
        <button className="btn bp bl mm" onClick={(e)=>{e.stopPropagation();onSel(c);}} style={{width:"100%"}}>⚔️ Begin Adventure</button></div>}
    </div>)}</div>
  </div>;
}

function DMTools({mons,setMons,camp}) {
  const [tool,setTool]=useState("encounter");const {addMsg}=useContext(AppCtx);
  const names=["Aldric","Bramble","Cedric","Dara","Elara","Finn","Greta","Halvard","Isolde","Jorik","Kira","Lyra","Magnus","Nessa","Orin","Petra","Quinn","Rowan","Sera","Theron"];
  const lasts=["Thornwood","Stonehelm","Brightvale","Darkmore","Ironforge","Shadowmere","Goldweaver","Frostborne"];
  const jobs=["Blacksmith","Tavern Keep","Merchant","Guard Captain","Healer","Sage","Farmer","Noble","Thief","Priest","Bard","Sailor"];
  const quirks=["speaks in riddles","nervous tic","never makes eye contact","laughs too loudly","paranoid about spies","terrible jokes","has a secret","deeply in debt","former adventurer"];
  const tavs=["The Prancing Pony","The Dragon's Flagon","The Rusty Nail","The Golden Griffin","The Silver Stag","The Laughing Lich","The Broken Blade","The Wanderer's Rest"];
  const pick=a=>a[Math.floor(Math.random()*a.length)];

  return <div className="pnl"><div className="ph"><h3>🎭 DM Tools</h3>{camp&&<span className="bdg bdg-g">{camp.n}</span>}</div>
    <div className="tabs mb">{["encounter","monsters","generators","loot","conditions","items"].map(t=>
      <button key={t} className={`tab ${tool===t?"a":""}`} onClick={()=>setTool(t)}>{t[0].toUpperCase()+t.slice(1)}</button>)}</div>

    {tool==="encounter"&&<div className="afu fc gl">
      <div><h3>Encounter Monsters</h3>{mons.length>0?<div className="fc mt">{mons.map((m,i)=><div key={m.id||i} className="fb" style={{padding:"4px 0",borderBottom:"1px solid rgba(201,168,76,.08)"}}>
        <span>👹 {m.n} <span className="td2 tx">(CR {m.cr}, {m.hp}HP)</span></span>
        <button className="btn bs bd" onClick={()=>setMons(p=>p.filter((_,j)=>j!==i))}>Remove</button></div>)}</div>
      :<div className="td2 ts mt">No monsters. Use Monsters tab to spawn.</div>}</div>
      <button className="btn" onClick={()=>{const enc=["2d4 goblins ambush!","A lone ogre demands a toll.","1d6 wolves emerge!","Bandits block the road.","A giant spider drops from above!","An owlbear crashes through!","Skeletons rise around you!"];
        addMsg("system",`⚔️ Random: ${pick(enc)}`);}}>🎲 Random Encounter</button>
    </div>}
    {tool==="monsters"&&<MonRef onSpawn={m=>setMons(p=>[...p,m])}/>}
    {tool==="generators"&&<div className="afu fc gl">
      <div className="g2">
        <button className="btn bl" onClick={()=>{addMsg("system",`🧑 NPC: ${pick(names)} ${pick(lasts)}, ${pick(Object.keys(RACES))} ${pick(jobs)} — ${pick(quirks)}`);}}>🧑 Generate NPC</button>
        <button className="btn bl" onClick={()=>{addMsg("system",`🍺 Tavern: "${pick(tavs)}" — ${Math.floor(Math.random()*20)+5} patrons`);}}>🍺 Generate Tavern</button>
      </div>
      <button className="btn" onClick={()=>{const rooms=Math.floor(Math.random()*8)+3;const feats=["pit trap","locked iron door","mysterious altar","dark pool","crumbling stairs","ancient runes","treasure chest","scattered bones","flickering torchlight"];
        addMsg("system",`🏰 Dungeon: ${rooms} rooms. ${Array.from({length:Math.min(rooms,4)},()=>pick(feats)).join("; ")}`);}}>🏰 Generate Dungeon</button>
      <button className="btn" onClick={()=>addMsg("roll",`DM secret roll: d20 = ${rd(20)}`)}>🎲 Secret Roll</button>
    </div>}
    {tool==="loot"&&<div className="afu"><h3 className="mb">Loot Generator</h3><div className="g3 gs">
      {["1/4","1","3","5","10","15"].map(cr=><button key={cr} className="btn" onClick={()=>{const g=Math.floor(parseFloat(cr)*parseFloat(cr)*10+Math.random()*parseFloat(cr)*20);
        const it=Array.from({length:Math.floor(Math.random()*3)+1},()=>pick(ITEMS).n);
        addMsg("system",`💰 CR ${cr} Loot: ${g} gp, ${it.join(", ")}`);}}>CR {cr}</button>)}</div></div>}
    {tool==="conditions"&&<div className="afu fc">{CONDITIONS.map(c=><div key={c.n} style={{padding:"6px 0",borderBottom:"1px solid rgba(201,168,76,.08)"}}>
      <b>{c.i} {c.n}</b><div className="ts td2">{c.d}</div></div>)}</div>}
    {tool==="items"&&<div className="afu fc" style={{maxHeight:460,overflowY:"auto"}}>{ITEMS.map(it=><div key={it.n} style={{padding:"6px 0",borderBottom:"1px solid rgba(201,168,76,.08)"}}>
      <div className="fb"><b>{it.n}</b><div className="fr gs"><span className="bdg bdg-g tx">{it.t}</span>{it.c&&<span className="tx td2">{it.c}</span>}</div></div>
      {it.d&&<div className="ts td2">{it.d}</div>}{it.dm&&<div className="ts">Damage: <b>{it.dm}</b></div>}
      {it.p&&<div className="tx td2">Props: {it.p}</div>}{it.r&&<span className="bdg bdg-a tx">{it.r}</span>}
    </div>)}</div>}
  </div>;
}

function Chat({msgs}) {
  const ref=useRef(null);const [inp,setInp]=useState("");const {addMsg,pn}=useContext(AppCtx);
  useEffect(()=>{if(ref.current)ref.current.scrollTop=ref.current.scrollHeight;},[msgs]);
  const send=()=>{if(!inp.trim())return;addMsg("chat",inp.trim());setInp("");};
  return <div className="pnl" style={{display:"flex",flexDirection:"column",height:"100%"}}>
    <div className="ph"><h3>💬 Chat</h3><span className="td2 tx">{msgs.length}</span></div>
    <div className="chbx" ref={ref} style={{flex:1}}>{msgs.map((m,i)=><div key={i} className={`chm ${m.t}`}>
      {m.t==="chat"&&<span className="chs">{m.s}: </span>}
      {m.t==="system"&&<span style={{color:"var(--goldd)"}}>⚙️ </span>}
      {m.t==="roll"&&<span style={{color:"var(--arc)"}}>🎲 {m.s} </span>}
      {m.tx}</div>)}</div>
    <div className="fr mt"><input type="text" value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Type..." style={{flex:1}}/>
      <button className="btn bs" onClick={send}>Send</button></div>
  </div>;
}

function Lobby({onJoin}) {
  const [mode,setMode]=useState(null);const [rc,setRC]=useState("");const [name,setName]=useState("");const [role,setRole]=useState("player");
  const [loaded,setLoaded]=useState(false);const [particles]=useState(()=>Array.from({length:40},(_,i)=>({id:i,x:Math.random()*100,y:Math.random()*100,s:Math.random()*3+1,d:Math.random()*20+10,del:Math.random()*8})));
  const [floatingRunes]=useState(()=>{const runes=["ᚠ","ᚢ","ᚦ","ᚨ","ᚱ","ᚲ","ᚷ","ᚹ","ᚺ","ᚾ","ᛁ","ᛃ","ᛇ","ᛈ","ᛉ","ᛊ","ᛏ","ᛒ","ᛖ","ᛗ","ᛚ","ᛝ","ᛞ","ᛟ"];return Array.from({length:12},(_,i)=>({id:i,r:runes[Math.floor(Math.random()*runes.length)],x:Math.random()*100,d:Math.random()*15+8,del:Math.random()*6,sz:Math.random()*14+10}));});
  useEffect(()=>{setTimeout(()=>setLoaded(true),100);},[]);

  const lobbyCSS = `
    .lobby-root{min-height:100vh;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;
      background:#080705}
    .lobby-bg{position:fixed;inset:0;z-index:0;
      background:
        radial-gradient(ellipse 80% 60% at 50% 30%, rgba(201,168,76,.06) 0%, transparent 70%),
        radial-gradient(ellipse 60% 50% at 20% 80%, rgba(139,26,26,.05) 0%, transparent 60%),
        radial-gradient(ellipse 50% 40% at 85% 20%, rgba(90,60,20,.04) 0%, transparent 50%),
        linear-gradient(180deg, #0a0908 0%, #12100d 40%, #0a0806 100%);
    }
    .lobby-vignette{position:fixed;inset:0;z-index:1;
      background:radial-gradient(ellipse 70% 60% at 50% 45%, transparent 30%, rgba(0,0,0,.7) 100%);pointer-events:none}
    .lobby-noise{position:fixed;inset:0;z-index:1;opacity:.03;pointer-events:none;
      background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
      background-size:128px 128px}
    .lobby-particles{position:fixed;inset:0;z-index:2;pointer-events:none;overflow:hidden}
    .ember{position:absolute;border-radius:50%;background:radial-gradient(circle,rgba(232,200,76,.9),rgba(201,168,76,.3),transparent);
      animation:ember-rise var(--dur) var(--del) ease-in infinite;opacity:0;filter:blur(0.5px)}
    @keyframes ember-rise{0%{transform:translateY(0) translateX(0) scale(1);opacity:0}
      10%{opacity:.8}50%{opacity:.6;transform:translateY(-40vh) translateX(20px) scale(.7)}
      100%{transform:translateY(-100vh) translateX(-10px) scale(.2);opacity:0}}
    .rune-float{position:absolute;color:rgba(201,168,76,.06);font-size:var(--sz);
      animation:rune-drift var(--dur) var(--del) ease-in-out infinite;opacity:0;pointer-events:none}
    @keyframes rune-drift{0%{transform:translateY(10vh) rotate(0deg);opacity:0}
      20%{opacity:1}80%{opacity:.6}100%{transform:translateY(-100vh) rotate(180deg);opacity:0}}
    .lobby-content{position:relative;z-index:10;max-width:520px;width:100%;padding:24px}

    /* ── Crest / Logo ── */
    .lobby-crest{text-align:center;margin-bottom:32px}
    .crest-d20{position:relative;width:120px;height:120px;margin:0 auto 20px;
      opacity:0;transform:scale(.5) rotate(-30deg);transition:all 1s cubic-bezier(.34,1.56,.64,1) .3s}
    .crest-d20.show{opacity:1;transform:scale(1) rotate(0deg)}
    .crest-d20 svg{width:100%;height:100%;filter:drop-shadow(0 0 20px rgba(201,168,76,.3)) drop-shadow(0 0 60px rgba(201,168,76,.1))}
    .crest-d20::after{content:'';position:absolute;inset:-20px;border-radius:50%;
      background:radial-gradient(circle,rgba(201,168,76,.08),transparent 70%);animation:crest-pulse 4s ease-in-out infinite}
    @keyframes crest-pulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.15);opacity:.6}}

    .lobby-title{font-family:'Cinzel Decorative',serif;font-size:2.6rem;font-weight:900;line-height:1.1;
      color:#c9a84c;letter-spacing:.04em;
      text-shadow:0 0 30px rgba(201,168,76,.25),0 2px 0 rgba(0,0,0,.5);
      opacity:0;transform:translateY(16px);transition:all .8s ease-out .6s}
    .lobby-title.show{opacity:1;transform:translateY(0)}
    .lobby-sub{font-family:'Cinzel',serif;font-size:.95rem;font-weight:600;letter-spacing:.2em;text-transform:uppercase;
      color:#8a7234;margin-top:6px;
      opacity:0;transform:translateY(10px);transition:all .7s ease-out .9s}
    .lobby-sub.show{opacity:1;transform:translateY(0)}

    .lobby-divider{display:flex;align-items:center;gap:16px;margin:20px auto;max-width:340;
      opacity:0;transition:opacity .6s 1.1s}
    .lobby-divider.show{opacity:1}
    .lobby-divider .ld-line{flex:1;height:1px;background:linear-gradient(90deg,transparent,#8a7234,transparent)}
    .lobby-divider .ld-gem{width:8px;height:8px;background:#c9a84c;transform:rotate(45deg);box-shadow:0 0 10px rgba(201,168,76,.4);flex-shrink:0}

    /* ── Form Panel ── */
    .lobby-panel{
      background:linear-gradient(180deg,rgba(18,14,10,.92),rgba(10,8,6,.96));
      border:1px solid rgba(201,168,76,.2);border-radius:8px;padding:28px 24px;
      box-shadow:0 20px 60px rgba(0,0,0,.5),0 0 1px rgba(201,168,76,.3),inset 0 1px 0 rgba(201,168,76,.06);
      backdrop-filter:blur(12px);position:relative;overflow:hidden;
      opacity:0;transform:translateY(20px);transition:all .8s ease-out 1.2s}
    .lobby-panel.show{opacity:1;transform:translateY(0)}
    .lobby-panel::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;
      background:linear-gradient(90deg,transparent 10%,rgba(201,168,76,.4) 50%,transparent 90%)}
    .lobby-panel::after{content:'';position:absolute;inset:0;pointer-events:none;
      background:radial-gradient(ellipse at 50% 0%,rgba(201,168,76,.03),transparent 60%)}

    .lobby-input{font-family:'Crimson Text',serif;font-size:1.05rem;background:rgba(0,0,0,.35);
      border:1px solid rgba(201,168,76,.15);color:#e8dcc8;padding:12px 16px;border-radius:6px;
      outline:none;transition:all .3s;width:100%}
    .lobby-input:focus{border-color:rgba(201,168,76,.5);box-shadow:0 0 16px rgba(201,168,76,.08);background:rgba(0,0,0,.45)}
    .lobby-input::placeholder{color:rgba(154,142,122,.5)}

    .lobby-label{font-family:'Cinzel',serif;font-size:.7rem;font-weight:600;color:#8a7234;
      text-transform:uppercase;letter-spacing:.1em;margin-bottom:6px;display:block}

    /* ── Role Selector ── */
    .role-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    .role-card{position:relative;padding:16px 12px;border:1px solid rgba(201,168,76,.15);border-radius:6px;
      background:rgba(0,0,0,.25);cursor:pointer;transition:all .3s;text-align:center;overflow:hidden}
    .role-card:hover{border-color:rgba(201,168,76,.35);background:rgba(201,168,76,.04)}
    .role-card.active{border-color:#c9a84c;background:rgba(201,168,76,.08);
      box-shadow:0 0 20px rgba(201,168,76,.1),inset 0 0 20px rgba(201,168,76,.03)}
    .role-card.active::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;
      background:linear-gradient(90deg,transparent,#c9a84c,transparent)}
    .role-icon{font-size:2rem;margin-bottom:6px;display:block;
      filter:drop-shadow(0 2px 8px rgba(0,0,0,.4));transition:transform .3s}
    .role-card:hover .role-icon{transform:scale(1.1)}
    .role-card.active .role-icon{transform:scale(1.15);filter:drop-shadow(0 0 12px rgba(201,168,76,.3))}
    .role-name{font-family:'Cinzel',serif;font-size:.85rem;font-weight:700;color:#e8dcc8;letter-spacing:.06em}
    .role-desc{font-size:.72rem;color:#9a8e7a;margin-top:2px}
    .role-card.active .role-name{color:#c9a84c}

    /* ── Action Buttons ── */
    .lobby-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:20px}
    .lobby-btn{font-family:'Cinzel',serif;font-size:.9rem;font-weight:700;padding:14px 20px;
      border-radius:6px;cursor:pointer;transition:all .3s;letter-spacing:.06em;text-transform:uppercase;
      position:relative;overflow:hidden}
    .lobby-btn::before{content:'';position:absolute;inset:0;opacity:0;transition:opacity .3s;
      background:radial-gradient(circle at 50% 50%,rgba(255,255,255,.1),transparent 70%)}
    .lobby-btn:hover::before{opacity:1}
    .lobby-btn:active{transform:scale(.97)}
    .lobby-btn-primary{background:linear-gradient(180deg,#d4b04e,#9a7a34);color:#0a0908;
      border:1px solid #c9a84c;box-shadow:0 4px 20px rgba(201,168,76,.25),inset 0 1px 0 rgba(255,255,255,.15)}
    .lobby-btn-primary:hover{background:linear-gradient(180deg,#e8c84c,#b8943e);
      box-shadow:0 6px 30px rgba(201,168,76,.35),inset 0 1px 0 rgba(255,255,255,.2);transform:translateY(-1px)}
    .lobby-btn-primary:disabled{opacity:.4;cursor:not-allowed;transform:none;box-shadow:none}
    .lobby-btn-secondary{background:rgba(0,0,0,.3);color:#c9a84c;
      border:1px solid rgba(201,168,76,.25);box-shadow:0 4px 12px rgba(0,0,0,.2)}
    .lobby-btn-secondary:hover{border-color:rgba(201,168,76,.5);background:rgba(201,168,76,.06);
      box-shadow:0 6px 20px rgba(0,0,0,.3);transform:translateY(-1px)}
    .lobby-btn-secondary:disabled{opacity:.4;cursor:not-allowed;transform:none}
    .lobby-btn-full{grid-column:1/-1;font-size:1.1rem;padding:18px 24px;letter-spacing:.1em}
    .lobby-btn-back{font-family:'Cinzel',serif;font-size:.75rem;font-weight:600;color:#9a8e7a;
      background:none;border:none;cursor:pointer;padding:8px;transition:color .2s;margin-top:8px}
    .lobby-btn-back:hover{color:#c9a84c}

    .lobby-code-input{font-family:'Cinzel',serif;font-size:1.8rem;font-weight:900;text-align:center;
      letter-spacing:.4em;padding:16px;background:rgba(0,0,0,.4);border:1px solid rgba(201,168,76,.2);
      color:#e8c84c;border-radius:6px;outline:none;width:100%;transition:all .3s}
    .lobby-code-input:focus{border-color:#c9a84c;box-shadow:0 0 24px rgba(201,168,76,.12)}
    .lobby-code-input::placeholder{color:rgba(154,142,122,.3);letter-spacing:.3em;font-size:1.2rem}

    .lobby-footer{text-align:center;margin-top:28px;
      opacity:0;transition:opacity .6s 1.6s}
    .lobby-footer.show{opacity:1}
    .lobby-footer-text{font-family:'Cinzel',serif;font-size:.65rem;color:rgba(154,142,122,.4);letter-spacing:.15em;text-transform:uppercase}
    .lobby-footer-icons{display:flex;justify-content:center;gap:18px;margin-top:10px;font-size:1.1rem;
      color:rgba(201,168,76,.15)}

    /* ── Feature chips ── */
    .lobby-features{display:flex;justify-content:center;gap:8px;flex-wrap:wrap;margin-top:12px;
      opacity:0;transition:opacity .6s 1.5s}
    .lobby-features.show{opacity:1}
    .feat-chip{font-family:'Cinzel',serif;font-size:.58rem;font-weight:600;color:rgba(201,168,76,.35);
      letter-spacing:.08em;text-transform:uppercase;padding:3px 10px;
      border:1px solid rgba(201,168,76,.1);border-radius:20px}

    @media(max-width:600px){
      .lobby-title{font-size:1.8rem}
      .lobby-content{padding:16px}
      .lobby-panel{padding:20px 16px}
      .crest-d20{width:90px;height:90px}
    }
  `;

  // SVG D20 icosahedron shape
  const D20Crest = () => (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="d20gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e8c84c"/>
          <stop offset="50%" stopColor="#c9a84c"/>
          <stop offset="100%" stopColor="#8a7234"/>
        </linearGradient>
        <linearGradient id="d20face" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(201,168,76,.12)"/>
          <stop offset="100%" stopColor="rgba(201,168,76,.03)"/>
        </linearGradient>
        <filter id="d20glow">
          <feGaussianBlur stdDeviation="2" result="blur"/>
          <feComposite in="SourceGraphic" in2="blur" operator="over"/>
        </filter>
      </defs>
      {/* Outer ring */}
      <circle cx="100" cy="100" r="95" fill="none" stroke="url(#d20gold)" strokeWidth=".5" opacity=".3"/>
      <circle cx="100" cy="100" r="88" fill="none" stroke="url(#d20gold)" strokeWidth=".3" opacity=".15"/>
      {/* D20 shape */}
      <g filter="url(#d20glow)">
        <polygon points="100,18 175,65 175,135 100,182 25,135 25,65" fill="url(#d20face)" stroke="url(#d20gold)" strokeWidth="1.2" strokeLinejoin="round"/>
        {/* Inner triangle faces */}
        <line x1="100" y1="18" x2="25" y2="135" stroke="url(#d20gold)" strokeWidth=".6" opacity=".4"/>
        <line x1="100" y1="18" x2="175" y2="135" stroke="url(#d20gold)" strokeWidth=".6" opacity=".4"/>
        <line x1="25" y1="65" x2="175" y2="135" stroke="url(#d20gold)" strokeWidth=".6" opacity=".3"/>
        <line x1="175" y1="65" x2="25" y2="135" stroke="url(#d20gold)" strokeWidth=".6" opacity=".3"/>
        <line x1="100" y1="182" x2="25" y2="65" stroke="url(#d20gold)" strokeWidth=".6" opacity=".4"/>
        <line x1="100" y1="182" x2="175" y2="65" stroke="url(#d20gold)" strokeWidth=".6" opacity=".4"/>
        {/* Center number */}
        <text x="100" y="112" textAnchor="middle" fontFamily="Cinzel" fontSize="36" fontWeight="900" fill="url(#d20gold)" opacity=".85">20</text>
      </g>
      {/* Corner ornaments */}
      {[0,60,120,180,240,300].map(angle => {
        const rad = angle * Math.PI / 180;
        const x = 100 + 82 * Math.cos(rad - Math.PI/2);
        const y = 100 + 82 * Math.sin(rad - Math.PI/2);
        return <circle key={angle} cx={x} cy={y} r="2" fill="#c9a84c" opacity=".5"/>;
      })}
    </svg>
  );

  return <>
    <style>{lobbyCSS}</style>
    <div className="lobby-root">
      {/* Layered background */}
      <div className="lobby-bg"/>
      <div className="lobby-vignette"/>
      <div className="lobby-noise"/>

      {/* Floating embers */}
      <div className="lobby-particles">
        {particles.map(p => (
          <div key={p.id} className="ember" style={{left:`${p.x}%`,bottom:'-5%',width:`${p.s}px`,height:`${p.s}px`,'--dur':`${p.d}s`,'--del':`${p.del}s`}}/>
        ))}
        {floatingRunes.map(r => (
          <div key={r.id} className="rune-float" style={{left:`${r.x}%`,bottom:'-5%','--dur':`${r.d}s`,'--del':`${r.del}s`,'--sz':`${r.sz}px`}}>{r.r}</div>
        ))}
      </div>

      <div className="lobby-content">
        {/* Crest */}
        <div className="lobby-crest">
          <div className={`crest-d20 ${loaded?"show":""}`}><D20Crest/></div>
          <div className={`lobby-title ${loaded?"show":""}`}>Dungeons<br/>&amp; Dragons</div>
          <div className={`lobby-sub ${loaded?"show":""}`}>5th Edition Virtual Tabletop</div>

          <div className={`lobby-divider ${loaded?"show":""}`}>
            <div className="ld-line"/><div className="ld-gem"/><div className="ld-line"/>
          </div>
        </div>

        {/* Main Panel */}
        <div className={`lobby-panel ${loaded?"show":""}`}>
          <div style={{display:"flex",flexDirection:"column",gap:18}}>
            {/* Name */}
            <div>
              <span className="lobby-label">Adventurer's Name</span>
              <input className="lobby-input" type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="What shall we call you?"/>
            </div>

            {/* Role */}
            <div>
              <span className="lobby-label">Choose Your Role</span>
              <div className="role-grid">
                <div className={`role-card ${role==="player"?"active":""}`} onClick={()=>setRole("player")}>
                  <span className="role-icon">🛡️</span>
                  <div className="role-name">Player</div>
                  <div className="role-desc">Embark on the adventure</div>
                </div>
                <div className={`role-card ${role==="dm"?"active":""}`} onClick={()=>setRole("dm")}>
                  <span className="role-icon">🎭</span>
                  <div className="role-name">Dungeon Master</div>
                  <div className="role-desc">Weave the tale</div>
                </div>
              </div>
            </div>

            {/* Divider with ornament */}
            <div style={{display:"flex",alignItems:"center",gap:12,margin:"4px 0"}}>
              <div style={{flex:1,height:1,background:"linear-gradient(90deg,transparent,rgba(201,168,76,.2),transparent)"}}/>
              <span style={{color:"rgba(201,168,76,.25)",fontSize:".7rem",fontFamily:"Cinzel"}}>✦</span>
              <div style={{flex:1,height:1,background:"linear-gradient(90deg,transparent,rgba(201,168,76,.2),transparent)"}}/>
            </div>

            {/* Actions */}
            {!mode && (
              <div className="lobby-actions" style={{animation:"fu .4s ease-out"}}>
                <button className="lobby-btn lobby-btn-primary" onClick={()=>setMode("create")} disabled={!name}>
                  Create Room
                </button>
                <button className="lobby-btn lobby-btn-secondary" onClick={()=>setMode("join")} disabled={!name}>
                  Join Room
                </button>
              </div>
            )}

            {mode==="create" && (
              <div style={{animation:"fu .3s ease-out",textAlign:"center"}}>
                <div style={{color:"#9a8e7a",fontSize:".85rem",marginBottom:14}}>
                  A room code will be generated for your party to join
                </div>
                <button className="lobby-btn lobby-btn-primary lobby-btn-full"
                  onClick={()=>onJoin({name,role,rc:Math.random().toString(36).substr(2,6).toUpperCase(),host:true})}>
                  ⚔️ Forge New Campaign
                </button>
                <button className="lobby-btn-back" onClick={()=>setMode(null)}>← Choose differently</button>
              </div>
            )}

            {mode==="join" && (
              <div style={{animation:"fu .3s ease-out",display:"flex",flexDirection:"column",gap:14}}>
                <div>
                  <span className="lobby-label">Room Code</span>
                  <input className="lobby-code-input" type="text" value={rc}
                    onChange={e=>setRC(e.target.value.toUpperCase())} placeholder="• • • • • •" maxLength={6}/>
                </div>
                <button className="lobby-btn lobby-btn-primary lobby-btn-full"
                  onClick={()=>onJoin({name,role,rc:rc.toUpperCase(),host:false})} disabled={rc.length<4}>
                  Enter the Realm
                </button>
                <button className="lobby-btn-back" onClick={()=>setMode(null)}>← Choose differently</button>
              </div>
            )}
          </div>
        </div>

        {/* Feature chips */}
        <div className={`lobby-features ${loaded?"show":""}`}>
          {["SRD Rules","Character Builder","Battle Maps","Dice Roller","DM Tools","Combat Tracker"].map(f=>
            <span key={f} className="feat-chip">{f}</span>
          )}
        </div>

        {/* Footer */}
        <div className={`lobby-footer ${loaded?"show":""}`}>
          <div className="lobby-footer-icons">
            <span title="Fighter">⚔️</span><span title="Wizard">🧙</span><span title="Rogue">🗡️</span>
            <span title="Cleric">✝️</span><span title="Ranger">🏹</span><span title="Bard">🎵</span>
          </div>
          <div className="lobby-footer-text" style={{marginTop:10}}>
            D&D 5e SRD &bull; Open Game License &bull; Not affiliated with Wizards of the Coast
          </div>
        </div>
      </div>
    </div>
  </>;
}

// ═══════════════════════════════════════════════════════════
// MULTIPLAYER SYNC via PeerJS (WebRTC P2P)
// Host = source of truth. Players send actions, host broadcasts state.
// ═══════════════════════════════════════════════════════════
function useMultiplayer(sess) {
  const peerRef = useRef(null);
  const connsRef = useRef([]); // host: list of connections to players
  const hostConnRef = useRef(null); // player: connection to host
  const [connected, setConnected] = useState(false);
  const [players, setPlayers] = useState([]);
  const [error, setError] = useState(null);
  const onStateRef = useRef(null); // callback when state received from host
  const onActionRef = useRef(null); // callback when action received from player (host only)

  useEffect(() => {
    if (!sess) return;
    // Dynamic import peerjs
    let destroyed = false;
    import('peerjs').then(({ default: Peer }) => {
      if (destroyed) return;
      const peerId = sess.host
        ? `dnd5e-${sess.rc}` // host uses deterministic ID
        : `dnd5e-${sess.rc}-${uid()}`; // players use random suffix

      const peer = new Peer(peerId, {
        debug: 0,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ]
        }
      });
      peerRef.current = peer;

      peer.on('open', (id) => {
        console.log('[Peer] Open:', id);
        if (sess.host) {
          // Host is ready, listen for connections
          setConnected(true);
          setPlayers([{ name: sess.name, role: sess.role }]);
        } else {
          // Player connects to host
          const conn = peer.connect(`dnd5e-${sess.rc}`, { reliable: true });
          hostConnRef.current = conn;

          conn.on('open', () => {
            console.log('[Peer] Connected to host');
            setConnected(true);
            // Send join message
            conn.send({ type: 'JOIN', payload: { name: sess.name, role: sess.role } });
          });

          conn.on('data', (data) => {
            if (data.type === 'STATE' && onStateRef.current) {
              onStateRef.current(data.payload);
            }
            if (data.type === 'PLAYERS') {
              setPlayers(data.payload);
            }
          });

          conn.on('close', () => { setConnected(false); setError('Disconnected from host'); });
          conn.on('error', (err) => setError(`Connection error: ${err.message}`));
        }
      });

      if (sess.host) {
        peer.on('connection', (conn) => {
          console.log('[Host] Player connecting...');
          conn.on('open', () => {
            connsRef.current = [...connsRef.current, conn];
            console.log('[Host] Player connected, total:', connsRef.current.length);
          });

          conn.on('data', (data) => {
            if (data.type === 'JOIN') {
              setPlayers(prev => {
                const next = [...prev.filter(p => p.name !== data.payload.name), data.payload];
                // Broadcast updated player list
                broadcast({ type: 'PLAYERS', payload: next });
                return next;
              });
            }
            if (data.type === 'ACTION' && onActionRef.current) {
              onActionRef.current(data.payload);
            }
          });

          conn.on('close', () => {
            connsRef.current = connsRef.current.filter(c => c !== conn);
            console.log('[Host] Player disconnected, remaining:', connsRef.current.length);
          });
        });
      }

      peer.on('error', (err) => {
        console.error('[Peer] Error:', err);
        if (err.type === 'peer-unavailable') {
          setError('Room not found. Check the code or ask the host to create the room first.');
        } else if (err.type === 'unavailable-id') {
          setError('Room code already in use. Try a different code.');
        } else {
          setError(`Connection error: ${err.type}`);
        }
      });
    });

    return () => {
      destroyed = true;
      connsRef.current.forEach(c => c.close());
      connsRef.current = [];
      if (hostConnRef.current) hostConnRef.current.close();
      if (peerRef.current) peerRef.current.destroy();
    };
  }, [sess]);

  const broadcast = useCallback((data) => {
    connsRef.current.forEach(conn => {
      if (conn.open) {
        try { conn.send(data); } catch (e) { console.warn('Send error:', e); }
      }
    });
  }, []);

  const broadcastState = useCallback((state) => {
    broadcast({ type: 'STATE', payload: state });
  }, [broadcast]);

  const sendAction = useCallback((action) => {
    // Player sends action to host
    if (hostConnRef.current && hostConnRef.current.open) {
      hostConnRef.current.send({ type: 'ACTION', payload: action });
    }
  }, []);

  return {
    connected, players, error, broadcastState, sendAction, broadcast,
    onState: (fn) => { onStateRef.current = fn; },
    onAction: (fn) => { onActionRef.current = fn; },
    isHost: sess?.host || false,
    peerCount: connsRef.current.length
  };
}

// ═══════════════════════════════════════════════════════════
// AI DUNGEON MASTER — auto-DMs when no human DM present
// ═══════════════════════════════════════════════════════════
const AI_NARR = {
  investigate:["You examine the area carefully...","Your keen eyes scan every detail...","A closer look reveals hidden details..."],
  follow:["You press onward along the path...","The trail leads deeper into the unknown...","You cautiously advance..."],
  attack:["With weapons drawn, you charge!","Steel rings as combat erupts!","You strike without hesitation!"],
  enter:["You step through into darkness...","The door yields, revealing what lies beyond...","You cautiously cross the threshold..."],
  talk:["You approach and attempt to parley...","Your words hang in the air...","You speak with carefully chosen words..."],
  search:["You search the surroundings methodically...","Your hands find hidden crevices...","A thorough search turns up something..."],
  sneak:["Moving silently through shadows...","Your footsteps are barely a whisper...","Unseen, you advance..."],
  explore:["The area opens before you...","Curiosity guides your steps...","Each step reveals something new..."],
  refuse:["You stand firm in your decision...","Your resolve is clear...","You decline and weigh alternatives..."],
  help:["You rush to offer aid...","Compassion drives you forward...","You lend a helping hand..."],
  default:["You act decisively...","The choice is made. The story continues...","Your decision shapes what comes next..."]
};
const AI_TRANS = ["A new challenge presents itself...","The consequences ripple outward...","The adventure continues...","Events unfold rapidly...","The path forward becomes clearer..."];

function useAIDM({aiDM,camp,sceneData,combatState,chars,mons,syncAction,addMsg,setPage}) {
  const aiRef = useRef(null);
  const cbtRef = useRef(null);

  // ── Auto-advance scenes after player choice ──
  useEffect(() => {
    if (!aiDM||!camp||!sceneData.waitingForDM) return;
    const scenes=camp.scenes||[];const scene=scenes[sceneData.sceneIdx];
    const lastChoice = sceneData.playerActions?.[sceneData.playerActions.length-1]?.choice||"";
    if(aiRef.current)clearTimeout(aiRef.current);

    aiRef.current = setTimeout(()=>{
      const cl=lastChoice.toLowerCase();
      let pool=AI_NARR.default;
      for(const[k,v]of Object.entries(AI_NARR)){if(k!=="default"&&cl.includes(k)){pool=v;break;}}
      if(cl.includes("careful")||cl.includes("stealth"))pool=AI_NARR.sneak;
      if(cl.includes("fight")||cl.includes("confront")||cl.includes("storm"))pool=AI_NARR.attack;
      if(cl.includes("speak")||cl.includes("negotiate"))pool=AI_NARR.talk;
      const narr=pool[Math.floor(Math.random()*pool.length)];
      const trans=AI_TRANS[Math.floor(Math.random()*AI_TRANS.length)];
      const entry={type:"narration",title:"🤖 AI Dungeon Master",text:`${narr} ${trans}`,ts:Date.now()};
      const j2=[...sceneData.journal,entry];
      addMsg("system",`🤖 DM: ${narr}`);

      const shouldFight=scene?.encounter&&(cl.includes("attack")||cl.includes("fight")||cl.includes("confront")||cl.includes("storm")||cl.includes("enter")||scene.encounter.trigger==="always"||Math.random()>0.5);

      if(shouldFight&&scene?.encounter){
        setTimeout(()=>{
          const monsToAdd=scene.encounter.monsters.map(mn=>{const t=MONSTERS.find(m=>m.n===mn);return t?{...t,id:uid(),curHp:t.hp}:null;}).filter(Boolean);
          syncAction({type:'SET_MONSTERS',payload:monsToAdd});
          const ee={type:"encounter",text:`⚔️ ${monsToAdd.map(m=>m.n).join(", ")} attack!`,ts:Date.now()};
          addMsg("system",`🤖 DM: ⚔️ Roll for initiative!`);
          setTimeout(()=>{
            const cmbs=[];
            chars.forEach(c=>{
              const init=rd(20)+aMod(c.stats?.DEX||10);const sm=aMod(c.stats?.STR||10),dm2=aMod(c.stats?.DEX||10),p2=pb(c.level||1);const cls2=CLASSES[c.cls];
              const cW={Barbarian:[{n:"Greataxe",b:sm+p2,dm:`1d12+${sm} slash`}],Fighter:[{n:"Longsword",b:sm+p2,dm:`1d8+${sm} slash`}],Rogue:[{n:"Rapier",b:dm2+p2,dm:`1d8+${dm2} pierce`}],Ranger:[{n:"Longbow",b:dm2+p2,dm:`1d8+${dm2} pierce`}],Bard:[{n:"Rapier",b:dm2+p2,dm:`1d8+${dm2} pierce`}],Cleric:[{n:"Mace",b:sm+p2,dm:`1d6+${sm} bludg`}],Paladin:[{n:"Longsword",b:sm+p2,dm:`1d8+${sm} slash`}],Monk:[{n:"Unarmed",b:dm2+p2,dm:`1d4+${dm2} bludg`}],Druid:[{n:"Staff",b:sm+p2,dm:`1d6+${sm} bludg`}],Warlock:[{n:"Eldritch Blast",b:aMod(c.stats?.CHA||10)+p2,dm:"1d10 force"}],Sorcerer:[{n:"Fire Bolt",b:aMod(c.stats?.CHA||10)+p2,dm:"1d10 fire"}],Wizard:[{n:"Fire Bolt",b:aMod(c.stats?.INT||10)+p2,dm:"1d10 fire"}]};
              let atk=cW[c.cls]||[{n:"Unarmed",b:sm+p2,dm:`1d4+${sm} bludg`}];
              if(cls2?.sc&&c.spells?.length)c.spells.forEach(sp=>{const dm3=sp.d?.match(/(\d+d\d+)/);if(dm3)atk.push({n:sp.n,b:aMod(c.stats?.[cls2.sa]||10)+p2,dm:`${dm3[1]} magical`});});
              cmbs.push({...c,init,isMon:false,actA:false,actB:false,actR:false,atk,moved:0});
            });
            monsToAdd.forEach(m=>cmbs.push({n:m.n,ac:m.ac,hp:m.hp,curHp:m.hp,id:m.id,d:m.d,s:m.s,co:m.co,atk:m.atk||[],tr:m.tr,cr:m.cr,xp:m.xp,sp:m.sp,init:rd(20)+aMod(m.d||10),isMon:true,actA:false,actB:false,actR:false,moved:0}));
            cmbs.sort((a,b)=>b.init-a.init);
            syncAction({type:'COMBAT_UPDATE',payload:{combatants:cmbs,turn:0,round:1,live:true}});
            cmbs.forEach(c=>addMsg("roll",`${c.name||c.n}: Initiative ${c.init}`));
            setPage("combat");
          },1500);
          syncAction({type:'SCENE_UPDATE',payload:{...sceneData,journal:[...j2,ee],choiceMade:true,waitingForDM:false}});
        },2000);
      } else {
        setTimeout(()=>{
          const ni=sceneData.sceneIdx+1;
          if(ni<scenes.length){const s=scenes[ni];
            syncAction({type:'SCENE_UPDATE',payload:{sceneIdx:ni,journal:[...j2,{type:"scene",title:s.t,text:s.narr,ts:Date.now()}],choiceMade:false,waitingForDM:false,playerActions:[]}});
            addMsg("system",`🤖 DM: 📜 ${s.t}`);
          } else {
            syncAction({type:'SCENE_UPDATE',payload:{...sceneData,journal:[...j2,{type:"scene",title:"🏆 Campaign Complete!",text:"The AI Dungeon Master declares your quest a triumph!",ts:Date.now()}],choiceMade:true,waitingForDM:false}});
            addMsg("system","🤖 DM: 🏆 Campaign Complete!");
          }
        },3500);
        syncAction({type:'SCENE_UPDATE',payload:{...sceneData,journal:j2}});
      }
    },1500);
    return()=>{if(aiRef.current)clearTimeout(aiRef.current);};
  },[aiDM,sceneData.waitingForDM,sceneData.sceneIdx]);

  // ── Auto-play monster turns in combat ──
  useEffect(()=>{
    if(!aiDM||!combatState.live)return;
    const{combatants,turn,round}=combatState;if(!combatants.length)return;
    const cur=combatants[turn];if(!cur?.isMon)return;
    const hp=cur.curHp??cur.hp;
    if(cbtRef.current)clearTimeout(cbtRef.current);

    cbtRef.current=setTimeout(()=>{
      const mn=cur.name||cur.n;
      if(hp<=0){
        // Dead — skip
        const n=(turn+1)%combatants.length;const nr=n===0?round+1:round;
        if(n===0)addMsg("system",`📜 Round ${nr}!`);
        const u=combatants.map((c,i)=>i===n?{...c,actA:false,actB:false,actR:false,moved:0}:c);
        syncAction({type:'COMBAT_UPDATE',payload:{combatants:u,turn:n,round:nr,live:true}});
        addMsg("system",`➡️ ${u[n]?.name||u[n]?.n}'s turn`);
        return;
      }
      // Pick target (lowest HP alive PC)
      const pcs=combatants.map((c,i)=>({...c,idx:i})).filter(c=>!c.isMon&&c.hp>0);
      if(!pcs.length){addMsg("system","🤖 No targets remain.");return;}
      const tgt=pcs.sort((a,b)=>a.hp-b.hp)[0];
      const atk=cur.atk?.length?cur.atk[0]:{n:"Attack",b:3,dm:"1d6+1 bludgeoning"};
      const roll2=rd(20),total=roll2+(atk.b||0),n20=roll2===20,n1=roll2===1,hits=n20||(!n1&&total>=(tgt.ac||10));
      let msg2=`🤖 🗡️ ${mn} attacks ${tgt.name} with ${atk.n}: 🎲 ${roll2}${atk.b?` ${ms(atk.b)}`:""} = ${total} vs AC ${tgt.ac}`;
      if(n20)msg2+=" ✨ CRIT!";else if(n1)msg2+=" 💀 MISS!";else if(hits)msg2+=" HIT!";else msg2+=" MISS!";
      addMsg("roll",msg2);
      let dmg=0;
      if(hits&&atk.dm){const dm=atk.dm.match(/(\d+)d(\d+)([+-]\d+)?/);
        if(dm){let dr=rdN(parseInt(dm[1]),parseInt(dm[2]));if(n20)dr=[...dr,...rdN(parseInt(dm[1]),parseInt(dm[2]))];
          dmg=Math.max(1,dr.reduce((a,b)=>a+b,0)+(parseInt(dm[3])||0));addMsg("roll",`  💥 ${dmg} damage${n20?" (CRIT!)":""}`);}
      }
      const ni=(turn+1)%combatants.length;const nr=ni===0?round+1:round;
      const u=combatants.map((c,i)=>{
        if(i===turn)return{...c,actA:true};
        if(i===tgt.idx&&dmg>0){const nh=Math.max(0,c.hp-dmg);if(nh===0)addMsg("system",`💀 ${c.name} drops to 0 HP!`);return{...c,hp:nh};}
        if(i===ni)return{...c,actA:false,actB:false,actR:false,moved:0};
        return c;
      });
      if(dmg>0&&tgt.id)syncAction({type:'UPDATE_CHAR',payload:{...tgt,hp:Math.max(0,tgt.hp-dmg),idx:undefined}});
      setTimeout(()=>{
        if(ni===0)addMsg("system",`📜 Round ${nr}!`);
        syncAction({type:'COMBAT_UPDATE',payload:{combatants:u,turn:ni,round:nr,live:true}});
        addMsg("system",`➡️ ${u[ni]?.name||u[ni]?.n}'s turn`);
      },1000);
    },2000);
    return()=>{if(cbtRef.current)clearTimeout(cbtRef.current);};
  },[aiDM,combatState.live,combatState.turn]);

  // ── Auto-end combat when all monsters dead ──
  useEffect(()=>{
    if(!aiDM||!combatState.live)return;
    const{combatants}=combatState;
    const tm=combatants.filter(c=>c.isMon).length;const ma=combatants.filter(c=>c.isMon&&(c.curHp??c.hp)>0).length;
    if(tm>0&&ma===0){
      const xp=combatants.filter(c=>c.isMon).reduce((s,m)=>s+(m.xp||0),0);
      setTimeout(()=>{
        addMsg("system",`🤖 DM: 🏆 Victory! ${xp} XP earned!`);
        syncAction({type:'COMBAT_UPDATE',payload:{combatants:[],turn:0,round:1,live:false}});
        setTimeout(()=>setPage("campaign"),2000);
      },2000);
    }
  },[aiDM,combatState]);
}

// ═══════════════════════════════════════════════════════════
// MAIN APP — with multiplayer sync
// ═══════════════════════════════════════════════════════════
export default function App() {
  const [sess,setSess]=useState(null);const [page,setPage]=useState("campaign");
  const [chars,setChars]=useState([]);const [aCh,setACh]=useState(0);
  const [mons,setMons]=useState([]);const [camp,setCamp]=useState(null);
  const [msgs,setMsgs]=useState([]);const [creating,setCreating]=useState(false);
  const [sceneData,setSceneData]=useState({sceneIdx:0,journal:[],choiceMade:false,waitingForDM:false,playerActions:[]});
  const [combatState,setCombatState]=useState({combatants:[],turn:0,round:1,live:false});
  const stateVerRef = useRef(0); // version counter to detect changes

  const mp = useMultiplayer(sess);

  // Build the game state object (for sync)
  const getGameState = useCallback(() => ({
    chars, mons, camp, msgs, sceneData, combatState, v: stateVerRef.current
  }), [chars, mons, camp, msgs, sceneData, combatState]);

  // Apply received game state (players only)
  const applyGameState = useCallback((state) => {
    if (!state) return;
    if (state.chars) setChars(state.chars);
    if (state.mons !== undefined) setMons(state.mons);
    if (state.camp !== undefined) setCamp(state.camp);
    if (state.msgs) setMsgs(state.msgs);
    if (state.sceneData) setSceneData(state.sceneData);
    if (state.combatState) setCombatState(state.combatState);
  }, []);

  // Host: listen for player actions
  useEffect(() => {
    if (!sess?.host) return;
    mp.onAction((action) => {
      console.log('[Host] Action:', action.type);
      switch (action.type) {
        case 'ADD_CHAR':
          setChars(p => [...p, action.payload]);
          setMsgs(p => [...p, {t:"system",tx:`🛡️ ${action.payload.name} the ${action.payload.race} ${action.payload.cls} joins!`,s:"System",ts:Date.now()}]);
          break;
        case 'UPDATE_CHAR': {
          const {isMon,init,actA,actB,actR,moved,atk:_a,...cleanChar} = action.payload;
          setChars(p => p.map(c => c.id === cleanChar.id ? {...c,...cleanChar} : c));
          break;
        }
        case 'CHAT':
          setMsgs(p => [...p, action.payload]);
          break;
        case 'SET_CAMPAIGN':
          setCamp(action.payload);
          if (action.payload) setMsgs(p => [...p, {t:"system",tx:`📜 Campaign: ${action.payload.n}`,s:"System",ts:Date.now()}]);
          setSceneData({sceneIdx:0,journal:[],choiceMade:false,waitingForDM:false,playerActions:[]});
          break;
        case 'ADD_MONSTER':
          setMons(p => [...p, action.payload]);
          break;
        case 'REMOVE_MONSTER':
          setMons(p => p.filter((_, i) => i !== action.payload));
          break;
        case 'SET_MONSTERS':
          setMons(action.payload);
          break;
        case 'SCENE_UPDATE':
          setSceneData(action.payload);
          break;
        case 'COMBAT_UPDATE':
          setCombatState(action.payload);
          break;
      }
    });
  }, [sess, mp]);

  // Player: listen for state from host
  useEffect(() => {
    if (sess?.host) return;
    mp.onState(applyGameState);
  }, [sess, mp, applyGameState]);

  // Host: broadcast state whenever it changes
  useEffect(() => {
    if (!sess?.host || !mp.connected) return;
    stateVerRef.current++;
    const timer = setTimeout(() => {
      mp.broadcastState(getGameState());
    }, 50); // small debounce
    return () => clearTimeout(timer);
  }, [chars, mons, camp, msgs, sceneData, combatState, sess, mp, getGameState]);

  // ── Synced action helpers ──
  // These either apply locally (host) or send to host (player)
  const syncAction = useCallback((action) => {
    if (sess?.host) {
      // Host applies directly
      switch (action.type) {
        case 'ADD_CHAR':
          setChars(p => [...p, action.payload]);
          break;
        case 'UPDATE_CHAR': {
          const {isMon,init,actA,actB,actR,moved,atk:_a,...cleanChar} = action.payload;
          setChars(p => p.map(c => c.id === cleanChar.id ? {...c,...cleanChar} : c));
          break;
        }
        case 'CHAT':
          setMsgs(p => [...p, action.payload]);
          break;
        case 'SET_CAMPAIGN':
          setCamp(action.payload);
          break;
        case 'ADD_MONSTER':
          setMons(p => [...p, action.payload]);
          break;
        case 'REMOVE_MONSTER':
          setMons(p => p.filter((_, i) => i !== action.payload));
          break;
        case 'SET_MONSTERS':
          setMons(action.payload);
          break;
        case 'SCENE_UPDATE':
          setSceneData(action.payload);
          break;
        case 'COMBAT_UPDATE':
          setCombatState(action.payload);
          break;
      }
    } else {
      // Player sends to host
      mp.sendAction(action);
    }
  }, [sess, mp]);

  const addMsg=useCallback((t,tx,extra={})=>{
    const msg = {t,tx,s:sess?.name,...extra,ts:Date.now()};
    syncAction({type:'CHAT', payload: msg});
  },[sess,syncAction]);

  const ctx=useMemo(()=>({sess,addMsg,pn:sess?.name||"Player"}),[sess,addMsg]);

  const isDM = sess?.role==="dm";
  const aiDM = !isDM && !!sess?.host;

  // AI DM hook must be called before any conditional returns (Rules of Hooks)
  useAIDM({aiDM: aiDM && !!camp, camp, sceneData, combatState, chars, mons, syncAction, addMsg, setPage});

  if(!sess) return <Lobby onJoin={setSess}/>;

  const nav=isDM||aiDM?[{k:"campaign",l:"Play",i:"📜"},{k:"characters",l:"Characters",i:"🛡️"},{k:"combat",l:"Combat",i:"⚔️"},{k:"map",l:"Map",i:"🗺️"},{k:"dm",l:"DM Tools",i:"🎭"},{k:"spells",l:"Spells",i:"✨"},{k:"dice",l:"Dice",i:"🎲"}]
    :[{k:"campaign",l:"Play",i:"📜"},{k:"characters",l:"Character",i:"🛡️"},{k:"combat",l:"Combat",i:"⚔️"},{k:"map",l:"Map",i:"🗺️"},{k:"spells",l:"Spells",i:"✨"},{k:"dice",l:"Dice",i:"🎲"}];

  return <AppCtx.Provider value={ctx}><style>{CSS}</style><div className="abg">
    <div className="nav"><div className="fr gs">
      <span style={{fontFamily:"Cinzel Decorative",fontWeight:700,color:"var(--gold)",fontSize:".95rem"}}>⚔️ D&D 5e</span>
      <span className="bdg bdg-g">{sess.rc}</span><span className="td2 tx">{sess.name} • {isDM?"DM":aiDM?"Player + 🤖AI DM":"Player"}</span>
      {/* Connection status */}
      <span className="bdg" style={{
        background: mp.connected ? 'rgba(58,138,74,.15)' : 'rgba(139,26,26,.15)',
        color: mp.connected ? '#4a9a4a' : 'var(--redb)',
        border: `1px solid ${mp.connected ? 'rgba(58,138,74,.3)' : 'rgba(139,26,26,.3)'}`
      }}>
        {mp.connected ? `● ${mp.players.length} online` : '○ connecting...'}
      </span>
    </div><div className="fr gs" style={{flexWrap:"wrap"}}>
      {nav.map(n=><button key={n.k} className={`nb ${page===n.k?"a":""}`} onClick={()=>setPage(n.k)}>{n.i} {n.l}</button>)}
    </div><button className="btn bs bd" onClick={()=>setSess(null)}>Leave</button></div>

    {/* Connection error banner */}
    {mp.error && <div style={{background:'rgba(139,26,26,.2)',borderBottom:'1px solid rgba(139,26,26,.3)',padding:'8px 16px',textAlign:'center',fontSize:'.85rem',color:'var(--redb)'}}>
      ⚠️ {mp.error}
    </div>}

    <div className="container" style={{maxWidth:1360,margin:"0 auto",padding:"16px 14px 40px"}}>
      <div className="lay" style={{display:"grid",gridTemplateColumns:"1fr 320px",gap:16}}>
        <div>
          {page==="campaign"&&!camp&&<CampSel onSel={c=>{
            syncAction({type:'SET_CAMPAIGN', payload: c});
            syncAction({type:'SCENE_UPDATE', payload: {sceneIdx:0,journal:[],choiceMade:false,waitingForDM:false,playerActions:[]}});
            addMsg("system",`📜 Campaign: ${c.n}`);
          }}/>}
          {page==="campaign"&&camp&&<SessionPlay camp={camp} isDM={isDM||aiDM} aiDM={aiDM} chars={chars} mons={mons} sceneData={sceneData} setPage={setPage} setMons={(newMons)=>{
            const val = typeof newMons === 'function' ? newMons(mons) : newMons;
            syncAction({type:'SET_MONSTERS',payload:val});
          }} syncAction={syncAction}/>}

          {page==="characters"&&!creating&&<div className="afu">
            <div className="fb mb"><h2>Characters ({chars.length})</h2><button className="btn bp" onClick={()=>setCreating(true)}>+ New</button></div>
            {chars.length>0?<div>{chars.length>1&&<div className="fr mb">{chars.map((c,i)=><button key={c.id} className={`btn bs ${aCh===i?"bp":""}`} onClick={()=>setACh(i)}>{c.name||`Char ${i+1}`}</button>)}</div>}
              <CharSheet ch={chars[aCh]} onUp={u=>{
                syncAction({type:'UPDATE_CHAR', payload: u});
              }}/></div>
            :<div className="pnl tc" style={{padding:50}}>
              <div style={{fontSize:"2.5rem",marginBottom:12}}>🛡️</div><h3>No Characters</h3>
              <div className="td2 mt mb">Create your first character.</div>
              <button className="btn bp bl" onClick={()=>setCreating(true)}>⚔️ Create Character</button></div>}
          </div>}
          {page==="characters"&&creating&&<CharCreate onDone={ch=>{
            syncAction({type:'ADD_CHAR', payload: ch});
            setACh(chars.length);setCreating(false);
            addMsg("system",`🛡️ ${ch.name} the ${ch.race} ${ch.cls} joins!`);
          }}/>}

          {page==="combat"&&<Combat chars={chars} mons={mons} syncAction={syncAction} isDM={isDM||aiDM} combatState={combatState}/>}
          {page==="map"&&<BattleMap chars={chars} mons={mons} combatState={combatState} syncAction={syncAction} camp={camp} sceneData={sceneData}/>}
          {page==="dm"&&(isDM||aiDM)&&<DMTools mons={mons} setMons={(newMons)=>{
            const val = typeof newMons === 'function' ? newMons(mons) : newMons;
            syncAction({type:'SET_MONSTERS',payload:val});
          }} camp={camp}/>}
          {page==="spells"&&<SpellRef/>}
          {page==="dice"&&<div style={{maxWidth:480,margin:"0 auto"}}><DiceRoller/></div>}
        </div>
        <div className="sb-desk" style={{position:"sticky",top:56,height:"calc(100vh - 72px)"}}><Chat msgs={msgs}/></div>
      </div>
    </div>

    {/* Mobile chat */}
    <MobileChat msgs={msgs}/>
  </div></AppCtx.Provider>;
}

function MobileChat({msgs}) {
  const [open,setOpen]=useState(false);
  return <>
    <button className="chat-toggle" onClick={()=>setOpen(!open)}>{open?"✕":"💬"}</button>
    <div className={`chat-mobile pnl ${open?"open":""}`}><Chat msgs={msgs}/></div>
  </>;
}
