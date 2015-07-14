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

MySet.prototype.getAll = function() {
	var self = this
	var result = []
	for (var e of self.entriesAndFrequency.entries())
		result.push(e[0])
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
