let bFoeScriptsInit = false, iMaxInitTries = 100,
	bStopExecution = false,
	bWaitForEnter = false,
	bBluePrintReceived = false,
	iAvailableFp = 999999,
	iCurrentPlayer = 0,
	oStandingArmy = new Set(),
	oMissingUnits = new Set(),
	oReplaceUnits = new Set(),
	oReserveUnits = {},
	oCanvas, 
	iYourPlayerId

const 
	aFreeTavernOwners = new Set(),
	fArcFactor = 1.900,
	iMinROI = 10, iMinFpReward = 50,
	aDontSnipePlayer = [], // Player IDs you don't want to snipe, use getPlayerIdOfPos() to get IDs
	aDontSnipeBuildings = [
		"X_AllAge_Oracle", // Orakel
		"X_BronzeAge_Landmark2", // Zeus
		"X_IronAge_Landmark2", // Leuchtturm
		"X_AllAge_EasterBonus4", // Observatorium
		"X_BronzeAge_Landmark1", // Turm zu Babel
		"X_EarlyMiddleAge_Landmark3", // Galataturm
	],
	oIgnoreResponses = {
		"AnnouncementsService": [
			"fetchAllAnnouncements"
		],
		"ArmyUnitManagementService": [
			"getArmyInfo"	
		],
		"BattlefieldService": [
			"startByBattleType",
			"getArmyPreview"
		],
		"BlueprintService": [
			"newReward",
			"getGreatBuildingInventoryForGreatBuilding",
			"unlockLevel",
			"setUsed"
		],
		"BonusService": [
			"getLimitedBonuses",
			"getBonuses"
		],
		"BoostService": [
			"getAllBoosts"	
		],
		"CampaignService": [
			"getDeposits"	
		],
		"CashShopService": [
			"getPricingInformation"
		],
		"CastleSystemService": [
			"getCastleSystemPlayer",
			"getOverview",
			"collectDailyPoints",
			"collectDailyReward"
		],
		"ChallengeService": [
			"getOptions",
			"getActiveChallenges",
			"updateTaskProgress" 
		],
		"CityMapService": [
			"getNextId",
			"reset",
			"updateEntity"
		],
		"CityProductionService": [
			"startProduction",
			"pickupProduction",
			"removePlunderedProduction"
		],
		"ConversationService": [
			"getOverviewForCategory",
			"getConversation",
			"editMessage",
			"markMessageRead",
			"getOverviewForCategory"
		],
		"CrmService": [
			"getContent"	
		],
		"EmissaryService": [
			"getAssigned"
		],
		"ForgePlusPackageService": [
			"getPackages"
		],
		"FriendService": [
			"getInvitationLink",
			"invitePlayerById",
			"getFriendSuggestions",
			"deleteFriend"
		],
		"FriendsTavernService": [
			"getSittingPlayersCount",
			"getOtherTavernStates",
			"getOtherTavernState",
			"getOtherTavern",
			"getConfig",
			"getOwnTavern",
			"collectReward"
		],
		"GreatBuildingsService": [
			"getConstruction",
			"getOtherPlayerOverview",
			"getAvailablePackageForgePoints",
			"contributeForgePoints"
		],
		"GuildBattlegroundService": [
			"getBattleground",
			"getPlayerParticipant"
		],
		"GuildBattlegroundStateService": [
			"getState"	
		],
		"GuildExpeditionService": [
			"markContributionNotificationsRead", 
			"startNegotiation",
			"openChest",
			"getChests",
			"getState",
			"getGuildReward",
			"getDifficulties",
			"changeDifficulty",
			"getOverview"
		],
		"GuildExpeditionNotificationService": [
			"receiveDifficultyNotification"	
		],
		"HiddenRewardService": [
			"getOverview",
			"collectReward"
		],
		"IgnorePlayerService": [
			"getIgnoreList"
		],
		"InventoryService": [
			"getItems",
			"getItemAmount",
			"getGreatBuildings"
		],
		"ItemExchangeService": [
			"getConfig"
		],
		"ItemShopService": [
			"getOffers"
		],
		"LogService": [
			"setLogState"
		],
		"MessageService": [
			"newMessage"
		],
		"NegotiationGameService": [
			"submitTurn"
		],
		"NoticeIndicatorService": [
			"getPlayerNoticeIndicators"
		],
		"OtherPlayerService": [
			"getSocialList",
			"updateActions",
			"getAwaitingFriendRequestCount",
			"getCityProtections",
			"getEventsPaginated",
			"getOtherPlayerCityMapEntity",
			"visitPlayer",
			"getOtherPlayerVO",
			"updatePlayer",
			"rewardResources",
			"polivateRandomBuilding"
		],
		"OutpostService": [
			"getAll"
		],
		"PlayerProfileService": [
			"getFreeNameChangeTime"
		],
		"PremiumService": [
			"getActivePackages",
			"getActiveBundle"
		],
		"QuestService": [
			"getUpdates",
			"startNegotiation"
		],
		"RankingService": [
			"newRank"
		],
		"ResearchService": [
			"getProgress"
		],
		"ResourceService": [
			"getPlayerResources",
			"getPlayerAutoRefills",
			"getResourceDefinition",
			"getResourceDefinitions"
		],
		"ResourceShopService": [
			"buyOffer",
			"getContexts"
		],
		"RewardService": [
			"collectReward"	
		],
		"SaleInfoService": [
			"getActiveSales"
		],
		"SettingsService": [
			"updateSettings"	
		],
		"StartupService": [
			"getData"	
		],
		"StaticDataService": [
			"getMetadata"	
		],
		"TimeService": [
			"updateTime"
		],
		"TimerService": [
			"getTimers"
		],
		"TrackingService": [
			"trackLoginDone"
		],
		"TradeService": [
			"getTradeOffers"
		],
		"TutorialService": [
			"getProgress"
		]
	}
  	  
