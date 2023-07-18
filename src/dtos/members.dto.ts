import { IsArray, IsInt, IsOptional, IsString } from 'class-validator';
export class CreateMemberDto {
    @IsOptional()
    @IsString()
    public memberId: string;
    
    @IsOptional()
    @IsString()
    public name: string;
    
    @IsOptional()
    @IsString()
    public designation: string;

    @IsOptional()
    @IsString()
    public qualification: string;

    @IsOptional()
    @IsInt()
    public experience: number;
    
    @IsOptional()
    @IsArray()
    public images: Array<string>;
    
    @IsOptional()   
    @IsString()
    public description: string;
    
    @IsOptional()
    @IsString()
    public developerId: string;
}