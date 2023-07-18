import { CreateDeveloperDto } from "@/dtos/developers.dto";
import { HttpException } from "@/exceptions/HttpException";
import { checkVerified, checkWebsiteValidation, geoCoding, isEmpty, mobileValidation, passwordGenerator, urlCreation } from "@/utils/util";
import { developer, PrismaClient, user } from "@prisma/client";

const Developer = new PrismaClient().developer;
const user = new PrismaClient().user;
const project = new PrismaClient().project;
class DeveloperService {

    public async createDeveloper(developerData: CreateDeveloperDto): Promise<developer> {
        try {
            let locationData: any = {};
            locationData.place_id = developerData.place_id;
            locationData.location_name = developerData.location_name;

            const mobileNumber = developerData.mobile.toString();
            if (mobileNumber.length !== 10) {
                throw new HttpException(400, "Mobile number is not valid...!");
            }
            const mobile = Number(mobileNumber)

            const findDeveloper: developer = await Developer.findUnique({ where: { mobile } });
            if (findDeveloper) throw new HttpException(400, `Your mobile number ${developerData.mobile} already exist...!`);

            // website validation
            if (developerData.website) {
                if (!await checkWebsiteValidation(developerData.website)) {
                    throw new HttpException(400, "Invalid website...!")
                }
            }

            delete developerData.place_id
            delete developerData.location_name

            let addressData = await geoCoding(locationData);

            let drDeveloperUrl = await urlCreation(addressData, developerData);

            const uniqueInitialProjectIds: Array<string> = Array.from(new Set(developerData.initialProjectId));
            const uniqueRedevelopProjectIds: Array<string> = Array.from(new Set(developerData.redevelopProjectId));

            const createDeveloperData: developer = await Developer.create({
                data: {
                    ...developerData,
                    initialProjectId: uniqueInitialProjectIds,
                    redevelopProjectId: uniqueRedevelopProjectIds,
                    address: {
                        connect: [{
                            addressId: addressData.addressId
                        }]
                    }
                }
            });

            await project.updateMany({
                where: {
                    projectId: {
                        in: uniqueInitialProjectIds
                    }
                },
                data: {
                    initialDevId: {
                        push: createDeveloperData.developerId
                    }
                }
            });

            await project.updateMany({
                where: {
                    projectId: {
                        in: uniqueRedevelopProjectIds
                    }
                },
                data: {
                    redevelopDevId: {
                        push: createDeveloperData.developerId
                    }
                }
            });


            /////////////////////////////////////////////
            let password = await passwordGenerator();

            const mobileExists = await user.findFirst({
                where: { mobile }
            })

            if (mobileExists) {
                await user.update({
                    where: { mobile },
                    data: {
                        developerId: createDeveloperData.developerId
                    }
                })
            }
            else {
                await user.create({
                    data: {
                        emailId: createDeveloperData.email,
                        password,
                        mobile: createDeveloperData.mobile,
                        developerId: createDeveloperData.developerId
                    }
                })
            }
            /////////////////////////////////////////////

            await checkVerified(createDeveloperData, drDeveloperUrl);

            const returnData = await Developer.findFirst({
                where: {
                    developerId: createDeveloperData.developerId
                },
                include: {
                    initialProject: true,
                    redevelopProject: true,
                    address: true,
                    member: true,
                }
            })
            return returnData;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    public async findAllDeveloper(req: any): Promise<developer[]> {
        try {
            let skip = (parseInt(req.query.pageNumber) - 1) * parseInt(req.query.pageSize);
            let take = parseInt(req.query.pageSize);
            let sortBy = req.query.sortBy;
            let order = req.query.order;

            if (order && !sortBy) {
                throw new HttpException(400, "Provide sortBy with order...!")
            }

            if (!order) {
                order = 'asc';
            }

            const count = await Developer.count({
                where:
                    { isDeleted: false }
            });

            let allDeveloper;

            if (!sortBy) {
                allDeveloper = (await Developer.findMany({
                    include: {
                        initialProject: {
                            include: {
                                address: true
                            }
                        },
                        redevelopProject: {
                            include: {
                                address: true
                            }
                        },
                        address: true,
                        member: true,
                    },
                })).sort(
                    (developer1: any, developer2: any): any => {
                        return (new Date(developer2["updatedAt"]) as any) - (new Date(developer1["updatedAt"]) as any)
                    }
                )

                let requiredData = allDeveloper.filter(developer => !developer.isDeleted);

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

                let data: any = {};
                data.count = count;
                data.allDeveloper = actualData;
                return data;

            }
            else {
                allDeveloper = (await Developer.findMany({
                    include: {
                        initialProject: {
                            include: {
                                address: true
                            }
                        },
                        redevelopProject: {
                            include: {
                                address: true
                            }
                        },
                        address: true,
                        member: true,
                    },
                })).sort(
                    (developer1: any, developer2: any): any => {
                        if (sortBy == "updatedAt") {
                            if (order == 'desc') {
                                return (new Date(developer2[sortBy]) as any) - (new Date(developer1[sortBy]) as any)
                            }
                            else {
                                return (new Date(developer1[sortBy]) as any) - (new Date(developer2[sortBy]) as any)
                            }
                        }
                        else if (sortBy == "name") {
                            if (order == 'asc') {
                                return developer1[sortBy].toLowerCase().localeCompare(developer2[sortBy].toLowerCase());
                            }
                            else {
                                return developer2[sortBy].toLowerCase().localeCompare(developer1[sortBy].toLowerCase());
                            }
                        }
                        else {                /* ....verified status checking....... */
                            if (order == 'asc') {
                                return Number(developer1[sortBy]) - Number(developer2[sortBy])
                            }
                            else {
                                return Number(developer2[sortBy]) - Number(developer1[sortBy])
                            }
                        }
                    }
                )

                let requiredData = allDeveloper.filter(developer => !developer.isDeleted);

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

                let data: any = {};
                data.count = count;
                data.allDeveloper = actualData;
                return data;
            }
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    public async findDeveloperById(developerId: string): Promise<developer> {
        try {
            const findDeveloper: developer = await Developer.findUnique({
                where: { developerId },
                include: {
                    initialProject: {
                        include: {
                            address: true
                        }
                    },
                    redevelopProject: {
                        include: {
                            address: true
                        }
                    },
                    address: true,
                    member: true,
                }
            });

            if (!findDeveloper) throw new HttpException(400, "This Developer ID doesn't exist...!");
            return findDeveloper;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    public async findDeveloperByUrl(drDeveloperUrl: string): Promise<developer> {
        try {
            const findDeveloper: developer = await Developer.findFirst({
                where: { drDeveloperUrl },
                include: {
                    initialProject: {
                        include: {
                            address: true
                        }
                    },
                    redevelopProject: {
                        include: {
                            address: true
                        }
                    },
                    address: true,
                    member: true,
                }
            });

            if (!findDeveloper) throw new HttpException(400, "This Developer URL doesn't exist...!");

            return findDeveloper;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    public async findDeveloperByName(nameQuery: string): Promise<developer[]> {
        try {
            const findDeveloper: developer[] = await Developer.findMany({
                where: {
                    AND: [{
                        name: {
                            contains: nameQuery,
                            mode: 'insensitive'
                        }
                    },
                    {
                        verified: true,
                        isDeleted: false
                    }
                    ]
                },
                include: {
                    initialProject: true,
                    redevelopProject: true,
                    address: true,
                    member: true,
                }
            });

            if (!findDeveloper) throw new HttpException(400, "This Developer NAME doesn't exist...!");

            return findDeveloper;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    public async updateDeveloper(developerId: string, developerData: any): Promise<developer> {
        try {
            if (isEmpty(developerData)) throw new HttpException(400, "Developer data cannot be empty...!");

            const findDeveloper: developer = await Developer.findUnique({ where: { developerId } });
            if (!findDeveloper) throw new HttpException(400, "This developer ID doesn't exist...!");

            await mobileValidation(developerData, findDeveloper);

            let newDevData: any = {};
            newDevData.place_id = developerData.place_id;
            newDevData.location_name = developerData.location_name;
            newDevData.developerId = developerId;

            if (developerData.verified) {
                if (!developerData.place_id) {
                    throw new HttpException(400, "Provide place_id and location_name...!")
                }
            }

            if (developerData.place_id) {
                let addressData = await geoCoding(newDevData);
                let url;

                // if developer name has no changes, then name in the url has no change logic...
                if (developerData.name == findDeveloper.name || !developerData.name) {
                    if (findDeveloper.verified == true || developerData.verified == true) {
                        url = await urlCreation(addressData, findDeveloper)
                    }
                    else {
                        url = null;
                    }
                }
                // if developer name also changed, condition...
                else if (findDeveloper.name !== developerData.name) {
                    findDeveloper.name = developerData.name;
                    if (findDeveloper.verified == true || developerData.verified == true) {
                        url = await urlCreation(addressData, findDeveloper)
                    }
                    else {
                        url = null;
                    }
                }

                await Developer.update({
                    where: { developerId },
                    data: {
                        address: {
                            connect: [{
                                addressId: addressData.addressId
                            }]
                        },
                        drDeveloperUrl: url
                    }
                });
            }

            // if you want to change the name and you want to autogenerate the new drUrl, then you need to send the place_id and location_name also. That's mandatory.
            else if (developerData.name) {
                if (!newDevData.place_id) throw new HttpException(400, "Please mention the place_id also, when you're changing the name! It'll affect your autogenerated drUrl id...!");
            }

            delete developerData.place_id
            delete developerData.location_name

            const uniqueInitialProjectIds: Array<string> = Array.from(new Set(developerData.initialProjectId));
            const uniqueRedevelopProjectIds: Array<string> = Array.from(new Set(developerData.redevelopProjectId));

            const updateDeveloperData = await Developer.update({
                where: { developerId },
                data: {
                    ...developerData,
                    initialProjectId: uniqueInitialProjectIds,
                    redevelopProjectId: uniqueRedevelopProjectIds
                }
            });

            await project.updateMany({
                where: {
                    projectId: {
                        in: uniqueInitialProjectIds
                    }
                },
                data: {
                    initialDevId: {
                        push: developerId
                    }
                }
            });

            await project.updateMany({
                where: {
                    projectId: {
                        in: uniqueRedevelopProjectIds
                    }
                },
                data: {
                    redevelopDevId: {
                        push: developerId
                    }
                }
            });

            return updateDeveloperData;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    public async deleteDeveloper(developerId: string): Promise<developer> {
        try {
            if (isEmpty(developerId)) throw new HttpException(400, "Developer data cannot be empty...!");

            const deleteDeveloperData: developer = await Developer.update({
                where: { developerId },
                data: { isDeleted: true }
            });
            if (!deleteDeveloperData) throw new HttpException(400, "This Developer data doesn't exist...!");

            return deleteDeveloperData;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    public async searchDeveloper(search: string): Promise<developer[]> {
        try {
            if (isEmpty(search)) throw new HttpException(400, "Search cannot be empty...!");

            const searchDeveloperData = await Developer.findMany({
                where: {
                    name: { contains: search, mode: 'insensitive' }
                },
            });

            if (searchDeveloperData.length == 0) throw new HttpException(400, "There is no developer with this name...!")
            return searchDeveloperData;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }
}

export default DeveloperService;
