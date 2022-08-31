// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.9.2/firebase-app.js";
import { getDatabase, ref, set, get, onValue, child } from "https://www.gstatic.com/firebasejs/9.9.2/firebase-database.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.9.2/firebase-analytics.js";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyAwDcSoSqko3I6uxszuLtcDnCvoIGH6vbA",
    authDomain: "mrat-passthrough-f5e34.firebaseapp.com",
    databaseURL: "https://mrat-passthrough-f5e34-default-rtdb.firebaseio.com",
    projectId: "mrat-passthrough-f5e34",
    storageBucket: "mrat-passthrough-f5e34.appspot.com",
    messagingSenderId: "447706271029",
    appId: "1:447706271029:web:eb9a55ca8903d552e0d07c",
    measurementId: "G-JF0P7XM5R7"
  };

/*

Modify this address to load scene

*/
const server_address = "http://192.168.56.1:8080/";
const json_file = "json/scene.json";

class LivePos {
    constructor() {
        this.x;
        this.y;
        this.z;
        this.rot_x;
        this.rot_y;
        this.rot_z;
    }
    parse(retrieved) {
        //console.log(retrieved);
        let obj = JSON.parse(retrieved);
        //console.log(retrieved.posX);
        this.x = obj.posX;
        this.y = obj.posY;
        this.z = obj.posZ;
        this.rot_x = obj.rotX;
        this.rot_y = obj.rotY;
        this.rot_z = obj.rotZ;
    }
}

class Queue {
    constructor() {
        this.elements = {};
        this.head = 0;
        this.tail = 0;
    }
    enqueue(element) {
        this.elements[this.tail] = element;
        this.tail++;
    }
    dequeue() {
        const item = this.elements[this.head];
        delete this.elements[this.head];
        this.head++;
        return item;
    }
    top() {
        return this.elements[this.head];
    }
    peek(id) {
        if (this.head + id >= this.tail) {
            return null;
        }
        return this.elements[this.head + id];
    }
    get length() {
        return this.tail - this.head;
    }
    get isEmpty() {
        return this.length === 0;
    }
}

class LivePosList {
    constructor(store_length) {
        this.users = {};
        this.store_length = store_length;
    }
    add(user) {//, delta_time) {
        let user_file = new Queue();
        this.users[user] = {};
        this.users[user].file = user_file;
        this.users[user].color = Math.floor(Math.random()*16777215).toString(16);

        //this.users[user].delta_time = delta_time;
    }
    delete(user) {
        delete this.users[user];
    }
    update(retrieved) {
        //console.log(retrieved);
        retrieved.forEach((retrieved_user_data) => {
            let retrieved_user = retrieved_user_data.key;
            let retrieved_data = retrieved_user_data.val();
            //console.log(retrieved_user);
            //console.log(retrieved_data);
            if (retrieved_user in this.users) {
                //if (this.users[user].file.length() > this.store_length / this.users[user].delta_time) {
                if (this.users[retrieved_user].file.length > this.store_length) {
                    this.users[retrieved_user].file.dequeue();
                }
                let obj = new LivePos();
                
                obj.parse(retrieved_data.headPos);
                this.users[retrieved_user].file.enqueue(obj);
            } 
            else {
                this.add(retrieved_user_data.key);//, retrieved_user_data.val().delta_time);
            }
        });
        //console.log(retrieved)
        if (retrieved.size != Object.keys(this.users).length) {
            console.log("Not same!");
            console.log(this.users);
            console.log(retrieved_user_data);

            let retrieved_keys = [];
            retrieved.forEach((retrieved_user_data) => {
                retrieved_keys.push(retrieved_user_data.key);
            });
            for (let key in this.users) {
                if (!key in retrieved_keys) {
                    delete this.users.key;
                }
            }
            console.log(this.users);
            console.log(retrieved_user_data);
        }
    }
    clear() {
        this.users = {};
    }
    print() {
        for (let key in this.users) {
            console.log(this.users[key]);
        }
    }
    get length() {
        return Object.keys(this.users).length;
    }
}