initScripts()
function initScripts() {
	// Try again and again till FoE Helper is loaded
	if (typeof FoEproxy == "undefined") {
		if (iMaxInitTries > 0) {
			window.setTimeout(initScripts, 10)
		}
		iMaxInitTries--
		return
	}
	
	// Init scripts as soon as FoEproxy gets the first response
	FoEproxy.addHandler("all", "all", oResponse => {
		// Only run once
		if (bFoeScriptsInit) return
		bFoeScriptsInit = true
		oCanvas = document.getElementsByTagName("canvas")[0]
		TavernService.start(false)
		say("FoEscripts initiated")
	})
	
	// Helper method to log incoming responses
	FoEproxy.addHandler("all", "all", oResponse => {
		const sClass = oResponse.requestClass,
			sMethod = oResponse.requestMethod,
			oData = oResponse.responseData
			  
		// Response class and method ignored
		if (sClass in oIgnoreResponses && (oIgnoreResponses[sClass].includes(sMethod) || oIgnoreResponses[sClass].length < 1)) {
			return
		}
	    
		say(sClass, sMethod, oData)
	})
	
	// Update spendable FPs
	FoEproxy.addHandler("GreatBuildingsService", "getAvailablePackageForgePoints", oResponse => {
		iAvailableFp = oResponse.responseData[0]
		say(iAvailableFp + " FP left to spend")
	})
	
	// Your army composition
	FoEproxy.addHandler("ArmyUnitManagementService", "getArmyInfo", oResponse => {
		const aUnitClasses = getUnitClasses()
			
		// Reset stored values
		oStandingArmy.clear()
		oMissingUnits = {...fsFight.army}
		oReserveUnits = {"heavy": 0, "range": 0, "light": 0, "rogue": 0}
		resetReplaceUnits()
		
		oResponse.responseData.units.forEach(oUnit => {
			const sUnitId = oUnit.unitTypeId, sClass = aUnitClasses[oUnit.unitTypeId]
			//say(sUnitId, sClass)
			
			// Unit in use?
			if (oUnit?.is_attacking) oStandingArmy.add(oUnit)
			
			// Still enough HP left?
			if (oUnit.currentHitpoints > 8) {
				if (sUnitId == "rogue") oReserveUnits.rogue++
				else if (sClass == "heavy_melee") {
					//say("heavy", sUnitId)
					oReserveUnits.heavy++
				}
				else if (sClass == "short_ranged") {
					//say("range", sUnitId)
					oReserveUnits.range++
				}
				else if (sClass == "light_melee" && oUnit.unitTypeId != "military_drummer") {
					//say("light", sUnitId)
					oReserveUnits.light++
				}
			}
		})
		
		oStandingArmy.forEach(oUnit => {
			const sClass = getUnitClass(oUnit)
			
			// How many units are damaged
			if (oUnit.currentHitpoints < 9) {
				if (oUnit.unitTypeId == "rogue") oReplaceUnits.rogue++
				if (sClass == "short_ranged") oReplaceUnits.range++
				if (sClass == "heavy_melee") oReplaceUnits.heavy++
			}
			
			// How many units are missing
			if (oUnit.unitTypeId == "rogue") oMissingUnits.rogue--
			if (sClass == "short_ranged") oMissingUnits.range--
			if (sClass == "heavy_melee") oMissingUnits.heavy--
		})
	})
	
	// Received blueprint
	FoEproxy.addHandler("BlueprintService", "all", oResponse => {
		say("Received blueprint")
		bBluePrintReceived = true
	})
	
	// Your player ID
	FoEproxy.addHandler("StartupService", "getData", oResponse => {
		iYourPlayerId = oResponse.responseData.user_data.player_id
	})
	
	// Current GEX progress
	FoEproxy.addHandler("GuildExpeditionService", "getOverview", oResponse => {
		fsGEX.progress = oResponse.responseData.progress.currentEntityId ?? 0
		//say("O GEX progress is now " + fsGEX.progress)
	})
	FoEproxy.addHandler("GuildExpeditionService", "getState", oResponse => {
		fsGEX.progress = oResponse.responseData[0].currentEntityId ?? 0
		//say("S GEX progress is now " + fsGEX.progress)
	})
	FoEproxy.addHandler("GuildExpeditionService", "changeDifficulty", oResponse => {
		fsGEX.progress = oResponse.responseData.progress.currentEntityId ?? 0
		//say("D GEX progress is now " + fsGEX.progress)
	})
	
	// Update number of enemy armies while fighting guild battlegrounds
	FoEproxy.addHandler("BattlefieldService", "getArmyPreview", oResponse => {
		fsFight.enemyArmies = oResponse?.responseData.length ?? 0
		//say("Counting " + fsFight.enemyArmies + " enemy armies")
	})
	// .. while fighting guild expeditions
	FoEproxy.addHandler("GuildExpeditionService", "getEncounter", oResponse => {
		fsFight.enemyArmies = oResponse?.responseData.armyWaves.length
		say("Counting " + fsFight.enemyArmies + " enemy armies")
	})
	
	// List of social contacts
	FoEproxy.addHandler("OtherPlayerService", "getSocialList", oResponse => {
		oResponse.responseData.neighbours.forEach(oNeighbour => {
			if (oNeighbour?.next_interaction_in) return
			fsMotivate.neighbours.push(oNeighbour.player_id)
		})
		
		oResponse.responseData.guildMembers.forEach(oGuildMember => {
			if (oGuildMember?.next_interaction_in) return
			fsMotivate.guildmembers.push(oGuildMember.player_id)
		})
		
		oResponse.responseData.friends.forEach((oFriend, i) => {
			if (!oFriend.activity) {
				say(`Friend ${i+1} '${oFriend.name}' is inactive`)
			}
			
			if (oFriend?.next_interaction_in) return
			fsMotivate.friends.push(oFriend.player_id)
		})
	})
	
	// Store unit to class assignments
	FoEproxy.addHandler("StaticDataService", "getMetadata", oResponse => {
		oResponse.responseData.forEach(oMetadata => {
			if (oMetadata.identifier != "unit_types") return
			
			fetch(oMetadata.url).then(res => res.json()).then(aUnits => {
				let aClassUnits = {}, aUnitClasses = {}
				aUnits.forEach(oUnit => {
					const sClass = oUnit.unitClass, sId = oUnit.unitTypeId
					
					if (!(sClass in aClassUnits)) aClassUnits[sClass] = []
					aClassUnits[sClass].push(sId)
					
					aUnitClasses[sId] = sClass
				})
				localStorage.setItem("fsClassUnits", JSON.stringify(aClassUnits))
				localStorage.setItem("fsUnitClasses", JSON.stringify(aUnitClasses))
			})
		})
	})
}

