# Power consumption meter
# Every hour add up the total Energy use from the past hour and post it to
# 'house/energy' on MQTT

import pandas as pd
from influxdb import DataFrameClient
from datetime import datetime
import time
import paho.mqtt.publish as publish
from apscheduler.schedulers.blocking import BlockingScheduler

#start the scheduler
sched = BlockingScheduler()
sched.daemonic = True

def report_energy_use():
    client = DataFrameClient('localhost',8086,'','','MulHomeAutomation')
    result = client.query("select * from power where location='house' and time > now() - 1h limit 400")
    db = result['power']
    db.reset_index(level=0, inplace=True)
    db = db.rename(columns = {'index':'date'})
    x1 = db['date']
    y1 = db['value']
    dataSet = []
    for i in range(0,len(x1)):
        dataPoint = []
        t0 = time.mktime(datetime.strptime(str(x1[i])[0:19],"%Y-%m-%d %H:%M:%S").timetuple())
        dataPoint.append(t0*1000-43200000) #*1000 for js time, -43.2mil for -12h
        if (i > 0):
                delta_t = ((x1[i]-x1[i-1]).total_seconds())/3600
                dataPoint.append(dataSet[i-1][1] + (y1[i] * delta_t))  #integrate power for d_index == 8
        else:
                dataPoint.append(0)

        dataSet.append(dataPoint)
  #  print dataSet[len(dataSet)-1][1]
    publish.single("house/energy", dataSet[len(dataSet)-1][1], hostname="192.168.0.105")

#Schedules report_energy_use to be run twice each hour, with 50% overlap
sched.add_job(report_energy_use, 'interval', minutes=30)
sched.start()






	
