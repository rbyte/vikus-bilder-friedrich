/*
 This is free software.
 License: GNU Affero General Public License 3
 Copyright (C) 2015 Matthias Graf
 matthias.graf <a> mgrf.de
*/

var vikus = (function(vikus = {}) {

	var domSvg
	var svg
	var svgContainer
	var svgWidth, svgHeight
	var defaultSvgViewboxHeight = 500
	var svgViewboxX = -defaultSvgViewboxHeight/2
	var svgViewboxY = -defaultSvgViewboxHeight/2
	var svgViewboxWidth = defaultSvgViewboxHeight
	var svgViewboxHeight = defaultSvgViewboxHeight
	var zoomFactor = 1.4 // macs tend to have finer grain mouse wheel ticks
	var zoomTransitionDuration = 150

	var obj
	var cat

	var histG
	var histBox = {x: 0, y: 0, width: 1000, height: 250}
	var histElemBaseFill = "#424242"
	var numberOfInBarColumns = 3
	var columnMargin = 0.8
	var blockMargin = 0.8

	var tagCloudG
	var tagCloudBox = {x: 0, y: 0, width: 1000, height: 220}

	var startYear = 1810
	var endYear = 1856

	var tags = {}

	vikus.init = function() {
		setupView()
		var fields = {
			cat: {path: "data/kategorien_aus_ausstellungskatalog.json"},
			spsg: {path: "data/spsg.json"}
		}
		loadJsonFilesAndSync(fields, withData)
	}

	function setupView() {
		svgContainer = d3.select("#vis")
		domSvg = document.querySelector("#vis svg")
		svg = d3.select("#vis svg")
		svg.attr("xmlns", "http://www.w3.org/2000/svg")
			.attr("viewBox", svgViewboxX+" "+svgViewboxY+" "+svgViewboxWidth+" "+svgViewboxHeight)

		window.onresize = function(event) { updateScreenElemsSize() }
		window.onresize()

		setupUIeventListeners()
	}

	function updateScreenElemsSize() {
		var bb = svgContainer.node().getBoundingClientRect()
		if (bb.width <= 0 || bb.height <= 0)
			return
		svgWidth = bb.width
		svgHeight = bb.height
		//svgContainer.style({height: svgHeight+"px"})
		updateViewbox()
	}


	function updateViewbox(transition) {
		console.assert(svgViewboxHeight > 0)
		console.assert(svgViewboxWidth > 0)
		console.assert(svgWidth > 0)
		console.assert(svgHeight > 0)

		// keep height stable and center (on startup to 0,0)
		// make viewbox aspect fit into the container aspect
		var svgViewboxWidthPrevious = svgViewboxWidth
		svgViewboxWidth = svgViewboxHeight * svgWidth/svgHeight
		svgViewboxX -= (svgViewboxWidth - svgViewboxWidthPrevious)/2
		var elem = !transition ? svg : svg.transition()
			.duration(zoomTransitionDuration)

		elem.attr("viewBox", svgViewboxX+" "+svgViewboxY+" "+svgViewboxWidth+" "+svgViewboxHeight)
		adaptivePictureLoad()
	}

	function adaptivePictureLoad() {
		// size can be: 100, 500, 1000, 2000, full
		var windowWidth = window.innerWidth
		var windowHeight = window.innerHeight

		if (obj)
			allValues(obj).forEach(function(e) {
				if (e.histogramRect) {
					var size = svgViewboxWidth < 100 ? 500 : 100
					var bb = e.histogramRect.node().getBoundingClientRect()
					//console.log(bb)
					var insideWindow = !(bb.right < 0 || bb.bottom < 0 || bb.left > windowWidth || bb.top > windowHeight)
					if (insideWindow) {
						e.histogramImage.attr("xlink:href", "data/bilder_"+size+"/"+e.id+".jpg")
						if (size === 500 || false) // debug
							e.histogramRect.style({fill: "green"})
					}
				}
			})
	}


	function withData(fields) {
		obj = fields.spsg.data
		cat = fields.cat.data

		var anzahlEintraege = Object.keys(obj).length

		var alleAttribute = obj[Object.keys(obj)[0]]

		var nichtImmerVorhandeneAttribute = new Set()

		var vorkommenNichtVorhandenerAttribute = 0
		allValues(obj).forEach(function(e) {
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

		Object.keys(obj).forEach(key => console.assert(key === obj[key].id))

		// filter out those without a year
		allValues(obj).forEach(e => {
			if (!e.jahr) {
				delete obj[e.id]
			}
		})


		allValues(obj).forEach(e => {
			console.assert(e.inventar_nr.match("GK II \\(12\\) "))
		})

		// given in 10^-4 meter (biggest object is < 50cm)
		var anzahlHB = 0
		allValues(obj).forEach(e => {
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
		allValues(obj).forEach(e => {
			if (e.material)
				materialSet.add(e.material)
		})
		console.log("materialSet")
		console.log(materialSet.getSorted())


		var thementextSet = new MySet()
		allValues(obj).forEach(e => {
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
				var result = allValues(obj).find(e => e.inventar_nr === inventarNr)
				if (result === undefined) {
					misses++
				}
			}
		})
		console.assert(misses === 0)

		var tagSet = new MySet()
		var countTagsSet = new MySet()
		allValues(obj).forEach(e => {
			e.tags = []
			if (e.index) {
				var z = e.index.split("; ")
				z.forEach(s => {
					var y = s.split(": ")
					y.forEach(ss => {
						tagSet.add(ss)
						e.tags.push(ss)
					})
				})
				countTagsSet.add(z.length)
			}
		})

		tagSet.getAll().forEach(e => tags[e] = {name: e})

		console.log("tagSet")
		console.log(tagSet.getSorted())
		console.log("countTagsSet")
		console.log(countTagsSet.getSorted())

		if (false)
			Object.keys(cat).forEach(key => {
				var catTagSet = new MySet()
				for (var inventarNr of cat[key]) {
					var result = allValues(obj).find(e => e.inventar_nr === inventarNr)
					for (var t of result.tags)
						catTagSet.add(t)
				}
				console.log("tags für: "+key)
				console.log(catTagSet.getSorted())
			})

		var countZusammenhang = 0
		allValues(obj).forEach(e => {
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


		var kleinsteZeit = allValues(obj).map(e => e.jahr).filter(e => e).reduce((a,b) => a < b ? a : b)
		var groesteZeit = allValues(obj).map(e => e.jahr).filter(e => e).reduce((a,b) => a > b ? a : b)
		console.assert(kleinsteZeit === startYear)
		console.assert(groesteZeit === endYear)

		var text = svg.append("text")
			.attr("x", svgViewboxX+svgViewboxWidth-100).attr("y", svgViewboxY+20)
			.text("position")

		svg.on("mousemove", () => {
			var mouse = d3.mouse(svg.node())
			text.text(Math.floor(mouse[0])+" x "+Math.floor(mouse[1]))
		})

		histogram()
		tagCloud()

		console.log("done.")
	}

	function loadJson(path, callback) {
		var xhr = new XMLHttpRequest()
		xhr.open("GET", path)
		xhr.onreadystatechange = () => {
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
			xhr.onreadystatechange = (obj => () => {
					if (obj.request.readyState === 4 && obj.request.status === 200) {
						console.log(obj.path)
						obj.data = JSON.parse(obj.request.responseText)
						countLoaded++
						if (countLoaded === countEntries)
							callback(fields)
					}
				}
			)(fields[key])
			xhr.send()
		}
	}



	function setupUIeventListeners() {
		function zoom(event) {
			var wheelMovement = Math.max(-1, Math.min(1, (event.wheelDelta || -event.detail)))
			// ok, I cheated a bit ...
			d3.event = event
			var mouse = d3.mouse(domSvg)

			var xDelta = svgViewboxWidth * (wheelMovement < 0 ? zoomFactor-1 : -(1-1/zoomFactor))
			var yDelta = svgViewboxHeight * (wheelMovement < 0 ? zoomFactor-1 : -(1-1/zoomFactor))

			// keep bottom line stable!
			//var bottom = svgViewboxY+svgViewboxHeight

			// zoom towards the current mouse position
			var relX = (mouse[0]-svgViewboxX)/svgViewboxWidth // in [0,1]
			var relY = (mouse[1]-svgViewboxY)/svgViewboxHeight // in [0,1]
			svgViewboxWidth += xDelta
			svgViewboxHeight += yDelta
			svgViewboxX -= xDelta * relX
			svgViewboxY -= yDelta * relY
			//svgViewboxY = bottom - svgViewboxHeight
			d3.event = null

			//numberOfInBarColumns +=wheelMovement
			//draw()

			updateViewbox(true/* with transition */)
		}

		// IE9, Chrome, Safari, Opera
		domSvg.addEventListener("mousewheel", zoom, false)
		// Firefox
		domSvg.addEventListener("DOMMouseScroll", zoom, false)

		svg.call(d3.behavior.drag()
			.on("drag", function (d) {
				svgViewboxX -= d3.event.dx*(svgViewboxWidth/svgWidth)
					// keep bottom line stable!
				svgViewboxY -= d3.event.dy*(svgViewboxHeight/svgHeight)
				updateViewbox()
			})
		)
	}


	function histogram() {
		var numberOfBars = 46
		var currentYear = 1810
		var currentAmount = 0

		if (!histG) {
			histG = svg.append("g").attr("transform", "translate(-500,-10)")
			histG.append("rect").attr(histBox)
				.style({fill: "#000", "fill-opacity": 0.05})
		}

		var sortedByYear = allValues(obj).sort((a,b) => a.jahr > b.jahr ? 1 : -1)
		var yearHistogram = new MySet()
		sortedByYear.forEach(e => {
			console.assert(e.jahr)
			yearHistogram.add(e.jahr)
		})

		var columnWidthTotal = histBox.width/numberOfBars
		var columnWidth = columnWidthTotal*columnMargin

		var blockTotal = columnWidth/numberOfInBarColumns
		var block = blockTotal*blockMargin

		sortedByYear.forEach(e => {
			var totalPerYear = yearHistogram.get(e.jahr)
			var totalPerInBarColumn = Math.ceil(totalPerYear/numberOfInBarColumns)
			if (e.jahr === currentYear) {
				currentAmount++
			} else {
				currentYear = e.jahr
				currentAmount = 0
			}

			var inBarColumnNo = Math.floor(currentAmount/totalPerInBarColumn)

			var x = (currentYear-startYear)/(endYear-startYear+1)*histBox.width + inBarColumnNo*blockTotal
			var y = histBox.height-(1+currentAmount-inBarColumnNo*totalPerInBarColumn) *blockTotal

			e.histogramRect = e.histogramRect ? e.histogramRect : histG.append("rect").style({fill: histElemBaseFill})
			e.histogramImage = e.histogramImage ? e.histogramImage : histG.append("image")
				.attr({"xlink:href": "data/bilder_100/"+e.id+".jpg", onclick: "document.location.href = 'http://bestandskataloge.spsg.de/FWIV/"+e.id+"';"})

			e.histogramRect
				.attr({x: x, y: y, width: blockTotal, height: blockTotal})
			e.histogramRect.attr({onclick: 'console.log(this.getBoundingClientRect())'})

			e.histogramImage.transition().duration(900)
				.attr({x: x, y: y, width: block, height: block})
		})
	}

	function tagCloud() {
		var result = []
		var count = 0
		var numberOfElemsThreshold = 40

		tagCloudG = tagCloudG ? tagCloudG : svg.append("g").attr("id", "tagCloud")
		tagCloudG.attr("transform", "translate(-500,-230)")

		tagCloudG.append("rect").attr(tagCloudBox)
			.style({fill: "#008", "fill-opacity": 0.07})

		allValues(tags).forEach(tag => {
			var jahre = allValues(obj).filter(e => e.tags.indexOf(tag.name) !== -1).map(e => e.jahr)
			var sum = jahre.reduce((a,b) => a+b, 0)
			var meanYear = sum/jahre.length
			var meanYearNormalised = (meanYear-startYear)/(endYear-startYear)
			tags[tag.name].jahre = jahre
			tags[tag.name].meanYearNormalised = meanYearNormalised
		})

		var filteredYears = allValues(tags)
			.filter(e => e.jahre.length > numberOfElemsThreshold)
			.map(e => e.meanYearNormalised)
		var minMeanYear = filteredYears.reduce((a,b) => a < b ? a : b, 2000)
		var maxMeanYear = filteredYears.reduce((a,b) => a > b ? a : b, 0)
		var meanMeanYear = filteredYears.reduce((a,b) => a+b, 0)/filteredYears.length
		console.log(minMeanYear+" .. "+maxMeanYear+" .. "+meanMeanYear)



		allValues(tags).forEach(function(tag) {
			var jahre = tag.jahre
			if (jahre.length > numberOfElemsThreshold) {
				var min = jahre.reduce((a,b) => a < b ? a : b, 2000)
				var max = jahre.reduce((a,b) => a > b ? a : b, 0)
				console.assert(min >= startYear && max <= endYear)
				var meanYearNormalised = tag.meanYearNormalised
				console.assert(0 <= meanYearNormalised && meanYearNormalised <= 1)

				var scaleIntoRange = x => (x-minMeanYear)/(maxMeanYear-minMeanYear)
				var yVal = scaleIntoRange(meanYearNormalised)
				var yValMean = scaleIntoRange(meanMeanYear)

				var myPow = (x,y) => x < 0 ? -Math.pow(Math.abs(x), 1/y) : Math.pow(x, y)
				//var strech = x => myPow((x-yValMean)/.5, 2)*.5+yValMean
				var strech = x => x
				yVal = strech(yVal)

				console.assert(!isNaN(yVal))
				console.assert(0 <= yVal && yVal <= 1, yVal)

				result.push([tag.name, jahre.length, min, max, Math.floor((max-min)/46*100)+"%"])

				var scale = 1+Math.log(1+jahre.length/643)/Math.log(2)

				var text = tagCloudG.append("text")
					.attr("x", yVal*1000)
					.attr("y", 4*count++)
					.attr("font-size", 10*scale)
					.attr("text-anchor", "middle")
					.text(tag.name)

				text.on("mouseover", (tagName => () => {
					allValues(obj).forEach(e => {
						if (e.tags.indexOf(tagName) !== -1)
							e.histogramRect.style({fill: "red"})
					})
				})(tag.name))

				text.on("mouseout", (tagName => () => {
					allValues(obj).forEach(e => {
						e.histogramRect.style({fill: histElemBaseFill})
					})
				})(tag.name))

				tags[tag.name].cloudText = text
			}
		})

		d3.select("body").on("keydown", () => {
			console.log(d3.event.keyCode)
			if (d3.event.keyCode === 82 /*r*/)
				reduceOverlap()
			if (d3.event.keyCode === 67 /*c*/)
				compact()
			if (d3.event.keyCode === 83 /*s*/)
				scaleIntoBox()
		})

		function reduceOverlap() {
			var margin = 0.2
			function addToAttr(elem, attr, change) {
				elem.attr(attr, new Number(elem.attr(attr))+change)
			}

			allValues(tags).forEach(function(tag) {
				var text = tag.cloudText
				if (!text)
					return
				// getBoundingClientRect() gets the DOMRect, getBBox() the SVGRect !
				var a = convertSVGCenteredTextRectToDOMRect(text.node().getBBox())

				allValues(tags).forEach(function(tagB) {
					if (tag !== tagB) {
						var textB = tagB.cloudText
						if (!textB)
							return
						var b = convertSVGCenteredTextRectToDOMRect(textB.node().getBBox())

						if (intersect(a, b)) {
							var overlapX =  a.x < b.x ? a.right - b.left : a.left - b.right
							var overlapY =  a.y < b.y ? a.bottom - b.top : a.top - b.bottom

							addToAttr(text, "x", -overlapX*(.5+margin))
							addToAttr(textB, "x", overlapX*(.5+margin))
							addToAttr(text, "y", -overlapY*(.5+margin))
							addToAttr(textB, "y", overlapY*(.5+margin))
						}
					}
				})
			})
		}

		function compact() {
			allValues(tags).forEach(function(tag) {
				var text = tag.cloudText
				text.attr("font-size", text.attr("font-size")*1.1)
			})
		}

		function scaleIntoBox() {
			var bbs = allValues(tags).filter(tag => tag.cloudText)
				.map(tag => convertSVGCenteredTextRectToDOMRect(tag.cloudText.node().getBBox()))
			var left = bbs.map(bb => bb.left).reduce((a,b) => a < b ? a : b)
			var right = bbs.map(bb => bb.right).reduce((a,b) => a > b ? a : b)
			var top = bbs.map(bb => bb.top).reduce((a,b) => a < b ? a : b)
			var bottom = bbs.map(bb => bb.bottom).reduce((a,b) => a > b ? a : b)

			allValues(tags).filter(tag => tag.cloudText).forEach(function(tag) {
				var x = tag.cloudText.attr("x")
				var y = tag.cloudText.attr("y")
				tag.cloudText
					.attr("x", ((x-left)/(right-left)-tagCloudBox.x)*tagCloudBox.width)
					.attr("y", ((y-top)/(bottom-top)-tagCloudBox.y)*tagCloudBox.height)
			})
		}

		for (var i=0; ++i<7; ) {
			reduceOverlap()
			scaleIntoBox()
		}

	}



	// global tools
	allValues = obj => Object.keys(obj).map(key => obj[key])

	console.logToHTML = function(x) {
		document.body.appendChild(document.createTextNode(x))
		document.body.appendChild(document.createElement("BR"))
	}

	function intersect(a, b) { // DOMRect
		return !(a.left > b.right
			|| a.right < b.left
			|| a.top > b.bottom
			|| a.bottom < b.top)
	}

	function intersectSVG(a, b) { // SVGRect
		return intersect(convertSVGRectToDOMRect(a), convertSVGRectToDOMRect(b))
	}

	function convertSVGRectToDOMRect(a) {
		return {
			x: a.x,
			y: a.y,
			width: a.width,
			height: a.height,
			left: a.x - a.width/2,
			right: a.x + a.width/2,
			top: a.y - a.height/2,
			bottom: a.y + a.height/2
		}
	}

	function convertSVGCenteredTextRectToDOMRect(a) {
		return {
			x: a.x,
			y: a.y,
			width: a.width,
			height: a.height,
			left: a.x,
			right: a.x + a.width,
			top: a.y,
			bottom: a.y + a.height
		}
	}

	return vikus
})(vikus)
