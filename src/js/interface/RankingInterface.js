// JavaScript Document

var InterfaceMaster = (function () {
    var instance;

    function createInstance() {


        var object = new interfaceObject();

		function interfaceObject(){

			var self = this;
			var data;
			var gm = GameMaster.getInstance();
			var jumpToPoke = false;
			var limitedPokemon = [];
			var context = "rankings";
			var battle = new Battle();
			var customRankingInterface;
			var metaGroup = [];
			var csv = '';

			// The scenario generated by the rankings,
			// This really should be embedded in the ranking data but this is a quick fix for now
			var scenario = {
				slug: "custom",
				shields: [1,1],
				energy: [0,0]
			};

			var scenarios = [];

			this.init = function(){
				scenarios = GameMaster.getInstance().data.rankingScenarios;

				if(! get){
					this.displayRankings("overall","1500","all");
				} else{
					this.loadGetData();
				}

				// Remove Little Cup from options (currently n/a)
				if(context != "custom"){
					$(".league-select option[value='500']").remove();
				}

				$(".format-select").on("change", selectFormat);
				$(".league-select").on("change", selectLeague);
				$(".ranking-categories a").on("click", selectCategory);
				$("body").on("click", ".check", checkBox);
				$("body").on("click", ".check.limited", toggleLimitedPokemon);
				$("body").on("click", ".check.xl", toggleXLPokemon);
				$("body").on("click", ".continentals .check", toggleContinentalsSlots);
				$("body").on("click", ".detail-section .trait-info, .detail-section .traits > div", openTraitPopup);
				$("body").on("click", ".detail-section a.show-move-stats", toggleMoveStats);

				pokeSearch.setBattle(battle);

				window.addEventListener('popstate', function(e) {
					get = e.state;
					self.loadGetData();
				});
			};

			// Grabs ranking data from the Game Master

			this.displayRankings = function(category, league, cup){

				var gm = GameMaster.getInstance();

				$(".rankings-container").html('');
				$(".loading").show();

				// Force 1500 if not general

				if((cup == "premier")&&(league == 1500)){
					league = 10000;

					$(".league-select option[value=\"10000\"]").prop("selected","selected");
				}

				if((cup == "classic")&&(league != 10000)){
					league = 10000;

					$(".league-select option[value=\"10000\"]").prop("selected","selected");
				}

				if(cup == "little"){
					league = 500;

					$(".league-select option[value=\"500\"]").prop("selected","selected");
				}

				if(cup == "prismatic"){
					$(".continentals").show();
				}

				battle.setCup(cup);
				battle.setCP(league);

				if(cup == "beam"){
					category = "beaminess";
					$(".description").hide();
					$(".description."+category).show();
				}

				if(battle.getCup().link){
					$(".description.link").show();
					console.log(battle.getCup());
					$(".description.link a").attr("href", battle.getCup().link);
					$(".description.link a").html(battle.getCup().link);
				} else{
					$(".description.link").hide();
				}

				/* This timeout allows the interface to display the loading message before
				being thrown into the data loading loop */

				setTimeout(function(){
					gm.loadRankingData(self, category, league, cup);
				}, 50);

			}

			// Displays the grabbed data. Showoff.

			this.displayRankingData = function(rankings){

				var gm = GameMaster.getInstance();

				data = rankings;

				// Pass this along to the custom ranking interface to fill in movesets
				if(context == "custom"){
					customRankingInterface.importMovesetsFromRankings(data);
				}

				// Show any restrictions
				var cup = battle.getCup().name;
				$(".limited").hide();
				limitedPokemon = [];

				if((gm.getCupById(cup))&&(gm.getCupById(cup).restrictedPokemon)){
					$(".limited").show();
					$(".check.limited").addClass("on");

					limitedPokemon = gm.getCupById(cup).restrictedPokemon;
				}

				if(cup == "championships-1"){
					$(".limited").show();
					$(".check.limited").addClass("on");

					limitedPokemon = ["medicham","lucario","venusaur","meganium","skarmory","altaria","bastiodon","probopass","tropius","azumarill"];
				}

				if(cup == "fantasy"){
					$(".limited").show();
					$(".check.limited").addClass("on");

					limitedPokemon = ["azumarill","deoxys_defense","medicham","wormadam_trash","forretress","sableye"];
				}

				$(".section.white > .rankings-container").html('');

				// Initialize csv data

				csv = 'Pokemon,Score,Type 1,Type 2,Attack,Defense,Stamina,Stat Product,Level,Fast Move,Charged Move 1,Charged Move 2\n';


				// Create an element for each ranked Pokemon
				metaGroup = [];

				for(var i = 0; i < rankings.length; i++){
					var r = rankings[i];

					var pokemon = new Pokemon(r.speciesId, 0, battle);

					if(! pokemon.speciesId){
						rankings.splice(i, 1);
						i--;
						continue;
					}

					pokemon.initialize(true);
					pokemon.selectMove("fast", r.moveset[0]);
					pokemon.selectMove("charged", r.moveset[1], 0);

					if(r.moveset.length > 2){
						pokemon.selectMove("charged", r.moveset[2],1);
					} else{
						pokemon.selectMove("charged", "none", 1);
					}

					if(! pokemon.speciesId){
						continue;
					}

					if(i < 100){
						metaGroup.push(pokemon);
					}

					// Get names of of ranking moves

					var moveNameStr = "";

					// Put together the recommended moveset string
					for(var n = 0; n < r.moveset.length; n++){
						if(n == 0){
							for(var j = 0; j < pokemon.fastMovePool.length; j++){
								if(r.moveset[n] == pokemon.fastMovePool[j].moveId){
									moveNameStr += pokemon.fastMovePool[j].displayName;
									break;
								}
							}
						} else{
							for(var j = 0; j < pokemon.chargedMovePool.length; j++){
								if(r.moveset[n] == pokemon.chargedMovePool[j].moveId){
									moveNameStr += pokemon.chargedMovePool[j].displayName;
									break;
								}
							}
						}

						if(n < r.moveset.length - 1){
							moveNameStr += ", "
						}
					}

					// Is this the best way to add HTML content? I'm gonna go with no here. But does it work? Yes!

					var $el = $("<div class=\"rank " + pokemon.types[0] + "\" type-1=\""+pokemon.types[0]+"\" type-2=\""+pokemon.types[1]+"\" data=\""+pokemon.speciesId+"\"><div class=\"expand-label\"></div><div class=\"name-container\"><span class=\"number\">#"+(i+1)+"</span><span class=\"name\">"+pokemon.speciesName+"</span><div class=\"moves\">"+moveNameStr+"</div></div><div class=\"rating-container\"><div class=\"rating\">"+r.score+"</span></div><div class=\"clear\"></div></div><div class=\"details\"></div>");

					if(limitedPokemon.indexOf(pokemon.speciesId) > -1){
						$el.addClass("limited-rank");
					}

					$(".section.white > .rankings-container").append($el);

					// Determine XL category

					if(pokemon.needsXLCandy()){
						$el.find(".name").append("<span class=\"xl-info-icon\">XL</span>");
					}

					// For Prismatic Cup, show color category

					if(cup == "prismatic"){
						var slots = battle.getCup().slots;

						for(var n = 0; n < slots.length; n++){
							if(slots[n].pokemon.indexOf(pokemon.speciesId) > -1){
								$el.find(".moves").prepend("<b>Slot " + (n+1) + ".</b>&nbsp;");
								break;
							}
						}
					}

					var chargedMove2Name = '';

					if(pokemon.chargedMoves.length > 1){
						chargedMove2Name = pokemon.chargedMoves[1].name;
					}

					csv += pokemon.speciesName+','+r.score+','+pokemon.types[0]+','+pokemon.types[1]+','+(Math.round(pokemon.stats.atk*10)/10)+','+(Math.round(pokemon.stats.def*10)/10)+','+Math.round(pokemon.stats.hp)+','+Math.round(pokemon.stats.atk*pokemon.stats.def*pokemon.stats.hp)+','+pokemon.level+','+pokemon.fastMove.name+','+pokemon.chargedMoves[0].name+','+chargedMove2Name+'\n';
				}

				$(".loading").hide();
				$(".rank").on("click", selectPokemon);

				// Update download link with new data
				var filename = battle.getCup().name + " Rankings.csv";
				var filedata = '';

				if(context == "custom"){
					filename = "Custom Rankings.csv";
				}

				if (!csv.match(/^data:text\/csv/i)) {
					filedata = [csv];
					filedata = new Blob(filedata, { type: 'text/csv'});
				}

				$(".button.download-csv").attr("href", window.URL.createObjectURL(filedata));
				$(".button.download-csv").attr("download", filename);


				// If search string exists, process it

				if($(".poke-search").val() != ''){
					$(".poke-search").trigger("keyup");
				}

				if((! $(".check.xl").hasClass("on"))&&(context != "custom")){
					toggleXLPokemon();
				}


				// If a Pokemon has been selected via URL parameters, jump to it

				if(jumpToPoke){
					var $el = $(".rank[data=\""+jumpToPoke+"\"]")
					$el.trigger("click");

					// Scroll to element

					$("html, body").animate({ scrollTop: $(document).height()-$(window).height() }, 500);
					$(".rankings-container").scrollTop($el.position().top-$(".rankings-container").position().top-20);

					jumpToPoke = false;
				}
			}

			// Given JSON of get parameters, load these settings

			this.loadGetData = function(){

				if(! get){
					return false;
				}

				// Cycle through parameters and set them

				for(var key in get){
					if(get.hasOwnProperty(key)){

						var val = get[key];

						// Process each type of parameter

						switch(key){

							// Don't process default values so data doesn't needlessly reload

							case "cp":
								battle.setCP(val);
								break;

							case "cat":
								$(".ranking-categories a").removeClass("selected");
								$(".ranking-categories a[data=\""+val+"\"]").addClass("selected");

								// Set the corresponding scenario

								var scenarioStr = val;

								if(val == "overall"){
									scenarioStr = "leads";
								}

								for(var i = 0; i < scenarios.length; i++){
									if(scenarios[i].slug == scenarioStr){
										scenario = scenarios[i];
									}
								}
								break;

							case "cup":
								battle.setCup(val);
								break;

							case "p":
								// We have to wait for the data to load before we can jump to a Pokemon, so store this for later
								jumpToPoke = val;
								break;

						}
					}
				}

				// Load data via existing change function

				var cp = battle.getCP();
				var category = $(".ranking-categories a.selected").attr("data");
				var cup = battle.getCup().name;

				$(".format-select option[value=\""+cp+"\"][cup=\""+cup+"\"]").prop("selected","selected");

				self.displayRankings(category, cp, cup, null);
			}

			// When the view state changes, push to browser history so it can be navigated forward or back

			this.pushHistoryState = function(cup, cp, category, speciesId){
				if(context == "custom"){
					return false;
				}

				if(cup == "little"){
					cp = 500;
				}

				var url = webRoot+"rankings/"+cup+"/"+cp+"/"+category+"/";

				if(speciesId){
					url += speciesId+"/";
				}

				var data = {cup: cup, cp: cp, cat: category, p: speciesId };

				window.history.pushState(data, "Rankings", url);

				// Send Google Analytics pageview

				gtag('config', UA_ID, {page_location: (host+url), page_path: url});
				gtag('event', 'Lookup', {
				  'event_category' : 'Rankings',
				  'event_label' : speciesId
				});
			}

			// Set a context so this interface can add or skip functionality

			this.setContext = function(value){
				context = value;

				if(context == "custom"){
					$(".league-select option[value='500']").show();
				}
			}

			// Set a ranking scenario to be displayed

			this.setScenario = function(value){
				scenario = value;
			}

			// Link the custom ranking interface so these two can talk

			this.setCustomRankingInterface = function(obj){
				customRankingInterface = obj;
			}

			// Return a custom group of the top 100 Pokemon

			this.getMetaGroup = function(){
				return metaGroup;
			}

			// Event handler for changing the league select

			function selectLeague(e){
				var cp = battle.getCP();
				var levelCap = parseInt($(".league-select option:selected").attr("level-cap"));

				if(context != "custom"){
					var category = $(".ranking-categories a.selected").attr("data");
					var cup = battle.getCup().name;

					if(cp == 500){
						$(".format-select option[cup=\"little\"]").prop("selected","selected");
						cup = "little";
					} else if(cup == "little"){
						$(".format-select option[cup=\"all\"]").prop("selected","selected");
						cup = "all";
					}

					battle.setCup(cup);

					self.displayRankings(category, cp, cup);
					self.pushHistoryState(cup, cp, category, null);
				} else{
					cp = $(".league-select option:selected").val();
				}

				battle.setCP(cp);
				battle.setLevelCap(levelCap);
			}

			// Event handler for changing the cup select

			function selectFormat(e){
				var cp = $(".format-select option:selected").val();
				var cup = $(".format-select option:selected").attr("cup");
				var category = $(".ranking-categories a.selected").attr("data");

				if(! category){
					category = "overall";
				}

				if(cup == "custom"){
					window.location.href = webRoot+'custom-rankings/';
					return;
				}

				self.displayRankings(category, cp, cup);
				self.pushHistoryState(cup, cp, category, null);
			}


			// Event handler for selecting ranking category

			function selectCategory(e){

				e.preventDefault();

				$(".ranking-categories a").removeClass("selected");

				$(e.target).addClass("selected");

				var cp = $(".format-select option:selected").val();
				var category = $(".ranking-categories a.selected").attr("data");
				var scenarioStr = $(".ranking-categories a.selected").attr("scenario");
				var cup = $(".format-select option:selected").attr("cup");

				$(".description").hide();
				$(".description."+category).show();

				// Set the corresponding scenario

				for(var i = 0; i < scenarios.length; i++){
					if(scenarios[i].slug == scenarioStr){
						scenario = scenarios[i];
						break;
					}
				}

				self.displayRankings(category, cp, cup);

				self.pushHistoryState(cup, cp, category, null);
			}

			// Event handler clicking on a Pokemon item, load detail data

			function selectPokemon(e){

				// Don't collapse when clicking links or the share button

				if(! $(e.target).is(".rank, .rank > .rating-container, .rank > .rating-container *, .rank > .name-container, .rank > .name-container *, .rank > .expand-label")||($(e.target).is("a"))){
					return;
				}

				var cup = $(".format-select option:selected").attr("cup");
				var category = $(".ranking-categories a.selected").attr("data");
				var $rank = $(this).closest(".rank");

				$rank.toggleClass("selected");
				$rank.find(".details").toggleClass("active");

				var index = $(".rankings-container > .rank").index($rank);
				var $details = $(".details").eq(index);

				if($details.html() != ''){
					return;
				}

				var r = data[index];
				var pokemon = new Pokemon(r.speciesId, 0, battle);
				pokemon.initialize(battle.getCP(), "gamemaster");
				pokemon.selectMove("fast", r.moveset[0]);
				pokemon.selectMove("charged", r.moveset[1], 0);

				if(r.moveset.length > 2){
					pokemon.selectMove("charged", r.moveset[2],1);
				} else{
					pokemon.selectMove("charged", "none", 1);
				}

				var pokeMoveStr = pokemon.generateURLMoveStr();

				// If overall, display score for each category

				if(r.scores){
					var categories = ["Lead","Closer","Switch","Charger","Attacker","Consistency"];

					var $section = $("<div class=\"detail-section overall\"></div>");

					for(var i = 0; i < r.scores.length; i++){
						var $item = $("<div class=\"rating-container\"><div class=\"ranking-header\">"+categories[i]+"</div><div class=\"rating\">"+r.scores[i]+"</div></div>");

						$section.append($item);
					}

					$details.append($section);
				}

				// Display move data

				var fastMoves = pokemon.fastMovePool;
				var chargedMoves = pokemon.chargedMovePool;

				for(var j = 0; j < fastMoves.length; j++){
					fastMoves[j].uses = 0;

					for(var n = 0; n < r.moves.fastMoves.length; n++){
						var move = r.moves.fastMoves[n];

						if(move.moveId == fastMoves[j].moveId){
							fastMoves[j].uses = move.uses;
						}
					}
				}

				for(var j = 0; j < chargedMoves.length; j++){
					chargedMoves[j].uses = 0;

					for(var n = 0; n < r.moves.chargedMoves.length; n++){
						var move = r.moves.chargedMoves[n];

						if(move.moveId == chargedMoves[j].moveId){
							chargedMoves[j].uses = move.uses;
						}
					}
				}

				fastMoves.sort((a,b) => (a.uses > b.uses) ? -1 : ((b.uses > a.uses) ? 1 : 0));
				chargedMoves.sort((a,b) => (a.uses > b.uses) ? -1 : ((b.uses > a.uses) ? 1 : 0));

				// Buckle up, this is gonna get messy. This is the main detail HTML.

				$details.append($(".details-template.hide").html());


				// Display Pokemon stats
				var overall = Math.round((pokemon.stats.hp * pokemon.stats.atk * pokemon.stats.def) / 1000);

				$details.find(".stat-details .stat-row .value").eq(0).html(Math.floor(pokemon.stats.atk*10)/10);
				$details.find(".stat-details .stat-row .value").eq(1).html(Math.floor(pokemon.stats.def*10)/10);
				$details.find(".stat-details .stat-row .value").eq(2).html(pokemon.stats.hp);
				$details.find(".stat-details .stat-row .value").eq(3).html(overall);

				// Display bars
				$details.find(".stat-details .stat-row .bar").addClass(pokemon.types[0]);

				/*
				* Explanation for the following section: Instead of displaying stats proportionally,
				* I'm shifting the baseline so the scale goes from e.g. 100-350 instead of 0-350.
				* This has the effect of making high or low stats appear more extreme, giving the
				* stat bars a stronger visual impact.
				*
				* For example, Haunter is one of the squishiest Great League Pokemon. Its stat
				* product (1400) is half that Bastiodon (2800). If Bastiodon represents a full stat
				* bar, representing Haunter as half of that length doesn't truly convey the difference
				* between the two. Thus, the adjustments here make for a more striking scale.
				*
				* Thanks for coming to by TED talk.
				*/

				var statCeiling = 230;
				var statSubtraction = 80;
				var statProductCeiling = 4500;
				var statProductSubstraction = 4500;

				if(battle.getCP() == 500){
					statProductCeiling = 1000;
					statCeiling = 200;
				} else if(battle.getCP() == 1500){
					statProductCeiling = 2000;
					statProductSubstraction = 1000;
					statCeiling = 250;
					statSubtraction = 50;
				} else if(battle.getCP() == 2500){
					statProductCeiling = 3000;
					statProductSubstraction = 2600;
					statCeiling = 300;
					statSubtraction = 50;
				}

				$details.find(".stat-details .stat-row .bar").eq(0).css("width", (( (pokemon.stats.atk - statSubtraction) / statCeiling) * 100) + "%");
				$details.find(".stat-details .stat-row .bar").eq(1).css("width", (((pokemon.stats.def - statSubtraction) / statCeiling) * 100) + "%");
				$details.find(".stat-details .stat-row .bar").eq(2).css("width", (((pokemon.stats.hp - statSubtraction) / statCeiling) * 100) + "%");
				$details.find(".stat-details .stat-row .bar").eq(3).css("width", (((overall - statProductSubstraction) / statProductCeiling) * 100) + "%");

				// Need to calculate percentages

				var totalFastUses = 0;

				for(var n = 0; n < fastMoves.length; n++){
					totalFastUses += fastMoves[n].uses;
				}

				// Display fast moves

				for(var n = 0; n < fastMoves.length; n++){
					var percentStr = (Math.floor((fastMoves[n].uses / totalFastUses) * 1000) / 10) + "%";
					var displayWidth = (Math.floor((fastMoves[n].uses / totalFastUses) * 1000) / 20);

					if(displayWidth < 14){
						displayWidth = "14%";
					} else{
						displayWidth = displayWidth + "%";
					}

					var $moveDetails = $details.find(".moveset.fast .move-detail-template.hide").clone();
					$moveDetails.removeClass("hide");

					// Contextualize the move archetype for this Pokemon
					var archetype = fastMoves[n].archetype;
					var archetypeClass = 'general'; // For CSS

					if(fastMoves[n].archetype == "Fast Charge"){
						archetypeClass = "spam";
					} else if(fastMoves[n].archetype == "Heavy Damage"){
						archetypeClass = "nuke";
					} else if(fastMoves[n].archetype == "Multipurpose"){
   						archetypeClass = "high-energy";
					} else if(fastMoves[n].archetype == "Low Quality"){
						archetypeClass = "low-quality";
					}


					$moveDetails.addClass(fastMoves[n].type);
					$moveDetails.find(".name").html(fastMoves[n].displayName);
					$moveDetails.find(".archetype .name").html(archetype);
					$moveDetails.find(".archetype .icon").addClass(archetypeClass);
					$moveDetails.find(".dpt .value").html(Math.round( ((fastMoves[n].power * fastMoves[n].stab * pokemon.shadowAtkMult) / (fastMoves[n].cooldown / 500)) * 100) / 100);
					$moveDetails.find(".ept .value").html(Math.round( (fastMoves[n].energyGain / (fastMoves[n].cooldown / 500)) * 100) / 100);
					$moveDetails.find(".turns .value").html( fastMoves[n].cooldown / 500 );

					// Highlight this move if it's in the recommended moveset

					if(fastMoves[n] == pokemon.fastMove){
						$moveDetails.addClass("selected");
					}

					$details.find(".moveset.fast").append($moveDetails);
				}

				// Display charged moves

				var totalChargedUses = 0;

				for(var n = 0; n < chargedMoves.length; n++){
					totalChargedUses += chargedMoves[n].uses;
				}

				for(var n = 0; n < chargedMoves.length; n++){
					percentStr = (Math.floor((chargedMoves[n].uses / totalChargedUses) * 1000) / 10) + "%";
					displayWidth = (Math.floor((chargedMoves[n].uses / totalChargedUses) * 1000) / 20);

					if(displayWidth < 14){
						displayWidth = "14%";
					} else{
						displayWidth = displayWidth + "%";
					}

					var $moveDetails = $details.find(".moveset.charged .move-detail-template.hide").clone();
					$moveDetails.removeClass("hide");

					// Contextualize the move archetype for this Pokemon
					var archetype = chargedMoves[n].archetype;
					var archetypeClass = 'general'; // For CSS

					if(chargedMoves[n].stab == 1){
						var descriptor = "Coverage";

						if(chargedMoves[n].type == "normal"){
							descriptor = "Neutral"
						}

						switch(archetype){
							case "General":
								archetype = descriptor;
								break;

							case "High Energy":
								if(descriptor == "Coverage"){
									archetype = "High Energy Coverage";
								}
								break;

							case "Spam/Bait":
								archetype = descriptor + " Spam/Bait";
								break;

							case "Nuke":
								archetype = descriptor + " Nuke";
								break;

						}
					}

					if(chargedMoves[n].archetype.indexOf("Boost") > -1){
					  archetypeClass = "boost";
				  	} else if(chargedMoves[n].archetype.indexOf("Self-Debuff") > -1){
						archetypeClass = "self-debuff";
					} else if(chargedMoves[n].archetype.indexOf("Spam") > -1){
						archetypeClass = "spam";
					} else if(chargedMoves[n].archetype.indexOf("High Energy") > -1){
						archetypeClass = "high-energy";
					} else if(chargedMoves[n].archetype.indexOf("Nuke") > -1){
						archetypeClass = "nuke";
					} else if(chargedMoves[n].archetype.indexOf("Debuff") > -1){
						archetypeClass = "debuff";
					}

					if(chargedMoves[n].archetype == "Debuff Spam/Bait"){
						archetypeClass = "debuff";
					}

					$moveDetails.addClass(chargedMoves[n].type);
					$moveDetails.find(".name").html(chargedMoves[n].displayName);
					$moveDetails.find(".archetype .name").html(archetype);
					$moveDetails.find(".archetype .icon").addClass(archetypeClass);
					$moveDetails.find(".damage .value").html(Math.round((chargedMoves[n].power * chargedMoves[n].stab * pokemon.shadowAtkMult) * 100) / 100);
					$moveDetails.find(".energy .value").html(chargedMoves[n].energy);
					$moveDetails.find(".dpe .value").html( Math.round( ((chargedMoves[n].power * chargedMoves[n].stab * pokemon.shadowAtkMult) / chargedMoves[n].energy) * 100) / 100);

					if(chargedMoves[n].buffs){
						$moveDetails.find(".move-effect").html(gm.getStatusEffectString(chargedMoves[n]));
					}

					// Highlight this move if it's in the recommended moveset

					for(var j = 0; j < pokemon.chargedMoves.length; j++){
						if(chargedMoves[n] == pokemon.chargedMoves[j]){
							$moveDetails.addClass("selected");
						}
					}

					$details.find(".moveset.charged").append($moveDetails);
				}

				// Helper variables for displaying matchups and link URL

				var cp = battle.getCP();

				if(context == "custom"){
					category = context;
				}

				// Display key matchups

				for(var n = 0; n < r.matchups.length; n++){
					var m = r.matchups[n];
					var opponent = new Pokemon(m.opponent, 1, battle);
					opponent.initialize(battle.getCP(), "gamemaster");
					opponent.selectRecommendedMoveset(category);

					var battleLink = host+"battle/"+battle.getCP(true)+"/"+pokemon.speciesId+"/"+opponent.speciesId+"/"+scenario.shields[0]+""+scenario.shields[1]+"/"+pokeMoveStr+"/"+opponent.generateURLMoveStr()+"/";

					// Append energy settings
					battleLink += pokemon.stats.hp + "-" + opponent.stats.hp + "/";

					if(scenario.energy[0] == 0){
						battleLink += "0";
					} else{
						battleLink += Math.min(pokemon.fastMove.energyGain * (Math.floor((scenario.energy[0] * 500) / pokemon.fastMove.cooldown)), 100);
					}

					battleLink += "-";

					if(scenario.energy[1] == 0){
						battleLink += "0";
					} else{
						battleLink += Math.min(opponent.fastMove.energyGain * (Math.floor((scenario.energy[1] * 500) / opponent.fastMove.cooldown)), 100);
					}

					battleLink += "/";

					var $item = $("<div class=\"rank " + opponent.types[0] + "\"><div class=\"name-container\"><span class=\"number\">#"+(n+1)+"</span><span class=\"name\">"+opponent.speciesName+"</span></div><div class=\"rating-container\"><div class=\"rating star\">"+m.rating+"</span></div><a target=\"_blank\" href=\""+battleLink+"\"></a><div class=\"clear\"></div></div>");

					$details.find(".matchups").append($item);
				}

				// Display top counters

				for(var n = 0; n < r.counters.length; n++){
					var c = r.counters[n];
					var opponent = new Pokemon(c.opponent, 1, battle);
					opponent.initialize(battle.getCP(), "gamemaster");
					opponent.selectRecommendedMoveset(category);
					var battleLink = host+"battle/"+battle.getCP(true)+"/"+pokemon.speciesId+"/"+opponent.speciesId+"/"+scenario.shields[0]+""+scenario.shields[1]+"/"+pokeMoveStr+"/"+opponent.generateURLMoveStr()+"/";

					// Append energy settings
					battleLink += pokemon.stats.hp + "-" + opponent.stats.hp + "/";

					if(scenario.energy[0] == 0){
						battleLink += "0";
					} else{
						battleLink += Math.min(pokemon.fastMove.energyGain * (Math.floor((scenario.energy[0] * 500) / pokemon.fastMove.cooldown)), 100);
					}

					battleLink += "-";

					if(scenario.energy[1] == 0){
						battleLink += "0";
					} else{
						battleLink += Math.min(opponent.fastMove.energyGain * (Math.floor((scenario.energy[1] * 500) / opponent.fastMove.cooldown)), 100);
					}

					var $item = $("<div class=\"rank " + opponent.types[0] + "\"><div class=\"name-container\"><span class=\"number\">#"+(n+1)+"</span><span class=\"name\">"+opponent.speciesName+"</span></div><div class=\"rating-container\"><div class=\"rating star\">"+(1000-c.rating)+"</span></div><a target=\"_blank\" href=\""+battleLink+"\"></a><div class=\"clear\"></div></div>");

					$details.find(".counters").append($item);
				}

				// Display Pokemon's type information

				$details.find(".typing .type").eq(0).addClass(pokemon.types[0]);
				$details.find(".typing .type").eq(0).html(pokemon.types[0]);

				if(pokemon.types[1] != "none"){
					$details.find(".typing .type").eq(1).addClass(pokemon.types[1]);
					$details.find(".typing .type").eq(1).html(pokemon.types[1]);
				} else{
					$details.find(".typing .rating-container").eq(1).hide();
				}

				// Display weaknesses and resistances
				var effectivenessArr = []; // First we need to push the values into a sortable array, the original is key indexed (essentially an object)
				for(var type in pokemon.typeEffectiveness) {
					if (pokemon.typeEffectiveness.hasOwnProperty(type)) {
						effectivenessArr.push({
	 					   type: type,
	 					   val: pokemon.typeEffectiveness[type]
	 				   });
					}
				}

				effectivenessArr.sort((a,b) => (a.val > b.val) ? -1 : ((b.val > a.val) ? 1 : 0));

				for(var i = 0; i < effectivenessArr.length; i++){
					var num = Math.floor(effectivenessArr[i].val * 1000) / 1000;
					if(effectivenessArr[i].val > 1){
						$details.find(".detail-section .weaknesses").append("<div class=\"type "+effectivenessArr[i].type+"\"><div class=\"multiplier\">x"+num+"</div><div>"+effectivenessArr[i].type+"</div></div>");
					}
				}

				for(var i = effectivenessArr.length - 1; i >= 0; i--){
					var num = Math.floor(effectivenessArr[i].val * 1000) / 1000;
					if(effectivenessArr[i].val < 1){
						$details.find(".detail-section .resistances").append("<div class=\"type "+effectivenessArr[i].type+"\"><div class=\"multiplier\">x"+num+"</div><div>"+effectivenessArr[i].type+"</div></div>");
					}
				}

				// Display Pokemon's stat ranges

				/*var statRanges = {
					atk: {
						min: pokemon.generateIVCombinations("atk", -1, 1)[0].atk,
						max: pokemon.generateIVCombinations("atk", 1, 1)[0].atk,
					},
					def: {
						min: pokemon.generateIVCombinations("def", -1, 1)[0].def,
						max: pokemon.generateIVCombinations("def", 1, 1)[0].def,
					},
					hp: {
						min: pokemon.generateIVCombinations("hp", -1, 1)[0].hp,
						max: pokemon.generateIVCombinations("hp", 1, 1)[0].hp,
					}
				};*/

				// Show share link
				var cup = battle.getCup().name;
				var cupName = $(".format-select option:selected").html();

				var link = host + "rankings/"+cup+"/"+cp+"/"+category+"/"+pokemon.speciesId+"/";

				$details.find(".share-link input").val(link);

				// Add multi-battle link
				if(context != "custom"){
					var multiBattleLink = host+"battle/multi/"+cp+"/"+cup+"/"+pokemon.speciesId+"/"+scenario.shields[0]+""+scenario.shields[1]+"/"+pokeMoveStr+"/2-1/";

					// Append energy settings
					multiBattleLink += pokemon.stats.hp + "/";

					if(scenario.energy[0] == 0){
						multiBattleLink += "0";
					} else{
						multiBattleLink += Math.min(pokemon.fastMove.energyGain * (Math.floor((scenario.energy[0] * 500) / pokemon.fastMove.cooldown)), 100);
					}

					multiBattleLink += "/";

					$details.find(".detail-section.float").eq(2).before($("<div class=\"multi-battle-link\"><p>See all of <b>" + pokemon.speciesName + "'s</b> matchups:</p><a target=\"_blank\" class=\"button\" href=\""+multiBattleLink+"\">"+pokemon.speciesName+" vs. " + cupName +"</a></div>"));
				} else{
					$details.find(".share-link").remove();
				}

				if(r.scores){
					// Display rating hexagon

					// This is really dumb but we're pulling the type color out of the background gradient
					var bgArr = $rank.css("background").split("linear-gradient(");
					bgArr = bgArr[1].split(" 30%");
					var bgStr = bgArr[0]

					hexagon.init($details.find(".hexagon"), 100);
	                hexagon.draw([
						Math.max( (r.scores[0] - 30) / 70 , .05 ),
						Math.max( (r.scores[2] - 30) / 70 , .05 ),
						Math.max( (r.scores[3] - 30) / 70 , .05 ),
						Math.max( (r.scores[1] - 30) / 70 , .05 ),
						Math.max( (r.scores[5] - 30) / 70 , .05 ),
						Math.max( (r.scores[4] - 30) / 70 , .05 ),
					], ['Lead', 'Switch', 'Charger', 'Closer', 'Consistency', 'Attacker'], bgStr);
				} else{
					$details.find(".detail-section.performance").remove();
					$details.find(".detail-section.poke-stats").css("width", "100%");
					$details.find(".detail-section.poke-stats").css("float", "none");
				}

				// Display buddy distance and second move cost
				var moveCostStr = pokemon.thirdMoveCost.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","); // Ugh regex

				$details.find(".buddy-distance").html(pokemon.buddyDistance + " km");
				$details.find(".third-move-cost").html(moveCostStr + " Stardust");

				// Display Pokemon's highest IV's

				var rank1Combo = pokemon.generateIVCombinations("overall", 1, 1)[0];
				$details.find(".stat-row.rank-1 .value").html("Lvl " + rank1Combo.level + " " + rank1Combo.ivs.atk + "/" + rank1Combo.ivs.def + "/" + rank1Combo.ivs.hp);

				var level41CP = pokemon.calculateCP(0.795300006866455, 15, 15, 15);

				pokemon.autoLevel = true;
				pokemon.setIV("atk", 15);
				pokemon.setIV("def", 15);
				pokemon.setIV("hp", 15);

				var hundoLevel = pokemon.level; // Getting the lowest possible level

				// Can this Pokemon get close the CP limit at level 41?

				if(level41CP >= battle.getCP() - 20){

					// This Pokemon can get close to the CP limit at level 41
					if(rank1Combo.level <= 41){
						$details.find(".xl-info-container").addClass("regular");
					} else{
						$details.find(".xl-info-container").addClass("mixed");
					}
				} else{
					if(pokemon.levelCap == 40){
						if(pokemon.hasTag("xs")){
							$details.find(".xl-info-container").addClass("xs");
						} else{
							$details.find(".xl-info-container").addClass("unavailable");
						}
					} else{
						if(level41CP >= battle.getCP() - 75){
							$details.find(".xl-info-container").addClass("mixed");
						} else{
							$details.find(".xl-info-container").addClass("xl");
						}

					}

				}

				// Display level range

				if(rank1Combo.level > hundoLevel){
					$details.find(".stat-row.level .value").html(hundoLevel + " - " + rank1Combo.level);
				} else{
					$details.find(".stat-row.level .value").html(rank1Combo.level);
				}

				// Display Pokemon traits
				pokemon.isCustom = false;
				pokemon.initialize(battle.getCP()); // Reset to default IVs
				var traits = pokemon.generateTraits();

				for(var i = 0; i < traits.pros.length; i++){
					$details.find(".traits").append("<div class=\"pro\" title=\""+traits.pros[i].desc+"\">+ "+traits.pros[i].trait+"</div>");
				}

				for(var i = 0; i < traits.cons.length; i++){
					$details.find(".traits").append("<div class=\"con\" title=\""+traits.cons[i].desc+"\">- "+traits.cons[i].trait+"</div>");
				}

				// Only execute if this was a direct action and not loaded from URL parameters, otherwise pushes infinite states when the user navigates back

				if((get)&&(get.p == pokemon.speciesId)){
					return;
				}

				self.pushHistoryState(cup, cp, category, pokemon.speciesId);
			}

			// Turn checkboxes on and off

			function checkBox(e){
				$(this).toggleClass("on");
				$(this).trigger("stateChange");
			}

			// Toggle the limited Pokemon from the Rankings

			function toggleLimitedPokemon(e){
				for(var i = 0; i < limitedPokemon.length; i++){
					$(".rank[data='"+limitedPokemon[i]+"']").toggleClass("hide");
				}
			}

			// Toggle XL Pokemon from the Rankings

			function toggleXLPokemon(e){

				$(".rankings-container > .rank").each(function(index, value){
					if($(this).find(".xl-info-icon").length > 0){
						$(this).toggleClass("hide");
					}
				});
			}

			// Show or hide Continentals slots

			function toggleContinentalsSlots(e){
				var selectedSlots = [];

				$(".continentals .check").each(function(index, value){
					if($(this).hasClass("on")){
						selectedSlots.push(index);
					}
				});

				var slots = battle.getCup().slots;

				for(var i = 0; i < slots.length; i++){
					if(selectedSlots.indexOf(i) > -1){
						for(var n = 0; n < slots[i].pokemon.length; n++){
							$(".rank[data='"+slots[i].pokemon[n]+"']").removeClass("hide");
						}
					} else{
						for(var n = 0; n < slots[i].pokemon.length; n++){
							$(".rank[data='"+slots[i].pokemon[n]+"']").addClass("hide");
						}
					}
				}

				if(selectedSlots.length == 0){
					$(".rank").removeClass("hide");
				}
			}

			// Display trait details in the modal window

			function openTraitPopup(e){
				e.preventDefault();

				var $rank = $(e.target).closest(".rank")
				var $traits = $rank.find(".traits")

				modalWindow("Traits", $(".trait-modal"));

				$(".modal .name").first().html($rank.find(".name-container .name").first().html().replace("XL",""));

				$traits.find("div").each(function(index, value){
					$(".modal .traits").append("<div class=\""+$(this).attr("class")+"\"><div class=\"name\">"+$(this).html()+"</div><div class=\"desc\">"+$(this).attr("title")+"</div></div>");
				});
			}

			// Toggle move stats in the ranking details

			function toggleMoveStats(e){
				e.preventDefault();

				var $rank = $(e.target).closest(".rank")
				$(e.target).toggleClass("on");
				$rank.find(".moveset").toggleClass("show-stats");
			}
		};

        return object;
    }

    return {
        getInstance: function () {
            if (!instance) {
                instance = createInstance();
            }
            return instance;
        }
    };
})();
