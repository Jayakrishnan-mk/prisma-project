import { NextFunction, Request, Response } from 'express';
import MemberService from '@/services/members.service';
import { CreateMemberDto } from '@/dtos/members.dto';
import { member } from '@prisma/client';


class MembersController {
  public memberService = new MemberService();

  public createMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const memberData: CreateMemberDto = req.body;

      const createMemberData: member = await this.memberService.createMember(memberData);

      res.status(201).json({ message: 'Member Created Successfully...!', data: createMemberData });
    } catch (error) {
      next(error);
    }
  };

  public getMembers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const findAllMembersData: member[] = await this.memberService.findAllMember(req);

      res.status(200).json({ message: 'List of Members...!', data: findAllMembersData });

    } catch (error) {
      next(error);
    }
  };

  public getMemberById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const memberId = req.params.id;
      const findOneMemberData: member = await this.memberService.findMemberById(memberId);

      res.status(200).json({ message: 'Specific Member By ID...!', data: findOneMemberData });
    } catch (error) {
      next(error);
    }
  };

  public updateMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const memberId = req.params.id;
      const memberData: CreateMemberDto = req.body;
      const updateMemberData: member = await this.memberService.updateMember(memberId, memberData);

      res.status(200).json({ message: 'Updated Member By ID...!', data: updateMemberData });
    } catch (error) {
      next(error);
    }
  };

  public deleteMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const memberId = req.params.id;
      const deleteMemberData: member = await this.memberService.deleteMember(memberId);

      res.status(200).json({ message: 'Deleted Member By ID...!', data: deleteMemberData });
    } catch (error) {
      next(error);
    }
  };
}

export default MembersController;
