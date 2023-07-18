import { Prisma, PrismaClient, project, project_stages, stage_updates } from '@prisma/client';
import { CreateProjectDto } from '@dtos/projects.dto';
import { HttpException } from '@exceptions/HttpException';
import { checkStageUpdates, checkVerified, geoCoding, isEmpty, urlCreation } from '@utils/util';
import { CreateStageDto } from '@/dtos/stages.dto';

const project = new PrismaClient().project;
const stage_updates = new PrismaClient().stage_updates;
const Developer = new PrismaClient().developer;
const owner = new PrismaClient().owner;
const architect = new PrismaClient().architect;
const lawyer = new PrismaClient().lawyer;
const property = new PrismaClient().property;
const address = new PrismaClient().address;

var moment = require('moment');
//googleapis
const { google } = require('googleapis');
const sheets = google.sheets('v4');
// spreadsheet id
const spreadsheetId = "1CBBsb8X_ZRfePEJKAAkNCCWNEYBCrabnuB9krZJWzEY";
const sourceSheetId = "444856550";
const sheetNameFormat = moment().format('DD MM YY hh:mm:ss');

const auth = new google.auth.GoogleAuth({
  keyFile: "./sheetkeys.json", //the key file
  //url to spreadsheets API
  scopes: "https://www.googleapis.com/auth/spreadsheets",
});

class ProjectService {

