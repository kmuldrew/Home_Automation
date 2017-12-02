  
$(document).ready(function() {
	$(chart_id).highcharts({
		chart: chart,
		title: title,
		xAxis: xAxis,
		//yAxis: yAxis,
        	yAxis: [{ // Primary yAxis
			min: 0,
            		labels: {
                		format: '{value} kWh'
                	},
            		title: {
                		text: 'Energy Consumption'
			}
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
		plotOptions: {
			series: {
				pointWidth: 5
			}
		},
		colors: colors,
		credits: credits,
		series: series
	});
});
