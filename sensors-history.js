function linesChart(element, width, height, _relTime, colorShift, displayLegend) {
	var data = [];
	var that = {};
	var margin;
	var h, w, x, y, yArray={},  xLegend, wLegend, yLegend, dyLegend;

	/** clear chart **/
	d3.select(element).selectAll("*").remove();

	margin = {
		top: 10, // 10
		right: 0, // 20
		bottom: 10, // 80
		left: 0, // 22
		legendWidth: width/2, // 250
		legendTopMargin: 0,
		dyLegend: 30
	};
	h = height - margin.top - margin.bottom;
	w = width - margin.left - margin.right;
	xLegend = width / 2 - margin.legendWidth - margin.right - margin.left;
	wLegend = margin.legendWidth;
	yLegend = margin.legendTopMargin;
	dyLegend = margin.dyLegend;

	var relTimeFormat = d3.time.format.multi([
		[
			'.%L',
			function (d) {
				return d.getUTCMilliseconds();
			}
		],
		[
			':%S',
			function (d) {
				return d.getUTCSeconds();
			}
		],
		[
			'%M:00',
			function (d) {
				return d.getUTCMinutes();
			}
		],
		[
			'%H ',
			function (d) {
				return d.getUTCHours();
			}
		],
		[
			'%x',
			function (d) {
				return true;
			}
		]
	]);
	var absTimeFormat = d3.time.format.multi([
		[
			'.%L',
			function (d) {
				return d.getMilliseconds();
			}
		],
		[
			':%S',
			function (d) {
				return d.getSeconds();
			}
		],
		[
			'%H:%M',
			function (d) {
				return d.getMinutes();
			}
		],
		[
			'%H:00',
			function (d) {
				return d.getHours();
			}
		],
		[
			'%d/%m',
			function (d) {
				return true;
			}
		]
	]);
	
	/* create svg. Should define dimensions too */
	var svg = d3.select(element).append('g').attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');
	// default attr for axis
	svg.append('g').attr('class', 'x axis').attr('transform', 'translate(0,' + h + ')');
	svg.append('g').attr('class', 'y axis');
	// create legend box
	svg.append('g').attr('class', 'legend').attr('transform', 'translate(' + xLegend + ', ' + yLegend + ')');

	/** COLOR MANAGEMENT **/
	/* color definition - 10 categories */
	var color = d3.scale.category10();
	var colorTab = color;
	var d3Color10Items=[
		d3.rgb("#1f77b4"),
		d3.rgb("#ff7f0e"),
		d3.rgb("#2ca02c"),
		d3.rgb("#d62728"),
		d3.rgb("#9467bd"),
		d3.rgb("#8c564b"),
		d3.rgb("#e377c2"),
		d3.rgb("#7f7f7f"),
		d3.rgb("#bcbd22"),
		d3.rgb("#17becf")
	];
	if(colorShift)
		colorTab = d3Color10Items.concat(d3Color10Items.splice(0,colorShift));
	
	/* default graphical binding for chart axis */
	// x = d3.scale.linear().range([0, w]);
	if (that.relTime) {
		x = d3.time.scale.utc().range([
			0,
			w
		]);
	} else
		/* display scale UTC */
	{
		x = d3.time.scale().range([
			0,
			w
		]);
	}
	//~ /* fonction pour parsing des date - choix format d'affichage des dates */
	/* var timeFormat = d3.time.format("%H:%M:%S"); */
	/* line generator */
	that.line = d3.svg.line().x(function (d) {
		return x(d.t);
	}).interpolate('basis');
	
	/** render display */
	that.render = function (model, trange) {
		if (!model)
			return;
		//~ console.log(JSON.stringify(model));
		/* define association between keys and colors */
		color.domain(d3.keys(model).filter(function (name) {
			return name !== 'time';
		}));


		var sensors = d3.keys(model).filter(function (name) {
			return name !== 'time';
		});
		/* renvoie nom, values */
		var sensorData = sensors.map(function (name, index) {
			return {
				name: name,
				label: model[name].label,
				unit: model[name].unit,
				trange: trange,
				color: colorTab[index],
				//d3.extent(model[name].time),
				values: model[name].vals.map(function (d, i) {
					return {
						t: model[name].time[i],
						val: d
					};
				})
			};
		});
		/* [OPTION] reversed because we want to display from present to past */
		if (!trange)
			console.log('ERROR - TRANGE UNDEFINED');
		if (false) {
			x.domain(trange.reverse());
			console.log('reverse');
		} else {
			x.domain(trange);
		}
		//console.log("notReverse");
		/** extract scale for each data */
		for (var i in model) {
			if (i != 'time') {
				yArray[i] = d3.scale.linear().range([
					h,
					0
				]).domain(model[i].range);
			}
		}
		xAxis = d3.svg.axis().scale(x).ticks(6).orient('bottom');
		/* set specific format for rel or abs time */
		if (this.relTime) {
			xAxis.tickFormat(relTimeFormat);
		} else {
			xAxis.tickFormat(absTimeFormat);
		}
		this.updateLegend(sensorData);
		this.updateLines(sensorData);
		this.updateAxis();
	};
	that.updateLegend = function (data) {
		var that = this;
		var sensorLegend = svg.select('.legend').selectAll('.sensorLegend').data(data);
		sensorLegend.exit().remove();
		var gSensorLegend = sensorLegend.enter().append('g').attr('class', 'sensorLegend');
		gSensorLegend.append('text').attr('class', 'sensorName').attr('dy', '.35em').style('fill', function (d) {
			return d.color;
		});
		gSensorLegend.append('text').attr('class', 'sensorValue').attr('dy', '.35em').style('fill', function (d) {
			return d.color;
		});
		svg.selectAll('.sensorLegend').select('.sensorName').datum(function (d) {
			return {
				name: d.name,
				label: d.label
			};
		}).attr('transform', function (d, i) {
			return 'translate(' + 0 + ',' + i * dyLegend + ')';
		}).text(function (d) {
			return d.label;
		});
		/* text */
		svg.selectAll('.sensorLegend').select('.sensorValue').datum(function (d) {
			return {
				name: d.name,
				unit: d.unit,
				value: d.values[d.values.length - 1]
			};
		}).attr('transform', function (d, i) {
			return 'translate(' + wLegend + ',' + i * dyLegend + ')';
		}).style('text-anchor', 'end').text(function (d) {
			return typeof d.value.val != 'undefined' ? d.value.val.toFixed(1) + ' ' + d.unit : '';
		});
	};
	/* text */
	that.updateLines = function (data) {
		var that = this;
		var sensorData = svg.selectAll('.sensorData').data(data);
		/* join new data cities to previous one */
		/* Update line and text for preexisting elements */
		sensorData.select('.line').attr('d', function (d) {
			that.line.y(function (dy) {
				return yArray[d.name](dy.val);
			});
			/* update scale */
			return that.line(d.values);
		});
		//~ sensorData.select(".text")
		//~ .datum(function(d) { return {name: d.name, value: d.values[d.values.length-1]}; })
		//~ .attr("transform", function(d) { return "translate(" + x(d.value.t) + "," + yArray[d.name](d.value.val) + ")"; })
		//~ .text(function(d) {
		//~ return d.name+" - "+ d.value.val.toFixed(1); }); /* text */
		sensorData.exit().remove();
		sensorData = sensorData.enter().append('g').attr('class', 'sensorData');
		/* and define class 'sensorData' */
		/* add line and text */
		sensorData.append('path').attr('class', 'line').attr('d', function (d) {
			that.line.y(function (dy) {
				return yArray[d.name](dy.val);
			});
			/* update scale */
			return that.line(d.values);
		}).style('stroke', function (d) {
			return d.color;
		}).style('fill', 'none');
	};
	/* define color according to colormap (10) */
	//~ sensorData.append("text")
	//~ .datum(function(d) { return {name: d.name, value: d.values[d.values.length-1]}; })	/* define how to get data (d in transform function) */
	//~ .attr("transform", function(d) { return "translate(" + x(d.value.t) + "," + yArray[d.name](d.value.val) + ")"; }) /* x and y are wrapper to compute coordinates in frame according to values */
	//~ .attr("class", "text")
	//~ .attr("x", 5) /* position and dim of text area */
	//~ .attr("dy", ".35em")
	//~ .style("fill", function(d) { return color(d.name); })
	//~ .text(function(d) {
	//~ return d.name+" - "+ d.value.val.toFixed(1); }); /* text */
	that.updateAxis = function () {
		svg.selectAll('g.x.axis').call(xAxis).selectAll('text').style('text-anchor', 'end').attr('dx', '-.8em').attr('dy', '.15em').attr('transform', function (d) {
			return 'rotate(-65)';
		});
	};
	that.clean = function () {
		svg.selectAll('*').remove();
	};
	return that;
};

