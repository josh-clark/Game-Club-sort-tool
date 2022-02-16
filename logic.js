var data = {};
var foo;

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
	select.onchange = createList;
}

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
		listsByScore["gameList" + userDatum.score].push(userDatum.game);
	});
	Object.keys(listsByScore).forEach(function (listName) {
		var ol = document.createElement("ol");
		ol.id = listName;
		ol.className = "list-group";
		ol.start = fragment.querySelectorAll("ol > li").length + 1;
		
		// Populate each score's sub-list.
		listsByScore[listName].forEach(function (game) {
			var li = document.createElement("li");
			li.innerText = game;
			li.className = "list-group-item";
			ol.appendChild(li);
		});
		
		Sortable.create(ol, {
			animation: 150,
			ghostClass: "ghost",
			onEnd: exportList
		});
		fragment.appendChild(ol);
	});
	
	gameList.appendChild(fragment);
}

function exportList(event) {
	var itemList = document.querySelector('#gameList').querySelectorAll(".list-group-item");
	var exportText = "";
	var i = 1;
	itemList.forEach(function (item) {
		exportText += item.innerText + "\t" + (itemList.length-i) + "\r\n";
		i++;
	});
	var exportField = document.querySelector('#exportField');
	exportField.value = exportText;
}

function formatData(event) {
	if (this.status === 200) {
		var gameClubData = this.response;
		console.log(gameClubData);
		data = gameClubData;
		
		fillUserList(Object.keys(gameClubData));
	}
	else {
		console.log("Request failed.  " + this.status);
	}
}

document.querySelector("#copyButton").addEventListener("click", function (event) {
	const copyText = document.querySelector("#exportField").value;
	
	if (navigator.clipboard !== undefined) {
		navigator.clipboard.writeText(copyText).then(
			function () {
				var status = document.querySelector("#copyStatus");
				status.className = "success";
				status.innerText = "Success!  The text was copied to your clipboard.";
			},
			function () {
				var status = document.querySelector("#copyStatus");
				status.className = "failure";
				status.innerText = "Your browser does not support the Clipboard API.  Copy it manually.";
			}
		);
	}
	else {
		var aux = document.createElement("input");
		aux.setAttribute("type", "hidden");
		aux.setAttribute("value", copyText);
		console.log(copyText);
		document.body.appendChild(aux);
		aux.select();
		document.execCommand("copy");
		document.body.removeChild(aux);
	}
});

var req = new XMLHttpRequest();
req.responseType = "json";
req.open("GET", "./data.json", true);
req.onload = formatData;
req.send();

document.querySelector('#exportField').value = "";