function getUnitClasses() {
	return JSON.parse(localStorage.getItem("fsUnitClasses"))
}
function getUnitClass(oUnit) {
	return getUnitClasses()[oUnit.unitTypeId]
}
function resetReplaceUnits() {
	oReplaceUnits = {...fsFight.army}
	for (const sClass in oReplaceUnits) {
		oReplaceUnits[sClass] = 0
	}
}


 



// ------------------ //
//   Helper methods   //
// ------------------ //

// Pauses for x milliseconds
const sleep = ms => {
	//say(`Sleep for ${ms} ms`)
	return new Promise(resolve => setTimeout(resolve, ms + randPlusMinus()));
}

// Returns random value between -2 and 2. Used to randomize clicks
function randPlusMinus() {
	return Math.random() < 0.5 ? (Math.random() < 0.5 ? -2 : -1) : (Math.random() < 0.5 ? 2 : 1)
}

// Heper method to attach event listeners
function addEvent(el, evt, fn) {
	if (el.addEventListener) el.addEventListener(evt, fn, false)
	else if (el.attachEvent) el.attachEvent("on" + evt, fn)
}

// Logging
function shout(sMsg) {
	console.log("%c" + sMsg, "background: #222; color: #bada55")
}
function say() {
	console.log(...arguments)
}
function whisper(sMsg) {
	console.log("%c" + sMsg, "color: #bada55")
}

// Middle of the window
function wm() {
	return window.innerWidth / 2
}

// Sets dialog top-left coordinates depending on current viewport and initial dialog position
// All dialogs seem to have their initial placement done at 950px window width and 600px window height and are centered on the screen from thereon
function setDialog(aDialog, iInitialX, iInitialY) {
	aDialog[0] = window.innerWidth  <= 950 ? iInitialX : Math.floor(iInitialX + ((window.innerWidth  - 950) / 2))
	aDialog[1] = window.innerHeight <= 600 ? iInitialY : Math.floor(iInitialY + ((window.innerHeight - 600) / 2))
}


addEvent(document, "keydown", e => {
	// ENTER continues current paused execution
	if (e.key === "Enter") {
		say("Continue execution")
		bWaitForEnter = false
	}
	// ESC stops current execution
	else if (e.key === "Escape") {
		say("Stop execution")
		bStopExecution = true
	}
	// Ctrl + Y starts motivating all players in opened social bar from right to left
	else if (e.key === "y" && e.ctrlKey) {
		motivateFrom(999)	
	}
	// Ctrl + X starts sniping all players in opened social bar from right to left
	else if (e.key === "x" && e.ctrlKey) {
		snipeFrom(999)	
	}
	// Ctrl + C runs through currently opened fight
	else if (e.key === "c" && e.ctrlKey) {
		fsFight.start()	
	}
	// Ctrl + A runs through currently opened negotiation
	else if (e.key === "a" && e.ctrlKey) {
		fsNegotiation.start(true)
	}
})

// Wait for service response or timeout after given amount of milliseconds
async function awaitResponse(sService, sMethod = "all", iWaitMs = 1500) {
	const oAwaitResponse = new Promise(resolve => {
		FoEproxy.addHandler(sService, sMethod, oResponse => resolve(oResponse))
	})
	return await Promise.race([oAwaitResponse, sleep(iWaitMs)])
}

function waitForEnter() {
	say("Press Enter to continue")
	return new Promise(resolve => {
		const oInterval = setInterval(function() {
			if (!bWaitForEnter || bStopExecution) {
				clearInterval(oInterval)
				resolve()
			}
		}, 100)
	})
}


// ------------------- //
//   Service helpers   //
// ------------------- //

const TavernService = {
	log: false,
	freeSeats: new Set(),
	
	start(log) {
		this.log = log
		
		// Process complete list of taverns given while initialisation 
		FoEproxy.addHandler("FriendsTavernService", "getOtherTavernStates", response => {
			response.responseData.forEach(oTavern => this.add(oTavern))
			say(this.freeSeats.size + " free taverns")
		})

		// Remember free tavern seats
		FoEproxy.addHandler("FriendsTavernService", "getOtherTavernState", response => {
			this.add(response.responseData)
		})

		// Remove visited tavern seats
		FoEproxy.addHandler("FriendsTavernService", "getSittingPlayersCount", response => {
			const owner = response.responseData[0]
			if (this.has(owner)) this.delete(owner)
			if (this.freeSeats.size) this.logMsg(this.freeSeats)
		})
	},
	
	add(oTavern) {
		const owner = oTavern.ownerId
				
		// Certain state or already collected?
		if (oTavern?.state || this.has(owner)) {
			return
		}
		
		this.logMsg("Free tavern slot at " + owner)
		this.freeSeats.add(owner)
	},

	has(owner) {
		return this.freeSeats.has(owner)
	},
	
	delete(owner) {
		this.logMsg("Visited tavern slot at " + owner)
		this.freeSeats.delete(owner)
	},

	logMsg(msg) {
		if (this.log) say(msg)
	}
}




// ------------------ //
//   Clicking stuff   //
// ------------------ //

