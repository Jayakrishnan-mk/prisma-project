/* eslint-disable prettier/prettier */
import { CreatePropertyDto } from "@/dtos/property.dto";
import { HttpException } from "@/exceptions/HttpException";
import {
  owner,
  PrismaClient,
  owner_gender,
  property,
  propertyrole,
  core_area,
  property_type,
  Prisma,
} from "@prisma/client";
import moment from "moment";
import { http } from "winston";
import * as XLSX from "xlsx";
const AWS = require("aws-sdk");
const s3 = new AWS.S3();
const prisma = new PrismaClient();

// const file = require('fs').createWriteStream('../dr-api/src/excel_file/dr_excel.xlsx');

const owner = new PrismaClient().owner;
const property = new PrismaClient().property;
const propertyrole = new PrismaClient().propertyrole;
const project = new PrismaClient().project;

import ownerService from "@services/owners.service";
const createOwner = new ownerService().createOwner;

let ownerId;
let propertyType;
let key;
var path;
let modifiedData = [];
var findProject;
let projectId;
class ExcelService {

  public async addExcelFileDetails(propertyData: any): Promise<any> {
    try {

      function isNumber(val) {
        return typeof val == 'number';
      }

      function isBoolean(val) {
        val = val.toLowerCase()
        if (val == 'yes' || val == 'no') {
          return true
        }
        else {
          return false
        }
      }

      function isEmpty(val, param) {
        console.log(param, val)
        switch (val) {
          case "":
          case null:
          case false:
          case undefined:
            console.log(`failed to record '${param}' value provided ${val}`)
            return false;
          default:
            console.log(`recorded value of '${param}' provided ${val}`)
            return true;
        }
      }

      projectId = propertyData.projectId;
      if (propertyData.excelUrl && propertyData.projectId) {
        let fileKey = propertyData.excelUrl.split("/");
        key = fileKey[fileKey.length - 1];
        findProject = await project.findUnique({
          where: { projectId: propertyData.projectId },
        });
      }
      if (!findProject) {
        throw new HttpException(400, `project id doesn't exist`);
      }

      const params = { Bucket: process.env.PUBLIC_BUCKET_NAME, Key: `${key}` };

      const uploadStatus: any = await new Promise(function (resolve, reject) {
        s3.getObject(params, async (err, data) => {
          if (err) {
            console.log(err);
          } else {
            const workbook = XLSX.read(data.Body, {
              cellDates: true,
            });

            const sheetName = workbook.SheetNames[0];
            const sheetName2 = workbook.SheetNames[1];
            const sheetObj2 = workbook.Sheets[sheetName2];
            const sheetObj = workbook.Sheets[sheetName];

            const sheetObjKeys = Object.keys(sheetObj);

            const jsWorksheet: Array<any> = XLSX.utils.sheet_to_json(sheetObj, {
              raw: true,
              defval: ""
            });

            const jsworksheet2: Array<any> = XLSX.utils.sheet_to_json(
              sheetObj2,
              {
                raw: true,
                defval: ""
              }
            );

            let projectDetails: any = {};
            let ownerDetails: any = {};
            let propertyDetails: any = {};

            let ownerData: owner;
            let propertyDataInfo: property;
            var sheet1Array = [];
            var sheet2Array = [];
            var dataSheet: any = [];

            /////////////////UPDATE RECORDS TO PROJECT/////////////////////////////////

            var entityType;
            var coreArea;
            sheet1Array.push(jsWorksheet);

            //////////////////Entity Type////////////////////
            if (
              sheet1Array[0][0].entitytype == "Cooperative Hsg Society" 
            ) 
            {
              propertyType = property_type.Flat;
            } 
            else if (
              sheet1Array[0][0].entitytype == "office" ||
              sheet1Array[0][0].entitytype === "Office"
            ) 
            {
              entityType = property_type.Office;
            }
            else if (
              sheet1Array[0][0].entitytype == "Outhouse/Garage" ||
              sheet1Array[0][0].entitytypee == "outhouse/garage"
            ) 
            {
              entityType = property_type.Outhouse_Garage;
            } else if (
              sheet1Array[0][0].entitytype == "Bungalow/RowHouse/Open Plot" ||
              sheet1Array[0][0].entitytype == "bungalow/rowhouse/open plot"
            ){
              entityType = property_type.Bunglow_RowHouse_OpenPlot;
            }

            ///////////////CORE AREA//////////////////////
            if (
              sheet1Array[0][0].coreArea == "Non-congested Area" ||
              sheet1Array[0][0].coreArea == "non-congested area" ||
              sheet1Array[0][0].coreArea == "non-congested Area"
            ) {
              coreArea = core_area.noncongestedarea;
            } else {
              coreArea = core_area.congestedArea;
            }

            if (isNumber(sheet1Array[0][0]["totalLandArea(Sq.Ft.)"]) == false && sheet1Array[0][0]["totalLandArea(Sq.Ft.)"] !== "-") {
              reject({ code: 400, msg: `provided Total Land Area '${sheet1Array[0][0]["totalLandArea(Sq.Ft.)"]}' is not valid` });
              return
            }
            console.log(`recorded value of totalLandArea = "${sheet1Array[0][0]["totalLandArea(Sq.Ft.)"]}" sucessfully`)

            if (isNumber(sheet1Array[0][0]["Front(ft)"]) == false && sheet1Array[0][0]["Front(ft)"] !== "-") {
              reject({ code: 400, msg: `provided Front(ft) '${sheet1Array[0][0]["Front(ft)"]}' is not valid` });
              return
            }
            console.log(`recorded value of Front = "${sheet1Array[0][0]["Front(ft)"]}" sucessfully`)

            if (isNumber(sheet1Array[0][0]["Right(ft)"]) == false && sheet1Array[0][0]["Right(ft)"] !== "-") {
              reject({ code: 400, msg: `provided Right(ft) '${sheet1Array[0][0]["Right(ft)"]}' is not valid` });
              return
            }
            console.log(`recorded value of Right = "${sheet1Array[0][0]["Right(ft)"]}" sucessfully`)

            if (isNumber(sheet1Array[0][0]["Left(ft)"]) == false && sheet1Array[0][0]["Left(ft)"] !== "-") {
              reject({ code: 400, msg: `provided Left(ft) '${sheet1Array[0][0]["Left(ft)"]}' is not valid` });
              return
            }
            console.log(`recorded value of Left = "${sheet1Array[0][0]["Left(ft)"]}" sucessfully`)

            if (isNumber(sheet1Array[0][0]["Back(ft)"]) == false && sheet1Array[0][0]["Back(ft)"] !== "-") {
              reject({ code: 400, msg: `provided Back(ft) '${sheet1Array[0][0]["Back(ft)"]}' is not valid` });
              return
            }
            console.log(`recorded value of Back = "${sheet1Array[0][0]["Back(ft)"]}" sucessfully`)

            if (isNumber(sheet1Array[0][0]["readyReckonerRate(Rs./sqmtr)"]) == false && sheet1Array[0][0]["readyReckonerRate(Rs./sqmtr)"] !== "-") {
              reject({ code: 400, msg: `provided readyReckonerRate(Rs./sqmtr) '${sheet1Array[0][0]["readyReckonerRate(Rs./sqmtr)"]}' is not valid` });
              return
            }
            console.log(`recorded value of readyReckonerRate = "${sheet1Array[0][0]["readyReckonerRate(Rs./sqmtr)"]}" sucessfully`)

            if (isNumber(sheet1Array[0][0]["TotalBuildingSheets"]) == false && sheet1Array[0][0]["TotalBuildingSheets"] !== "-") {
              reject({ code: 400, msg: `provided TotalBuildingSheets '${sheet1Array[0][0]["TotalBuildingSheets"]}' is not valid` });
              return
            }
            console.log(`recorded value of TotalBuildingSheets = "${sheet1Array[0][0]["TotalBuildingSheets"]}" sucessfully`)

            if (isNumber(sheet1Array[0][0]["totalUnits"]) == false && sheet1Array[0][0]["totalUnits"] !== "-") {
              reject({ code: 400, msg: `provided totalUnits '${sheet1Array[0][0]["totalUnits"]}' is not valid` });
              return
            }
            console.log(`recorded value of totalUnits = "${sheet1Array[0][0]["totalUnits"]}" sucessfully`)

            if (isNumber(sheet1Array[0][0]["totalFlats"]) == false && sheet1Array[0][0]["totalFlats"] !== "-") {
              reject({ code: 400, msg: `provided totalFlats '${sheet1Array[0][0]["totalFlats"]}' is not valid` });
              return
            }
            console.log(`recorded value of totalFlats = "${sheet1Array[0][0]["totalFlats"]}" sucessfully`)

            if (isNumber(sheet1Array[0][0]["totalShops"]) == false && sheet1Array[0][0]["totalShops"] !== "-") {
              reject({ code: 400, msg: `provided totalShops '${sheet1Array[0][0]["totalShops"]}' is not valid` });
              return
            }
            console.log(`recorded value of totalShops = "${sheet1Array[0][0]["totalShops"]}" sucessfully`)

            if (isNumber(sheet1Array[0][0]["totalOuthouse/Garage"]) == false && sheet1Array[0][0]["totalOuthouse/Garage"] !== "-") {
              reject({ code: 400, msg: `provided totalOuthouse/Garage '${sheet1Array[0][0]["totalOuthouse/Garage"]}' is not valid` });
              return
            }
            console.log(`recorded value of totalOuthouse/Garage = "${sheet1Array[0][0]["totalOuthouse/Garage"]}" sucessfully`)

            if (isNumber(sheet1Array[0][0]["totalBungalows/rowHouses"]) == false && sheet1Array[0][0]["totalBungalows/rowHouses"] !== "-") {
              reject({ code: 400, msg: `provided totalBungalows/rowHouses '${sheet1Array[0][0]["totalBungalows/rowHouses"]}' is not valid` });
              return
            }
            console.log(`recorded value of totalBungalows/rowHouses = "${sheet1Array[0][0]["totalBungalows/rowHouses"]}" sucessfully`)

            if (isNumber(sheet1Array[0][0].totalPlots) == false && sheet1Array[0][0].totalPlots !== "-") {
              reject({ code: 400, msg: `provided totalPlots '${sheet1Array[0][0].totalPlots}' is not valid` });
              return
            }
            console.log(`recorded value of totalPlots = "${sheet1Array[0][0]["totalPlots"]}" sucessfully`)

            if (isNumber(sheet1Array[0][0].totalOffices) == false && sheet1Array[0][0].totalOffices !== "-") {
              reject({ code: 400, msg: `provided totalOffices '${sheet1Array[0][0].totalOffices}' is not valid` });
              return
            }
            console.log(`recorded value of totalOffices = "${sheet1Array[0][0]["totalOffices"]}" sucessfully`)

            if (isNumber(sheet1Array[0][0]["Parking"]) == false && sheet1Array[0][0]["Parking"] !== "-") {
              reject({ code: 400, msg: `provided Parking '${sheet1Array[0][0]["Parking"]}' is not valid` });
              return
            }
            console.log(`recorded value of Parking = "${sheet1Array[0][0]["Parking"]}" sucessfully`)

            if (isNumber(sheet1Array[0][0]["commercialRent"]) == false && sheet1Array[0][0]["commercialRent"] !== "-") {
              reject({ code: 400, msg: `provided commercialRent '${sheet1Array[0][0]["commercialRent"]}' is not valid` });
              return
            }
            console.log(`recorded value of commercialRent = "${sheet1Array[0][0]["commercialRent"]}" sucessfully`)

            if (isNumber(sheet1Array[0][0]["residentialRent"]) == false && sheet1Array[0][0]["residentialRent"] !== "-") {
              reject({ code: 400, msg: `provided residentialRent '${sheet1Array[0][0]["residentialRent"]}' is not valid` });
              return
            }
            console.log(`recorded value of residentialRent = "${sheet1Array[0][0]["residentialRent"]}" sucessfully`)

            if (isBoolean(sheet1Array[0][0]["TODApplicability"]) == false && sheet1Array[0][0]["TODApplicability"]! == "-") {
              reject({ code: 400, msg: `provided TODApplicability '${sheet1Array[0][0]["TODApplicability"]}', is not valid` });
              return
            }
            console.log(`recorded value of TODApplicability = "${sheet1Array[0][0]["TODApplicability"]}" sucessfully`)

            if (isBoolean(sheet1Array[0][0]["withinMunicipalLimits"]) == false && sheet1Array[0][0]["withinMunicipalLimits"]! == "-") {
              reject({ code: 400, msg: `provided withinMunicipalLimits '${sheet1Array[0][0]["withinMunicipalLimits"]} is not valid` });
              return
            }
            console.log(`recorded value of withinMunicipalLimits = "${sheet1Array[0][0]["withinMunicipalLimits"]}" sucessfully`)

            if (isNumber(sheet1Array[0][0]["previousRoadWidening"]) == false && sheet1Array[0][0]["previousRoadWidening"] !== "-") {
              reject({ code: 400, msg: `provided previousRoadWidening '${sheet1Array[0][0]["previousRoadWidening"]}' is not valid` });
              return
            }
            console.log(`recorded value of previousRoadWidening = "${sheet1Array[0][0]["previousRoadWidening"]}" sucessfully`)

            if (isNumber(sheet1Array[0][0]["estAreaInRoadWidening"]) == false && sheet1Array[0][0]["estAreaInRoadWidening"] !== "-") {
              reject({ code: 400, msg: `provided estAreaInRoadWidening '${sheet1Array[0][0]["estAreaInRoadWidening"]}' is not valid` });
              return
            }
            console.log(`recorded value of estAreaInRoadWidening = "${sheet1Array[0][0]["estAreaInRoadWidening"]}" sucessfully`)

            if (isNumber(sheet1Array[0][0]["widthOfAccessRoad"]) == false && sheet1Array[0][0]["widthOfAccessRoad"] !== "-") {
              reject({ code: 400, msg: `provided widthOfAccessRoad '${sheet1Array[0][0]["widthOfAccessRoad"]}' is not valid` });
              return
            }
            console.log(`recorded value of widthOfAccessRoad = "${sheet1Array[0][0]["widthOfAccessRoad"]}" sucessfully`)

            if (isNumber(sheet1Array[0][0]["loadingInYourArea"]) == false && sheet1Array[0][0]["loadingInYourArea"] !== "-") {
              reject({ code: 400, msg: `provided loadingInYourArea '${sheet1Array[0][0]["loadingInYourArea"]}' is not valid` });
              return
            }
            console.log(`recorded value of loadingInYourArea = "${sheet1Array[0][0]["loadingInYourArea"]}" sucessfully`)

            if (isNumber(sheet1Array[0][0]["sanctionPlanBuiltupArea"]) == false && sheet1Array[0][0]["sanctionPlanBuiltupArea"] !== "-") {
              reject({ code: 400, msg: `provided sanctionPlanBuiltupArea '${sheet1Array[0][0]["sanctionPlanBuiltupArea"]}' is not valid` });
              return
            }
            console.log(`recorded value of sanctionPlanBuiltupArea = "${sheet1Array[0][0]["sanctionPlanBuiltupArea"]}" sucessfully`)

            if (isNumber(sheet1Array[0][0]["constructionCost"]) == false && sheet1Array[0][0]["constructionCost"] !== "-") {
              reject({ code: 400, msg: `provided constructionCost '${sheet1Array[0][0]["constructionCost"]}' is not valid` });
              return
            }
            console.log(`recorded value of constructionCost = "${sheet1Array[0][0]["constructionCost"]}" sucessfully`)

            if (isNumber(sheet1Array[0][0]["parkingCost(All Flats- New + Old)"]) == false && sheet1Array[0][0]["parkingCost(All Flats- New + Old)"] !== "-") {
              reject({ code: 400, msg: `provided parkingCost(All Flats- New + Old) '${sheet1Array[0][0]["parkingCost(All Flats- New + Old)"]}' is not valid` });
              return
            }
            console.log(`recorded value of parkingCost(All Flats- New + Old) = "${sheet1Array[0][0]["parkingCost(All Flats- New + Old)"]}" sucessfully`)

            if (isNumber(sheet1Array[0][0]["rent"]) == false && sheet1Array[0][0]["rent"] !== "-") {
              reject({ code: 400, msg: `provided rent '${sheet1Array[0][0]["rent"]}' is not valid` });
              return
            }
            console.log(`recorded value of rent = "${sheet1Array[0][0]["rent"]}" sucessfully`)

            if (isNumber(sheet1Array[0][0]["shiftingCharges"]) == false && sheet1Array[0][0]["shiftingCharges"] !== "-") {
              reject({ code: 400, msg: `provided shiftingCharges '${sheet1Array[0][0]["shiftingCharges"]}' is not valid` });
              return
            }
            console.log(`recorded value of shiftingCharges = "${sheet1Array[0][0]["shiftingCharges"]}" sucessfully`)

            if (isNumber(sheet1Array[0][0]["corpusFund"]) == false && sheet1Array[0][0]["corpusFund"] !== "-") {
              reject({ code: 400, msg: `provided corpusFund '${sheet1Array[0][0]["corpusFund"]}' is not valid` });
              return
            }
            console.log(`recorded value of corpusFund = "${sheet1Array[0][0]["corpusFund"]}" sucessfully`)

            if (isNumber(sheet1Array[0][0]["bettermentCharges"]) == false && sheet1Array[0][0]["bettermentCharges"] !== "-") {
              reject({ code: 400, msg: `provided bettermentCharges '${sheet1Array[0][0]["bettermentCharges"]}' is not valid` });
              return
            }
            console.log(`recorded value of bettermentCharges = "${sheet1Array[0][0]["bettermentCharges"]}" sucessfully`)

            if (isNumber(sheet1Array[0][0]["interestOnCost"]) == false && sheet1Array[0][0]["interestOnCost"] !== "-") {
              reject({ code: 400, msg: `provided interestOnCost '${sheet1Array[0][0]["interestOnCost"]}' is not valid` });
              return
            }
            console.log(`recorded value of interestOnCost = "${sheet1Array[0][0]["interestOnCost"]}" sucessfully`)

            if (isNumber(sheet1Array[0][0]["marketSalesRateRs./sqft"]) == false && sheet1Array[0][0]["marketSalesRateRs./sqft"] !== "-") {
              reject({ code: 400, msg: `provided marketSalesRateRs./sqft '${sheet1Array[0][0]["marketSalesRateRs./sqft"]}' is not valid` });
              return
            }
            console.log(`recorded value of marketSalesRateRs./sqft = "${sheet1Array[0][0]["marketSalesRateRs./sqft"]}" sucessfully`)

            if (isNumber(sheet1Array[0][0]["profitForDevelopers"]) == false && sheet1Array[0][0]["profitForDevelopers"] !== "-") {
              reject({ code: 400, msg: `provided profitForDevelopers '${sheet1Array[0][0]["profitForDevelopers"]}' is not valid` });
              return
            }
            console.log(`recorded value of profitForDevelopers = "${sheet1Array[0][0]["profitForDevelopers"]}" sucessfully`)

            projectDetails = {

              totalLandArea: sheet1Array[0][0]["totalLandArea(Sq.Ft.)"] == "-" ? null : Number(sheet1Array[0][0]["totalLandArea(Sq.Ft.)"]),

              frontRoad: sheet1Array[0][0]["Front(ft)"] == "-" ? null : parseFloat(sheet1Array[0][0]["Front(ft)"]),

              rightRoad: sheet1Array[0][0]["Right(ft)"] == "-" ? null : parseFloat(sheet1Array[0][0]["Right(ft)"]),

              leftRoad: sheet1Array[0][0]["Left(ft)"] == "-" ? null : parseFloat(sheet1Array[0][0]["Left(ft)"]),

              backRoad: sheet1Array[0][0]["Back(ft)"] == "-" ? null : parseFloat(sheet1Array[0][0]["Back(ft)"]),

              readyReckonerRate: sheet1Array[0][0]["readyReckonerRate(Rs./sqmtr)"] == "-" ? null : Number(sheet1Array[0][0]["readyReckonerRate(Rs./sqmtr)"]),

              buildingSheets: sheet1Array[0][0]["TotalBuildingSheets"] == "-" ? null : Number(sheet1Array[0][0]["TotalBuildingSheets"]),

              noOfUnits: sheet1Array[0][0]["totalUnits"] == "-" ? null : Number(sheet1Array[0][0]["totalUnits"]),

              noOfFlats: sheet1Array[0][0]["totalFlats"] == "-" ? null : Number(sheet1Array[0][0]["totalFlats"]),

              noOfShops: sheet1Array[0][0]["totalShops"] == "-" ? null : Number(sheet1Array[0][0]["totalShops"]),

              noOfOuthouse: sheet1Array[0][0]["totalOuthouse/Garage"] == "-" ? null : Number(sheet1Array[0][0]["totalOuthouse/Garage"]),

              noOfBungalows: sheet1Array[0][0]["totalBungalows/rowHouses"] == "-" ? null : Number(sheet1Array[0][0]["totalBungalows/rowHouses"]),

              noOfPlots: sheet1Array[0][0].totalPlots == "-" ? null : Number(sheet1Array[0][0].totalPlots),

              noOfOffices: sheet1Array[0][0].totalOffices == "-" ? null : Number(sheet1Array[0][0].totalOffices),

              noOfParking: sheet1Array[0][0]["Parking"] == "-" ? null : Number(sheet1Array[0][0]["Parking"]),

              commericalRent: sheet1Array[0][0]["commercialRent"] == "-" ? null : Number(sheet1Array[0][0]["commercialRent"]),

              residentialRent: sheet1Array[0][0]["residentialRent"] == "-" ? null : Number(sheet1Array[0][0]["residentialRent"]),

              TODApplicability: sheet1Array[0][0]["TODApplicability"] == "-" ? null : sheet1Array[0][0]["TODApplicability"],

              withinMunicipalLimits: sheet1Array[0][0]["withinMunicipalLimits"] == "-" ? null : sheet1Array[0][0]["withinMunicipalLimits"],

              coreArea: coreArea == "-" ? null : coreArea,

              previousRoadWidening: sheet1Array[0][0]["previousRoadWidening"] == "-" ? null : parseFloat(sheet1Array[0][0]["previousRoadWidening"]),

              estimateAreaInRoadWidening: sheet1Array[0][0]["estAreaInRoadWidening"] == "-" ? null : parseFloat(sheet1Array[0][0]["estAreaInRoadWidening"]),

              widthOfAccessRoad: sheet1Array[0][0]["widthOfAccessRoad"] == "-" ? null : parseFloat(sheet1Array[0][0]["widthOfAccessRoad"]),

              loadingInYourArea: sheet1Array[0][0]["loadingInYourArea"] == "-" ? null : parseFloat(sheet1Array[0][0]["loadingInYourArea"]),

              bhogvataPatraDate: sheet1Array[0][0]["bhogvataPatraDate"] == "-" ? null : moment(sheet1Array[0][0]["bhogvataPatraDate"]).format("YYYY-MM-DD[T]HH:mm:ss.SSS[Z]"),

              sanctionPlanArea: sheet1Array[0][0]["sanctionPlanBuiltupArea"] == "-" ? null : parseFloat(sheet1Array[0][0]["sanctionPlanBuiltupArea"]),

              constructionCost: sheet1Array[0][0]["constructionCost"] == "-" ? null : Number(sheet1Array[0][0]["constructionCost"]),

              parkingCost: sheet1Array[0][0]["parkingCost(All Flats- New + Old)"] == "-" ? null : Number(sheet1Array[0][0]["parkingCost(All Flats- New + Old)"]),

              rent: sheet1Array[0][0]["rent"] == "-" ? null : Number(sheet1Array[0][0]["rent"]),

              shifting: sheet1Array[0][0]["shiftingCharges"] == "-" ? null : Number(sheet1Array[0][0]["shiftingCharges"]),

              corpusFund: sheet1Array[0][0]["corpusFund"] == "-" ? null : Number(sheet1Array[0][0]["corpusFund"]),

              bettermentCharges: sheet1Array[0][0]["bettermentCharges"] == "-" ? null : Number(sheet1Array[0][0]["bettermentCharges"]),

              interest: sheet1Array[0][0]["interestOnCost"] == "-" ? null : parseFloat(sheet1Array[0][0]["interestOnCost"]),

              marketSaleRate: sheet1Array[0][0]["marketSalesRateRs./sqft"] == "-" ? null : Number(sheet1Array[0][0]["marketSalesRateRs./sqft"]),

              developerProfit: sheet1Array[0][0]["profitForDevelopers"] == "-" ? null : parseFloat(sheet1Array[0][0]["profitForDevelopers"]),
            };

            const updateProjectData = await project.update({
              where: { projectId: propertyData.projectId },
              data: {
                ...projectDetails
              },
            });

            /////////////////EXCEL SHEET 2////////////////////////////////
            if (workbook.SheetNames.length < 1) return;
            sheet2Array.push(jsworksheet2);
            dataSheet = sheet2Array[0];
            //////////////////deleting property all property records////////////
            const deletePropertyRole = await propertyrole.deleteMany({
              where: { projectId: propertyData.projectId },
            });


            const listOfProperties = await property.findMany({
              where: { projectId: propertyData.projectId },
            });

            if (listOfProperties.length > 0) {
              for (let i = 0; i < listOfProperties.length; i++) {
                let ownerApt = await owner.findMany({
                  where: {
                    AND: [
                      {
                        property: {
                          some: {
                            propertyId: {
                              equals: listOfProperties[i].propertyId,
                            },
                          },
                        },
                      },
                    ],
                  },
                });

                if (ownerApt[0]) {

                  var OldPropArray = [...ownerApt[0].propertyId];

                  const index = OldPropArray.indexOf(
                    listOfProperties[i].propertyId
                  );

                  if (index !== -1) {
                    OldPropArray.splice(index, 1);
                  }

                  const UpdateUser = await owner.update({
                    where: {
                      ownerId: ownerApt[0].ownerId,
                    },
                    data: {
                      propertyId: OldPropArray,
                    },
                  });

                  if (listOfProperties[i].propertyId) {
                    const deleteProperty = await property.delete({
                      where: {
                        propertyId: listOfProperties[i].propertyId,
                      },
                    });
                  }
                }
              }
            }


            const listOfProject = await owner.findMany({
              where: { AND: [{ project: { some: { projectId: { equals: propertyData.projectId } } } }] }
            })

            for (let i = 0; i < listOfProject.length; i++) {
              var OldProjArray = [...listOfProject[i].projectId];

              const index = OldProjArray.indexOf(
                propertyData.projectId
              );

              if (index !== -1) {
                OldProjArray.splice(index, 1);
              }

              const updateUserProject = await owner.update({
                where: {
                  ownerId: listOfProject[i].ownerId
                },
                data: {
                  projectId: OldProjArray
                }
              })

            }

            ////////////////////////looping excel sheet2's data///////////////////////////

            const findApartment = await property.deleteMany({
              where: {
                projectId: projectId
              }
            })

            for (let i of dataSheet) {
              if (i.sNo == "" || i.sNo == null || i.sNo == undefined || i.sNo == false) {
                break;
              }
              if (isNaN(i.mobile) == true || i.mobile == "-") {
                reject({ code: 400, msg: "Mobile number is empty!" });
                return;
              }

              if (i.mobile) {
                try {
                  i.mobile = i.mobile.toString()
                  if (i.mobile.length !== 10) {
                    reject({ code: 400, msg: "Mobile number is not valid!" });
                    return
                  }
                } catch (error) {
                  reject({ code: 400, msg: error });
                  return;
                }
                const mobile = Number(i.mobile);

                let formattedDate = moment(new Date(i.dateOfBirth)).format(
                  "YYYY-MM-DD[T]HH:mm:ss.SSS[Z]"
                );
                ownerDetails = {
                  mobile: mobile,
                  firstName: i.firstName,
                  lastName: i.lastName,
                  dateOfBirth: new Date(formattedDate),
                  gender: i.gender == "male" || i.gender == "Male" || i.gender == "MALE" ? owner_gender.male : owner_gender.female,
                  emailId: i.emailId == "-" || i.emailId == "" || i.emailId == null || isNaN(i.emailId) == true ? null : i.emailId,
                };

                const findOwner = await owner.findFirst({
                  where: { mobile: mobile },
                });


                if (findOwner) {
                  ownerId = findOwner.ownerId;
                  ownerData = findOwner;
                  let newprojectId = [
                    ...findOwner.projectId,
                    propertyData.projectId,
                  ];
                  newprojectId = [...new Set(newprojectId)];
                  const createOwnerData: owner = await owner.update({
                    where: { ownerId },
                    data: {
                      ...ownerDetails,
                      projectId: newprojectId,
                    },
                  });
                  ownerData = createOwnerData;

                  const updateProjectData = await project.update({
                    where: { projectId: propertyData.projectId },
                    data: {
                      owner: {
                        connect: [{
                          ownerId: ownerId
                        }]
                      },
                    },
                  });

                } else {
                  const createOwnerData = await createOwner(ownerDetails);
                  if (!createOwnerData) {
                    reject({ code: 400, msg: "error in owner creation" })
                    return;
                  }
                  ownerId = createOwnerData.ownerId;
                  const updateOwnerData = await owner.update({
                    where: { ownerId },
                    data: {
                      projectId: projectId,
                    },
                  });

                  const updateProjectData = await project.update({
                    where: { projectId: propertyData.projectId },
                    data: {
                      owner: {
                        connect: [{
                          ownerId: ownerId
                        }]
                      },
                    },
                  });
                  ownerData = createOwnerData;
                }

                if (ownerId) {
                  if (i.propertyType == "flat" || i.propertyType == "Flat") {
                    propertyType = property_type.Flat;
                  }
                  else if (i.propertyType == "shop" || i.propertyType == "Shop") {
                    propertyType = property_type.Shop;
                  }
                  else if (i.propertyType == "office" || i.propertyType == "Office") {
                    propertyType = property_type.Office;
                  }
                  else if (i.propertyType == "outhouse/garage" || i.propertyType == "Outhouse/Garage") {
                    propertyType = property_type.Outhouse_Garage;
                  }
                  else if (i.propertyType == "Bungalow/RowHouse/Open Plot" || i.propertyType == "bungalow/rowhouse/open plot") {
                    propertyType = property_type.Bunglow_RowHouse_OpenPlot;
                  }
                  else {
                    reject({ code: 400, msg: `provided property type '${i.propertyType}' invalid` })
                    return;
                  }

                  if (isEmpty(i.nameOfWing, "nameOfWing") && isEmpty(propertyType, "propertyType") && isEmpty(i.unitNo, "unitNo") && isEmpty(i["mezannineFloor(SqFt)"], "mezannineFloor") && isEmpty(i["terrace(SqFt)"], "terrace") && isEmpty(i.floorNo, "floorNo") && isEmpty(i.bhk, "bhk") && isEmpty(i.flatArea, "flatArea") && isEmpty(i.gardenArea, "gardenArea") && isEmpty(i["size(SqFt)"], "size(SqFt)")) {
                    propertyDetails = {
                      ownerId: ownerId.split(","),
                      nameOfWing: i.nameOfWing,
                      propertyType: propertyType,
                      bhk: i.bhk == "-" || "" ? null : Number(i.bhk),
                      floorNumber:
                        i.floorNo == "-" || "" ? null : i.floorNo.toString(),
                      terrace:
                        i["terrace(SqFt)"] == "-" || ""
                          ? null
                          : parseFloat(i["terrace(SqFt)"]),
                      flatArea: i.flatArea,
                      gardenArea: i.gardenArea,
                      size:
                        i["size(SqFt)"] == "-" || ""
                          ? null
                          : parseFloat(i["size(SqFt)"]),
                      unitName: i.unitNo == "-" || "" ? null : i.unitNo.toString(),
                      mezannineFloor:
                        i["mezannineFloor(SqFt)"] == "-" || ""
                          ? null
                          : parseFloat(i["mezannineFloor(SqFt)"]),
                      projectId: propertyData.projectId,
                      isOwnerVerified: i.isOwnerVerified,
                    };

                    const createPropertyData: property = await property.create({
                      data: { ...propertyDetails },
                    });

                    const ownerObj = await owner.findFirst({
                      where: {
                        ownerId,
                      },
                    });
                    let newPropertyId = [
                      ...ownerObj.propertyId,
                      createPropertyData.propertyId,
                    ];
                    newPropertyId = [...new Set(newPropertyId)];

                    await owner.update({
                      where: { ownerId },
                      data: {
                        propertyId: newPropertyId,
                      },
                    });

                    propertyDataInfo = createPropertyData;
                  } else {
                    reject({ code: 400, msg: "excel sheet not uploaded! / provided values invalid" });
                    return;
                  }
                }
              }
              else {
                if (i.propertyType == "flat" || i.propertyType == "Flat") {
                  propertyType = property_type.Flat;
                }
                else if (i.propertyType == "shop" || i.propertyType == "Shop") {
                  propertyType = property_type.Shop;
                }
                else if (i.propertyType == "office" || i.propertyType == "Office") {
                  propertyType = property_type.Office;
                }
                else if (i.propertyType == "outhouse/garage" || i.propertyType == "Outhouse/Garage") {
                  propertyType = property_type.Outhouse_Garage;
                }
                else if (i.propertyType == "Bungalow/RowHouse/Open Plot" || i.propertyType == "bungalow/rowhouse/open plot") {
                  propertyType = property_type.Bunglow_RowHouse_OpenPlot;
                }
                else {
                  reject({ code: 400, msg: `provided property type '${i.propertyType}' invalid` })
                  return;
                }


                if (isEmpty(i.nameOfWing, "nameOfWing") && isEmpty(propertyType, "propertyType") && isEmpty(i.unitNo, "unitNo") && isEmpty(i["mezannineFloor(SqFt)"], "mezannineFloor") && isEmpty(i["terrace(SqFt)"], "terrace") && isEmpty(i.floorNo, "floorNo") && isEmpty(i.bhk, "bhk") && isEmpty(i.flatArea, "flatArea") && isEmpty(i.gardenArea, "gardenArea") && isEmpty(i["size(SqFt)"], "size(SqFt)")) {
                  propertyDetails = {
                    nameOfWing: i.nameOfWing,
                    propertyType: propertyType,
                    bhk: i.bhk == "-" || "" ? null : Number(i.bhk),
                    floorNumber: i.floorNo == "-" || "" ? null : i.floorNo.toString(),
                    terrace: i["terrace(SqFt)"] == "-" || "" ? null : parseFloat(i["terrace(SqFt)"]),
                    flatArea: i.flatArea,
                    gardenArea: i.gardenArea,
                    size: i["size(SqFt)"] == "-" || "" ? null : parseFloat(i["size(SqFt)"]),
                    unitName: i.unitNo == "-" || "" ? null : i.unitNo.toString(),
                    mezannineFloor: i["mezannineFloor(SqFt)"] == "-" || "" ? null : parseFloat(i["mezannineFloor(SqFt)"]),
                    projectId: propertyData.projectId,
                    isOwnerVerified: i.isOwnerVerified == "TRUE" || i.isOwnerVerified == "True" || i.isOwnerVerified == "true" ? true : false
                  };

                  let createPropertyData: property

                  createPropertyData = await property.create({
                    data: { ...propertyDetails },
                  });

                  propertyDataInfo = createPropertyData;
                } else {
                  reject({ code: 400, msg: "excel sheet not uploaded! / provided values invalid" });
                  return;
                }
              }

              var jsdata = {
                excelSheet1: jsWorksheet,
                excelsheet2: jsworksheet2,
              };

              let tempdata = [];
              tempdata.push(jsdata);

            }

            const updateVersion = await prisma.excelProjectVersions.create({
              data: {
                projectId: propertyData.projectId,
                url: propertyData.excelUrl
              }
            })

            resolve({ code: 200, msg: "Successfully added!" });

          }
        });
      }).catch(error => {
        console.log(error)
        throw new HttpException(400, error.msg);
      })
    } catch (e) {
      console.log("error", e);
      throw new HttpException(400, e.message);
    }
  }

