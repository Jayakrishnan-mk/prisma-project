import { IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateMozniDto {
    @IsOptional()
    @IsString()
    public mozniId: string;

    @IsNotEmpty()
    @IsString()
    public name: string;

    @IsNotEmpty()
    @IsInt()
    public mobile: number;

    @IsOptional()
    @IsString()
    public profilePhoto: string;

    @IsOptional()
    @IsString()
    public place_id: string;

    @IsOptional()
    @IsString()
    public location_name: string;

    @IsString()
    @IsOptional()
    public userId: string;
}