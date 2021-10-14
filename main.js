// Depends on FoEproxy browser addon

let bStopExecution = false, // Whether or not the script should stop at the next possible step
    bWaitForEnter = false, // Whether or not the scripts wait for the user to press enter
    fArcFactor = 1.820, // Maybe read that one in automaticly
    oCanvas // The canvas/object the game is running on

// List of player ids that won't get sniped 
const aDontSnipePlayer = []


// ------------------ //
//   Helper methods   //
// ------------------ //

// Pauses for x milliseconds
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms + randPlusMinus()))
      
// Returns random value between -2 and 2. Used to randomize clicks and timeouts
const randPlusMinus = _ => Math.random() < 0.5 ? (Math.random() < 0.5 ? -2 : -1) : (Math.random() < 0.5 ? 2 : 1)

// Heper method to attach event listeners
function addEvent(el, evt, fn) {
    if (el.addEventListener) el.addEventListener(evt, fn, false)
    else if (el.attachEvent) el.attachEvent("on" + evt, fn)
}

// ESC stops current execution
addEvent(document, "keydown", e => {
    if (e.key === "Escape") {
        console.log("Stop execution")
        bStopExecution = true
    }
})

// ENTER continues current paused execution
addEvent(document, "keydown", e => {
    if (e.key === "Enter") {
        console.log("Continue execution")
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
    console.log("Press Enter to continue")
    return new Promise(resolve => {
		    const oInterval = setInterval(function() {
			      if (!bWaitForEnter || bStopExecution) {
				        clearInterval(oInterval)
				        resolve()
			      }
		    }, 100)
  )
}


// ------------------ //
//   Clicking stuff   //
// ------------------ //

// Triggers clicks at given coords
async function clickCanvas(clickX, clickY) {
	//console.log("Click " + clickX + " " + clickY)

	clickX += randPlusMinus()
	clickY += randPlusMinus()

	const oMouseDown = document.createEvent("MouseEvents"),
	      oMouseUp = document.createEvent("MouseEvents")

	oMouseDown.initMouseEvent("mousedown", true, true, window, 0, 0, 0, clickX, clickY, false, false, false, false, 0, null)
	oMouseUp.initMouseEvent("mouseup", true, true, window, 0, 0, 0, clickX, clickY, false, false, false, false, 0, null)

	oCanvas.dispatchEvent(oMouseDown)
	await sleep(50)
	oCanvas.dispatchEvent(oMouseUp)
}

async function closeDialog() {
	  await sleep(200)
	  await clickCanvas(45, 75)
	  await sleep(200)
}

  
// ---------------------- //
//   Actions to trigger   //
// ---------------------- //

// Scrolls one page to the left
async function openPrevPage() {
	console.log("Open prev page")
	await sleep(300)
	await clickCanvas(244, 657)
	await sleep(300)
}

// "Moppel" n-th player (zero-based)
async function moppelPos(n) {
    bBlueprintReceived = false

	//console.log(`Moppeling player ${n}`)
	await clickCanvas(335 + n * 100, 704)
	const oResponse = await awaitResponse("OtherPlayerService", "polivateRandomBuilding");
	await sleep(100)

	if (typeof oResponse == "undefined") return false

    if (bBlueprintReceived) {
		console.log("Closing blueprint dialog")
		await sleep(100)
		await closeDialog()
		await sleep(100)
	}

	return true
}

// "Moppel" n pages (descending) of five players each
async function moppelPages() {
	bStopExecution = false
	for (let iPage = 0; iPage < 99; iPage++) {
		let iNotMoppeled = 0
		for (let iPos = 0; iPos < 5; iPos++) {
			const bMoppeled = await moppelPos(iPos)
			if (!bMoppeled) iNotMoppeled++
			if (iNotMoppeled > 2) bStopExecution = true

			if (bWaitForEnter) {
				await waitForEnter()
			}
			if (bStopExecution) {
				console.log("Stopping execution of moppelPages()")
				return
			}
		}
		await openPrevPage()
	}
}

// Opens list of great buildings of n-th player (zero-based)
async function openGreatBuildingsPos(n) {
	//console.log("Opening great buildings of pos " + n)
    await clickCanvas(349 + n * 108, 663)

	const oGreatBuildings = await awaitResponse("GreatBuildingsService", "getOtherPlayerOverview")
	if (!oGreatBuildings) {
		console.log(`%c Pos ${n} doesn't have great buildings`, "color: #bada55")
		return false
	}

	let aGreatBuildings = []
	for (const iSpot in oGreatBuildings.responseData) {
		// Skip buildings where no significant progress was made yet
		const oGreatBuilding = oGreatBuildings.responseData[iSpot]
		if ((oGreatBuilding.current_progress ?? 0) < 10) continue
		
		// Stop sniping if player is known to us
		if (dontSnipe(oGreatBuilding.player.player_id)) return false

		aGreatBuildings.push({
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
	await clickCanvas(780, 281 + n * 29)
	const oGreatBuilding = await awaitResponse("GreatBuildingsService", "getConstruction")
	if (!oGreatBuilding) return false

	//console.log(`Great building ${n} opened`)
	//console.log(oGreatBuilding)
	let aRankings = []
	for (const oRanking of oGreatBuilding.responseData.rankings) {
		// Skip building if you already spent points
		if (oRanking?.player?.is_self) return []

		aRankings.push({
			spent: oRanking?.forge_points ?? 0,
			reward: oRanking?.reward?.strategy_point_amount ?? 0
		})
	}
	return aRankings
}
async function snipeGreatBuilding(iAmount) {
	  await clickCanvas(743, 274) // Click input field
}

async function checkGreatBuildingsPos(n) {
	bStopExecution = bWaitForEnter = false

	// Open list of players great buildings
	let aGreatBuildings = await openGreatBuildingsPos(n)
	if (!aGreatBuildings || aGreatBuildings.length < 1) return

	console.log(`Checking ${aGreatBuildings.length} great buildings of pos ` + n)

	// Check each of the great buildings
	for (const oGreatBuilding of aGreatBuildings) {
		await sleep(150)
		const iDiff = oGreatBuilding.needed - oGreatBuilding.current,
              aRankings = await openGreatBuilding(oGreatBuilding.spot)
		if (!aRankings) return

		//console.log(aRankings)
		for (const iSpot in aRankings) {
			const oRanking = aRankings[iSpot],
				  iArcReward = Math.ceil(oRanking.reward * fArcFactor)

			for (let iPut = 0; iPut < Math.min(iArcReward, iDiff); iPut++) {
				if ((iPut - oRanking.spent) >= (iDiff - iPut)) {
					const iReward = iArcReward - iPut
					console.log(`%c Snipe player ${n+1}, ${oGreatBuilding.name}, spot ${iSpot} with ${iPut} FP for ${iReward} reward!`, "background: #222; color: #bada55")
					await snipeGreatBuilding(iPut)
					bWaitForEnter = true
					return
				}
			}
		}

		if (bWaitForEnter) {
			await waitForEnter()
		}
		if (bStopExecution) {
			console.log("Stopping execution of checkGreatBuildingsPos()")
			return
		}

		// Close great building page
		await closeDialog()
	}

	// Close list of great buildings
	await closeDialog()
}

async function checkGreatBuildingPages(n) {
	bStopExecution = bWaitForEnter = false
	for (let iPage = 0; iPage < n; iPage++) {
		console.log("Checking great buildings of page " + iPage + " of " + n)
		for (let iPos = 0; iPos < 5; iPos++) {
			await checkGreatBuildingsPos(iPos)

			if (bWaitForEnter) {
				await waitForEnter()
			}
			if (bStopExecution) {
				console.log("Stopping execution of checkGreatBuildingPages()")
				return
			}

			await closeDialog()
		}
		await openPrevPage()
	}
}

function moppelFrom(iPlayerPos) {
	const iPage = Math.ceil(iPlayerPos / 5)
	moppelPages(iPage)
}

function snipeFrom(iPlayerPos) {
	const iPage = Math.ceil(iPlayerPos / 5)
	checkGreatBuildingPages(iPage)
}

function dontSnipe(iPlayerId) {
	//console.log("Check if we should snipe " + iPlayerId)
	if (aDontSnipePlayer.includes(iPlayerId)) {
		console.log("Not sniping player " + iPlayerId)
		return true
	}
	return false
}




(async function() {
    // Wait a bit for FoEproxy to be loaded
	await sleep(1000)

    // Wait for first service response from FoE
	FoEproxy.addHandler("InventoryService", "getGreatBuildings", (response, request) => {
        // Only run once
        if (bFoeScriptsInit) return
        bFoeScriptsInit = true

        oCanvas = document.getElementsByTagName("canvas")[0]

        // Log click coords
        //addEvent(oCanvas, "click", e => console.log(e.pageX, e.pageY))

        console.log("FoEscripts initiated")
	})

    // Close dialog when receiving blueprints
    FoEproxy.addHandler("BlueprintService", "all", async (response, request) => {
        console.log("Received blueprint")
        bBlueprintReceived = true
		await closeDialog()
    })
})()
