// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.9.2/firebase-app.js";
import { getDatabase, ref, set, get, onValue, child } from "https://www.gstatic.com/firebasejs/9.9.2/firebase-database.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.9.2/firebase-analytics.js";

let test_json = '{"posX":0.0,"posY":0.0,"posZ":-1.1540000438690186,"rotX":0.0,"rotY":0.0,"rotZ":0.0}';
let test_result = JSON.parse(test_json);
console.log(test_result);

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
        if (retrieved.size != Object.keys(this.users).length) {
            let retrieved_keys = [];
            retrieved.forEach((retrieved_user_data) => {
                retrieved_keys.push(retrieved_user_data.key);
            });
            for (let key in this.users) {
                if (!key in retrieved_keys) {
                    delete this.users.key;
                }
            }
        }
    }
    print(){
        for (let key in this.users) {
            console.log(this.users[key]);
        }
    }
}

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

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const dbRef = ref(getDatabase());
const livePosList = new LivePosList(10);

class DatabaseComm {
    constructor() {
        //this.app = initializeApp(firebaseConfig);
        //this.db = getDatabase(this.app);
        //this.db_ref = ref(getDatabase());

        this.debug_count;

        //this.livePosList = new LivePosList(10);

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

var comm = new DatabaseComm();
comm.start();


 // set the dimensions and margins of the graph
 var margin = {top: 20, right: 20, bottom: 30, left: 50},
 width = 960 - margin.left - margin.right,
 height = 500 - margin.top - margin.bottom;

 // set the ranges
 var x = d3.scaleLinear().range([0, width]);
 var y = d3.scaleLinear().range([height, 0]);

 // append the svg obgect to the body of the page
 // appends a 'group' element to 'svg'
 // moves the 'group' element to the top left margin
 var svg = d3.select("body").append("svg")
    .attr("id", "main_canvas")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g").attr("transform",
       "translate(" + margin.left + "," + margin.top + ")");


x.domain([-5, 5]);
y.domain([-5, 5]);

// Add the valueline path.
/*
svg.append("path")
    .data([data])
    .attr("class", "line")
    .attr("d", valueline);
    */

// Add the X Axis
svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x));

// Add the Y Axis
svg.append("g")
    .call(d3.axisLeft(y));

var display_interval = window.setInterval(function(){
    for (let user_name in livePosList.users) {
        let data = livePosList.users[user_name].file;
        let color = livePosList.users[user_name].color;
        //console.log(color);
        d3.selectAll("." + user_name).remove();
        for (let i = 0; i < data.length; i ++) {
            //console.log(data.peek(i).x);
            //console.log(data.peek(i).z);
            svg.append("path")
            .attr("transform", "translate(" + x(data.peek(i).x) + ", " + y(data.peek(i).z) + ")")
            .attr("d", d3.arc()
              .innerRadius( 15 )
              .outerRadius( 20 )
              .startAngle( data.peek(i).rot_y - 1 )     // It's in radian, so Pi = 3.14 = bottom.
              .endAngle( data.peek(i).rot_y + 1 )       // 2*Pi = 6.28 = top
              )
            .attr('stroke', 'black')
            .attr('fill', '#' + color);
            /*
            .append("circle")
                .attr("class", user_name)
                .attr("cx", x(data.peek(i).x))
                .attr("cy", y(data.peek(i).z))
                .attr("r", 6)
                .style("fill", "green");
                */
        }
    }
}, 500);


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



function updateLivePos() {
    if ()
}
*/