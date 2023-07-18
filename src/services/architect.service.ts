import { CreateArchitectDto } from "@/dtos/architect.dto";
import { HttpException } from "@/exceptions/HttpException";
import { checkVerified, geoCoding, isEmpty, mobileValidation, passwordGenerator, urlCreation } from "@/utils/util";
import { architect, PrismaClient } from "@prisma/client";

const architect = new PrismaClient().architect;
const user = new PrismaClient().user;
const project = new PrismaClient().project;
class ArchitectService {

    public async createArchitect(architectData: CreateArchitectDto): Promise<architect> {
        try {
            let locationData: any = {};
            locationData.place_id = architectData.place_id;
            locationData.location_name = architectData.location_name;

            const findArchitect: architect = await architect.findFirst({ where: { mobile: architectData.mobile } });
            if (findArchitect) throw new HttpException(400, `This architect mobile number ${architectData.mobile} already exist...!`);

            delete architectData.place_id
            delete architectData.location_name

            let addressData = await geoCoding(locationData);

            let drArchitectUrl = await urlCreation(addressData, architectData);

            const uniqueProjectIds: Array<string> = Array.from(new Set(architectData.projectId));

            const createArchitectData: architect = await architect.create({
                data: {
                    ...architectData,
                    projectId: uniqueProjectIds,
                    address: {
                        connect: [{
                            addressId: addressData.addressId
                        }]
                    },
                }
            });

            await project.updateMany({
                where: {
                    projectId: {
                        in: uniqueProjectIds
                    }
                },
                data: {
                    architectId: {
                        push: createArchitectData.architectId
                    }
                }
            });

            //////  user creation   ////////////////////////////////////////////
            let password = await passwordGenerator();
            const mobileExists = await user.findFirst({
                where: { mobile: architectData.mobile }
            })

            /* Update Mobile Number & update LoginUser*/
            if (mobileExists) {
                await user.update({
                    where: { mobile: architectData.mobile },
                    data: {
                        architectId: createArchitectData.architectId
                    }
                })
            }
            else {
                await user.create({
                    data: {
                        emailId: createArchitectData.email,
                        password,
                        mobile: createArchitectData.mobile,
                        architectId: createArchitectData.architectId
                    }
                })
            }

            await checkVerified(createArchitectData, drArchitectUrl);

            const returnData = await architect.findFirst({
                where: {
                    architectId: createArchitectData.architectId
                },
                include: {
                    address: true,
                    project: true
                }
            })
            return returnData;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    public async findAllArchitect(req: any): Promise<architect[]> {
        try {
            let skip = (parseInt(req.query.pageNumber) - 1) * parseInt(req.query.pageSize);
            let take = parseInt(req.query.pageSize);
            let sortBy = req.query.sortBy;
            let order = req.query.order;

            if (order && !sortBy) {
                throw new HttpException(400, "Please provide sortBy with order...!")
            }

            if (!order) {
                order = 'asc';
            }

            const count = await architect.count({
                where:
                    { isDeleted: false }
            });

            let allArchitect;

            if (!sortBy) {
                allArchitect = (await architect.findMany({
                    include: {
                        address: true,
                        project: {
                            include: {
                                address: true
                            },
                        },
                    },
                })).sort(
                    (architect1: any, architect2: any): any => {
                        return (new Date(architect2["updatedAt"]) as any) - (new Date(architect1["updatedAt"]) as any)
                    }
                )

                let requiredData = allArchitect.filter(architect => !architect.isDeleted);

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
                data.allArchitect = actualData;
                return data;
            }
            else {
                allArchitect = (await architect.findMany({
                    include: {
                        address: true,
                        project: {
                            include: {
                                address: true
                            },
                        },
                    },
                })).sort(
                    (architect1: any, architect2: any): any => {
                        if (sortBy == "updatedAt") {
                            if (order == 'desc') {
                                return (new Date(architect2[sortBy]) as any) - (new Date(architect1[sortBy]) as any)
                            }
                            else {
                                return (new Date(architect1[sortBy]) as any) - (new Date(architect2[sortBy]) as any)
                            }
                        }
                        else if (sortBy == "architectName") {
                            if (order == 'asc') {
                                return architect1[sortBy].toLowerCase().localeCompare(architect2[sortBy].toLowerCase());
                            }
                            else {
                                return architect2[sortBy].toLowerCase().localeCompare(architect1[sortBy].toLowerCase());
                            }
                        }
                        else {         /* ....verified status checking....... */
                            if (order == 'asc') {
                                return Number(architect1[sortBy]) - Number(architect2[sortBy])
                            }
                            else {
                                return Number(architect2[sortBy]) - Number(architect1[sortBy])
                            }
                        }
                    }
                )

                let requiredData = allArchitect.filter(architect => !architect.isDeleted);

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
                data.allArchitect = actualData;
                return data;
            }
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    public async findArchitectById(architectId: string): Promise<architect> {
        try {
            const findArchitect: architect = await architect.findUnique({
                where: { architectId },
                include: {
                    address: true,
                    project: {
                        include: {
                            address: true
                        }
                    },
                }
            });

            if (!findArchitect) throw new HttpException(400, "This Architect ID doesn't exist...!");
            return findArchitect;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    public async findArchitectByUrl(drArchitectUrl: string): Promise<architect> {
        try {
            const findArchitect: architect = await architect.findFirst({
                where: { drArchitectUrl },
                include: {
                    address: true,
                    project: {
                        include: {
                            address: true
                        }
                    },
                }
            });
            if (!findArchitect) throw new HttpException(400, "This Architect URL doesn't exist...!");
            return findArchitect;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    public async findArchitectByName(architectName: string): Promise<architect[]> {
        try {
            const findArchitect: architect[] = await architect.findMany({
                where: {
                    AND: [{
                        architectName: {
                            contains: architectName,
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
                    address: true,
                    project: {
                        include: {
                            address: true
                        }
                    },
                }
            });
            if (!findArchitect) throw new HttpException(400, "This Architect NAME doesn't exist...!");
            return findArchitect;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    public async updateArchitect(architectId: string, architectData: CreateArchitectDto): Promise<architect> {
        try {
            if (isEmpty(architectData)) throw new HttpException(400, "Architect Data cannot be empty...!");

            const findArchitect: architect = await architect.findUnique({ where: { architectId } });
            if (!findArchitect) throw new HttpException(400, "This architect ID doesn't exist....!");

            await mobileValidation(architectData, findArchitect);

            let newArchitectData: any = {}
            newArchitectData.place_id = architectData.place_id;
            newArchitectData.location_name = architectData.location_name;
            newArchitectData.architectId = architectId;

            if (architectData.verified) {
                if (!architectData.place_id) {
                    throw new HttpException(400, "Provide place_id & location_name...!")
                }
            }

            if (architectData.place_id) {
                let addressData = await geoCoding(newArchitectData);
                let url;

                // if architect name has no changes, then name in the url has no change logic...
                if (architectData.architectName == findArchitect.architectName || !architectData.architectName) {
                    if (findArchitect.verified == true || architectData.verified == true) {
                        url = await urlCreation(addressData, findArchitect)
                    }
                    else {
                        url = null;
                    }
                }
                // if architectName also changed, condition...
                else if (findArchitect.architectName !== architectData.architectName) {
                    findArchitect.architectName = architectData.architectName;
                    if (findArchitect.verified == true || architectData.verified == true) {
                        url = await urlCreation(addressData, findArchitect)
                    }
                    else {
                        url = null;
                    }
                }

                await architect.update({
                    where: { architectId },
                    data: {
                        address: {
                            connect: [{
                                addressId: addressData.addressId
                            }]
                        },
                        drArchitectUrl: url
                    }
                });
            }

            // if you want to change the name and you want to autogenerate the new drUrl, then you need to send the place_id and location_name also. That's mandatory.
            else if (architectData.architectName) {
                if (!newArchitectData.place_id) throw new HttpException(400, "Please provide the place_id also, when you're changing the name! It'll affect your autogenerated drUrl id...!");
            }

            delete architectData.place_id
            delete architectData.location_name

            const uniqueProjectIds: Array<string> = Array.from(new Set(architectData.projectId));

            const updateArchitectData = await architect.update({
                where: { architectId },
                data: {
                    ...architectData,
                    projectId: uniqueProjectIds
                }
            });

            await project.updateMany({
                where: {
                    projectId: {
                        in: uniqueProjectIds
                    }
                },
                data: {
                    architectId: {
                        push: architectId
                    }
                }
            })

            return updateArchitectData;
        } catch (error) {
            console.log(error);
            throw error;
        }

    }

    public async deleteArchitect(architectId: string): Promise<architect> {
        try {
            if (isEmpty(architectId)) throw new HttpException(400, "Architect Data cannot be empty....!");

            const deleteArchitectData: architect = await architect.update({
                where: { architectId: architectId },
                data: { isDeleted: true }
            });
            if (!deleteArchitectData) throw new HttpException(400, "This Architect ID doesn't exist...!");

            return deleteArchitectData;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    public async searchArchitect(search: string): Promise<architect[]> {
        try {
            if (isEmpty(search)) throw new HttpException(400, "Search keyword cannot be empty...!");

            const searchArchitectData = await architect.findMany({
                where: {
                    architectName: { contains: search, mode: 'insensitive' }
                },
            });

            if (searchArchitectData.length == 0) throw new HttpException(400, "There is no architect with this name...!")
            return searchArchitectData;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }
}

export default ArchitectService;