class DatabaseComm {
    constructor() {
        this.debug_count;
        this.fetch_interval;
    }
    start() {
        //this.debug_count = 0;
        this.fetch_interval = window.setInterval(function(){
            //console.log(this.debug_count);
            //if (this.debug_count > 3) {
            //    clearInterval(this.fetch_interval);
            //}
            get(child(dbRef, `livePos`)).then((snapshot) => {
                if (snapshot.exists()) {
                    livePosList.update(snapshot);            
                } else {
                    livePosList.clear();
                    console.log("No data available");
                }
                //livePosList.print();
                }).catch((error) => {
                console.error(error);
            });
            //this.debug_count ++;
        }, 500);
    }
    stop() {
        if (this.fetch_interval) {
            clearInterval(this.fetch_interval);
        }
    }
}

function update_axis(x, y) {
    d3.selectAll(".axis").remove();

    const xAxisGrid = d3.axisBottom(x).tickSize(-height).tickFormat("").ticks(10);
    const yAxisGrid = d3.axisLeft(y).tickSize(-width).tickFormat("").ticks(10);

    svg.append("g")
        .attr("class", "axis axis-grid")
        .attr("style", "opacity: 0.15")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxisGrid);

    svg.append("g")
        .attr("class", "axis axis-grid")
        .attr("style", "opacity: 0.15")
        .call(yAxisGrid);

    // Add the X Axis
    svg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0," + height / 2 + ")")
        .call(d3.axisBottom(x));

    // Add the Y Axis
    svg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(" + width / 2 + ", 0)")
        .call(d3.axisLeft(y));
}

function update_json_data() {
    fetch(server_address + json_file)
    .then((response) => response.json())
    .then((json) => {
        json_data = json;
    });
}

function scale_width(w) {
    return x(w) - x(0);
}

function scale_height(h) {
    return y(0) - y(h);
}

function to_radius(a) {
    /*
    let local_a = a % 360;
    if (local_a < 0) {
        local_a = local_a + 360;
    }
    */
    return a / 180 * Math.PI;
}

function update_display_users() {
    let local_x_length = 5;
    let local_y_length = 5;

    for (let user_name in livePosList.users) {
        let data = livePosList.users[user_name].file;
        let color = livePosList.users[user_name].color;
        //console.log(color);
        //d3.selectAll("." + user_name).remove();
        for (let i = 0; i < data.length; i ++) {
            //console.log(data.peek(i).x);
            //console.log(data.peek(i).z);
            let opacity;
            if (i == data.length - 1){
                opacity = 1;
            }
            else {
                opacity = 0.2 - 0.2 / (i + 1);
            }

            if (Math.abs(data.peek(i).x) > local_x_length) {
                local_x_length = Math.abs(data.peek(i).x);
            }
            if (Math.abs(data.peek(i).y) > local_y_length) {
                local_y_length = Math.abs(data.peek(i).z);
            }

            let mapped_start_angle = to_radius(data.peek(i).rot_y - 40);
            let mapped_end_angle = to_radius(data.peek(i).rot_y + 40);
            //console.log(mapped_rot_y);
            
            svg.append("path")
                .attr("class", user_name)
                .attr("class", "user_point")
                .attr("transform", "translate(" + x(data.peek(i).x) + ", " + y(data.peek(i).z) + ")")
                .attr("d", d3.arc()
                    .innerRadius(15)
                    .outerRadius(20)
                    .startAngle(mapped_start_angle)
                    .endAngle(mapped_end_angle)
                    )
                .attr("opacity", opacity)
                .attr("stroke", "black")
                .attr("fill", "#" + color);
            svg.append("circle")
                .attr("class", user_name)
                .attr("class", "user_point")
                .attr("cx", x(data.peek(i).x))
                .attr("cy", y(data.peek(i).z))
                .attr("r", 5)
                .attr("stroke", "black")
                .attr("fill", "#" + color);
        }

        if (local_x_length > 5) {
            x_length = local_x_length;
        }
        else {
            x_length = 5;
        }

        if (local_y_length > 5) {
            y_length = local_y_length;
        }
        else {
            y_length = 5;
        }
        
        legend.append("p")
            .text("■ " + user_name)
            .attr("class", "user_legend")
            .attr("style", 
                "color:#" + color
                + "; font-size: 150%"
                );
    }
}