// Triggers clicks at given coords
async function clickCanvas(...aClick) {
	let clickX, clickY, iRepeat = 0
	
	// First argument array of coords?
	if (Array.isArray(aClick[0]) && aClick[0].length == 2) {
		[clickX, clickY] = aClick[0]
		iRepeat = aClick[1] ?? iRepeat
	}
	else {
		[clickX, clickY] = aClick
		iRepeat = aClick[2] ?? iRepeat
	}
	
	//say("Click " + clickX + " " + clickY, ", Repeat " + iRepeat)

	clickX += randPlusMinus()
	clickY += randPlusMinus()

	const oMouseDown = document.createEvent("MouseEvents"),
		  oMouseUp = document.createEvent("MouseEvents")
		  
	// Draw cross
	const oContext = oCanvas.getContext("webgl2")

	oMouseDown.initMouseEvent("mousedown", true, true, window, 0, 0, 0, clickX, clickY, false, false, false, false, 0, null)
	oMouseUp.initMouseEvent("mouseup", true, true, window, 0, 0, 0, clickX, clickY, false, false, false, false, 0, null)

	oCanvas.dispatchEvent(oMouseDown)
	await sleep(50)
	oCanvas.dispatchEvent(oMouseUp)
	
	if (iRepeat > 0) {
		await sleep(50)
		await clickCanvas(clickX, clickY, --iRepeat)
	}
}

async function clickDialog(aDialog, ...aClick) {
	// First argument array of coords?
	if (Array.isArray(aClick[0]) && aClick[0].length == 2) {
		aClick[0][0] += aDialog[0]
		aClick[0][1] += aDialog[1]
	}
	else {
		aClick[0] += aDialog[0]
		aClick[1] += aDialog[1]
	}
	//say("CLICK DIALOG", aClick[0], aClick[1])
	return await clickCanvas(...aClick)
}

// Just clicks somewhere outside of the current dialog
async function closeDialog(sPage = "") {
	if (sPage) whisper("Closing: " + sPage)
	await sleep(300)
	await clickCanvas(45, 75)
	await sleep(300)
}










// ---------------------- //
//   Actions to trigger   //
// ---------------------- //

// Scrolls one page to the left
async function openPrevPage() {
	//say("Open prev page")
	await sleep(300)
	await clickCanvas(244, window.innerHeight - 65)
	await sleep(300)
}

// Motivates n-th player
async function motivatePlayer(iPlayerPos) {
	bBluePrintReceived = false

	//say(`Motivating player ${iPlayerPos}`)
	await clickCanvas(315 + (iPlayerPos - 1) * 114, window.innerHeight - 15)
	const oResponse = await awaitResponse("OtherPlayerService", "polivateRandomBuilding")
	if (!oResponse) return false

	if (bBluePrintReceived) {
		await sleep(200)
		await closeDialog("Blueprint")
	}
	
	// Check if tavern is free and get a drink
	const iOwnerId = oResponse.responseData.mapEntity?.player_id
	if (TavernService.has(iOwnerId)) {
		//say("Gonna have a drink as well")
		await clickCanvas(350 + (iPlayerPos - 1) * 114, window.innerHeight - 35)
		await awaitResponse("FriendsTavernService", "getSittingPlayersCount")
		await sleep(100)
	}
	
	return true
}

// Motivate n pages (descending) of five players each
async function motivatePages() {
	bStopExecution = false
	for (let iPage = 0; iPage < 99; iPage++) {
		let iNotMotivated = 0
		for (let iPlayer = 1; iPlayer <= 5; iPlayer++) {
			const bMotivated = await motivatePlayer(iPlayer)
			if (!bMotivated) iNotMotivated++
			if (iNotMotivated > 2) bStopExecution = true

			if (bWaitForEnter) {
				await waitForEnter()
			}
			if (bStopExecution) {
				say("Stopping execution of motivatePages()")
				return
			}
		}
		await openPrevPage()
	}
}

// Opens list of great buildings of n-th player (zero-based)
async function openGreatBuildings(iPlayer) {
	//say("Opening great buildings of player " + iPlayer)
	await clickCanvas(348 + (iPlayer - 1) * 115, window.innerHeight - 60)

	const oGreatBuildings = await awaitResponse("GreatBuildingsService", "getOtherPlayerOverview")
	if (!oGreatBuildings) {
		whisper(`Player ${iPlayer} doesn't have great buildings`)
		return false
	}

	let aGreatBuildings = []
	for (const iSpot in oGreatBuildings.responseData) {
		const oGreatBuilding = oGreatBuildings.responseData[iSpot]
		
		// Stop sniping if player is known to us
		if (dontSnipePlayer(oGreatBuilding.player.player_id)) {
			whisper("Not sniping player " + oGreatBuilding.player.player_id)
			return false
		}
		
		// Skip lower age buildings
		if (dontSnipeBuilding(oGreatBuilding.city_entity_id)) {
			//whisper("Not sniping building " + oGreatBuilding.city_entity_id)
			continue
		}

		aGreatBuildings.push({
			id: oGreatBuilding.city_entity_id,
			name: oGreatBuilding.name,
			spot: iSpot,
			current: oGreatBuilding.current_progress ?? 0,
			needed: oGreatBuilding.max_progress
		})
	}
	
	return aGreatBuildings
}

// Opens n-th great building of opened building list
async function openGreatBuilding(n) {
	// Dynamicly calculate button position
	const iDialogWidth = 750, iDialogHeight = 480, // Got those by checking dialog edge coordinates
	      iDialogRightEdge = window.innerWidth - ((window.innerWidth - iDialogWidth) / 2),
	      iDialogTopEdge = (window.innerHeight - iDialogHeight) / 2
	      
	await clickCanvas(iDialogRightEdge - 100, iDialogTopEdge + 160 + n * 29)
	
	const oGreatBuilding = await awaitResponse("OtherPlayerService", "getOtherPlayerCityMapEntity")
	if (!oGreatBuilding) return []
	
	// Next level not unlocked
	const oGbResponse = oGreatBuilding.responseData
	if (oGbResponse.level == oGbResponse.max_level) return []
	
	// No street connection
	if (oGbResponse?.connected != 1) return []
	
	const oConstruction = await awaitResponse("GreatBuildingsService", "getConstruction")
	if (!oConstruction) return []

	//say(`Great building ${n} opened`)
	//say(oConstruction)
	let aRankings = []
	for (const oRanking of oConstruction.responseData.rankings) {
		// Skip building if you already spent points
		if (oRanking?.player?.is_self) return []

		aRankings.push({
			spent: oRanking?.forge_points ?? 0,
			reward: oRanking?.reward?.strategy_point_amount ?? 0
		})
	}
	return aRankings
}

