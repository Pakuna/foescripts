let bFoeScriptsInit = false,
	bStopExecution = false,
	bWaitForEnter = false,
	bBluePrintReceived = false,
	iAvailableFp = 999999,
	iCurrentPlayer = 0,
	oStandingArmy = new Set(),
	oDamagedUnits = new Set(),
	oReserveUnits = {},
	oCanvas, 
	iYourPlayerId

const aFreeTavernOwners = new Set(),
	  bLogClickCoords = false, // console log mouse coordinates?
	  fArcFactor = 1.900,
	  aDontSnipePlayer = [], // Player IDs you don't want to snipe, use getPlayerIdOfPos() to get IDs
	  aDontSnipeBuildings = [
		"X_AllAge_Oracle", // Orakel
		"X_BronzeAge_Landmark2", // Zeus
		"X_IronAge_Landmark2", // Leuchtturm
		"X_AllAge_EasterBonus4", // Observatorium
		"X_BronzeAge_Landmark1", // Turm zu Babel
		"X_EarlyMiddleAge_Landmark3", // Galataturm
	  ],
	  aIgnoreClasses = [
	  	"TimeService", 
	  	"TimerService",
	  	"LogService", 
	  	"StartupService",
	  	"MessageService", // Nachrichten
	  	"AnnouncementsService",
	  	"BonusService",
	  	"BoostService",
	  	"CityMapService",
	  	"CrmService",
	  	"StaticDataService",
	  	"TutorialService",
	  	"TrackingService",
	  	"QuestService",
	  	"PremiumService",
	  	"BlueprintService", // Blaupausen
	  	"CastleSystemService", // Burgsystem 
	  	"CampaignService", // Kampagne
	  	"ChallengeService", // Tägliche Herausforderung
	  	"ItemShopService", // Shop
	  	"CashShopService", // Shop
	  	"SaleInfoService", // Shop
	  	"OutpostService", // Siedlungen
	  	"IgnorePlayerService", // Ignore Liste
	  	"RankingService", // Spielerrang
	  	"ResearchService", // Forschung
	  	"InventoryService", // Inventar
	  	"ResourceService", // Güter
	  	"EmissaryService", // Botschafter
	  	"HiddenRewardService", // Ereignisse
	  	"PlayerProfileService",
	  	"ItemExchangeService",
	  	"NoticeIndicatorService", // Neue Gegenstände im Inventar
	  	"SettingsService",
	  	"ArmyUnitManagementService",
	  	"TradeService",
	  	"ConversationService",
	  	"GuildExpeditionService",
	  	"ClanBattleService",
	  	"ChestEventService",
	  	"LeagueService",
	  	"AntiquesDealerService",
	  	"OtherPlayerService",
	  	"CityProductionService",
	  	"MerchantService",
	  	"AdvancementService",
	  	"GuildBattlegroundStateService",
	  	"GuildBattlegroundService"
  	  ], 
	  aIgnoreMethods = [
	  	"getInvitationLink", // FriendService 
	  	"getOtherTavernStates", // Freundestavernen
	  	"getOtherTavernState",  // Freundestaverne
	  	"getSittingPlayersCount", // Taverne besucht
	  	"getAwaitingFriendRequestCount",
	  	"updateActions",
	  	"getClanMemberList",
	  	"getNeighborList",
	  	"getFriendsList",
	  	"getOtherTavern",
	  	"getOtherPlayerOverview", // GBs of other player
	  	"getOtherPlayerCityMapEntity", // 
	  	"getConstruction", // GB slots of other player
	  	"getEventsPaginated", // Ereignisse
	  	"contributeForgePoints", // FP zu GB beitragen
	  	"getAvailablePackageForgePoints",
	  	"getArmyPreview", // BattlefieldService enemy army
	  	"startByBattleType", // BattlefieldService battle result
	  	"collectReward", // RewardService battle reward
  	  ]
	  
// Init scripts as soon as FoEproxy gets the first response
FoEproxy.addHandler("all", "all", oResponse => {
	// Only run once
	if (bFoeScriptsInit) return
	bFoeScriptsInit = true
	
	oCanvas = document.getElementsByTagName("canvas")[0]

	if (bLogClickCoords) {
		addEvent(oCanvas, "click", e => say(e.pageX, e.pageY))
	}

	TavernService.start(false)

	say("FoEscripts initiated")
})

// Helper method to log incoming responses
FoEproxy.addHandler("all", "all", oResponse => {
	const sClass = oResponse.requestClass,
		  mMethod = oResponse.requestMethod,
		  oData = oResponse.responseData
    
    // Ignore certain know classes or methods
	if (aIgnoreClasses.includes(sClass) || aIgnoreMethods.includes(mMethod)) {
		return
	}
	
	say(sClass, mMethod, oData)
})

