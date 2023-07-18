import { HttpException } from "@/exceptions/HttpException";
import { address, PrismaClient, project_stages } from "@prisma/client";
import jwt from 'jsonwebtoken';

const { otp } = new PrismaClient();
const Address = new PrismaClient().address;
const Developer = new PrismaClient().developer;
const project = new PrismaClient().project;
const architect = new PrismaClient().architect;
const lawyer = new PrismaClient().lawyer;
const mozni = new PrismaClient().mozni;
const owner = new PrismaClient().owner;
const user = new PrismaClient().user;

let unirest = require('unirest');

/**
 * @method isEmpty
 * @param {String | Number | Object} value
 * @returns {Boolean} true & false
 * @description this value is Empty Check
 */

export const generateOTP = (): any => {
  var val = Math.floor(1000 + Math.random() * 9000);
  return val
};

export const sendOtp = async (mobile: number, otpString: string): Promise<any> => {
  const checkSameNumber = await otp.findFirst({
    where: { mobile }
  })
  if (checkSameNumber) {
    await otp.update({
      where: {
        mobile
      },
      data: {
        otp: otpString.toString(),
        createdAt: new Date()
      }
    })
  }
  else {
    await otp.create({
      data: {
        mobile,
        otp: otpString.toString(),
        verified: false,
      },
    });
  }
}

export const passwordGenerator = async (): Promise<any> => {
  let password = '';
  let str = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' +
    'abcdefghijklmnopqrstuvwxyz0123456789@#$';

  for (let i = 1; i <= 8; i++) {
    let char = Math.floor(Math.random()
      * str.length + 1);

    password += str.charAt(char)
  }
  return password;
}


let accessTokenValidity: string = "24h";
function jwtTokenGenerator(payload: any, expiresIn: string): string {

  return jwt.sign(payload as Object, `${process.env.JWT_PWD}`, { expiresIn } as Object);
}
export const getAccessToken = (payload: any, type: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (type == "adminLogin" && payload.hasOwnProperty('emailId')) {

      resolve(jwtTokenGenerator(payload, accessTokenValidity));
    }
    else if (type == "adminDev" && payload.hasOwnProperty('mobile')) {
      resolve(jwtTokenGenerator(payload, accessTokenValidity));
    }
    else if (type == "userLogin" && payload.hasOwnProperty('mobile')) {
      resolve(jwtTokenGenerator(payload, accessTokenValidity));
    }
    else if (type == "userLoginWithEmail" && payload.hasOwnProperty('email')) {
      resolve(jwtTokenGenerator(payload, accessTokenValidity));
    }
    else {
      reject("Error Occured");
    }
  })
}


export const isEmpty = (value: string | number | object): boolean => {
  if (value === null) {
    return true;
  } else if (typeof value !== 'number' && value === '') {
    return true;
  } else if (typeof value === 'undefined' || value === undefined) {
    return true;
  } else if (value !== null && typeof value === 'object' && !Object.keys(value).length) {
    return true;
  } else {
    return false;
  }
};


export const checkWebsiteValidation = (website: any): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    if (
      !website.includes(".com") &&
      !website.includes(".in") &&
      !website.includes(".net")
    ) {
      resolve(false);
    }
    resolve(true);
  })
}


