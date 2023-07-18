// import { VerificationTokens } from "@prisma/client";
// import axios from "axios";
// import { Router } from "express";

// import { http } from "winston";
// const router = Router();
// interface iVerificationService{
//      sendEmailToken(token:VerificationTokens):void;
//      sendPhoneToken(token:VerificationTokens):void;
// }
// const BuildEmailUrl=(token:VerificationTokens,baseUrl:string)=>{
//     console.log(`${baseUrl}/verifyEmail/${token.id}`);
    
//     return `${baseUrl}/verifyEmail/${token.id}`;

    
// }
// const BuildPhoneUrl=(token:VerificationTokens,baseUrl:string)=>{
//     console.log(`${baseUrl}/verifyPhone/${token.id}`);
    
//     return `${baseUrl}/verifyPhone/${token.id}`;
    
// }
// class DummyVerificationService implements iVerificationService{
//     baseUrl:string;
//     constructor(baseUrl){
//         this.baseUrl=baseUrl;
        
        
//     }
//     async sendEmailToken(token: VerificationTokens): Promise<void> {
//        const resp =  await axios.get(BuildEmailUrl(token,this.baseUrl));
//        console.log(resp.statusText);
       
//     }
//     async sendPhoneToken(token: VerificationTokens): Promise<void> {
//         const resp =  await axios.get(BuildPhoneUrl(token,this.baseUrl));
//        console.log(resp.statusText);
//     }

// }
// export default DummyVerificationService;