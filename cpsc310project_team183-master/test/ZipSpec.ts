
import Log from "../src/Util";
import {expect} from 'chai';
import CourseResp from "../src/controller/CourseResp";
import InsightFacade from "../src/controller/InsightFacade";
import Server from "../src/rest/Server"
var fs = require('fs');
var chai = require('chai') , chaiHTTP = require('chai-http');
chai.use(chaiHTTP);

describe("ZipSpec", function () {
    let serv: Server = null;
    let ifac: InsightFacade = null;
    let zipContent: any = null;
    let zipRoomContent :any = null;
    let zipFilePathRoom = './rooms.zip';
    let zipFilePath = './courses.zip';
    let zipIMGContent: any = null;
    let zipIMGPath = './mario.zip';
    let returnarray: Array<any> = null;

    afterEach(function () {
        returnarray = [];
        //    DataSet = null;
    });

    before(function () {
        serv = new Server(2645);
        ifac = new InsightFacade();
        Log.test('Before: ' + (<any>this).test.parent.title);
        zipRoomContent =  Buffer.from(fs.readFileSync(zipFilePathRoom)).toString('base64');
        zipContent = Buffer.from(fs.readFileSync(zipFilePath)).toString('base64');
        zipIMGContent = Buffer.from(fs.readFileSync(zipIMGPath)).toString('base64');
        return serv.start().then((retval)=> {
            console.log('server started');
        }).catch( (err) =>{
            console.log(err);
        })
    });

    after(function (){
        return serv.stop().then((retval)=> {
            console.log('server started');
        }).catch( (err) =>{
            console.log(err);
        })
    });

    //  NEEDED FOR THE NEXT TESTS TO PASS



   it("Delete the whole courses folder", function () {
        fs.unlink('./courses.txt', (err: any) => {
            if (err) {
                expect.fail(err);
                // console.log('no folder to delete, its empty!');
            }
            else console.log('deleted courses.txt, ready to test');
        })
    });
//     //Tests on Lack of Data

//     // Test 404 Remove Error
    it("Remove data - file is not there test", function () {
        return ifac.removeDataset('courses')
            .then(function (value: CourseResp) {
                console.log('Sucessfully removed');
//                 //console.log(value);
                expect.fail();
            })
            .catch(function (err: CourseResp) {
                console.log('Cannot remove data');
                // console.log(err);
                expect(err.code).to.equal(404);
            })
    });
    it('Test 424', function () {
        return ifac.performQuery({
            "WHERE": {
                "IS": {
                    "courses_dept": "aanb"
                }
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_id"
                ],
                "ORDER": "courses_id",
                "FORM": "TABLE"
            }
        })
            .then(function (value: any) {
                expect.fail();
            })
            .catch(function (err: any) {
                console.log(err);
                expect(err.code).to.equal(424);
            })
    });

    //ADD/REMOVE TESTS

    it("Testing addData(204 code)", function () {
        return ifac.addDataset("courses", zipContent)
            .then(function (value: CourseResp) {
                // console.log(value)
                expect(value.code).to.equal(204);
            })
            .catch(function (err: CourseResp) {
            //     console.log('Error in adddata test');
                expect.fail();
            })
    });

    // testing the 201 success message (id already exists)
    it("Testing addData (201 code)", function () {
        return ifac.addDataset("courses", zipContent)
            .then(function (value: CourseResp) {
                //console.log(value);
                expect(value.code).to.equal(201);
            })
            .catch(function (err: CourseResp) {
                console.log('Error in 201 test' + err);
                expect.fail();
            })
    });
    //
    it('empty test - Add', function () {
        return ifac.addDataset('testEmpty', './testEmpty.zip')
            .then(function (value: CourseResp) {
                console.log('Saved it as a valid');
                expect.fail();
            })
            .catch(function (err: CourseResp) {
                console.log("err: " + err.code);
                console.log('Should give 400 empty code');
                expect(err.code).to.equal(400);
            })
    });
    //
    //
    it('Adding a non zip file', function () {
        return ifac.addDataset('nonzip', './nonzip.txt')
            .then(function (value: CourseResp) {
                console.log('Saved it as a valid');
                expect.fail();
            })
            .catch(function (err: CourseResp) {
                console.log("err: " + err.code);
                console.log('Should give 400 empty code');
                expect(err.code).to.equal(400);
            })
    });


  it('Attempting to add an invalid non b64 zip', function () {
        return ifac.addDataset('mario', zipIMGContent)
            .then(function (value: any) {
                expect.fail();
            }).catch(function (err: CourseResp) {
                // console.log(err);
                expect(err.code).to.equal(400);
            })
    });

    it("Testing remove data COURSES(204 code)", function () {
        return ifac.removeDataset('courses')
            .then(function (value: CourseResp) {
                expect(value.code).to.equal(204);
            })
            .catch(function (err: CourseResp) {
                console.log('Cannot remove data');
                expect.fail();
            })
    });

// this is just so we have courses to test
    it("adding back a set to test", function () {
        return ifac.addDataset("courses", zipContent)
            .then(function (value: CourseResp) {
                //console.log(value)
                expect(value.code).to.equal(204);
            })
            .catch(function (err: CourseResp) {
                console.log('Error in adddata test');
                expect.fail();
            })
    });


    // TESTS FOR ROOMS
    // TESTS ON COURSE QUERIES



   it('(course_avg > 90 AND adhe) OR courses_avg == 95', function () {
        return ifac.performQuery({
            "WHERE": {
                "OR": [
                    {
                        "AND": [
                            {
                                "GT": {
                                    "courses_avg": 90
                                }
                            },
                            {
                                "IS": {
                                    "courses_dept": "adhe"
                                }
                            }
                        ]
                    },
                    {
                        "EQ": {
                            "courses_avg": 95
                        }
                    }
                ]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_id",
                    "courses_avg"
                ],
                "ORDER": "courses_avg",
                "FORM": "TABLE"
            }
        })
            .then(function (value: any) {
                returnarray = value.body['result'];
                expect(returnarray.length).to.equal(56);
                for (let i: number = 0; i < returnarray.length; i++) {
                    if (i < 14 || i == 55) {
                        expect(returnarray[i]['courses_dept']).to.equal('adhe');
                    }
                    else {
                        expect(returnarray[i]['courses_avg']).to.equal(95);
                    }
                }
                expect(value.code).to.equal(200);
            })
            .catch(function (err: any) {
                //  console.log(err);
            })
    });


    it('TEST equals audit 7 AND greater than 80% avg', function () {
        return ifac.performQuery({
            "WHERE": {
                "AND": [
                    {
                        "GT": {
                            "courses_avg": 80
                        }
                    },
                    {
                        "EQ": {
                            "courses_fail": 7
                        }
                    }
                ]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_avg",
                    "courses_fail"
                ],
                "ORDER": "courses_avg",
                "FORM": "TABLE"
            }
        })
            .then(function (value: any) {
                expect(value.code).to.equal(200);
                returnarray = value.body['result'];
                console.log(returnarray);
                expect(returnarray.length).to.equal(7);
                expect(returnarray[0]["courses_dept"]).to.equal("eosc");
                expect(returnarray[0]["courses_avg"]).to.equal(80.08);
                expect(returnarray[2]["courses_dept"] && returnarray[3]["courses_dept"]).to.equal("grsj");
                expect(returnarray[4]["courses_avg"]).to.equal(81.68);
            })
            .catch(function (err: any) {
                // console.log(err);
                expect.fail();
            })
    });

    it('TEST less than 98 AND greater than 97.5', function () {
        return ifac.performQuery({
            "WHERE": {
                "AND": [
                    {
                        "GT": {
                            "courses_avg": 97.5
                        }
                    },
                    {
                        "LT": {
                            "courses_avg": 98
                        }
                    }
                ]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_avg"
                ],
                "ORDER": "courses_avg",
                "FORM": "TABLE"
            }
        })
            .then(function (value: any) {
                returnarray = value.body['result'];
                //  console.log(returnarray);
                expect(returnarray.length).to.equal(5);
                expect(returnarray[1]["courses_avg"]).to.equal(97.53);
                expect(returnarray[4]["courses_avg"]).to.equal(97.78);
                expect(value.code).to.equal(200);
            })
            .catch(function (err: any) {
                console.log(err);
                expect.fail();
            })
    });


    it(' find all sections not from a specific prof', function () {
        return ifac.performQuery({
            "WHERE": {
                "AND": [
                    {
                        "NOT": {
                            "IS": {
                                "courses_instructor": "acton, donald"
                            }
                        }
                    },
                    {
                        "IS": {
                            "courses_dept": "cpsc"
                        }
                    }
                ]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_instructor",
                    "courses_dept",
                    "courses_id",
                    "courses_title"
                ],
                "ORDER": "courses_title",
                "FORM": "TABLE"
            }
        })
            .then(function (value: any) {
                expect(value.code).to.equal(200);
                returnarray = value.body['result'];
                for (let i: number = 0; i < returnarray.length; i++) {
                    // make sure that it got everything other than Acton
                    expect(returnarray[i]['course_instructor']).not.equal('acton, donald');
                }
            })
            .catch(function (err: any) {
                expect.fail();
            })
    });

    it("find all sections for a dept", function () {
        return ifac.performQuery({
            "WHERE": {
                "IS": {
                    "courses_dept": "aanb"
                }
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_id"
                ],
                "ORDER": "courses_id",
                "FORM": "TABLE"
            }
        })
            .then(function (value: any) {
                //console.log('successful query');
                //expect(value.code).to.equal(200);
                returnarray = value.body['result'];
                //console.log(returnarray);
                expect(returnarray.length).to.equal(4);
                expect(value.code).to.equal(200);
            })
            .catch(function (err: any) {
                //console.log('find all sections for a dept: ' + err);
                expect.fail();
            })
    });


    it('Testing Valid Query - empty WHERE', function () {
        let query = {
            WHERE: {},
            OPTIONS: {
                COLUMNS: ['courses_dept',
                    'courses_avg'],
                ORDER: "courses_avg",
                FORM: "TABLE"
            }
        }
        return ifac.performQuery(query)
            .then(function (value: any) {
                //console.log('Code: ' + value.code);
                expect(value.code).to.equal(200);
            }).catch(function (err: CourseResp) {
                // console.log(err);
                expect.fail();
            })
    });



    it('test EQ and course_year', function () {
        return ifac.performQuery({
            "WHERE": {
                "EQ": {
                    "courses_year": 2009
                }
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_avg",
                    "courses_year"
                ],
                "ORDER": "courses_avg",
                "FORM": "TABLE"
            }
        })
            .then(function (value: any) {
                returnarray = value.body['result'];
                // console.log(returnarray.length)
                //console.log(returnarray)
                expect(returnarray.length).to.equal(3950);
                expect(value.code).to.equal(200);
            })
            .catch(function (err: any) {
                //   console.log(err);
                expect.fail();
            })
    });



    it('Testing GT - Basic case', function () {
        let query = {
            WHERE: {
                GT: {courses_avg: 97},
            },
            OPTIONS: {
                COLUMNS: ['courses_dept',
                    'courses_avg'],
                ORDER: "courses_avg",
                FORM: "TABLE"

            }
        }

        return ifac.performQuery(query)
            .then(function (value: any) {
                //console.log('Code: ' + value.code);
                expect(value.code).to.equal(200);
            }).catch(function (err: CourseResp) {
                // console.log(err);
                expect.fail();
            })
    });

    it('Testing LT - Basic case', function () {
        let query = {
            WHERE: {
                LT: {courses_avg: 50},
            },
            OPTIONS: {
                COLUMNS: ['courses_dept',
                    'courses_avg'],
                ORDER: "courses_avg",
                FORM: "TABLE"

            }
        }

        return ifac.performQuery(query)
            .then(function (value: any) {
                //console.log('Code: ' + value.code);
                expect(value.code).to.equal(200);
            }).catch(function (err: CourseResp) {
                // console.log(err);
                expect.fail();
            })
    });



    it('Testing IS - Basic case', function () {
        return ifac.performQuery({
            "WHERE": {
                "IS": {
                    "courses_dept": "cpsc"
                }
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_avg"
                ],
                "ORDER": "courses_avg",
                "FORM": "TABLE"
            }
        })
            .then(function (value: any) {
                returnarray = value.body['result'];
                expect(returnarray[0]['courses_avg'] && returnarray[1]['courses_avg']).to.equal(64);
                expect(returnarray[2]['courses_avg']).to.equal(64.62);
                console.log(returnarray.length)
                expect(returnarray.length).to.equal(1111);
                expect(value.code).to.equal(200);
            })
            .catch(function (err: any) {
                console.log(err);
                expect.fail();
            })
    });

    it('Testing IS - Not a course - Valid but returns nothing', function () {
        let query = {
            WHERE: {
                IS: {courses_dept: 'a'}
            },
            OPTIONS: {
                COLUMNS: ['courses_dept',
                    'courses_avg'],
                ORDER: "courses_avg",
                FORM: "TABLE"

            }
        }

        return ifac.performQuery(query)
            .then(function (value: any) {
                //console.log('Code: ' + value.code);
                //console.log('Body: ' + value.body);
                expect(value.code).to.equal(200);
            }).catch(function (err: CourseResp) {
                // console.log(err);
                expect.fail();
            })
    });

    it('Testing *IS*', function () {
        return ifac.performQuery({
            "WHERE": {
                "IS": {
                    "courses_dept": "*fs*"
                }
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_avg"
                ],
                "ORDER": "courses_avg",
                "FORM": "TABLE"
            }
        })
            .then(function (value: any) {
                returnarray = value.body['result'];
                expect(returnarray[0]['courses_avg'] && returnarray[1]['courses_avg']).to.equal(0);
                expect(returnarray[2]['courses_avg']).to.equal(69.96);
                //console.log(returnarray.length)
                expect(returnarray.length).to.equal(145);
                expect(value.code).to.equal(200);
            })
            .catch(function (err: any) {
                console.log(err);
                expect.fail();
            })
    });


    it('Testing *IS', function () {
        return ifac.performQuery({
            "WHERE": {
                "IS": {
                    "courses_dept": "*rds"
                }
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_avg"
                ],
                "ORDER": "courses_avg",
                "FORM": "TABLE"
            }
        })
            .then(function (value: any) {
                returnarray = value.body['result'];
                expect(returnarray[0]['courses_avg']).to.equal(53.64);
                expect(returnarray[1]['courses_avg']).to.equal(55.63);
                expect(returnarray[2]['courses_avg']).to.equal(57.21);
                console.log(returnarray.length)
                expect(returnarray.length).to.equal(141);
                expect(value.code).to.equal(200);
            })
            .catch(function (err: any) {
                console.log(err);
                expect.fail();
            })
    });

    it('Testing IS*', function () {
        return ifac.performQuery({
            "WHERE": {
                "IS": {
                    "courses_dept": "phy*"
                }
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_avg"
                ],
                "ORDER": "courses_avg",
                "FORM": "TABLE"
            }
        })
            .then(function (value: any) {
                returnarray = value.body['result'];
                expect(returnarray[0]['courses_avg']).to.equal(55.25);
                expect(returnarray[1]['courses_avg']).to.equal(62);
                expect(returnarray[2]['courses_avg']).to.equal(62);
                console.log(returnarray.length)
                expect(returnarray.length).to.equal(1091);
                expect(value.code).to.equal(200);
            })
            .catch(function (err: any) {
                console.log(err);
                expect.fail();
            })
    });

    it('Testing IS - *Stri*ng', function () {
        let query = {
            WHERE: {
                IS: {courses_dept: '*p*n'}
            },
            OPTIONS: {
                COLUMNS: ['courses_dept',
                    'courses_avg'],
                ORDER: "courses_avg",
                FORM: "TABLE"

            }
        }

        return ifac.performQuery(query)
            .then(function (value: any) {
                // console.log('Code: ' + value.code);
                expect(value.code).to.equal(200);
            }).catch(function (err: CourseResp) {
                //console.log(err);
                expect.fail();
            })
    });

    it('Testing NOT - not GT', function () {
        let query = {
            WHERE: {
                NOT: {
                    GT: {courses_avg: 70}
                },
            },
            OPTIONS: {
                COLUMNS: ['courses_dept',
                    'courses_avg'],
                ORDER: "courses_avg",
                FORM: "TABLE"

            }
        }


        return ifac.performQuery(query)
            .then(function (value: any) {
                //console.log('Code: ' + value.code);
                expect(value.code).to.equal(200);
            }).catch(function (err: CourseResp) {
                // console.log(err);
                expect.fail();
            })
    });


    it('Testing NOT - not LT', function () {
        let query = {
            WHERE: {
                NOT: {
                    LT: {courses_pass: 7}
                },
            },
            OPTIONS: {
                COLUMNS: ['courses_dept',
                    'courses_pass'],
                ORDER: "courses_pass",
                FORM: "TABLE"

            }
        }


        return ifac.performQuery(query)
            .then(function (value: any) {
                //console.log('Code: ' + value.code);
                expect(value.code).to.equal(200);
            }).catch(function (err: CourseResp) {
                // console.log(err);
                expect.fail();
            })
    });

    it('Further AND tests', function () {
        let query = {
            WHERE: {
                AND: [
                    {GT: {"courses_avg": 90}},
                    {GT: {"courses_avg": 90}}
                ]

            },
            OPTIONS: {
                COLUMNS: [
                    "courses_dept",
                    "courses_avg"
                ],
                ORDER: "courses_avg",
                FORM: "TABLE"
            }
        }


        return ifac.performQuery(query)
            .then(function (value: any) {
                //console.log('Code: ' + value.code);
                expect(value.code).to.equal(200);
                returnarray = value.body['result'];
                expect(returnarray.length).to.equal(3127);
            }).catch(function (err: CourseResp) {
                //console.log(err);
                expect.fail();
            })
    });


    it('Testing NOT - not IS', function () {
        let query = {
            WHERE: {
                NOT: {
                    IS: {courses_dept: "aanb"}
                },
            },
            OPTIONS: {
                COLUMNS: ['courses_dept',
                    'courses_avg'],
                ORDER: "courses_dept",
                FORM: "TABLE"

            }
        }


        return ifac.performQuery(query)
            .then(function (value: any) {
                console.log('Code: ' + value.code);
                //expect(value.code).to.equal(200);
            }).catch(function (err: CourseResp) {
                // console.log(err);
                expect.fail();
            })
    });

    it('Testing NOT - not IS *string*', function () {
        let query = {
            WHERE: {
                NOT: {
                    IS: {courses_instructor: "*john*"}
                },
            },
            OPTIONS: {
                COLUMNS: ['courses_instructor',
                    'courses_avg'],
                ORDER: "courses_instructor",
                FORM: "TABLE"

            }
        }


        return ifac.performQuery(query)
            .then(function (value: any) {
                //console.log('Code: ' + value.code);
                expect(value.code).to.equal(200);
            }).catch(function (err: CourseResp) {
                // console.log(err);
                expect.fail();
            })
    });

    it('Testing NOT - not IS *string', function () {
        let query = {
            WHERE: {
                NOT: {
                    IS: {courses_dept: "*pn"}
                },
            },
            OPTIONS: {
                COLUMNS: ['courses_dept',
                    'courses_avg'],
                ORDER: "courses_dept",
                FORM: "TABLE"

            }
        }


        return ifac.performQuery(query)
            .then(function (value: any) {
                //console.log('Code: ' + value.code);
                expect(value.code).to.equal(200);
            }).catch(function (err: CourseResp) {
                // console.log(err);
                expect.fail();
            })
    });

    it('Testing NOT - not IS string*', function () {
        let query = {
            WHERE: {
                NOT: {
                    IS: {courses_dept: "cp*"}
                },
            },
            OPTIONS: {
                COLUMNS: ['courses_dept',
                    'courses_avg'],
                ORDER: "courses_dept",
                FORM: "TABLE"

            }
        }


        return ifac.performQuery(query)
            .then(function (value: any) {
                // console.log('Code: ' + value.code);
                expect(value.code).to.equal(200);
            }).catch(function (err: CourseResp) {
                //  console.log(err);
                expect.fail();
            })

    });


    it('Testing AND - GT + IS', function () {
        let query = {
            WHERE: {
                AND: [
                    {
                        GT: {
                            courses_avg: 70
                        }
                    },
                    {
                        IS: {
                            courses_dept: "asia"
                        }
                    }
                ]
            },
            OPTIONS: {
                COLUMNS: ['courses_dept',
                    'courses_avg'],
                ORDER: "courses_avg",
                FORM: "TABLE"

            }
        }


        return ifac.performQuery(query)
            .then(function (value: any) {
                //console.log('Code: ' + value.code);
                expect(value.code).to.equal(200);
            }).catch(function (err: CourseResp) {
                //  console.log(err);
                expect.fail();
            })
    });


    it('Testing OR - GT + IS', function () {
        let query = {
            WHERE: {
                OR: [
                    {
                        GT: {
                            courses_avg: 90
                        }
                    },
                    {
                        IS: {
                            courses_dept: "japn"
                        }
                    }
                ]
            },
            OPTIONS: {
                COLUMNS: ['courses_dept',
                    'courses_avg'],
                ORDER: "courses_avg",
                FORM: "TABLE"

            }
        }


        return ifac.performQuery(query)
            .then(function (value: any) {
                // console.log('Code: ' + value.code);
                expect(value.code).to.equal(200);
            }).catch(function (err: CourseResp) {
                //console.log(err);
                expect.fail();
            })
    });

    it('Testing complex', function () {
        let query = {

            WHERE: {
                OR: [
                    {
                        AND: [
                            {
                                GT: {
                                    courses_avg: 90
                                }
                            },
                            {
                                IS: {
                                    courses_dept: "adhe"
                                }
                            }
                        ]
                    },
                    {
                        EQ: {
                            courses_avg: 95
                        }
                    }
                ]
            },
            OPTIONS: {
                COLUMNS: [
                    "courses_dept",
                    "courses_id",
                    "courses_avg"
                ],
                ORDER: "courses_avg",
                FORM: "TABLE"
            }
        }


        return ifac.performQuery(query)
            .then(function (value: any) {
                //console.log('Code: ' + value.code);
                expect(value.code).to.equal(200);
            }).catch(function (err: CourseResp) {
                //  console.log(err);
                expect.fail();
            })
    });

    it('course_avg greater than 98', function () {
        return ifac.performQuery({
            "WHERE": {
                "GT": {
                    "courses_avg": 98
                }
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_avg"
                ],
                "ORDER": "courses_avg",
                "FORM": "TABLE"
            }
        })
            .then(function (value: any) {
                returnarray = value.body['result'];
                expect(returnarray.length).to.equal(25);
                expect(returnarray[0]['courses_avg']).to.equal(98.08);
                expect(returnarray[1]['courses_dept']).to.equal("nurs");
                expect(returnarray[24]['courses_avg']).to.equal(99.78);
                expect(value.code).to.equal(200);
            })
            .catch(function (err: any) {
                //   console.log(err);
                expect.fail();
            })
    });

    it('find all instructors with the same partial name', function () {
        return ifac.performQuery({
            "WHERE": {
                "IS": {
                    "courses_instructor": "*kim*"
                }

            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_instructor",
                    "courses_dept",
                    "courses_id"
                ],
                "ORDER": "courses_instructor",
                "FORM": "TABLE"
            }
        })
            .then(function (value: any) {
                expect(value.code).to.equal(200);
                returnarray = value.body['result'];
                for (let i: number = 0; i < returnarray.length; i++) {
                    // make sure that it got everything other than Acton
                    expect(returnarray[i]['course_instructor']).not.equal('acton,donald');
                }
            })
            .catch(function (err: any) {
                expect.fail();
            })
    });

    it('course_avg less than 9', function () {
        return ifac.performQuery({
            "WHERE": {
                "LT": {
                    "courses_avg": 9
                }
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_avg"
                ],
                "ORDER": "courses_avg",
                "FORM": "TABLE"
            }
        })
            .then(function (value: any) {
                returnarray = value.body['result'];
                expect(returnarray.length).to.equal(7);
                expect(value.code).to.equal(200);
            })
            .catch(function (err: CourseResp) {
                // console.log(err);
                expect(err.code).to.equal(400);
            })
    });


    it('test not', function () {
        return ifac.performQuery({
            "WHERE": {
                "NOT": {
                    "GT": {
                        "courses_avg": 1
                    }
                }
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_avg"
                ],
                "ORDER": "courses_avg",
                "FORM": "TABLE"
            }
        })
            .then(function (value: any) {
                returnarray = value.body['result'];
                // console.log(returnarray)
                expect(returnarray.length).to.equal(4);
                expect(returnarray[0]['courses_avg']).to.equal(0);
                expect(returnarray[0]['courses_dept']).to.equal("frst");
                expect(returnarray[3]['courses_avg']).to.equal(1);
                expect(returnarray[3]['courses_dept']).to.equal("wood");
                expect(value.code).to.equal(200);
            })
            .catch(function (err: any) {
                // console.log(err);
                expect.fail();
            })
    });


    it('test double negation', function () {
        return ifac.performQuery({
            "WHERE": {
                "NOT": {
                    "NOT": {
                        "LT": {
                            "courses_avg": 20
                        }
                    }
                }
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_avg"
                ],
                "ORDER": "courses_avg",
                "FORM": "TABLE"
            }
        })
            .then(function (value: any) {
                returnarray = value.body['result'];
                // console.log(returnarray)
                expect(returnarray.length).to.equal(7);
                expect(returnarray[0]['courses_avg']).to.equal(0);
                expect(returnarray[0]['courses_dept']).to.equal("frst");
                expect(returnarray[6]['courses_avg']).to.equal(4.5);
                expect(returnarray[6]['courses_dept']).to.equal("fopr");
                expect(value.code).to.equal(200);
            })
            .catch(function (err: any) {
                expect.fail();
            })
    });

    it('test triple negation', function () {
        return ifac.performQuery({
            "WHERE": {
                "NOT": {
                    "NOT": {
                        "NOT": {
                            "LT": {
                                "courses_avg": 20
                            }
                        }
                    }
                }
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_avg"
                ],
                "ORDER": "courses_avg",
                "FORM": "TABLE"
            }
        })
            .then(function (value: any) {
                expect(value.code).to.equal(200);
            })
            .catch(function (err: any) {
                expect.fail();
            })
    });

    it('Test using OR to query different keys (elixir) - Small change in order ', function () {
        return ifac.performQuery({
            "WHERE": {
                "OR": [
                    {
                        "GT": {
                            "courses_pass": 100
                        }
                    },
                    {
                        "EQ": {
                            "courses_audit": 4
                        }
                    }
                ]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_pass",
                    "courses_dept",
                    "courses_audit"
                ],
                "ORDER": "courses_pass",
                "FORM": "TABLE"
            }

        })
            .then(function (value: any) {
                // console.log(value.body);
                expect(value.code).to.equal(200);
            })
            .catch(function (err: any) {
                //  console.log(err);
                expect.fail();
            })
    });

    it("find all sections for a dept", function () {
        return ifac.performQuery({
            "WHERE": {
                "IS": {
                    "courses_dept": "aanb"
                }
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_id"
                ],
                "ORDER": "courses_id",
                "FORM": "TABLE"
            }
        })
            .then(function (value: any) {
                //console.log('successful query');
                //expect(value.code).to.equal(200);
                returnarray = value.body['result'];
                expect(returnarray[0]['courses_id'] && returnarray[1]['courses_id']).to.equal('504');
                expect(returnarray[1]['courses_id'] && returnarray[2]['courses_id']).to.equal('551');
                expect(returnarray.length).to.equal(4);
                expect(value.code).to.equal(200);
            })
            .catch(function (err: any) {
                //console.log('find all sections for a dept: ' + err);
                expect.fail();
            })
    });

    it('(course_avg > 90 AND adhe) OR courses_avg == 95', function () {
        return ifac.performQuery({
            "WHERE": {
                "OR": [
                    {
                        "AND": [
                            {
                                "GT": {
                                    "courses_avg": 90
                                }
                            },
                            {
                                "IS": {
                                    "courses_dept": "adhe"
                                }
                            }
                        ]
                    },
                    {
                        "EQ": {
                            "courses_avg": 95
                        }
                    }
                ]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_id",
                    "courses_avg"
                ],
                "ORDER": "courses_avg",
                "FORM": "TABLE"
            }

        })
            .then(function (value: any) {
                returnarray = value.body['result'];
                expect(returnarray.length).to.equal(56);
                for (let i: number = 0; i < returnarray.length; i++) {
                    if (i < 14 || i == 55) {
                        expect(returnarray[i]['courses_dept']).to.equal('adhe');
                    }
                    else {
                        expect(returnarray[i]['courses_avg']).to.equal(95);
                    }
                }
                expect(value.code).to.equal(200);
            })
            .catch(function (err: any) {
                // console.log(err);
            })

    });

    it(' find all courses from a dept except some examples  ', function () {
        return ifac.performQuery({
            "WHERE": {
                "AND": [
                    {
                        "AND": [
                            {
                                "NOT": {
                                    "IS": {
                                        "courses_title": "comptn, progrmng"
                                    }
                                }
                            },
                            {
                                "NOT": {
                                    "IS": {
                                        "courses_title": "func & logic prg"
                                    }
                                }
                            }
                        ]


                    },
                    {
                        "IS": {
                            "courses_dept": "cpsc"
                        }
                    }
                ]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_instructor",
                    "courses_dept",
                    "courses_id",
                    "courses_title"
                ],
                "ORDER": "courses_title",
                "FORM": "TABLE"
            }
        })
            .then(function (value: any) {

                returnarray = value.body['result'];
                // console.log(returnarray)
                expect(value.code).to.equal(200);

            })
            .catch(function (err: any) {
                expect.fail();
            })
    });

