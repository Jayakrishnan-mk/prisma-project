import { favourite, Prisma, PrismaClient } from '@prisma/client';
import { CreateFavouriteDto } from '@dtos/favourite.dto';
import { HttpException } from '@exceptions/HttpException';
import { isEmpty } from '@utils/util';
import { Request } from 'express';
const favourite = new PrismaClient().favourite;
const stage_updates = new PrismaClient().stage_updates;

class FavouriteService {

  public async createFavourite(favouriteData: CreateFavouriteDto): Promise<favourite> {
    try {
      const developerData: favourite = await favourite.findFirst({ where: { developerId: favouriteData.developerId } })

      if (developerData) {
        const updatedFavouriteData: favourite = await favourite.update({
          where: { developerId: favouriteData.developerId },
          data: {
            projectId: Array.from(new Set(favouriteData.projectId))
          }
        })
        return updatedFavouriteData;
      }
      else {
        const createFavouriteData: favourite = await favourite.create({ data: { ...favouriteData } });
        return createFavouriteData;
      }
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  public async findFavouriteByDevId(developerId: string): Promise<favourite> {
    try {
      const findDeveloperProject = await favourite.findUnique({
        where:
          { developerId },
        include: {
          project: {
            include: {
              address: true
            }
          }
        }
      });

      let projectArray = findDeveloperProject?.project;

      const projectIds = [];
      for (let project of projectArray) {
        projectIds.push(project.projectId)
      }

      const stageUpdates = await stage_updates.findMany({
        where: {
          projectId: {
            in: projectIds
          }
        },
        orderBy: {
          createdAt: Prisma.SortOrder.desc
        },
        distinct: ['projectId']
      })

      const stageUpdatesDict = {};

      for (const stage of stageUpdates) {
        if (!stageUpdatesDict[stage.projectId]) {
          stageUpdatesDict[stage.projectId] = [];
        }
        stageUpdatesDict[stage.projectId].push(stage.projectStages);
      }

      for (const project of projectArray) {
        (project as any).projectStage = stageUpdatesDict[project.projectId] || [];
      }

      if (!findDeveloperProject) throw new HttpException(400, "This Developer Id doesn't exist...!");
      return findDeveloperProject;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}

export default FavouriteService;
