import { CreateMozniDto } from "@/dtos/mozni.dto";
import { HttpException } from "@/exceptions/HttpException";
import { geoCoding, mobileValidation, passwordGenerator } from "@/utils/util";
import { mozni, PrismaClient } from "@prisma/client";
import { isEmpty } from "class-validator";

const mozni = new PrismaClient().mozni;
const user = new PrismaClient().user;

class MozniService {

    public async createMozni(mozniData: CreateMozniDto): Promise<mozni> {
        try {
            let locationData: any = {};
            locationData.place_id = mozniData.place_id;

            const mobileNumber = mozniData.mobile.toString();

            if (mobileNumber.length !== 10) {
                throw new HttpException(400, "Mobile number is not valid...!");
            }

            const mobile = Number(mobileNumber);

            if (!locationData.place_id) {
                throw new HttpException(400, "Provide place_id for address...!");
            }

            if (mozniData.location_name) {
                locationData.location_name = mozniData.location_name;
            }
            else {
                locationData.location_name = `mozni ${mozniData.name}'s Location`;
            }

            const findMozni: mozni = await mozni.findFirst({ where: { mobile } });
            if (findMozni) throw new HttpException(400, `Your mobile number ${mobile} already exist...!`);

            delete mozniData.place_id;
            delete mozniData.location_name;

            let addressData = await geoCoding(locationData);

            const createMozniData: mozni = await mozni.create({
                data: { ...mozniData }
            });

            await mozni.update({
                where: { mozniId: createMozniData.mozniId },
                data: {
                    address: {
                        connect: [{
                            addressId: addressData.addressId
                        }]
                    },
                }
            })

            const returnData = await mozni.findFirst({
                where: {
                    mozniId: createMozniData.mozniId
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

    public async findAllMozni(req: any): Promise<mozni[]> {
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

            const count = await mozni.count({
                where:
                    { isDeleted: false }
            });

            let allMozni;

            if (!sortBy) {
                allMozni = (await mozni.findMany({
                    include: {
                        address: true,
                        project: true
                    },
                })).sort(
                    (mozni1: any, mozni2: any): any => {
                        return (new Date(mozni2["updatedAt"]) as any) - (new Date(mozni1["updatedAt"]) as any)
                    }
                )

                let requiredData = allMozni.filter(mozni => !mozni.isDeleted);

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
                data.allMozni = actualData;
                return data;
            }
            else {

                allMozni = (await mozni.findMany({
                    include: {
                        address: true,
                        project: true
                    },
                })).sort(
                    (mozni1: any, mozni2: any): any => {
                        if (sortBy == "name") {
                            if (order == 'asc') {
                                return mozni1[sortBy].toLowerCase().localeCompare(mozni2[sortBy].toLowerCase());
                            }
                            else {
                                return mozni2[sortBy].toLowerCase().localeCompare(mozni1[sortBy].toLowerCase());
                            }
                        }
                        // else if (sortBy == "address") {
                        //     if (order == 'desc') {
                        //         return (new Date(mozni2[sortBy]) as any) - (new Date(mozni1[sortBy]) as any)
                        //     }
                        //     else {
                        //         return (new Date(mozni1[sortBy]) as any) - (new Date(mozni2[sortBy]) as any)
                        //     }
                        // }
                    }
                )

                let requiredData = allMozni.filter(mozni => !mozni.isDeleted);

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
                data.allMozni = actualData;
                return data;
            }
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    public async findMozniById(mozniId: string): Promise<mozni> {
        try {
            const findMozni: mozni = await mozni.findUnique({
                where: { mozniId },
                include: {
                    address: true,
                    project: true
                }
            });

            if (!findMozni) throw new HttpException(400, "This Mozni  ID doesn't exist...!");
            return findMozni;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    public async findMozniByName(mozniName: string): Promise<mozni[]> {
        try {
            const findMozni: mozni[] = await mozni.findMany({
                where: {
                    AND: [{
                        name: {
                            contains: mozniName,
                            mode: 'insensitive'
                        }
                    },
                    {
                        isDeleted: false
                    }]
                },
                include: {
                    address: true,
                    project: true
                }
            });
            if (!findMozni) throw new HttpException(400, "This Mozni NAME doesn't exist...!");
            return findMozni;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    public async updateMozni(mozniId: string, mozniData: CreateMozniDto): Promise<mozni> {
        try {
            if (isEmpty(mozniData)) throw new HttpException(400, "Mozni data cannot be empty...!");

            const findMozni: mozni = await mozni.findUnique({ where: { mozniId } });
            if (!findMozni) throw new HttpException(400, "This mozni ID doesn't exist...!");

            await mobileValidation(mozniData, findMozni);

            let newMozniData: any = {}
            newMozniData.place_id = mozniData.place_id;

            if (mozniData.location_name) {
                newMozniData.location_name = mozniData.location_name;
            }
            else {
                newMozniData.location_name = "mozniLocation";
            }

            if (mozniData.place_id) {
                let addressData = await geoCoding(newMozniData);

                await mozni.update({
                    where: { mozniId },
                    data: {
                        address: {
                            connect: [{
                                addressId: addressData.addressId
                            }]
                        },
                    }
                });
            }

            delete mozniData.place_id
            delete mozniData.location_name

            const updateMozniData = await mozni.update({
                where: { mozniId },
                data: { ...mozniData }
            });

            return updateMozniData;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    public async deleteMozni(mozniId: string): Promise<mozni> {
        try {
            if (isEmpty(mozniId)) throw new HttpException(400, "Mozni data cannot be empty...!");

            const deleteMozniData: mozni = await mozni.update({
                where: { mozniId },
                data: { isDeleted: true }
            });
            if (!deleteMozniData) throw new HttpException(400, "Mozni data doesn't exist...!");

            return deleteMozniData;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    public async searchMozni(search: string): Promise<mozni[]> {
        try {
            if (isEmpty(search)) throw new HttpException(400, "Search cannot be empty...!");

            const searchMozniData = await mozni.findMany({
                where: {
                    OR: [
                        {
                            name: { contains: search, mode: 'insensitive' }
                        },
                        // {
                        //     mobile: { contains: search, mode: 'insensitive' }
                        // },
                    ],
                },
            });

            if (searchMozniData.length == 0) throw new HttpException(400, "There is no mozni with this name...!")
            return searchMozniData;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }
}

export default MozniService;