  public async getExcelDataByProjectId(projectId: string): Promise<any> {
    let projectDetails: any = [];
    let modifiedProjectData: any = [];
    const allProperty: any = await property.findMany({
      where: { projectId: projectId },
      include: {
        project: true,
        owner: true,
        propertyrole: true,
      },
    });
    console.log("allProperty", allProperty);
    const projectData: any = await project.findFirst({
      where: { projectId: projectId },
    });
    // console.log("projectData",projectData);
    projectDetails.push(projectData);

    if (!projectData) {
      throw new HttpException(400, "This Project doesn't exists");
    }
    if (!allProperty) {
      throw new HttpException(400, "This Property Id doesn't exists");
    }
    // modifiedProjectData = projectDetails.map((response) => {
    //   console.log("modifiedProjectData", response);
    // return {
    //   projectName: response.projectName,
    //   totalLandArea:
    //     response.totalLandArea == null ? "-" : response.totalLandArea,
    //   frontRoad: response.frontRoad == null ? "-" : response.frontRoad,
    //   rightRoad: response.rightRoad == null ? "-" : response.rightRoad,
    //   leftRoad: response.leftRoad == null ? "-" : response.leftRoad,
    //   backRoad: response.backRoad == null ? "-" : response.backRoad,
    //   readyReckonerRate:
    //     response.readyReckonerRate == null ? "-" : response.readyReckonerRate,
    //   buildingSheets:
    //     response.buildingSheets == null ? "-" : response.buildingSheets,
    //   noOfUnits: response.noOfUnits == null ? "-" : response.noOfUnits,
    //   noOfFlats: response.noOfFlats == null ? "-" : response.noOfFlats,
    //   noOfShops: response.noOfShops == null ? "-" : response.noOfShops,
    //   noOfOuthouse:
    //     response.noOfOuthouse == null ? "-" : response.noOfOuthouse,
    //   noOfBungalows:
    //     response.noOfBungalows == null ? "-" : response.noOfBungalows,
    //   noOfPlots: response.noOfPlots == null ? "-" : response.noOfPlots,
    //   noOfOffices: response.noOfOffices == null ? "-" : response.noOfOffices,
    //   noOfParking: response.noOfParking == null ? "-" : response.noOfParking,
    //   commericalRent:
    //     response.commericalRent == null ? "-" : response.commericalRent,
    //   residentialRent:
    //     response.residentialRent == null ? "-" : response.residentialRent,
    //   TODApplicability:
    //     response.TODApplicability == null ? "-" : response.TODApplicability,
    //   withinMunicipalLimits:
    //     response.withinMunicipalLimits == null
    //       ? "-"
    //       : response.withinMunicipalLimits,
    //   coreArea: response.coreArea == null ? "-" : response.coreArea,
    //   previousRoadWidening:
    //     response.previousRoadWidening == null
    //       ? "-"
    //       : response.previousRoadWidening,
    //   estimateAreaInRoadWidening:
    //     response.estimateAreaInRoadWidening == null
    //       ? "-"
    //       : response.estimateAreaInRoadWidening,
    //   widthOfAccessRoad:
    //     response.widthOfAccessRoad == null ? "-" : response.widthOfAccessRoad,
    //   loadingInYourArea:
    //     response.loadingInYourArea == null ? "-" : response.loadingInYourArea,
    //   bhogvataPatraDate: moment(new Date(response.bhogvataPatraDate)).format(
    //     "DD/MM/YYYY"
    //   ),
    //   sanctionPlanArea:
    //     response.sanctionPlanArea == null ? "-" : response.sanctionPlanArea,
    //   constructionCost:
    //     response.constructionCost == null ? "-" : response.constructionCost,
    //   parkingCost: response.parkingCost == null ? "-" : response.parkingCost,
    //   rent: response.rent == null ? "-" : response.rent,
    //   shifting: response.shifting == null ? "-" : response.shifting,
    //   corpusFund: response.corpusFund == null ? "-" : response.corpusFund,
    //   bettermentCharges:
    //     response.bettermentCharges == null ? "-" : response.bettermentCharges,
    //   interest: response.interest == null ? "-" : response.interest,
    //   marketSaleRate:
    //     response.marketSaleRate == null ? "-" : response.marketSaleRate,
    //   developerProfit:
    //     response.developerProfit == null ? "-" : response.developerProfit,
    // };
    // });
    // console.log("modifiedProjectData",modifiedProjectData);


    var tempProjectDetails = {
      projectName: projectDetails[0].projectName,
      totalLandArea:
        projectDetails[0].totalLandArea == null ? "-" : projectDetails[0].totalLandArea,
      frontRoad: projectDetails[0].frontRoad == null ? "-" : projectDetails[0].frontRoad,
      rightRoad: projectDetails[0].rightRoad == null ? "-" : projectDetails[0].rightRoad,
      leftRoad: projectDetails[0].leftRoad == null ? "-" : projectDetails[0].leftRoad,
      backRoad: projectDetails[0].backRoad == null ? "-" : projectDetails[0].backRoad,
      readyReckonerRate:
        projectDetails[0].readyReckonerRate == null ? "-" : projectDetails[0].readyReckonerRate,
      buildingSheets:
        projectDetails[0].buildingSheets == null ? "-" : projectDetails[0].buildingSheets,
      noOfUnits: projectDetails[0].noOfUnits == null ? "-" : projectDetails[0].noOfUnits,
      noOfFlats: projectDetails[0].noOfFlats == null ? "-" : projectDetails[0].noOfFlats,
      noOfShops: projectDetails[0].noOfShops == null ? "-" : projectDetails[0].noOfShops,
      noOfOuthouse:
        projectDetails[0].noOfOuthouse == null ? "-" : projectDetails[0].noOfOuthouse,
      noOfBungalows:
        projectDetails[0].noOfBungalows == null ? "-" : projectDetails[0].noOfBungalows,
      noOfPlots: projectDetails[0].noOfPlots == null ? "-" : projectDetails[0].noOfPlots,
      noOfOffices: projectDetails[0].noOfOffices == null ? "-" : projectDetails[0].noOfOffices,
      noOfParking: projectDetails[0].noOfParking == null ? "-" : projectDetails[0].noOfParking,
      commericalRent:
        projectDetails[0].commericalRent == null ? "-" : projectDetails[0].commericalRent,
      residentialRent:
        projectDetails[0].residentialRent == null ? "-" : projectDetails[0].residentialRent,
      TODApplicability:
        projectDetails[0].TODApplicability == null ? "-" : projectDetails[0].TODApplicability,
      withinMunicipalLimits:
        projectDetails[0].withinMunicipalLimits == null
          ? "-"
          : projectDetails[0].withinMunicipalLimits,
      coreArea: projectDetails[0].coreArea == null ? "-" : projectDetails[0].coreArea,
      previousRoadWidening:
        projectDetails[0].previousRoadWidening == null
          ? "-"
          : projectDetails[0].previousRoadWidening,
      estimateAreaInRoadWidening:
        projectDetails[0].estimateAreaInRoadWidening == null
          ? "-"
          : projectDetails[0].estimateAreaInRoadWidening,
      widthOfAccessRoad:
        projectDetails[0].widthOfAccessRoad == null ? "-" : projectDetails[0].widthOfAccessRoad,
      loadingInYourArea:
        projectDetails[0].loadingInYourArea == null ? "-" : projectDetails[0].loadingInYourArea,
      bhogvataPatraDate: moment(new Date(projectDetails[0].bhogvataPatraDate)).format(
        "DD/MM/YYYY"
      ),
      sanctionPlanArea:
        projectDetails[0].sanctionPlanArea == null ? "-" : projectDetails[0].sanctionPlanArea,
      constructionCost:
        projectDetails[0].constructionCost == null ? "-" : projectDetails[0].constructionCost,
      parkingCost: projectDetails[0].parkingCost == null ? "-" : projectDetails[0].parkingCost,
      rent: projectDetails[0].rent == null ? "-" : projectDetails[0].rent,
      shifting: projectDetails[0].shifting == null ? "-" : projectDetails[0].shifting,
      corpusFund: projectDetails[0].corpusFund == null ? "-" : projectDetails[0].corpusFund,
      bettermentCharges:
        projectDetails[0].bettermentCharges == null ? "-" : projectDetails[0].bettermentCharges,
      interest: projectDetails[0].interest == null ? "-" : projectDetails[0].interest,
      marketSaleRate:
        projectDetails[0].marketSaleRate == null ? "-" : projectDetails[0].marketSaleRate,
      developerProfit:
        projectDetails[0].developerProfit == null ? "-" : projectDetails[0].developerProfit,
    };
    modifiedProjectData.push(tempProjectDetails);
    let ownerData = [];
    let propertyRole = [];
    for (var i of allProperty) {
      ownerData = i.owner;
      propertyRole = i.propertyrole;
      console.log("allProperty", allProperty);
      if (ownerData !== undefined && ownerData.length != 0)
        if (ownerData.length > 1) {
          console.log("reached here");
          // throw new HttpException(400, "owner dosen't exist");
          modifiedData = ownerData.map((res) => {
            console.log("reached", res.propertyrole);
            return {
              mobile: res.mobile,
              firstName: res.firstName,
              middleName: res.middleName,
              lastName: res.lastName,
              gender: res.gender,
              dateOfBirth: res.dateOfBirth,
              emailId: res.emailId,
              ownerType:
                propertyRole[i] === undefined || propertyRole[i] == "undefined"
                  ? "-"
                  : propertyRole[i].role,
              nameOfWing: i.nameOfWing,
              propertyType: i.propertyType,
              floorNumber: i.floorNumber,
              unitName: i.unitName,
              bhk: i.bhk,
              size: i.size,
              terrace: i.terrace,
              flatArea: i.flatArea,
              gardenArea: i.gardenArea,
              mezannineFloor: i.mezannineFloor,
              lastUpdated: moment(new Date()).format("DD/MM/YYYY"),
              isOwnerVerified: i.isOwnerVerified,
            };

          });
        } else if (ownerData.length == 1) {
          console.log(
            "reached here !!"
          );
          var singleOwnerData = {
            mobile: ownerData[0].mobile,
            firstName: ownerData[0].firstName,
            middleName: ownerData[0].middleName,
            lastName: ownerData[0].lastName,
            gender: ownerData[0].gender,
            dateOfBirth: ownerData[0].dateOfBirth,
            emailId: ownerData[0].emailId,
            ownerType:
              propertyRole[0] === undefined || propertyRole[0] == "undefined"
                ? "-"
                : propertyRole[0].role,
            nameOfWing: i.nameOfWing,
            propertyType: i.propertyType,
            floorNumber: i.floorNumber,
            unitName: i.unitName,
            bhk: i.bhk,
            size: i.size,
            terrace: i.terrace,
            flatArea: i.flatArea,
            gardenArea: i.gardenArea,
            mezannineFloor: i.mezannineFloor,
            lastUpdated: moment(new Date()).format("DD/MM/YYYY"),
            isOwnerVerified: i.isOwnerVerified,
          };

          modifiedData.push(singleOwnerData);
        } else {
          console.log("owner doesn't exist!!");
        }
    }
    var jsWorksheet1 = XLSX.utils.json_to_sheet(modifiedProjectData);
    var jsWorksheet2 = XLSX.utils.json_to_sheet(modifiedData);
    var date = moment(new Date()).format("YYYY-DD-MMTHH:mm:ss.000");
    const finalDate = date.replace(/:/g, "-");
    path = `../dr-api/src/excel_file/${finalDate}-dr-excel.xlsx`;
    /* add to workbook */
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, jsWorksheet1, "Sheet1");
    XLSX.utils.book_append_sheet(wb, jsWorksheet2, "Sheet2");
    /* generate an XLSX file */
    XLSX.writeFile(wb, path);
    path = `${process.env.DATABASE_URL}/${moment(new Date()).format(
      "YYYY-DD-MMTHH:mm:ss.000"
    )}-dr-excel.xlsx`;
    path = `${process.env.Excel_Download_url}/excel_file/${finalDate}-dr-excel.xlsx`; //{process.env.Excel_Download_url}
    return path;
  }

  public async getVersionsOfuploadedExcel(projectId): Promise<any> {

    const getProject = await project.findUnique({
      where: { projectId: projectId }
    })
    if (!getProject) throw new HttpException(400, `You're project ${projectId} doesn't exists`);

    try {
      const getVersions = await prisma.excelProjectVersions.findMany({
        where: {
          projectId: projectId
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      return getVersions
    }
    catch (error) {
      console.log(error)
      throw error
    }
  }
}

export default ExcelService;
