
/**
 * This is the main programmatic entry point for the project.
 */
import {IInsightFacade, InsightResponse, QueryRequest} from "./IInsightFacade";
import CourseResp from "./CourseResp"
import Log from "../Util";
import {isUndefined} from "util";
import {readFile} from "fs";
import {isBoolean} from "util";
//import {treeAdapters} from "parse5";
import {isNullOrUndefined} from "util";
import {isNull} from "util";


var JSZip = require("jszip");
var fs = require('fs');
var parse5 = require('parse5');
var stored : Map<string,any>;
var http = require('http');
var orderarray : any[];


export default class InsightFacade implements IInsightFacade {

    constructor() {
        Log.trace('InsightFacadeImpl::init()');
        stored = new Map<string,any>();
        orderarray = [];
    }

    addDataset(id: string, content: string): Promise<InsightResponse> {

        var tot_res_str: Object[] = [];
        var tot_res_filt: Object[] = [];
        var tot_res: CourseResp = new CourseResp();
        let meaningful_data_check: boolean = false;

        return Promise.resolve()
            .then(()=>{
                var options = {base64: true};
                let temp_id = './' + id + '.txt';
                //check local storage
                if (stored.has(id)) {
                    //console.log('File exists: ' + temp_id);
                    tot_res.set_code(201);
                    tot_res.set_body('the operation was successful and the id already existed');
                }
                else {
                    //console.log('File did not exist: ' + temp_id);
                    tot_res.set_code(204);
                    tot_res.set_body('the operation was successful and the id was new');
                }
                return JSZip.loadAsync(content, options)})
            .then((contentInZip: any) => {
                var promiseTracker: Array<Promise<string>> = [];
                switch (id) {

                    case 'courses':
                        try {
                            contentInZip.forEach((filepath: any) => {
                                if (filepath !== ('courses/')) {
                                    promiseTracker.push(contentInZip.file(filepath).async("string"));
                                }
                            });
                        } catch (err) {
                            tot_res.set_code(400);
                            tot_res.set_body({"error": '"' + err + '"'});
                            //Reject(tot_res);
                            throw tot_res
                        }
                        break;

                    case 'rooms':
                        try {
                            var roomsFolder = new JSZip();
                            roomsFolder = contentInZip.folder('campus').folder('discover').folder('buildings-and-classrooms');
                            roomsFolder.forEach((filepath: any) => {
                                if (filepath !== '.DS_Store')
                                    promiseTracker.push(roomsFolder.file(filepath).async("string"));
                            });
                            //roomsFolder.remove('.DS_Store');
                        } catch (err) {
                            tot_res.set_code(400);
                            tot_res.set_body({"error": '"' + err + '"'});
                            //Reject(tot_res);
                            throw tot_res
                        }
                        break;
                }

                return Promise.all(promiseTracker)})
            .then((contents: any) => {
                meaningful_data_check = false;
                if (id == 'courses') {
                    let jsonInput: {[key: string]: any};
                    for (let aContent of contents) {
                        try {
                            jsonInput = JSON.parse(aContent);
                            if (jsonInput['result'].length > 0) {
                                for (let subObject of jsonInput['result'])
                                    tot_res_str.push(subObject);
                                meaningful_data_check = true;
                            }
                        }
                        catch (err) {
                            tot_res.set_code(400);
                            tot_res.set_body({"error": '"' + err + '"'});
                            throw tot_res
                        }
                    }
                    return Promise.resolve(tot_res_str);
                }
                else if (id == 'rooms') {
                    let htmlInputPromises: Promise<any>[] = [];

                    for (let aContent of contents) {
                        htmlInputPromises.push(cleanHTML(aContent));

                    }

                    // console.log(htmlInputPromises);
                    return Promise.all(htmlInputPromises)
                        .then((htmlInputs: any) => {
                            try {
                                // console.log('done parsing');

                                let htmlInput : any = [];

                                for(let element of htmlInputs){
                                    if(element !== []){
                                        htmlInput = htmlInput.concat(element);
                                    }
                                }
                                // console.log(htmlInput);

                                if (htmlInput.length > 0) {
                                    //console.log('htmlInput.length > 0');
                                    // console.log(htmlInput);
                                    for (let subObject of htmlInput)
                                        tot_res_str.push(subObject);
                                    meaningful_data_check = true;
                                }
                            }
                            catch (err) {
                                tot_res.set_code(400);
                                tot_res.set_body({"error": '"' + err + '"'});
                                throw tot_res
                            }
                            return Promise.resolve(tot_res_str);
                        });

                }
                else{
                    throw {code:400 , body : {"error": '"invalid id name"'}}
                }
            })
            .then((tot_res_str: any) => {
                // console.log('have tot_res_str');
                if (meaningful_data_check == false) {
                    //console.log('meaningful_data_check == false');
                    tot_res.set_code(400);
                    tot_res.set_body({"error": '"' + 'No Meaningful Data in JSON' + '"'});
                    throw tot_res
                }
                //checking valid JSON
                if (!json_validator(JSON.stringify(tot_res_str))) {
                    // console.log('!json_validator(JSON.stringify(tot_res_str))');
                    tot_res.set_code(400);
                    tot_res.set_body({"error": '"' + 'Not a valid JSON' + '"'});
                    throw tot_res
                }
                if(id === 'courses') {
                    for (var i = 0; i < tot_res_str.length; i++) {
                        let temp_json_ret: Object = cleanJSON(tot_res_str[i]);
                        if (temp_json_ret !== null) tot_res_filt.push(temp_json_ret);
                    }
                }
                else if(id ==='rooms'){
                    tot_res_filt = tot_res_str;
                }

                if (tot_res_filt.length != 0)
                // console.log('tot_res_filt.length != 0');
                    tot_res.set_body(tot_res_filt);

                stored.set(id,tot_res_filt);
                //console.log(stored);

                var temp_str = id + ".txt";

                try {
                    fs.writeFile(temp_str, JSON.stringify(tot_res_filt), function (err: any) {
                    })
                }
                catch (err) {
                    tot_res.set_code(400);
                    tot_res.set_body({"error": '"' + err + '"'});
                    throw tot_res
                }
                return tot_res;

            })
            .catch((err:any)=>{
                throw {code:400 , body : {"error": '"' + err + '"'}}
                //throw errors accordinly
            });
    }

