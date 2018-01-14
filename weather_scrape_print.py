#Scrapes weather data and writes to disk		

import time
from weather import weather_day
from weather import forecast_day
from apscheduler.schedulers.blocking import BlockingScheduler

#start the scheduler
sched = BlockingScheduler()
sched.daemonic = True

def write_weather_data():
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

        filename = "/var/www/FlaskApp/FlaskApp/weather.dat"
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
        file.write("%d\n" % int(time.time()))
        file.close()

#Tempdata = []
#cur_data = []
#cur_cond = []
#cur_T = 0.0

#with open(filename, "r") as infile:
        #filedata = infile.read()
#infile.close()
#file_list = filedata.splitlines()
#Tempdata_len = int(file_list[0])
#for i in range(1,Tempdata_len+1):
        #Tempdata.append(int(file_list[i]))
#cur_T = float(file_list[i+1])
#cur_data_len = int(file_list[i+2])
#for i in range(i+3,cur_data_len+i+3):
        #cur_data.append(int(file_list[i]))
#cur_cond.append(file_list[-3])
#hour = int(file_list[-2])
#ts = int(file_list[-1])

#write_weather_data()
#Schedules report_energy_use to be run twice each hour, with 50% overlap
sched.add_job(write_weather_data, 'interval', minutes=5)
sched.start()
