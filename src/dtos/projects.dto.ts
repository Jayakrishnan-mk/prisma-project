import { projectStatus } from '@/utils/global';
import { project_amenities, project_provider, project_type, construction_type, core_area, bank_name } from '@prisma/client';
import { IsNumber, IsBoolean, IsOptional, IsString, IsEnum, IsArray, IsNotEmpty, IsInt } from 'class-validator';
export class CreateProjectDto {
  @IsOptional()
  @IsString()
  public projectId: string;

  @IsString()
  @IsNotEmpty()
  public projectName: string;

  @IsOptional()
  public completionDate: any;

  @IsOptional()
  @IsEnum(project_type)
  public projectType: project_type;

  @IsOptional()
  @IsEnum(construction_type)
  public constructionType: construction_type

  @IsOptional()
  @IsNumber()
  public biddingAmount: number;

  @IsOptional()
  @IsString()
  public reraNumber: string;

  @IsOptional()
  @IsString()
  public place_id: string;

  @IsOptional()
  @IsString()
  public location_name: string;

  @IsOptional()
  @IsEnum(projectStatus)
  public projectStatus: number;

  @IsOptional()
  @IsString()
  public drProjectUrl: string;

  @IsArray()
  @IsOptional()
  public projectImages: Array<string>;

  @IsString()
  @IsOptional()
  public mainImage: string;

  @IsInt()
  @IsOptional()
  public salesNumber: number;

  @IsOptional()
  @IsEnum(project_amenities)
  public amenities: project_amenities;

  @IsOptional()
  @IsEnum(bank_name)
  public bankName: bank_name;

  @IsOptional()
  @IsNumber()
  public maxPotential: number;

  @IsString()
  @IsOptional()
  public brochure: string;

  @IsString()
  @IsOptional()
  public layoutImage: string;

  @IsString()
  @IsOptional()
  public shortDescription: string;

  @IsString()
  @IsOptional()
  public unitType: string;

  @IsOptional()
  @IsEnum(project_provider)
  public projectProviders: project_provider;

  @IsOptional()
  @IsNumber()
  public buildingSheets: number;

  @IsOptional()
  @IsNumber()
  public noOfUnits: number;

  @IsOptional()
  @IsNumber()
  public noOfBuilding: number;

  @IsOptional()
  @IsNumber()
  public wings: number;

  @IsOptional()
  @IsNumber()
  public noOfWings: number;

  @IsOptional()
  @IsNumber()
  public floor: number;

  @IsOptional()
  @IsNumber()
  public noOfFlats: number;

  @IsOptional()
  @IsNumber()
  public noOfShops: number;

  @IsOptional()
  @IsNumber()
  public noOfOffices: number;

  @IsOptional()
  @IsNumber()
  public noOfOuthouse: number;

  @IsOptional()
  @IsNumber()
  public noOfBungalows: number;

  @IsOptional()
  @IsNumber()
  public noOfPlots: number;

  @IsOptional()
  @IsNumber()
  public totalLandArea: number;

  @IsOptional()
  @IsString()
  public societyWebsite: string;

  @IsOptional()
  @IsString()
  public landDemarcation: string;

  @IsOptional()
  @IsString()
  public DocPertainingToLand: string;

  @IsOptional()
  @IsBoolean()
  public conveyance: boolean;

  @IsOptional()
  @IsString()
  public conveyanceDoc: string;

  @IsOptional()
  @IsString()
  public propertyCard: string;

  @IsOptional()
  @IsBoolean()
  public completionCertificate: boolean;

  @IsOptional()
  @IsString()
  public completionCertificateDoc: string;

  @IsOptional()
  public completionCertificateDate: any;

  @IsOptional()
  @IsBoolean()
  public Index2: boolean;

  @IsOptional()
  @IsString()
  public Index2Doc: string;

  @IsOptional()
  @IsNumber()
  public carpetArea: number;

  @IsOptional()
  @IsBoolean()
  public physicalMozni: boolean;

  @IsOptional()
  @IsString()
  public physicalMozniDoc: string;

  @IsOptional()
  @IsBoolean()
  public societyRegistration: boolean;

  @IsOptional()
  @IsString()
  public societyRegistrationDoc: string;

  @IsOptional()
  @IsBoolean()
  public naOrder: boolean;

  @IsOptional()
  @IsString()
  public naOrderDoc: string;