    removeDataset(id: string): Promise<InsightResponse> {
        // global vars
        var temp_del = './' + id + '.txt';
        var cr: CourseResp = new CourseResp();
        // delete from local storage if it exists
        if (stored.has(id)){
            stored.delete(id);
        }
        //delete from disk
        return new Promise((Fulfill, Reject) => {
            fs.stat(temp_del, (err: any, stats :any) => {
                if (err) {
                    Reject({code: 404, body: {"error": '"' + err + '"'}});
                }
                fs.unlink(temp_del, (err:any) => {
                    if (err) {
                        Reject({code: 404, body: {"error": '"' + err + '"'}});
                    }
                    else Fulfill({code: 204, body: {}});  // the data was successfully removed
                })
            })
        }).catch(function (err: any) {
            return new Promise(function(fulfill, reject) {
                reject({code: 404, body: {"error": '"' + err + '"'}});
            });
        });
    }

    performQuery(query: QueryRequest): Promise <InsightResponse> {
        var temp_result_array: Object[] = [];
        let idstrPath :string = null;
        let idstr:string = null;
        let queryIN : any = null;
        let result_array : any[] = [];
        // checking for valid JSON
        try {
            // Check that query is valid JSON.
            queryIN = JSON.parse(JSON.stringify(query));
        }
        catch (err) {
            return new Promise(function(fulfill, reject) {
                reject({code: 400, body: {"Error": "Invalid JSON in performQuery"}});
            });
        }

        if(!isQueryValid(queryIN)){
            return new Promise(function(fulfill, reject) {
                reject({code: 400, body: {"Error": "Invalid Query in isQueryValid"}});
            });

        }

        let optionsColumnVal= queryIN['OPTIONS']['COLUMNS'];
        for(let columnkey of optionsColumnVal){
            let courseTest = columnkey.substr(0, 7);
            let roomsTest = columnkey.substr(0, 5);

            // assign switch value (rooms or courses)
            if (courseTest == 'courses') {
                idstr = 'courses';
                break;
            }
            else if (roomsTest == 'rooms'){
                idstr = 'rooms';
                break;
            }
        }

        if(idstr == null){
            return new Promise(function (fulfill, reject) {
                reject({code: 424, body: {"Error": "Invalid course id given"}});
            });
        }

        idstrPath = "./" + idstr + ".txt";
        // console.log('Successfully parsed file');
        let options= queryIN['OPTIONS'];
        let columns = options['COLUMNS'];


        let transformations = queryIN['TRANSFORMATIONS'];

        let where = query['WHERE'];
        let order: string;
        if (options.hasOwnProperty('ORDER'))
            order = options['ORDER'];
        let whereFilters = Object.keys(where);

        //getting the idstr

        return handleData(idstr).then( () => {
            let whereKeys = Object.keys(where);
            let filterVal = whereKeys[0];
            let globalObjects : any = stored.get(idstr);
            globalObjects.map((course: any) => {
                try {
                    if (whereKeys.length == 0)
                        temp_result_array.push(course);
                    else {
                        if (filters(course,filterVal, where[filterVal])) { //
                            temp_result_array.push(course);
                        }
                    }

                }
                catch (err) {
                    throw "err";
                }
            });

            if(transformations) {
                if (transformations.hasOwnProperty('APPLY') && transformations.hasOwnProperty('GROUP')) {
                    let groups = transformations["GROUP"];
                    let grouped_Result_array = createGroup(temp_result_array, groups);
                    temp_result_array = handleGroupApply(grouped_Result_array, transformations,columns );
                }
            }

            if(!options.hasOwnProperty('ORDER'))
                result_array = temp_result_array;
            if(options.hasOwnProperty('ORDER')) {
                let optionstest : any = options['ORDER'];
                if ( typeof(optionstest) === 'string') {
                    result_array = sortResult(temp_result_array, order);
                } else if (!isNullOrUndefined(optionstest) ){
                    let directiontest : string = optionstest['dir'];
                    orderarray = optionstest['keys'];

                    if (directiontest == 'UP') result_array = temp_result_array.sort(sortall(orderarray,false));
                    else result_array = temp_result_array.sort(sortall(orderarray,true));
                }
                else {
                    throw "err";
                }
            }
            orderarray = [];
            let testKeys = Object.keys(query);
            result_array = createResult(result_array,columns);
            return new Promise(function(fulfill, reject) {
                fulfill({code: 200 , body : {render: 'TABLE', result : result_array}});
            });
        }).catch((err:any) => {
            if (!(err instanceof Object)) {
                return new Promise(function (resolve, reject) {
                    reject({code: 400, body: {"Error": err}});
                });
            }
            else return new Promise(function (resolve, reject) {
                //console.log(' in the wrong error spot part 2')
                reject(err);
            });
        });


    }

}

function handleGroupApply(arrayin : Array<any>, trans:QueryRequest, column: Array<any>): Array<any>{
    // this will handle grouping/applying
    //GROUP: Grab every unique value of each key in array
    let apply = trans['APPLY'];



    //console.log(groupMap);

    if(apply.length > 0) {
            let applyKey = Object.keys(apply)[0];
            for (var aGroup of arrayin){
                let index = arrayin.indexOf(aGroup);
                arrayin[index] = Apply(aGroup, apply, applyKey);
            }

    }

    else{
        //result = buildTransform(arrayin, apply, Array.from(column), Array.from(group), [], 0, {});
       // console.log(result);
    }

    var endArray = []
    for(let arrayObject of arrayin){
        let resultObjects = Object.keys(arrayObject)[0];

        let endObject = JSON.parse(resultObjects);
        endArray.push(endObject);
    }


return endArray;
}

