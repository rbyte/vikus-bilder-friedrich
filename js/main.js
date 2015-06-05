
var vikus = (function() {
	var vikus = {}

	vikus.init = function() {
		//loadJson("data/spsg_NEU.json", withData)

	/*Könntest Du die Kategoriennamen auch einmal mit den "tags", also den Indexbezeichnungen, abgleichen? Im Fall von "Landschaften" und "Schnörkel" sind nur wenige GK Nummern aus dem Ausstellungskatalog in unserer Datenbank, aber die Kategorien aus dem Katalog "Landschaft" und "Schnörkel" sind als Indexbezeichnungen vergeben.

	 Außerdem: In Fällen wie "Literatur" -> "Literaturdarstellungen"+Kinder, das auch als "Mutter" im Index als Begriff vergeben ist, die Kinder hinzufügen zu der Kategorie unten.
	 */
		var fields = {
			cat: {path: "data/kategorien_aus_ausstellungskatalog.json"},
			spsg: {path: "data/spsg.json"}
		}
		if (false)
			loadJsonFilesAndSync(fields, withData)

		draw()
	}

	Object.values = function(obj) {
		return Object.keys(obj).map(function(key) {
			return obj[key]
		})
	}


	function withData(fields) {
		var obj = fields.spsg.data
		var cat = fields.cat.data

		var anzahlEintraege = Object.keys(obj).length

		var alleAttribute = obj[Object.keys(obj)[0]]

		var nichtImmerVorhandeneAttribute = new Set()

		var vorkommenNichtVorhandenerAttribute = 0
		Object.values(obj).forEach(function(e) {
			Object.keys(alleAttribute).forEach(function(x) {
				if(e[x] === undefined) {
					nichtImmerVorhandeneAttribute.add(x)
					vorkommenNichtVorhandenerAttribute++
				}
			})
		})

		console.log("anzahlEintraege "+anzahlEintraege)
		console.log("alleAttribute "+Object.keys(alleAttribute).join(", "))
		console.log("vorkommenNichtVorhandenerAttribute "+vorkommenNichtVorhandenerAttribute)
		console.log("nichtImmerVorhandeneAttribute")
		console.log(nichtImmerVorhandeneAttribute)

		Object.keys(obj).forEach(function(key) {
			console.assert(key === obj[key].id)
		})

		Object.values(obj).forEach(function(e) {
			console.assert(e.inventar_nr.match("GK II \\(12\\) "))
		})

		// given in 10^-4 meter (biggest object is < 50cm)
		var anzahlHB = 0
		Object.values(obj).forEach(function(e) {
			if (e.hoehe) {
				e.hoehe = Number(e.hoehe)
				console.assert(e.hoehe > 50 && e.hoehe < 5000)
			} else {
				anzahlHB++
			}
			if (e.breite) {
				e.breite = Number(e.breite)
				console.assert(e.breite > 50 && e.breite < 5000)
			} else {
				anzahlHB++
			}
		})
		console.log("höhe und breite sind nummern zwischen 50 und 5000")
		console.log("anzahl nicht gefundener höhe oder breite: "+anzahlHB)

		var materialSet = new MySet()
		Object.values(obj).forEach(function(e) {
			if (e.material)
				materialSet.add(e.material)
		})
		console.log("materialSet")
		console.log(materialSet.getSorted())


		var thementextSet = new MySet()
		Object.values(obj).forEach(function(e) {
			if (e.thementexte)
				for (var tt of e.thementexte.split("; "))
					if (tt) // tt may be empty
						thementextSet.add(tt)
		})
		console.log("thementextSet")
		console.log(thementextSet.getSorted())


		var misses = 0
		Object.keys(cat).forEach(function(key) {
			for (var inventarNr of cat[key]) {
				var result = Object.values(obj).find(function(e) {
					return e.inventar_nr === inventarNr
				})
				if (result === undefined) {
					misses++
				}
			}
		})
		console.assert(misses === 0)

		var tagSet = new MySet()
		var countTagsSet = new MySet()
		Object.values(obj).forEach(function(e) {
			if (e.index) {
				e.tags = []
				var z = e.index.split("; ")
				z.forEach(function(s) {
					var y = s.split(": ")
					y.forEach(function(ss) {
						tagSet.add(ss)
						e.tags.push(ss)
					})
				})
				countTagsSet.add(z.length)
			}
		})
		console.log("tagSet")
		console.log(tagSet.getSorted())
		console.log("countTagsSet")
		console.log(countTagsSet.getSorted())

		if (false)
		Object.keys(cat).forEach(function(key) {
			var catTagSet = new MySet()
			for (var inventarNr of cat[key]) {
				var result = Object.values(obj).find(function(e) {
					return e.inventar_nr === inventarNr
				})
				for (var t of result.tags)
					catTagSet.add(t)
			}
			console.log("tags für: "+key)
			console.log(catTagSet.getSorted())
		})

		var countZusammenhang = 0
		Object.values(obj).forEach(function(e) {
			if (e.zusammenhang) {
				countZusammenhang++
				for (var ref of e.zusammenhang.split("; "))
					console.assert(obj[ref])
			}
		})
		console.log("einträge mit zusammenhang: "+countZusammenhang)




		if (false)
			Object.values(obj).forEach(function(e) {
				var url = "data/bilder_100/"+e.id+".jpg"
				var img = new Image()
				document.body.appendChild(img)
				img.onerror = (function() { console.assert(false) })
				img.src = url
			})

		if (false)
			Object.values(obj).forEach(function(e) {
				if (e.zeit) {
					console.log(e.zeit)
				}
			})






		console.log("done.")
	}

	function loadJson(path, callback) {
		var xhr = new XMLHttpRequest()
		xhr.open("GET", path)
		xhr.onreadystatechange = function() {
			if (xhr.readyState === 4 && xhr.status === 200) {
				var obj = JSON.parse(xhr.responseText)
				callback(obj)
			}
		}
		xhr.send()
	}

	function loadJsonFilesAndSync(fields, callback) {
		var countLoaded = 0
		var countEntries = Object.keys(fields).length
		for (var key in fields) {
			var xhr = fields[key].request = new XMLHttpRequest()
			xhr.open("GET", fields[key].path)
			xhr.onreadystatechange = (function(obj) {
				return function() {
					if (obj.request.readyState === 4 && obj.request.status === 200) {
						console.log(obj.path)
						obj.data = JSON.parse(obj.request.responseText)
						countLoaded++
						if (countLoaded === countEntries)
							callback(fields)
					}
				}
			})(fields[key])
			xhr.send()
		}
	}



	function MySet() {
		var self = this
		self.entriesAndFrequency = new Map()
	}

	MySet.prototype.add = function(e) {
		var self = this
		if (self.entriesAndFrequency.has(e)) {
			self.entriesAndFrequency.set(e, self.entriesAndFrequency.get(e)+1)
		} else {
			self.entriesAndFrequency.set(e, 1)
		}
	}

	MySet.prototype.get = function() {
		var self = this
		return self.entriesAndFrequency
	}

	MySet.prototype.getSorted = function() {
		var self = this
		// harmony solution:
		//var result = [...self.entriesAndFrequency].sort(([k1, v1], [k2, v2]) => v1 < v2 ? 1 : -1)
		//return result.map(([key, entry]) => key+": "+entry)

		var result = []
		for (var e of self.entriesAndFrequency.entries())
			result.push(e)
		result.sort(function(e1, e2) { return e1[1] < e2[1] ? 1 : -1 })
		return result.map(function(e) { return e[0]+": "+e[1] })
	}





	function draw() {
		var svgViewboxX = -250
		var svgViewboxY = -250
		var svgViewboxWidth = 500
		var svgViewboxHeight = 500

		var svg = d3.select("#vis")
			.append("svg")
			.attr("xmlns", "http://www.w3.org/2000/svg")
			.attr("viewBox", svgViewboxX+" "+svgViewboxY+" "+svgViewboxWidth+" "+svgViewboxHeight)

		svg.append("rect")
			.attr("x", -250).attr("y", -250).attr("width", "500px").attr("height", "500px")
			.style({fill: "#000", "fill-opacity": 0.05})

		var count = 0
		Object.values(skizzen).forEach(function(e) {
			count++
			//if (count > 100)
			//	return
			var coords = layout[e.id]
			//svg.append("rect")
			//	.attr("x", coords[0]+"px")
			//	.attr("y", coords[1]+"px")
			//	.attr("width", 15+"px")
			//	.attr("height", 15+"px")
			//	.style({fill: "#f00", "fill-opacity": 0.2})

			svg.append("image")
				.attr("xlink:href", "data/bilder_100/"+e.id+".jpg")
				.attr("x", coords[0]+"px")
				.attr("y", coords[1]+"px")
				.attr("width", 15+"px")
				.attr("height", 15+"px")
				.on("click", function (d, i) {

				})
		})

		var domSvg = document.querySelector("#vis svg")
		var zoomFactor = 1.15 // macs tend to have finer grain mouse wheel ticks

		function zoom(event) {
			var wheelMovement = Math.max(-1, Math.min(1, (event.wheelDelta || -event.detail)))
			// ok, I cheated a bit ...
			d3.event = event
			var mouse = d3.mouse(domSvg)

			var xDelta = svgViewboxWidth * (wheelMovement < 0 ? zoomFactor-1 : -(1-1/zoomFactor))
			var yDelta = svgViewboxHeight * (wheelMovement < 0 ? zoomFactor-1 : -(1-1/zoomFactor))
			// zoom towards the current mouse position
			var relX = (mouse[0]-svgViewboxX)/svgViewboxWidth // in [0,1]
			var relY = (mouse[1]-svgViewboxY)/svgViewboxHeight // in [0,1]
			svgViewboxX -= xDelta * relX
			svgViewboxY -= yDelta * relY
			svgViewboxWidth += xDelta
			svgViewboxHeight += yDelta

			svg.transition()
				.duration(300)
				.attr("viewBox", svgViewboxX+" "+svgViewboxY+" "+svgViewboxWidth+" "+svgViewboxHeight)

			d3.event = null
		}

		// IE9, Chrome, Safari, Opera
		domSvg.addEventListener("mousewheel", zoom, false)
		// Firefox
		domSvg.addEventListener("DOMMouseScroll", zoom, false)


	}









	return vikus
})()
