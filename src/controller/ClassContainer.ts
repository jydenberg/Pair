/**
 * Created by josh on 20/01/17.
 */
/**
 * Created by yjosh on 17/01/17.
 */
import {IInsightFacade, InsightResponse, QueryRequest} from "./IInsightFacade";

import Log from "../Util";

var JSZip = require("jszip");


export default class ClassContainer {
    private _courses_dept: string = null; //The department that offered the course.
    private _courses_id: string = null; //The course number (will be treated as a string (e.g., 499b)).
    private _courses_avg: number = null; // The average of the course offering.
    private _courses_instructor: string = null; //The instructor teaching the course offering.
    private _courses_title: string = null; //The name of the course.
    private _courses_pass: number = null; //The number of students that passed the course offering.
    private _courses_fail: number = null; //The number of students that failed the course offering.
    private _courses_audit: number = null; //The number of students that audited the course offering.

    constructor() {
        Log.trace('InsightFacadeImpl::init()');
    }

    get courses_dept(): string {
        return this._courses_dept;
    }

    set courses_dept(value: string) {
        this._courses_dept = value;
    }

    get courses_id(): string {
        return this._courses_id;
    }

    set courses_id(value: string) {
        this._courses_id = value;
    }

    get courses_avg(): number {
        return this._courses_avg;
    }

    set courses_avg(value: number) {
        this._courses_avg = value;
    }

    get courses_instructor(): string {
        return this._courses_instructor;
    }

    set courses_instructor(value: string) {
        this._courses_instructor = value;
    }

    get courses_title(): string {
        return this._courses_title;
    }

    set courses_title(value: string) {
        this._courses_title = value;
    }

    get courses_pass(): number {
        return this._courses_pass;
    }

    set courses_pass(value: number) {
        this._courses_pass = value;
    }

    get courses_fail(): number {
        return this._courses_fail;
    }

    set courses_fail(value: number) {
        this._courses_fail = value;
    }

    get courses_audit(): number {
        return this._courses_audit;
    }

    set courses_audit(value: number) {
        this._courses_audit = value;
    }
}