function Apply(arrayToApply: Array<any>, apply: Array<any>, applyKey: string): any{
    let tempObject : {[key: string]: any} = {};
    var resultKey: any = Object.keys(arrayToApply)[0];
    var arrayObject = arrayToApply[resultKey];
    var resultObject = JSON.parse(resultKey);

    for(let applyObject of apply){
            var newColumn = Object.keys(applyObject)[0];
            var newColumnObject = applyObject[newColumn];
            var applySpecKey = Object.keys(newColumnObject)[0];
            var column = newColumnObject[applySpecKey];


            switch(applySpecKey){
                case "MAX":
                    if (typeCheckField(column) !== "number")
                        break;
                    resultObject[newColumn] = applyMax(arrayObject, column);
                    break;
                case "MIN":
                    if (typeCheckField(column) !== "number")
                        break;
                    resultObject[newColumn] = applyMin(arrayObject, column);
                    break;


                case "AVG":
                    if (typeCheckField(column) !== "number")
                        break;
                    resultObject[newColumn] = applyAVG(arrayObject, column);
                    break;


                case "SUM":
                    if (typeCheckField(column) !== "number")
                        break;
                    resultObject[newColumn] = applySum(arrayObject, column);
                    break;
                case "COUNT":
                    resultObject[newColumn] = applyCount(arrayObject, column);
                    break;

            }



        }
    // update new key
    let afterApplyKey = JSON.stringify(resultObject);
    tempObject[afterApplyKey] = arrayObject;

    return tempObject;



}


function findArrayToApply(map : any) : Array<any>{
    var arrayToApply: any = null;
    //console.log(map);
    if(Array.isArray(map)) {
        arrayToApply = map;
        return Array.from(arrayToApply);
    }

    let mapKeys = Array.from(map.keys());

    for(let aMapKey of mapKeys){
        if(Array.isArray(map.get(aMapKey))){
            arrayToApply =  map.get(aMapKey);
            return arrayToApply;
        }
        arrayToApply = findArrayToApply(map.get(aMapKey));
    }
    return Array.from(arrayToApply);
}

function createGroup(result: Array<any>, groupTerms: Array<any>): Array<any> {
    let map: Map<string, any> = new Map<string,any>();
    let level = 0;
    let group_array : Array<any> = [];

    for(let anElement of result){
        let grouping :{[key: string]: any} = {};
        for(let groupKey of groupTerms){
            grouping[groupKey] = anElement[groupKey];
        }

        let groupStringified = JSON.stringify(grouping);
        if(map.has(groupStringified)){
           let groupedArray =  map.get(groupStringified);
           groupedArray.push(anElement);
        }
        else{
            let tempArray : Array<any> =  [];
            map.set(groupStringified, tempArray);
            tempArray.push(anElement);
            level++;
        }

    }
    map.forEach(function(value,key,map){
        let tempObject : {[key: string]: any} = {};
        tempObject[key] = value;
        group_array.push(tempObject)


    })
    //console.log(map);
    //console.log("Group_array");
    //console.log(group_array);

    return group_array

}

function applyMax(arrayin : Array<any>, field : string) : number{
    let max = 0;
    for( let anElement of arrayin){
            if (anElement[field] > max){
                max = anElement[field];
            }




    }
    return max;

}

function applyMin(arrayin : Array<any>, field : string) : number{
    var min = 10000;

    for (let anEntry of arrayin){
        if (anEntry[field] < min){
            min = anEntry[field];
        }
    }
    return min;

}

function applyAVG(arrayin : Array<any>, field : string): number{
    let sum = 0;

    for(let anEntry of arrayin){
        let value = anEntry[field];
        value = value * 10;
         value = Number(value.toFixed(0));
        sum += value;
    }

    let avg = sum / arrayin.length;
    avg = avg /10;
    let res = Number(avg.toFixed(2));
    return res;
}

function applySum(arrayin : Array<any>, field : string): number {
    let total = 0;

    for(let anEntry of arrayin){
        let value = anEntry[field];
        total += value;
    }
    return total;
}

function applyCount(arrayin : Array<any>, field : string): number{
    let countArray : Array<any> = [];

    for(let arrayElement of arrayin){
        if(countArray.indexOf(arrayElement[field]) === -1)
            countArray.push(arrayElement[field]);
    }

    return countArray.length;
}

function handleData(id:string) : Promise<InsightResponse> {
    let file : string = "./" + id + ".txt";
    let strid : string = id;
    return new Promise (function (fulfill, reject) {
        fs.stat(file, (err:any, stats :any) => {
            if(err) {
                reject({code: 424, body: {'missing' : [strid]}})
            }
            else
            {
                fs.readFile(file, (err: any, data: any ) => {
                    if (err) {
                        // throw a general fail
                        reject({code: 424, body: {'missing' : [strid]}});
                    }
                    else {
                        try {
                            let dataout: any = JSON.parse(data);       // data string -> JSON
                            addStored(strid,dataout);
                            fulfill('code doesnt matter here');
                        }
                        catch (e) {
                            reject({code: 424, body: {'missing' : [strid]}})
                        }
                    }
                });

            }
        })
    });
}

