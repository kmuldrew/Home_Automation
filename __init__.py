from flask import Flask, render_template, url_for
import pandas as pd
import numpy as np
from influxdb import DataFrameClient
from datetime import datetime
import time
import numbers
client = DataFrameClient('localhost',8086,'','','MulHomeAutomation')

def fetchData(d_index):
	dom = str(datetime.today().day)
	if d_index == 0:
		result = client.query("select * from temperature where location='basement' and time > now() - 12h limit 300")
	elif d_index == 1:
		result = client.query("select * from temperature where location='mainfloor' and time > now() - 12h limit 600")
	elif d_index == 2:
		result = client.query("select * from temperature where location='kenroom' and time > now() - 12h limit 300")
	elif d_index == 3:
		result = client.query("select * from temperature where location='garage' and time > now() - 12h limit 600")
	elif d_index == 4:
		result = client.query("select * from temperature where location='outdoor' and time > now() - 12h limit 300")
	elif d_index == 5:
		result = client.query("select * from humidity where location='basement' and time > now() - 12h limit 300")
	elif d_index == 6:
		result = client.query("select * from pressure where location='basement' and time > now() - 12h limit 400")
	elif d_index == 7:
		result = client.query("select * from power where location='house' and time > now() - 12h limit 4500")
	elif d_index == 8:
		result = client.query("select * from power where location='house' and time > now() - 12h limit 4500")#.cumsum('power')
		#result['power']['values'] = result['power']['values'].cumsum()
	elif d_index == 9:
		result = client.query("select * from energy where location='house' and time > now() - 24h limit 50")
	elif d_index == 10:
		result = client.query("select * from energy where location='house' and time > now() - 7d limit 500")
	else: #d_index == 11:
		result = client.query("select * from energy where location='house' and time > now() - "+dom+"d limit 1500")
	if d_index == 5:
		db = result['humidity']
	elif d_index == 6:
		db = result['pressure']
	elif d_index == 7:
		db = result['power']
	elif d_index == 8:
		db = result['power']#.cumsum()
	elif d_index == 9:
		db = result['energy']
	elif d_index == 10:
		db = result['energy']
	elif d_index == 11:
		db = result['energy']
	else: 
		db = result['temperature']
	db.reset_index(level=0, inplace=True)
	db = db.rename(columns = {'index':'date'})
	x1 = db['date']
	if d_index == 8:
		y1 = db['value'].cumsum() #integrate power to get energy
		y1 = y1 / 360
	elif (d_index == 9) or (d_index == 10) or (d_index == 11):
		y1 = db['value']
		y1 = y1 / 2000
	else:
		y1 = db['value']
	dataSet = []
	if time.localtime().tm_isdst: # if daylight saving time then
		timePoints = pd.DatetimeIndex(x1).astype(np.int64) // 10**6 - 21600000 #convert pd.timestamp to unix time
	else:
		timePoints = pd.DatetimeIndex(x1).astype(np.int64) // 10**6 - 25200000 #convert pd.timestamp to unix time
	dataSet = list(zip(timePoints,y1)) # merge into list of tuples
	dataSet = [list(elem) for elem in dataSet] # convert tuples to lists
	return(dataSet)

def fetchT(d_index):
	noData = 0
	if d_index == 0:
		result = client.query("select * from temperature where location='basement' and time > now() - 10m limit 10")
	elif d_index == 1:
		result = client.query("select * from temperature where location='mainfloor' and time > now() - 10m limit 10")
	elif d_index == 2:
		result = client.query("select * from temperature where location='kenroom' and time > now() - 10m limit 10")
	elif d_index == 3:
		result = client.query("select * from temperature where location='garage' and time > now() - 10m limit 10")
	elif d_index == 4:
		result = client.query("select * from temperature where location='outdoor' and time > now() - 10m limit 10")
	elif d_index == 5:
		result = client.query("select * from humidity where location='basement' and time > now() - 10m limit 10")
	elif d_index == 6:
		result = client.query("select * from pressure where location='basement' and time > now() - 10m limit 10")
	else: #d_index == 7:
		result = client.query("select * from power where location='house' and time > now() - 5m limit 50")
	if d_index == 5:
		try:
			db = result['humidity']
		except KeyError:
			noData = 1
	elif d_index == 6:
		try:
			db = result['pressure']
		except KeyError:
			noData = 1
	elif d_index == 7:
		try:
			db = result['power']
		except KeyError:
			noData = 1
	else: 
        	try:
            		db = result['temperature']
        	except KeyError:
            		noData = 1
    	if noData == 1:
        	return(0)  # if no data in last 5 minutes, return 0
    	else:
		db.reset_index(level=0, inplace=True)
		db = db.rename(columns = {'index':'date'})
		y1 = db['value']
		return(y1[len(y1)-1])