  public async createProject(projectData: CreateProjectDto): Promise<project> {
    try {
      let locationData: any = {};
      locationData.place_id = projectData.place_id;
      locationData.location_name = projectData.location_name;

      const findProject: project = await project.findFirst({ where: { projectName: projectData.projectName } });
      if (findProject) throw new HttpException(400, `Your project name. ${projectData.projectName} already exist...!`);

      //// sales number validation////////////////
      if (projectData.salesNumber) {
        const number = projectData.salesNumber.toString();
        if (number.length !== 10) {
          throw new HttpException(400, "Sales number is not valid...!");
        }
      }

      delete projectData.place_id
      delete projectData.location_name

      let addressData = await geoCoding(locationData);

      let drProjectUrl = await urlCreation(addressData, projectData);

      const uniqueInitialDevIds: Array<string> = Array.from(new Set(projectData.initialDevId));
      const uniqueRedevelopDevIds: Array<string> = Array.from(new Set(projectData.redevelopDevId));

      const createProjectData: project = await project.create({
        data: {
          ...projectData,
          initialDevId: uniqueInitialDevIds,
          redevelopDevId: uniqueRedevelopDevIds,
          addressIds: addressData.addressId,
        }
      });

      await Developer.updateMany({
        where: {
          developerId: {
            in: uniqueInitialDevIds
          }
        },
        data: {
          initialProjectId: {
            push: createProjectData.projectId
          }
        }
      });

      await Developer.updateMany({
        where: {
          developerId: {
            in: uniqueRedevelopDevIds
          }
        },
        data: {
          redevelopProjectId: {
            push: createProjectData.projectId
          }
        }
      });

      // updating the stage................
      await stage_updates.create({
        data: {
          projectId: createProjectData.projectId,
        }
      })

      await checkVerified(createProjectData, drProjectUrl);

      const returnData = await project.findFirst({
        where: {
          projectId: createProjectData.projectId
        },
        include: {
          address: true,
          initialDev: true,
          redevelopDev: true,
          stage_updates: true
        }
      })

      return returnData;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  public async findAllProject(req: any): Promise<any> {
    try {
      let skip = (parseInt(req.query.pageNumber) - 1) * parseInt(req.query.pageSize);
      let take = parseInt(req.query.pageSize);
      let sortBy = req.query.sortBy;
      let order = req.query.order;
      let developerProject = req.query.developerProject == "false" ? false : true;

      if (order && !sortBy) {
        throw new HttpException(400, "Provide sortBy with order...!")
      }

      if (!order) {
        order = 'asc';
      }

      const count = await project.count({
        where:
          { isDeleted: false }
      });

      let allProject;

      // dr projects.........................
      if (developerProject == false) {
        let temp = []
        let isEmpty = Object.values(req.query).every(x => (x === null || x === '' || x === undefined))
        let objectKeys = Object.keys(req.query).sort()

        if (isEmpty) {
          console.log(isEmpty)
        } else {
          for (let i = 0; i < objectKeys.length; i++) {
            if (req.query[objectKeys[i]] != null && req.query[objectKeys[i]] != '' && req.query[objectKeys[i]] != undefined) {
              if (objectKeys[i] == "locality") {
                temp.push({ address: { locality: { equals: req.query[objectKeys[i]], mode: 'insensitive' } } });
              } else if (objectKeys[i] == "sublocality") {
                temp.push({ address: { sublocality: { contains: req.query[objectKeys[i]], mode: 'insensitive' } } });
              }
              else if (objectKeys[i] == "totalLandAreaMin") {
                temp.push({ totalLandArea: { gte: Number(req.query[objectKeys[i]]) } });
              }
              else if (objectKeys[i] == "totalLandAreaMax") {
                temp.push({ totalLandArea: { lte: Number(req.query[objectKeys[i]]) } });
              }
            }
          }
        }

        allProject = await project.findMany({
          where: {
            isDeleted: false,
            developerProject: false,
            AND: temp
          },
          include: {
            owner: true,
            address: true,
            property: true,
            template: true,
            initialDev: true,
            redevelopDev: true,
          },
        })

        let count = await project.count({
          where:
          {
            isDeleted: false,
            developerProject: false,
            AND: temp
          }
        });

        for (let element of allProject) {
          const findStage: stage_updates = await stage_updates.findFirst({
            where: {
              projectId: element.projectId
            },
            orderBy: {
              createdAt: Prisma.SortOrder.desc
            }
          });
          element.projectStages = findStage.projectStages;
        }

        let data: any = {};
        data.count = count;
        let newAllProject = []
        let stages = req.query.stages ? req.query.stages : []
        if (stages.length > 0) {
          for (let i = 0; i < allProject.length; i++) {
            let flag = stages.includes(allProject[i].projectStages);
            if (flag == true) {
              newAllProject.push(allProject[i])
            }
          }
          data.count = newAllProject.length
          data.allProject = newAllProject
          return data
        }
        else {
          data.allProject = allProject;
          return data;
        }
      }
      // all projects.......................
      else {
        console.log(developerProject)
        if (!sortBy) {
          let temp = []
          let isEmpty = Object.values(req.query).every(x => (x === null || x === '' || x === undefined))
          let objectKeys = Object.keys(req.query).sort()

          if (isEmpty) {
            console.log(isEmpty)
          } else {
            for (let i = 0; i < objectKeys.length; i++) {
              if (req.query[objectKeys[i]] != null && req.query[objectKeys[i]] != '' && req.query[objectKeys[i]] != undefined) {
                if (objectKeys[i] == "locality") {
                  temp.push({ address: { locality: { equals: req.query[objectKeys[i]], mode: 'insensitive' } } });
                } else if (objectKeys[i] == "sublocality") {
                  temp.push({ address: { sublocality: { contains: req.query[objectKeys[i]], mode: 'insensitive' } } });
                }
                else if (objectKeys[i] == "totalLandAreaMin") {
                  temp.push({ totalLandArea: { gte: Number(req.query[objectKeys[i]]) } });
                }
                else if (objectKeys[i] == "totalLandAreaMax") {
                  temp.push({ totalLandArea: { lte: Number(req.query[objectKeys[i]]) } });
                }
              }
            }
          }

          const count = await project.count({
            where:
            {
              isDeleted: false,
              AND: temp
            }
          });

          allProject = (await project.findMany({
            where: {
              isDeleted: false,
              AND: temp
            },
            include: {
              owner: true,
              address: true,
              property: true,
              template: true,
              initialDev: true,
              redevelopDev: true,
            },
          })).sort(
            (project1: any, project2: any): any => {
              return (new Date(project2["updatedAt"]) as any) - (new Date(project1["updatedAt"]) as any)
            }
          )

          let requiredData = allProject.filter(project => !project.isDeleted);

          let actualData;

          if (skip && take) {
            actualData = requiredData.slice(skip, skip + take);
          }
          else if (skip == 0 && take) {
            actualData = requiredData.slice(skip, skip + take);
          }
          else if (skip == 0 && !take) {
            throw new HttpException(400, "Provide page size with page number...!");
          }
          else if (skip && !take) {
            throw new HttpException(400, "Provide page size with page number...!");
          }
          else if (!skip && take) {
            skip = 0;
            actualData = requiredData.slice(skip, skip + take);
          }
          else {
            actualData = requiredData;
          }

          for (let element of actualData) {
            const findStage: stage_updates = await stage_updates.findFirst({
              where: {
                projectId: element.projectId
              },
              orderBy: {
                createdAt: Prisma.SortOrder.desc
              }
            });
            element.projectStages = findStage.projectStages;
          }

          let data: any = {};
          data.count = count;
          data.allProject = actualData;

          let newAllProject = []
          let stages = req.query.stages ? req.query.stages : []

          if (stages.length > 0) {
            for (let i = 0; i < data.allProject.length; i++) {
              let flag = stages.includes(data.allProject[i].projectStages);
              if (flag == true) {
                newAllProject.push(data.allProject[i])
              }
            }
            data.count = newAllProject.length
            data.allProject = newAllProject
            return data
          }
          else {
            data.allProject = data.allProject;
            return data;
          }
        }
        else {
          let temp = []
          let isEmpty = Object.values(req.query).every(x => (x === null || x === '' || x === undefined))
          let objectKeys = Object.keys(req.query).sort()

          if (isEmpty) {
            console.log(isEmpty)
          } else {
            for (let i = 0; i < objectKeys.length; i++) {
              if (req.query[objectKeys[i]] != null && req.query[objectKeys[i]] != '' && req.query[objectKeys[i]] != undefined) {
                if (objectKeys[i] == "locality") {
                  temp.push({ address: { locality: { equals: req.query[objectKeys[i]], mode: 'insensitive' } } });
                } else if (objectKeys[i] == "sublocality") {
                  temp.push({ address: { sublocality: { contains: req.query[objectKeys[i]], mode: 'insensitive' } } });
                }
                else if (objectKeys[i] == "totalLandAreaMin") {
                  temp.push({ totalLandArea: { gte: Number(req.query[objectKeys[i]]) } });
                }
                else if (objectKeys[i] == "totalLandAreaMax") {
                  temp.push({ totalLandArea: { lte: Number(req.query[objectKeys[i]]) } });
                }
              }
            }
          }

          allProject = (await project.findMany({
            where: {
              AND: temp
            },
            include: {
              owner: true,
              address: true,
              property: true,
              template: true,
              initialDev: true,
              redevelopDev: true,
              stage_updates: true
            },
          })).sort(
            (project1: any, project2: any): any => {

              switch (sortBy) {
                case "projectName":
                  return order == 'asc' ?
                    project1[sortBy].toLowerCase().localeCompare(project2[sortBy].toLowerCase()) :
                    project2[sortBy].toLowerCase().localeCompare(project1[sortBy].toLowerCase());

                case "projectType":
                  const type1 = project1[sortBy] === null ? '' : project1[sortBy].toLowerCase();
                  const type2 = project2[sortBy] === null ? '' : project2[sortBy].toLowerCase();
                  return order == 'asc' ? type1.localeCompare(type2) : type2.localeCompare(type1);

                case "noOfBuilding":      /* ....buildings....... */
                  return order == 'desc' ?
                    (project2[sortBy] as any) - (project1[sortBy] as any) :
                    (project1[sortBy] as any) - (project2[sortBy] as any);

                case "noOfFlats":       /* ....flats....... */
                  return order == 'desc' ?
                    (project2[sortBy] as any) - (project1[sortBy] as any) :
                    (project1[sortBy] as any) - (project2[sortBy] as any);

                case "noOfShops":      /* ....shops....... */
                  return order == 'desc' ?
                    (project2[sortBy] as any) - (project1[sortBy] as any) :
                    (project1[sortBy] as any) - (project2[sortBy] as any);

                case "noOfOuthouse":        /* ....outhouses....... */
                  return order == 'desc' ?
                    (project2[sortBy] as any) - (project1[sortBy] as any) :
                    (project1[sortBy] as any) - (project2[sortBy] as any);

                case "noOfOffices":          /* ....offices....... */
                  return order == 'desc' ?
                    (project2[sortBy] as any) - (project1[sortBy] as any) :
                    (project1[sortBy] as any) - (project2[sortBy] as any);

                default:           /* ....verified status checking....... */
                  return order == 'asc' ?
                    Number(project1[sortBy]) - Number(project2[sortBy]) :
                    Number(project2[sortBy]) - Number(project1[sortBy])
              }
            }
          );

          let requiredData = allProject.filter(project => !project.isDeleted);

          let actualData;

          if (skip && take) {
            actualData = requiredData.slice(skip, skip + take);
          }
          else if (skip == 0 && take) {
            actualData = requiredData.slice(skip, skip + take);
          }
          else if (skip == 0 && !take) {
            throw new HttpException(400, "Provide page size with page number...!");
          }
          else if (skip && !take) {
            throw new HttpException(400, "Provide page size with page number...!");
          }
          else if (!skip && take) {
            skip = 0;
            actualData = requiredData.slice(skip, skip + take);
          }
          else {
            actualData = requiredData;
          }

          for (let element of actualData) {
            const findStage: stage_updates = await stage_updates.findFirst({
              where: {
                projectId: element.projectId
              },
              orderBy: {
                createdAt: Prisma.SortOrder.desc
              }
            });
            element.projectStages = findStage.projectStages;
          }

          let data: any = {};
          data.count = count;
          let newAllProject = []
          let stages = req.query.stages ? req.query.stages : []
          if (stages.length > 0) {
            for (let i = 0; i < data.allProject.length; i++) {
              let flag = stages.includes(allProject[i].projectStages);
              if (flag == true) {
                newAllProject.push(data.allProject[i])
              }
            }
            data.count = newAllProject.length
            data.allProject = newAllProject
            return data
          }
          else {
            data.allProject = allProject;
            return data;
          }
          data.allProject = actualData;
          return data;
        }
      }
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  public async findProjectById(projectId: string): Promise<any> {
    try {

      if (!projectId) {
        throw new HttpException(400, "Provide correct projectId...!")
      }

      let onboardStageMessage;
      let onboardingPercentage;

      const stageMessages = [
        "Project Creation Completed.",
        onboardStageMessage,
        "Project Verified Successfully.",
        "This Project is on Feasibility Stage.",
        "This Project is on Diligence Stage.",
        "This Project is on Bidding Stage.",
        "This Project is on Finalization Stage.",
        "This Project is on Agreement Stage.",
        "This Project is on Postcompletion Stage."
      ]


      const findProject: project = await project.findUnique({
        where: { projectId },
        include: {
          owner: true,
          address: true,
          property: true,
          template: true,
          initialDev: true,
          redevelopDev: true
        }
      });

      let stageArray = [];
      const findStage: stage_updates[] = await stage_updates.findMany({
        where: {
          projectId
        },
        orderBy: {
          createdAt: Prisma.SortOrder.asc
        }
      });

      stageArray = findStage;
      ////////////////////////////////////////////////////////////

      const propertyArray = await property.findMany({
        where: { projectId: findProject.projectId }
      })

      // filtering owner verified properties..............
      const onboardedProperties = propertyArray.filter(property => property.isOwnerVerified);

      let onboard = onboardedProperties.length;
      let total = propertyArray.length;

      onboardingPercentage = (onboard * 100) / total;

      if (isNaN(onboardingPercentage)) {
        onboardingPercentage = 0;
      }

      onboardStageMessage = `Onboarded ${onboardingPercentage} Total 100.`;

      ////////////////////////////////////////////////////////////


      let j = 0;
      for (let stage of stageArray) {
        let sum;
        for (let i = j; i < 10; i++) {
          sum = i + 1;
          break;
        }
        stage.stageLevel = sum;
        stage.message = stageMessages[sum - 1];

        if (stage.message == stageMessages[1]) {
          stage.message = onboardStageMessage;
        }

        stage.onboard = onboard;
        stage.total = total;

        j++;
      }

      if (!findProject) throw new HttpException(400, "This Project ID doesn't exist...!");

      const data = {
        project: findProject,
        projectStages: findStage
      };

      return data;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  public async findPropertyById(req: any): Promise<any> {
    try {
      const { projectId, nameOfWing, floorNumber, unitName } = req.query;

      if (!projectId) {
        throw new HttpException(400, "Please provide projectId!")
      }

      const findProject: any = await project.findMany({
        where:
          { projectId },
        include: {
          property: true,
        }
      });

      if (findProject.length == 0) {
        throw new HttpException(400, "This Project Id doesn't exists!");
      }

      let nameOfWingArray = [];
      let floorNumberArray = [];
      let unitNameArray = [];

      let obj;
      let sortedArray;

      if (projectId && nameOfWing && floorNumber) {
        obj = {
          where: {
            projectId,
            nameOfWing,
            floorNumber: Number(floorNumber)
          },
          distinct: ['unitName'],
        }
      }
      else if (projectId && nameOfWing) {
        obj = {
          where: { projectId, nameOfWing },
          distinct: ['floorNumber'],
        }
      }
      else if (projectId) {
        obj = {
          where: { projectId },
          distinct: ['nameOfWing'],
        }
      }

      let propertyDetails = await property.findMany(obj);

      if (projectId && !nameOfWing && !floorNumber && !unitName) {
        await propertyDetails.map((property) => {
          nameOfWingArray.push(property.nameOfWing)
        })

        sortedArray = nameOfWingArray.sort();
        nameOfWingArray = sortedArray;
        return { nameOfWingArray };
      }
      else if (projectId && nameOfWing && floorNumber && unitName) {
        const propertyData = await property.findFirst({
          where: {
            projectId,
            nameOfWing,
            floorNumber: Number(floorNumber),
            unitName
          }
        });

        if (!propertyData) {
          return {
            message: "Invalid property keys. There is no property with these keys!"
          };
        }
        else {
          return {
            message: `This property's id is ${propertyData.propertyId}.`,
            data: propertyData.propertyId
          }
        }

      }
      else if (projectId && nameOfWing && floorNumber) {
        await propertyDetails.map(async (property) => {
          unitNameArray.push(property.unitName);
        });
        sortedArray = unitNameArray.sort();
        unitNameArray = sortedArray
        return { unitNameArray };
      }
      else if (projectId && nameOfWing) {
        await propertyDetails.map(async (property) => {
          floorNumberArray.push(property.floorNumber);
        });
        sortedArray = floorNumberArray.sort();
        floorNumberArray = sortedArray
        return { floorNumberArray };
      }

    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  public async findProjectByUrl(drProjectUrl: string): Promise<project> {
    try {
      const findProject: project = await project.findFirst({
        where: {
          drProjectUrl: drProjectUrl
        },
        include: {
          owner: true,
          address: true,
          property: true,
          template: true,
          initialDev: true,
          redevelopDev: true,
          stage_updates: true
        }
      });
      if (!findProject) throw new HttpException(400, "This Project URL doesn't exist...!");

      return findProject;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  public async findProjectByName(projectName: string): Promise<project[]> {
    try {
      const findProject: project[] = await project.findMany({
        where: {
          AND: [{
            projectName: {
              contains: projectName,
              mode: 'insensitive'
            }
          },
          {
            developerProject: false,
            isDeleted: false
          }
          ]
        },
        include: {
          owner: true,
          address: true,
          property: true,
          template: true,
          initialDev: true,
          redevelopDev: true,
          stage_updates: true
        }
      });
      if (!findProject) throw new HttpException(400, "This Project NAME doesn't exist...!");
      return findProject;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  public async updateProject(projectId: string, projectData: CreateProjectDto): Promise<any> {
    try {
      if (isEmpty(projectData)) throw new HttpException(400, "Project data cannot be empty...!");

      const findProject: project = await project.findUnique({ where: { projectId: projectId } });
      if (!findProject) throw new HttpException(400, "This project ID doesn't exist...!");

      //// sales number validation////////////////
      if (projectData.salesNumber) {
        if (projectData.salesNumber !== findProject.salesNumber) {
          const number = projectData.salesNumber.toString();
          if (number.length !== 10) {
            throw new HttpException(400, "Sales number is not valid...!");
          }
        }
      }

      let newProjectData: any = {}
      newProjectData.place_id = projectData.place_id;
      newProjectData.location_name = projectData.location_name;
      newProjectData.projectId = projectId;

      if (projectData.isVerified && projectData.developerProject) {
        if (!projectData.place_id) {
          throw new HttpException(400, "Provide place_id and location_name...!")
        }
      }

      if (projectData.place_id) {
        let addressData = await geoCoding(newProjectData);
        let url;

        // if project name has no changes, then name in the url has no change but isVerified = true logic...
        if (projectData.projectName == findProject.projectName || !projectData.projectName) {
          if (findProject.isVerified == true || projectData.isVerified == true) {
            url = await urlCreation(addressData, findProject)
          }
          else {
            url = null;
          }

          // if project has no changes, then name in the url has no change but developerProjects = true logic...
          if (findProject.developerProject == true || projectData.developerProject == true) {
            url = await urlCreation(addressData, findProject)
          }
          else {
            url = null;
          }
        }


        // what if projectName also changed, condition...
        else if (findProject.projectName !== projectData.projectName) {
          findProject.projectName = projectData.projectName;
          if (findProject.isVerified == true || projectData.isVerified == true) {
            url = await urlCreation(addressData, findProject)
          }
          else {
            url = null;
          }

          // if project has no changes, then name in the url has no change but developerProjects = true logic...
          if (findProject.developerProject == true || projectData.developerProject == true) {
            url = await urlCreation(addressData, findProject)
          }
          else {
            url = null;
          }
        }

        await project.update({
          where: { projectId },
          data: {
            addressIds: addressData.addressId,
            drProjectUrl: url
          }
        });
      }

      // if you want to change the name and you want to autogenerate the new drUrl, 
      // then you need to send the place_id and location_name also. That's mandatory.
      if (projectData.projectName) {
        if (!newProjectData.place_id) throw new HttpException(400, "Provide place_id also, when you're changing the name! It'll affect your autogenerated drUrl id...!");
      }

      delete projectData.place_id
      delete projectData.location_name

      const findStage: stage_updates = await stage_updates.findFirst({
        where: {
          projectId
        },
        orderBy: {
          createdAt: Prisma.SortOrder.desc
        }
      });

      if (projectData?.initialDevId) {
        const uniqueInitialDevIds: Array<string> = Array.from(new Set(projectData.initialDevId));
        projectData.initialDevId = uniqueInitialDevIds
      }
      if (projectData?.redevelopDevId) {
        const uniqueRedevelopDevIds: Array<string> = Array.from(new Set(projectData.redevelopDevId));
        projectData.redevelopDevId = uniqueRedevelopDevIds
      }
      
      const updateProjectData = await project.update({
        where: { projectId },
        data: {
          ...projectData,
          // initialDevId: uniqueInitialDevIds,
          // redevelopDevId: uniqueRedevelopDevIds
          // initialDev: {
          //   connect: uniqueInitialDevIds.map((developerId) => ({
          //     initialDevId: developerId
          //   }))
          // },
          // redevelopDev: {
          //   connect: uniqueRedevelopDevIds.map((developerId) => ({
          //     redevelopDevId: developerId
          //   }))
          // }
        }
      });

      const data = { updateProjectData, findStage };
      return data;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  public async deleteProject(projectId: string): Promise<project> {
    try {
      if (isEmpty(projectId)) throw new HttpException(400, "Project data cannot be empty...!");

      const deleteProjectData: project = await project.update({
        where: { projectId: projectId },
        data: { isDeleted: true }
      });
      if (!deleteProjectData) throw new HttpException(400, "Project data doesn't exist...!");

      return deleteProjectData;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  public async calculateFSI(data): Promise<any> {
    try {
      const authClientObject = await auth.getClient();
      const duplicateSheetResponse = await this.duplicateFSISheet(authClientObject, data);
      var duplicateSheetID = duplicateSheetResponse.replies[0].duplicateSheet.properties.sheetId;
      var duplicateSheetName = duplicateSheetResponse.replies[0].duplicateSheet.properties.title;
      var updatedDataResponse = await this.setUserValues(data, duplicateSheetName, authClientObject);
      const request = {
        spreadsheetId: spreadsheetId,
        range: duplicateSheetName + "!L20",
        auth: authClientObject,
      }
      try {
        const response = (await sheets.spreadsheets.values.get(request)).data;
        return response;
      } catch (err) {
        console.error(err);
      }
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async duplicateFSISheet(authClientObject, body) {
    try {
      var currentDateTime = moment().format(sheetNameFormat) + Math.floor((Math.random() * 100) + 1);
      const request = {
        // The spreadsheet to apply the updates to.
        spreadsheetId: spreadsheetId,

        resource: {
          requests: [{
            duplicateSheet: {
              "sourceSheetId": sourceSheetId,
              "insertSheetIndex": 0,
              "newSheetName": currentDateTime
            }
          }],
        },

        auth: authClientObject,
      };

      try {
        const response = (await sheets.spreadsheets.batchUpdate(request)).data;
        return response;
      } catch (err) {
        console.error(err);
      }
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async setUserValues(body, sheetName, authClientObject) {
    try {
      var rangeDetails = sheetName + '!D5:D9';
      const request = {

        spreadsheetId: spreadsheetId,
        resource: {
          valueInputOption: "RAW",
          data: [
            {
              range: rangeDetails, // Update column
              values: [[body.city], [body.tod], [body.limits], [body.corearea], [body.area]]
            },
            {
              range: sheetName + '!D11', // Update a single value
              values: [[body.road]]
            }

          ]
        },
        auth: authClientObject,
      }


      try {
        const response = (await sheets.spreadsheets.values.batchUpdate(request)).data;

        return response;
      } catch (err) {
        console.error(err);
      }
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  public async createStage(stageData: CreateStageDto): Promise<stage_updates> {
    try {
      const findStage: stage_updates = await stage_updates.findFirst({
        where: {
          projectId: stageData.projectId
        },
        orderBy: {
          createdAt: Prisma.SortOrder.desc
        }
      });

      if (!findStage)
        throw new HttpException(400, "No data found...!");

      await checkStageUpdates(findStage.projectStages, stageData.projectStages, stageData.projectId);

      // updating the project to isVerified true.............
      if (stageData.projectStages == "verified") {
        await project.update({
          where: { projectId: stageData.projectId },
          data: { isVerified: true }
        })
      }

      const findProject = await project.findFirst({
        where: { projectId: stageData.projectId }
      })

      const findAddress = await address.findFirst({
        where: {
          addressId: findProject.addressIds
        }
      })

      const url = await urlCreation(findAddress, findProject)

      await project.update({
        where: { projectId: stageData.projectId },
        data: {
          drProjectUrl: url
        }
      });

      const createStageData: stage_updates = await stage_updates.create({ data: { ...stageData } });
      return createStageData;

    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  public async getAllLocality(): Promise<any> {
    try {

      const getCities = await address.groupBy({
        by: ['locality']
      })

      let cities = []
      for (let i = 0; i < getCities.length; i++) {
        if (getCities[i].locality != null) {
          cities.push(getCities[i].locality)
        }
      }

      cities = [...new Set(cities)]
      cities.sort()
      return cities
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  public async getBiddingProject(): Promise<stage_updates[]> {
    try {
      const biddingProjects: stage_updates[] = await stage_updates.findMany({
        where: {
          projectStages: "bidding"
        },
        include: {
          project: {
            include: {
              address: true
            }
          }
        }
      });
      if (!biddingProjects || biddingProjects.length === 0) {
        throw new HttpException(400, "No projects records found in bidding stage...!");
      }
      return biddingProjects;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  public async findProjectOfSpecificUser(data): Promise<any> {
    try {

      const personaId = data.personaId;
      let projectArray = [];
      let stageArray = [];
      let onboardStageMessage;
      let onboardingPercentage;

      const stageMessages = [
        "Project Creation Completed.",
        onboardStageMessage,
        "Project Verified Successfully.",
        "This Project is on Feasibility Stage.",
        "This Project is on Diligence Stage.",
        "This Project is on Bidding Stage.",
        "This Project is on Finalization Stage.",
        "This Project is on Agreement Stage.",
        "This Project is on Postcompletion Stage."
      ]

      // if user is developer.............................................
      const checkUserIsDeveloper = await Developer.findFirst({
        where: { developerId: personaId },
        include: {
          redevelopProject: true
        }
      })

      if (checkUserIsDeveloper) {
        // projectArray = checkUserIsDeveloper.redevelopProject;

        const resultArray = await projectArrayLoop(checkUserIsDeveloper);
        return resultArray;
      }

      // if user is owner.............................................      
      const checkUserIsOwner = await owner.findFirst({
        where: { ownerId: personaId },
        include: {
          project: {
            include: {
              property: true
            }
          },
          property: true
        }
      })

      if (checkUserIsOwner) {
        // projectArray = checkUserIsOwner.project;

        const resultArray = await projectArrayLoop(checkUserIsOwner);
        return resultArray;
      }

      // if user is architect.............................................
      const checkUserIsArchitect = await architect.findFirst({
        where: { architectId: personaId },
        include: {
          project: true
        }
      })

      if (checkUserIsArchitect) {
        // projectArray = checkUserIsArchitect.project;

        const resultArray = await projectArrayLoop(checkUserIsArchitect);
        return resultArray;
      }

      // if user is lawyer.............................................
      const checkUserIsLawyer = await lawyer.findFirst({
        where: { lawyerId: personaId },
        include: {
          project: true
        }
      })

      if (checkUserIsLawyer) {
        // projectArray = checkUserIsLawyer.project;

        const resultArray = await projectArrayLoop(checkUserIsLawyer);
        return resultArray;
      }

      throw new HttpException(400, "This user is not a developer/owner/architect/lawyer...!")

      // ........function for loop the project array and making stages................
      // async function projectArrayLoop(projectArray: any) {
      async function projectArrayLoop(project: any) {

        let projectArray;

        if (project.redevelopProject) {
          projectArray = project.redevelopProject;
        }
        else {
          projectArray = project.project;
        }

        for (let element of projectArray) {
          const propertyArray = await property.findMany({
            where: { projectId: element.projectId }
          })

          // filtering owner verified properties..............
          const onboardedProperties = propertyArray.filter(property => property.isOwnerVerified);

          let onboard = onboardedProperties.length;
          let total = propertyArray.length;

          onboardingPercentage = (onboard * 100) / total;

          if (isNaN(onboardingPercentage)) {
            onboardingPercentage = 0;
          }

          onboardStageMessage = `Onboarded ${onboardingPercentage} Total 100.`;

          const findStage: stage_updates[] = await stage_updates.findMany({
            where: {
              projectId: element.projectId
            },
            orderBy: {
              createdAt: Prisma.SortOrder.asc
            }
          });

          stageArray = findStage;

          let j = 0;
          for (let stage of stageArray) {
            let sum;
            for (let i = j; i < 10; i++) {
              sum = i + 1;
              break;
            }
            stage.stageLevel = sum;
            stage.message = stageMessages[sum - 1];

            if (stage.message == stageMessages[1]) {
              stage.message = onboardStageMessage;
            }

            stage.onboard = onboard;
            stage.total = total;
            j++;
          }

          element.projectStages = stageArray;
        }
        // return projectArray;
        return project;
      }
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}

export default ProjectService;