function filters(course_in: any, filterVal : string, qBody:any): boolean {

    // course in is the SINGLE course map
    // filterval is the value of THIS filter
    //  qBody is nested value for query body
    let body_ind: any = Object.keys(qBody)[0];
    if(body_ind == '' || qBody == null) {
        throw "err";
    } // this shouldn't happen, but could if we parsed incorrectly (since it got caught in our caller's check)


    switch (filterVal) {
        case "AND":
            let filterpass: boolean = true;
            if (qBody instanceof Array) {
                if (qBody.length == 0) {
                    throw "err";
                }
                for (let x in qBody) {
                    let andfilters: any = Object.keys(qBody[x]);
                    let andBody: any = qBody[x];
                    andBody = andBody[andfilters[0]];
                    filterpass = filterpass && filters(course_in, andfilters[0], andBody);
                }
            }
            return filterpass;

        case "OR":
            let filterpass2: boolean = false;
            if (qBody instanceof Array) {
                if (qBody.length == 0) {
                    throw "err";
                }
                for (let y in qBody) {
                    let orfilters: any = Object.keys(qBody[y]);
                    if (orfilters == []) throw "err";
                    let orBody: any = qBody[y];
                    orBody = orBody[orfilters[0]];
                    filterpass2 = filterpass2 || filters(course_in, orfilters[0], orBody);
                }
            }
            return filterpass2;

        case "LT":
            return filterLessThan(course_in,qBody)

        case "GT": {//greater than this number
            return filterGreaterThan(course_in,qBody)
        }

        case "EQ":
            return filterEquals(course_in,qBody)


        case "NOT":
            let filterpass3 : boolean = true;
            if (qBody instanceof Object) {
                let notfilter: any = Object.keys(qBody)[0];
                filterpass3 = filterpass3 && !filters(course_in, notfilter, qBody[notfilter]);
                return filterpass3;
            }
            else {
                throw "err";
            }

        case "IS":
            return filterIs(course_in,qBody);
        default :
            throw "err";
    }

}

function addStored(hash_key:string, datain: any) {
    stored.set(hash_key,datain)
}

function filterGreaterThan(course_in:any, body_in:any): boolean{
    let keyval : any = Object.keys(body_in)[0];
    if (typeof(body_in[keyval]) != "number") throw "err";
    let test_num : number = body_in[keyval];
    let courseVal = keyfinder(keyval, course_in);
    if (courseVal > test_num) {
        return true;
    }
    else {
        return false;
    }
}


function filterLessThan(course_in:any, body_in:any): boolean{
    let keyval : any = Object.keys(body_in)[0];
    if (typeof(body_in[keyval]) != "number") throw "err";
    let test_num : number = body_in[keyval];
    let courseVal = keyfinder(keyval, course_in);
    if (courseVal < test_num) {
        return true;
    }
    else {
        return false;
    }
}

function filterEquals(course_in:any, body_in:any): boolean{
    let keyval : any = Object.keys(body_in)[0];
    if (typeof(body_in[keyval]) != "number") throw "err";
    let test_num : number = body_in[keyval];
    let courseVal = keyfinder(keyval, course_in);
    if (courseVal === test_num) {
        return true;
    }
    else {
        return false;
    }
}


function filterIs(course_in:any, body_in:any): boolean{

    let keyval : any = Object.keys(body_in)[0];


    if (typeof(body_in[keyval]) != "string") throw "err";
    let compStr : string = body_in[keyval];

    let compStrArray = compStr.split("");
    let courseVal = keyfinder(keyval, course_in);


    // check for wildcard string

    let strLength = compStr.length;
    let wildcard = -1;

    if (compStrArray[0] === "*" && compStrArray[strLength-1] === "*") {
        wildcard = 0;
        compStr = compStr.slice(1,strLength-1);
    }
    else if(compStrArray[0] === "*"){
        wildcard = 1;
        compStr = compStr.slice(1);
    }
    else if (compStrArray[strLength-1] === "*"){
        wildcard =2;
        compStr = compStr.slice(0,strLength-1);
    }

    try{

        switch(wildcard){
            case -1:
                if(courseVal === compStr)
                    return true;
                break;
            case 0:
                if(courseVal.indexOf(compStr) > -1)
                    return true;
                break;
            case 1:
                if(courseVal.endsWith(compStr))
                    return true;
                break;
            case 2:
                if(courseVal.startsWith(compStr))
                    return true;
                break;
        }
        return false;
    }
    catch(err){
        //console.log("Error: " + err);
        return false;

    }
}

function createResult(Courses: any[], columns: Array<string>): any[] {
    let newObject : {[key:string]: any} = {};
    let resultsArray = [];
    //let columnKeys = Object.keys(columns);

    let category: string;
    category = "";
    for (let course_in of Courses) {
        newObject = {};
        for (category of columns) {
            if (course_in.hasOwnProperty(category)) {
                newObject[category] = course_in[category];

            }
        }
        if (newObject != {}) resultsArray.push(newObject);
    }

    return resultsArray;
}

function sortResult(resultsArray: any, order: string) : Array<Object>{
    return resultsArray.sort(function(element1:any,element2:any) {
        if(element1[order] < element2[order]) {
            return -1;
        }
        if(element1[order] > element2[order]){
            return 1;
        }
        return 0;
    });
}

//Check if fields in WHERE is valid
//idtype is 'c' for courses or 'r' for rooms
function checkColumnToFilter(column: string, idtype:string) : boolean {
    var validKeys :string[] = null;
    if(column.indexOf(" ") > -1)
        return false;
    if (idtype == 'c') {
        validKeys = ['courses_dept', 'courses_id', 'courses_avg', 'courses_instructor', 'courses_title',
            'courses_pass', 'courses_fail', 'courses_audit', 'courses_uuid','courses_year'];
    }
    if (idtype == 'r'){
        validKeys = ['rooms_fullname', 'rooms_shortname', 'rooms_number', 'rooms_name', 'rooms_address','rooms_lat',
            'rooms_lon', 'rooms_seats', 'rooms_type', 'rooms_furniture', 'rooms_href'];
    }
    if(validKeys.indexOf(column) > -1){
        let length = validKeys[validKeys.indexOf(column)].length;
        if(column.length === length)
            return true;

    }

    return false;
}

function typeCheckField( field: string): string{
    let stringArray = ["courses_dept", "courses_id", "courses_instructor", "courses_title", "courses_uuid", "rooms_fullname",
        "rooms_shortname", "rooms_number", "rooms_name", "rooms_address", "rooms_type", "rooms_furniture", "rooms_href"];
    let numArray = ["rooms_lat", "rooms_lon", "rooms_seats", "courses_year", "courses_avg", "courses_pass", "courses_fail", "courses_audit"];

    if (stringArray.indexOf(field) > -1)
        return "string";
    if (numArray.indexOf(field) > -1)
        return "number";


    return "none";
}