def fetchPtrend():
	result = client.query("select * from pressure where location='basement' and time > now() - 1h limit 30")
	db = result['pressure']
	db.reset_index(level=0, inplace=True)
	db = db.rename(columns = {'index':'date'})
	y1 = db['value']
	avg = y1.mean() # get average pressure over last hour
	return((y1[len(y1)-1]) - avg) # current pressure - average over last hour

def fetchPfactor():
	noData = 0
	result = client.query("select * from powerfactor where location='house' and time > now() - 30m limit 200")
	try:
		db = result['powerfactor']
	except KeyError:
		noData = 1
	if noData == 1:
		return(0)
	else:
		db.reset_index(level=0, inplace=True)
		db = db.rename(columns = {'index':'date'})
		y1 = db['value']
		avg = y1.mean() # get average power factor over last half hour
		return(avg) # average power factor over last half hour

app = Flask(__name__)

@app.route('/')
def homepage():
	try:
		title = "Home Automation"
		para = ["Sensors only at this point","Actuators to be installed at a later date"]
		pageType = 'mainpage'
		houseT = fetchT(1)
		garageT = fetchT(3)
		outdoorT = fetchT(4)
		humid = fetchT(5)
		press = fetchT(6)
		Ptrend = fetchPtrend()
		powerkW = fetchT(7) / 1000
		powerfactor = fetchPfactor()
		dataSet = fetchData(9) #energy
		dailyE = 0
		for i in range(0,len(dataSet)):
			dailyE += dataSet[i][1] # add up energy use for past 24h

		dataSet = fetchData(10) #energy
		weeklyE = 0
		for i in range(0,len(dataSet)):
			weeklyE += dataSet[i][1] # add up energy use for past 7d

		dataSet = fetchData(11) #energy ***throws error 'energy' when no data
		monthlyE = 0
		for i in range(0,len(dataSet)):
			monthlyE += dataSet[i][1] # add up energy use for past month

		#get scraped weather data from weather.dat
		Tempdata = []
		cur_data = []
		cur_cond = []
		filename = "/var/www/FlaskApp/FlaskApp/weather.dat"
		with open(filename, "r") as infile:
        		filedata = infile.read()
		infile.close()
		file_list = filedata.splitlines()
		Tempdata_len = int(file_list[0])
		for i in range(1,Tempdata_len+1):
        		Tempdata.append(int(file_list[i]))
		cur_T = float(file_list[i+1])
		cur_data_len = int(file_list[i+2])
		for i in range(i+3,cur_data_len+i+3):
        		cur_data.append(int(file_list[i]))
		cur_cond.append(file_list[-3])
		hour = int(file_list[-2])
		weather_timestamp = int(file_list[-1])
		now = int(time.time())
		if (now - weather_timestamp > 600): #if file data is old, do a new scrape
			from weather import weather_day
			from weather import forecast_day
			w_data = weather_day()
			cur_cond = []
			cur_cond.append(w_data[0])
			cur_T = float(w_data[1])
			cur_data = []
			if w_data[-1] == -500:
				ind = [2,3,5,6,7,8,9,15,16,19,20,23,24,27,28,1] 
			else:
				ind = [3,4,6,7,8,9,10,16,17,20,21,24,25,28,29,2]
			for i in ind:
				cur_data.append(int(float(w_data[i])))
			day_data = forecast_day()
			hour = int(day_data[0][0].text.split(':')[0])
			Tempdata = []
			for i in range(0,24):
				T = int(day_data[1][i].text)
				Tempdata.append(T)
			#save new weather data to file
			file = open(filename, "w")
			file.write("%d\n" % len(Tempdata))
			for item in Tempdata:
        			file.write("%d\n" % item)
			file.write("%.1f\n" % cur_T)
			file.write("%d\n" % len(cur_data))
			for item in cur_data:
        			file.write("%d\n" % item)
			file.write(cur_cond[0]+"\n")
			file.write("%d\n" % hour)
			file.write("%d\n" % now)
			file.close()

        	return render_template("index.html",houseT=houseT, garageT=garageT, outdoorT=outdoorT, humid=humid, press=press, Ptrend=Ptrend, powerkW=powerkW, powerfactor=powerfactor, dailyE=dailyE, weeklyE=weeklyE, monthlyE=monthlyE, hour=hour, Tempdata=Tempdata, cur_T=cur_T, cur_data=cur_data, cur_cond=cur_cond, pageType=pageType, title=title, para=para)
	except Exception, e:
		return str(e)


@app.route('/about/')
def aboutpage():
	try:
		title = "About Sensors"
		para = ["Flask serving of home sensors"]

		pageType = 'about'
        	return render_template("test.html",title=title, para=para, pageType=pageType)
	except Exception, e:
		return str(e)