Polymer({
	is: 'sensors-history',
	properties: {
		operators: { notify: true },
		period: { notify: true },
		relTime: { notify: true },
		sampling: { notify: true },
		selector: {
			notify: true,
			observer: 'selectorChanged'
		},
		sensors: { notify: true },
		timeBeg: { notify: true },
		timeEnd: { notify: true },
		timeRange: { notify: true },
		height: {
			type: Number,
			value: 480,
			notify: true
		},
		width: {
			type: Number,
			value: 640,
			notify: true
		},
		color: {
			type: Number,
			value: 0,
			notify: true
		}
	},
	attached: function() {
		this.async(function() {
			// access sibling or parent elements here
			var that = this;

			// svg's viewBox
			var viewBoxHeight = 0, viewBoxWidth = 0;
			var org = [
				0,
				0
			];
			
			// image's real origin in image tag of svg
			// svg's client (viewport)
			console.log("dim : "+that.$.linechart.clientHeight+" "+that.$.linechart.clientWidth);
			that.width = that.$.linechart.clientWidth;
			that.height = that.$.linechart.clientHeight;
			
			// fit viewBow to svg
			d3.select(that.$.linechart).attr('viewBox', '0 0 ' + that.width + ' ' + that.height).attr('preserveAspectRatio', 'xMinYMin meet');

			/* re-create/init d3 chart */
			that.chart = linesChart(that.$.linechart, that.width, that.height, that.relTime, that.color);
			
		},1);
	},
	ready: function () {
		this.period = this.period || 10000;
		//10 s
		this.selector = this.selector || null;
		// this.sensors = (this.sensors ? JSON.parse(this.sensors) : null);
		if (typeof this.place === 'string')
			this.place = JSON.parse(this.place);
		// RQ: convert into object here ? Is it possible to exchange data directly after init by JSON ?
		this.robot = this.robot || null;
		this.timeBeg = new Date(this.timeBeg).getTime() || null;
		this.timeEnd = new Date(this.timeEnd).getTime() || null;
		this.timeRange = this.timeRange || null;
		this.sampling = this.sampling || null;
		this.operator = this.operators || 'last';
		this.time = {
			beg: this.timeBeg,
			end: this.timeEnd,
			range: this.timeRange
		};
		this.relTime = this.relTime || false;
		//console.log("xRev: "+this.relTime);

		/* create/init d3 chart */
		this.chart = linesChart(this.$.linechart, this.width, this.height, this.relTime, this.color);

		// support for resize event (due to rotation ...)
		var that = this;
		window.addEventListener('resize', function () {
			// re-init svg
			that.attached();
		});
		
		this.$.linechart.addEventListener("load", function() {
			console.log("dim : "+that.$.linechart.clientHeight+" "+that.$.linechart.clientWidth);
		});
	},
	selectorChanged: function () {
		// autorefresh?
		if (this.period != null) {
			var that = this;
			if (this.interval) {
				clearInterval(this.interval);
			}
			this.interval = setInterval(function () {
				that.updateChart(null);
			}, this.period);
		}
	},
	/**
	 *		Update chart
	 */
	updateChart: function () {
		var sensors = this.sensors.split(',');
		if (this.selector) {
			var that = this;
			//console.log("time : "+JSON.stringify(this.time));
			/* request for data from ieq service */
			var dataConfig = {
				sampling: this.sampling,
				operator: this.operator,
				criteria: {
					time: this.time,
					place: this.place,
					robot: JSON.parse(this.robot)
				},
				sensors: sensors
			};
			//['Temperature','Humidity','CO2','VOCt','Fine Dust','Ozone']
			//console.log("Linechart : "+JSON.stringify(dataConfig));
			d1(this.selector).IEQ().updateData(function (model) {
				//console.log(model);
				if (model) {
					// bug in Ieq.js, when multiple IEQ instances request db, this.sendModel will be corrupted, might contains more or less sensors data than requested
					// so we do the filter in this code till this bug is fixed
					for (var sensor in model) {
						if (!~sensors.indexOf(sensor)) {
							delete model[sensor];
						}
					}
					var dispModel = {};
					for (m in model) {
						dispModel[m] = {};
						if (m !== 'placeId' && m !== 'robotId') {
							if (that.relTime) {
								/** extract relative time */
								dispModel[m].time = model[m].time.map(function (t, i) {
									return that.time.end - t;
								});
							} else {
								dispModel[m].time = model[m].time;
							}
							dispModel[m].vals = model[m].data;
							dispModel[m].range = model[m].range;
							dispModel[m].timeRange = model[m].timeRange;
							dispModel[m].unit = model[m].unit;
							dispModel[m].label = model[m].label;
						}
					}
					var tRange = Object.keys(dispModel).reduce(function (tRange, k) {
						if (tRange) {
							return [
								Math.min(dispModel[k].timeRange[0], tRange[0]),
								Math.max(dispModel[k].timeRange[1], tRange[1])
							];
						} else
							return dispModel[k].timeRange;
					}, null);
					if (that.chart != null) {
						that.chart.render(dispModel, tRange);
					}
				}
			}, dataConfig);
		}
	},
	_computeViewBox: function (height, width) {
		return '0 0 ' + width + ' ' + height;
	},
	_computeStyle: function (height, width) {
		return "width: "+width+"px; height: " + height+"px;";
	}
});