function isQueryValid(query: QueryRequest) : boolean {
    var colswitch = null;
    let queryKeys = Object.keys(query);

    if (!query.hasOwnProperty("OPTIONS"))
        return false;
    let optionsObj = query['OPTIONS'];
    if (!isOPTIONSValid(optionsObj))
        return false;
    let columnsObj = optionsObj["COLUMNS"];
    if (columnsObj.length < 1 || columnsObj[0] === {} || columnsObj ===[] )
        return false;
    try{
    for (let columnkey of columnsObj) {
        let courseTest = columnkey.substr(0, 7);
        let roomsTest = columnkey.substr(0, 5);

        // assign switch value (rooms or courses)
        if (courseTest == 'courses') {
            colswitch = 'c';
            break;
        }
        else if (roomsTest == 'rooms') {
            colswitch = 'r';
            break;
        }
    }}
    catch(e){
        return false;
    }
    //Check if TRANSFORMATION is valid
    if (queryKeys.indexOf("TRANSFORMATIONS") > -1) {
        var transformObj = query["TRANSFORMATIONS"];
        if (!istransVALID(transformObj, colswitch))
            return false;
    }
    else {
        var transformObj = null;
    }

    if (queryKeys.indexOf('OPTIONS') === -1 || queryKeys.indexOf("WHERE") === -1)
        return false;

    let whereObj = query['WHERE'];

    if (whereObj === {} && transformObj === null)
        return false;

    if (!isWHEREValid(whereObj))
        return false;


    if (optionsObj.hasOwnProperty("ORDER"))
        var orderObj = optionsObj["ORDER"];
    else
        var orderObj = null;

    if (!isCOLUMNSValid(columnsObj, transformObj, colswitch))
        return false;


    if(!isNullOrUndefined(orderObj)) {
        if (typeof orderObj !== 'string' && !(orderObj instanceof Object))
            return false;
        if (!isOrderValid(orderObj, transformObj, colswitch, columnsObj))
            return false;

    }


    return true;

}

function isOrderValid(orderObj:any, transObj:any, colSwitch: string, columnObj:any) : boolean {


    if(typeof orderObj === "string") {
        if (orderObj === '')
            return false;
        if (!isNullOrUndefined(transObj)) {
            var applyObj = transObj["APPLY"];
            for (let anApplyObj of applyObj) {
                let applykeys = Object.keys(anApplyObj)[0];
                if (orderObj === applykeys)
                    return true;
            }
        }
        if (!checkColumnToFilter(orderObj, colSwitch))
            return false;
        if (columnObj.indexOf(orderObj) === -1)
            return false;
    }

    if(orderObj instanceof Object){
        if(!orderObj.hasOwnProperty("dir") || !orderObj.hasOwnProperty("keys"))
            return false;
        let dir = orderObj["dir"];
        if(dir !== "UP" && dir !== "DOWN")
            return false;
        let keys = orderObj["keys"];
        if(!isNullOrUndefined(transObj)) {
            let groupObj : Array<string> = transObj["GROUP"];
            let applyObj = transObj["APPLY"];

            if(applyObj.length === 0){
                for (let akey of keys){
                    if(akey.indexOf("_") === -1)
                        return false;
                }
            }

            if(!isNullOrUndefined(applyObj) && applyObj.length > 0) {

                for(let anApplyObj of applyObj) {
                    let applykeys = Object.keys(anApplyObj)[0];

                    // Check if column keys are in group (if has "_") or apply
                    for (let columnKey of columnObj) {
                        if (typeof columnKey !== "string")
                            return false;
                        if (columnKey.indexOf("_") > -1) {
                            if (groupObj.indexOf(columnKey) === -1)
                                return false;
                        }
                    }
                }
            }
        }
        else {
            for (let akey of keys) {
                if (!checkColumnToFilter(akey, colSwitch))
                    return false;
            }
        }

    }
    return true;

}

function istransVALID(transObj:any, colSwitch: string) : boolean{
    if(!transObj.hasOwnProperty("GROUP")|| !transObj.hasOwnProperty("APPLY") )
        return false;

    let tokenArray = ["MAX", "MIN", "AVG", "COUNT", "SUM"];

    let groupObj = transObj["GROUP"];
    let applyArray = transObj["APPLY"];

    for(let groupKey of groupObj){
        if(groupKey.indexOf("_") === -1)
            return false;
    }


    let applyKeyArray : Array<any> = [];
    //check if apply object is  valid
    for(let applyObj of applyArray){
        let applyKey = Object.keys(applyObj)[0];
        if(applyKeyArray.indexOf(applyKey) > -1){
            return false;
        }

        if(typeof applyKey !== "string")
            return false;
        if(applyKey.indexOf("_") > -1)
            return false;

        let applyTokenObj = applyObj[applyKey];
        let applyTokenKey = Object.keys(applyTokenObj)[0];
        if(tokenArray.indexOf(applyTokenKey) === -1)
            return false;

        let key = applyTokenObj[applyTokenKey];

        if(!checkColumnToFilter(key, colSwitch))
            return false;
    }


    return true;
}

function isCOLUMNSValid(columnObj: Array<string>, transformObj: any, colswitch:string) : boolean {

    //every key in column must be in either group or apply
    if(!isNullOrUndefined(transformObj)) {
        let groupObj : Array<string> = transformObj["GROUP"];
        let applyObj = transformObj["APPLY"];
        if(applyObj.length > 0) {
            if (!isNullOrUndefined(applyObj)) {
                //get all the keys from applyObj
                var applyKeys = [];
                for (let anApplyObj of applyObj) {
                    applyKeys.push(Object.keys(anApplyObj)[0]);
                }
                // Check if column keys are in group (if has "_") or apply
                for (let columnKey of columnObj) {
                    if (typeof columnKey !== "string")
                        return false;
                    if (columnKey.indexOf("_") > -1) {
                        if (groupObj.indexOf(columnKey) === -1)
                            return false;
                    }
                    else {
                        if (applyKeys.indexOf(columnKey) === -1)
                            return false;
                    }
                }

            }
        }
    }
    else {
        for (let columnKey of columnObj) {
            if (!checkColumnToFilter(columnKey, colswitch))
                return false;
        }
    }
    return true;
}