@app.route('/graph/')
def index(chartID = 'chart_ID', chart_type = 'line', chart_height = 350):
	pageType = 'graph'
	dataSet = fetchData(1) #mainfloor T
	curT = dataSet[len(dataSet)-1][1]
	chart = {"renderTo": chartID, "type": chart_type, "height": chart_height,}
	series = [{"name": '2nd Floor', "data": fetchData(2)},{"name": 'Main Floor', "data": fetchData(1)},{"name": 'Basement', "data": fetchData(0)}]
	graphtitle = {"text": 'House Temperature'}
	xAxis = {"type":"datetime", "title": {"text": 'Time'}}
	yAxis = {"title": {"text": 'Temperature (C)'}}
	return render_template('index.html', curT = curT, pageType = pageType, chartID=chartID, chart=chart, series=series, graphtitle=graphtitle, xAxis=xAxis, yAxis=yAxis)

@app.route('/graph2/')
def index2(chartID = 'chart_ID', chart_type = 'line', chart_height = 350):
	pageType = 'graph2'
	dataSet = fetchData(4) #outdoor T
	curT = dataSet[len(dataSet)-1][1]
	chart = {"renderTo": chartID, "type": chart_type, "height": chart_height,}
	series = [{"name": 'Garage', "data": fetchData(3)},{"name": 'Outdoor', "data": dataSet}]
	graphtitle = {"text": 'Outdoor Temperature'}
	xAxis = {"type":"datetime", "title": {"text": 'Time'}}
	yAxis = {"title": {"text": 'Temperature (C)'}}
	return render_template('index2.html', curT = curT, pageType = pageType, chartID=chartID, chart=chart, series=series, graphtitle=graphtitle, xAxis=xAxis, yAxis=yAxis)

@app.route('/graph3/')
def index3(chartID = 'chart_ID', chart_type = 'line', chart_height = 350):
	pageType = 'graph3'
	dataSet = fetchData(5) #humidity
	curH = dataSet[len(dataSet)-1][1]
	dataSet = fetchData(6) #pressure
	curP = dataSet[len(dataSet)-1][1]
	Ptrend = fetchPtrend()
	if Ptrend > 0.02:
		P_trend = 'rising'
	elif Ptrend < -0.02:
		P_trend = 'falling'
	else:
		P_trend = 'steady'
	chart = {"renderTo": chartID, "type": chart_type, "height": chart_height,}
	series = [{"name": 'Humidity', "data": fetchData(5)},{"name": 'Pressure', "data": dataSet, "yAxis": 1}]
	graphtitle = {"text": 'Humidity & Barometric Pressure'}
	xAxis = {"type":"datetime", "title": {"text": 'Time'}}
	yAxis = {"title": {"text": 'Temperature (C)'}}
	return render_template('index3.html', curH = curH, curP = curP, P_trend = P_trend, pageType = pageType, chartID=chartID, chart=chart, series=series, graphtitle=graphtitle, xAxis=xAxis, yAxis=yAxis)

@app.route('/graph4/')
def index4(chartID = 'chart_ID', chart_type = 'line', chart_height = 350):
	pageType = 'graph4'
	dataSet = fetchData(7) #real power
	#dataSet1 = list(dataSet)
	dataSet1 = fetchData(8) #power consumption
	curPower = dataSet[len(dataSet)-1][1]
	curCost = dataSet1[len(dataSet)-1][1] / 5000  # $0.20/kWh so divide by 1000 for kW, 100 for $, multiply by 20 cents
	curPfactor = fetchPfactor()
	chart = {"renderTo": chartID, "type": chart_type, "height": chart_height, "zoomType": 'x'}
	series = [{"name": 'Power use', "data": dataSet},{"name": 'Energy Use', "data": dataSet1, "yAxis": 1}]
	graphtitle = {"text": 'Power use (W) & Energy Use (Wh)'}
	xAxis = {"type":"datetime", "title": {"text": 'Time'}}
	yAxis = {"title": {"text": 'Power use (W)'}}
	return render_template('index4.html', curPower = curPower, curCost = curCost, curPfactor = curPfactor, pageType = pageType, chartID=chartID, chart=chart, series=series, graphtitle=graphtitle, xAxis=xAxis, yAxis=yAxis)

@app.route('/graph5/')
def index5(chartID = 'chart_ID', chart_type = 'column', chart_height = 350):
	pageType = 'graph5'
	dataSet = fetchData(9) #energy
	curE = dataSet[len(dataSet)-1][1] * 2
	dailyE = 0
	for i in range(0,len(dataSet)):
		dailyE += dataSet[i][1]

	dailyCost = dailyE / 5.0  # $0.20/kWh (approx. cost of delivered electricity in Calgary
	chart = {"renderTo": chartID, "type": chart_type, "height": chart_height,}
	series = [{"name": 'Energy Use', "data": dataSet}]
	graphtitle = {"text": 'Energy Consumption (kWh)'}
	xAxis = {"type":"datetime", "title": {"text": 'Time'}}
	yAxis = {"title": {"text": 'Energy (kWh)'}}
	return render_template('index5.html', curE = curE, dailyE = dailyE, dailyCost=dailyCost, pageType = pageType, chartID=chartID, chart=chart, series=series, graphtitle=graphtitle, xAxis=xAxis, yAxis=yAxis)

if __name__ == "__main__":
        app.run(host='0.0.0.0')     