//NEW TESTS TO DEBUG IS AND NOT CASES

    //test not
    it('NOT', function () {
        return ifac.performQuery({
            "WHERE": {
                "NOT": {
                    "GT": {
                        "courses_avg": 1
                    }
                }
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_avg"
                ],
                "ORDER": "courses_avg",
                "FORM": "TABLE"
            }
        })
            .then(function (value: any) {
                returnarray = value.body['result'];
                expect(returnarray.length).to.equal(4);
                expect(returnarray[0]['courses_avg']).to.equal(0);
                expect(returnarray[0]['courses_dept']).to.equal("frst");
                expect(returnarray[3]['courses_avg']).to.equal(1);
                expect(returnarray[3]['courses_dept']).to.equal("wood");
                expect(value.code).to.equal(200);
            })
            .catch(function (err: any) {
                expect.fail();
            })
    });

    //  find all sections in a dept not taught by a specific person
    it('All sections in a dept NOT taught by a specific person', function () {
        return ifac.performQuery({
            "WHERE": {
                "AND": [

                    {
                        "NOT": {
                            "IS": {
                                "courses_instructor": "acton, donald"
                            }
                        }
                    },
                    {
                        "IS": {
                            "courses_dept": "cpsc"
                        }
                    }
                ]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_instructor",
                    "courses_dept",
                    "courses_id"
                ],
                "ORDER": "courses_instructor",
                "FORM": "TABLE"
            }
        })
            .then(function (value: any) {
                expect(value.code).to.equal(200);
                returnarray = value.body['result'];
                expect(returnarray.length).to.equal(1085);
                for (let i: number = 0; i < returnarray.length; i++) {
                    // make sure that it got everything other than Acton
                    expect(returnarray[i]['course_instructor']).not.equal('acton, donald');
                }
            })
            .catch(function (err: any) {
                expect.fail();
            })
    });


