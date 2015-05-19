
var vikus = (function() {
	var vikus = {}

	vikus.init = function() {
		loadJson("data/spsg.json", withData)

	}

	Object.values = obj => Object.keys(obj).map(key => obj[key])

	function withData(obj) {
		var anzahlEintraege = Object.keys(obj).length

		var alleAttribute = obj[Object.keys(obj)[0]]

		var nichtImmerVorhandeneAttribute = new Set()

		var vorkommenNichtVorhandenerAttribute = 0
		Object.values(obj).forEach(e => {
			Object.keys(alleAttribute).forEach(x => {
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

		Object.keys(obj).forEach(key => {
			console.assert(key === obj[key].id)
		})

		Object.values(obj).forEach(e => {
			console.assert(e.inventar_nr.match("GK II \\(12\\) "))
		})

		var anzahlHB = 0
		Object.values(obj).forEach(e => {
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
		console.log("anzahl nicht gefundener: "+anzahlHB)

		var materialSet = new MySet()
		Object.values(obj).forEach(e => {
			if (e.material)
				materialSet.add(e.material)
		})
		console.log("materialSet")
		console.log(materialSet.getSorted())


		var thementextSet = new MySet()
		Object.values(obj).forEach(e => {
			if (e.thementext)
				thementextSet.add(e.thementext)
		})
		console.log("thementextSet")
		console.log(thementextSet.getSorted())


		var tagSet = new MySet()
		var countTagsSet = new MySet()
		Object.values(obj).forEach(e => {
			if (e.bestandskatalog) {
				var z = e.bestandskatalog.split(/, ?/)
				z.forEach(s => {
					tagSet.add(s)
				})
				countTagsSet.add(z.length)
			}
		})
		console.log("tagSet")
		console.log(tagSet.getSorted())
		console.log("countTagsSet")
		console.log(countTagsSet.getSorted())

		if (false)
			Object.values(obj).forEach(e => {
				var url = "data/bilder_100/"+e.id+".jpg"
				var img = new Image()
				document.body.appendChild(img)
				img.onerror = (() => {
					console.assert(false)
				})
				img.src = url
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



	function MySet() {
		var self = this
		self.entriesAndFrequency = {}
	}

	MySet.prototype.add = function(e) {
		var self = this
		if (typeof e !== "string")
			e = e.toString()
		if (Object.keys(self.entriesAndFrequency).indexOf(e) !== -1) {
			self.entriesAndFrequency[e]++
		} else {
			self.entriesAndFrequency[e] = 1
		}
	}

	MySet.prototype.get = function() {
		var self = this
		return self.entriesAndFrequency
	}

	MySet.prototype.getSorted = function() {
		var self = this
		var o = self.entriesAndFrequency
		var result = Object.keys(o).map(key => [key, o[key]]).sort(([k1, v1], [k2, v2]) => v1 < v2)
		return result.map(([key, entry]) => key+": "+entry)
	}




	return vikus
})()