function isWHEREValid(whereObj: any) : boolean {
    //check if where has only one filter
    if(Object.keys(whereObj).length === 0)
        return true;
    if(Object.keys(whereObj).length > 1)
        return false;

    //WHERE hase one key, check if whereKey is a valid filter
    let whereKey = Object.keys(whereObj)[0];
    if(typeof whereKey !== "string")
        return false;
    let filters = ['AND', 'OR', 'LT', 'GT', 'IS', 'NOT', 'EQ'];
    if(filters.indexOf(whereKey) == -1)
        return false;

    return true;

}

function isOPTIONSValid(optionsObj:any) : boolean {
    let optionsKeys = Object.keys(optionsObj);

    // check if COLUMNS and VIEW exist
    if(optionsKeys.indexOf("COLUMNS") == -1  || optionsKeys.indexOf("FORM") == -1)
        return false;

    if(optionsObj['FORM'] !== 'TABLE') return false;

    return true;
}

function cleanJSON(fileToParse: {[key: string]: any}): {[key: string]: any} {
    var jsonContentToReturn: {[key: string]: any} = {
        'courses_dept': "",
        'courses_id': "",
        'courses_avg': 0,
        'courses_instructor': "",
        'courses_title': "",
        'courses_pass': 0,
        'courses_fail': 0,
        'courses_audit': 0,
        'courses_uuid': "",
        'courses_year': 0
    };
    try {
        if (fileToParse === [])
            return null;
        else {

            if (fileToParse.hasOwnProperty("Subject")) {
                jsonContentToReturn['courses_dept'] = fileToParse['Subject']
            }
            ;
            if (fileToParse.hasOwnProperty("Course")) {
                jsonContentToReturn['courses_id'] = fileToParse['Course']
            }
            ;
            if (fileToParse.hasOwnProperty("Avg")) {
                jsonContentToReturn['courses_avg'] = fileToParse['Avg']
            }
            ;
            if (fileToParse.hasOwnProperty("Professor")) {
                jsonContentToReturn['courses_instructor'] = fileToParse['Professor']
            }
            ;
            if (fileToParse.hasOwnProperty("Title")) {
                jsonContentToReturn['courses_title'] = fileToParse['Title']
            }
            ;
            if (fileToParse.hasOwnProperty("Pass")) {
                jsonContentToReturn['courses_pass'] = fileToParse['Pass']
            }
            ;
            if (fileToParse.hasOwnProperty("Fail")) {
                jsonContentToReturn['courses_fail'] = fileToParse['Fail']
            }
            ;
            if (fileToParse.hasOwnProperty("Audit")) {
                jsonContentToReturn['courses_audit'] = fileToParse['Audit']
            }
            ;
            if (fileToParse.hasOwnProperty("id")) {
                jsonContentToReturn['courses_uuid'] = fileToParse['id']
            }
            ;
            if (fileToParse.hasOwnProperty("Year")) {
                let numret : number  = parseFloat(fileToParse['Year'])
                if(fileToParse.hasOwnProperty("Section")){
                    if (fileToParse['Section'] == "overall")
                        numret = 1900;
                }
                jsonContentToReturn['courses_year'] = numret;
            }
            ;
        }
        if (jsonContentToReturn['courses_dept'] == "" &&
            jsonContentToReturn['courses_id'] == "" &&
            //jsonContentToReturn['courses_avg'] === 0 &&
            jsonContentToReturn['courses_instructor'] == "" &&
            jsonContentToReturn['courses_title'] == "" &&
            //jsonContentToReturn['courses_pass'] === 0 &&
            //jsonContentToReturn['courses_fail'] === 0 &&
            //jsonContentToReturn['courses_audit'] === 0 &&
            jsonContentToReturn['courses_uuid'] === "" &&
            jsonContentToReturn['courses_year'] === 0
        ){
            return null;
        }
        else {

            return jsonContentToReturn;
        }

    }
    catch (err) {
        return null;
    }
}