async function snipePlayer(iPlayer) {
	// Open list of players great buildings
	let aGreatBuildings = await openGreatBuildings(iPlayer)
	if (!aGreatBuildings) return
	
	if (aGreatBuildings.length) {
		if (iCurrentPlayer > 0) {
			//say(`Checking ${aGreatBuildings.length} great buildings of player ` + iCurrentPlayer)
		}
		else { 
			//say(`Checking ${aGreatBuildings.length} great buildings of player ` + iPlayer)
		}
			
		// Check each of the great buildings
		let iSniped = 0
		for (const oGreatBuilding of aGreatBuildings) {
			await snipeGreatBuilding(oGreatBuilding, iPlayer)
			
			if (bStopExecution) {
				say("Stopping execution of snipePlayer()")
				return
			}
			
			if (++iSniped > 10) break
		}
	}
	else whisper("No buildings to snipe at player " + iPlayer)
	
	await closeDialog("GB list")
}

async function snipeGreatBuilding(oGB, iPlayer) {
	await sleep(150)
	const iDiff = oGB.needed - oGB.current,
		  aRankings = await openGreatBuilding(oGB.spot)

	for (const iSpot in aRankings) {
		const oRanking = aRankings[iSpot],
			  iArcReward = Math.ceil(oRanking.reward * fArcFactor)

		for (let iPut = 0; iPut < Math.min(iArcReward, iDiff, iAvailableFp); iPut++) {
			if ((iPut - oRanking.spent) >= (iDiff - iPut)) {
				const iReward = iArcReward - iPut,
					  fROI = Math.round(iReward * 100 / iPut)
				
				if (iReward < iMinFpReward && fROI < iMinROI) return
					  
				shout(`Put ${iPut} for ${iReward} reward (${fROI}% ROI) at ${oGB.name}`)
				bWaitForEnter = true
				return
			}
		}
	}

	if (bWaitForEnter) {
		await waitForEnter()
	}

	// Close great building page
	await closeDialog("GB page")
}

async function snipePages(n) {
	bStopExecution = bWaitForEnter = false
	for (let iPage = 0; iPage < n; iPage++) {
		//say("Checking great buildings of page " + (iPage + 1) + " of " + n)
		for (let iPlayer = 1; iPlayer <= 5; iPlayer++) {
			await snipePlayer(iPlayer)
			iCurrentPlayer--

			if (bWaitForEnter) {
				await waitForEnter()
				await closeDialog("???")
			}
			if (bStopExecution) {
				say("Stopping execution of snipePages()")
				return
			}
		}
		await openPrevPage()
	}
}

function motivateFrom(iPlayerPos) {
	const iPage = Math.ceil(iPlayerPos / 5)
	motivatePages(iPage)
}

function snipeFrom(iPlayerPos) {
	iCurrentPlayer = iPlayerPos
	const iPages = Math.ceil(iPlayerPos / 5)
	snipePages(iPages)
	iCurrentPlayer = 0
}

function dontSnipePlayer(iPlayerId) {
	//say("Check if we should snipe player id " + iPlayerId)
	if (iPlayerId == iYourPlayerId || aDontSnipePlayer.includes(iPlayerId)) {
		say("Not sniping player " + iPlayerId)
		return true
	}
	return false
}

function dontSnipeBuilding(sBuildingId) {
	//return false // Always snipe for now
	
	//say("Check if we should snipe building " + sBuildingId)
	if (aDontSnipeBuildings.includes(sBuildingId)) {
		return true
	}
	return false
}

async function getPlayerIdOfPos(n) {
	//say("Opening great buildings of pos " + n)
	await clickCanvas(349 + n * 108, window.innerHeight - 60)

	const oGreatBuildings = await awaitResponse("GreatBuildingsService",  "getOtherPlayerOverview")
	if (!oGreatBuildings) {
		whisper(`Pos ${n} doesn't have great buildings so we can't retreive its player ID`)
		return false
	}
	
	const sPlayerId = oGreatBuildings.responseData[0].player.player_id
	say(`Player ID of pos ${n} is ${sPlayerId}`)
}




