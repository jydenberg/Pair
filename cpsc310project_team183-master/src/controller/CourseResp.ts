/**
 * Created by yjosh on 17/01/17.
 */
import { InsightResponse} from "./IInsightFacade";
import Log from "../Util";
import ClassContainer from "./ClassContainer";

var JSZip = require("jszip");
var fs = require('fs');

export default class CourseResp implements InsightResponse {
    code: number = 0;
    body: {}; // the actual response

    constructor() {
        Log.trace('InsightFacadeImpl::init()');
    }

    get_code(): number {
        return this.code;
    }

    set_code(value: number) {
        this.code = value;
    }

    get_body(): {} {
        return this.body;
    }

    set_body(value: {}) {
        this.body = value;
    }
}