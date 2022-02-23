var data = {};

/**
 * Fill the <select> with the list of users from the data object.
 */
function fillUserList(users) {
	var select = document.querySelector("#whoami");
	var fragment = new DocumentFragment();
	users.forEach(function (user) {
		var option = document.createElement("option");
		option.innerHTML = user;
		option.value = user;
		fragment.appendChild(option);
	});
	select.appendChild(fragment);
	select.addEventListener("change", createList);
	select.addEventListener("change", exportList);
}

/**
 * Create the sortable list of games from the data object
 * for the currently selected user.
 */
function createList(event) {
	// Clear out existing gameList.
	var gameList = document.querySelector("#gameList");
	while (gameList.firstChild) {
		gameList.firstChild.remove();
	}
	
	// Quit out on invalid/empty selection.
	if (!data.hasOwnProperty(event.target.value)) {
		return;
	}
	
	// Header text.
	var header = document.createElement("h1");
	header.innerHTML = event.target.value;
	gameList.appendChild(header);
	
	var fragment = document.createDocumentFragment();
	var listsByScore = {};
	var userData = data[event.target.value];
	
	// Create a sub-list for each possible score.
	userData.forEach(function (userDatum) {
		if (!listsByScore.hasOwnProperty("gameList" + userDatum.score)) {
			listsByScore["gameList" + userDatum.score] = [];
		}
		listsByScore["gameList" + userDatum.score].push(userDatum);
	});
	Object.keys(listsByScore).forEach(function (listName) {
		var ol = document.createElement("ol");
		ol.id = listName;
		ol.className = "list-group";
		ol.start = fragment.querySelectorAll("ol > li").length + 1;
		
		// Populate each score's sub-list.
		listsByScore[listName].forEach(function (game) {
			var li = document.createElement("li");
			var wrap = document.createElement("div");
			wrap.innerText = game.game;
			li.className = "list-group-item";
			li.setAttribute("data-id", game.id);
			li.setAttribute("data-score", game.score);
			li.appendChild(wrap);
			ol.appendChild(li);
		});
		
		// Trigger the Sortable library to facilitate drag-drop.
		Sortable.create(ol, {
			animation: 150,
			ghostClass: "ghost",
			onSort: exportList
		});
		fragment.appendChild(ol);
	});
	
	gameList.appendChild(fragment);
}

/**
 * Export the sorted list of games to the export field,
 * update the data object to match the sorted list,
 * and commit the updated data object to localStorage.
 */
function exportList(event) {
	var itemList = document.querySelector("#gameList").querySelectorAll(".list-group-item");
	var exportText = "";
	var i = 1;
	const user = document.querySelector("#whoami").value;
	
	// Clear out data object for current user.
	data[user] = [];
	
	itemList.forEach(function (item) {
		// Push game item into export field.
		exportText += item.getAttribute("data-id") + "\t" + (itemList.length-i) + "\r\n";
		i++;
		
		// Push game item into data object for current user.
		data[user].push({
			"id": item.getAttribute("data-id"),
			"game": item.innerText,
			"score": item.getAttribute("data-score")
		});
	});
	
	// Commit to the export textarea.
	var exportField = document.querySelector('#exportField');
	exportField.value = exportText;
	
	// Commit the data object to localStorage.
	saveData();
}

/**
 * Event handler for XHR to kick off loading the data object.
 */
function formatData(event) {
	if (this.status === 200) {
		data = this.response;
		fillUserList(Object.keys(data));
	}
	else {
		console.log("Request failed.  Status code: " + this.status);
	}
}

/**
 * Save the data object to localStorage.
 * This fails silently if the user has not checked the consent checkbox.
 *
 * @TODO Also save to cookies in case localStorage is unavailable.
 */
function saveData() {
	if (window.localStorage !== undefined && localStorage.getItem("cookie-consent") === "accepted") {
		localStorage.setItem("data", JSON.stringify(data));
	}
	//document.cookie = "data=" + document.querySelector('#exportField').value + "; max-age=31536000";
}

/**
 * Load the data object from localStorage.
 *
 * @TODO Fallback to cookies if localStorage is unavailable.
 */
function loadData() {
	if (window.localStorage !== undefined) {
		data = JSON.parse(localStorage.getItem("data"));
	}
	if (data === undefined) {
		//data = document.cookie.split("; ").find(item => item.startsWith("data=")).split("=")[1];
		console.log(data);
	}
}

/**
 * Clear the localStorage.
 *
 * @TODO Also clear cookies.
 */
function clearData() {
	if (window.localStorage !== undefined) {
		localStorage.clear();
	}
	//document.cookie = "data=; expires=0";
}

/**
 * Restore the <div id="copyStatus"> to its initial, empty status.
 */
function clearCopyStatus() {
	var status = document.querySelector("#copyStatus");
	status.className = "";
	status.innerText = "";
}



// This is the "on-load" stuff.

// Event Listeners

document.querySelector("#acceptCookies").addEventListener("click", function (event) {
	const isAccepted = event.target.checked;
	if (isAccepted) {
		localStorage.setItem("cookie-consent", "accepted");
		saveData();
	}
	else {
		clearData();
	}
});

document.querySelector("#cookieExplanationToggle").addEventListener("click", function (event) {
	var explanation = document.querySelector("#cookieExplanation");
	const isVisible = explanation.className === "visible";
	if (!isVisible) {
		explanation.className = "visible";
	}
	else {
		explanation.className = "";
	}
});

document.querySelector("#copyButton").addEventListener("click", function (event) {
	const copyText = document.querySelector("#exportField").value;
	
	if (navigator.clipboard !== undefined) {
		navigator.clipboard.writeText(copyText).then(
			function () {
				var status = document.querySelector("#copyStatus");
				status.className = "success";
				status.innerText = "Success!  The text was copied to your clipboard.";
				setTimeout(clearCopyStatus, 2500);
			},
			function () {
				var status = document.querySelector("#copyStatus");
				status.className = "failure";
				status.innerText = "Your browser does not support the Clipboard API.  Copy it manually.";
				setTimeout(clearCopyStatus, 5000);
			}
		);
	}
	else {
		var aux = document.createElement("input");
		aux.setAttribute("type", "hidden");
		aux.setAttribute("value", copyText);
		document.body.appendChild(aux);
		aux.select();
		document.execCommand("copy");
		document.body.removeChild(aux);
	}
});

document.querySelector("#exportField").addEventListener("focus", function (event) {
	event.target.select();
});


// Set up field defaults.

document.querySelector("#acceptCookies").checked = window.localStorage !== undefined && localStorage.getItem("cookie-consent") === "accepted";

if (navigator.clipboard === undefined) {
	document.querySelector("#copyButton").style = "display: none;";
}

if (document.querySelector("#acceptCookies").checked) {
	loadData();
}

if (Object.keys(data).length > 0) {
	fillUserList(Object.keys(data));
	console.log("loading data from localStorage");
}
else {
	console.log("loading data from XHR");
	var req = new XMLHttpRequest();
	req.responseType = "json";
	req.open("GET", "./data.json", true);
	req.onload = formatData;
	req.send();
}

document.querySelector('#exportField').value = "";

