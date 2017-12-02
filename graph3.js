  
$(document).ready(function() {
	$(chart_id).highcharts({
		chart: chart,
		title: title,
		xAxis: xAxis,
		//yAxis: yAxis,
        	yAxis: [{ // Primary yAxis
            		labels: {
                		format: '{value} %'
                	},
            		title: {
                		text: 'Humidity'
			},
			min: 0,
			max: 100,
		}, { // Secondary yAxis
            		labels: {
                		format: '{value} kPa'
                	},
            		title: {
                		text: 'Pressure'
			},
			min: 99,
			max: 103,
			opposite: true
		}],
        	legend: {
            		layout: 'vertical',
            		align: 'left',
            		x: 65,
            		verticalAlign: 'bottom',
            		y: -50,
            		floating: true,
            		backgroundColor: ('rgba(255,255,255,0.2)')
        	},
		colors: colors,
		credits: credits,
		series: series
	});
});