// Update spendable FPs
FoEproxy.addHandler("GreatBuildingsService", "getAvailablePackageForgePoints", oResponse => {
	iAvailableFp = oResponse.responseData[0]
	say(iAvailableFp + " FP left to spend")
})

// Your army composition
FoEproxy.addHandler("ArmyUnitManagementService", "getArmyInfo", oResponse => {
	// Reset stored values
	oStandingArmy.clear()
	oDamagedUnits.clear()
	oReserveUnits = {"heavy": 0, "rogue": 0}
	
	oResponse.responseData.units.forEach(oUnit => {
		if (oUnit?.is_attacking) oStandingArmy.add(oUnit)
		
		// Still enough HP left?
		if (oUnit.currentHitpoints > 8) {
			if (oUnit.unitTypeId == "rogue") oReserveUnits.rogue++
			else if (oUnit.unitTypeId == "grenadier") oReserveUnits.heavy++
		}
	})
	
	oStandingArmy.forEach(oUnit => {
		if (oUnit.currentHitpoints < 9) oDamagedUnits.add(oUnit)
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

// ESC stops current execution
addEvent(document, "keydown", e => {
	if (e.key === "Escape") {
		say("Stop execution")
		bStopExecution = true
	}
})

// ENTER continues current paused execution
addEvent(document, "keydown", e => {
	if (e.key === "Enter") {
		say("Continue execution")
		bWaitForEnter = false
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
			say(this.freeSeats.size + " freie Tavernen")
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
async function clickCanvas(clickX, clickY, iRepeat = 0) {
	//say("Click " + clickX + " " + clickY)

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
		await sleep(100)
		await clickCanvas(clickX, clickY, --iRepeat)
	}
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
	say("Open prev page")
	await sleep(300)
	await clickCanvas(244, window.innerHeight - 65)
	await sleep(300)
}

// "Moppel" i.e. motivate n-th player
async function moppelPlayer(iPlayerPos) {
	bBluePrintReceived = false
	const iWindowHeight = window.innerHeight

	//say(`Moppeling player ${iPlayerPos}`)
	await clickCanvas(315 + (iPlayerPos - 1) * 108, iWindowHeight - 15)
	const oResponse = await awaitResponse("OtherPlayerService", "polivateRandomBuilding")
	if (!oResponse) return false

	if (bBluePrintReceived) {
		await closeDialog("Blueprint")
	}
	
	// Check if tavern is free and get a drink
	const iOwnerId = oResponse.responseData.mapEntity?.player_id
	if (TavernService.has(iOwnerId)) {
		//say("Gonna have a drink as well")
		await clickCanvas(350 + n * 108, iWindowHeight - 35)
		await awaitResponse("FriendsTavernService", "getSittingPlayersCount")
		await sleep(100)
	}
	
	return true
}

// "Moppel" n pages (descending) of five players each
async function moppelPages() {
	bStopExecution = false
	for (let iPage = 0; iPage < 99; iPage++) {
		let iNotMoppeled = 0
		for (let iPlayer = 1; iPlayer <= 5; iPlayer++) {
			const bMoppeled = await moppelPlayer(iPlayer)
			if (!bMoppeled) iNotMoppeled++
			if (iNotMoppeled > 2) bStopExecution = true

			if (bWaitForEnter) {
				await waitForEnter()
			}
			if (bStopExecution) {
				say("Stopping execution of moppelPages()")
				return
			}
		}
		await openPrevPage()
	}
}

// Opens list of great buildings of n-th player (zero-based)
async function openGreatBuildings(iPlayer) {
	//say("Opening great buildings of player " + iPlayer)
	await clickCanvas(349 + (iPlayer - 1) * 108, window.innerHeight -60)

	const oGreatBuildings = await awaitResponse("GreatBuildingsService", "getOtherPlayerOverview")
	if (!oGreatBuildings) {
		whisper(`Player ${iPlayer} doesn't have great buildings`)
		return false
	}

	let aGreatBuildings = []
	for (const iSpot in oGreatBuildings.responseData) {
		const oGreatBuilding = oGreatBuildings.responseData[iSpot]
		
		// Stop sniping if player is known to us
		if (dontSnipePlayer(oGreatBuilding.player.player_id)) return false
		
		// Skip lower age buildings
		if (dontSnipeBuilding(oGreatBuilding.city_entity_id)) continue

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
	const iDialogWidth = 725, iDialogHeight = 480, // Got those by checking dialog edge coordinates
	      iWindowWidth = window.innerWidth, iWindowHeight = window.innerHeight,
	      iDialogRightEdge = iWindowWidth - ((iWindowWidth - iDialogWidth) / 2),
	      iDialogTopEdge = iWindowHeight - ((iWindowHeight - iDialogHeight) / 2)
	      
	await clickCanvas(iDialogRightEdge - 100, iDialogTopEdge + 125 + n * 29)
	
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
	bStopExecution = bWaitForEnter = false

	// Open list of players great buildings
	let aGreatBuildings = await openGreatBuildings(iPlayer)
	if (!aGreatBuildings) return
	
	if (aGreatBuildings.length) {
		if (iCurrentPlayer > 0)
			say(`Checking ${aGreatBuildings.length} great buildings of player ` + iCurrentPlayer)
		else 
			say(`Checking ${aGreatBuildings.length} great buildings of player ` + iPlayer)
	
		// Check each of the great buildings
		for (const oGreatBuilding of aGreatBuildings) {
			await snipeGreatBuilding(oGreatBuilding, iPlayer)
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
				
				if (iReward < 50 && fROI < 10) return
					  
				shout(`Snipe player ${iPlayer}'s ${oGB.name} (id ${oGB.id}) with ${iPut} FP for ${iReward} reward / ${fROI}% ROI!`)
				bWaitForEnter = true
				return
			}
		}
	}

	if (bWaitForEnter) {
		await waitForEnter()
	}
	if (bStopExecution) {
		say("Stopping execution of snipeGreatBuilding()")
		return
	}

	// Close great building page
	await closeDialog("GB page")
}

async function snipePages(n) {
	bStopExecution = bWaitForEnter = false
	for (let iPage = 0; iPage < n; iPage++) {
		say("Checking great buildings of page " + (iPage + 1) + " of " + n)
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

function moppelFrom(iPlayerPos) {
	const iPage = Math.ceil(iPlayerPos / 5)
	moppelPages(iPage)
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
	return false // Always snipe for now
	
	//say("Check if we should snipe building " + sBuildingId)
	if (aDontSnipeBuildings.includes(sBuildingId)) {
		//say("Not sniping building " + sBuildingId)
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

async function fight() {
	let iEnemyArmies = 0
	awaitResponse("BattlefieldService", "getArmyPreview").then(oEnemyArmy => {
		iEnemyArmies = oEnemyArmy?.responseData.length ?? 0
	})
	
	await clickCanvas(416, 449)
	const oArmyResponse = await awaitResponse("ArmyUnitManagementService", "getArmyInfo")
	
	if (!oArmyResponse) {
		say("Aborting attack")
		return
	}
	
	const bGoodToGo = await replaceDamagedUnits()
	if (!bGoodToGo) return false
	
	// Check for reward
	let bRewardReceived = false
	awaitResponse("RewardService", "collectReward").then(oReward => {
		bRewardReceived = typeof oReward != "undefined"
	})
	
	// Start auto battle
	await clickCanvas(444, 629)
	await awaitResponse("BattlefieldService", "startByBattleType")
	await sleep(100)
	await clickCanvas(512, 631) // Click OK/next battle
	
	if (iEnemyArmies > 1) {
		await awaitResponse("BattlefieldService", "startByBattleType")
		await sleep(100)
		await clickCanvas(512, 631) // Click OK
	}
	
	if (bRewardReceived) {
		await sleep(100)
		await closeDialog()
	}
	
	return true
}

async function fightRounds(iRounds) {
	let bWon = true
	while (iRounds-- > 0 && bWon && !bStopExecution) bWon = await fight()
}

async function replaceDamagedUnits() {
	if (oReserveUnits.heavy < 2 || oReserveUnits.rogue < 2) {
		return false
	}
	
	// How many units are missing from the standing army?
	let oMissing = {"heavy": 2, "rogue": 6}
	oStandingArmy.forEach(oUnit => {
		if (oUnit.unitTypeId == "rogue") oMissing.rogue--
		else oMissing.heavy--
	})
	
	// How many units are damaged?
	let oReplace = {"heavy": 0, "rogue": 0}
	oDamagedUnits.forEach(oUnit => {
		if (oUnit.unitTypeId == "rogue") oReplace.rogue++
		else oReplace.heavy++
	})
	
	if (oReserveUnits.heavy > 2 && (oMissing.heavy || oReplace.heavy)) {
		await clickCanvas(356, 415) // Change to heavy view
		
		if (oMissing.heavy) {
			await clickCanvas(288, 472, oMissing.heavy - 1) // Add missing heavy units
		}
		
		while (oReplace.heavy > 0) {
			await clickCanvas(211, 334) // Remove damaged heavy unit
			await clickCanvas(288, 472) // Add new heavy unit
			oReplace.heavy--
		}
	}
	
	if (oReserveUnits.rogue > 2 && (oMissing.rogue || oReplace.rogue)) {
		await clickCanvas(403, 410) // Change to light units
		
		if (oMissing.rogue) {
			await clickCanvas(843, 477, oMissing.rogue - 1) // Add missing rogues
		}
		
		while (oReplace.rogue > 0) {
			await clickCanvas(412, 336) // Remove damaged rogue
			await clickCanvas(843, 477) // Add new rogue
			oReplace.rogue--
		}
	}
	
	return true
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