// Guild expeditions
const fsGEX = {
	progress: 0, 
	level: 1,
	
	// Coords with an array depend on current level
	slotcoords: [
		[306, [350, 350, 373, 373]],
		[485, 373],
		["wm", [388, 359, 364, 363]],
		["wm", 309],
		["wm", 226],
		["wm", 232],
		["wm", 195], // First big slot
		["wm", 433],
		["wm", [542, 542, 566, 568]],
		["wm", 539],
		["wm", [556, 556, 533, 534]],
		["wm", 537],
		["wm", 543],
		["wm", 542],
		["wm", [505, 486, 475, 473]], // Second big slot
		["wm", 545],
		["wm", [570, 536, 523, 523]],
		["wm", 543],
		["wm", 547],
		["wm", 543],
		["wm", [524, 553, 555, 557]],
		["wm", 537],
		["wm", [485, 458, 471, 471]], // Third big slot
		["wm", 539],
		[568, [535, 571, 535, 535]],
		[716, 545],
		[759, 557], // Dialog pops up the left
		[713, 472],
		[604, [360, 329, 329, 329]],
		["wm", 297],
		["wm", [185, 212, 195, 195]], // Last big slot
		["wm", 261]
	],
	
	// Retreives current reward
	getReward: async function() {
		if (this.progress % 2 != 1) {
			say("No reward to get")
		}
		
		const aRewardCoords = this.currentCoords()
	    whisper(`Geting current reward at ${aRewardCoords[0]}, ${aRewardCoords[1]}`)
	    await clickCanvas(aRewardCoords)
	    
	    const oReward = await awaitResponse("GuildExpeditionService", "openChest")
	    if (!oReward) {
			shout("Got no reward")
			return false
	    }
	    
	    // Close reward
	    await sleep(200)
	    await clickCanvas(504, 473)
	    await sleep(600)
	},
	
	// Returns current slot index
	currentSlot: function() {
		const iSlot = this.progress % this.slotcoords.length
		this.level = Math.floor(this.progress / this.slotcoords.length)		      
		whisper(`Current GEX slot is ${iSlot} at stage ${this.level+1}`)
		return iSlot
	},
	
	// Returns current slot coordinates
	currentCoords: function() {
		const iSlot = this.currentSlot(), aCoords = [...this.slotcoords[iSlot]]
		
		if (aCoords[0] == "wm") {
			aCoords[0] = wm()
		}
		
		if (Array.isArray(aCoords[1])) {
			say(aCoords[1], this.level, aCoords[1][this.level])
			aCoords[1] = aCoords[1][this.level]
		}
		
		whisper(`Current GEX coords are ${aCoords[0]}, ${aCoords[1]}`)
		return aCoords
	},
	
	// Opens current slot and start fight/negotiation
	openSlot: async function(sType) {
		const aCoords = this.currentCoords()
		let sResponse = "", aButton = []
	
		// Click slot
		await clickCanvas(aCoords)
		await sleep(300)
		
		// Click negotiation button [+255, +100]
		if (sType == "n") {
			sResponse = "startNegotiation"
			aButton = [aCoords[0] + 255, aCoords[1] + 100]
			
			// The 25th slot dialog shows up on the left
			if (this.currentSlot() == 26) {
				say(aCoords[0], -105, aCoords[0] - 105, aCoords[1], 100, aCoords[1] + 100)
				aButton = [aCoords[0] - 105, aCoords[1] + 100]
			}
		}
		
		// Click fight button [+105, +100]
		if (sType == "f") {
			sResponse = "getEncounter"
			aButton = [aCoords[0] + 105, aCoords[1] + 100]
			
			// The 25th slot dialog shows up on the left
			if (this.currentSlot() == 26) {
				say(aCoords[0], -255, aCoords[0] - 255, aCoords[1], 100, aCoords[1] + 100)
				aButton = [aCoords[0] - 255, aCoords[1] + 100]
			}
		}
		
		if (sResponse) {
			// Click button
			say(`Click button at ${aButton[0]}, ${aButton[1]}`)
			await clickCanvas(aButton)
			
			const oResponse = await awaitResponse("GuildExpeditionService", sResponse)
			if (!oResponse) {
				say("Can't open next slot! Out of tries?", aCoords)
				return false
			}
			
			say("Opened current GEX " + sType)
			return true
		}
		
		shout(`Don't know GEX slot of type '${sType}'`)
		return false
	},
	
	go: async function(sType = "n", bKeepGoing = true) {
		let bContinue, sTypeDesc = sType == "n" ? "negotiation" : "fighting"
		
		// Check if last reward has to be taken
		if (this.progress % 2) await this.getReward()
		
		// Click current slot
		say("Open current slot for " + sTypeDesc)
		while (bContinue !== false && await this.openSlot(sType)) {
			await sleep(500)
			
			if (sType == "n") {
				bContinue = await fsNegotiation.start()
			}
			else {
				fsFight.mode = "gex"
				bContinue = await fsFight.start()
			
				await sleep(500)
				say("Close slot reward message")
				await clickCanvas(505, 475)
			}
			
			if (bContinue) {
				await sleep(500)
				await this.getReward()
				bContinue = bKeepGoing
				
				// Before opening 6th and 30th slot, we have to wait for the contribution popup to close
				if (this.currentSlot() == 6 || this.currentSlot() == 30) {
					await sleep(1500)
				}
			}
		}
	}
}

// Guild battlegrounds
const fsGBG = {
	// The dialog top-left coordinates, while choosing to fight or negotiate
	dialog: [],
	
	// Clicks fight button on currently opened region dialog and fights X rounds
	fight: async function(iRounds = 1) {
		bStopExecution = false
		let bWon = true
		setDialog(this.dialog, 317, 160)
		
		while (iRounds-- > 0 && bWon && !bStopExecution) {
			await clickDialog(this.dialog, 65, 234)
			const oArmyResponse = await awaitResponse("ArmyUnitManagementService", "getArmyInfo")
			if (!oArmyResponse) {
				say("Aborting attack")
				return false
			}
			
			// Click fight button
			fsFight.mode = "gbg"
			bWon = await fsFight.start()
		}
	}
}

