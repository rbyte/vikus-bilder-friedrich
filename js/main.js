
var vikus = (function(vikus = {}) {

	vikus.init = function() {
		//loadJson("data/spsg_NEU.json", withData)

	/*Könntest Du die Kategoriennamen auch einmal mit den "tags", also den Indexbezeichnungen, abgleichen? Im Fall von "Landschaften" und "Schnörkel" sind nur wenige GK Nummern aus dem Ausstellungskatalog in unserer Datenbank, aber die Kategorien aus dem Katalog "Landschaft" und "Schnörkel" sind als Indexbezeichnungen vergeben.

	 Außerdem: In Fällen wie "Literatur" -> "Literaturdarstellungen"+Kinder, das auch als "Mutter" im Index als Begriff vergeben ist, die Kinder hinzufügen zu der Kategorie unten.
	 */
		var fields = {
			cat: {path: "data/kategorien_aus_ausstellungskatalog.json"},
			spsg: {path: "data/spsg.json"}
		}
		if (true)
			loadJsonFilesAndSync(fields, withData)

		if (false)
			draw()
	}

	Object.values = function(obj) {
		return Object.keys(obj).map(function(key) {
			return obj[key]
		})
	}

	console.logToHTML = function(x) {
		document.body.appendChild(document.createTextNode(x))
		document.body.appendChild(document.createElement("BR"))
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

		// filter out those without a year
		Object.values(obj).forEach(function(e) {
			if (!e.jahr) {
				delete obj[e.id]
			}
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
			e.tags = []
			if (e.index) {
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
				var parsedZusammenhangIds = e.zusammenhang.split("; ")
				e.zusammenhang = []
				for (var ref of parsedZusammenhangIds) {
					if (ref && obj[ref])
						e.zusammenhang.push(obj[ref])
				}
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



		// 1810
		var kleinsteZeit = Object.values(obj).map(e => e.jahr).filter(e => e).reduce((a,b) => a < b ? a : b)
		// 1856
		var groesteZeit = Object.values(obj).map(e => e.jahr).filter(e => e).reduce((a,b) => a > b ? a : b)

		console.log(kleinsteZeit)
		console.log(groesteZeit)





		if (false) {
		var svgViewboxX = -250
		var svgViewboxY = -250
		var svgViewboxWidth = 500
		var svgViewboxHeight = 500

		var svg = d3.select("#vis")
			.append("svg")
			.attr("xmlns", "http://www.w3.org/2000/svg")
			.attr("viewBox", svgViewboxX+" "+svgViewboxY+" "+svgViewboxWidth+" "+svgViewboxHeight)
			var result = []
			var count = 0
			tagSet.getSortedArray().forEach(function([tag, frequency]) {
				var jahre = Object.values(obj).filter(e => e.tags.indexOf(tag) !== -1).map(e => e.jahr)
				var min = jahre.reduce((a,b) => a < b ? a : b, 2000)
				var max = jahre.reduce((a,b) => a > b ? a : b, 0)
				var sum = jahre.reduce((a,b) => a+b, 0)
				console.assert(min !== 2000 && max !== 0)

				if (jahre.length > 10) {
					result.push([tag, jahre.length, min, max, Math.floor((max-min)/46*100)+"%"])

					var scale = 1+Math.log(1+jahre.length/643)/Math.log(2)

					var text = svg.append("text")
						.attr("x", (sum/jahre.length-1810)*30-500)
						//.attr("y", -100+6*count++)
						.attr("y", 100)
						.attr("text-anchor", "middle")
						.attr("transform", "scale("+scale+")")
						.text(tag)


					//result.push(tag+":"+jahre.length)
					//document.body.appendChild(document.createTextNode(tag+": "+sum/jahre.length))
					//document.body.appendChild(document.createElement("BR"))
				}
			})
			//vikus.matrixToTable(result)
		}





		histogram(obj)



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








	function histogram(obj) {
		var svgViewboxX = -250
		var svgViewboxY = -250
		var svgViewboxWidth = 500
		var svgViewboxHeight = 500

		var svg = d3.select("#vis")
			.append("svg")
			.attr("xmlns", "http://www.w3.org/2000/svg")
			.attr("viewBox", svgViewboxX+" "+svgViewboxY+" "+svgViewboxWidth+" "+svgViewboxHeight)

		var g = svg.append("g").attr("transform", "translate(-500,-250) scale(10)")

		var text = svg.append("text")
			.attr("x", 220).attr("y", -230)
			.text("position")

		var histWidth = 100
		var histHeight = 50
		g.append("rect").attr({x: 0, y: 0, width: histWidth, height: histHeight})
			.style({fill: "#000", "fill-opacity": 0.05})

		svg.on("mousemove", function() {
			var mouse = d3.mouse(svg.node())
			text.text(Math.floor(mouse[0])+" x "+Math.floor(mouse[1]))
		})

		var startYear = 1810
		var endYear = 1856
		var numberOfBars = 46

		var sortedByYear = Object.values(obj).sort(function(a,b) {
			return a.jahr > b.jahr ? 1 : -1
		})

		var yearHistogram = new MySet()

		sortedByYear.forEach(function(e) {
			console.assert(e.jahr)
			yearHistogram.add(e.jahr)
		})

		// produktivste jahre:
		console.log(yearHistogram.getSorted())

		var currentYear = 1810
		var currentAmount = 0
		var numberOfInBarColumns = 4
		var columnWidthTotal = histWidth/numberOfBars
		var columnMargin = 0.8
		var columnWidth = columnWidthTotal*columnMargin

		var blockTotal = columnWidth/numberOfInBarColumns
		var blockMargin = 0.8
		var block = blockTotal*blockMargin

		sortedByYear.forEach(function(e) {
			var totalPerYear = yearHistogram.get(e.jahr)
			var totalPerInBarColumn = Math.ceil(totalPerYear/numberOfInBarColumns)
			if (e.jahr === currentYear) {
				currentAmount++
			} else {
				currentYear = e.jahr
				currentAmount = 0
			}

			var inBarColumnNo = Math.floor(currentAmount/totalPerInBarColumn)

			var x = (currentYear-startYear)/(endYear-startYear+1)*histWidth + inBarColumnNo*blockTotal
			var y = histHeight-(1+currentAmount-inBarColumnNo*totalPerInBarColumn) *blockTotal

			g.append("rect").attr({x: x, y: y, width: block, height: block})
				.style({fill: "#009", "fill-opacity": 0.3})
		})


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

	MySet.prototype.get = function(e) {
		var self = this
		return e ? self.entriesAndFrequency.get(e) : self.entriesAndFrequency
	}

	MySet.prototype.getAsArray = function() {
		var self = this
		var result = []
		for (var e of self.entriesAndFrequency.entries())
			result.push(e[0])
		return result
	}

	MySet.prototype.getSortedArray = function() {
		var self = this
		var result = []
		for (var e of self.entriesAndFrequency.entries())
			result.push(e)
		result.sort(function(e1, e2) { return e1[1] < e2[1] ? 1 : -1 })
		return result
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




	return vikus
})(vikus)
