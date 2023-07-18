import { CreateMemberDto } from "@/dtos/members.dto";
import { HttpException } from "@/exceptions/HttpException";
import { member, PrismaClient } from "@prisma/client";
import { isEmpty } from "class-validator";
import { Request } from 'express';

const Member = new PrismaClient().member;
class MemberService {

    public async createMember(memberData: CreateMemberDto): Promise<member> {
        try {
            const createMemberData: member = await Member.create({ data: { ...memberData } });
            return createMemberData;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    public async findAllMember(req: any): Promise<member[]> {
        try {
            let skip = (parseInt(req.query.pageNumber) - 1) * parseInt(req.query.pageSize);
            let take = parseInt(req.query.pageSize);

            const obj = {
                skip, take,
                where: { isDeleted: false },
            }

            const count = await Member.count({
                where:
                    { isDeleted: false }
            });

            if (!req.query.pageSize && !req.query.pageNumber) {
                delete obj.skip;
                delete obj.take;
            }

            const allMember: member[] = await Member.findMany(obj);
            let data: any = {};
            data.count = count;
            data.allMember = allMember;
            return data;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    public async findMemberById(memberId: string): Promise<member> {
        try {
            const findMember: member = await Member.findUnique({ where: { memberId } });

            if (!findMember) throw new HttpException(400, "This Member ID doesn't exist...!");
            return findMember;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    public async updateMember(memberId: string, memberData: CreateMemberDto): Promise<member> {
        try {
            if (isEmpty(memberData)) throw new HttpException(400, "Member data cannot be empty...!");

            const findMember: member = await Member.findUnique({ where: { memberId } });
            if (!findMember) throw new HttpException(400, "This member ID doesn't exist...!");

            const updateMemberData = await Member.update({ where: { memberId }, data: { ...memberData } });
            return updateMemberData;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    public async deleteMember(memberId: string): Promise<member> {
        try {
            if (isEmpty(memberId)) throw new HttpException(400, "Member data cannot be empty...!");

            const deleteMemberData: member = await Member.update({
                where: { memberId },
                data: {
                    isDeleted: true,
                    developerId: null
                },
            });

            if (!deleteMemberData) throw new HttpException(400, "This member data doesn't exist...!");

            return deleteMemberData;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }
}

export default MemberService;
