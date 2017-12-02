  
// Code to draw HMI status bars from MulHomeAutomation sensor data

function draw(houseT,garageT,outdoorT,humid,press,Ptrend){
  // temperature, humidity, and pressure data from Python/flask
  var canvas = document.getElementById('tutorial');
  if (canvas.getContext){
    var ctx = canvas.getContext('2d');
    var current_y, avgmin_y, avgmax_y, alrmin_y, alrmax_y;
    var alarm = false;  // alarm condition prints pointer in yellow
    const y_top = 40;		// top of bar (pixels)
    const y_height = 180;	// height of bar
    const x_center = 40;	// center of first bar
    const x_spacing = 60;	// distance between bars
    ctx.fillStyle = "rgb(200,200,200)"; //grey background
    ctx.fillRect(0,0,340,240);	  //fill background
    ctx.fillStyle = "rgb(0,0,0)";  //black
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
    ctx.textAlign = "left"	// text beside bars is left justified
    // House Temperature
    current_y = y_top+y_height-((houseT-10)*(y_height/20)); // position of pointer
    box(ctx,x_center+x_spacing*0,y_top,y_height,y_top+14,y_top+y_height/2-18,y_top+y_height/2+9,y_top+y_height-14,current_y,((houseT>28)||(houseT<12)));  //draw the bars
    ctx.fillText(houseT.toFixed(1),x_center+x_spacing*0+6+10,current_y+5);  //print value opposite pointer
    ctx.fillText(10,x_center+x_spacing*0+6+10,y_top+y_height);  //print min value at bottom right of bar
    ctx.fillText(30,x_center+x_spacing*0+6+10,y_top+8);  //print max value at top right of bar
    // Garage Temperature
    current_y = y_top+y_height-((garageT)*(y_height/25));
    box(ctx,x_center+x_spacing*1,y_top,y_height,y_top,y_top+y_height-(20/25)*y_height,y_top+y_height-(12/25)*y_height,y_top+y_height-(4/25)*y_height,current_y,(garageT<4));
    ctx.fillText(garageT.toFixed(1),x_center+x_spacing*1+6+10,current_y+5);  //print value opposite pointer
    ctx.fillText(' 0',x_center+x_spacing*1+6+10,y_top+y_height);  //print min value at bottom right of bar
    ctx.fillText(25,x_center+x_spacing*1+6+10,y_top+8);  //print max value at top right of bar
    // Outdoor Temperature
    var today = new Date();	  //get today's date
    var d = today.getDate();	  //get day of month
    var m = today.getMonth();	  //get month of year (Jan=0)
    var recminTT = recminT(d,m);  //get record low temp for today
    var recmaxTT = recmaxT(d,m)	  //get record high temp for today
    current_y = y_top+y_height-((outdoorT-recminTT)*(y_height/(recmaxTT-recminTT)));
    avgmin_y = y_top+y_height-((avgminT(d,m)-recminTT)*(y_height/(recmaxTT-recminTT)));
    avgmax_y = y_top+y_height-((avgmaxT(d,m)-recminTT)*(y_height/(recmaxTT-recminTT)));
    alrmax_y = y_top+((2)*(y_height/(recmaxTT-recminTT)));
    alrmin_y = y_top+y_height-((2)*(y_height/(recmaxTT-recminTT)));
    // box shows temperatures from record low to record high for the date with blue indicating average high to avg low for the date
    box(ctx,x_center+x_spacing*2,y_top,y_height,alrmax_y,avgmax_y,avgmin_y,alrmin_y,current_y,(outdoorT>(recmaxT-2)));
    ctx.fillText(outdoorT.toFixed(1),x_center+x_spacing*2+6+10,current_y+5);  //print value opposite pointer
    ctx.fillText(recminTT.toFixed(1),x_center+x_spacing*2+6+10,y_top+y_height);  //print min value at bottom right of bar
    ctx.fillText(recmaxTT.toFixed(1),x_center+x_spacing*2+6+10,y_top+8);  //print max value at top right of bar
    current_y = y_top+y_height-((0-recminTT)*(y_height/(recmaxTT-recminTT)));
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
    ctx.fillText(press.toFixed(1),x_center+x_spacing*4+6+10,current_y+5);  //print value opposite pointer
    ctx.fillText('98',x_center+x_spacing*4+6+10,y_top+y_height);  //print min value at bottom right of bar
    ctx.fillText(104,x_center+x_spacing*4+6+10,y_top+8);  //print max value at top right of bar
  }
}
  function box(ctx,x,y_top,y_height,y1,y2,y3,y4,y_current,alarm) {  //bar drawing function
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
  }			  // These functions are for Calgary
  function avgmaxT(d,m) { // return the daily avg high for today (d=day, m=month)
    var prop, avg;	  // linear interpolation between monthly values
    var temps = [-0.85,-0.1,2.55,7.8,13.75,18.05,21.5,23,20.3,14.75,7.55,1.3,-0.85]; //values for each month (Jan is repeated at the end to simplify calc)
    var monthvals = [31,29,31,30,31,30,31,31,30,31,30,31];  //days in each month
    avg = (d/monthvals[m])*(temps[m+1]-temps[m])+temps[m];
    return(avg);
  }
  function avgminT(d,m) { // return the daily avg low for today
    var avg;
    var temps = [-13,-12.3,-9.45,-4.75,0.55,5.3,8.65,9.3,6.45,1.35,-4.8,-10.5,-13];
    var monthvals = [31,29,31,30,31,30,31,31,30,31,30,31];
    avg = (d/monthvals[m])*(temps[m+1]-temps[m])+temps[m];
    return(avg);
  }
  function recmaxT(d,m) { // return the daily record high for today
    var rec;
    var temps = [18.55,20.1,24,27.4,30.9,33.7,35.55,35.85,34.45,31.35,26.1,21.15,18.55];
    var monthvals = [31,29,31,30,31,30,31,31,30,31,30,31];
    rec = (d/monthvals[m])*(temps[m+1]-temps[m])+temps[m];
    return(rec);
  }
  function recminT(d,m) { // return the daily record low for today
    var rec;
    var temps = [-43.6,-44.7,-41.1,-33.6,-23.35,-10,-1.95,-1.9,-8.25,-19.5,-30.35,-38.9,-43.6];
    var monthvals = [31,29,31,30,31,30,31,31,30,31,30,31];
    rec = (d/monthvals[m])*(temps[m+1]-temps[m])+temps[m];
    return(rec);
  }

	