// Negotiations
const fsNegotiation = {
	// The dialog top-left coordinates, the negotiations take place in
	dialog: [],
	
	// Uses https://github.com/mainIine/foe-helfer-extension/blob/master/js/web/negotiation/js/negotiation.js
	// Runs through all negotiation steps
	start: async function(bIgnoreChance = false) {
		whisper("Start negotiation")
		
		if (this._isCritical()) {
			say("Not negotiating while goods critical")
			return false
		}
		
		// Stop when success chance is below 80% at the first round
		if (Negotiation.CurrentTable.c < 80 && !bIgnoreChance && Negotiation.GuessesSuggestions.length == 1) {
			say("Success chance below 80%")
			return false
		}
		
		await this.addGoods()
		
		// Submit negotiation
		await clickDialog(this.dialog, 420, 535)
		
		// Check for reward
		let bRewardReceived = false
		awaitResponse("GuildExpeditionService", "getGuildReward").then(oReward => {
			bRewardReceived = typeof oReward != "undefined"
		})
		
		const oResult = await awaitResponse("NegotiationGameService", "submitTurn")
		if (!oResult) {
			shout("Negotiation failed")
			return false
		}
		
		const sState = oResult.responseData.state // "ongoing" or "won"
		say("Negotiation state", sState)
		
		if (sState == "won") {
			await sleep(3300)
			await closeDialog("Negotiation")
		}
		
		// Close reward
		if (bRewardReceived) {
			await sleep(300)
			await closeDialog("GEX reward")
		}
		
		// On to the next negotiation step
		if (sState == "ongoing") {
			await sleep(3000)
			say("Next step")
			return await this.start()
		}
		
		return true
	},
	
	addGoods: async function() {
		setDialog(this.dialog, 57, 55)
		
		const aSuggestions = Negotiation.GuessesSuggestions,
		      oSuggest = aSuggestions[aSuggestions.length - 1],
		      iGoodsCount = Negotiation.GoodCount,
		      aGoodsGrid = this._getGrid(iGoodsCount)
		      
		for (const sSlot in oSuggest) {
	  		const iSlot = parseInt(sSlot), oGood = oSuggest[iSlot]
	      	if (!oGood) continue
		
	      	// Click n-th slot
	      	//say("CLICK SLOT", iSlot)
	      	await clickDialog(this.dialog, 110 + iSlot * 160, 380)
	      	await sleep(300)
	      	
	      	// Click n-th good in grid
	      	const aGoodsGridCoords = [...aGoodsGrid[oGood.id]] // Use clone of the coords array
	      	//say("CLICK GOOD", oGood.id)
	      	await clickDialog(this.dialog, aGoodsGridCoords)
	      	await sleep(300)
		}
	},
	
	// Whether or not some current negotiation goods are missing/critical
	_isCritical: function() {
		for (let i = 0; i < Negotiation.GoodCount; i++) {
			let oGoodInfo = Negotiation.GoodsOrdered[i],
				iStock = ResourceStock[oGoodInfo.resourceId] ?? 0,
				iStockState = 0,
				iGoodAmount = oGoodInfo.amount
				iMaxRequired = oGoodInfo.canOccur.length * iGoodAmount
	
			iGoodAmount *= Negotiation.CurrentTable.go[i]
			
			if (iStock < iGoodAmount || iStock < iMaxRequired) {
				return true
			}
		}
		
		return false
	},
	
	// Returns collection of goods buttons depending on the number of negotiation goods
	_getGrid: function(iGoodsCount) {
		if (iGoodsCount < 2 || iGoodsCount > 10) {
			shout(`No grid defined for ${iGoodsCount} goods`)
			return false
		}
		
		// count 2  > 2 cols, 1 rows
		// count 3  > 3 cols, 1 rows
		// count 4  > 4 cols, 1 rows
		// count 5  > 5 cols, 1 rows
		// count 6  > 3 cols, 2 rows
		// count 7  > 4 cols, 2 rows
		// count 8  > 4 cols, 2 rows
		// count 9  > 5 cols, 2 rows
		// count 10 > 5 cols, 2 rows
		
		const iOnlyRow = 360, iFirstRow = 320, iSecondRow = 395
		
		// There has to be a smarter way.. no time right now!
		switch (iGoodsCount) {
			case 2: // 2x1
				return [
					[380, iOnlyRow], [485, iOnlyRow]
				]
			case 3: // 3x1
				return [
					[325, iOnlyRow], [430, iOnlyRow], [535, iOnlyRow]
				]
			case 4: // 4x1
				return [
					[275, iOnlyRow], [380, iOnlyRow], [485, iOnlyRow], [590, iOnlyRow]	
				]
			case 5: // 5x1
				return [
					[220, iOnlyRow], [325, iOnlyRow], [430, iOnlyRow], [535, iOnlyRow], [640, iOnlyRow]	
				]
			case 6: // 3x2
				return [
					[325, iFirstRow],  [430, iFirstRow],  [535, iFirstRow],
					[325, iSecondRow], [430, iSecondRow], [535, iSecondRow]
				]
			case 7: // 4x2
				return [
					[275, iFirstRow],  [380, iFirstRow],  [485, iFirstRow],  [590, iFirstRow],
					[275, iSecondRow], [380, iSecondRow], [485, iSecondRow]
				]
			case 8: // 4x2
				return [
					[275, iFirstRow],  [380, iFirstRow],  [485, iFirstRow],  [590, iFirstRow],
					[275, iSecondRow], [380, iSecondRow], [485, iSecondRow], [590, iSecondRow]
				]
			case 9: // 5x2
				return [
					[220, iFirstRow],  [325, iFirstRow],  [430, iFirstRow],  [535, iFirstRow],  [640, iFirstRow],
					[220, iSecondRow], [325, iSecondRow], [430, iSecondRow], [535, iSecondRow]
				]
			case 10: // 5x2
				return [
					[220, iFirstRow],  [325, iFirstRow],  [430, iFirstRow],  [535, iFirstRow],  [640, iFirstRow],
					[220, iSecondRow], [325, iSecondRow], [430, iSecondRow], [535, iSecondRow], [640, iSecondRow]
				]
		}
	}
}

