  
// Code to draw HMI status bars from MulHomeAutomation sensor data

function draw(houseT,garageT,outdoorT,humid,press,Ptrend,powerkW,powerfactor,dailyE,weeklyE,monthlyE,hour,Tempdata,cur_T,cur_data,cur_cond){
  // temperature, humidity, pressure, power, energy, weather data from Python/flask
  var canvas = document.getElementById('tutorial');
  if (canvas.getContext){
    var ctx = canvas.getContext('2d');
    var current_y, avgmin_y, avgmax_y, alrmin_y, alrmax_y; //vertical positions in status bars
    var alarm = false;  // alarm condition prints pointer in yellow
    var today = new Date();	  //get today's date
    var d = today.getDate();	  //get day of month
    var m = today.getMonth();	  //get month of year (Jan=0)
    var dofw = today.getDay();   //get day of week
    const y_top = 40;		// top of bar (pixels)
    const y_height = 180;	// height of bar
    const x_center = 40;	// center of first bar
    const x_spacing = 60;	// distance between bars
    ctx.fillStyle = "rgb(200,200,200)"; //grey background
    ctx.fillRect(0,0,620,400);	  //fill background
    ctx.fillStyle = "rgb(230,230,230)"; //grey background
    ctx.fillRect(0,240,620,400);	  //fill background
    ctx.fillStyle = "rgb(0,0,0)";  //black
    ctx.strokeStyle = "rgb(0,0,0)";
    ctx.beginPath();
    ctx.moveTo(340,0);	  //draw a divider at x=340
    ctx.lineTo(340,240);
    ctx.moveTo(0,240);	  //draw a divider at y=240
    ctx.lineTo(620,240);
    ctx.stroke();
    ctx.textAlign = "center"	  //text over bars is centered
    ctx.fillText("House T",x_center+x_spacing*0+6,y_top-20);  //titles over each bar
    ctx.fillText("°C",x_center+x_spacing*0+6,y_top-8);
    ctx.fillText("Garage T",x_center+x_spacing*1+6,y_top-20);
    ctx.fillText("°C",x_center+x_spacing*1+6,y_top-8);
    ctx.fillText("Outdoor T",x_center+x_spacing*2+6,y_top-20);
    ctx.fillText("°C",x_center+x_spacing*2+6,y_top-8);
    ctx.fillText("Humidity",x_center+x_spacing*3+6,y_top-20);
    ctx.fillText("%",x_center+x_spacing*3+6,y_top-8);
    ctx.fillText("Pressure",x_center+x_spacing*4+6,y_top-20);
    ctx.fillText("kPa",x_center+x_spacing*4+6,y_top-8);
    ctx.fillText("Power",x_center+x_spacing*5.7+6,y_top-20);
    ctx.fillText("kW",x_center+x_spacing*5.7+6,y_top-8);
    ctx.fillText("Energy (24h)",x_center+x_spacing*6.7+6,y_top-20);
    ctx.fillText("kWh",x_center+x_spacing*6.7+6,y_top-8);
    ctx.fillText("Energy (7d)",x_center+x_spacing*7.7+6,y_top-20);
    ctx.fillText("kWh",x_center+x_spacing*7.7+6,y_top-8);
    var mon = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"] ; //convert number to month
    ctx.fillText(mon[m],x_center+x_spacing*8.7+6,y_top-20); //write current month
    ctx.fillText("kWh",x_center+x_spacing*8.7+6,y_top-8);
    ctx.textAlign = "left"	// text beside bars is left justified

    // House Temperature
    current_y = y_top+y_height-((houseT-10)*(y_height/20)); // position of pointer
    box(ctx,x_center+x_spacing*0,y_top,y_height,y_top+14,y_top+y_height/2-18,y_top+y_height/2+9,y_top+y_height-14,current_y,((houseT>28)||(houseT<12)));  //draw the bars
    if (current_y > (y_top+y_height-13)) {current_y = y_top+y_height-13;}  //for low values, don't overwrite level and lower bound
    ctx.fillText(houseT.toFixed(1),x_center+x_spacing*0+6+10,current_y+5);  //print value opposite pointer
    ctx.fillText(10,x_center+x_spacing*0+6+10,y_top+y_height);  //print min value at bottom right of bar
    ctx.fillText(30,x_center+x_spacing*0+6+10,y_top+8);  //print max value at top right of bar

    // Garage Temperature
    current_y = y_top+y_height-((garageT+2)*(y_height/27));
    box(ctx,x_center+x_spacing*1,y_top,y_height,y_top,y_top+y_height-(22/27)*y_height,y_top+y_height-(14/27)*y_height,y_top+y_height-(6/27)*y_height,current_y,(garageT<4));
    if (current_y > (y_top+y_height-13)) {current_y = y_top+y_height-13;}  //for low values, don't overwrite level and lower bound
    ctx.fillText(garageT.toFixed(1),x_center+x_spacing*1+6+10,current_y+5);  //print value opposite pointer
    ctx.fillText('-2',x_center+x_spacing*1+6+10,y_top+y_height);  //print min value at bottom right of bar
    ctx.fillText(25,x_center+x_spacing*1+6+10,y_top+8);  //print max value at top right of bar

    // Outdoor Temperature
    var recminTT = recminT(d,m);  //get record low temp for today
    var recmaxTT = recmaxT(d,m)	  //get record high temp for today
    current_y = y_top+y_height-((outdoorT-recminTT)*(y_height/(recmaxTT-recminTT))); //current value on statusbar
    avgmin_y = y_top+y_height-((avgminT(d,m)-recminTT)*(y_height/(recmaxTT-recminTT))); //get avg T from a function
    avgmax_y = y_top+y_height-((avgmaxT(d,m)-recminTT)*(y_height/(recmaxTT-recminTT)));
    alrmax_y = y_top+((2)*(y_height/(recmaxTT-recminTT))); //set alarm if close to a record T
    alrmin_y = y_top+y_height-((2)*(y_height/(recmaxTT-recminTT)));
    // box shows temperatures from record low to record high for the date with blue indicating average high to avg low for the date
    box(ctx,x_center+x_spacing*2,y_top,y_height,alrmax_y,avgmax_y,avgmin_y,alrmin_y,current_y,(outdoorT>(recmaxT-2)));
    ctx.fillText(outdoorT.toFixed(1),x_center+x_spacing*2+6+10,current_y+5);  //print value opposite pointer
    ctx.fillText(recminTT.toFixed(1),x_center+x_spacing*2+6+10,y_top+y_height);  //print min value at bottom right of bar
    ctx.fillText(recmaxTT.toFixed(1),x_center+x_spacing*2+6+10,y_top+8);  //print max value at top right of bar
    current_y = y_top+y_height-((0-recminTT)*(y_height/(recmaxTT-recminTT))); //get value on statusbar for 0'C
    ctx.strokeStyle = "rgb(0,0,255)";
    ctx.beginPath();
    ctx.moveTo(x_center+x_spacing*2-3,current_y);	  //draw a blue line at 0'C
    ctx.lineTo(x_center+x_spacing*2+15,current_y);
    ctx.stroke();
    ctx.strokeStyle = "rgb(0,0,0)";			  //put drawing color back to black

    // Humidity
    current_y = y_top+y_height-((humid)*(y_height/100));
    avgmax_y = y_top+y_height-(30*(y_height/100));	  //pretty comfortable between 30 and 50%
    avgmin_y = y_top+y_height-(50*(y_height/100));
    alrmin_y = y_top+y_height-(15*(y_height/100));	  //pretty uncomfortable below 15 or above 85%
    alrmax_y = y_top+y_height-(85*(y_height/100));
    box(ctx,x_center+x_spacing*3,y_top,y_height,alrmax_y,avgmax_y,avgmin_y,alrmin_y,current_y,((humid>85)||(humid<15)));
    if (current_y > (y_top+y_height-13)) {current_y = y_top+y_height-13;}  //for low values, don't overwrite level and lower bound
    ctx.fillText(humid.toFixed(0),x_center+x_spacing*3+6+10,current_y+5);  //print value opposite pointer
    ctx.fillText(' 0',x_center+x_spacing*3+6+10,y_top+y_height);  //print min value at bottom right of bar
    ctx.fillText(100,x_center+x_spacing*3+6+10,y_top+8);  //print max value at top right of bar

    // Pressure
    if (Ptrend > 0.1) {Ptrend = 0.11;}		  //Ptrend is current value - average over last hour
    if (Ptrend < -0.1) {Ptrend = -0.11;}	  //assume max Ptrend is +/-0.1
    current_y = y_top+y_height-((press-98)*(y_height/6));
    avgmax_y = current_y-20+(Ptrend*10*20);	  //blue box skewed to show rising or falling trend
    avgmin_y = avgmax_y+40;
    box(ctx,x_center+x_spacing*4,y_top,y_height,y_top,avgmax_y,avgmin_y,y_top+y_height,current_y,false);
    if (current_y > (y_top+y_height-13)) {current_y = y_top+y_height-13;}  //for low values, don't overwrite level and lower bound
    ctx.fillText(press.toFixed(1),x_center+x_spacing*4+6+10,current_y+5);  //print value opposite pointer
    ctx.fillText('98',x_center+x_spacing*4+6+10,y_top+y_height);  //print min value at bottom right of bar
    ctx.fillText(104,x_center+x_spacing*4+6+10,y_top+8);  //print max value at top right of bar

    // Power
    current_y = y_top+y_height-((Math.log10(powerkW+1))*(y_height/1.08));
    avgmax_y = y_top+y_height-(0.78*(y_height/1.08));
    avgmin_y = y_top+y_height;
    alrmax_y = y_top+y_height-(0.95*(y_height/1.08));
    box(ctx,x_center+x_spacing*5.7,y_top,y_height,alrmax_y,avgmax_y,avgmin_y,y_top+y_height,current_y,false);
    ctx.fillText(powerkW.toFixed(1),x_center+x_spacing*5.7+6+10,current_y+5);  //print value opposite pointer
    ctx.fillText('0',x_center+x_spacing*5.7+6+10,y_top+y_height);  //print min value at bottom right of bar
    ctx.fillText('12',x_center+x_spacing*5.7+6+10,y_top+8);  //print max value at top right of bar
    ctx.strokeStyle = "rgb(150,150,150)";
    current_y = y_top+y_height-0.28*(y_height);
    ctx.beginPath();
    ctx.moveTo(x_center+x_spacing*5.7,current_y);	  //draw log scale 1
    ctx.lineTo(x_center+x_spacing*5.7+12,current_y);
    ctx.stroke();
    current_y = y_top+y_height-0.44*(y_height);
    ctx.beginPath();
    ctx.moveTo(x_center+x_spacing*5.7,current_y);	  //draw log scale 2
    ctx.lineTo(x_center+x_spacing*5.7+12,current_y);
    ctx.stroke();
    current_y = y_top+y_height-0.56*(y_height);
    ctx.beginPath();
    ctx.moveTo(x_center+x_spacing*5.7,current_y);	  //draw log scale 3
    ctx.lineTo(x_center+x_spacing*5.7+12,current_y);
    ctx.stroke();
    current_y = y_top+y_height-0.65*(y_height);
    ctx.beginPath();
    ctx.moveTo(x_center+x_spacing*5.7,current_y);	  //draw log scale 4
    ctx.lineTo(x_center+x_spacing*5.7+12,current_y);
    ctx.stroke();
    current_y = y_top+y_height-0.72*(y_height);
    ctx.beginPath();
    ctx.moveTo(x_center+x_spacing*5.7,current_y);	  //draw log scale 5
    ctx.lineTo(x_center+x_spacing*5.7+12,current_y);
    ctx.stroke();
    current_y = y_top+y_height-0.78*(y_height);
    ctx.beginPath();
    ctx.moveTo(x_center+x_spacing*5.7,current_y);	  //draw log scale 6
    ctx.lineTo(x_center+x_spacing*5.7+12,current_y);
    ctx.stroke();
    current_y = y_top+y_height-0.84*(y_height);
    ctx.beginPath();
    ctx.moveTo(x_center+x_spacing*5.7,current_y);	  //draw log scale 7
    ctx.lineTo(x_center+x_spacing*5.7+12,current_y);
    ctx.stroke();
    current_y = y_top+y_height-0.88*(y_height);
    ctx.beginPath();
    ctx.moveTo(x_center+x_spacing*5.7,current_y);	  //draw log scale 8
    ctx.lineTo(x_center+x_spacing*5.7+12,current_y);
    ctx.stroke();
    current_y = y_top+y_height-0.93*(y_height);
    ctx.beginPath();
    ctx.moveTo(x_center+x_spacing*5.7,current_y);	  //draw log scale 9
    ctx.lineTo(x_center+x_spacing*5.7+12,current_y);
    ctx.stroke();
    current_y = y_top+y_height-0.96*(y_height);
    ctx.beginPath();
    ctx.moveTo(x_center+x_spacing*5.7,current_y);	  //draw log scale 10
    ctx.lineTo(x_center+x_spacing*5.7+12,current_y);
    ctx.stroke();

    // powerfactor
    ctx.strokeStyle = "rgb(255,255,255)";		  //put drawing color to white
    current_y = y_top+y_height-((Math.log10(powerkW+1))*(y_height/1.08));
    ctx.beginPath();
    ctx.moveTo(x_center+x_spacing*5.7-1,current_y);	  //draw power factor on triangle
    ctx.lineTo(x_center+x_spacing*5.7-17,current_y+(20-20*powerfactor));
    ctx.stroke();
    ctx.strokeStyle = "rgb(0,0,0)";			  //put drawing color back to black

    // Energy
    maxDailyE = 60;
    var avgEhigh = avgEmaxT(m);   //get avg high energy use for this month
    current_y = y_top+y_height-((dailyE)*(y_height/maxDailyE));
    avgmax_y = y_top+y_height-((avgEhigh+10)*(y_height/maxDailyE));	  //avg +/- 10kWh range
    avgmin_y = y_top+y_height-((avgEhigh-10)*(y_height/maxDailyE));
    alrmin_y = y_top+y_height-(0*(y_height/maxDailyE));	  
    alrmax_y = y_top+y_height-((avgEhigh+20)*(y_height/maxDailyE));
    box(ctx,x_center+x_spacing*6.7,y_top,y_height,alrmax_y,avgmax_y,avgmin_y,alrmin_y,current_y,((current_y < alrmax_y)));
    if (current_y > (y_top+y_height-13)) {current_y = y_top+y_height-13;}  //for low values, don't overwrite level and lower bound
    ctx.fillText(dailyE.toFixed(0),x_center+x_spacing*6.7+6+10,current_y+5);  //print value opposite pointer
    ctx.fillText(' 0',x_center+x_spacing*6.7+6+10,y_top+y_height);  //print min value at bottom right of bar
    ctx.fillText(maxDailyE,x_center+x_spacing*6.7+6+10,y_top+8);  //print max value at top right of bar

    // Weekly Energy
    maxWeeklyE = 350;
    avgEhigh = avgEmaxT(m)*7;   //get avg high energy use for this month
    current_y = y_top+y_height-((weeklyE)*(y_height/maxWeeklyE));
    avgmax_y = y_top+y_height-((avgEhigh+40)*(y_height/maxWeeklyE));	  //avg +/- 40kWh range
    avgmin_y = y_top+y_height-((avgEhigh-40)*(y_height/maxWeeklyE));
    alrmin_y = y_top+y_height-(0*(y_height/maxWeeklyE));	  
    alrmax_y = y_top+y_height-((avgEhigh+80)*(y_height/maxWeeklyE));
    box(ctx,x_center+x_spacing*7.7,y_top,y_height,alrmax_y,avgmax_y,avgmin_y,alrmin_y,current_y,((current_y < alrmax_y)));
    if (current_y > (y_top+y_height-13)) {current_y = y_top+y_height-13;}  //for low values, don't overwrite level and lower bound
    ctx.fillText(weeklyE.toFixed(0),x_center+x_spacing*7.7+6+10,current_y+5);  //print value opposite pointer
    ctx.fillText(' 0',x_center+x_spacing*7.7+6+10,y_top+y_height);  //print min value at bottom right of bar
    ctx.fillText(maxWeeklyE,x_center+x_spacing*7.7+6+10,y_top+8);  //print max value at top right of bar

    // Monthly Energy (start of month to today)
    maxMonthlyE = 1200;
    avgEhigh = avgEmaxT(m)*d;   //get avg high energy use for this month (energy/day * no. of days so far in month)
    var E_range = avgEhigh / 5;     //allow 20% above average for upper range of acceptable energy usage
    current_y = y_top+y_height-((monthlyE)*(y_height/maxMonthlyE));
    avgmax_y = y_top+y_height-((avgEhigh+E_range)*(y_height/maxMonthlyE));	  //avg + 15% range
    var avgElow = avgEhigh; //early in month, make avg low smaller so that we don't go below zero
    if (avgElow > 200) {avgElow = 200;} //avg monthly low is set at avg monthly E - 200 for the month
    avgmin_y = y_top+y_height-((avgEhigh-avgElow)*(y_height/maxMonthlyE));
    alrmin_y = y_top+y_height-(0*(y_height/maxMonthlyE));
    E_range = E_range * 5;	//allow double energy use before alarm to max of 350kWh
    if (E_range > 350) {E_range = 350;}	  
    alrmax_y = y_top+y_height-((avgEhigh+(E_range))*(y_height/maxMonthlyE));
    box(ctx,x_center+x_spacing*8.7,y_top,y_height,alrmax_y,avgmax_y,avgmin_y,alrmin_y,current_y,((current_y < alrmax_y)));
    if (current_y > (y_top+y_height-13)) {current_y = y_top+y_height-13;}  //for low values, don't overwrite level and lower bound
    ctx.fillText(monthlyE.toFixed(0),x_center+x_spacing*8.7+6+10,current_y+5);  //print value opposite pointer
    ctx.fillText(' 0',x_center+x_spacing*8.7+6+10,y_top+y_height);  //print min value at bottom right of bar
    ctx.fillText(maxMonthlyE,x_center+x_spacing*8.7+6+10,y_top+8);  //print max value at top right of bar

  // current conditions from Environment Canada XML file (see python routines for details)
    var s = "Current temperature: "+String(cur_T)+"°C";
    ctx.fillText(s,20,265);  //current temperature
    if (cur_T < 0.0) { 
      ctx.fillText("Windchill: "+cur_data[15]+"°C",20,280);  //windchill, if present, is at end of data array
    }
    ctx.fillText(cur_cond[0],20,295);  //conditions (text summary)
    ctx.fillText("Relative Humidity: "+cur_data[0]+"%",20,310);  //humidity
    ctx.fillText("Today High: "+cur_data[7]+"°C Low: "+cur_data[8]+"°C",20,325); 
    ctx.fillText("Forecast: ",20,345); 
    var days=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday','Monday','Tuesday'];
    ctx.fillText(days[dofw+1]+"  High: "+cur_data[9]+"°C Low: "+cur_data[10]+"°C",20,360); 
    ctx.fillText(days[dofw+2]+"  High: "+cur_data[11]+"°C Low: "+cur_data[12]+"°C",20,375); 
    ctx.fillText(days[dofw+3]+"  High: "+cur_data[13]+"°C Low: "+cur_data[14]+"°C",20,390); 

    
  // wind 
    //draw a compass rose with an arrow pointing into the center indicating wind direction
    //length indicates wind strength
    x_c = 200;
    y_c = 310;
    circle(ctx,x_c,y_c,30,150); //outer and inner circles for wind < 10,30 km/h
    circle(ctx,x_c,y_c,22,180);
    diamond(ctx,x_c,y_c,0,-22); //compass points
    diamond(ctx,x_c,y_c,0,22);
    diamond(ctx,x_c,y_c,-22,0);
    diamond(ctx,x_c,y_c,22,0);
    minidiamond(ctx,x_c,y_c);
    ctx.fillStyle = "rgb(0,0,0)";
    ctx.fillText("N",x_c-4,y_c-45); //write the cardinal directions
    ctx.fillText("E",x_c+48,y_c+4);
    ctx.fillText("S",x_c-3,y_c+56);
    ctx.fillText("W",x_c-54,y_c+4); 
    ctx.fillText(cur_data[1]+" km/h",x_c-13,y_c+70);
    windarrow(ctx,cur_data[1],cur_data[2],x_c,y_c); // speed, bearing, center

  // daylight
    //24 hour circle with light blue pie indicating daylight, dark blue is night
    var h_rise,m_rise,h_set,m_set,rise,set;
    x_c = 320;  // center of 24 hour circle
    y_c = 310;
    h_rise = cur_data[3];
    m_rise = cur_data[4];
    h_set = cur_data[5];
    m_set = cur_data[6];
    // hour angles for sunrise and sunset
    rise = ((((h_rise + m_rise/60) / 24 * 360) + 90) * Math.PI) / 180;
    set = ((((h_set + m_set/60) / 24 * 360) +90) * Math.PI) / 180;
    ctx.fillStyle = "rgb(150,150,250)"; // light blue for daylight
    ctx.beginPath();
    ctx.moveTo(x_c,y_c);
    ctx.arc(x_c,y_c,40,rise,set,false);
    ctx.lineTo(x_c,y_c);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgb(100,100,150)";  // dark blue for night
    ctx.beginPath();
    ctx.moveTo(x_c,y_c);
    ctx.arc(x_c,y_c,40,set,rise,false);
    ctx.lineTo(x_c,y_c);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgb(200,200,255)"; // draw hour angles (0,6,12,18)
    ctx.beginPath();
    ctx.moveTo(x_c,y_c-40); 
    ctx.lineTo(x_c,y_c+40);
    ctx.moveTo(x_c-40,y_c);
    ctx.lineTo(x_c+40,y_c);
    //put tick marks for the hours
    ctx.moveTo(x_c+28,y_c+28); ctx.lineTo(x_c+23,y_c+23); // 3:00
    ctx.moveTo(x_c-28,y_c+28); ctx.lineTo(x_c-23,y_c+23); // 9:00
    ctx.moveTo(x_c-28,y_c-28); ctx.lineTo(x_c-23,y_c-23); // 15:00
    ctx.moveTo(x_c+28,y_c-28); ctx.lineTo(x_c+23,y_c-23); // 21:00

    ctx.moveTo(x_c+39,y_c+10); ctx.lineTo(x_c+35,y_c+9); // 1:00
    ctx.moveTo(x_c+35,y_c+20); ctx.lineTo(x_c+31,y_c+18); // 2:00
    ctx.moveTo(x_c+20,y_c+35); ctx.lineTo(x_c+18,y_c+31); // 4:00
    ctx.moveTo(x_c+10,y_c+39); ctx.lineTo(x_c+9,y_c+35); // 5:00
    ctx.moveTo(x_c-10,y_c+39); ctx.lineTo(x_c-9,y_c+35); // 7:00
    ctx.moveTo(x_c-20,y_c+35); ctx.lineTo(x_c-18,y_c+31); // 8:00
    ctx.moveTo(x_c-35,y_c+20); ctx.lineTo(x_c-31,y_c+18); // 10:00
    ctx.moveTo(x_c-39,y_c+10); ctx.lineTo(x_c-35,y_c+9); // 11:00
    ctx.moveTo(x_c-39,y_c-10); ctx.lineTo(x_c-35,y_c-9); // 13:00
    ctx.moveTo(x_c-35,y_c-20); ctx.lineTo(x_c-31,y_c-18); // 14:00
    ctx.moveTo(x_c-20,y_c-35); ctx.lineTo(x_c-18,y_c-31); // 16:00
    ctx.moveTo(x_c-10,y_c-39); ctx.lineTo(x_c-9,y_c-35); // 17:00
    ctx.moveTo(x_c+10,y_c-39); ctx.lineTo(x_c+9,y_c-35); // 19:00
    ctx.moveTo(x_c+20,y_c-35); ctx.lineTo(x_c+18,y_c-31); // 20:00
    ctx.moveTo(x_c+35,y_c-20); ctx.lineTo(x_c+31,y_c-18); // 22:00
    ctx.moveTo(x_c+39,y_c-10); ctx.lineTo(x_c+35,y_c-9); // 23:00
    ctx.stroke();
    //write sunrise and sunset times
    s_zero = "";
    if (m_rise < 10) {
      s_zero = "0";
    }
    s = String(h_rise)+":"+s_zero+String(m_rise);
    ctx.fillText(s,x_c+(60*Math.cos(rise)),y_c+(50*Math.sin(rise)));
    s_zero = "";
    if (m_set < 10) {
      s_zero = "0";
    }
    s = String(h_set)+":"+s_zero+String(m_set);
    ctx.fillText(s,x_c+(40*Math.cos(set)),y_c+(50*Math.sin(set)));

  // 24 hour temperatures
    //show 24 hour temperature forecast as radar plot on day/night circle
    var Tmin, Tmax;
    ctx.strokeStyle = "rgb(200,200,255)";
    ctx.beginPath();
    ctx.arc(x_c,y_c,20,0,2*Math.PI,false); // put circle halfway for daily median temp
    ctx.closePath();
    ctx.stroke();
    ctx.strokeStyle = "rgb(220,255,255)"; // light blue for T path
    Tmin = 40; Tmax = -40;
    for (i=0;i<= 23; i++) { // get max and min T for the next 24 h
      if (Tempdata[i] < Tmin) { Tmin = Tempdata[i]; }
      if (Tempdata[i] > Tmax) { Tmax = Tempdata[i]; }
    }
    var Tavg = (Tmax - Tmin)/2 + Tmin; // median, not avg, T
    r_scale = 20/(Tmax-Tmin); //scale T's to fit from r+10 to r+30 (r=40)
    //put lowest temperature at radius=5 and highest temperature at radius=35
    ctx.beginPath();
    var angle = (hour * 15) + 90;
    var radangle = (angle * Math.PI) / 180; // hour angle;
    var mag = (Tempdata[0]-Tavg)*r_scale + 20;
    ctx.moveTo(x_c+(mag*Math.cos(radangle)),y_c+(mag*Math.sin(radangle))); //go to the first T in the list
    for (i=1;i<= 23; i++) { //plot the next 23 temperatures in the list
      angle = angle + 15;
      mag = (Tempdata[i]-Tavg)*r_scale + 20;
      radangle = (angle * Math.PI) / 180; // hour angle;
      ctx.lineTo(x_c+(mag*Math.cos(radangle)),y_c+(mag*Math.sin(radangle)));
    } 
  //  ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = "rgb(0,0,0)";
    //indicate the temperatures of the outer edge, the midline circle, and the center of the circle
    ctx.fillText(Tmax+10/r_scale,x_c+20,y_c+60);
    ctx.fillText("edge",x_c+18,y_c+70);
    ctx.fillText(Tavg,x_c-5,y_c+60);
    ctx.fillText(Tmin-10/r_scale,x_c-35,y_c+60);
    ctx.fillText("center",x_c-35,y_c+70);
  }
}

  function box(ctx,x,y_top,y_height,y1,y2,y3,y4,y_current,alarm) {  //statusbar drawing function
    ctx.fillStyle = "rgb(255,255,255)";
    ctx.fillRect(x,y_top,12,y_height);	  //full white bar
    ctx.fillStyle = "rgb(0,0,0)";	  //outline in black
    ctx.strokeRect(x,y_top,12,y_height);
    ctx.fillStyle = "rgb(188,223,227)";	  //light blue bar in center
    ctx.fillRect(x,y2,12,y3-y2);
    ctx.fillStyle = "rgb(0,0,0)";	  //outline in black
    ctx.strokeRect(x,y2,12,y3-y2);
    ctx.fillStyle = "rgb(100,100,100)";	  //dark grey for alarm regions
    ctx.fillRect(x,y_top,12,y1-y_top);	  //top
    ctx.fillRect(x,y4,12,(y_top+y_height)-y4);  //bottom
    triangle(ctx,x,y_current,alarm);
    ctx.fillStyle = "rgb(50,50,50)";	  //revert to dark dark gray
  }
  function triangle(ctx,x,y,alarm) {		  //draw the pointer
    if (alarm) {
      ctx.fillStyle = "rgb(246,235,21)";	  //bright yellow pointer if in alarm
    } else {
      ctx.fillStyle = "rgb(100,100,100)";	  //dark grey pointer in normal
    }
    ctx.strokeStyle = "rgb(0,0,0)";		  //outline it in black
    ctx.beginPath();
    ctx.moveTo(x-1,y);				  //draw a triangle
    ctx.lineTo(x-17,y+10);
    ctx.lineTo(x-17,y-10);
    ctx.lineTo(x-1,y);
    ctx.fill();
    ctx.stroke();
  } 
  //draw a thick circle of "shade" color
  function circle(ctx,x_center,y_center,radius,shade) {
    ctx.fillStyle = "rgb("+shade+","+shade+","+shade+")";
    ctx.beginPath();
    ctx.arc(x_center,y_center,radius,0,2*Math.PI,false);
    ctx.arc(x_center,y_center,radius-8,0,2*Math.PI,true);
    ctx.fill();
  }
  //draw a pointer for the cardinal directions on compass rose (actually a triangle, not a diamond)	
  function diamond(ctx,x_center,y_center,x_ofs,y_ofs) {
    ctx.beginPath();
    ctx.strokeStyle = "rgb(10,10,10)";
    ctx.fillStyle = "rgb(100,100,100)";
    ctx.moveTo(x_c+x_ofs,y_c+y_ofs);
    if (x_ofs == 0) {
      ctx.lineTo(x_c,y_c+y_ofs+y_ofs+2);
      ctx.lineTo(x_c+6,y_c+y_ofs+1);
    } else {
      ctx.lineTo(x_c+x_ofs+x_ofs+2,y_c);
      ctx.lineTo(x_c+x_ofs+1,y_c+6);
    }
    ctx.lineTo(x_c+x_ofs,y_c+y_ofs);
    ctx.fill();
    ctx.beginPath();
    ctx.fillStyle = "rgb(150,150,150)";
    ctx.moveTo(x_c+x_ofs,y_c+y_ofs);
    if (x_ofs == 0) {
      ctx.lineTo(x_c,y_c+y_ofs+y_ofs+2);
      ctx.lineTo(x_c-6,y_c+y_ofs+1);
    } else {
      ctx.lineTo(x_c+x_ofs+x_ofs+2,y_c);
      ctx.lineTo(x_c+x_ofs+1,y_c-6);
    }
    ctx.lineTo(x_c+x_ofs,y_c+y_ofs);
    ctx.fill();
    ctx.stroke();
  }
  //draw a small triangle for NE, NW, SE, SW directions	  
  function minidiamond(ctx,x_center,y_center) {
    ctx.strokeStyle = "rgb(100,100,100)";
    ctx.fillStyle = "rgb(100,100,100)";
    ctx.beginPath();
    ctx.moveTo(x_c+16,y_c+14);
    ctx.lineTo(x_c+21,y_c+21);
    ctx.lineTo(x_c+14,y_c+16);
    ctx.lineTo(x_c+16,y_c+14);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x_c+16,y_c-14);
    ctx.lineTo(x_c+21,y_c-21);
    ctx.lineTo(x_c+14,y_c-16);
    ctx.lineTo(x_c+16,y_c-14);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x_c-16,y_c+14);
    ctx.lineTo(x_c-21,y_c+21);
    ctx.lineTo(x_c-14,y_c+16);
    ctx.lineTo(x_c-16,y_c+14);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x_c-16,y_c-14);
    ctx.lineTo(x_c-21,y_c-21);
    ctx.lineTo(x_c-14,y_c-16);
    ctx.lineTo(x_c-16,y_c-14);
    ctx.fill();
    ctx.stroke();
  }
  //draw an arrow to indicate wind direction and speed
  function windarrow(ctx,windspeed,windbearing,x_c,y_c) {
    var len,x_pos,y_pos;
    if (windspeed < 10) { len = 16; //shortest line for wind speed < 10 km/h
    } else if (windspeed < 35) { len = 24; //midling line for 10 < wind speed < 35 km/h
    } else { len = 32;
    }
    if (windspeed > 60) { ctx.strokeStyle = "rgb(255,255,0)"; //draw a yellow line for high winds
    } else {ctx.strokeStyle = "rgb(0,0,150)";
    }
    windbearing = ((windbearing-90) * 3.14159) / 180;
    x_pos = Math.cos(windbearing) * len;
    y_pos = Math.sin(windbearing) * len;
    x_arrow_ofs = -4 * (y_pos/len);
    y_arrow_ofs = 4 * (x_pos/len);
    ctx.fillStyle = "rgb(0,0,100)";
    ctx.beginPath();
    ctx.moveTo(x_c+x_pos,y_c+y_pos);
    ctx.lineTo(x_c,y_c);
    len = len * 0.75;
    //draw an arrowhead at the center of the circle, pointing in the direction of the line
    ctx.moveTo(x_c+(x_pos/len)*4,y_c+(y_pos/len)*4);
    ctx.lineTo(x_c+(x_pos/len)*4+x_arrow_ofs,y_c+(y_pos/len)*4+y_arrow_ofs);
    ctx.lineTo(x_c,y_c);
    ctx.moveTo(x_c+(x_pos/len)*4,y_c+(y_pos/len)*4);
    ctx.lineTo(x_c+(x_pos/len)*4-x_arrow_ofs,y_c+(y_pos/len)*4-y_arrow_ofs);
    ctx.lineTo(x_c,y_c);
    ctx.stroke();
    ctx.fill();
  }

  // These functions are for Calgary
  function avgmaxT(d,m) { // return the daily avg high for today (d=day, m=month)
    var prop, avg;	  // linear interpolation between monthly values
    var temps = [-2.85,-1.55,1.75,7.45,13.85,18.25,21.55,22.9,20.2,15.1,7.6,-0.05,-2.85]; //values for each month (Jan is repeated at the end to simplify calc)
    var monthvals = [31,29,31,30,31,30,31,31,30,31,30,31];  //days in each month
    avg = (d/monthvals[m])*(temps[m+1]-temps[m])+temps[m];
    return(avg);
  }
  function avgminT(d,m) { // return the daily avg low for today
    var avg;
    var temps = [-15.15,-13.65,-10,-5.1,0.5,5.25,8.45,9.25,6.5,1.5,-5,-11.95,-15.15];
    var monthvals = [31,29,31,30,31,30,31,31,30,31,30,31];
    avg = (d/monthvals[m])*(temps[m+1]-temps[m])+temps[m];
    return(avg);
  }
  function recmaxT(d,m) { // return the daily record high for today
    var rec;
    var temps = [14.85,14.45,16.7,22.05,28.45,31.95,34.7,35.25,32.5,28.35,22.55,17.7,14.85];
    var monthvals = [31,29,31,30,31,30,31,31,30,31,30,31];
    rec = (d/monthvals[m])*(temps[m+1]-temps[m])+temps[m];
    return(rec);
  }
  function recminT(d,m) { // return the daily record low for today
    var rec;
    var temps = [-36.1,-37.5,-35,-25,-12.5,-3.9,1.25,1.55,-2.75,-10.85,-22.25,-31.65,-36.1];
    var monthvals = [31,29,31,30,31,30,31,31,30,31,30,31];
    rec = (d/monthvals[m])*(temps[m+1]-temps[m])+temps[m];
    return(rec);
  }
  function avgEmaxT(m) { // return the monthly avg energy use (m=month) as kWh/day 
  //                        (so for Jan, 31 days * 25 kWh = 777 kWh for the month)
  // data from 2017
    var monthvals = [25,22,16,14,12,12,11,13,15,18,23,28];  //kWh/day for each month
    return(monthvals[m]);
}

	