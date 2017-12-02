  
$(document).ready(function() {
	$(chart_id).highcharts({
		chart: chart,
		title: title,
		xAxis: xAxis,
		//yAxis: yAxis,
        	yAxis: [{ // Primary yAxis
            		labels: {
                		format: '{value}W'
                	},
            		title: {
                		text: 'Power use'
			},
		}, { // Secondary yAxis
            		labels: {
                		format: '{value} Wh'
                	},
            		title: {
                		text: 'Energy Use'
			},
			opposite: true
		}],
        	legend: {
            		layout: 'vertical',
            		align: 'left',
            		x: 65,
            		verticalAlign: 'bottom',
            		y: -250,
            		floating: true,
            		backgroundColor: ('rgba(255,255,255,0.2)')
        	},
		colors: colors,
		credits: credits,
		series: series
	});
});
