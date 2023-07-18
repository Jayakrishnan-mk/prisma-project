import { CreateLawyerDto } from "@/dtos/lawyer.dto";
import { HttpException } from "@/exceptions/HttpException";
import { checkVerified, geoCoding, isEmpty, mobileValidation, passwordGenerator, urlCreation } from "@/utils/util";
import { lawyer, PrismaClient } from "@prisma/client";

const lawyer = new PrismaClient().lawyer;
const user = new PrismaClient().user;
const project = new PrismaClient().project;
class lawyerService {

    public async createLawyer(lawyerData: CreateLawyerDto): Promise<lawyer> {
        try {
            let locationData: any = {};
            locationData.place_id = lawyerData.place_id;
            locationData.location_name = lawyerData.location_name;

            const mobileNumber = lawyerData.mobile.toString();
            if (mobileNumber.length !== 10) {
                throw new HttpException(400, "Mobile number is not valid...!");
            }
            const mobile = Number(mobileNumber)

            const findLawyer: lawyer = await lawyer.findFirst({ where: { mobile } });
            if (findLawyer) throw new HttpException(400, `Your lawyer mobile number ${lawyerData.mobile} already exist...!`);

            delete lawyerData.place_id
            delete lawyerData.location_name

            let addressData = await geoCoding(locationData);

            let drLawyerUrl = await urlCreation(addressData, lawyerData);

            const uniqueProjectIds: Array<string> = Array.from(new Set(lawyerData.projectId));

            const createLawyerData: lawyer = await lawyer.create({
                data: {
                    ...lawyerData,
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
                    lawyerId: {
                        push: createLawyerData.lawyerId
                    }
                }
            });

            /////////////////////////////////////////////
            let password = await passwordGenerator();

            const mobileExists = await user.findFirst({
                where: { mobile }
            });

            if (mobileExists) {
                await user.update({
                    where: { mobile },
                    data: {
                        lawyerId: createLawyerData.lawyerId
                    }
                })
            }
            else {
                await user.create({
                    data: {
                        emailId: createLawyerData.email,
                        password,
                        mobile: createLawyerData.mobile,
                        lawyerId: createLawyerData.lawyerId
                    }
                })
            }

            await checkVerified(createLawyerData, drLawyerUrl);

            const returnData = await lawyer.findFirst({
                where: {
                    lawyerId: createLawyerData.lawyerId
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

    public async findAllLawyer(req: any): Promise<lawyer[]> {
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

            const count = await lawyer.count({
                where:
                    { isDeleted: false }
            });

            let allLawyer;

            if (!sortBy) {
                allLawyer = (await lawyer.findMany({
                    include: {
                        address: true,
                        project: {
                            include: {
                                address: true
                            }
                        },
                    },
                })).sort(
                    (lawyer1: any, lawyer2: any): any => {
                        return (new Date(lawyer2["updatedAt"]) as any) - (new Date(lawyer1["updatedAt"]) as any)
                    }
                )

                let requiredData = allLawyer.filter(lawyer => !lawyer.isDeleted);

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
                data.allLawyer = actualData;
                return data;

            }
            else {
                allLawyer = (await lawyer.findMany({
                    include: {
                        address: true,
                        project: {
                            include: {
                                address: true
                            }
                        },
                    },
                })).sort(
                    (lawyer1: any, lawyer2: any): any => {
                        if (sortBy == "updatedAt") {
                            if (order == 'desc') {
                                return (new Date(lawyer2[sortBy]) as any) - (new Date(lawyer1[sortBy]) as any)
                            }
                            else {
                                return (new Date(lawyer1[sortBy]) as any) - (new Date(lawyer2[sortBy]) as any)
                            }
                        }
                        else if (sortBy == "lawyerName") {
                            if (order == 'asc') {
                                return lawyer1[sortBy].toLowerCase().localeCompare(lawyer2[sortBy].toLowerCase());
                            }
                            else {
                                return lawyer2[sortBy].toLowerCase().localeCompare(lawyer1[sortBy].toLowerCase());
                            }
                        }
                        else {         /* ....verified status checking....... */
                            if (order == 'asc') {
                                return Number(lawyer1[sortBy]) - Number(lawyer2[sortBy])
                            }
                            else {
                                return Number(lawyer2[sortBy]) - Number(lawyer1[sortBy])
                            }
                        }
                    }
                );

                let requiredData = allLawyer.filter(lawyer => !lawyer.isDeleted);

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
                data.allLawyer = actualData;
                return data;
            }
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    public async findLawyerById(lawyerId: string): Promise<lawyer> {
        try {
            const findLawyer: lawyer = await lawyer.findUnique({
                where: { lawyerId },
                include: {
                    address: true,
                    project: {
                        include: {
                            address: true
                        }
                    },
                }
            });

            if (!findLawyer) throw new HttpException(400, "This Lawyer ID doesn't exist...!");
            return findLawyer;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    public async findLawyerByUrl(drLawyerUrl: string): Promise<lawyer> {
        try {
            const findLawyer: lawyer = await lawyer.findFirst({
                where: { drLawyerUrl },
                include: {
                    address: true,
                    project: {
                        include: {
                            address: true
                        }
                    },
                }
            });
            if (!findLawyer) throw new HttpException(400, "This Lawyer URL doesn't exist...!");
            return findLawyer;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    public async findLawyerByName(lawyerName: string): Promise<lawyer[]> {
        try {
            const findLawyer: lawyer[] = await lawyer.findMany({
                where: {
                    AND: [{
                        lawyerName: {
                            contains: lawyerName,
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
            if (!findLawyer) throw new HttpException(400, "This Lawyer NAME doesn't exist...!");
            return findLawyer;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    public async updateLawyer(lawyerId: string, lawyerData: CreateLawyerDto): Promise<lawyer> {
        try {
            if (isEmpty(lawyerData)) throw new HttpException(400, "Lawyer data cannot be empty...!");

            const findLawyer: lawyer = await lawyer.findUnique({ where: { lawyerId: lawyerId } });
            if (!findLawyer) throw new HttpException(400, "This lawyer ID doesn't exist...!");

            await mobileValidation(lawyerData, findLawyer);

            let newLawyerData: any = {}
            newLawyerData.place_id = lawyerData.place_id;
            newLawyerData.location_name = lawyerData.location_name;
            newLawyerData.architectId = lawyerData;

            if (lawyerData.verified) {
                if (!lawyerData.place_id) {
                    throw new HttpException(400, "Provide the place_id and name...!")
                }
            }

            if (lawyerData.place_id) {
                let addressData = await geoCoding(newLawyerData);
                let url;

                // if lawyer name has no changes, then name in the url has no change. logic...
                if (lawyerData.lawyerName == findLawyer.lawyerName || !lawyerData.lawyerName) {
                    if (findLawyer.verified == true || lawyerData.verified == true) {
                        url = await urlCreation(addressData, findLawyer)
                    }
                    else {
                        url = null;
                    }
                }
                // if lawyerName also changed, condition...
                else if (findLawyer.lawyerName !== lawyerData.lawyerName) {
                    findLawyer.lawyerName = lawyerData.lawyerName;
                    if (findLawyer.verified == true || lawyerData.verified == true) {
                        url = await urlCreation(addressData, findLawyer)
                    }
                    else {
                        url = null;
                    }
                }

                await lawyer.update({
                    where: { lawyerId },
                    data: {
                        address: {
                            connect: [{
                                addressId: addressData.addressId
                            }]
                        },
                        drLawyerUrl: url
                    }
                });
            }

            // if you want to change the name and you want to autogenerate the new drUrl, then you need to send the place_id and location_name also. That's mandatory.
            else if (lawyerData.lawyerName) {
                if (!newLawyerData.place_id) throw new HttpException(400, "Please mention the place_id , when you're changing the name! It'll affect your autogenerated drUrl id...!");
            }

            delete lawyerData.place_id
            delete lawyerData.location_name

            const uniqueProjectIds: Array<string> = Array.from(new Set(lawyerData.projectId));

            const updateLawyerData = await lawyer.update({
                where: { lawyerId: lawyerId },
                data: {
                    ...lawyerData,
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
                    lawyerId: {
                        push: updateLawyerData.lawyerId
                    }
                }
            })

            return updateLawyerData;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    public async deleteLawyer(lawyerId: string): Promise<lawyer> {
        try {
            if (isEmpty(lawyerId)) throw new HttpException(400, "Lawyer data cannot be empty...!");

            const deleteLawyerData: lawyer = await lawyer.update({
                where: { lawyerId: lawyerId },
                data: { isDeleted: true }
            });
            if (!deleteLawyerData) throw new HttpException(400, "This Lawyer ID doesn't exist...!");

            return deleteLawyerData;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    public async searchLawyer(search: string): Promise<lawyer[]> {
        try {
            if (isEmpty(search)) throw new HttpException(400, "Search cannot be empty...!");

            const searchLawyerData = await lawyer.findMany({
                where: {
                    lawyerName: { contains: search, mode: 'insensitive' }
                },
            });

            if (searchLawyerData.length == 0) throw new HttpException(400, "There is no lawyer with this name...!")
            return searchLawyerData;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }
}

export default lawyerService;