// should return Array<Object>
function cleanHTML(fileToParse: any) : Promise<any> {
    return new Promise((fulFill,reject) => {
        try {
            let buildingName: any = null
            let buildingsAddress: any = null
            let buildingsShort: any = null
            var arrayOFRooms: any = [];
            let table: any = null;
            if (typeof fileToParse !== "string") {
                // console.log('cleanHTML error')
                return null;
            }
            const htmlDoc = parse5.parse(fileToParse, {
                treeAdapter: parse5.treeAdapters.default
            });
            let body = getToBody(htmlDoc);

            table = getTable(body);

            if (table !== null && (typeof table !== 'undefined')) {                                        // rooms exist
                buildingName = findFullName(findBuilding(body, "buildings-wrapper"));
                buildingsAddress = findRoomAddress(findBuilding(body, "building-info"));
                buildingsShort = findShortName(findBuilding(body, 'skip'));
            }
            else{
                fulFill(arrayOFRooms);
                return;
            }

            let address = encodeURIComponent(buildingsAddress);
            //  console.log('right infront of getLocation and url: ' + address);
            return Promise.resolve(getLocation(address)).then((data: any) => {
                //console.log('Got Data' + data['lat'] + "," + data['lon']);

                var roomsLat = "";
                var roomsLon = "";

                if (data.hasOwnProperty('lat')) {
                    roomsLat = data['lat'];
                    roomsLon = data['lon'];
                }


                for (let aRoom of parse5.treeAdapters.default.getChildNodes(table)) {                    //iterate through each room
                    if (parse5.treeAdapters.default.isTextNode(aRoom))
                        continue;
                    else {
                        // console.log('in for loop');
                        let htmlToReturn: {[key: string]: any} = {
                            'rooms_fullname': "",
                            'rooms_shortname': "",
                            'rooms_number': "",
                            'rooms_name': "",
                            'rooms_address': "",
                            'rooms_lat': 0,
                            'rooms_lon': 0,
                            'rooms_seats': 0,
                            'rooms_type': "",
                            'rooms_furniture': "",
                            'rooms_href': ""
                        };

                        let trNodes = parse5.treeAdapters.default.getChildNodes(aRoom);
                        for (let tdNodes of trNodes) {                                                           // Iterate through columns
                            if (parse5.treeAdapters.default.isTextNode(tdNodes))
                                continue;
                            else {
                                //console.log('in trNodes');
                                let roomInfo = parse5.treeAdapters.default.getAttrList(tdNodes);
                                let attributeValue = roomInfo[0].value;

                                switch (attributeValue) {
                                    case 'views-field views-field-field-room-number':
                                        let roomNumber = parse5.treeAdapters.default.getChildNodes(tdNodes)[1];
                                        roomNumber = parse5.treeAdapters.default.getFirstChild(roomNumber);
                                        htmlToReturn['rooms_number'] = parse5.treeAdapters.default.getTextNodeContent(roomNumber);
                                        break;
                                    case 'views-field views-field-field-room-capacity':
                                        let roomSeats = parse5.treeAdapters.default.getFirstChild(tdNodes);
                                        roomSeats = parse5.treeAdapters.default.getTextNodeContent(roomSeats);
                                        roomSeats = roomSeats.replace('\n', "");
                                        roomSeats = roomSeats.trim();

                                        htmlToReturn['rooms_seats'] = Number(roomSeats);
                                        break;

                                    case "views-field views-field-field-room-furniture":
                                        let furniture = parse5.treeAdapters.default.getFirstChild(tdNodes);
                                        furniture = parse5.treeAdapters.default.getTextNodeContent(furniture);
                                        furniture = furniture.replace('\n', "");
                                        furniture = furniture.trim();
                                        htmlToReturn['rooms_furniture'] = furniture;
                                        break;
                                    case "views-field views-field-field-room-type":
                                        let type = parse5.treeAdapters.default.getFirstChild(tdNodes);
                                        type = parse5.treeAdapters.default.getTextNodeContent(type);
                                        type = type.replace('\n', "");
                                        type = type.trim();
                                        htmlToReturn['rooms_type'] = type;
                                        break;
                                    case "views-field views-field-nothing":
                                        let rHref = parse5.treeAdapters.default.getChildNodes(tdNodes)[1];
                                        rHref = parse5.treeAdapters.default.getAttrList(rHref)[0];
                                        htmlToReturn['rooms_href'] = rHref['value'];
                                        break;

                                }
                            }
                        }

                        //console.log('out of for loop');

                        htmlToReturn['rooms_fullname'] = buildingName;
                        htmlToReturn['rooms_shortname'] = buildingsShort;
                        htmlToReturn['rooms_name'] = htmlToReturn['rooms_shortname'] + "_" + htmlToReturn['rooms_number'];
                        htmlToReturn['rooms_address'] = buildingsAddress;

                        if(typeof  roomsLat !== "number" || typeof  roomsLon !== "number")
                            continue;
                        else{
                            htmlToReturn['rooms_lat'] = roomsLat;
                            htmlToReturn['rooms_lon'] = roomsLon;

                        }


                        // console.log(htmlToReturn);
                        arrayOFRooms.push(htmlToReturn);
                        //console.log(arrayOFRooms);
                    }
                }
                fulFill(arrayOFRooms)
                return;
            })
        }catch(err){
            reject({code: 400, body: {"Error": err}});
            return;

        }
    });
}

function getLocation(address:string): Promise<any> {
    return new Promise((fulfill, reject) =>{
        //console.log('in getlocation:' + address);
        var options = {
            hostname: 'skaha.cs.ubc.ca',
            port: 11316,
            path: '/api/v1/team183/' + address,
            method: 'GET',
            protocol: "http:",
            agent: false
        };

        http.get(options, (res: any) =>{
            //console.log('in httpget')
            const statusCode = res.statusCode;
            const contentType = res.headers['content-type'];
            //console.log('In get location');
            res.setEncoding('utf8');
            let rawData = '';
            res.on('data', (chunk: any) => rawData += chunk);
            res.on('end', () => {
                try {
                    let parsedData = JSON.parse(rawData);
                    // console.log(parsedData);
                    fulfill(parsedData);
                } catch (e) {
                    // console.log(e.message);
                    reject(e);
                }
            });
        }).on('error', (e: any) => {
            console.log(`Got error: ${e.message}`);
        });
    })
}

function findShortName(newNodeArray: any) : string {
    let childNodes = parse5.treeAdapters.default.getChildNodes(newNodeArray);

    for (let aNode of childNodes) {
        if (parse5.treeAdapters.default.isElementNode(aNode)) {
            let attribute = parse5.treeAdapters.default.getAttrList(aNode);
            attribute = attribute[0];
            if (attribute['name'] === 'href') {
                attribute = attribute['value'];
                return attribute.slice(0,attribute.indexOf('#'));
            }

        }
    }
}

function findBuilding(newNodeArray: any, target: string) : any {

    if (parse5.treeAdapters.default.isElementNode(newNodeArray)) {

        let attributes = parse5.treeAdapters.default.getAttrList(newNodeArray);
        if (attributes !== null && !(typeof attributes === 'undefined')) {
            for (let attrObj of attributes) {
                if (attrObj['value'] === target)
                    return newNodeArray;
            }
        }
        let NodeArray = parse5.treeAdapters.default.getChildNodes(newNodeArray);
        for (let childNode of NodeArray) {
            let traverseDown = findBuilding(childNode,target);
            if (!(traverseDown === null) && !(typeof traverseDown === 'undefined'))
                return traverseDown;
        }
    }
    else {
        return null;
    }
}