export async function geoCoding(data: any) {

  let addressData;
  let location_name;

  if (data.location_name) {
    location_name = data.location_name;
  }

  const place_id = data.place_id;
  const apiKey = process.env.GOOGLE_API_KEY;

  let findAddress;
  if (place_id) {
    findAddress = await Address.findFirst({ where: { place_id } });
  }

  if (!data.location_name) {
    throw new HttpException(400, "Please send the location name also when you are updating the place id!");
  }

  if (findAddress) {
    return findAddress;
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?place_id=${place_id}&key=${apiKey}`;

  let administrative_area_level_1;
  let country;
  let postal_code;
  let locality;
  let sublocality;

  let address = await unirest.get(url)
    .headers({
      Accept: "application/json",
      "Content-Type": "application/json",
    })
    .then((response) => {
      const address_components = response.body.results[0].address_components;

      const requiredData = address_components.map(component => {
        if (component.types.includes('country')) {
          return {
            country: component.long_name
          };
        }
        else if (component.types.includes('postal_code')) {
          return {
            postal_code: component.long_name
          };
        }
        else if (component.types.includes('administrative_area_level_3')) {
          return {
            administrative_area_level_3: component.long_name
          };
        }
        else if (component.types.includes('locality')) {
          return {
            locality: component.long_name
          };
        }
        else if (component.types.includes('sublocality_level_1')) {
          return {
            sublocality1: component.long_name
          };
        }
        else if (component.types.includes('sublocality_level_2')) {
          return {
            sublocality2: component.long_name
          };
        }
      })

      for (let component of requiredData) {
        if (component !== undefined) {
          if (component.administrative_area_level_3) {
            administrative_area_level_1 = component.administrative_area_level_3 ? component.administrative_area_level_3 : '';
          }
          else if (component.country) {
            country = component.country ? component.country : '';
          }
          else if (component.postal_code) {
            postal_code = component.postal_code ? component.postal_code : '';
          }
          else if (component.locality) {
            locality = component.locality ? component.locality : '';
          }
          else if (component.sublocality1) {
            sublocality = component.sublocality1 ? component.sublocality1 : '';
          }
          else if (component.sublocality2) {
            sublocality = component.sublocality2 ? component.sublocality2 : '';
          }
          else {
            sublocality = locality + "-" + "main";
          }
        }
      }
      return response.body.results[0];
    });

  if (!administrative_area_level_1 || !postal_code) {
    throw new HttpException(400, "Something went wrong in geo location, please select the exact location!")
  }

  if (sublocality == null || sublocality == "-main" || sublocality == undefined) {
    sublocality = administrative_area_level_1 + "-" + "main";
  }

  const code = Number(postal_code);

  if (location_name == "mozniLocation") {
    location_name = administrative_area_level_1 + "-" + "main";
  }

  addressData = {
    formatted_address: address.formatted_address,
    administrative_area_level_1,
    country,
    geometry: address.geometry,
    postal_code: code,
    locality: locality || null,
    sublocality,
    location_name,
    place_id,
    lat: address.geometry.location.lat,
    lng: address.geometry.location.lng
  };

  const createAddress: address = await Address.create({ data: addressData })
  return createAddress;
}


export async function urlCreation(address: any, data: any) {

  let name;

  // const baseUrl = "https://devapi.dreamsredeveloped.com";

  let { locality, sublocality, administrative_area_level_1 } = address;

  //when developer comes...
  if (data.name) {
    name = data.name;
  }
  else if (data.projectName) {
    name = data.projectName;
  }
  else if (data.architectName) {
    name = data.architectName;
  }
  else if (data.lawyerName) {
    name = data.lawyerName;
  }

  if (!locality) {
    locality = administrative_area_level_1;
  }

  const splitName = name.split(' ').join('-');

  const drUrl: string = `${locality}-${sublocality}-${splitName}`;
  const splittedUrl: string = drUrl.toLowerCase();

  return splittedUrl;
}


export async function checkVerified(data: any, url: string) {

  if (data.developerId) {
    if (data.verified == true) {
      await Developer.update({
        where: { developerId: data.developerId },
        data: { drDeveloperUrl: url }
      })
    }
  }
  else if (data.projectId) {
    if (data.isVerified == true) {
      await project.update({
        where: { projectId: data.projectId },
        data: { drProjectUrl: url }
      })
    }
    if (data.developerProject == true) {
      await project.update({
        where: { projectId: data.projectId },
        data: { drProjectUrl: url }
      })
    }
  }
  if (data.architectId) {
    if (data.verified == true) {
      await architect.update({
        where: { architectId: data.architectId },
        data: { drArchitectUrl: url }
      })
    }
  }
  else if (data.lawyerId) {
    if (data.verified == true) {
      await lawyer.update({
        where: { lawyerId: data.lawyerId },
        data: { drLawyerUrl: url }
      })
    }
  }
}


export async function mobileValidation(data: any, findData: any) {

  if (data.mobile) {
    if (findData.mobile !== data.mobile) {

      const mobileNumber = data.mobile.toString();
      if (mobileNumber.length !== 10) {
        throw new HttpException(400, `Mobile number is not valid!`);
      }

      if (findData.developerId) {
        const mobileExists = await Developer.findFirst({ where: { mobile: data.mobile } })
        if (mobileExists) throw new HttpException(400, "This mobile number already used!");
      }
      else if (findData.architectId) {
        const mobileExists = await architect.findFirst({ where: { mobile: data.mobile } })
        if (mobileExists) throw new HttpException(400, "This mobile number already used!");
      }
      else if (findData.lawyerId) {
        const mobileExists = await lawyer.findFirst({ where: { mobile: data.mobile } })
        if (mobileExists) throw new HttpException(400, "This mobile number already used!");
      }
      else if (findData.mozniId) {
        const mobileExists = await mozni.findFirst({ where: { mobile: data.mobile } })
        if (mobileExists) throw new HttpException(400, "This mobile number already used!");
      }
      else if (findData.ownerId) {
        const mobileExists = await owner.findFirst({ where: { mobile: data.mobile } })
        if (mobileExists) throw new HttpException(400, "This mobile number already used!");
      }
      else if (findData.userId) {
        const mobileExists = await user.findFirst({ where: { mobile: data.mobile } })
        if (mobileExists) throw new HttpException(400, "This mobile number already used!");
      }
    }
  }
}

export async function checkStageUpdates(currentStage: any, toStage: any, projectId: any) {
  return new Promise((resolve, reject) => {
    try {
      if (currentStage == project_stages.creation) {
        switch (toStage) {
          case project_stages.creation:
            throw new HttpException(400, "Cannot update stage from creation to creation");
            break;
          case project_stages.onboarding:
            break;
          case project_stages.verified:
            throw new HttpException(400, "Cannot update stage from creation to verified");
            break;
          case project_stages.feasibility:
            throw new HttpException(400, "Cannot update stage from creation to feasibility");
            break;
          case project_stages.diligence:
            throw new HttpException(400, "Cannot update stage from creation to diligence");
            break;
          case project_stages.bidding:
            throw new HttpException(400, "Cannot update stage from creation to bidding");
            break;
          case project_stages.finalization:
            throw new HttpException(400, "Cannot update stage from creation to finalization");
            break;
          case project_stages.agreement:
            throw new HttpException(400, "Cannot update stage from creation to agreement");
            break;
          case project_stages.postcompletion:
            throw new HttpException(400, "Cannot update stage from creation to postcompletion");
            break;
        }
      }

      if (currentStage == project_stages.onboarding) {
        switch (toStage) {
          case project_stages.creation:
            throw new HttpException(400, "Cannot update stage from onboarding to creation");
            break;
          case project_stages.onboarding:
            throw new HttpException(400, "Cannot update stage from onboarding to onboarding");
            break;
          case project_stages.verified:
            break;
          case project_stages.feasibility:
            throw new HttpException(400, "Cannot update stage from onboarding to feasibility");
            break;
          case project_stages.diligence:
            throw new HttpException(400, "Cannot update stage from onboarding to diligence");
            break;
          case project_stages.bidding:
            throw new HttpException(400, "Cannot update stage from onboarding to bidding");
            break;
          case project_stages.finalization:
            throw new HttpException(400, "Cannot update stage from onboarding to finalization");
            break;
          case project_stages.agreement:
            throw new HttpException(400, "Cannot update stage from onboarding to agreement");
            break;
          case project_stages.postcompletion:
            throw new HttpException(400, "Cannot update stage from onboarding to postcompletion");
            break;
        }
      }

      if (currentStage == project_stages.verified) {
        switch (toStage) {
          case project_stages.creation:
            throw new HttpException(400, "Cannot update stage from verified to creation");
            break;
          case project_stages.onboarding:
            throw new HttpException(400, "Cannot update stage from verified to onboarding");
            break;
          case project_stages.verified:
            throw new HttpException(400, "Cannot update stage from verified to verified");
            break;
          case project_stages.feasibility:
            break;
          case project_stages.diligence:
            throw new HttpException(400, "Cannot update stage from verified to diligence");
            break;
          case project_stages.bidding:
            throw new HttpException(400, "Cannot update stage from verified to bidding");
            break;
          case project_stages.finalization:
            throw new HttpException(400, "Cannot update stage from verified to finalization");
            break;
          case project_stages.agreement:
            throw new HttpException(400, "Cannot update stage from verified to agreement");
            break;
          case project_stages.postcompletion:
            throw new HttpException(400, "Cannot update stage from verified to postcompletion");
            break;
        }
      }

      if (currentStage == project_stages.feasibility) {
        switch (toStage) {
          case project_stages.creation:
            throw new HttpException(400, "Cannot update stage from feasibility to creation");
            break;
          case project_stages.onboarding:
            throw new HttpException(400, "Cannot update stage from feasibility to onboarding");
            break;
          case project_stages.verified:
            throw new HttpException(400, "Cannot update stage from feasibility to verified");
            break;
          case project_stages.feasibility:
            throw new HttpException(400, "Cannot update stage from feasibility to feasibility");
            break;
          case project_stages.diligence:
            break;
          case project_stages.bidding:
            throw new HttpException(400, "Cannot update stage from feasibility to bidding");
            break;
          case project_stages.finalization:
            throw new HttpException(400, "Cannot update stage from feasibility to finalization");
            break;
          case project_stages.agreement:
            throw new HttpException(400, "Cannot update stage from feasibility to agreement");
            break;
          case project_stages.postcompletion:
            throw new HttpException(400, "Cannot update stage from feasibility to postcompletion");
            break;
        }
      }

      if (currentStage == project_stages.diligence) {
        switch (toStage) {
          case project_stages.creation:
            throw new HttpException(400, "Cannot update stage from diligence to creation");
            break;
          case project_stages.onboarding:
            throw new HttpException(400, "Cannot update stage from diligence to onboarding");
            break;
          case project_stages.verified:
            throw new HttpException(400, "Cannot update stage from diligence to verified");
            break;
          case project_stages.feasibility:
            throw new HttpException(400, "Cannot update stage from diligence to feasibility");
            break;
          case project_stages.diligence:
            throw new HttpException(400, "Cannot update stage from diligence to diligence");
            break;
          case project_stages.bidding:
            break;
          case project_stages.finalization:
            throw new HttpException(400, "Cannot update stage from diligence to finalization‰");
            break;
          case project_stages.agreement:
            throw new HttpException(400, "Cannot update stage from diligence to agreement");
            break;
          case project_stages.postcompletion:
            throw new HttpException(400, "Cannot update stage from diligence to postcompletion");
            break;
        }
      }

      if (currentStage == project_stages.bidding) {
        switch (toStage) {
          case project_stages.creation:
            throw new HttpException(400, "Cannot update stage from bidding to creation");
            break;
          case project_stages.onboarding:
            throw new HttpException(400, "Cannot update stage from bidding to onboarding");
            break;
          case project_stages.verified:
            throw new HttpException(400, "Cannot update stage from bidding to verified");
            break;
          case project_stages.feasibility:
            throw new HttpException(400, "Cannot update stage from bidding to feasibility");
            break;
          case project_stages.diligence:
            throw new HttpException(400, "Cannot update stage from bidding to diligence");
            break;
          case project_stages.bidding:
            throw new HttpException(400, "Cannot update stage from bidding to bidding");
            break;
          case project_stages.finalization:
            break;
          case project_stages.agreement:
            throw new HttpException(400, "Cannot update stage from bidding to agreement");
            break;
          case project_stages.postcompletion:
            throw new HttpException(400, "Cannot update stage from bidding to postcompletion");
            break;
        }
      }

      if (currentStage == project_stages.finalization) {
        switch (toStage) {
          case project_stages.creation:
            throw new HttpException(400, "Cannot update stage from finalization to creation");
            break;
          case project_stages.onboarding:
            throw new HttpException(400, "Cannot update stage from finalization to onboarding");
            break;
          case project_stages.verified:
            throw new HttpException(400, "Cannot update stage from finalization to verified");
            break;
          case project_stages.feasibility:
            throw new HttpException(400, "Cannot update stage from finalization to feasibility");
            break;
          case project_stages.diligence:
            throw new HttpException(400, "Cannot update stage from finalization to diligence");
            break;
          case project_stages.bidding:
            throw new HttpException(400, "Cannot update stage from finalization to bidding");
            break;
          case project_stages.finalization:
            throw new HttpException(400, "Cannot update stage from finalization to finalization");
            break;
          case project_stages.agreement:
            break;
          case project_stages.postcompletion:
            throw new HttpException(400, "Cannot update stage from finalization to postcompletion");
            break;
        }
      }

      if (currentStage == project_stages.agreement) {
        switch (toStage) {
          case project_stages.creation:
            throw new HttpException(400, "Cannot update stage from agreement to creation");
            break;
          case project_stages.onboarding:
            throw new HttpException(400, "Cannot update stage from agreement to onboarding");
            break;
          case project_stages.verified:
            throw new HttpException(400, "Cannot update stage from agreement to verified");
            break;
          case project_stages.feasibility:
            throw new HttpException(400, "Cannot update stage from agreement to feasibility");
            break;
          case project_stages.diligence:
            throw new HttpException(400, "Cannot update stage from agreement to diligence");
            break;
          case project_stages.bidding:
            throw new HttpException(400, "Cannot update stage from agreement to bidding");
            break;
          case project_stages.finalization:
            throw new HttpException(400, "Cannot update stage from agreement to finalization");
            break;
          case project_stages.agreement:
            throw new HttpException(400, "Cannot update stage from agreement to agreement");
            break;
          case project_stages.postcompletion:
            break;
        }
      }

      if (currentStage == project_stages.postcompletion) {
        switch (toStage) {
          case project_stages.creation:
            throw new HttpException(400, "Cannot update stage from postcompletion to creation");
            break;
          case project_stages.onboarding:
            throw new HttpException(400, "Cannot update stage from postcompletion to onboarding");
            break;
          case project_stages.verified:
            throw new HttpException(400, "Cannot update stage from postcompletion to verified");
            break;
          case project_stages.feasibility:
            throw new HttpException(400, "Cannot update stage from postcompletion to feasibility");
            break;
          case project_stages.diligence:
            throw new HttpException(400, "Cannot update stage from diligence to postcompletion");
            break;
          case project_stages.bidding:
            throw new HttpException(400, "Cannot update stage from postcompletion to bidding");
            break;
          case project_stages.finalization:
            throw new HttpException(400, "Cannot update stage from postcompletion to finalization");
            break;
          case project_stages.agreement:
            throw new HttpException(400, "Cannot update stage from postcompletion to agreement");
            break;
          case project_stages.postcompletion:
            throw new HttpException(400, "Cannot update stage from postcompletion to postcompletion");
            break;
        }
      }
      resolve(true);

    } catch (err) {
      console.log(err);
      reject(err);
    }
  })
}

// console.log();

// short code of above code..........

// const validTransitions: Map<string, Set<string>> = new Map([
//   [project_stages.creation, new Set([project_stages.onboarding])],
//   [project_stages.onboarding, new Set([project_stages.verified])],
//   [project_stages.verified, new Set([project_stages.feasibility])],
//   [project_stages.feasibility, new Set([project_stages.bidding])],
//   [project_stages.bidding, new Set([project_stages.diligence])],
//   [project_stages.diligence, new Set([project_stages.finalization])],
//   [project_stages.finalization, new Set([project_stages.agreement])],
//   [project_stages.agreement, new Set([project_stages.postcompletion])],
// ]);

// export async function checkStageUpdates(currentStage: any, toStage: any) {
//   if (!validTransitions.get(currentStage)?.has(toStage)) {
//     throw new HttpException(400, `Cannot update stage from ${currentStage} to ${toStage}`);
//   }
// }




