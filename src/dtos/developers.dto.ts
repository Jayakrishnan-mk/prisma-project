import { IsArray, IsBoolean, IsEmail, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
export class CreateDeveloperDto {
    @IsOptional()
    @IsString()
    public developerId: string;

    @IsNotEmpty()
    @IsString()
    public name: string;

    @IsNotEmpty()
    @IsEmail()
    public email: string;

    @IsOptional()
    @IsEmail()
    public email2: string;

    @IsOptional()
    @IsEmail()
    public email3: string;

    @IsNotEmpty()
    @IsInt()
    public mobile: number;

    @IsOptional()
    @IsInt()
    public mobile2: number;

    @IsOptional()
    @IsInt()
    public mobile3: number;

    @IsOptional()
    @IsString()
    public place_id: string;

    @IsOptional()
    @IsString()
    public location_name: string;

    @IsOptional()
    @IsString()
    public brochure: string;
    
    @IsOptional()
    @IsString()
    public companyLogo: string;

    @IsOptional()
    @IsString()
    public image: string;

    @IsNotEmpty()
    @IsString()
    public description: string;

    @IsOptional()
    @IsInt()
    public completedProjects: number;

    @IsOptional()
    @IsInt()
    public ongoingProjects: number;

    @IsOptional()
    @IsInt()
    public upcommingProjects: number;

    @IsOptional()
    @IsInt()
    public establishedYear: number;
    
    @IsOptional()
    @IsArray()
    public initialProjectId: Array<string>;
    
    @IsOptional()
    @IsArray()
    public redevelopProjectId: Array<string>;

    @IsOptional()
    @IsString()
    public website: string;

    @IsOptional()
    @IsInt()
    public contactUs: number;

    @IsOptional()
    @IsBoolean()
    public onlinePayment: boolean;

    @IsOptional()
    @IsBoolean()
    public adminOffline: boolean;
    
    @IsOptional()
    @IsString()
    public subscriptionDetails: any;

    @IsOptional()
    @IsString()
    public drDeveloperUrl: string;

    @IsOptional()
    @IsBoolean()
    public verified: boolean;

    @IsOptional()
    @IsString()
    public userId: string;
}