function update_display_objects() {
    if (json_data) {
        for (let i = 0; i < json_data["Objects"].length; i ++) {
            //console.log(data.peek(i).x);
            //console.log(data.peek(i).z);
            let object_width = 0.5;
            let object_height = 0.5;
            let object_name = "";

            if ("width" in json_data["Objects"][i]) {
                object_width = json_data["Objects"][i].width;
            }
            if ("height" in json_data["Objects"][i]) {
                object_height = json_data["Objects"][i].height;
            }
            if ("name" in json_data["Objects"][i]) {
                object_name = json_data["Objects"][i].name;
            }

            let mapped_x = x(json_data["Objects"][i].x);
            let mapped_y = y(json_data["Objects"][i].y);
            let mapped_object_width = scale_width(object_width);
            let mapped_object_height = scale_height(object_height);
        
            svg.append("rect")
                .attr("class", "objects")
                .attr("x", mapped_x)
                .attr("y", mapped_y)
                .attr("width", mapped_object_width)
                .attr("height", mapped_object_height)
                .attr("opacity", "0.4")
                .attr("stroke", "black")
                .attr("fill", "#111111");

            svg.append("text")
                .attr("class", "objects")
                .text(object_name)
                .attr("x", mapped_x + mapped_object_width + scale_width(0.1))
                .attr("y", mapped_y + mapped_object_height);
        }
    }
}

function update_display() {
    d3.selectAll(".user_legend").remove();
    d3.selectAll(".user_point").remove();
    d3.selectAll(".objects").remove();

    x.domain([-x_length - 2, x_length + 2]);
    y.domain([-y_length - 2, y_length + 2]);
    update_axis(x, y);

    //console.log(livePosList.length);

    if (livePosList.length == 0) {
        legend.append("p")
            .text("No user data.")
            .attr("class", "user_legend")
            .attr("style", 
                "color:#000000"
                + "; font-size: 150%"
                );
    }
    else {
        update_display_users();
    }
    update_display_objects();
    
}

var json_data = "";

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const dbRef = ref(getDatabase());
const livePosList = new LivePosList(10);

var comm = new DatabaseComm();
comm.start();

var margin = {top: 20, right: 20, bottom: 30, left: 50},
width = 960 - margin.left - margin.right,
height = 500 - margin.top - margin.bottom;

var x = d3.scaleLinear().range([0, width]);
var y = d3.scaleLinear().range([height, 0]);

var svg = d3.select("body").append("svg")
    .attr("id", "main_canvas")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g").attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

var legend = d3.select("body").append("div")
    .attr("id", "user_legend");

//Default axis size
var x_length = 5;
var y_length = 5;

update_json_data();
var json_fetch_interval = window.setInterval(update_json_data, 5000);

update_display();
var display_interval = window.setInterval(update_display, 200);




// Initialize Firebase
//const app = initializeApp(firebaseConfig);
//const db = getDatabase(app);
//const dbRef = ref(getDatabase());
//let recording_name_list = [];

/*
var debug_count = 0;

let livePostList = new LivePosList(10);

var fetch_interval = window.setInterval(function(){
    if (debug_count > 3) {
        clearInterval(fetch_interval);
    }
    get(child(dbRef, `livePos`)).then((snapshot) => {
        if (snapshot.exists()) {
            livePostList.update(snapshot);            
        } else {
            console.log("No data available");
        }
        livePostList.print();
        }).catch((error) => {
        console.error(error);
    });
    debug_count ++;
}, 1000);
*/

/*
get(child(dbRef, `recordings_info_list`)).then((snapshot) => {
    if (snapshot.exists()) {
        //console.log(snapshot.val());
        snapshot.forEach((childSnapshot) => {
            recording_name_list.push(childSnapshot.key)
            const childData = childSnapshot.val();
            console.log(childData);
        // ...
        });
        console.log(recording_name_list);
        
    } else {
        console.log("No data available");
    }
    }).catch((error) => {
    console.error(error);
});

*/