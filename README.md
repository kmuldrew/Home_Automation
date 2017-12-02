# Home_Automation
Routines for getting info from sensors and controlling actuators about the home

Sensors broadcast over MQTT, Mosquitto on a Pi reads messages, NodeRed on Pi sends the data to InfluxDB, Flask serves up the data

Flask routines
__init__.py  : fetches data from InfluxDB and serves it up to a web page

javascript routines for displaying data served from Flask
graph.js
graph2.js
graph3.js
graph4.js
graph5.js
statusbar.js
statusbar2.js
index.html
index2.html
index3.html
index4.html
index5.html
header.html
header2.html
footer.html
