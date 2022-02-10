# FoE Scripts
JS Helper to run tedious tasks like motivating friends and sniping your neighbourhood

Depends on FoE Helper browser addon

Please note - this snippet is pretty much work in progress and trimmed to my window size (quite a few static coordinates in there) to press certain dialog buttons and needs a bit of preparation from the user at this stage. There's a good chance it'll have problems on others systems. Happy to get some help to clean up/dynamicly calculate the coordinates to click.

I'm using a Chrome extension called "User JavaScript and CSS" [1] (but I guess similar extensions work as well) to load the whole thing everytime the game loads i.e. https://XYZ.forgeofempires.com/ where XYZ is your server. Then I'm using the browser console to check for errors and start commands. Sometimes it needs a reload because it ran into a race-condition while loading FoE Helper. And because the whole thing is based on artificially moving the mouse for you, you shouldn't move the mouse in the game while a command runs or you'll confuse it! You can have another browser window (I'm watching youtube while the script does its thing) open, though. As long as it doesn't cover the one with FoE completly :)

Here are the commands I'm using:

moppelPlayer(x) - Where x is a value of 1 to 5 (position of the player you want to motivate). Presses the "motivate" button (we call it "moppel" or just "helping" in german) and visits the tavern (if there's a free seat) of a single player in the list (neigbors, guild mates, friends) you have opened

moppelFrom(x) - To motivate x players of your list of neighbors/friends/guild mates and visit free tavern seats. First you have to open the list you want to process and scroll to the right most position i.e. the end. Then, start the command in the console which the number of players you have in there and it'll start to go through the players from the end to beginning till it recognises, that there are no more buttons to press

snipePlayer(x) - Pretty much the same as moppelPos(x) but it looks for a great building of the given player to snipe. Depends on your arc bonus as defined in "fArcFactor". As soon as it finds a spot to snipe, which gives 10% or 50 FP more reward than it costs it logs out the needed FP amount.

snipeFrom(x) - Also pretty much the same as moppelFrom(x) but for sniping great buildings. When it found a great building to snipe it waits for you to add the needed FP and to press enter to continue. Tried to automate the FP spending action, but didn't work out as of yet.

fight() - Added that one just a few days ago so still working on it. Used for guild battles. First you have to open a province you want to fight in so the dialog with buttons for choosing fighting or trading and the province buildings shows up. Then start the command and it'll check your army composition, replacing damaged (lower than 9 HP) units and making sure you have to heavy units and six rogues in there. This command relies heavily on the other light units you have in reserve because rogues are in the same list. It pretty much just clicks on the last spot in the list of visible light units and hopes its a rogue :)

fightRounds(x) - Calls fight() x times after another to quickly fight a few rounds.

Each command can be interrupted by pressing ESC (maybe mutiple times) 

[1] https://chrome.google.com/webstore/detail/user-javascript-and-css/nbhcbdghjpllgmfilhnhkllmkecfmpld
