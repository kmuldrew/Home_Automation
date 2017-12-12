def weather_day():
	from urllib2 import urlopen
	import xml.etree.ElementTree as etree

	# get Environment Canada info for Calgary
	url = 'http://dd.weatheroffice.ec.gc.ca/citypage_weather/xml/AB/s0000047_e.xml'
	u = urlopen(url)
	tree = etree.parse(u)
	root = tree.getroot()
	weather_data = []
	windchill = 50
	for child in root:
		if child.tag=='currentConditions':
			root2 = child
	for child in root2.iter():
		if child.tag=='dateTime':
			day=child[6]
			#weather_data.append(child[6].text)
	for child in root2:
		if child.tag=='condition':
			condition=child.text
			weather_data.append(condition)
		if child.tag=='temperature':
			temperature = child.text
			weather_data.append(temperature)
		if child.tag=='windChill':
			windchill=child.text
			weather_data.append(windchill)
		if child.tag=='relativeHumidity':
			humidity=child.text
			weather_data.append(humidity)
		if child.tag=='wind':
			root3=child
			for child in root3.iter():
				if child.tag=='speed':
					windspeed=child.text
					weather_data.append(child.text)
				#if child.tag=='gust':
					#windgust=child.text
					#if windgust == None:
						#windgust = windspeed
					#weather_data.append(windgust)
				if child.tag=='direction':
					winddir = child.text
					weather_data.append(child.text)
				if child.tag=='bearing':
					windbearing=child.text
					weather_data.append(child.text)

	for child in root:
		if child.tag=='forecastGroup':
			root2=child
	norms=[]
	temps=[]
	days=[]
	cond=[]
	for child in root2.iter():
		if child.tag=='regionalNormals':
			root3=child
			for child in root3.iter():
				if child.tag=='temperature':
					norms.append(child.text)
		if child.tag=='forecast':
			root3 = child
			for child in root3.iter():
				if child.tag=='period':
					days.append(child.text)
				if child.tag=='temperature':
					temps.append(child.text)
				if child.tag=='cloudPrecip':
					root3=child
					for child in root3.iter():
						if child.tag=='textSummary':
							cond.append(child.text)
	sunhours = []
	sunminutes = []
	for child in root:
		if child.tag=='riseSet':
			root2=child
			for child in root2:
				if child.tag=='dateTime':
					root3=child
					for child in root3:
						if child.tag=='hour':
							sunhours.append(child.text)
						if child.tag=='minute':
							sunminutes.append(child.text)
	weather_data.append(sunhours[1])
	weather_data.append(sunminutes[1])
	weather_data.append(sunhours[3])
	weather_data.append(sunminutes[3])
	minmax=[]
	for child in root:
		if child.tag=='almanac':
			root2 = child
			for child in root2:
				if child.tag=='temperature':
					minmax.append(child.text)
	weather_data.append(minmax[0])
	weather_data.append(minmax[1])
	weather_data.append(minmax[2])
	weather_data.append(minmax[3])
	if (days[0].find('night') >= 0):
		weather_data.append(days[0])
		weather_data.append(temperature)
		weather_data.append(temps[0])
		weather_data.append(cond[0])
		ofs = -1
	else:
		weather_data.append(days[0])
		weather_data.append(temps[0])
		weather_data.append(temps[0+1])
		weather_data.append(cond[0])
		ofs = 0
	for i in range(1,4):
		weather_data.append(days[(i)*2+ofs])
		weather_data.append(temps[(i)*2+ofs])
		weather_data.append(temps[(i)*2+ofs+1])
		weather_data.append(cond[(i)*2+ofs])
	if windchill == 50:
		weather_data.append(-500)
	return(weather_data)

def forecast_day():
	import requests
	from bs4 import BeautifulSoup
	page = requests.get("http://weather.gc.ca/forecast/hourly/ab-52_metric_e.html")
	soup = BeautifulSoup(page.content, 'html.parser')
	twentyfour_hour = soup.find(class_="table-responsive")
	hours = twentyfour_hour.find_all(headers="header1")
	temperatures = twentyfour_hour.find_all(headers="header2")
	clouds = twentyfour_hour.find_all(headers="header3")
	precips = twentyfour_hour.find_all(headers="header4")
	winds = twentyfour_hour.find_all(headers="header5")
	windchills = twentyfour_hour.find_all(headers="header7")
	one_day = []
	one_day.append(hours)
	one_day.append(temperatures)
	one_day.append(clouds)
	one_day.append(precips)
	one_day.append(winds)
	one_day.append(windchills)
	return(one_day)