//START OF QUERRY ERROR TESTING
    console.log('QUERY ERROR TESTING STARTED')

    it('NO OPTIONS INCLUDED', function () {
        return ifac.performQuery(({
            "WHERE": {
                "OR": [
                    {
                        "AND": [
                            {
                                "GT": {
                                    "courses_avg": 90
                                }
                            },
                            {
                                "IS": {
                                    "courses_dept": "adhe"
                                }
                            }
                        ]
                    },
                    {
                        "EQ": {
                            "courses_avg": 95
                        }
                    }
                ]
            }
        }))
            .then(function (value: any) {
                expect.fail();
            })
            .catch(function (err: any) {
                expect(err.code).to.equal(400);
            })
    });


    it('NO COLUMNS', function () {
        return ifac.performQuery({
            "WHERE": {
                "OR": [
                    {
                        "AND": [
                            {
                                "GT": {
                                    "courses_avg": 90
                                }
                            },
                            {
                                "IS": {
                                    "courses_dept": "adhe"
                                }
                            }
                        ]
                    },
                    {
                        "EQ": {
                            "courses_avg": 95
                        }
                    }
                ]
            },
            "OPTIONS": {
                "ORDER": "courses_avg",
                "FORM": "TABLE"
            }

        })
            .then(function (value: any) {
                expect.fail();
            })
            .catch(function (err: any) {
                expect(err.code).to.equal(400);
            })
    });

    it('NO VALUES IN COLUMNS ARRAY', function () {
        return ifac.performQuery({
            "WHERE": {
                "OR": [
                    {
                        "AND": [
                            {
                                "GT": {
                                    "courses_avg": 90
                                }
                            },
                            {
                                "IS": {
                                    "courses_dept": "adhe"
                                }
                            }
                        ]
                    },
                    {
                        "EQ": {
                            "courses_avg": 95
                        }
                    }
                ]
            },
            "OPTIONS": {
                "COLUMNS": [],
                "ORDER": "courses_avg",
                "FORM": "TABLE"
            }

        })
            .then(function (value: any) {
                expect.fail();
            })
            .catch(function (err: any) {
                expect(err.code).to.equal(400);
            })
    });


    it('NO VALUE GIVEN TO ORDER', function () {
        return ifac.performQuery({
            "WHERE": {
                "OR": [
                    {
                        "AND": [
                            {
                                "GT": {
                                    "courses_avg": 90
                                }
                            },
                            {
                                "IS": {
                                    "courses_dept": "adhe"
                                }
                            }
                        ]
                    },
                    {
                        "EQ": {
                            "courses_avg": 95
                        }
                    }
                ]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_id",
                    "courses_avg"
                ],
                "ORDER": '',
                "FORM": "TABLE"
            }

        })
            .then(function (value: any) {
                expect.fail();
            })
            .catch(function (err: any) {
                console.log(err);
                expect(err.code).to.equal(400);
            })
    });


    it('FORM IS NOT INCLUDED AT ALL', function () {
        return ifac.performQuery({
            "WHERE": {
                "OR": [
                    {
                        "AND": [
                            {
                                "GT": {
                                    "courses_avg": 66
                                }
                            },
                            {
                                "IS": {
                                    "courses_dept": "adhe"
                                }
                            }
                        ]
                    },
                    {
                        "EQ": {
                            "courses_dept": "apsc"
                        }
                    }
                ]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_id",
                    "courses_avg"
                ],
                "ORDER": "courses_avg"
            }

        })
            .then(function (value: any) {
                expect.fail();
            })
            .catch(function (err: any) {
                expect(err.code).to.equal(400);
            })
    });


    it('FORM SOMETHING NOT TABLE', function () {
        return ifac.performQuery({
            "WHERE": {
                "OR": [
                    {
                        "AND": [
                            {
                                "IS": {
                                    "courses_dept": "apsc"
                                }

                            },
                            {
                                "GT": {
                                    "courses_avg": 90
                                }
                            }
                        ]
                    },
                    {
                        "EQ": {
                            "courses_avg": 95
                        }
                    }
                ]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_id",
                    "courses_avg"
                ],
                "ORDER": "courses_avg",
                "FORM": "buttogram"
            }

        })
            .then(function (value: any) {
                expect.fail();
            })
            .catch(function (err: any) {
                expect(err.code).to.equal(400);
            })
    });


    it('EMPTY AND CASE', function () {
        return ifac.performQuery({
            "WHERE": {
                "AND": []
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_avg"
                ],
                "ORDER": "courses_avg",
                "FORM": "TABLE"
            }
        })
            .then(function (value: any) {
                expect.fail();
            })
            .catch(function (err: any) {
                expect(err.code).to.equal(400);
            })
    });

    it('INVALID KEYS TEST - IN ORDER', function () {
        return ifac.performQuery({
            "WHERE": {
                "AND": [
                    {
                        "GT": {
                            "courses_avg": 97.5
                        }
                    },
                    {
                        "LT": {
                            "courses_avg": 98
                        }
                    }
                ]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_avg"
                ],
                "ORDER": "WRONGKEYYY",
                "FORM": "TABLE"
            }
        })
            .then(function (value: any) {
                expect.fail();
            })
            .catch(function (err: any) {
                expect(err.code).to.equal(400);
            })
    });


   it('EMPTY QUERY TEST', function () {
        return ifac.performQuery({})
            .then(function (value: any) {
                expect.fail()
            })
            .catch(function (err: any) {
                expect(err.code).to.equal(400);
            })
    });

    it('INVALID KEY - ORDERING BY SOMETHING NOT THERE', function () {
        return ifac.performQuery({
            "WHERE": {
                "AND": [

                    {
                        "GT": {
                            "courses_avg": 97.5
                        }
                    },
                    {
                        "LT": {
                            "courses_avg": 98
                        }
                    }
                ]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept"
                ],
                "ORDER": "courses_audit",
                "FORM": "TABLE"
            }
        })
            .then(function (value: any) {
                expect.fail();
            })
            .catch(function (err: any) {
                expect(err.code).to.equal(400);
            })
    });


    it('test invalid keys - in AND statement', function () {
        return ifac.performQuery({
            "WHERE": {
                "AND": [

                    {
                        "GT": {
                            "courses_arverage": 97.5
                        }
                    },
                    {
                        "LT": {
                            "courses_avg": 98
                        }
                    }
                ]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_avg"
                ],
                "ORDER": "courses_avg",
                "FORM": "TABLE"
            }
        })
            .then(function (value: any) {
                expect.fail();
            })
            .catch(function (err: any) {
                expect(err.code).to.equal(400);
            })
    });


    it("INVALID WHERE PERAMETER", function () {
        return ifac.performQuery({
            "WHERE": {
                "IS": {
                    "": "aanb"
                }
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_id"
                ],
                "ORDER": "courses_id",
                "FORM": "TABLE"
            }
        })
            .then(function (value: any) {
                expect.fail();
            })
            .catch(function (err: any) {
                expect(err.code).to.equal(400);
            })
    });



    it('Testing Invalid Query - No OPTIONS', function () {
        let query = {
            WHERE: {
                EQ: {courses_avg: 50},
            }
        }


        return ifac.performQuery(query)
            .then(function (value: any) {

                //console.log('Code: ' + value.code);
                expect.fail();
            }).catch(function (err: CourseResp) {
                //console.log(err);
                expect(err.code).to.equal(400);
            })
    });

    it('Testing Invalid Query - No WHERE', function () {
        let query = {
            OPTIONS: {
                COLUMNS: ['courses_dept',
                    'courses_avg'],
                ORDER: "courses_avg",
                FORM: "TABLE"
            }
        }


        return ifac.performQuery(query)
            .then(function (value: any) {
                //console.log('Code: ' + value.code);
                expect(value.code).to.equal(400);

            }).catch(function (err: CourseResp) {
                //console.log(err);
                expect(err.code).to.equal(400);
            })
    });

    it('Testing Invalid Query - Where with only AND filter', function () {
        let query = {
            WHERE: {AND: {}},
            OPTIONS: {
                COLUMNS: ['courses_dept',
                    'courses_avg'],
                ORDER: "courses_avg",
                FORM: "TABLE"
            }
        }


        return ifac.performQuery(query)
            .then(function (value: any) {
                //console.log('Code: ' + value.code);
                expect(value.code).to.equal(200);

            }).catch(function (err: CourseResp) {
                //console.log(err);
                expect(err.code).to.equal(400);
            })
    });

    it('Testing Invalid Query - Where with only OR filter', function () {
        let query = {
            WHERE: {OR: {}},
            OPTIONS: {
                COLUMNS: ['courses_dept',
                    'courses_avg'],
                ORDER: "courses_avg",
                FORM: "TABLE"
            }
        }


        return ifac.performQuery(query)
            .then(function (value: any) {
                // console.log('Code: ' + value.code);
                expect(value.code).to.equal(200);

            }).catch(function (err: CourseResp) {
                // console.log(err);
                expect(err.code).to.equal(400);
            })
    });

    it('Testing Invalid Query - WHERE exist but empty COLUMNS', function () {
        let query = {
            WHERE: {},
            OPTIONS: {
                COLUMNS: [{}],
                ORDER: "courses_avg",
                FORM: "TABLE"
            }
        }


        return ifac.performQuery(query)
            .then(function (value: any) {
                //console.log('Code: ' + value.code);
                expect.fail();
            }).catch(function (err: CourseResp) {
                //console.log(err);
                expect(err.code).to.equal(400);
            })
    });

    it('Testing Invalid Query - FORM is missing', function () {
        let query = {
            WHERE: {},
            OPTIONS: {
                COLUMNS: [{}],
                ORDER: "courses_avg",
            }
        }


        return ifac.performQuery(query)
            .then(function (value: any) {

                // console.log('Code: ' + value.code);
                expect.fail();
            }).catch(function (err: CourseResp) {
                //console.log(err);
                expect(err.code).to.equal(400);
            })
    });

    it('Testing Invalid Query - FORM is not TABLE', function () {
        let query = {
            WHERE: {},
            OPTIONS: {
                COLUMNS: [{}],
                ORDER: "courses_avg",
                FORM: 'notTABLE'
            }
        }


        return ifac.performQuery(query)
            .then(function (value: any) {

                //console.log('Code: ' + value.code);
                expect.fail();
            }).catch(function (err: CourseResp) {
                //console.log(err);
                expect(err.code).to.equal(400);
            })
    });

    it('Testing Invalid Query - COLUMN under OPTIONS are invalid', function () {
        let query = {
            WHERE: {},
            OPTIONS: {
                COLUMNS: ["courses_de"],
                ORDER: "courses_avg",
                FORM: 'notTABLE'
            }
        }


        return ifac.performQuery(query)
            .then(function (value: any) {
                // console.log('Code: ' + value.code);
                expect.fail();
            }).catch(function (err: CourseResp) {
                //console.log(err);
                expect(err.code).to.equal(400);
            })
    });



    it('Testing EQ - Invalid Column', function () {
        let query = {
            WHERE: {
                EQ: {courses_avg: 50},
            },
            OPTIONS: {
                COLUMNS: ['coes_dpt',
                    'courses_avg'],
                ORDER: "courses_avg",
                FORM: "TABLE"


            }
        }

        return ifac.performQuery(query)
            .then(function (value: any) {
                //console.log('Code: ' + value.code);
                expect.fail();
            }).catch(function (err: CourseResp) {
                //console.log(err);
                expect(err.code).to.equal(400);
            })
    });

    it('Testing EQ - value not a number', function () {
        let query = {
            WHERE: {
                EQ: {courses_avg: "50"},
            },
            OPTIONS: {
                COLUMNS: ['courses_dept',
                    'courses_avg'],
                ORDER: "courses_avg",
                FORM: "TABLE"


            }
        }

        return ifac.performQuery(query)
            .then(function (value: any) {
                //console.log('Code: ' + value.code);
                expect.fail();
            }).catch(function (err: CourseResp) {
                //console.log(err);
                expect(err.code).to.equal(400);
            })
    });


    it('Testing GT - Invalid Column', function () {
        let query = {
            WHERE: {
                GT: {courses_avg: 50},
            },
            OPTIONS: {
                COLUMNS: ['coes_dpt',
                    'courses_avg'],
                ORDER: "courses_avg",
                FORM: "TABLE"


            }
        }

        return ifac.performQuery(query)
            .then(function (value: any) {
                //console.log('Code: ' + value.code);
                expect.fail();
            }).catch(function (err: CourseResp) {
                //console.log(err);
                expect(err.code).to.equal(400);
            })
    });

    it('Testing GT - value GT not a number', function () {
        let query = {
            WHERE: {
                GT: {courses_avg: '50'},
            },
            OPTIONS: {
                COLUMNS: ['courses_dept',
                    'courses_avg'],
                ORDER: "courses_avg",
                FORM: "TABLE"


            }
        }

        return ifac.performQuery(query)
            .then(function (value: any) {
                // console.log('Code: ' + value.code);
                expect.fail();
            }).catch(function (err: CourseResp) {
                //console.log(err);
                expect(err.code).to.equal(400);
            })
    });

    it('Testing Invalid nested key should return 400', function () {
        let query = {

            WHERE: {
                OR: [
                    {
                        AND: [
                            {
                                GT: {
                                    courses_avg: 90
                                }
                            },
                            {
                                IS: {
                                    courses_foo: "cpsc"
                                }
                            }
                        ]
                    },
                    {
                        EQ: {
                            courses_avg: 95
                        }
                    }
                ]
            },
            OPTIONS: {
                COLUMNS: [
                    "courses_dept",
                    "courses_id",
                    "courses_avg"
                ],
                ORDER: "courses_avg",
                FORM: "TABLE"
            }
        }


        return ifac.performQuery(query)
            .then(function (value: any) {
                // console.log('Code: ' + value.code);
                expect.fail();
            }).catch(function (err: CourseResp) {
                //  console.log(err);
                expect(err.code).to.equal(400);
            })
    });

    it('Testing Invalid Order - course_XXX', function () {
        let query = {
            WHERE: {
                EQ: {courses_avg: 50},
            },

            OPTIONS: {
                COLUMNS: ['courses_dept',
                    'courses_avg'
                ],
                ORDER: "courses_foo",
                FORM: "TABLE"
            }
        }

        return ifac.performQuery(query)
            .then(function (value: any) {
                //console.log('Code: ' + value.code);
                expect.fail();

            }).catch(function (err: CourseResp) {
                // console.log(err);
                expect(err.code).to.equal(400);
            })
    });

    it('Testing Invalid Order - value is not a string', function () {
        let query = {
            WHERE: {
                EQ: {courses_avg: 50},
            },

            OPTIONS: {
                COLUMNS: ['courses_dept',
                    'courses_avg'
                ],
                ORDER: 6,
                FORM: "TABLE"
            }
        }

        return ifac.performQuery(query)
            .then(function (value: any) {
                // console.log('Code: ' + value.code);
                expect.fail();

            }).catch(function (err: CourseResp) {
                // console.log(err);
                expect(err.code).to.equal(400);
            })
    });




    it('Testing more than 1 filter in WHERE', function () {
        let query = {
            WHERE: {
                AND: [
                    {
                        AND: [
                            {
                                GT: {
                                    courses_avg: 90
                                }
                            },
                            {
                                IS: {
                                    courses_dept: "cpsc"
                                }
                            }
                        ]
                    },
                    {
                        EQ: {
                            courses_avg: 95
                        }
                    },
                    {
                        LT: {
                            courses_avg: 40
                        }
                    }
                ],

                LT: {courses_pass: 60}
            },
            OPTIONS: {
                COLUMNS: [
                    "courses_dept",
                    "courses_id",
                    "courses_avg"
                ],
                ORDER: "courses_avg",
                FORM: "TABLE"
            }
        }

        return ifac.performQuery(query)
            .then(function (value: any) {
                // console.log('Code: ' + value.code);
                expect.fail();

            }).catch(function (err: CourseResp) {
                //  console.log(err);
                expect(err.code).to.equal(400);
            })
    });




    it('Testing Invalid Order - value of order is not in column', function () {
        let query = {
            WHERE: {
                EQ: {courses_avg: 50},
            },

            OPTIONS: {
                COLUMNS: ['courses_dept',
                    'courses_avg'
                ],
                ORDER: 'courses_title',
                FORM: "TABLE"
            }
        }

        return ifac.performQuery(query)
            .then(function (value: any) {
                //console.log('Code: ' + value.code);
                expect.fail();

            }).catch(function (err: CourseResp) {
                // console.log(err);
                expect(err.code).to.equal(400);
            })
    });

    it('Test invalid column in LT', function () {
        return ifac.performQuery({
            "WHERE": {
                "LT": {
                    "courses_de": 50
                }
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_id"
                ],
                "ORDER": "courses_id",
                "FORM": "TABLE"
            }
        })
            .then(function (value: any) {
                expect.fail();
            })
            .catch(function (err: any) {
                // console.log(err);
                expect(err.code).to.equal(400);
            })
    });

    it('Test not a number in  in LT', function () {
        return ifac.performQuery({
            "WHERE": {
                "LT": {
                    "courses_de": "50"
                }
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_id"
                ],
                "ORDER": "courses_id",
                "FORM": "TABLE"
            }
        })
            .then(function (value: any) {
                expect.fail();
            })
            .catch(function (err: any) {
                // console.log(err);
                expect(err.code).to.equal(400);
            })
    });

    it('Test invalid column in EQ', function () {
        return ifac.performQuery({
            "WHERE": {
                "EQ": {
                    "courses_de": 50
                }
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_id"
                ],
                "ORDER": "courses_id",
                "FORM": "TABLE"
            }
        })
            .then(function (value: any) {
                expect.fail();
            })
            .catch(function (err: any) {
                // console.log(err);
                expect(err.code).to.equal(400);
            })
    });


    it('Test invalid if NOT EQ', function () {
        return ifac.performQuery({
            "WHERE": {

                "NOT": {
                    "EQ": {"courses_de": 50}
                }

            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_id"
                ],
                "ORDER": "courses_id",
                "FORM": "TABLE"
            }
        })
            .then(function (value: any) {
                expect.fail();
            })
            .catch(function (err: any) {
                // console.log(err);
                expect(err.code).to.equal(400);
            })
    });


    it('Test not a string for IS', function () {
        return ifac.performQuery({
            "WHERE": {

                "NOT": {
                    "IS": {"courses_dept": 50}
                }

            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_id"
                ],
                "ORDER": "courses_id",
                "FORM": "TABLE"
            }
        })
            .then(function (value: any) {
                expect.fail();
            })
            .catch(function (err: any) {
                //console.log(err);
                expect(err.code).to.equal(400);
            })
    });

    it('Test if key in ORDEr id valid', function () {
        return ifac.performQuery({
            "WHERE": {

                "NOT": {
                    "IS": {"courses_dept": 50}
                }

            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_id"
                ],
                "ORDER": "courses_notaKey",
                "FORM": "TABLE"
            }
        })
            .then(function (value: any) {
                expect.fail();
            })
            .catch(function (err: any) {
                //console.log(err);
                expect(err.code).to.equal(400);
            })
    });

    it('Test if OPTIONS is Empty', function () {
        return ifac.performQuery({
            "WHERE": {

                "NOT": {
                    "IS": {"courses_dept": 50}
                }

            },
            "OPTIONS": {}
        })
            .then(function (value: any) {
                expect.fail();
            })
            .catch(function (err: any) {
                // console.log(err);
                expect(err.code).to.equal(400);
            })
    });

    it('Test if NOT EQ', function () {
        return ifac.performQuery({
            "WHERE": {

                "NOT": {
                    "EQ": {"courses_pass": 50}
                }

            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_pass",
                    "courses_id"
                ],
                "ORDER": "courses_pass",
                "FORM": "TABLE"
            }
        })
            .then(function (value: any) {
                expect(value.code).to.equal(200);
            })
            .catch(function (err: any) {
                // console.log(err);
                expect.fail();
            })
    });


    it(' Deep test for invalid column  ', function () {
        return ifac.performQuery({
            "WHERE": {
                "AND": [
                    {
                        "AND": [
                            {
                                "NOT": {
                                    "IS": {
                                        "courses_title": "comptn, progrmng"
                                    }
                                }
                            },
                            {
                                "NOT": {
                                    "IS": {
                                        "courses_title": "func & logic prg"
                                    }
                                }
                            }
                        ]


                    },
                    {
                        "IS": {
                            "courses_dept": "cpsc"
                        }
                    }
                ]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_not",
                    "courses_dept",
                    "courses_id",
                    "courses_title"
                ],
                "ORDER": "courses_title",
                "FORM": "TABLE"
            }
        })
            .then(function (value: any) {

                returnarray = value.body['result'];
                // console.log(returnarray)
                expect.fail();

            })
            .catch(function (err: any) {
                expect(err.code).to.equal(400);
            })
    });

    it(' Deep test for LT not a number  ', function () {
        return ifac.performQuery({
            "WHERE": {
                "AND": [
                    {
                        "AND": [
                            {
                                "NOT": {
                                    "LT": {
                                        "courses_fail": "5"
                                    }
                                }
                            },
                            {
                                "NOT": {
                                    "IS": {
                                        "courses_title": "func & logic prg"
                                    }
                                }
                            }
                        ]


                    },
                    {
                        "IS": {
                            "courses_dept": "cpsc"
                        }
                    }
                ]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_not",
                    "courses_dept",
                    "courses_id",
                    "courses_title"
                ],
                "ORDER": "courses_title",
                "FORM": "TABLE"
            }
        })
            .then(function (value: any) {

                returnarray = value.body['result'];
                //console.log(returnarray)
                expect.fail();

            })
            .catch(function (err: any) {
                expect(err.code).to.equal(400);
            })
    });

    it('Test invalid column in LT', function () {
        return ifac.performQuery({
            "WHERE": {
                "LT": {
                    "courses_de": 50
                }
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_id"
                ],
                "ORDER": "courses_id",
                "FORM": "TABLE"
            }
        })
            .then(function (value: any) {
                expect.fail();
            })
            .catch(function (err: any) {
                //console.log(err);
                expect(err.code).to.equal(400);
            })
    });

    it('Test not a number in  in LT', function () {
        return ifac.performQuery({
            "WHERE": {
                "LT": {
                    "courses_de": "50"
                }
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_id"
                ],
                "ORDER": "courses_id",
                "FORM": "TABLE"
            }
        })
            .then(function (value: any) {
                expect.fail();
            })
            .catch(function (err: any) {
                //  console.log(err);
                expect(err.code).to.equal(400);
            })
    });

    it('Test invalid column in EQ', function () {
        return ifac.performQuery({
            "WHERE": {
                "EQ": {
                    "courses_de": 50
                }
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_id"
                ],
                "ORDER": "courses_id",
                "FORM": "TABLE"
            }
        })
            .then(function (value: any) {
                expect.fail();
            })
            .catch(function (err: any) {
                // console.log(err);
                expect(err.code).to.equal(400);
            })
    });

    it('Test invalid if NOT EQ', function () {
        return ifac.performQuery({
            "WHERE": {

                "NOT": {
                    "EQ": {"courses_de": 50}
                }

            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_id"
                ],
                "ORDER": "courses_id",
                "FORM": "TABLE"
            }
        })
            .then(function (value: any) {
                expect.fail();
            })
            .catch(function (err: any) {
                //  console.log(err);
                expect(err.code).to.equal(400);
            })
    });


    it('Test not a string for IS', function () {
        return ifac.performQuery({
            "WHERE": {

                "NOT": {
                    "IS": {"courses_dept": 50}
                }

            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_id"
                ],
                "ORDER": "courses_id",
                "FORM": "TABLE"
            }
        })
            .then(function (value: any) {
                expect.fail();
            })
            .catch(function (err: any) {
                // console.log(err);
                expect(err.code).to.equal(400);
            })
    });

    it('Test if key in ORDEr id valid', function () {
        return ifac.performQuery({
            "WHERE": {

                "NOT": {
                    "IS": {"courses_dept": 50}
                }

            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_id"
                ],
                "ORDER": "courses_notaKey",
                "FORM": "TABLE"
            }
        })
            .then(function (value: any) {
                expect.fail();
            })
            .catch(function (err: any) {
                // console.log(err);
                expect(err.code).to.equal(400);
            })
    });

    it('Test if OPTIONS is Empty', function () {
        return ifac.performQuery({
            "WHERE": {

                "NOT": {
                    "IS": {"courses_dept": 50}
                }

            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_id"
                ],
                "ORDER": "courses_notaKey",
                "FORM": "TABLE"
            }
        })
            .then(function (value: any) {
                expect.fail();
            })
            .catch(function (err: any) {
                // console.log(err);
                expect(err.code).to.equal(400);
            })
    });

    it('Test if NOT EQ', function () {
        return ifac.performQuery({
            "WHERE": {

                "NOT": {
                    "EQ": {"courses_pass": 50}
                }

            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_id"
                ],
                "ORDER": "courses_notaKey",
                "FORM": "TABLE"
            }
        })
            .then(function (value: any) {
                expect.fail();
            })
            .catch(function (err: any) {
                //console.log(err);
                expect(err.code).to.equal(400);
            })
    });



    it(' Deep test for invalid column  ', function () {
        return ifac.performQuery({
            "WHERE": {
                "AND": [
                    {
                        "AND": [
                            {
                                "NOT": {
                                    "IS": {
                                        "courses_title": "comptn, progrmng"
                                    }
                                }
                            },
                            {
                                "NOT": {
                                    "IS": {
                                        "courses_title": "func & logic prg"
                                    }
                                }
                            }
                        ]


                    },
                    {
                        "IS": {
                            "courses_dept": "cpsc"
                        }
                    }
                ]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_not",
                    "courses_dept",
                    "courses_id",
                    "courses_title"
                ],
                "ORDER": "courses_title",
                "FORM": "TABLE"
            }
        })
            .then(function (value: any) {

                returnarray = value.body['result'];
                //console.log(returnarray)
                expect.fail();

            })
            .catch(function (err: any) {
                expect(err.code).to.equal(400);
            })
    });

    it(' Deep test for LT not a number  ', function () {
        return ifac.performQuery({
            "WHERE": {
                "AND": [
                    {
                        "AND": [
                            {
                                "NOT": {
                                    "LT": {
                                        "courses_fail": "5"
                                    }
                                }
                            },
                            {
                                "NOT": {
                                    "IS": {
                                        "courses_title": "func & logic prg"
                                    }
                                }
                            }
                        ]


                    },
                    {
                        "IS": {
                            "courses_dept": "cpsc"
                        }
                    }
                ]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_not",
                    "courses_dept",
                    "courses_id",
                    "courses_title"
                ],
                "ORDER": "courses_title",
                "FORM": "TABLE"
            }
        })
            .then(function (value: any) {

                returnarray = value.body['result'];
                //console.log(returnarray)
                expect.fail();

            })
            .catch(function (err: any) {
                expect(err.code).to.equal(400);
            })
    });


    it("Delete the whole rooms folder", function () {
        fs.unlink('./rooms.txt', (err: any) => {
            if (err) {
                expect.fail(err);
                //console.log('no folder to delete, its empty!');
            }
            else console.log('deleted courses.txt, ready to test');
        })
    });

    it("Testing addData(204 code) - Rooms", function () {
        return ifac.addDataset("rooms", zipRoomContent)
            .then(function (value: CourseResp) {
                //console.log(value)
                expect(value.code).to.equal(204);
            })
            .catch(function (err: CourseResp) {
                console.log('Error in adddata test');
                expect.fail();
            })
    });

    it("Testing addData(201 code) - Rooms", function () {
        return ifac.addDataset("rooms", zipRoomContent)
            .then(function (value: CourseResp) {
                //console.log(value)
                expect(value.code).to.equal(201);
            })
            .catch(function (err: CourseResp) {
                console.log('Error in adddata test');
                expect.fail();
            })
    });

    it('Room is test', function () {
        return ifac.performQuery({
            "WHERE": {
                "IS": {
                    "rooms_address": "6363 Agronomy Road"
                }
            },
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_address", "rooms_name"
                ],
                "FORM": "TABLE"
            }
        })
            .then( function (value:any) {
                returnarray = value.body['result'];
                expect(returnarray.length).to.equal(21);
                expect(value.code).to.equal(200);
            })
            .catch(function (err:any) {
                console.log(err);
                expect.fail();
            })
    });

    it('Query A, from d2 webpage', function () {
        return ifac.performQuery({
            "WHERE": {
                "IS": {
                    "rooms_name": "DMP_*"
                }
            },
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_name"
                ],
                "ORDER": "rooms_name",
                "FORM": "TABLE"
            }
        })
            .then( function (value:any) {
                returnarray = value.body['result'];
                expect(returnarray.length).to.equal(5);

            })
            .catch(function (err:any) {
                console.log(err);
                expect.fail();
            })
    });

    it('Query B, from d2 webpage', function () {
        return ifac.performQuery({
                "WHERE": {
                    "IS": {
                        "rooms_address": "*Agrono*"
                    }
                },
                "OPTIONS": {
                    "COLUMNS": [
                        "rooms_address", "rooms_name"
                    ],
                    "FORM": "TABLE"
                }
            }
        )
            .then( function (value:any) {
                returnarray = value.body['result'];
                console.log(returnarray.length)
                expect(returnarray.length).to.equal(26);
                expect(value.code).to.equal(200);
            })
            .catch(function (err:any) {
                console.log(err);
                expect.fail();
            })
    });

    it('Metro: Should be able to find rooms with more than a certain number of seats (GT)', function () {
        return ifac.performQuery({
                "WHERE": {
                    "GT": {
                        "rooms_seats": 50
                    }
                },
                "OPTIONS": {
                    "COLUMNS": [
                        "rooms_seats",
                        'rooms_name'
                    ],
                    "ORDER": "rooms_seats",
                    "FORM": "TABLE"
                }
            }
        )
            .then( function (value:any) {
                returnarray = value.body['result'];
                //console.log(returnarray);
                expect(value.code).to.equal(200);
            })
            .catch(function (err:any) {
                console.log(err);
                expect.fail();
            })
    });


    it('Metro: Should be able to find rooms with more than a certain number of seats (NOT LT)', function () {
        return ifac.performQuery({
                "WHERE": {
                    "NOT":{
                        "LT": {
                            "rooms_seats": 50
                        }}
                },
                "OPTIONS": {
                    "COLUMNS": [
                        "rooms_seats", "rooms_name"
                    ],
                    "ORDER": "rooms_seats",
                    "FORM": "TABLE"
                }
            }
        )
            .then( function (value:any) {
                returnarray = value.body['result'];
                // console.log(returnarray);
                expect(value.code).to.equal(200);
            })
            .catch(function (err:any) {
                console.log(err);
                expect.fail();
            })
    });

    it('Nautilus: Should be able to find all rooms of a certain type (wildcard*)', function () {
        return ifac.performQuery({
                "WHERE": {
                    "IS":{
                        "rooms_type":"Tiered*"
                    }
                },
                "OPTIONS": {
                    "COLUMNS": [
                        "rooms_type", "rooms_name"
                    ],
                    "ORDER": "rooms_name",
                    "FORM": "TABLE"
                }
            }
        )
            .then( function (value:any) {
                returnarray = value.body['result'];
                //  console.log(returnarray);
                expect(value.code).to.equal(200);
            })
            .catch(function (err:any) {
                console.log(err);
                expect.fail();
            })
    });

    it('Nautilus: Should be able to find all rooms of a certain type (*wildcard)', function () {
        return ifac.performQuery({
                "WHERE": {
                    "IS":{
                        "rooms_type":"*Purpose"
                    }
                },
                "OPTIONS": {
                    "COLUMNS": [
                        "rooms_type", "rooms_name"
                    ],
                    "ORDER": "rooms_name",
                    "FORM": "TABLE"
                }
            }
        )
            .then( function (value:any) {
                returnarray = value.body['result'];
                //console.log(returnarray);
                expect(value.code).to.equal(200);
            })
            .catch(function (err:any) {
                console.log(err);
                expect.fail();
            })
    });

    it('Nautilus: Should be able to find all rooms of a certain type (empty String)', function () {
        return ifac.performQuery({
                "WHERE": {
                    "OR": [
                        {
                            "LT": {
                                "rooms_lat": 49.2
                            }
                        },

                        {
                            "GT": {
                                "rooms_lat": 49.8
                            }
                        },

                        {
                            "LT": {
                                "rooms_lon":-123.2599
                            }
                        },

                        {
                            "GT": {
                                "rooms_lon":-123.2442
                            }
                        }
                    ]
                },
                "OPTIONS": {
                    "COLUMNS": [
                        "rooms_fullname",
                        "rooms_shortname",
                        "rooms_number",
                        "rooms_name",
                        "rooms_address",
                        "rooms_type",
                        "rooms_furniture",
                        "rooms_href",
                        "rooms_lat",
                        "rooms_lon",
                        "rooms_seats"
                    ],
                    "ORDER": "rooms_name",
                    "FORM": "TABLE"
                }
            }
        )
            .then( function (value:any) {
                returnarray = value.body['result'];
                //console.log(returnarray);
                expect(value.code).to.equal(200);
            })
            .catch(function (err:any) {
                console.log(err);
                expect.fail();
            })
    });

    // ****END OF D2 TESTS, START D3 TESTS HERE*****
    //
    //  it("Oxygen", function() {
    //  return ifac.performQuery({
    //  "WHERE": {
    //  "GT" : {
    //  "rooms_number" : 310
    //  }
    //  },
    //  "OPTIONS" : {
    //  "COLUMNS" : [
    //  "rooms_name"
    //  ],
    //  "ORDER" : "rooms_name",
    //  "FORM" : "TABLE"
    //  }
    //  })
    //  .then(function (value:any) {
    //  expect.fail();
    //  }) .catch(function (err:any) {
    //  console.log(err);
    //  expect(err.code).to.equal(400);
    //  })
    //  });

    it("PUT Basic Test", function () {
        return chai.request('http://localhost:2645')
            .put('/dataset/courses')
            .attach("body", fs.readFileSync("./courses.zip"), "courses")
            .then(function (res: any) {
                Log.trace('then:');
                expect(res).equals(res);
            })
            .catch(function (err:any) {
                Log.trace('catch:');
                // console.log(err);
                // some assertions
                expect.fail();

            })
    });

    it('(course_avg > 90 AND adhe) OR courses_avg == 95', function () {
        return ifac.performQuery({
            "WHERE": {
                "OR": [
                    {
                        "AND": [
                            {
                                "GT": {
                                    "courses_avg": 90
                                }
                            },
                            {
                                "IS": {
                                    "courses_dept": "adhe"
                                }
                            }
                        ]
                    },
                    {
                        "EQ": {
                            "courses_avg": 95
                        }
                    }
                ]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_id",
                    "courses_avg"
                ],
                "ORDER": "courses_avg",
                "FORM": "TABLE"
            }
        })
            .then(function (value: any) {
                returnarray = value.body['result'];
                expect(returnarray.length).to.equal(56);
                for (let i: number = 0; i < (returnarray.length | 55); i++) {
                    if (i < 14 || i == 55) {
                        expect(returnarray[i]['courses_dept']).to.equal('adhe');
                    }
                }
                expect(value.code).to.equal(200);
            })
            .catch(function (err: any) {
                console.log(err);
            })
    });




   it("put Basic Test", function () {
        return chai.request('http://localhost:2645')
            .put('/dataset/courses')
            .attach("body", fs.readFileSync("./courses.zip"), "courses")
            .then(function (res: any) {
                Log.trace('then:');
                expect(res).equals(res);
            })
            .catch(function (err:any) {
                Log.trace('catch:');
                //console.log(err);
                // some assertions
                expect.fail();
            });
    });

    it("DEL Basic Test", function () {
        return chai.request('http://localhost:2645')
            .del('/dataset/courses')
            .then(function (resu: any) {
                Log.trace('then:');
               // console.log(resu.statusCode);
                expect(resu).equals(resu);
            })
            .catch(function (err:any) {
                Log.trace('catch:');
                // console.log(err);
                // some assertions
                expect.fail();
            });
    });

    it("POST description", function () {
        let queryJSONObject : {} = {
            "WHERE": {
                "IS":{
                    "rooms_type":"*Purpose"
                }
            },
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_type", "rooms_name"
                ],
                "ORDER": "rooms_name",
                "FORM": "TABLE"
            }
        };

        return chai.request('http://localhost:2645')
            .post('/query')
            .send(queryJSONObject)
            .then(function (res: any) {
                Log.trace('then:');
                // some assertions
            })
            .catch(function (err: any) {
                Log.trace('catch:');
                // some assertions
                expect.fail();
            });
    });

    it('(course_avg > 90 AND adhe) OR courses_avg == 95', function () {
        return ifac.performQuery({
            "WHERE": {
                "OR": [
                    {
                        "AND": [
                            {
                                "GT": {
                                    "courses_avg": 90
                                }
                            },
                            {
                                "IS": {
                                    "courses_dept": "adhe"
                                }
                            }
                        ]
                    },
                    {
                        "EQ": {
                            "courses_avg": 95
                        }
                    }
                ]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_id",
                    "courses_avg"
                ],
                "ORDER": "courses_avg",
                "FORM": "TABLE"
            }
        })
            .then(function (value: any) {
                returnarray = value.body['result'];
                expect(returnarray.length).to.equal(56);
                for (let i: number = 0; i < (returnarray.length | 55); i++) {
                    if (i < 14 || i == 55) {
                        expect(returnarray[i]['courses_dept']).to.equal('adhe');
                    }
                }
                expect(value.code).to.equal(200);
            })
            .catch(function (err: any) {
                //console.log(err);
            })
    });


    it("Testing Group", function() {
        return ifac.performQuery({
            "WHERE": {
                "AND": [{
                    "IS": {
                        "rooms_furniture": "*Tables*"
                    }
                }, {
                    "GT": {
                        "rooms_seats": 300
                    }
                }]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_shortname",
                    "maxSeats"
                ],
                "ORDER": {
                    "dir": "DOWN",
                    "keys": ["maxSeats"]
                },
                "FORM": "TABLE"
            },
            "TRANSFORMATIONS": {
                "GROUP": ["rooms_shortname", "rooms_furniture"],
                "APPLY": [{
                    "maxSeats": {
                        "MAX": "rooms_seats"
                    }
                }]
            }
        })
            .then(function (value:any) {
                //console.log(value);
            }) .catch(function (err:any) {
               // //console.log(err);
                expect(err.code).to.equal(400);
            })
    });


    it('testing order by 2 elements', function () {
        return ifac.performQuery({
                "WHERE": {
                    "AND": [{
                        "IS": {
                            "rooms_furniture": "*a*"
                        }
                    }, {
                        "GT": {
                            "rooms_seats": 20
                        }
                    }]
                },
                "OPTIONS": {
                    "COLUMNS": [
                        "rooms_seats",
                        "rooms_shortname"
                    ],
                    "ORDER": {
                        "dir": "UP",
                        "keys": ["rooms_seats","rooms_shortname"]
                    },
                    "FORM": "TABLE"
                }
            }
        )
            .then(function (value: any) {
                returnarray = value.body['result'];
                expect(returnarray.length).to.equal(296);
                expect(value.code).to.equal(200);
                expect(returnarray[0]['rooms_shortname']).to.equal('AUDX');
                expect(returnarray[1]['rooms_seats']).to.equal(21);
                expect(returnarray[97]['rooms_seats']).to.equal(36);

            })
            .catch(function (err: any) {
               // //console.log(err);
                expect.fail();
            })
    });

    it('testing order by 2 elements - reverse', function () {
        return ifac.performQuery({
                "WHERE": {
                    "AND": [{
                        "IS": {
                            "rooms_furniture": "*a*"
                        }
                    }, {
                        "GT": {
                            "rooms_seats": 20
                        }
                    }]
                },
                "OPTIONS": {
                    "COLUMNS": [
                        "rooms_seats",
                        "rooms_shortname"
                    ],
                    "ORDER": {
                        "dir": "DOWN",
                        "keys": ["rooms_seats","rooms_shortname"]
                    },
                    "FORM": "TABLE"
                }
            }
        )
            .then(function (value: any) {
                returnarray = value.body['result'];
                expect(returnarray.length).to.equal(296);
                expect(value.code).to.equal(200);
                expect(returnarray[0]['rooms_shortname']).to.equal('WOOD');
                expect(returnarray[1]['rooms_seats']).to.equal(442);
                expect(returnarray[50]['rooms_seats']).to.equal(114);

            })
            .catch(function (err: any) {
               // //console.log(err);
                expect.fail();
            })
    });

     it('testing order by 3 elements', function () {
     return ifac.performQuery({
             "WHERE": {
                 "AND": [{
                     "IS": {
                         "rooms_furniture": "*a*"
                     }
                 }, {
                     "GT": {
                         "rooms_seats": 150
                     }
                 }]
             },
             "OPTIONS": {
                 "COLUMNS": [
                     "rooms_shortname",
                     "rooms_seats",
                     "rooms_furniture"
                 ],
                 "ORDER": {
                     "dir": "UP",
                     "keys": ["rooms_shortname","rooms_seats","rooms_furniture"]
                 },
                 "FORM": "TABLE"
             }
         }
     )
     .then(function (value: any) {
     returnarray = value.body['result'];
     expect(returnarray.length).to.equal(37);
     expect(value.code).to.equal(200);
     expect(returnarray[0]['rooms_shortname']).to.equal('ANGU');
     expect(returnarray[36]['rooms_seats']).to.equal(503);
     })
     .catch(function (err: any) {
    // console.log(err);
     expect.fail();
     })
     });

    it('Given Query A from d3 Page', function () {
        return ifac.performQuery({
            "WHERE": {
                "AND": [{
                    "IS": {
                        "rooms_furniture": "*Tables*"
                    }
                }, {
                    "GT": {
                        "rooms_seats": 300
                    }
                }]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_shortname",
                    "maxSeats"
                ],
                "ORDER": {
                    "dir": "DOWN",
                    "keys": ["maxSeats"]
                },
                "FORM": "TABLE"
            },
            "TRANSFORMATIONS": {
                "GROUP": ["rooms_shortname"],
                "APPLY": [{
                    "maxSeats": {
                        "MAX": "rooms_seats"
                    }
                }]
            }
        })
            .then(function (value: any) {
                returnarray = value.body['result'];
                expect(returnarray.length).to.equal(3);
                expect(returnarray[0]['rooms_shortname']).to.equal('OSBO');
                expect(returnarray[2]['maxSeats']).to.equal(350);
                expect(value.code).to.equal(200);
            })
            .catch(function (err: any) {
               // console.log(err);
                expect.fail();
            })
    });

    it('Given Query B from d3 Page', function () {
        return ifac.performQuery({
            "WHERE": {},
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_furniture"
                ],
                "ORDER": "rooms_furniture",
                "FORM": "TABLE"
            },
            "TRANSFORMATIONS": {
                "GROUP": ["rooms_furniture"],
                "APPLY": []
            }
        })
            .then(function (value: any) {
                returnarray = value.body['result'];
                expect(returnarray.length).to.equal(10);
            })
            .catch(function (err: any) {
               // console.log(err);
                expect.fail()
            })
    });


    it('invalid key in order array(d3)', function () {
        return ifac.performQuery({
                "WHERE": {
                    "AND": [{
                        "IS": {
                            "rooms_furniture": "*a*"
                        }
                    }, {
                        "GT": {
                            "rooms_seats": 20
                        }
                    }]
                },
                "OPTIONS": {
                    "COLUMNS": [
                        "rooms_seats",
                        "rooms_shortname"
                    ],
                    "ORDER": {
                        "dir": "DOWN",
                        "keys": ["rooms_seats","rooms_shortnameinvalidkey"]
                    },
                    "FORM": "TABLE"
                }
            }
        )
            .then(function (value: any) {
                expect.fail();

            })
            .catch(function (err: any) {
                expect(err.code).to.equal(400);

            })
    });

    it(" APPLY AVG seats", function () {
        return ifac.performQuery({
            "WHERE": {
                "AND": [{
                    "IS": {
                        "rooms_furniture": "*Tables*"
                    }
                }, {
                    "GT": {
                        "rooms_seats": 300
                    }
                }]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_shortname",
                    "avgSeats"
                ],
                "ORDER": {
                    "dir": "DOWN",
                    "keys": ["avgSeats"]
                },
                "FORM": "TABLE"
            },
            "TRANSFORMATIONS": {
                "GROUP": ["rooms_shortname"],
                "APPLY": [{
                    "avgSeats": {
                        "AVG": "rooms_seats"
                    }
                }]
            }
        })
            .then (function (value :any) {
                let expected = {
                    "render": "TABLE",
                    "result": [{
                        "rooms_shortname": "HEBB",
                        "countSeats": 1
                    }, {
                        "rooms_shortname": "LSC",
                        "countSeats": 1
                    }, {
                        "rooms_shortname": "OSBO",
                        "countSeats": 1
                    }]
                };
                let body :any = value.body['result'];
                let expectedResult = expected['result'];
                expect(body.length).to.equal(expectedResult.length);
                let LengthResponse : number = body.length;
                let endofRetVal : number = 0;
                let applyVal : string = 'countSeats';
                for (let i = 0; i<LengthResponse ; i++) {
                    if (endofRetVal != 0) {
                        expect(body[i][applyVal]).to.not.greaterThan(endofRetVal);
                    }
                    endofRetVal = body[i][applyVal];
                }

            })
            .catch(function (err : any) {
                expect.fail();
                //console.log("Error: " + err);
            })
    });


    it("Sacrilicious APPLY SUM seats", function () {
        return ifac.performQuery({
            "WHERE": {
                "AND": [{
                    "IS": {
                        "rooms_furniture": "*Tables*"
                    }
                }, {
                    "GT": {
                        "rooms_seats": 300
                    }
                }]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_shortname",
                    "sumSeats"
                ],
                "ORDER": {
                    "dir": "DOWN",
                    "keys": ["sumSeats"]
                },
                "FORM": "TABLE"
            },
            "TRANSFORMATIONS": {
                "GROUP": ["rooms_shortname"],
                "APPLY": [{
                    "sumSeats": {
                        "SUM": "rooms_seats"
                    }
                }]
            }
        })
            .then (function (value :any) {
                let expected = {
                    "render": "TABLE",
                    "result": [{
                        "rooms_shortname": "LSC",
                        "sumSeats": 700
                    }, {
                        "rooms_shortname": "OSBO",
                        "sumSeats": 442
                    }, {
                        "rooms_shortname": "HEBB",
                        "sumSeats": 375
                    }]
                };
                let body :any = value.body['result'];
                let expectedResult = expected['result'];
                expect(body.length).to.equal(expectedResult.length);
                let LengthResponse : number = body.length;
                let endofRetVal : number = 0;
                let applyVal : string = 'sumSeats';
                for (let i = 0; i<LengthResponse ; i++) {
                    if (endofRetVal != 0) {
                        expect(body[i][applyVal]).to.not.greaterThan(endofRetVal);
                    }
                    endofRetVal = body[i][applyVal];
                }
            })
            .catch(function (err : any) {
                expect.fail();
                //console.log("Error: " + err);
            })
    });


    it("Sagittarius APPLY COUNT seats", function () {
        return ifac.performQuery({
            "WHERE": {
                "AND": [{
                    "IS": {
                        "rooms_furniture": "*Tables*"
                    }
                }, {
                    "GT": {
                        "rooms_seats": 300
                    }
                }]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_shortname",
                    "countSeats"
                ],
                "ORDER": {
                    "dir": "DOWN",
                    "keys": ["countSeats"]
                },
                "FORM": "TABLE"
            },
            "TRANSFORMATIONS": {
                "GROUP": ["rooms_shortname"],
                "APPLY": [{
                    "countSeats": {
                        "COUNT": "rooms_seats"
                    }
                }]
            }
        })
            .then (function (value :any) {
                let expected = {
                    "render": "TABLE",
                    "result": [{
                        "rooms_shortname": "HEBB",
                        "countSeats": 1
                    }, {
                        "rooms_shortname": "LSC",
                        "countSeats": 1
                    }, {
                        "rooms_shortname": "OSBO",
                        "countSeats": 1
                    }]
                };
                let body :any = value.body['result'];
                let expectedResult = expected['result'];
                expect(body.length).to.equal(expectedResult.length);
                let LengthResponse : number = body.length;
                let endofRetVal : number = 0;
                let applyVal : string = 'countSeats';
                for (let i = 0; i<LengthResponse ; i++) {
                    if (endofRetVal != 0) {
                        expect(body[i][applyVal]).to.not.greaterThan(endofRetVal);
                    }
                    //expect(JSON.stringify(expectedResult[i])).to.equal(JSON.stringify(body[i]));
                    endofRetVal = body[i][applyVal];
                }
                //console.log("Ours:" + JSON.stringify(body));
                //console.log("Theirs:" + JSON.stringify(expectedResult));
            })
            .catch(function (err : any) {
                expect.fail();
                //console.log("Error: " + err);
            })
    });

    it("Stratos - multiple keys in apply", function () {
        return ifac.performQuery({
            "WHERE":{
                "GT": {
                    "rooms_seats": 30
                }
            },
            "OPTIONS": {
                "COLUMNS": [
                    "sumFail",
                    "countSeats",
                    "avgPass",
                    "rooms_shortname"
                ],
                "ORDER": {
                    "dir": "DOWN",
                    "keys": ["sumFail", "rooms_shortname"]
                },
                "FORM": "TABLE"
            },
            "TRANSFORMATIONS": {
                "GROUP": ["rooms_shortname"],
                "APPLY": [{
                    "countSeats": {
                        "COUNT": "rooms_seats"
                    }
                },
                    {
                        "avgPass": {
                            "AVG": "rooms_lat"
                        }
                    },
                    {
                        "sumFail": {
                            "SUM": "rooms_lon"
                        }
                    }]
            }})
            .then (function (value :any) {
                let expected = {
                    "render": "TABLE",
                    "result": [{
                        "rooms_shortname": "FRDM",
                        "countSeats": 1,
                        "avgPass": 49.3,
                        "sumFail": -123.24608
                    }, {
                        "rooms_shortname": "MGYM",
                        "countSeats": 1,
                        "avgPass": 49.3,
                        "sumFail": -123.2466
                    }, {
                        "rooms_shortname": "SPPH",
                        "countSeats": 1,
                        "avgPass": 49.3,
                        "sumFail": -123.24842
                    }, {
                        "rooms_shortname": "AERL",
                        "countSeats": 1,
                        "avgPass": 49.3,
                        "sumFail": -123.25099
                    }, {
                        "rooms_shortname": "EOSM",
                        "countSeats": 1,
                        "avgPass": 49.3,
                        "sumFail": -123.25198
                    }, {
                        "rooms_shortname": "BRKX",
                        "countSeats": 1,
                        "avgPass": 49.3,
                        "sumFail": -123.25237
                    }, {
                        "rooms_shortname": "CIRS",
                        "countSeats": 1,
                        "avgPass": 49.3,
                        "sumFail": -123.25314
                    }, {
                        "rooms_shortname": "MATX",
                        "countSeats": 1,
                        "avgPass": 49.3,
                        "sumFail": -123.254816
                    }, {
                        "rooms_shortname": "WESB",
                        "countSeats": 2,
                        "avgPass": 49.3,
                        "sumFail": -246.49874
                    }, {
                        "rooms_shortname": "IONA",
                        "countSeats": 2,
                        "avgPass": 49.3,
                        "sumFail": -246.50084
                    }, {
                        "rooms_shortname": "BIOL",
                        "countSeats": 2,
                        "avgPass": 49.3,
                        "sumFail": -246.50498
                    }, {
                        "rooms_shortname": "SOWK",
                        "countSeats": 2,
                        "avgPass": 49.3,
                        "sumFail": -246.5101
                    }, {
                        "rooms_shortname": "UCLL",
                        "countSeats": 2,
                        "avgPass": 49.3,
                        "sumFail": -246.51384
                    }, {
                        "rooms_shortname": "PHRM",
                        "countSeats": 3,
                        "avgPass": 49.3,
                        "sumFail": -369.73026
                    }, {
                        "rooms_shortname": "OSBO",
                        "countSeats": 3,
                        "avgPass": 49.3,
                        "sumFail": -369.73401
                    }, {
                        "rooms_shortname": "LSC",
                        "countSeats": 2,
                        "avgPass": 49.3,
                        "sumFail": -369.73482
                    }, {
                        "rooms_shortname": "CHBE",
                        "countSeats": 3,
                        "avgPass": 49.3,
                        "sumFail": -369.74154
                    }, {
                        "rooms_shortname": "SRC",
                        "countSeats": 1,
                        "avgPass": 49.3,
                        "sumFail": -369.74682
                    }, {
                        "rooms_shortname": "FNH",
                        "countSeats": 3,
                        "avgPass": 49.3,
                        "sumFail": -369.74877
                    }, {
                        "rooms_shortname": "FORW",
                        "countSeats": 3,
                        "avgPass": 49.3,
                        "sumFail": -369.75536999999997
                    }, {
                        "rooms_shortname": "ESB",
                        "countSeats": 3,
                        "avgPass": 49.3,
                        "sumFail": -369.75672
                    }, {
                        "rooms_shortname": "ALRD",
                        "countSeats": 3,
                        "avgPass": 49.3,
                        "sumFail": -369.75954
                    }, {
                        "rooms_shortname": "PCOH",
                        "countSeats": 1,
                        "avgPass": 49.3,
                        "sumFail": -369.7677
                    }, {
                        "rooms_shortname": "ANSO",
                        "countSeats": 3,
                        "avgPass": 49.3,
                        "sumFail": -369.77223
                    }, {
                        "rooms_shortname": "CEME",
                        "countSeats": 4,
                        "avgPass": 49.3,
                        "sumFail": -492.99576
                    }, {
                        "rooms_shortname": "HEBB",
                        "countSeats": 2,
                        "avgPass": 49.3,
                        "sumFail": -493.0066
                    }, {
                        "rooms_shortname": "IBLC",
                        "countSeats": 4,
                        "avgPass": 49.3,
                        "sumFail": -493.0084
                    }, {
                        "rooms_shortname": "HENN",
                        "countSeats": 4,
                        "avgPass": 49.3,
                        "sumFail": -493.01496
                    }, {
                        "rooms_shortname": "LSK",
                        "countSeats": 4,
                        "avgPass": 49.3,
                        "sumFail": -493.02132
                    }, {
                        "rooms_shortname": "MATH",
                        "countSeats": 3,
                        "avgPass": 49.3,
                        "sumFail": -493.022136
                    }, {
                        "rooms_shortname": "LASR",
                        "countSeats": 4,
                        "avgPass": 49.3,
                        "sumFail": -493.02332
                    }, {
                        "rooms_shortname": "DMP",
                        "countSeats": 4,
                        "avgPass": 49.3,
                        "sumFail": -616.24035
                    }, {
                        "rooms_shortname": "FSC",
                        "countSeats": 4,
                        "avgPass": 49.3,
                        "sumFail": -616.2443
                    }, {
                        "rooms_shortname": "ORCH",
                        "countSeats": 2,
                        "avgPass": 49.3,
                        "sumFail": -616.2472
                    }, {
                        "rooms_shortname": "WOOD",
                        "countSeats": 4,
                        "avgPass": 49.3,
                        "sumFail": -739.48038
                    }, {
                        "rooms_shortname": "MCLD",
                        "countSeats": 5,
                        "avgPass": 49.3,
                        "sumFail": -739.4961000000001
                    }, {
                        "rooms_shortname": "MCML",
                        "countSeats": 5,
                        "avgPass": 49.3,
                        "sumFail": -739.50162
                    }, {
                        "rooms_shortname": "CHEM",
                        "countSeats": 4,
                        "avgPass": 49.3,
                        "sumFail": -739.51848
                    }, {
                        "rooms_shortname": "GEOG",
                        "countSeats": 6,
                        "avgPass": 49.3,
                        "sumFail": -862.79361
                    }, {
                        "rooms_shortname": "SWNG",
                        "countSeats": 4,
                        "avgPass": 49.3,
                        "sumFail": -1602.3060300000002
                    }, {
                        "rooms_shortname": "SCRF",
                        "countSeats": 5,
                        "avgPass": 49.3,
                        "sumFail": -1848.7964999999995
                    }, {
                        "rooms_shortname": "ANGU",
                        "countSeats": 13,
                        "avgPass": 49.3,
                        "sumFail": -2958.0873599999986
                    }, {
                        "rooms_shortname": "BUCH",
                        "countSeats": 14,
                        "avgPass": 49.3,
                        "sumFail": -4806.932519999999
                    }]
                };
                let body :any = value.body['result'];
                let expectedResult = expected['result'];
                expect(body.length).to.equal(expectedResult.length);
                let LengthResponse : number = body.length;
                let endofRetVal : number = 0;
                let applyVal : string = 'sumFail';
                let applyVal2 = 'rooms_shortname';
                for (let i = 0; i<LengthResponse ; i++) {
                    if (endofRetVal != 0) {
                        expect(body[i][applyVal]).to.not.greaterThan(endofRetVal);
                    }
                    //expect(JSON.stringify(expectedResult[i])).to.equal(JSON.stringify(body[i]));
                    endofRetVal = body[i][applyVal];
                }
                //console.log("Ours:" + JSON.stringify(body));
                //console.log("Them:" + JSON.stringify(expectedResult));
            })
            .catch(function (err : any) {
                expect.fail();
            })
    });

    it("Empty WHERE", function () {
        return ifac.performQuery({
            "WHERE": {},
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_furniture"
                ],
                "ORDER": "rooms_furniture",
                "FORM": "TABLE"
            },
            "TRANSFORMATIONS": {
                "GROUP": ["rooms_furniture"],
                "APPLY": []
            }
        })
            .then (function (value :any) {
                let expected = {
                    "render": "TABLE",
                    "result": [{
                        "rooms_furniture": "Classroom-Fixed Tables/Fixed Chairs"
                    }, {
                        "rooms_furniture": "Classroom-Fixed Tables/Movable Chairs"
                    }, {
                        "rooms_furniture": "Classroom-Fixed Tables/Moveable Chairs"
                    }, {
                        "rooms_furniture": "Classroom-Fixed Tablets"
                    }, {
                        "rooms_furniture": "Classroom-Hybrid Furniture"
                    }, {
                        "rooms_furniture": "Classroom-Learn Lab"
                    }, {
                        "rooms_furniture": "Classroom-Movable Tables & Chairs"
                    }, {
                        "rooms_furniture": "Classroom-Movable Tablets"
                    }, {
                        "rooms_furniture": "Classroom-Moveable Tables & Chairs"
                    }, {
                        "rooms_furniture": "Classroom-Moveable Tablets"
                    }]
                };
                let body :any = value.body['result'];
                let expectedResult = expected['result'];
                expect(body.length).to.equal(expectedResult.length);
                let LengthResponse : number = body.length;
                for (let i = 0; i<LengthResponse ; i++) {
                    expect(JSON.stringify(expectedResult[i])).to.equal(JSON.stringify(body[i]));
                }
            })
            .catch(function (err : any) {
                expect.fail();
                //console.log("Error: " + err);
            })
    });

    it("Stratos Many apply keys", function () {
        return ifac.performQuery({
            "WHERE":{
                "GT": {
                    "rooms_seats": 30
                }
            },
            "OPTIONS": {
                "COLUMNS": [
                    "sumFail",
                    "countSeats",
                    "avgPass",
                    "rooms_shortname",
                    "maxLat",
                    "minSeat"
                ],
                "ORDER": {
                    "dir": "DOWN",
                    "keys": ["sumFail", "rooms_shortname"]
                },
                "FORM": "TABLE"
            },
            "TRANSFORMATIONS": {
                "GROUP": ["rooms_shortname"],
                "APPLY": [{
                    "countSeats": {
                        "COUNT": "rooms_seats"
                    }
                },
                    {
                        "avgPass": {
                            "AVG": "rooms_lat"
                        }
                    },
                    {
                        "sumFail": {
                            "SUM": "rooms_lon"
                        }
                    },
                    {
                        "maxLat": {
                            "MAX": "rooms_lat"
                        }
                    },
                    {
                        "minSeat": {
                            "MIN": "rooms_seats"
                        }
                    }]
            }})
            .then (function (value :any) {
               console.log(value);
            })
            .catch(function (err : any) {
                expect.fail();
                //console.log("Error: " + err);
            })
    });


    it("D1/D2 sorting even if transformation is present", function () {
        return ifac.performQuery({
            "WHERE":{
                "GT": {
                    "rooms_seats": 30
                }
            },
            "OPTIONS": {
                "COLUMNS": [
                    "sumFail",
                    "countSeats",
                    "avgPass",
                    "rooms_shortname",
                    "maxLat",
                    "minSeat"
                ],
                "ORDER": "maxLat",
                "FORM": "TABLE"
            },
            "TRANSFORMATIONS": {
                "GROUP": ["rooms_shortname"],
                "APPLY": [{
                    "countSeats": {
                        "COUNT": "rooms_seats"
                    }
                },
                    {
                        "avgPass": {
                            "AVG": "rooms_lat"
                        }
                    },
                    {
                        "sumFail": {
                            "SUM": "rooms_lon"
                        }
                    },
                    {
                        "maxLat": {
                            "MAX": "rooms_lat"
                        }
                    },
                    {
                        "minSeat": {
                            "MIN": "rooms_seats"
                        }
                    }]
            }})
            .then (function (value :any) {
                console.log(value);
            })
            .catch(function (err : any) {
                expect.fail();
                //console.log("Error: " + err);
            })
    });

    it("Invalid query duplicate apply keys", function () {
        return ifac.performQuery({
            "WHERE":{
                "GT": {
                    "rooms_seats": 30
                }
            },
            "OPTIONS": {
                "COLUMNS": [
                    "countSeats",
                    "avgPass",
                    "rooms_shortname",
                    "maxLat",
                    "minSeat"
                ],
                "ORDER": "maxLat",
                "FORM": "TABLE"
            },
            "TRANSFORMATIONS": {
                "GROUP": ["rooms_shortname"],
                "APPLY": [{
                    "countSeats": {
                        "COUNT": "rooms_seats"
                    }
                },
                    {
                        "avgPass": {
                            "AVG": "rooms_lat"
                        }
                    },
                    {
                        "maxLat": {
                            "SUM": "rooms_lon"
                        }
                    },
                    {
                        "maxLat": {
                            "MAX": "rooms_lat"
                        }
                    },
                    {
                        "minSeat": {
                            "MIN": "rooms_seats"
                        }
                    }]
            }})
            .then (function (value :any) {
                expect.fail();
            })
            .catch(function (err : any) {
                console.log("Error: " + err);
            })
    });


    it("Sort on an apply key - Valid", function () {
        return ifac.performQuery({
            "WHERE":{
                "GT": {
                    "rooms_seats": 30
                }
            },
            "OPTIONS": {
                "COLUMNS": [
                    "countSeats",
                    "avgPass",
                    "rooms_shortname",
                    "maxLat",
                    "minSeat"
                ],
                "ORDER": "maxLat",
                "FORM": "TABLE"
            },
            "TRANSFORMATIONS": {
                "GROUP": ["rooms_shortname"],
                "APPLY": [{
                    "countSeats": {
                        "COUNT": "rooms_seats"
                    }
                },
                    {
                        "avgPass": {
                            "AVG": "rooms_lat"
                        }
                    },
                    {
                        "maxLat": {
                            "MAX": "rooms_lat"
                        }
                    },
                    {
                        "minSeat": {
                            "MIN": "rooms_seats"
                        }
                    }]
            }})
            .then (function (value :any) {
               console.log(value);
            })
            .catch(function (err : any) {
                expect.fail();
            })
    });

    it("Sort on an apply key - Valid", function () {
        return ifac.performQuery({
            "WHERE":{
                "GT": {
                    "rooms_seats": 30
                }
            },
            "OPTIONS": {
                "COLUMNS": [
                    "countSeats",
                    "avgPass",
                    "rooms_shortname",
                    "maxLat",
                    "minSeat"
                ],
                "ORDER": {
                    "dir": "DOWN",
                    "keys": ["maxLat", "avgPass"]
                },
                "FORM": "TABLE"
            },
            "TRANSFORMATIONS": {
                "GROUP": ["rooms_shortname"],
                "APPLY": [{
                    "countSeats": {
                        "COUNT": "rooms_seats"
                    }
                },
                    {
                        "avgPass": {
                            "AVG": "rooms_lat"
                        }
                    },
                    {
                        "maxLat": {
                            "MAX": "rooms_lat"
                        }
                    },
                    {
                        "minSeat": {
                            "MIN": "rooms_seats"
                        }
                    }]
            }})
            .then (function (value :any) {
                console.log(value);
            })
            .catch(function (err : any) {
                expect.fail();
            })
    });


    it("Snacktacular empty array", function () {
        return ifac.performQuery({
            "WHERE":{
                "GT": {
                    "rooms_seats": 30
                }
            },
            "OPTIONS": {
                "COLUMNS": [
                    "sumFail",
                    "countSeats",
                    "avgPass",
                    "rooms_shortname",
                    "maxLat",
                    "minSeat"
                ],
                "ORDER": {
                    "dir": "DOWN",
                    "keys": ["sumFail", "rooms_shortname"]
                },
                "FORM": "TABLE"
            },
            "TRANSFORMATIONS": {
                "GROUP": ["rooms_shortname"],
                "APPLY": []
            }})
            .then (function (value :any) {
                expect.fail();
            })
            .catch(function (err : any) {
                console.log("Error: " + err);
            })
    });

    it("Snacktacular 2 empty array", function () {
        return ifac.performQuery({
            "WHERE":{
                "GT": {
                    "rooms_seats": 30
                }
            },
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_shortname",
                    "rooms_seats"
                ],
                "ORDER": {
                    "dir": "DOWN",
                    "keys": ["rooms_shortname", "rooms_seats"]
                },
                "FORM": "TABLE"
            },
            "TRANSFORMATIONS": {
                "GROUP": ["rooms_shortname","rooms_seats"],
                "APPLY": []
            }})
            .then (function (value :any) {
                console.log(value);
            })
            .catch(function (err : any) {
                console.log("Error: " + err);
            })
    });

    it("Test if Count works", function () {
        return ifac.performQuery({
            "WHERE":{
                "GT": {
                    "rooms_seats": 30
                }
            },
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_shortname"
                ],
                "ORDER": {
                    "dir": "DOWN",
                    "keys": ["rooms_shortname"]
                },
                "FORM": "TABLE"
            },
            "TRANSFORMATIONS": {
                "GROUP": ["rooms_shortname"],
                "APPLY": [  {
                    "countName": {
                        "COUNT": "rooms_seats"
                    }
                }
                ]
            }})
            .then (function (value :any) {
                console.log(value);
            })
            .catch(function (err : any) {
                expect.fail()
                //console.log("Error: " + err);
            })
    });


})