function findFullName(newNodeArray: any) : any {
    if (parse5.treeAdapters.default.isElementNode(newNodeArray)) {
        if (newNodeArray.nodeName === 'h2') {
            if (parse5.treeAdapters.default.getFirstChild(newNodeArray).nodeName === 'span') {
                newNodeArray = parse5.treeAdapters.default.getFirstChild(newNodeArray);
                newNodeArray = parse5.treeAdapters.default.getFirstChild(newNodeArray);
                if (parse5.treeAdapters.default.isTextNode(newNodeArray)) {
                    return parse5.treeAdapters.default.getTextNodeContent(newNodeArray);
                }
            }
        }


        let NodeArray = parse5.treeAdapters.default.getChildNodes(newNodeArray)

        for (let childNode of NodeArray) {
            let traverseDown = findFullName(childNode);
            if (!(traverseDown === null) && !(typeof traverseDown === 'undefined'))
                return traverseDown;
        }
    }
    else{
        return null;
    }
}

function findRoomAddress(newNodeArray: any) : any {
    if (parse5.treeAdapters.default.isElementNode(newNodeArray)) {
        let target =  {line: 326, col: 58, startOffset: 46955, endOffSet: 46980};

        if (newNodeArray.nodeName === 'h2') {
            let parentNode = parse5.treeAdapters.default.getParentNode(newNodeArray);
            newNodeArray = parse5.treeAdapters.default.getChildNodes(parentNode);
            newNodeArray = newNodeArray[3];
            newNodeArray = parse5.treeAdapters.default.getFirstChild(newNodeArray);
            newNodeArray = parse5.treeAdapters.default.getFirstChild(newNodeArray);
            if(parse5.treeAdapters.default.isTextNode(newNodeArray))
                return parse5.treeAdapters.default.getTextNodeContent(newNodeArray);

        }
        let NodeArray = parse5.treeAdapters.default.getChildNodes(newNodeArray)

        for (let childNode of NodeArray) {
            let traverseDown = findRoomAddress(childNode);
            if (!(traverseDown === null) && !(typeof traverseDown === 'undefined'))
                return traverseDown;
        }


    }
    else{
        return null;
    }



}

function getToBody(parentNode: Node) : Node {
    let childNodes = parse5.treeAdapters.default.getChildNodes(parentNode);

    for (let node of childNodes){
        if (node.nodeName === 'html'){
            let nextChildNodes = parse5.treeAdapters.default.getChildNodes(node);
            for(let nextNode of nextChildNodes){
                if (nextNode.nodeName === 'body')
                    return nextNode;
            }
        }
    }



}

function getTable(newNodeArray:any):any {

    if (parse5.treeAdapters.default.isElementNode(newNodeArray)) {

        if (parse5.treeAdapters.default.getTagName(newNodeArray) === 'tbody') {
            return newNodeArray
        }

        let NodeArray = parse5.treeAdapters.default.getChildNodes(newNodeArray);
        for (let childNode of NodeArray) {
            let traverseDown = getTable(childNode);
            if (!(traverseDown === null) && !(typeof traverseDown === 'undefined'))
                return traverseDown;
        }
    }
    else {
        return null;
    }

}

function keyfinder(key: string, course_obj: any): any {
    if (course_obj.hasOwnProperty(key)) {
        return course_obj[key];
    }
    else {
        throw "err";
    }
}


// FULL DISCLOSURE: note idea for comparing parse/Stringify came from
//http://stackoverflow.com/questions/3710204/how-to-check-if-a-string-is-a-valid-json-string-in-javascript-without-using-try
// Their idea was in JS, but i changed/adapted it a bit to return boolean and adapted for my usage.

function json_validator(JSONstring:string) : boolean{
    try {
        var testee = JSON.parse(JSONstring);
        if (testee && typeof testee === "object") {
            //returns false if is not an object or is null (since null is an object)
            return true;
        }
    }
    catch (e) {
        return false;
    }
    return false;
}

// takes in a list of arguement values
//either pass just the string value 'course_names'
// if you want the particular value reversed pass it as an object in the list as follows  { name: 'SCORE', reverse: true }
//call it with the sort function as follows  returnlist.sort(sortall({ name: 'courses_name', ascending: true }, 'courses_year'));
// takes in a list of arguement values
//either pass just the string value 'course_names'
// if you want the particular value reversed pass it as an object in the list as follows  { name: 'SCORE', reverse: true }
//call it with the sort function in this format - returnlist.sort(sortall({ name: 'courses_name', descending: true }, 'courses_year'));

function sortall(sortList: any[], desc : boolean) : any {
    var sortByList : any[] = []; // List of arguements
    var sortByTot : number = sortList.length; // length of list of arguements
    var sortVal : any; // global var for what i'm sorting by
    var name : any; // name of what i'm sorting by
    var descending : boolean = desc; // indicator for ascending/decesnding (true for ascending)
    var cmp : any; // this is the compare Lambda Variable

    // default sort function just as we had it before
    var sortBaseCase : any = function (a : any, b : any) : any {
        if (a === b) return 0;
        return a < b ? -1 : 1;
    }

    // variable sort function based off of other parameters like ascending, as well as any preprocessing function that has to be called on the element
    var sortPreProc : any = function (preFunction:any, descend:boolean) : any {
        var applyPreFunction : any = sortBaseCase;
        var cmp : any = sortBaseCase;
        if (preFunction) {
            cmp = function (a:any, b:any) {
                return applyPreFunction(preFunction(a), preFunction(b));
            };
        }
        if (descend) {
            return function (a:any, b:any) {
                return -1 * cmp(a, b);
            };
        }
        return cmp;
    };

    // preprocess sortByList to get names, reverse, and any other options that have to be done based off the field
    for (var i:number = 0; i < sortByTot; i++) {
        sortVal = sortList[i];
        if (!descending) {
            name = sortVal;
            cmp = sortBaseCase;
        } else {
            name = sortVal;
            cmp = sortPreProc(false, descending);
        }
        sortByList.push({
            name: name,
            cmp: cmp
        });
    }

    // Actual callers and return for the other functions based off the compared elements
    return function (A : any, B : any) : any {
        var a : any, b : any, name : string, sortResult: number;
        for (var i : number = 0; i < sortByTot; i++) {
            sortResult = 0;
            sortVal = sortByList[i];
            name = sortVal.name;

            sortResult = sortVal.cmp(A[name], B[name]);
            if (sortResult !== 0) break;
        }
        return sortResult;
    };

}