// Fighting
const fsFight = {
	enemyArmies: 1,
	mode: "gex",
	army: {"heavy": 2, "range": 0, "rogue": 6},
	
	// The dialog top-left coordinates while fighting
	dialog: [],
	
	start: async function() {
		whisper("Start fighting")
		
		setDialog(this.dialog, 115, -12)
		
		// Try to replace damaged units
		say("Replacing damaged units")
		if (!await this.replaceUnits()) return false
		
		// Check for reward
		let bRewardReceived = false
		awaitResponse("RewardService", "collectReward").then(oReward => {
			bRewardReceived = typeof oReward != "undefined"
		})
		
		// Start auto battle
		say("Start first battle")
		await clickCanvas(444, 629)
		await awaitResponse("BattlefieldService", "startByBattleType")
		await sleep(200)
		
		if (this.enemyArmies > 1) {
			say("Click next battle")
			await clickCanvas(510, 625)
		
			//say("Fighting second wave")
			await awaitResponse("BattlefieldService", "startByBattleType")
			await sleep(200)
		}
			
		say(`Click OK (${this.mode})`)
		if (this.mode == "gex") {
			await clickCanvas(512, 584)
		}
		else {
			await clickCanvas(512, 635)
		}
		
		await sleep(300)
		if (bRewardReceived) {
			say("Reward received")
			await sleep(100)
			await closeDialog()
		}
		
		return true
	},
	
	replaceUnits: async function () {
		// Check if we still have enough reserve units
		if (!this.checkReserveUnits()) {
			say("No enough reserve units")
			return false
		}
		
		// Check if army contains units we don't want to use
		if (this.hasWrongUnits()) {
			await this.replaceUnits2()
			resetReplaceUnits()
			oMissingUnits = this.army
		}
		
		//say("replaceUnits", oReplaceUnits)
		//say("missingUnits", oMissingUnits)
		
		// Add healthy range units
		if (oMissingUnits.range || oReplaceUnits.range) {
			await clickCanvas(495, 412) // Change to ranged units
			
			if (oMissingUnits.range > 0) {
				say("Add missing ranged")
				await clickCanvas(290, 480, oMissingUnits.range - 1) // Add missing range units
			}
			else if (oMissingUnits.range < 0) {
				const iRemoveRanged = Math.abs(oMissingUnits.range)
				say(`Remove ${iRemoveRanged} ranged`)
				await clickCanvas(220, 265, iRemoveRanged)
			}
			
			while (oReplaceUnits.range > 0) {
				say(`Replace ${oReplaceUnits.range} damaged ranged`)
				await clickCanvas(220, 265) // First slot of standing army
				await clickCanvas(290, 480) // First slot of units
				oReplaceUnits.range--
			}
		}
		
		// Add healthy heavies
		if (oMissingUnits.heavy || oReplaceUnits.heavy) {
			await clickCanvas(356, 412) // Change to heavy view
			
			if (oMissingUnits.heavy > 0) {
				say("Add missing heavy")
				await clickCanvas(290, 480, oMissingUnits.heavy - 1) // Add missing heavy units
			}
			else if (oMissingUnits.heavy < 0) {
				const iRemoveHeavy = Math.abs(oMissingUnits.heavy)
				say(`Remove ${iRemoveHeavy} heavy`)
				await clickCanvas(220, 340, iRemoveHeavy)
			}
			
			while (oReplaceUnits.heavy > 0) {
				say(`Replace ${oReplaceUnits.heavy} damaged heavy`)
				await clickCanvas(220, 340) // Second slot of standing army
				await clickCanvas(290, 480) // First slot of units
				oReplaceUnits.heavy--
			}
		}
		
		// Add healthy rogues
		if (oMissingUnits.rogue || oReplaceUnits.rogue) {
			await clickCanvas(403, 412) // Change to light units
			
			if (oMissingUnits.rogue > 0) {
				say(`Add ${oMissingUnits.rogue} missing rogues`)
				await clickCanvas(506, 547, oMissingUnits.rogue - 1) // Depends heavily on number of light units!
			}
			else if (oMissingUnits.rogue < 0) {
				const iRemoveRogue = Math.abs(oMissingUnits.rogue)
				say(`Remove ${iRemoveRogue} rogues`)
				await clickCanvas(220, 340, iRemoveRogue)
			}
			
			while (oReplaceUnits.rogue > 0) {
				say(`Replace ${oReplaceUnits.rogue} damaged rogues`)
				await clickCanvas(412, 336) // Third slot of standing army
				await clickCanvas(506, 547) // Add new rogue
				oReplaceUnits.rogue--
			}
		}
		
		return true
	},
	
	replaceUnits2: async function() {
		// Check if we still have enough reserve units
		if (!this.checkReserveUnits()) {
			return false
		}
		
		// Remove all units from standing army
		await clickCanvas(220, 265, 8)
		
		// Add healthy range units
		if (this.army.range > 0) {
			await clickCanvas(495, 412) // Change to ranged units
			await clickCanvas(290, 480, this.army.range - 1)
		}
		
		// Add healthy heavies
		if (this.army.heavy > 0) {
			await clickCanvas(356, 412) // Change to heavy view
			await clickCanvas(290, 480, this.army.heavy - 1)
		}
		
		// Add healthy rogues
		if (this.army.rogue > 0) {
			await clickCanvas(403, 412) // Change to light units
			await clickCanvas(290, 480, this.army.rogue - 1)
		}
		
		return true
	},
	
	checkReserveUnits: function() {
		let bEnoughReserveUnits = true
		for (const sClass in this.army) {
			const iMinReserve = this.army[sClass], 
				  iDiff = oReserveUnits[sClass] - iMinReserve
			if (iDiff < 0) {
				say(`Missing ${-iDiff} ${sClass} units`)
				bEnoughReserveUnits = false
				return
			}
		}
		return bEnoughReserveUnits
	},
	
	hasWrongUnits: function() {
		let bHasWrongUnit = false
		say(oStandingArmy, this.army)
		oStandingArmy.forEach(oUnit => {
			if (bHasWrongUnit) return
			
			const sClass = getUnitClass(oUnit)
			
			if (oUnit.unitTypeId == "rogue") {
				//say("rogue", oUnit.unitTypeId, sClass, this.army.rogue < 1)
				bHasWrongUnit = this.army.rogue < 1
			}
			else if (sClass == "short_ranged") {
				//say("range", oUnit.unitTypeId, sClass, this.army.range < 1)
				bHasWrongUnit = this.army.range < 1
			}
			else if (sClass == "heavy_melee") {
				//say("heavy", oUnit.unitTypeId, sClass, this.army.heavy < 1)
				bHasWrongUnit = this.army.heavy < 1
			}
			else {
				say("wrong unit", oUnit.unitTypeId, sClass)
				bHasWrongUnit = true
			}
		})
		return bHasWrongUnit
	}
}

// Motivating other players
const fsMotivate = {
	
	neighbours: [],
	guildmembers: [],
	friends: [],
	
	start: async function() {
		let iNotMotivated = 0
		bStopExecution = false
		for (let iPage = 0; iPage < 99; iPage++) {
			for (let iPlayer = 1; iPlayer <= 5; iPlayer++) {
				const bMotivated = await motivatePlayer(iPlayer)
				if (!bMotivated) iNotMotivated++
				if (iNotMotivated > 2) bStopExecution = true
	
				if (bWaitForEnter) {
					await waitForEnter()
				}
				if (bStopExecution) {
					say("Stopping motivation")
					return
				}
			}
			await openPrevPage()
		}
	}
}