  @IsOptional()
  @IsBoolean()
  public sanctionPlan: boolean;

  @IsOptional()
  @IsString()
  public sanctionPlanDoc: string;

  @IsOptional()
  @IsBoolean()
  public commencementCertificate: boolean;

  @IsOptional()
  @IsString()
  public commencementCertificateDoc: string;

  @IsOptional()
  @IsBoolean()
  public conveyanceDeed: boolean;

  @IsOptional()
  @IsString()
  public conveyanceDeedDoc: string;

  @IsOptional()
  @IsBoolean()
  public previousDetail: boolean;

  @IsOptional()
  @IsString()
  public previousDetailDoc: string;

  @IsOptional()
  @IsBoolean()
  public previousOffer: boolean;

  @IsOptional()
  @IsString()
  public previousOfferDoc: string;

  @IsOptional()
  @IsString()
  public tod_zone_doc: string;

  @IsOptional()
  @IsString()
  public cczm_doc: string;

  @IsOptional()
  @IsBoolean()
  public previousMoU: boolean;

  @IsOptional()
  @IsString()
  public previousMoUDoc: string;

  @IsOptional()
  @IsString()
  public dpReport: string;

  @IsOptional()
  @IsString()
  public readyRateDoc: string;

  @IsOptional()
  @IsNumber()
  public readyReckonerRate: number;

  @IsOptional()
  @IsNumber()
  public readyLandValue: number;

  @IsOptional()
  @IsNumber()
  public readyResidentialValue: number;

  @IsOptional()
  @IsNumber()
  public readyShopValue: number;

  @IsOptional()
  @IsNumber()
  public readyIndustrialValue: number;

  @IsOptional()
  @IsNumber()
  public sanctionPlanArea: number;

  @IsOptional()
  @IsNumber()
  public frontRoad: number;

  @IsOptional()
  @IsNumber()
  public rightRoad: number;

  @IsOptional()
  @IsNumber()
  public leftRoad: number;

  @IsOptional()
  @IsNumber()
  public backRoad: number;

  @IsOptional()
  @IsBoolean()
  public developerProject : boolean;

  @IsOptional()
  @IsBoolean()
  public showCaseProject: boolean;

  @IsOptional()
  @IsBoolean()
  public isVerified: boolean;

  @IsArray()
  @IsOptional()
  public ownerId: Array<string>;

  @IsArray()
  @IsOptional()
  public initialDevId: Array<string>;

  @IsArray()
  @IsOptional()
  public redevelopDevId: Array<string>;

  @IsArray()
  @IsOptional()
  public architectId: Array<string>;

  @IsArray()
  @IsOptional()
  public lawyerId: Array<string>;

  @IsString()
  @IsOptional()
  public mozniId: string;

  @IsOptional()
  @IsInt()
  public noOfParking: number;

  @IsOptional()
  @IsInt()
  public commericalRent: number;

  @IsOptional()
  @IsInt()
  public residentialRent: number;

  @IsOptional()
  @IsBoolean()
  public TODApplicability: boolean;

  @IsOptional()
  @IsBoolean()
  public withinMunicipalLimits: boolean;

  @IsOptional()
  @IsEnum(core_area)
  public coreArea: core_area;

  @IsOptional()
  @IsNumber()
  public previousRoadWidening: number;

  @IsOptional()
  @IsNumber()
  public estimateAreaInRoadWidening: number;

  @IsOptional()
  @IsNumber()
  public widthOfAccessRoad: number;

  @IsOptional()
  @IsNumber()
  public loadingInYourArea: number;

  @IsOptional()
  public bhogvataPatraDate: any;

  @IsOptional()
  @IsNumber()
  public sactionPlanArea: number;

  @IsOptional()
  @IsInt()
  public constructionCost: number;

  @IsOptional()
  @IsInt()
  public parkingCost: number;

  @IsOptional()
  @IsInt()
  public rent: number;

  @IsOptional()
  @IsInt()
  public shifting: number;

  @IsOptional()
  @IsInt()
  public corpusFund: number;

  @IsOptional()
  @IsInt()
  public bettermentCharges: number;

  @IsOptional()
  @IsNumber()
  public interest: number;

  @IsOptional()
  @IsInt()
  public marketSaleRate: number;

  @IsOptional()
  @IsNumber()
  public developerProfit: number;
}

